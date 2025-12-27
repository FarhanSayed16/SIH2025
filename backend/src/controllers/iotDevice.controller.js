/**
 * Phase 3.4.2: Enhanced IoT Device Controller
 * Handles sensor telemetry, monitoring, and historical data
 */

import {
  processSensorTelemetry,
  getDeviceHealthMonitoring,
  getHistoricalSensorData
} from '../services/iotDeviceMonitoring.service.js';
import { successResponse, errorResponse } from '../utils/response.js';
import logger from '../config/logger.js';

/**
 * Process sensor telemetry data
 * POST /api/devices/:deviceId/telemetry
 */
export const processTelemetry = async (req, res) => {
  try {
    const { deviceId } = req.params;
    // Phase 201: Support both nested and flat telemetry format
    // ESP32 sends: { readings: {...}, timestamp: ... }
    // Also support: { flame: true, water: 150, ... }
    const telemetryData = req.body.readings ? req.body : { readings: req.body };

    const result = await processSensorTelemetry(deviceId, telemetryData);

    // Broadcast via Socket.io if alert was created
    if (result.alertCreated) {
      const io = req.app.get('io');
      if (io) {
        // Get alert details for severity
        const Alert = (await import('../models/Alert.js')).default;
        const alert = await Alert.findById(result.alertCreated).lean();
        
        // Use device info from result (already fetched in processSensorTelemetry)
        const { broadcastToSchool } = await import('../socket/rooms.js');
        broadcastToSchool(io, result.institutionId, 'DEVICE_ALERT', {
          deviceId: result.device.deviceId,
          alertId: result.alertCreated,
          alertType: result.alertType || alert?.type || 'other',
          deviceName: result.device.deviceName,
          deviceType: result.device.deviceType,
          room: result.device.room,
          severity: result.severity || alert?.severity || 'high',
          readings: result.readings, // Include sensor readings
          sensorData: result.readings, // Alias for compatibility
          thresholdBreached: result.thresholdBreached
        });
      }
    }

    // Broadcast telemetry update
    const io = req.app.get('io');
    if (io) {
      // Phase 201: Get actual readings from result or request
      const actualReadings = result.readings || readings;
      io.to(`device:${deviceId}`).emit('TELEMETRY_UPDATE', {
        deviceId,
        readings: actualReadings,
        timestamp: new Date()
      });
    }

    return successResponse(res, result, 'Telemetry processed successfully');
  } catch (error) {
    logger.error('Process telemetry error:', error);
    return errorResponse(res, error.message || 'Failed to process telemetry', 500);
  }
};

/**
 * Get device health monitoring
 * GET /api/devices/health/monitoring
 */
export const getHealthMonitoring = async (req, res) => {
  try {
    const { institutionId } = req.query;
    const targetInstitutionId = institutionId || req.user?.institutionId;

    if (!targetInstitutionId) {
      return errorResponse(res, 'Institution ID is required', 400);
    }

    const healthData = await getDeviceHealthMonitoring(targetInstitutionId);

    return successResponse(res, healthData, 'Device health monitoring data retrieved successfully');
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
    const { deviceId } = req.params;
    const { startDate, endDate, interval, limit } = req.query;

    const historicalData = await getHistoricalSensorData(deviceId, {
      startDate,
      endDate,
      interval,
      limit
    });

    return successResponse(res, historicalData, 'Historical sensor data retrieved successfully');
  } catch (error) {
    logger.error('Get historical data error:', error);
    return errorResponse(res, error.message || 'Failed to get historical data', 500);
  }
};

