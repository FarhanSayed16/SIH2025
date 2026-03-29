/**
 * Phase 3.4.2: IoT Device Monitoring Service
 * Enhanced monitoring, health checks, and real-time processing for IoT devices
 */

import Device from '../models/Device.js';
import IoTSensorTelemetry from '../models/IoTSensorTelemetry.js';
import Alert from '../models/Alert.js';
import logger from '../config/logger.js';

/**
 * Process real-time sensor telemetry data
 * @param {string} deviceId - Device ID
 * @param {Object} telemetryData - Sensor readings
 * @returns {Promise<Object>} Processing result
 */
export const processSensorTelemetry = async (deviceId, telemetryData) => {
  try {
    const device = await Device.findOne({ deviceId });
    if (!device) {
      throw new Error('Device not found');
    }

    // Phase 201: Handle ESP32 telemetry format (readings nested or flat)
    let readings = telemetryData;
    if (telemetryData.readings) {
      readings = telemetryData.readings; // ESP32 sends { readings: {...}, timestamp: ... }
    }

    // Store telemetry in historical database
    const telemetry = await IoTSensorTelemetry.create({
      deviceId: device.deviceId,
      institutionId: device.institutionId,
      sensorType: device.deviceType, // Use deviceType instead of type
      readings: readings,
      location: device.location || { type: 'Point', coordinates: [0, 0] },
      timestamp: new Date()
    });

    // Check thresholds (use the actual readings)
    const thresholdCheck = await checkThresholds(device, readings);
    
    // Update telemetry record with breach status
    if (thresholdCheck.breached) {
      telemetry.thresholdBreached = true;
      await telemetry.save();
    }

    // Update device last seen
    device.lastSeen = new Date();
    await device.save();

    return {
      telemetryId: telemetry._id,
      thresholdBreached: thresholdCheck.breached,
      alertCreated: thresholdCheck.alertId || null,
      alertType: thresholdCheck.alertType || null, // Phase 201: Include alert type
      severity: thresholdCheck.severity || 'medium', // Phase 201: Include severity
      deviceStatus: getDeviceHealthStatus(device),
      institutionId: device.institutionId, // Phase 201: Include for Socket.io broadcasting
      readings: readings, // Phase 201: Include readings in response
      device: { // Phase 201: Include device info for broadcasting
        deviceId: device.deviceId,
        deviceName: device.deviceName || device.deviceId,
        deviceType: device.deviceType,
        room: device.room
      }
    };
  } catch (error) {
    logger.error('Process sensor telemetry error:', error);
    throw error;
  }
};

/**
 * Check if sensor readings breach configured thresholds
 * @param {Object} device - Device object
 * @param {Object} readings - Sensor readings
 * @returns {Promise<Object>} Threshold check result
 */
