import express from 'express';
import { body, param } from 'express-validator';
import { register, deviceLogin } from '../controllers/device-auth.controller.js';
import {
  processTelemetry,
  getHealthMonitoring,
  getHistoricalData
} from '../controllers/iotDevice.controller.js';
import { deviceAlert } from '../controllers/device.controller.js';
import Device from '../models/Device.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authenticateDevice } from '../middleware/deviceAuth.middleware.js';
import { requireIotEnabled } from '../middleware/iotEnabled.middleware.js';
import { isIotEnabled } from '../config/features.js';
import { validate } from '../middleware/validator.js';
import { successResponse, errorResponse } from '../utils/response.js';
import logger from '../config/logger.js';

const router = express.Router();

/**
 * Feature flag for clients (web/mobile/ESP32).
 * GET /api/devices/iot/status
 */
router.get('/iot/status', (req, res) => {
  const enabled = isIotEnabled();
  return successResponse(
    res,
    { iotEnabled: enabled },
    enabled
      ? 'IoT is enabled'
      : 'IoT is disabled — set IOT_ENABLED=true in backend/.env to accept sensor traffic'
  );
});

// Register device (requires auth - admin)
router.post(
  '/register',
  authenticate,
  body('deviceId').notEmpty().withMessage('Device ID is required'),
  body('deviceName').notEmpty().withMessage('Device name is required'),
  body('deviceType').isIn([
    'class_tablet', 'projector_device', 'teacher_device', 'personal',
    'multi-sensor', 'fire-sensor', 'flood-sensor', 'motion-sensor',
    'temperature-sensor', 'smoke-sensor', 'panic-button', 'siren', 'led-strip'
  ]).withMessage('Invalid device type'),
  body('institutionId').isMongoId().withMessage('Valid institution ID is required'),
  body('classId').optional().isMongoId().withMessage('Valid class ID is required'),
  validate,
  register
);

// Device login (public - uses device token) — tablets + sensors
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

// --- Static IoT paths MUST be before /:deviceId ---

/**
 * GET /api/devices/health/monitoring
 */
router.get(
  '/health/monitoring',
  authenticate,
  getHealthMonitoring
);

/**
 * POST /api/devices/:deviceId/telemetry — ESP32 ingest (gated)
 */
router.post(
  '/:deviceId/telemetry',
  requireIotEnabled,
  authenticateDevice,
  validate,
  processTelemetry
);

/**
 * GET /api/devices/:deviceId/history
 */
router.get(
  '/:deviceId/history',
  authenticate,
  getHistoricalData
);

/**
 * POST /api/devices/:deviceId/alert — ESP32 emergency (gated)
 */
router.post(
  '/:deviceId/alert',
  requireIotEnabled,
  authenticateDevice,
  param('deviceId').notEmpty().withMessage('Device ID is required'),
  body('alertType')
    .optional()
    .customSanitizer((v) => (typeof v === 'string' ? v.trim().toUpperCase() : v))
    .isIn(['FIRE', 'SMOKE', 'EARTHQUAKE', 'FLOOD', 'MANUAL'])
    .withMessage('Invalid alert type'),
  body('severity')
    .optional()
    .customSanitizer((v) => (typeof v === 'string' ? v.trim().toUpperCase() : v))
    .isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
    .withMessage('Invalid severity'),
  body('sensorData').optional().isObject().withMessage('Sensor data must be an object'),
  body('location').optional().isObject().withMessage('Location must be an object'),
  validate,
  deviceAlert
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
        // Also allow lookup by business deviceId string
        const byKey = await Device.findOne({ deviceId: req.params.deviceId })
          .populate('institutionId', 'name')
          .populate('classId', 'grade section classCode');
        if (!byKey) {
          return errorResponse(res, 'Device not found', 404);
        }
        if (req.userRole !== 'admin' && byKey.institutionId?.toString() !== req.user?.institutionId?.toString()) {
          return errorResponse(res, 'Access denied', 403);
        }
        return successResponse(res, byKey, 'Device retrieved successfully');
      }

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
      let device = await Device.findById(req.params.deviceId);
      if (!device) {
        device = await Device.findOne({ deviceId: req.params.deviceId });
      }

      if (!device) {
        return errorResponse(res, 'Device not found', 404);
      }

      const { deviceName, classId, isActive, metadata, status, room, configuration } = req.body;

      if (deviceName) device.deviceName = deviceName;
      if (classId !== undefined) device.classId = classId || null;
      if (isActive !== undefined) {
        device.isActive = isActive;
        if (isActive === false && device.status === 'active') device.status = 'inactive';
        if (isActive === true && device.status === 'inactive') device.status = 'active';
      }
      if (status) device.status = status;
      if (room !== undefined) device.room = room;
      if (configuration) device.configuration = { ...device.configuration, ...configuration };
      if (metadata) device.metadata = { ...device.metadata, ...metadata };

      await device.save();

      return successResponse(res, device, 'Device updated successfully');
    } catch (error) {
      logger.error('Update device error:', error);
      return errorResponse(res, error.message || 'Failed to update device', 500);
    }
  }
);

export default router;
