import { beforeEach, describe, expect, it } from '@jest/globals';
import mongoose from 'mongoose';
import School from '../../src/models/School.js';
import User from '../../src/models/User.js';
import Alert from '../../src/models/Alert.js';
import { getMeshKey, syncMeshMessages } from '../../src/services/mesh.service.js';

// These checks exercise MongoDB's actual atomic aggregation update against the
// isolated replica set supplied by the normal backend test runner.
let school;
let foreignSchool;
let actor;
let other;
let alert;
let timestamp;

async function createSchool(name, fields = {}) {
  return School.create({ name, address: 'Test address', location: { type: 'Point', coordinates: [73, 19] }, ...fields });
}

function message(overrides = {}) {
  return {
    msgId: 'status-1', schoolId: school.id, type: 'USER_STATUS_UPDATE', timestamp,
    payload: { userId: actor.id, alertId: alert.id, status: 'help' }, ...overrides,
  };
}

async function statuses() {
  return (await Alert.findById(alert.id).lean()).studentStatus;
}

beforeEach(async () => {
  await Promise.all([School.deleteMany({}), User.deleteMany({}), Alert.deleteMany({})]);
  [school, foreignSchool] = await Promise.all([createSchool('School A'), createSchool('School B')]);
  [actor, other] = await User.create([
    { name: 'Student A', email: 'a@example.test', userType: 'roster_record', role: 'student', institutionId: school._id, rollNo: '1', approvalStatus: 'approved' },
    { name: 'Student B', email: 'b@example.test', userType: 'roster_record', role: 'student', institutionId: school._id, rollNo: '2', approvalStatus: 'approved' },
  ]);
  timestamp = Date.now() - 10000;
  alert = await Alert.create({ institutionId: school._id, type: 'fire', title: 'Test alert', createdAt: new Date(timestamp - 1000) });
});

describe('A15 mesh durable status processing', () => {
  it('acknowledges only after status is persisted, and concurrent retries create one entry', async () => {
    const results = await Promise.all(Array.from({ length: 8 }, () => syncMeshMessages(actor.id, [message()], school.id)));
    for (const result of results) {
      expect(result.acknowledgedIds).toEqual(['status-1']);
      expect(result.failed).toBe(0);
    }
    const saved = await statuses();
    expect(saved).toHaveLength(1);
    expect(saved[0].userId.toString()).toBe(actor.id);
    expect(saved[0].status).toBe('help');
    expect(saved[0].lastUpdate.getTime()).toBe(timestamp);
  });

  it('replay and older arrivals never overwrite a newer status', async () => {
    await syncMeshMessages(actor.id, [message()], school.id);
    const newer = message({ msgId: 'status-2', timestamp: timestamp + 100, payload: { ...message().payload, status: 'safe' } });
    await syncMeshMessages(actor.id, [newer], school.id);
    const replay = await syncMeshMessages(actor.id, [message(), message({ msgId: 'older', timestamp: timestamp - 100 })], school.id);
    expect(replay.acknowledgedIds).toEqual(['status-1', 'older']);
    const saved = await statuses();
    expect(saved).toHaveLength(1);
    expect(saved[0].status).toBe('safe');
    expect(saved[0].lastUpdate.getTime()).toBe(timestamp + 100);
  });

  it('concurrent differing timestamps converge to the newest status', async () => {
    await Promise.all([
      syncMeshMessages(actor.id, [message({ msgId: 'new', timestamp: timestamp + 100, payload: { ...message().payload, status: 'safe' } })], school.id),
      syncMeshMessages(actor.id, [message()], school.id),
    ]);
    expect((await statuses()).map(entry => entry.status)).toEqual(['safe']);
  });

  it('rejects a caller selecting another tenant', async () => {
    await expect(syncMeshMessages(actor.id, [message()], foreignSchool.id)).rejects.toThrow('School access denied');
    expect(await statuses()).toHaveLength(0);
  });

  it('rejects pending membership despite a matching institution', async () => {
    await User.updateOne({ _id: actor._id }, { approvalStatus: 'registered' });
    await expect(syncMeshMessages(actor.id, [message()], school.id)).rejects.toThrow('School access denied');
    expect(await statuses()).toHaveLength(0);
  });

  it.each(['message-school', 'alert-school', 'other-user'])('rejects spoofing %s without applying status', async kind => {
    let incoming = message();
    if (kind === 'message-school') incoming.schoolId = foreignSchool.id;
    if (kind === 'alert-school') await Alert.updateOne({ _id: alert._id }, { institutionId: foreignSchool._id });
    if (kind === 'other-user') incoming.payload.userId = other.id;
    const result = await syncMeshMessages(actor.id, [incoming], school.id);
    expect(result).toMatchObject({ synced: 0, failed: 1, acknowledgedIds: [] });
    expect(await statuses()).toHaveLength(0);
  });

  it('permits approved staff updating another user in the same school', async () => {
    await User.updateOne({ _id: actor._id }, { role: 'teacher' });
    const result = await syncMeshMessages(actor.id, [message({ payload: { ...message().payload, userId: other.id } })], school.id);
    expect(result).toMatchObject({ synced: 1, failed: 0, acknowledgedIds: ['status-1'] });
    expect((await statuses())[0].userId.toString()).toBe(other.id);
  });

  it('staff cannot change a user belonging to another institution', async () => {
    await User.updateOne({ _id: actor._id }, { role: 'teacher' });
    await User.updateOne({ _id: other._id }, { institutionId: foreignSchool._id });
    const result = await syncMeshMessages(actor.id, [message({ payload: { ...message().payload, userId: other.id } })], school.id);
    expect(result).toMatchObject({ synced: 0, failed: 1, acknowledgedIds: [] });
    expect(await statuses()).toHaveLength(0);
  });

  it('mixed batches acknowledge the valid ID and leave unknown events/encryption retryable', async () => {
    const result = await syncMeshMessages(actor.id, [
      message(), message(), message({ msgId: 'unknown', type: 'UNSUPPORTED' }),
      message({ msgId: 'encrypted', encrypted: true }),
    ], school.id);
    expect(result).toMatchObject({ synced: 1, duplicates: 1, failed: 2, acknowledgedIds: ['status-1'] });
    expect(result.errors.map(error => error.msgId)).toEqual(['unknown', 'encrypted']);
    expect(await statuses()).toHaveLength(1);
  });

  it.each(['id', 'user', 'alert', 'status', 'timestamp', 'future', 'predates', 'school'])('malformed %s never receives an acknowledgment', async field => {
    const incoming = message();
    if (field === 'id') incoming.msgId = '';
    if (field === 'user') incoming.payload.userId = 'invalid';
    if (field === 'alert') incoming.payload.alertId = 'invalid';
    if (field === 'status') incoming.payload.status = 'invalid';
    if (field === 'timestamp') incoming.timestamp = 'not-a-number';
    if (field === 'future') incoming.timestamp = Date.now() + 60000;
    if (field === 'predates') incoming.timestamp = timestamp - 5000;
    if (field === 'school') incoming.schoolId = {};
    const result = await syncMeshMessages(actor.id, [incoming], school.id);
    expect(result).toMatchObject({ synced: 0, failed: 1, acknowledgedIds: [] });
    expect(await statuses()).toHaveLength(0);
  });
});