const checkThresholds = async (device, readings) => {
  const config = device.configuration || {};
  const thresholds = config.thresholds || {};
  let breached = false;
  let alertType = null;
  let severity = 'medium';

  // Phase 201: Multi-sensor device (flame, water, earthquake)
  if (device.deviceType === 'multi-sensor') {
    // Fire detection (flame sensor)
    if (readings.flame === true || readings.flame === 1) {
      breached = true;
      alertType = 'fire';
      severity = 'high';
    }

    // Flood detection (water level sensor)
    // Note: Lower water level reading = more water detected (sensor submerged)
    const waterDangerLevel = thresholds.waterDanger || config.waterDanger || 2000;
    const waterWarningLevel = thresholds.waterWarning || config.waterWarning || 1500;
    
    if (readings.water !== undefined && readings.water !== null) {
      if (readings.water > waterDangerLevel) {
        breached = true;
        alertType = 'flood';
        severity = 'high';
      } else if (readings.water > waterWarningLevel) {
        // Warning level - log but don't create alert
        logger.warn(`Device ${device.deviceId} water level warning: ${readings.water}`);
      }
    }

    // Earthquake detection (MPU-6050)
    const earthquakeThreshold = thresholds.earthquake || config.earthquake || 2.5;
    const magnitude = readings.magnitude || 
      (readings.acceleration ? 
        Math.sqrt(
          Math.pow(readings.acceleration.x || 0, 2) +
          Math.pow(readings.acceleration.y || 0, 2) +
          Math.pow(readings.acceleration.z || 0, 2)
        ) : 0);
    
    if (magnitude > earthquakeThreshold) {
      breached = true;
      alertType = 'earthquake';
      severity = magnitude > earthquakeThreshold * 2 ? 'critical' : 'high';
    }
  }

  // Fire sensor thresholds (single sensor)
  if (device.deviceType === 'fire-sensor' || device.deviceType === 'smoke-sensor') {
    const smokeThreshold = config.smokeThreshold || 300; // PPM
    const tempThreshold = config.temperatureThreshold || 60; // Celsius

    if (readings.smoke && readings.smoke > smokeThreshold) {
      breached = true;
      alertType = 'fire';
      severity = readings.smoke > smokeThreshold * 2 ? 'critical' : 'high';
    }
    if (readings.temperature && readings.temperature > tempThreshold) {
      breached = true;
      alertType = 'fire';
      severity = readings.temperature > tempThreshold * 1.5 ? 'critical' : 'high';
    }
  }

  // Flood sensor thresholds (single sensor)
  if (device.deviceType === 'flood-sensor') {
    const waterLevelThreshold = config.waterLevelThreshold || 20; // cm
    if (readings.waterLevel && readings.waterLevel > waterLevelThreshold) {
      breached = true;
      alertType = 'flood';
      severity = 'high';
    }
    // Also check for water reading (for consistency)
    if (readings.water && readings.water > 2000) {
      breached = true;
      alertType = 'flood';
      severity = 'high';
    }
  }

  // Temperature sensor thresholds
  if (device.deviceType === 'temperature-sensor') {
    const minTemp = config.minTemperature || 0;
    const maxTemp = config.maxTemperature || 40;
    
    if (readings.temperature && (readings.temperature < minTemp || readings.temperature > maxTemp)) {
      breached = true;
      alertType = 'temperature_anomaly';
      severity = Math.abs(readings.temperature - (minTemp + maxTemp) / 2) > 10 ? 'critical' : 'medium';
    }
  }

  // Battery level check (for all devices)
  if (readings.batteryLevel !== undefined && readings.batteryLevel < 20) {
    logger.warn(`Device ${device.deviceId} battery low: ${readings.batteryLevel}%`);
    // Don't trigger alert for battery, just log
  }

  // Create alert if threshold breached
  let alertId = null;
  if (breached) {
    const alert = await Alert.create({
      institutionId: device.institutionId,
      type: alertType || 'other',
      severity,
      title: `${device.deviceName} - Threshold Breach Detected`,
      description: `Device ${device.deviceName} (${device.deviceType}) detected readings outside normal range`,
      location: device.location,
      triggeredBy: null,
      deviceId: device._id,
        metadata: {
          deviceId: device.deviceId,
          deviceType: device.deviceType,
          readings,
          thresholds: config
        }
    });

    alertId = alert._id;
    logger.warn(`Alert created for device ${device.deviceId}: ${alertType}`);

    // Phase 201: Send FCM notification for IoT alerts
    try {
      const { sendIoTAlertNotification } = await import('./notification.service.js');
      await sendIoTAlertNotification({
        institutionId: device.institutionId,
        alertId: alert._id,
        alertType: alertType || 'other',
        severity: severity,
        deviceId: device.deviceId,
        deviceName: device.deviceName || device.deviceId,
        deviceType: device.deviceType,
        room: device.room,
        sensorData: readings,
        message: alert.description || alert.title,
      });
    } catch (error) {
      logger.warn('Failed to send FCM notification for IoT alert:', error);
      // Don't fail the alert creation if FCM fails
    }
  }

  return {
    breached,
    alertType,
    severity,
    alertId
  };
};

