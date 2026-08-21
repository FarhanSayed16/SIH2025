/**
 * Phase 3.4.2: Enhanced IoT Device Controller
 * Handles sensor telemetry, monitoring, and historical data
 */

import {
  processSensorTelemetry,
  getDeviceHealthMonitoring,
  getHistoricalSensorData
} from '../services/iotDeviceMonitoring.service.js';
import { isIotEnabled } from '../config/features.js';
import { successResponse, errorResponse } from '../utils/response.js';
import logger from '../config/logger.js';

/**
 * Process sensor telemetry data
 * POST /api/devices/:deviceId/telemetry
 */
export const processTelemetry = async (req, res) => {
  try {
    const { deviceId } = req.params;
    // Support nested ESP32 format and flat body
    const telemetryData = req.body.readings ? req.body : { readings: req.body };

    const result = await processSensorTelemetry(deviceId, telemetryData);

    const io = req.app.get('io');

    if (result.alertCreated && io) {
      const Alert = (await import('../models/Alert.js')).default;
      const alert = await Alert.findById(result.alertCreated).lean();
      const { broadcastToSchool } = await import('../socket/rooms.js');
      broadcastToSchool(io, result.institutionId, 'DEVICE_ALERT', {
        deviceId: result.device.deviceId,
        alertId: result.alertCreated,
        alertType: result.alertType || alert?.type || 'other',
        deviceName: result.device.deviceName,
        deviceType: result.device.deviceType,
        room: result.device.room,
        severity: result.severity || alert?.severity || 'high',
        readings: result.readings,
        sensorData: result.readings,
        thresholdBreached: result.thresholdBreached
      });
    }

    if (io) {
      const actualReadings = result.readings || telemetryData.readings || {};
      io.to(`device:${deviceId}`).emit('TELEMETRY_UPDATE', {
        deviceId,
        readings: actualReadings,
        timestamp: new Date()
      });
    }

    return successResponse(res, result, 'Telemetry processed successfully');
  } catch (error) {
    logger.error('Process telemetry error:', error);
    const code = error.statusCode || 500;
    return errorResponse(res, error.message || 'Failed to process telemetry', code);
  }
};

/**
 * Get device health monitoring
 * GET /api/devices/health/monitoring
 */
export const getHealthMonitoring = async (req, res) => {
  try {
    if (!isIotEnabled()) {
      return successResponse(
        res,
        {
          iotEnabled: false,
          totalDevices: 0,
          healthy: 0,
          warning: 0,
          offline: 0,
          devices: []
        },
        'IoT is disabled (IOT_ENABLED=false) — health monitoring skipped'
      );
    }

    const { institutionId } = req.query;
    const targetInstitutionId = institutionId || req.user?.institutionId;

    if (!targetInstitutionId) {
      return errorResponse(res, 'Institution ID is required', 400);
    }

    const healthData = await getDeviceHealthMonitoring(targetInstitutionId);

    return successResponse(
      res,
      { ...healthData, iotEnabled: true },
      'Device health monitoring data retrieved successfully'
    );
  } catch (error) {
    logger.error('Get health monitoring error:', error);
    return errorResponse(res, error.message || 'Failed to get health monitoring', 500);
  }
};

/**
 * Get historical sensor data
 * GET /api/devices/:deviceId/history
 */
export const getHistoricalData = async (req, res) => {
  try {
    if (!isIotEnabled()) {
      return successResponse(
        res,
        {
          iotEnabled: false,
          timeSeries: [],
          statistics: { count: 0, thresholdBreaches: 0 },
          recentReadings: [],
          totalReadings: 0
        },
        'IoT is disabled (IOT_ENABLED=false) — history skipped'
      );
    }

    const { deviceId } = req.params;
    const { startDate, endDate, interval, limit } = req.query;

    const historicalData = await getHistoricalSensorData(deviceId, {
      startDate,
      endDate,
      interval,
      limit
    });

    return successResponse(
      res,
      { ...historicalData, iotEnabled: true },
      'Historical sensor data retrieved successfully'
    );
  } catch (error) {
    logger.error('Get historical data error:', error);
    return errorResponse(res, error.message || 'Failed to get historical data', 500);
  }
};
