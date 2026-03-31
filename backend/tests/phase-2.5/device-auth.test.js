import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import mongoose from 'mongoose';
import Device from '../../src/models/Device.js';
import { loginWithDevice, registerDevice } from '../../src/services/device-auth.service.js';

describe('Phase 2.5: Device Authentication', () => {
  let testDevice;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/kavach_test');
    }
  });

  afterAll(async () => {
    await Device.deleteMany({ deviceId: 'TEST-DEVICE-123' });
    await mongoose.connection.close();
  });

  describe('registerDevice', () => {
    it('should register a new device', async () => {
      const result = await registerDevice({
        deviceId: 'TEST-DEVICE-123',
        deviceName: 'Test Tablet',
        deviceType: 'class_tablet',
        institutionId: new mongoose.Types.ObjectId(),
      });

      expect(result).toHaveProperty('device');
      expect(result).toHaveProperty('registrationToken');
      expect(result.device.deviceId).toBe('TEST-DEVICE-123');
      expect(result.device.deviceType).toBe('class_tablet');

      testDevice = result.device;
    });
  });

  describe('loginWithDevice', () => {
    it('should login with valid device token', async () => {
      // First register a device
      const registration = await registerDevice({
        deviceId: 'TEST-DEVICE-LOGIN',
        deviceName: 'Test Login Device',
        deviceType: 'class_tablet',
        institutionId: new mongoose.Types.ObjectId(),
        classId: new mongoose.Types.ObjectId(),
      });

      const result = await loginWithDevice(registration.registrationToken);

      expect(result).toHaveProperty('device');
      expect(result).toHaveProperty('mode');
      expect(result.mode).toBe('class_device');
    });

    it('should throw error for invalid device token', async () => {
      await expect(loginWithDevice('INVALID-TOKEN')).rejects.toThrow('Invalid device token');
    });
  });
});