/**
 * Get device information for broadcasting
 * @param {string} deviceId - Device ID
 * @returns {Promise<Object>} Device information
 */
export const getDeviceInfo = async (deviceId) => {
  const device = await Device.findOne({ deviceId });
  if (!device) {
    return null;
  }
  return {
    deviceId: device.deviceId,
    deviceName: device.deviceName || device.deviceId,
    deviceType: device.deviceType,
    room: device.room,
    institutionId: device.institutionId
  };
};

/**
 * Get device health status
 * @param {Object} device - Device object
 * @returns {string} Health status
 */
const getDeviceHealthStatus = (device) => {
  const now = new Date();
  const lastSeen = new Date(device.lastSeen);
  const minutesSinceLastSeen = (now - lastSeen) / (1000 * 60);

  if (minutesSinceLastSeen > 60) {
    return 'offline';
  } else if (minutesSinceLastSeen > 30) {
    return 'warning';
  } else {
    return 'healthy';
  }
};

/**
 * Get device health monitoring data
 * @param {string} institutionId - Institution ID
 * @returns {Promise<Object>} Health monitoring data
 */
export const getDeviceHealthMonitoring = async (institutionId) => {
  try {
    const devices = await Device.find({ institutionId });

    const healthData = await Promise.all(devices.map(async (device) => {
      const now = new Date();
      const lastSeen = new Date(device.lastSeen);
      const minutesSinceLastSeen = (now - lastSeen) / (1000 * 60);

      // Get recent telemetry stats
      const recentTelemetry = await IoTSensorTelemetry.find({
        deviceId: device.deviceId,
        timestamp: { $gte: new Date(now - 24 * 60 * 60 * 1000) } // Last 24 hours
      }).sort({ timestamp: -1 }).limit(1);

      const latestReading = recentTelemetry[0];
      const batteryLevel = latestReading?.readings?.batteryLevel || null;
      const signalStrength = latestReading?.readings?.signalStrength || null;

      return {
        deviceId: device.deviceId,
        deviceName: device.deviceName,
        deviceType: device.deviceType,
        status: device.status,
        health: getDeviceHealthStatus(device),
        lastSeen: device.lastSeen,
        minutesSinceLastSeen: Math.round(minutesSinceLastSeen),
        batteryLevel,
        signalStrength,
        location: device.location,
        room: device.room
      };
    }));

    // Aggregate health statistics
    const healthy = healthData.filter(d => d.health === 'healthy').length;
    const warning = healthData.filter(d => d.health === 'warning').length;
    const offline = healthData.filter(d => d.health === 'offline').length;

    return {
      totalDevices: devices.length,
      healthy,
      warning,
      offline,
      devices: healthData
    };
  } catch (error) {
    logger.error('Get device health monitoring error:', error);
    throw error;
  }
};

/**
 * Get historical sensor data with aggregation
 * @param {string} deviceId - Device ID
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Historical data
 */
export const getHistoricalSensorData = async (deviceId, options = {}) => {
  try {
    const {
      startDate,
      endDate,
      interval = 'hour',
      limit = 1000
    } = options;

    // Get time series data
    const timeSeries = await IoTSensorTelemetry.getTimeSeries(
      deviceId,
      startDate,
      endDate,
      interval
    );

    // Get aggregated statistics
    const stats = await IoTSensorTelemetry.getAggregatedStats(
      deviceId,
      startDate,
      endDate
    );

    // Get recent readings
    const recentReadings = await IoTSensorTelemetry.find({
      deviceId,
      ...(startDate || endDate ? {
        timestamp: {
          ...(startDate ? { $gte: new Date(startDate) } : {}),
          ...(endDate ? { $lte: new Date(endDate) } : {})
        }
      } : {})
    })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .lean();

    return {
      timeSeries,
      statistics: stats,
      recentReadings: recentReadings.reverse(), // Oldest first for charts
      totalReadings: stats.count
    };
  } catch (error) {
    logger.error('Get historical sensor data error:', error);
    throw error;
  }
};

