import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fileURLToPath } from 'node:url';

const source = path => fileURLToPath(new URL(`../../src/${path}`, import.meta.url));

// Exercise real authorization/controllers with persistence and external effects isolated.
const User = { findOne: jest.fn(), findById: jest.fn(), create: jest.fn(), findByIdAndUpdate: jest.fn() };
const Class = { findOne: jest.fn(), findById: jest.fn() };
const Device = { create: jest.fn() };
const Alert = { findById: jest.fn() };
const SyncQueue = { findOne: jest.fn(), updateOne: jest.fn() };
const JoinRequest = { create: jest.fn() };
const processSensorTelemetry = jest.fn();
const syncOfflineData = jest.fn();
const invalidateCache = jest.fn();

for (const [name, model] of Object.entries({ User, Class, Device, Alert, SyncQueue, ClassroomJoinRequest: JoinRequest })) {
  jest.unstable_mockModule(source(`models/${name}.js`), () => ({ default: model }));
}
jest.unstable_mockModule(source('config/logger.js'), () => ({
  default: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));
jest.unstable_mockModule(source('middleware/cache.middleware.js'), () => ({ invalidateCache }));
jest.unstable_mockModule(source('services/sync.service.js'), () => ({ syncOfflineData }));
jest.unstable_mockModule(source('services/iotDeviceMonitoring.service.js'), () => ({
  processSensorTelemetry, getDeviceHealthMonitoring: jest.fn(), getHistoricalSensorData: jest.fn(),
}));

const auth = await import('../../src/services/auth.service.js');
const { register } = await import('../../src/controllers/auth.controller.js');
const { updateUser } = await import('../../src/controllers/user.controller.js');
const { authenticate, optionalAuth } = await import('../../src/middleware/auth.middleware.js');
const { requireAdmin, requireTeacher } = await import('../../src/middleware/rbac.middleware.js');
const { register: registerDevice } = await import('../../src/controllers/device-auth.controller.js');
const { processTelemetry } = await import('../../src/controllers/iotDevice.controller.js');
const { authorizeAlert } = await import('../../src/middleware/alertAccess.middleware.js');
const { resolveConflict } = await import('../../src/services/syncQueue.service.js');
const { setSocketIO } = await import('../../src/config/socket.js');

const USER = '507f1f77bcf86cd799439011';
const OTHER = '507f1f77bcf86cd799439012';
const SCHOOL = '507f1f77bcf86cd799439021';
const FOREIGN = '507f1f77bcf86cd799439022';
const ALERT = '507f1f77bcf86cd799439031';
const CLASS = '507f1f77bcf86cd799439041';
const QUEUE = '507f1f77bcf86cd799439051';

function response() {
  const res = { status: jest.fn(), json: jest.fn() };
  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);
  return res;
}

function query(value) {
  const result = Promise.resolve(value);
  result.populate = jest.fn(() => result);
  result.select = jest.fn(() => result);
  return result;
}

function user(overrides = {}) {
  return {
    _id: USER, role: 'student', approvalStatus: 'approved', institutionId: SCHOOL,
    tokenVersion: 0, isActive: true, ...overrides,
  };
}

function request(actor = user(), body = {}, params = {}) {
  return { user: actor, userId: USER, userRole: actor.role, body, params, headers: {}, query: {} };
}

beforeEach(() => {
  jest.resetAllMocks();
  setSocketIO(null);
});

