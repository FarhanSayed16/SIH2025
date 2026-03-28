/**
 * Phase 4.10: Central Alert Pipeline Service
 * Unified alert processing from multiple sources
 */

import Alert from '../models/Alert.js';
import AlertLog from '../models/AlertLog.js';
import School from '../models/School.js';
import User from '../models/User.js';
import { broadcastCrisisAlert } from './crisisAlert.service.js';
import { sendCrisisAlertNotification } from './fcm.service.js';
import logger from '../config/logger.js';

/**
 * Standardize alert format from different sources
 * @param {Object} rawAlert - Raw alert data from source
 * @param {String} source - Alert source (iot, admin, teacher, ai, ndma)
 * @param {Object} sourceDetails - Source-specific details
 * @returns {Object} - Standardized alert data
 */
export const standardizeAlertFormat = (rawAlert, source, sourceDetails = {}) => {
  const standardized = {
    institutionId: rawAlert.institutionId || rawAlert.schoolId,
    type: rawAlert.type || rawAlert.alertType || 'other',
    severity: rawAlert.severity || 'high',
    title: rawAlert.title || `${rawAlert.type?.toUpperCase() || 'Emergency'} Alert`,
    description: rawAlert.description || rawAlert.message || rawAlert.body || '',
    location: rawAlert.location || null,
    triggeredBy: rawAlert.triggeredBy || rawAlert.userId || null,
    deviceId: rawAlert.deviceId || null,
    source,
    sourceDetails,
    metadata: rawAlert.metadata || {}
  };

  // Normalize alert type
  const validTypes = ['fire', 'earthquake', 'flood', 'cyclone', 'stampede', 'medical', 'other'];
  if (!validTypes.includes(standardized.type)) {
    standardized.type = 'other';
  }

  // Normalize severity
  const validSeverities = ['low', 'medium', 'high', 'critical'];
  if (!validSeverities.includes(standardized.severity)) {
    standardized.severity = 'high';
  }

  return standardized;
};

/**
 * Determine affected users based on alert location and school
 * @param {ObjectId} institutionId - School ID
 * @param {Object} location - Alert location (GeoJSON Point)
 * @returns {Promise<Array>} - Array of affected user IDs
 */
export const determineAffectedUsers = async (institutionId, location = null) => {
  try {
    // Get all users in the institution
    const users = await User.find({
      institutionId,
      role: { $in: ['student', 'teacher'] },
      isActive: true
    }).select('_id');

    // For now, return all users in the institution
    // TODO: Implement geofencing logic if location is provided
    // Could filter users based on their last known location vs alert location
    
    return users.map(u => u._id);
  } catch (error) {
    logger.error('Error determining affected users:', error);
    return [];
  }
};

/**
 * Process alert through central pipeline
 * @param {Object} alertData - Alert data (can be from any source)
 * @param {String} source - Alert source (iot, admin, teacher, ai, ndma)
 * @param {Object} sourceDetails - Source-specific details
 * @param {Object} options - Processing options (skipBroadcast, skipNotification, etc.)
 * @returns {Promise<Object>} - Created alert and alert log
 */
