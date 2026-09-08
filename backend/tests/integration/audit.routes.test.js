import { beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../src/server.js';
import User from '../../src/models/User.js';
import School from '../../src/models/School.js';
import Device from '../../src/models/Device.js';
import Alert from '../../src/models/Alert.js';
import { generateAccessToken } from '../../src/services/auth.service.js';

let school, otherSchool, admin, teacher, student;
const token = user => generateAccessToken(String(user._id), user.role, user.tokenVersion);
const auth = user => ({ Authorization: `Bearer ${token(user)}` });
beforeEach(async () => {
  await Promise.all([User.deleteMany({}), School.deleteMany({}), Device.deleteMany({}), Alert.deleteMany({})]);
  [school, otherSchool] = await School.create(['A', 'B'].map(name => ({ name, address: 'Test school', location: { type: 'Point', coordinates: [75, 30] } })));
  [admin, teacher, student] = await User.create(['admin', 'teacher', 'student'].map((role, i) => ({
    role, name: role, email: `${role}@example.com`, phone: `987654321${i}`, password: 'Test123!@#',
    userType: 'account_user', approvalStatus: 'approved', institutionId: school._id,
  })));
});

describe('Audit route wiring and persistence', () => {
  it('blocks operators before auth routers and rejects public admin registration', async () => {
    await request(app).post('/api/auth/login').send({ email: { $ne: null }, password: 'Test123!@#' }).expect(400);
    await request(app).post('/api/auth/register').send({ email: 'attacker@example.com', name: 'Attacker', role: 'admin', phone: '9123456789', password: 'Test123!@#' }).expect(400);
    expect(await User.countDocuments({ email: 'attacker@example.com' })).toBe(0);
  });
  it('blocks profile escalation and preserves normal self edits', async () => {
    await request(app).put(`/api/users/${student._id}`).set(auth(student)).send({ role: 'admin' }).expect(403);
    await request(app).put(`/api/users/${student._id}`).set(auth(student)).send({ name: 'Updated Student' }).expect(200);
    const stored = await User.findById(student._id);
    expect(stored.role).toBe('student');
    expect(stored.name).toBe('Updated Student');
  });
  it('provisions two sensors without null-token collisions and hides credentials in lists/details', async () => {
    for (const deviceId of ['sensor-a', 'aaaaaaaaaaaaaaaaaaaaaaaa']) {
      const response = await request(app).post('/api/devices/register').set(auth(admin)).send({
        deviceId, deviceName: 'Sensor', deviceType: 'multi-sensor', institutionId: String(school._id),
      }).expect(201);
      expect(response.body.data.deviceToken).toBeTruthy();
      expect(response.body.data.registrationToken).toBeTruthy();
    }
    const detail = await request(app).get('/api/devices/aaaaaaaaaaaaaaaaaaaaaaaa').set(auth(teacher)).expect(200);
    expect(detail.body.data.deviceId).toBe('aaaaaaaaaaaaaaaaaaaaaaaa');
    expect(JSON.stringify(detail.body)).not.toMatch(/registrationToken|deviceToken/);
    const list = await request(app).get('/api/devices').set(auth(teacher)).expect(200);
    expect(JSON.stringify(list.body)).not.toMatch(/registrationToken|deviceToken/);
    await request(app).get('/api/devices').set(auth(student)).expect(403);
    await request(app).get(`/api/devices?institutionId=${otherSchool._id}`).set(auth(teacher)).expect(403);
    await request(app).post('/api/devices/register').set(auth(student)).send({}).expect(403);
    await request(app).put('/api/devices/sensor-a').set(auth(teacher)).send({ deviceName: 'Changed' }).expect(403);
    await request(app).put('/api/devices/aaaaaaaaaaaaaaaaaaaaaaaa').set(auth(admin)).send({ deviceName: 'Changed' }).expect(200);
  });
  it('denies alert reads/status writes outside the school and unapproved teacher alerts', async () => {
    const alert = await Alert.create({ institutionId: otherSchool._id, type: 'fire', severity: 'high', title: 'Test', triggeredBy: admin._id });
    await request(app).get(`/api/alerts/${alert._id}`).set(auth(teacher)).expect(403);
    await request(app).put(`/api/alerts/${alert._id}/student-status`).set(auth(teacher)).send({ userId: String(student._id), status: 'safe' }).expect(403);
    teacher.approvalStatus = 'registered'; await teacher.save();
    await request(app).post('/api/alerts/teacher').set(auth(teacher)).send({ type: 'fire' }).expect(403);
  });
  it('blocks disabled accounts with existing access tokens', async () => {
    const headers = auth(student);
    await User.updateOne({ _id: student._id }, { $set: { isActive: false } });
    await request(app).get('/api/auth/profile').set(headers).expect(401);
  });
  it('keeps unsupported evacuation routes unavailable without generated waypoints', async () => {
    await request(app).post('/api/ar/trigger-path').set(auth(admin)).send({ schoolId: String(school._id), waypoints: [{ x: 1, y: 2 }] }).expect(503);
  });
});