describe('Audit security regressions', () => {
  it.each(['admin', 'system_admin', 'SYSTEM_ADMIN'])('A01 rejects public %s before persisting an account', async role => {
    await expect(auth.registerUser({ role })).rejects.toThrow('cannot be registered publicly');
    expect(User.create).not.toHaveBeenCalled();
    expect(User.findOne).not.toHaveBeenCalled();
  });

  it.each([
    ['student', 'approved', requireAdmin],
    ['admin', 'registered', requireAdmin],
    ['teacher', 'registered', requireTeacher],
  ])('A01/A04 rejects privileged access for %s/%s', (role, approvalStatus, gate) => {
    const next = jest.fn();
    const res = response();
    gate(request(user({ role, approvalStatus })), res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it.each(['institutionId', 'classId', 'isActive', 'role', 'tokenVersion', 'refreshToken'])('A02 rejects self-edit of %s without writing', async field => {
    User.findById.mockReturnValue(query(user()));
    const res = response();
    await updateUser(request(user(), { [field]: FOREIGN }, { id: USER }), res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  it('A02 keeps ordinary own-profile edits working', async () => {
    User.findById.mockReturnValue(query(user()));
    User.findByIdAndUpdate.mockReturnValue(query(user({ name: 'Updated' })));
    const res = response();
    await updateUser(request(user(), { name: 'Updated' }, { id: USER }), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(User.findByIdAndUpdate).toHaveBeenCalledWith(USER, { $set: { name: 'Updated' } }, expect.objectContaining({ runValidators: true }));
  });

  it.each([{ isActive: false }, { tokenVersion: 1 }, { approvalStatus: 'rejected' }])('A03/A12 rejects stale or ineligible sessions: %j', async overrides => {
    User.findById.mockReturnValue(query(user(overrides)));
    const req = request();
    req.headers.authorization = `Bearer ${auth.generateAccessToken(USER, 'student', 0)}`;
    const res = response();
    const next = jest.fn();
    await authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('A03 optional authentication never attaches a deactivated identity', async () => {
    User.findById.mockReturnValue(query(user({ isActive: false })));
    const req = { headers: { authorization: `Bearer ${auth.generateAccessToken(USER, 'student')}` } };
    const next = jest.fn();
    await optionalAuth(req, response(), next);
    expect(req.user).toBeUndefined();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('A03 accepts an active session and uses the current database role', async () => {
    User.findById.mockReturnValue(query(user({ role: 'teacher' })));
    const req = { headers: { authorization: `Bearer ${auth.generateAccessToken(USER, 'student')}` } };
    const next = jest.fn();
    await authenticate(req, response(), next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(req.userRole).toBe('teacher');
  });

  it('A04 rejects foreign-school device provisioning before creating credentials', async () => {
    const res = response();
    await registerDevice(request(user({ role: 'admin' }), {
      deviceId: 'ESP32-01', deviceName: 'Sensor', deviceType: 'esp32', institutionId: FOREIGN,
    }), res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(Device.create).not.toHaveBeenCalled();
  });

  it('A04/A07 provisions an own-school sensor with the ingestion credential', async () => {
    Device.create.mockImplementation(async fields => ({ ...fields, toJSON: () => ({ deviceId: fields.deviceId }) }));
    const req = request(user({ role: 'admin' }), {
      deviceId: 'ESP32-01', deviceName: 'Sensor', deviceType: 'esp32', institutionId: SCHOOL,
    });
    const next = jest.fn();
    requireAdmin(req, response(), next);
    expect(next).toHaveBeenCalledTimes(1);
    const res = response();
    await registerDevice(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    const payload = res.json.mock.calls[0][0].data;
    expect(payload.deviceToken).toMatch(/^[a-f0-9]{64}$/);
    expect(Device.create.mock.calls[0][0].deviceToken).toBe(payload.deviceToken);
  });

  it('A06 rejects telemetry for a device different from the authenticated credential', async () => {
    const req = request(user(), { readings: { temperature: 50 } }, { deviceId: 'ESP32-B' });
    req.device = { deviceId: 'ESP32-A' };
    const res = response();
    await processTelemetry(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(processSensorTelemetry).not.toHaveBeenCalled();
  });

  it('A06 preserves valid telemetry processing', async () => {
    const req = request(user(), { readings: { temperature: 20 } }, { deviceId: 'ESP32-A' });
    req.device = { deviceId: 'ESP32-A' };
    req.app = { get: () => null };
    processSensorTelemetry.mockResolvedValue({ alertCreated: null });
    const res = response();
    await processTelemetry(req, res);
    expect(processSensorTelemetry).toHaveBeenCalledWith('ESP32-A', req.body);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it.each(['student', 'teacher', 'admin'])('A09 blocks %s from foreign alerts before downstream reads/writes', async role => {
    Alert.findById.mockResolvedValue({ institutionId: FOREIGN });
    const next = jest.fn();
    const res = response();
    await authorizeAlert(request(user({ role })), res, next, ALERT);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('A09 blocks students updating another user even within their school', async () => {
    Alert.findById.mockResolvedValue({ institutionId: SCHOOL });
    const next = jest.fn();
    const res = response();
    await authorizeAlert(request(user(), { userId: OTHER }), res, next, ALERT);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('A09 permits approved staff to update another user in the alert school', async () => {
    Alert.findById.mockResolvedValue({ institutionId: SCHOOL });
    User.findById.mockReturnValue(query(user({ _id: OTHER })));
    const next = jest.fn();
    await authorizeAlert(request(user({ role: 'teacher' }), { userId: OTHER }), response(), next, ALERT);
    expect(next).toHaveBeenCalledWith();
  });

  it('A09 rejects a staff status update targeting a foreign-school user', async () => {
    Alert.findById.mockResolvedValue({ institutionId: SCHOOL });
    User.findById.mockReturnValue(query(user({ _id: OTHER, institutionId: FOREIGN })));
    const next = jest.fn();
    const res = response();
    await authorizeAlert(request(user({ role: 'teacher' }), { userId: OTHER }), res, next, ALERT);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('A11 cannot resolve a different user\'s queue item', async () => {
    SyncQueue.findOne.mockImplementation(async filter => filter.userId === OTHER ? { status: 'conflict' } : null);
    await expect(resolveConflict(QUEUE, 'server-wins', null, USER)).rejects.toThrow('Queue item not found');
    expect(SyncQueue.findOne).toHaveBeenCalledWith({ _id: QUEUE, userId: USER });
    expect(SyncQueue.updateOne).not.toHaveBeenCalled();
    expect(syncOfflineData).not.toHaveBeenCalled();
  });

  it('A11 still resolves the owner\'s conflict', async () => {
    SyncQueue.findOne.mockResolvedValue({ status: 'conflict', payload: { score: 1 }, conflictData: { serverData: { score: 2 } } });
    SyncQueue.updateOne.mockResolvedValue({ modifiedCount: 1 });
    await expect(resolveConflict(QUEUE, 'server-wins', null, USER)).resolves.toEqual(expect.objectContaining({ success: true }));
    expect(SyncQueue.updateOne).toHaveBeenCalledTimes(1);
  });

  it('A12 password reset revokes refresh/access versions and disconnects idle sockets after saving', async () => {
    const account = user({ email: 'student@example.test', refreshToken: 'old-refresh', tokenVersion: 2, save: jest.fn().mockResolvedValue(undefined) });
    User.findOne.mockResolvedValue(account);
    const disconnectSockets = jest.fn();
    const inRoom = jest.fn(() => ({ disconnectSockets }));
    setSocketIO({ in: inRoom });
    await auth.resetPassword('valid-reset-token', 'new-password');
    expect(account.refreshToken).toBeNull();
    expect(account.tokenVersion).toBe(3);
    expect(account.resetPasswordToken).toBeNull();
    expect(account.save).toHaveBeenCalledTimes(1);
    expect(inRoom).toHaveBeenCalledWith(`user:${USER}`);
    expect(disconnectSockets).toHaveBeenCalledWith(true);
    expect(account.save.mock.invocationCallOrder[0]).toBeLessThan(disconnectSockets.mock.invocationCallOrder[0]);
  });

  it('A18 registration controller passes classCode through to verified class membership', async () => {
    User.findOne.mockResolvedValue(null);
    const classroom = { _id: CLASS, institutionId: SCHOOL, teacherId: OTHER, classCode: 'CLASS-123', grade: 7, section: 'A', addStudent: jest.fn().mockResolvedValue(undefined) };
    Class.findOne.mockResolvedValue(classroom);
    User.create.mockImplementation(async fields => ({ ...fields, _id: USER, save: jest.fn().mockResolvedValue(undefined), toJSON: () => ({ _id: USER, classId: fields.classId }) }));
    JoinRequest.create.mockResolvedValue({});
    const res = response();
    await register({ body: { name: 'Student', email: 'student@example.test', password: 'password123', role: 'student', phone: '9876543210', classCode: 'CLASS-123' } }, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(Class.findOne).toHaveBeenCalledWith({ classCode: 'CLASS-123', isActive: true });
    expect(User.create).toHaveBeenCalledWith(expect.objectContaining({ classId: CLASS, institutionId: SCHOOL, approvalStatus: 'registered' }));
    expect(JoinRequest.create).toHaveBeenCalledWith(expect.objectContaining({ studentId: USER, classId: CLASS, status: 'pending' }));
  });
});
