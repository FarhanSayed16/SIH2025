import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import mongoose from 'mongoose';
import Drill from '../../src/models/Drill.js';
import { scheduleDrill, triggerDrill, acknowledgeDrill } from '../../src/services/drill.service.js';

// Mock logger
jest.mock('../../src/config/logger.js', () => ({
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  }
}));

describe('Drill Service', () => {
  let testDrill;
  const testInstitutionId = new mongoose.Types.ObjectId();
  const testUserId = new mongoose.Types.ObjectId();

  beforeEach(async () => {
    // Clear drills collection
    await Drill.deleteMany({});
  });

  afterEach(async () => {
    await Drill.deleteMany({});
  });

  describe('scheduleDrill', () => {
    it('should schedule a drill successfully', async () => {
      const drillData = {
        institutionId: testInstitutionId,
        type: 'fire',
        scheduledAt: new Date(Date.now() + 86400000), // Tomorrow
        status: 'scheduled'
      };

      const drill = await scheduleDrill(drillData);

      expect(drill).toBeDefined();
      expect(drill.type).toBe('fire');
      expect(drill.status).toBe('scheduled');
      expect(drill.institutionId.toString()).toBe(testInstitutionId.toString());
    });

    it('should throw error for invalid drill data', async () => {
      const invalidData = {
        // Missing required fields
        type: 'fire'
      };

      await expect(scheduleDrill(invalidData)).rejects.toThrow();
    });
  });

  describe('triggerDrill', () => {
    beforeEach(async () => {
      // Create a scheduled drill
      testDrill = await Drill.create({
        institutionId: testInstitutionId,
        type: 'fire',
        scheduledAt: new Date(Date.now() + 86400000),
        status: 'scheduled'
      });
    });

    it('should trigger a drill successfully', async () => {
      const triggeredDrill = await triggerDrill(testDrill._id, testUserId);

      expect(triggeredDrill).toBeDefined();
      expect(triggeredDrill.status).toBe('in_progress');
      expect(triggeredDrill.triggeredBy.toString()).toBe(testUserId.toString());
      expect(triggeredDrill.triggeredAt).toBeDefined();
    });

    it('should throw error for non-existent drill', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      await expect(triggerDrill(fakeId, testUserId)).rejects.toThrow('Drill not found');
    });
  });

  describe('acknowledgeDrill', () => {
    beforeEach(async () => {
      // Create an in-progress drill
      testDrill = await Drill.create({
        institutionId: testInstitutionId,
        type: 'fire',
        status: 'in_progress',
        triggeredAt: new Date()
      });
    });

    it('should acknowledge drill participation', async () => {
      const acknowledged = await acknowledgeDrill(testDrill._id, testUserId);

      expect(acknowledged).toBeDefined();
      expect(acknowledged.acknowledgedBy).toContainEqual(testUserId);
    });

    it('should throw error for non-existent drill', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      await expect(acknowledgeDrill(fakeId, testUserId)).rejects.toThrow('Drill not found');
    });
  });
});

