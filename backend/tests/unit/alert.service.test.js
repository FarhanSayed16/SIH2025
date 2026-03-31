import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import mongoose from 'mongoose';
import Alert from '../../src/models/Alert.js';
import { createAlert, resolveAlert } from '../../src/services/alert.service.js';

// Mock logger
jest.mock('../../src/config/logger.js', () => ({
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  }
}));

describe('Alert Service', () => {
  const testInstitutionId = new mongoose.Types.ObjectId();
  const testUserId = new mongoose.Types.ObjectId();

  beforeEach(async () => {
    await Alert.deleteMany({});
  });

  afterEach(async () => {
    await Alert.deleteMany({});
  });

  describe('createAlert', () => {
    it('should create an alert successfully', async () => {
      const alertData = {
        institutionId: testInstitutionId,
        type: 'fire',
        severity: 'high',
        title: 'Test Fire Alert',
        description: 'Test description',
        location: {
          type: 'Point',
          coordinates: [75.0, 30.0]
        },
        triggeredBy: testUserId
      };

      const alert = await createAlert(alertData);

      expect(alert).toBeDefined();
      expect(alert.type).toBe('fire');
      expect(alert.severity).toBe('high');
      expect(alert.status).toBe('active');
      expect(alert.institutionId.toString()).toBe(testInstitutionId.toString());
    });

    it('should throw error for invalid alert data', async () => {
      const invalidData = {
        // Missing required fields
        type: 'fire'
      };

      await expect(createAlert(invalidData)).rejects.toThrow();
    });
  });

  describe('resolveAlert', () => {
    let testAlert;

    beforeEach(async () => {
      testAlert = await Alert.create({
        institutionId: testInstitutionId,
        type: 'fire',
        severity: 'high',
        title: 'Test Alert',
        description: 'Test',
        status: 'active',
        triggeredBy: testUserId
      });
    });

    it('should resolve an alert successfully', async () => {
      const resolvedAlert = await resolveAlert(testAlert._id, testUserId);

      expect(resolvedAlert).toBeDefined();
      expect(resolvedAlert.status).toBe('resolved');
      expect(resolvedAlert.resolvedBy.toString()).toBe(testUserId.toString());
      expect(resolvedAlert.resolvedAt).toBeDefined();
    });

    it('should throw error for non-existent alert', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      await expect(resolveAlert(fakeId, testUserId)).rejects.toThrow('Alert not found');
    });
  });
});

