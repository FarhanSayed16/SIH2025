import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import mongoose from 'mongoose';
import User from '../../src/models/User.js';
import Class from '../../src/models/Class.js';
import { loginWithQR, verifyQRCode } from '../../src/services/qr-auth.service.js';

describe('Phase 2.5: QR Authentication', () => {
  let testUser;
  let testClass;

  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/kavach_test');
    }

    // Create test class
    testClass = await Class.create({
      institutionId: new mongoose.Types.ObjectId(),
      grade: '5',
      section: 'A',
      classCode: 'TEST-5-A',
      teacherId: new mongoose.Types.ObjectId(),
    });

    // Create test student with QR code
    testUser = await User.create({
      email: 'test.student@test.com',
      password: 'test123',
      name: 'Test Student',
      role: 'student',
      grade: '5',
      section: 'A',
      classId: testClass._id,
      institutionId: testClass.institutionId,
      qrCode: 'TEST-QR-CODE-12345',
      qrBadgeId: 'KAVACH-5-A-12345',
      accessLevel: 'teacher_led',
      canUseApp: false,
      requiresTeacherAuth: true,
    });
  });

  afterAll(async () => {
    await User.deleteMany({ email: 'test.student@test.com' });
    await Class.deleteMany({ classCode: 'TEST-5-A' });
    await mongoose.connection.close();
  });

  describe('loginWithQR', () => {
    it('should login user with valid QR code', async () => {
      const result = await loginWithQR('TEST-QR-CODE-12345');

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe('test.student@test.com');
    });

    it('should throw error for invalid QR code', async () => {
      await expect(loginWithQR('INVALID-QR-CODE')).rejects.toThrow('Invalid QR code');
    });
  });

  describe('verifyQRCode', () => {
    it('should verify QR code and return student info', async () => {
      const result = await verifyQRCode('TEST-QR-CODE-12345');

      expect(result).toHaveProperty('studentId');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('grade');
      expect(result).toHaveProperty('section');
      expect(result.name).toBe('Test Student');
      expect(result.grade).toBe('5');
    });

    it('should throw error for invalid QR code', async () => {
      await expect(verifyQRCode('INVALID-QR-CODE')).rejects.toThrow('Invalid QR code');
    });
  });
});