export const processAlert = async (alertData, source, sourceDetails = {}, options = {}) => {
  try {
    // Step 1: Standardize alert format
    const standardized = standardizeAlertFormat(alertData, source, sourceDetails);

    // Validate required fields
    if (!standardized.institutionId) {
      throw new Error('Institution ID is required');
    }

    // Step 2: Determine affected users
    const affectedUsers = await determineAffectedUsers(
      standardized.institutionId,
      standardized.location
    );

    // Step 3: Create Alert record
    const alertPayload = {
      institutionId: standardized.institutionId,
      type: standardized.type === 'sos' ? 'sos' : standardized.type,
      severity: standardized.type === 'sos' ? 'critical' : standardized.severity,
      title:
        standardized.type === 'sos'
          ? 'SOS Alert'
          : standardized.title,
      description: standardized.description,
      location: standardized.location,
      triggeredBy: standardized.triggeredBy,
      deviceId: standardized.deviceId,
      status: 'active',
      metadata: {
        ...standardized.metadata,
        sos: standardized.type === 'sos' || standardized.metadata?.sos === true,
        source,
        sourceDetails
      }
    };

    const alert = await Alert.create(alertPayload);

    // Initialize student statuses for affected users
    if (affectedUsers.length > 0) {
      alert.studentStatus = affectedUsers.map(userId => ({
        userId,
        status: 'missing', // Default status
        lastUpdate: new Date()
      }));
      await alert.save();
    }

    // Step 4: Create AlertLog record
    const alertLog = await AlertLog.create({
      alertId: alert._id,
      source,
      sourceDetails,
      severity: standardized.severity,
      type: standardized.type,
      institutionId: standardized.institutionId,
      affectedUsers,
      status: 'active',
      metadata: standardized.metadata
    });

    // Log initial creation action
    await alertLog.logAction(
      standardized.triggeredBy || null,
      'created',
      { source, sourceDetails }
    );

    // Step 5: Broadcast via Socket.io (unless skipped)
    if (!options.skipBroadcast) {
      await broadcastCrisisAlert(alert, {
        isDrill: false,
        source: source.toUpperCase()
      });
    }

    // Step 6: Send FCM push notifications (unless skipped)
    if (!options.skipNotification) {
      try {
        await sendCrisisAlertNotification(alert);
      } catch (fcmError) {
        logger.warn('FCM notification failed (non-critical):', fcmError);
      }
    }

    logger.info(`✅ Alert processed: ${alert.type} from ${source} (ID: ${alert._id})`);

    return {
      alert,
      alertLog,
      affectedUsersCount: affectedUsers.length
    };
  } catch (error) {
    logger.error('Error processing alert:', error);
    throw error;
  }
};

/**
 * Process alert from IoT device
 * @param {Object} deviceAlertData - Device alert data
 * @returns {Promise<Object>} - Processed alert
 */
export const processIoTAlert = async (deviceAlertData) => {
  const sourceDetails = {
    deviceId: deviceAlertData.deviceId,
    deviceType: deviceAlertData.deviceType,
    sensorData: deviceAlertData.sensorData || {}
  };

  return processAlert(deviceAlertData, 'iot', sourceDetails);
};

/**
 * Process alert from admin dashboard
 * @param {Object} adminAlertData - Admin alert data
 * @param {ObjectId} adminId - Admin user ID
 * @returns {Promise<Object>} - Processed alert
 */
export const processAdminAlert = async (adminAlertData, adminId) => {
  const sourceDetails = {
    triggeredBy: adminId,
    triggerMethod: 'admin_dashboard'
  };

  adminAlertData.triggeredBy = adminId;
  return processAlert(adminAlertData, 'admin', sourceDetails);
};

/**
 * Process alert from teacher mobile app
 * @param {Object} teacherAlertData - Teacher alert data
 * @param {ObjectId} teacherId - Teacher user ID
 * @returns {Promise<Object>} - Processed alert
 */
export const processTeacherAlert = async (teacherAlertData, teacherId) => {
  const sourceDetails = {
    triggeredBy: teacherId,
    triggerMethod: 'mobile_app',
    locationDetails: teacherAlertData.locationDetails || {}
  };

  teacherAlertData.triggeredBy = teacherId;
  return processAlert(teacherAlertData, 'teacher', sourceDetails);
};

/**
 * Process alert from AI hazard detection
 * @param {Object} aiAlertData - AI alert data
 * @returns {Promise<Object>} - Processed alert
 */
export const processAIAlert = async (aiAlertData) => {
  const sourceDetails = {
    confidence: aiAlertData.confidence || 0,
    detectionMethod: aiAlertData.detectionMethod || 'unknown',
    aiModel: aiAlertData.aiModel || 'unknown'
  };

  return processAlert(aiAlertData, 'ai', sourceDetails);
};

/**
 * Process alert from NDMA/IMD feed
 * @param {Object} ndmaAlertData - NDMA alert data
 * @returns {Promise<Object>} - Processed alert
 */
export const processNDMAAlert = async (ndmaAlertData) => {
  const sourceDetails = {
    capId: ndmaAlertData.capId || null,
    feedUrl: ndmaAlertData.feedUrl || null,
    geofenceMatch: ndmaAlertData.geofenceMatch || false,
    originalSeverity: ndmaAlertData.originalSeverity || null
  };

  return processAlert(ndmaAlertData, 'ndma', sourceDetails);
};

