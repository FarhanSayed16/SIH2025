import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fileURLToPath } from 'node:url';
import jwt from 'jsonwebtoken';

const source = path => fileURLToPath(new URL(`../../src/${path}`, import.meta.url));
const User = { findById: jest.fn() };
const Alert = { findById: jest.fn() };
const Drill = { findById: jest.fn() };
const sendSosFanout = jest.fn();
const broadcastUserStatusUpdate = jest.fn();

for (const [name, model] of Object.entries({ User, Alert, Drill })) {
  jest.unstable_mockModule(source(`models/${name}.js`), () => ({ default: model }));
}
jest.unstable_mockModule(source('config/logger.js'), () => ({
  default: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));
jest.unstable_mockModule(source('services/fcm.service.js'), () => ({ sendSosFanout }));
jest.unstable_mockModule(source('services/crisisAlert.service.js'), () => ({ broadcastUserStatusUpdate }));
const { initializeSocket } = await import('../../src/socket/socketHandler.js');

const USER = '507f1f77bcf86cd799439011';
const OTHER = '507f1f77bcf86cd799439012';
const SCHOOL = '507f1f77bcf86cd799439021';
const FOREIGN = '507f1f77bcf86cd799439022';
const sockets = [];

function document(overrides = {}) {
  return {
    _id: USER, name: 'Real Student', email: 'student@example.test',
    role: 'student', institutionId: SCHOOL, approvalStatus: 'approved',
    isActive: true, tokenVersion: 0, ...overrides,
    toJSON() { return { ...this }; },
  };
}

function query(value) {
  const result = Promise.resolve(value);
  result.select = () => result;
  return result;
}

// Fake transport runs the actual registered handshake, packet middleware and handlers.
function harness(account = document(), claims = {}, expiresIn = '15m') {
  const ioHandlers = new Map();
  const eventHandlers = new Map();
  const packetMiddleware = [];
  const broadcast = jest.fn();
  const io = {
    use: jest.fn(),
    on: (event, handler) => ioHandlers.set(event, handler),
    to: room => ({ emit: (event, payload) => broadcast(room, event, payload) }),
  };
  const socket = {
    id: 'test-socket',
    handshake: { auth: { token: jwt.sign({ userId: USER, role: 'admin', tokenVersion: 0, ...claims }, process.env.JWT_SECRET, { expiresIn }) }, query: {} },
    emit: jest.fn(), join: jest.fn().mockResolvedValue(undefined), leave: jest.fn(),
    on(event, handler) {
      const handlers = eventHandlers.get(event) || [];
      handlers.push(handler);
      eventHandlers.set(event, handlers);
    },
    use: middleware => packetMiddleware.push(middleware),
  };
  socket.disconnect = jest.fn(() => {
    for (const handler of eventHandlers.get('disconnect') || []) handler('test disconnect');
  });
  sockets.push(socket);
  User.findById.mockImplementation(() => query(account));
  initializeSocket(io);
  const authenticate = io.use.mock.calls[0][0];
  return {
    socket, account, broadcast, authenticate,
    async connect() {
      const next = jest.fn();
      await authenticate(socket, next);
      expect(next).toHaveBeenCalledWith();
      await ioHandlers.get('connection')(socket);
    },
    async receive(event, payload) {
      for (const middleware of packetMiddleware) {
        const next = jest.fn();
        await middleware([event, payload], next);
        if (next.mock.calls[0]?.[0]) return next.mock.calls[0][0];
      }
      for (const handler of eventHandlers.get(event) || []) await handler(payload);
      return undefined;
    },
  };
}

beforeEach(() => jest.resetAllMocks());
afterEach(() => {
  for (const socket of sockets.splice(0)) socket.disconnect(true);
  jest.useRealTimers();
});

describe('Socket authorization regressions', () => {
  it.each([{ isActive: false }, { tokenVersion: 1 }, { approvalStatus: 'rejected' }])('rejects ineligible or revoked handshake: %j', async overrides => {
    const test = harness(document(overrides));
    const next = jest.fn();
    await test.authenticate(test.socket, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(test.socket.join).not.toHaveBeenCalled();
  });

  it('rejects refresh tokens during socket authentication', async () => {
    const test = harness(document(), { type: 'refresh' });
    const next = jest.fn();
    await test.authenticate(test.socket, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(User.findById).not.toHaveBeenCalled();
  });

  it('automatically joins only the approved school and personal session room', async () => {
    const test = harness();
    await test.connect();
    expect(test.socket.join.mock.calls).toEqual([[`user:${USER}`], [`school:${SCHOOL}`]]);
    expect(test.socket.userRole).toBe('student');
  });

  it('registered users cannot join their claimed school or send SOS', async () => {
    const test = harness(document({ approvalStatus: 'registered' }));
    await test.connect();
    expect(test.socket.join.mock.calls).toEqual([[`user:${USER}`]]);
    await test.receive('JOIN_ROOM', { schoolId: SCHOOL });
    await test.receive('SOS_ALERT', {});
    expect(test.socket.join.mock.calls).toEqual([[`user:${USER}`]]);
    expect(test.broadcast).not.toHaveBeenCalled();
    expect(sendSosFanout).not.toHaveBeenCalled();
  });

  it.each(['JOIN_ROOM', 'join_room'])('cannot join a foreign school via %s', async event => {
    const test = harness();
    await test.connect();
    test.socket.join.mockClear();
    await test.receive(event, { schoolId: FOREIGN });
    expect(test.socket.join).not.toHaveBeenCalled();
    expect(test.socket.emit).toHaveBeenCalledWith('ERROR', expect.any(Object));
  });

  it.each([
    ['SOS_ALERT', { institutionId: FOREIGN }], ['SOS_ALERT', { userId: OTHER }],
    ['SOS_SAFE', { institutionId: FOREIGN }], ['SOS_SAFE', { userId: OTHER }],
  ])('A10 rejects spoofed %s identity %j without broadcasting or notifying', async (event, payload) => {
    const test = harness();
    await test.connect();
    await test.receive(event, payload);
    expect(test.broadcast).not.toHaveBeenCalled();
    expect(sendSosFanout).not.toHaveBeenCalled();
    expect(test.socket.emit).toHaveBeenCalledWith('ERROR', expect.any(Object));
  });

  it.each([['SOS_ALERT', 'danger'], ['SOS_SAFE', 'safe']])('A10 derives %s identity, role and timestamp from authenticated state', async (event, status) => {
    const test = harness();
    await test.connect();
    const before = Date.now();
    await test.receive(event, { institutionId: SCHOOL, userId: USER, userName: 'Forged', role: 'admin', timestamp: '1900-01-01', location: { lat: 20, lng: 70 } });
    expect(test.broadcast).toHaveBeenCalledTimes(1);
    const [room, emittedEvent, payload] = test.broadcast.mock.calls[0];
    expect(room).toBe(`school:${SCHOOL}`);
    expect(emittedEvent).toBe(event);
    expect(payload).toMatchObject({ userId: USER, userName: 'Real Student', role: 'student', institutionId: SCHOOL });
    expect(Date.parse(payload.timestamp)).toBeGreaterThanOrEqual(before);
    expect(Date.parse(payload.timestamp)).toBeLessThanOrEqual(Date.now());
    expect(sendSosFanout).toHaveBeenCalledWith({ studentId: USER, studentName: 'Real Student', status, institutionId: SCHOOL });
  });

  it('rejects cross-school DRILL_ACK before persistence', async () => {
    const acknowledgeDrill = jest.fn();
    Drill.findById.mockResolvedValue({ institutionId: FOREIGN, acknowledgeDrill });
    const test = harness();
    await test.connect();
    await test.receive('DRILL_ACK', { drillId: 'foreign-drill' });
    expect(acknowledgeDrill).not.toHaveBeenCalled();
    expect(test.broadcast).not.toHaveBeenCalled();
    expect(test.socket.emit).toHaveBeenCalledWith('ERROR', expect.objectContaining({ message: 'Access denied to drill' }));
  });

  it.each(['USER_SAFE', 'USER_HELP'])('rejects cross-school %s before mutation or notification', async event => {
    const updateStudentStatus = jest.fn();
    Alert.findById.mockResolvedValue({ institutionId: FOREIGN, updateStudentStatus });
    const test = harness();
    await test.connect();
    await test.receive(event, { alertId: 'foreign-alert', location: { lat: 20, lng: 70 } });
    expect(updateStudentStatus).not.toHaveBeenCalled();
    expect(broadcastUserStatusUpdate).not.toHaveBeenCalled();
    expect(test.socket.emit).toHaveBeenCalledWith('ERROR', expect.objectContaining({ message: 'Access denied to alert' }));
  });

  it('preserves own-school drill acknowledgments', async () => {
    const acknowledgeDrill = jest.fn().mockResolvedValue(undefined);
    Drill.findById.mockResolvedValue({ institutionId: SCHOOL, acknowledgeDrill });
    const test = harness();
    await test.connect();
    await test.receive('DRILL_ACK', { drillId: 'own-drill' });
    expect(acknowledgeDrill).toHaveBeenCalledWith(USER);
    expect(test.broadcast).toHaveBeenCalledWith(`school:${SCHOOL}`, 'DRILL_ACK_RECEIVED', expect.objectContaining({ userId: USER }));
  });

  it.each(['USER_SAFE', 'USER_HELP'])('preserves authenticated own-school %s', async event => {
    const updateStudentStatus = jest.fn().mockResolvedValue(undefined);
    Alert.findById.mockResolvedValue({ institutionId: SCHOOL, updateStudentStatus });
    const test = harness();
    await test.connect();
    const location = { lat: 20, lng: 70 };
    await test.receive(event, { alertId: 'own-alert', location });
    expect(updateStudentStatus).toHaveBeenCalledWith(USER, event === 'USER_SAFE' ? 'safe' : 'at_risk', location);
    expect(broadcastUserStatusUpdate).toHaveBeenCalledTimes(1);
  });

  it.each([{ tokenVersion: 1 }, { isActive: false }, { institutionId: FOREIGN }, { role: 'teacher' }, { approvalStatus: 'registered' }])('disconnects and suppresses a revoked packet: %j', async change => {
    const test = harness();
    await test.connect();
    Object.assign(test.account, change);
    const error = await test.receive('SOS_ALERT', {});
    expect(error).toBeInstanceOf(Error);
    expect(test.socket.disconnect).toHaveBeenCalledWith(true);
    expect(test.broadcast).not.toHaveBeenCalled();
    expect(sendSosFanout).not.toHaveBeenCalled();
  });

  it('disconnects an idle socket when its existing access token expires', async () => {
    jest.useFakeTimers({ now: new Date('2030-01-01T00:00:00Z') });
    const test = harness(document(), {}, 2);
    await test.connect();
    jest.advanceTimersByTime(1999);
    expect(test.socket.disconnect).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1);
    expect(test.socket.disconnect).toHaveBeenCalledWith(true);
  });

  it('registered users cannot bypass SOS checks through legacy safety updates', async () => {
    const updateSafetyStatus = jest.fn();
    const test = harness(document({ approvalStatus: 'registered', updateSafetyStatus }));
    await test.connect();
    await test.receive('SAFETY_STATUS_UPDATE', { status: 'safe' });
    expect(updateSafetyStatus).not.toHaveBeenCalled();
    expect(test.broadcast).not.toHaveBeenCalled();
  });
});
