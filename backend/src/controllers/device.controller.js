import Device from '../models/Device.js';
import Alert from '../models/Alert.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response.js';
import { generateDeviceToken } from '../utils/helpers.js';
import logger from '../config/logger.js';

/**
 * Register IoT device
 * POST /api/devices/register
 */
export const registerDevice = async (req, res) => {
  try {
    const { deviceId, institutionId, deviceType, type, deviceName, name, location, room, configuration } = req.body;

    // Check if device already exists
    const existingDevice = await Device.findOne({ deviceId });
    if (existingDevice) {
      // Phase 201: If device exists, return existing token (for ESP32 re-registration)
      logger.info(`Device ${deviceId} already exists, returning existing token`);
      return successResponse(
        res,
        {
          device: existingDevice.toJSON(),
          deviceToken: existingDevice.deviceToken // Return existing token
        },
        'Device already registered',
        200
      );
    }

    // Support both 'type' and 'deviceType' for backward compatibility
    const finalDeviceType = deviceType || type;
    const finalDeviceName = deviceName || name;

    if (!finalDeviceType) {
      return errorResponse(res, 'Device type is required', 400);
    }

    // Phase 201: Validate institutionId for multi-sensor devices
    const finalInstitutionId = institutionId || req.user?.institutionId;
    if (!finalInstitutionId) {
      return errorResponse(res, 'Institution ID is required', 400);
    }

    // Generate device token
    const deviceToken = generateDeviceToken();

    // Phase 201: Enhanced configuration for multi-sensor devices
    let deviceConfiguration = configuration || {};
    if (finalDeviceType === 'multi-sensor' && configuration?.sensors) {
      // Store sensor configuration
      deviceConfiguration = {
        ...deviceConfiguration,
        sensors: configuration.sensors,
        thresholds: configuration.thresholds || {
          waterWarning: 1500,
          waterDanger: 2000,
          earthquake: 2.5
        }
      };
    }

    // Create device
    const device = await Device.create({
      deviceId,
      institutionId: finalInstitutionId,
      deviceType: finalDeviceType,
      deviceName: finalDeviceName || `${finalDeviceType}-${deviceId.slice(-4)}`,
      location: location || {
        type: 'Point',
        coordinates: [0, 0]
      },
      room,
      deviceToken,
      configuration: deviceConfiguration,
      status: 'active'
    });

    logger.info(`Device registered: ${device.deviceId} (${device.deviceType})`);

    return successResponse(
      res,
      {
        device: device.toJSON(),
        deviceToken // Return token only once
      },
      'Device registered successfully',
      201
    );
  } catch (error) {
    logger.error('Register device error:', error);
    return errorResponse(res, error.message || 'Failed to register device', 400);
  }
};

/**
 * Get device by ID
 * GET /api/devices/:id
 */
export const getDeviceById = async (req, res) => {
  try {
    const { id } = req.params;

    const device = await Device.findById(id)
      .populate('institutionId', 'name address');

    if (!device) {
      return errorResponse(res, 'Device not found', 404);
    }

    return successResponse(res, { device }, 'Device retrieved successfully');
  } catch (error) {
    logger.error('Get device error:', error);
    return errorResponse(res, 'Failed to get device', 500);
  }
};

/**
 * List devices
 * GET /api/devices
 */
export const listDevices = async (req, res) => {
  try {
    const { page = 1, limit = 10, institutionId, type, status } = req.query;

    const query = {};
    if (institutionId) query.institutionId = institutionId;
    else if (req.user?.institutionId && req.user.role !== 'admin') {
      query.institutionId = req.user.institutionId;
    }
    if (type) query.type = type;
    if (status) query.status = status;

    const devices = await Device.find(query)
      .populate('institutionId', 'name')
      .select('-deviceToken') // Don't expose tokens in list
      .sort({ lastSeen: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Device.countDocuments(query);

    return paginatedResponse(res, devices, {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit)
    }, 'Devices retrieved successfully');
  } catch (error) {
    logger.error('List devices error:', error);
    return errorResponse(res, 'Failed to list devices', 500);
  }
};

/**
 * Update device telemetry
 * POST /api/devices/:deviceId/telemetry
 */
export const updateTelemetry = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { data } = req.body;

    const device = await Device.findOne({ deviceId });
    if (!device) {
      return errorResponse(res, 'Device not found', 404);
    }

    // Add telemetry data
    await device.addTelemetry(data, false);

    // Check thresholds and trigger alert if needed
    const shouldAlert = checkThresholds(device, data);
    
    if (shouldAlert) {
      // Create alert
      const alert = await Alert.create({
        institutionId: device.institutionId,
        type: getAlertTypeFromDeviceType(device.deviceType),
        severity: 'high',
        title: `${device.name} Alert`,
        description: `Device ${device.name} detected threshold breach`,
        location: device.location,
        triggeredBy: null, // Device triggered
        deviceId: device._id,
        metadata: {
          deviceId: device.deviceId,
          deviceType: device.deviceType,
          telemetry: data
        }
      });

      // Broadcast via Socket.io
      const io = req.app.get('io');
      if (io) {
        const { broadcastToSchool } = await import('../socket/rooms.js');
        const { createCrisisAlertEvent } = await import('../socket/events.js');
        broadcastToSchool(io, device.institutionId, 'CRISIS_ALERT', createCrisisAlertEvent(alert));
      }

      logger.warn(`Alert triggered by device ${device.deviceId}: ${device.deviceType}`);
    }

    return successResponse(res, {
      device: device.toJSON(),
      alertTriggered: shouldAlert
    }, 'Telemetry updated successfully');
  } catch (error) {
    logger.error('Update telemetry error:', error);
    return errorResponse(res, 'Failed to update telemetry', 500);
  }
};

