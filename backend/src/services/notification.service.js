/**
 * Phase 201: Notification Service
 * Handles FCM push notifications for IoT alerts
 */

import admin from 'firebase-admin';
import logger from '../config/logger.js';
import User from '../models/User.js';

// Initialize Firebase Admin if not already initialized
let firebaseAdminInitialized = false;

if (!admin.apps.length) {
  try {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (serviceAccount) {
      const serviceAccountJson = JSON.parse(serviceAccount);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccountJson),
      });
      firebaseAdminInitialized = true;
      logger.info('Firebase Admin initialized for notifications');
    } else {
      logger.warn('FIREBASE_SERVICE_ACCOUNT not set, FCM notifications disabled');
    }
  } catch (error) {
    logger.error('Failed to initialize Firebase Admin:', error);
  }
} else {
  firebaseAdminInitialized = true;
}

/**
 * Send FCM notification for IoT device alerts
 * @param {Object} alertData - Alert data
 * @param {string} alertData.institutionId - Institution ID
 * @param {string} alertData.alertId - Alert ID
 * @param {string} alertData.alertType - Alert type (fire, flood, earthquake)
 * @param {string} alertData.severity - Alert severity (low, medium, high, critical)
 * @param {string} alertData.deviceId - Device ID
 * @param {string} alertData.deviceName - Device name
 * @param {string} alertData.deviceType - Device type
 * @param {string} alertData.room - Room location
 * @param {Object} alertData.sensorData - Sensor data
 * @param {string} alertData.message - Alert message
 */
export async function sendIoTAlertNotification(alertData) {
  if (!firebaseAdminInitialized || !admin.apps.length) {
    logger.warn('Firebase Admin not initialized, skipping FCM notification');
    return;
  }

  try {
    const {
      institutionId,
      alertId,
      alertType,
      severity,
      deviceId,
      deviceName,
      deviceType,
      room,
      sensorData,
      message,
    } = alertData;

    // Build notification title and body
    let title = '';
    let body = '';
    
    switch (alertType.toLowerCase()) {
      case 'fire':
        title = '🔥 Fire Detected!';
        body = `Fire detected at ${deviceName}${room ? ` (${room})` : ''}. Immediate action required!`;
        break;
      case 'flood':
        title = '🌊 Flood Alert!';
        const waterLevel = sensorData?.water;
        body = `Flood alert at ${deviceName}${room ? ` (${room})` : ''}${waterLevel ? ` - Water Level: ${waterLevel}` : ''}`;
        break;
      case 'earthquake':
        title = '⚠️ Earthquake Detected!';
        const magnitude = sensorData?.magnitude;
        body = `Earthquake detected at ${deviceName}${room ? ` (${room})` : ''}${magnitude ? ` - Magnitude: ${magnitude.toFixed(2)}G` : ''}`;
        break;
      default:
        title = '⚠️ Device Alert';
        body = message || `Alert from ${deviceName}`;
    }

    // Fetch all active users in the institution who have FCM tokens
    const users = await User.find({
      institutionId,
      deviceToken: { $exists: true, $ne: null },
      isActive: true,
    }).select('deviceToken role name');

    const fcmTokens = users
      .map((u) => u.deviceToken)
      .filter((token) => !!token);

    if (fcmTokens.length === 0) {
      logger.warn(`No FCM tokens found for institution ${institutionId}, skipping IoT alert push`);
      return;
    }

    // Build FCM message for multicast (tokens)
    const fcmMessage = {
      tokens: fcmTokens,
      notification: {
        title,
        body,
      },
      data: {
        type: 'iot_alert',
        alertId: alertId.toString(),
        alertType: alertType.toLowerCase(),
        severity: severity.toLowerCase(),
        deviceId,
        deviceName,
        deviceType: deviceType || 'multi-sensor',
        room: room || '',
        institutionId: institutionId.toString(),
        screen: 'iotDetail',
        screenId: deviceId,
        timestamp: new Date().toISOString(),
      },
      android: {
        priority: severity === 'critical' || alertType === 'fire' ? 'high' : 'normal',
        notification: {
          sound: 'default',
          channelId: 'iot_alerts',
          priority: severity === 'critical' || alertType === 'fire' ? 'high' : 'default',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
            priority: severity === 'critical' || alertType === 'fire' ? 10 : 5,
          },
        },
      },
    };

    // Send notification
    const response = await admin.messaging().sendEachForMulticast(fcmMessage);
    logger.info(
      `FCM notification sent for IoT alert ${alertId}: ${response.successCount} success, ${response.failureCount} failed`
    );

    return response;
  } catch (error) {
    logger.error('Error sending FCM notification for IoT alert:', error);
    throw error;
  }
}

/**
 * Send FCM notification to specific user tokens
 * @param {string[]} tokens - FCM device tokens
 * @param {Object} notification - Notification data
 */
export async function sendToTokens(tokens, notification) {
  if (!firebaseAdminInitialized || !admin.apps.length || !tokens || tokens.length === 0) {
    return;
  }

  try {
    const message = {
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: notification.data || {},
      tokens,
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    logger.info(`FCM notification sent to ${response.successCount} devices`);
    return response;
  } catch (error) {
    logger.error('Error sending FCM notification to tokens:', error);
    throw error;
  }
}

// Exports are done via export statements above