describe('Mesh key provisioning', () => {
  it('concurrent first provisioning returns one persisted key and expiry', async () => {
    const results = await Promise.all(Array.from({ length: 10 }, () => getMeshKey(school.id, { includeExpiry: true })));
    expect(new Set(results.map(result => result.key)).size).toBe(1);
    const persisted = await School.findById(school.id).select('+meshKey +meshKeyExpiresAt');
    for (const result of results) {
      expect(result.key).toBe(persisted.meshKey);
      expect(Buffer.from(result.key, 'base64')).toHaveLength(64);
      expect(result.expiresAt.getTime()).toBe(persisted.meshKeyExpiresAt.getTime());
    }
  });

  it('returns the existing true expiry instead of extending validity on retrieval', async () => {
    const key = Buffer.alloc(64, 7).toString('base64');
    const expiresAt = new Date(Date.now() + 30000);
    await School.updateOne({ _id: school._id }, { meshKey: key, meshKeyExpiresAt: expiresAt });
    const result = await getMeshKey(school.id, { includeExpiry: true });
    expect(result.key).toBe(key);
    expect(result.expiresAt.getTime()).toBe(expiresAt.getTime());
    expect((await getMeshKey(school.id, { includeExpiry: true })).expiresAt.getTime()).toBe(expiresAt.getTime());
  });

  it('replaces expired keys and refuses nonexistent schools', async () => {
    const expiredKey = Buffer.alloc(64, 8).toString('base64');
    await School.updateOne({ _id: school._id }, { meshKey: expiredKey, meshKeyExpiresAt: new Date(Date.now() - 1000) });
    const result = await getMeshKey(school.id, { includeExpiry: true });
    expect(result.key).not.toBe(expiredKey);
    expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now());
    await expect(getMeshKey(new mongoose.Types.ObjectId().toString())).rejects.toThrow('School not found');
  });
});