/**
 * Device alert endpoint
 * POST /api/devices/:deviceId/alert
 * Phase 4.3: Enhanced with device authentication, sensor data, and full alert processing flow
 */
export const deviceAlert = async (req, res) => {
  try {
    // Phase 4.3: Device should be attached by authenticateDevice middleware via deviceToken
    const device = req.device;
    
    if (!device) {
      return errorResponse(res, 'Device authentication required', 401);
    }
    
    // Verify deviceId from route parameter matches authenticated device
    const { deviceId: routeDeviceId } = req.params;
    if (routeDeviceId && device.deviceId !== routeDeviceId) {
      logger.warn(`Device ID mismatch: authenticated ${device.deviceId} vs route ${routeDeviceId}`);
      return errorResponse(res, 'Device ID mismatch. Route deviceId must match authenticated device.', 403);
    }

    // Phase 4.3: Enhanced request body with sensor data and location details
    const {
      alertType, // FIRE, SMOKE, EARTHQUAKE, FLOOD, MANUAL
      severity, // LOW, MEDIUM, HIGH, CRITICAL
      sensorData, // { temperature, smokeLevel, ... }
      location: locationDetails, // { building, floor, room }
      timestamp,
      title,
      description
    } = req.body;

    // Map alertType to Alert model enum (convert to lowercase)
    const alertTypeMap = {
      'FIRE': 'fire',
      'SMOKE': 'fire', // Smoke alerts are fire type
      'EARTHQUAKE': 'earthquake',
      'FLOOD': 'flood',
      'MANUAL': 'other'
    };
    
    const alertTypeLower = alertTypeMap[alertType?.toUpperCase()] || 
                          getAlertTypeFromDeviceType(device.deviceType) || 
                          'other';

    // Map severity to lowercase
    const severityMap = {
      'LOW': 'low',
      'MEDIUM': 'medium',
      'HIGH': 'high',
      'CRITICAL': 'critical'
    };
    const severityLower = severityMap[severity?.toUpperCase()] || 'high';

    // Phase 4.3: Build location from device or request
    let alertLocation = device.location;
    if (locationDetails) {
      // Use location details if provided, but keep device coordinates if available
      alertLocation = {
        type: 'Point',
        coordinates: device.location?.coordinates || [0, 0]
      };
    }

    // Phase 4.10: Use central alert pipeline for IoT alerts
    const iotAlertData = {
      institutionId: device.institutionId,
      type: alertTypeLower,
      severity: severityLower,
      title: title || `${device.deviceName || device.deviceId} Alert`,
      description: description || `Emergency alert triggered by IoT device: ${device.deviceName || device.deviceId}`,
      location: alertLocation,
      deviceId: device._id,
      metadata: {
        deviceId: device.deviceId,
        deviceName: device.deviceName,
        deviceType: device.deviceType,
        sensorData: sensorData || {},
        locationDetails: locationDetails || {
          building: device.room ? device.room.split('-')[0] : null,
          floor: device.room ? device.room.split('-')[1] : null,
          room: device.room || null
        },
        timestamp: timestamp || new Date().toISOString()
      }
    };

    // Phase 4.10: Process through alert pipeline
    let alert;
    let alertLog;
    try {
      const { processIoTAlert } = await import('../services/alertPipeline.service.js');
      const result = await processIoTAlert(iotAlertData);
      alert = result.alert;
      alertLog = result.alertLog;
      logger.info(`IoT alert processed via pipeline: ${alert.type} (ID: ${alert._id})`);
    } catch (pipelineError) {
      logger.warn('Alert pipeline failed for IoT, falling back to legacy method:', pipelineError);
      // Fallback to legacy method
      alert = await Alert.create({
        ...iotAlertData,
        triggeredBy: null,
        metadata: {
          ...iotAlertData.metadata,
          source: 'IoT'
        }
      });
    }

    // Phase 4.10: Pipeline already handles broadcasting and logging
    // Only broadcast if pipeline was not used (legacy fallback)
    if (!alertLog) {
      // Phase 4.3: Log alert creation to EventLog (legacy fallback)
      try {
        const EventLog = (await import('../models/EventLog.js')).default;
        await EventLog.create({
          eventType: 'alert_created',
          entityType: 'alert',
          entityId: alert._id,
          institutionId: device.institutionId,
          metadata: {
            source: 'IoT',
            deviceId: device.deviceId,
            alertType: alertTypeLower,
            severity: severityLower
          }
        });
      } catch (error) {
        logger.warn('Failed to log alert to EventLog:', error);
      }

      // Phase 4.3: Broadcast CRISIS_ALERT via Socket.io (legacy fallback)
      try {
        const { broadcastCrisisAlert } = await import('../services/crisisAlert.service.js');
        await broadcastCrisisAlert(alert, {
          isDrill: false,
          source: 'IoT',
          locationDetails: alert.metadata.locationDetails
        });
    } catch (error) {
      logger.warn('Failed to broadcast crisis alert via Socket.io:', error);
      // Don't fail if broadcast fails
    }

      // Phase 4.3: Send FCM push notifications (legacy fallback)
      try {
        const { sendCrisisAlertNotification } = await import('../services/fcm.service.js');
        await sendCrisisAlertNotification(alert);
      } catch (error) {
        logger.warn('Failed to send push notification:', error);
        // Don't fail if notification fails
      }
    }

    logger.warn(`🚨 Alert created by IoT device ${device.deviceId}: ${alertTypeLower} (${severityLower})`);

    // Phase 201: Broadcast DEVICE_ALERT for IoT-specific UI components
    try {
      const io = req.app.get('io');
      if (io) {
        const { broadcastToSchool } = await import('../socket/rooms.js');
        broadcastToSchool(io, device.institutionId, 'DEVICE_ALERT', {
          deviceId: device.deviceId,
          alertId: alert._id.toString(),
          alertType: alertTypeLower,
          deviceName: device.deviceName || device.deviceId,
          deviceType: device.deviceType,
          room: device.room,
          severity: severityLower,
          readings: sensorData || {}, // Include sensor data from request
          sensorData: sensorData || {}, // Alias for compatibility
          thresholdBreached: true
        });
      }
    } catch (error) {
      logger.warn('Failed to broadcast DEVICE_ALERT via Socket.io:', error);
      // Don't fail if broadcast fails
    }

    return successResponse(res, { alert, alertLog }, 'Alert created and broadcasted successfully', 201);
  } catch (error) {
    logger.error('Device alert error:', error);
    return errorResponse(res, error.message || 'Failed to create alert', 500);
  }
};

