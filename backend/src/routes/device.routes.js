import express from 'express';
import { body, param } from 'express-validator';
import { register, deviceLogin } from '../controllers/device-auth.controller.js';
import {
  processTelemetry,
  getHealthMonitoring,
  getHistoricalData
} from '../controllers/iotDevice.controller.js';
import { deviceAlert } from '../controllers/device.controller.js'; // Phase 4.3
import Device from '../models/Device.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authenticateDevice } from '../middleware/deviceAuth.middleware.js';
import { validate } from '../middleware/validator.js';
import { successResponse, errorResponse } from '../utils/response.js';
import logger from '../config/logger.js';

const router = express.Router();

// Register device (requires auth - admin)
// Phase 201: Allow 'multi-sensor' device type for IoT nodes
router.post(
  '/register',
  authenticate,
  body('deviceId').notEmpty().withMessage('Device ID is required'),
  body('deviceName').notEmpty().withMessage('Device name is required'),
  body('deviceType').isIn([
    'class_tablet', 'projector_device', 'teacher_device', 'personal',
    // Phase 201: Multi-sensor IoT nodes
    'multi-sensor', 'fire-sensor', 'flood-sensor', 'motion-sensor', 
    'temperature-sensor', 'smoke-sensor', 'panic-button', 'siren', 'led-strip'
  ]).withMessage('Invalid device type'),
  body('institutionId').isMongoId().withMessage('Valid institution ID is required'),
  body('classId').optional().isMongoId().withMessage('Valid class ID is required'),
  validate,
  register
);

// Device login (public - uses device token)
router.post(
  '/login',
  body('deviceToken').notEmpty().withMessage('Device token is required'),
  validate,
  deviceLogin
);

// List all devices (requires auth - admin/teacher)
router.get(
  '/',
  authenticate,
  async (req, res) => {
    try {
      const { institutionId, classId, deviceType, isActive } = req.query;
      const query = {};

      if (institutionId) query.institutionId = institutionId;
      if (classId) query.classId = classId;
      if (deviceType) query.deviceType = deviceType;
      if (isActive !== undefined) query.isActive = isActive === 'true';

      // Non-admin users can only see devices from their institution
      if (req.userRole !== 'admin' && req.user?.institutionId) {
        query.institutionId = req.user.institutionId;
      }

      const devices = await Device.find(query)
        .populate('institutionId', 'name')
        .populate('classId', 'grade section classCode')
        .sort({ createdAt: -1 });

      return successResponse(res, devices, 'Devices retrieved successfully');
    } catch (error) {
      logger.error('List devices error:', error);
      return errorResponse(res, error.message || 'Failed to list devices', 500);
    }
  }
);

// Get device info (requires auth)
router.get(
  '/:deviceId',
  authenticate,
  async (req, res) => {
    try {
      const device = await Device.findById(req.params.deviceId)
        .populate('institutionId', 'name')
        .populate('classId', 'grade section classCode');

      if (!device) {
        return errorResponse(res, 'Device not found', 404);
      }

      // Non-admin users can only see devices from their institution
      if (req.userRole !== 'admin' && device.institutionId?.toString() !== req.user?.institutionId?.toString()) {
        return errorResponse(res, 'Access denied', 403);
      }

      return successResponse(res, device, 'Device retrieved successfully');
    } catch (error) {
      logger.error('Get device error:', error);
      return errorResponse(res, error.message || 'Failed to get device', 500);
    }
  }
);

// Update device (requires auth - admin)
router.put(
  '/:deviceId',
  authenticate,
  async (req, res) => {
    try {
      const device = await Device.findById(req.params.deviceId);

      if (!device) {
        return errorResponse(res, 'Device not found', 404);
      }

      const { deviceName, classId, isActive, metadata } = req.body;

      if (deviceName) device.deviceName = deviceName;
      if (classId !== undefined) device.classId = classId || null;
      if (isActive !== undefined) device.isActive = isActive;
      if (metadata) device.metadata = { ...device.metadata, ...metadata };

      await device.save();

      return successResponse(res, device, 'Device updated successfully');
    } catch (error) {
      logger.error('Update device error:', error);
      return errorResponse(res, error.message || 'Failed to update device', 500);
    }
  }
);

// Phase 3.4.2: Enhanced IoT endpoints

/**
 * Process sensor telemetry
 * POST /api/devices/:deviceId/telemetry
 * Requires: Device authentication
 */
// Phase 201: Telemetry endpoint - readings can be nested or flat
router.post(
  '/:deviceId/telemetry',
  authenticateDevice,
  // Phase 201: Readings can be in body.readings or body directly (for ESP32 compatibility)
  validate,
  processTelemetry
);

/**
 * Get device health monitoring
 * GET /api/devices/health/monitoring
 * Requires: User authentication
 */
router.get(
  '/health/monitoring',
  authenticate,
  getHealthMonitoring
);

/**
 * Get historical sensor data
 * GET /api/devices/:deviceId/history
 * Requires: User authentication
 */
router.get(
  '/:deviceId/history',
  authenticate,
  getHistoricalData
);

/**
 * Phase 4.3: IoT Emergency Trigger - Device Alert Endpoint
 * POST /api/devices/:deviceId/alert
 * Requires: Device authentication (Bearer token)
 */
router.post(
  '/:deviceId/alert',
  authenticateDevice,
  param('deviceId').notEmpty().withMessage('Device ID is required'),
  body('alertType').optional().isIn(['FIRE', 'SMOKE', 'EARTHQUAKE', 'FLOOD', 'MANUAL']).withMessage('Invalid alert type'),
  body('severity').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).withMessage('Invalid severity'),
  body('sensorData').optional().isObject().withMessage('Sensor data must be an object'),
  body('location').optional().isObject().withMessage('Location must be an object'),
  validate,
  deviceAlert
);

export default router;