/**
 * Update device location
 * PUT /api/devices/:deviceId/location
 */
export const updateDeviceLocation = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { lat, lng } = req.body;

    const device = await Device.findOne({ deviceId });
    if (!device) {
      return errorResponse(res, 'Device not found', 404);
    }

    await device.updateLocation(lat, lng);

    return successResponse(res, { device: device.toJSON() }, 'Device location updated successfully');
  } catch (error) {
    logger.error('Update device location error:', error);
    return errorResponse(res, 'Failed to update device location', 500);
  }
};

/**
 * Get device telemetry history
 * GET /api/devices/:deviceId/telemetry
 */
export const getDeviceTelemetry = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { limit = 50 } = req.query;

    const device = await Device.findOne({ deviceId }).select('telemetry');
    if (!device) {
      return errorResponse(res, 'Device not found', 404);
    }

    // Get recent telemetry (last N entries)
    const telemetry = device.telemetry
      .slice(-parseInt(limit))
      .reverse(); // Most recent first

    return successResponse(res, {
      deviceId,
      telemetry,
      count: telemetry.length
    }, 'Telemetry retrieved successfully');
  } catch (error) {
    logger.error('Get telemetry error:', error);
    return errorResponse(res, 'Failed to get telemetry', 500);
  }
};

/**
 * Helper: Check if telemetry data breaches thresholds
 */
const checkThresholds = (device, data) => {
  const config = device.configuration || {};
  
  if (device.deviceType === 'fire-sensor') {
    const smokeThreshold = config.smokeThreshold || 300;
    const tempThreshold = config.temperatureThreshold || 60;
    
    if (data.smoke && data.smoke > smokeThreshold) return true;
    if (data.temperature && data.temperature > tempThreshold) return true;
  }
  
  if (device.deviceType === 'flood-sensor') {
    const waterLevelThreshold = config.waterLevelThreshold || 20; // cm
    if (data.waterLevel && data.waterLevel < waterLevelThreshold) return true;
  }
  
  return false;
};

/**
 * Helper: Get alert type from device type
 */
/**
 * Helper: Get alert type from device type
 * Phase 201: Enhanced for multi-sensor devices
 */
const getAlertTypeFromDeviceType = (deviceType) => {
  // Phase 201: Multi-sensor devices can trigger multiple alert types
  if (deviceType === 'multi-sensor') {
    return null; // Will be determined by sensor readings
  }
  const mapping = {
    'fire-sensor': 'fire',
    'flood-sensor': 'flood',
    'panic-button': 'other',
    'siren': 'other'
  };
  return mapping[deviceType] || 'other';
};

