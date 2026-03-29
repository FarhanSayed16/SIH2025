/**
 * Firebase Cloud Messaging Service
 * Handles sending push notifications via Firebase Admin SDK
 */

import admin from 'firebase-admin';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
import logger from '../config/logger.js';
import User from '../models/User.js';
import School from '../models/School.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin SDK
let firebaseAdminInitialized = false;

try {
  const serviceAccountPath = path.join(__dirname, '../../config/firebase-admin.json');
  const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'kavach-4a8aa',
  });
  
  firebaseAdminInitialized = true;
  logger.info('✅ Firebase Admin SDK initialized successfully');
} catch (error) {
  logger.warn('⚠️ Firebase Admin SDK initialization failed:', error.message);
  logger.warn('⚠️ Push notifications will not work until Firebase is configured');
}

/**
 * Send push notification to a single user
 * @param {string} fcmToken - User's FCM token
 * @param {object} notification - Notification payload
 * @param {object} data - Data payload
 */
export const sendNotificationToUser = async (fcmToken, notification, data = {}) => {
  if (!firebaseAdminInitialized) {
    logger.warn('Firebase Admin not initialized - skipping push notification');
    return { success: false, error: 'Firebase not configured' };
  }

  if (!fcmToken) {
    logger.warn('No FCM token provided - skipping push notification');
    return { success: false, error: 'No FCM token' };
  }

  try {
    const message = {
      token: fcmToken,
      notification: {
        title: notification.title || 'Kavach Alert',
        body: notification.body || '',
      },
      data: {
        ...data,
        type: data.type || 'alert',
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'kavach_alerts',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    const response = await admin.messaging().send(message);
    logger.info(`✅ Push notification sent successfully: ${response}`);
    return { success: true, messageId: response };
  } catch (error) {
    logger.error('❌ Failed to send push notification:', error);
    
    // Handle invalid token
    if (error.code === 'messaging/invalid-registration-token' || 
        error.code === 'messaging/registration-token-not-registered') {
      logger.warn(`Invalid FCM token - removing from user: ${fcmToken}`);
      // Optionally remove invalid token from user
      await User.updateOne(
        { deviceToken: fcmToken },
        { $unset: { deviceToken: 1 } }
      );
    }
    
    return { success: false, error: error.message };
  }
};

/**
 * Send push notification to multiple users
 * @param {string[]} fcmTokens - Array of FCM tokens
 * @param {object} notification - Notification payload
 * @param {object} data - Data payload
 */
export const sendNotificationToMultipleUsers = async (fcmTokens, notification, data = {}) => {
  if (!firebaseAdminInitialized) {
    logger.warn('Firebase Admin not initialized - skipping push notifications');
    return { success: false, error: 'Firebase not configured' };
  }

  if (!fcmTokens || fcmTokens.length === 0) {
    logger.warn('No FCM tokens provided - skipping push notifications');
    return { success: false, error: 'No FCM tokens' };
  }

  try {
    const message = {
      notification: {
        title: notification.title || 'Kavach Alert',
        body: notification.body || '',
      },
      data: {
        ...data,
        type: data.type || 'alert',
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'kavach_alerts',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    const response = await admin.messaging().sendEachForMulticast({
      tokens: fcmTokens,
      ...message,
    });

    logger.info(`✅ Push notifications sent: ${response.successCount} successful, ${response.failureCount} failed`);
    
    // Remove invalid tokens
    if (response.failureCount > 0) {
      const invalidTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          if (resp.error?.code === 'messaging/invalid-registration-token' ||
              resp.error?.code === 'messaging/registration-token-not-registered') {
            invalidTokens.push(fcmTokens[idx]);
          }
        }
      });

      if (invalidTokens.length > 0) {
        await User.updateMany(
          { deviceToken: { $in: invalidTokens } },
          { $unset: { deviceToken: 1 } }
        );
        logger.warn(`Removed ${invalidTokens.length} invalid FCM tokens`);
      }
    }

    return {
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
    };
  } catch (error) {
    logger.error('❌ Failed to send push notifications:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send push notification to all users in a school
 * @param {string} schoolId - School ID
 * @param {object} notification - Notification payload
 * @param {object} data - Data payload
 */
export const sendNotificationToSchool = async (schoolId, notification, data = {}) => {
  try {
    // Get all users in the school with FCM tokens
    const users = await User.find({
      institutionId: schoolId,
      deviceToken: { $exists: true, $ne: null },
      isActive: true,
    }).select('deviceToken');

    const fcmTokens = users
      .map(user => user.deviceToken)
      .filter(token => token != null);

    if (fcmTokens.length === 0) {
      logger.warn(`No FCM tokens found for school ${schoolId}`);
      return { success: false, error: 'No FCM tokens found' };
    }

    logger.info(`Sending push notification to ${fcmTokens.length} users in school ${schoolId}`);
    return await sendNotificationToMultipleUsers(fcmTokens, notification, data);
  } catch (error) {
    logger.error('Failed to send notification to school:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send push notification for crisis alert
 * @param {object} alert - Alert object
 */
export const sendCrisisAlertNotification = async (alert) => {
  const notification = {
    title: `🚨 ${alert.type.toUpperCase()} Alert`,
    body: alert.description || `Emergency alert: ${alert.type}`,
  };

  const data = {
    type: 'CRISIS_ALERT',
    alertId: alert._id.toString(),
    alertType: alert.type,
    severity: alert.severity,
    schoolId: alert.institutionId.toString(),
  };

  // Send to all users in the school
  return await sendNotificationToSchool(alert.institutionId, notification, data);
};

/**
 * Send push notification for drill scheduled
 * @param {object} drill - Drill object
 */
export const sendDrillScheduledNotification = async (drill) => {
  const school = await School.findById(drill.institutionId || drill.schoolId);
  const schoolName = school ? school.name : 'Your School';

  const notification = {
    title: '📅 Drill Scheduled',
    body: `${drill.type.toUpperCase()} drill scheduled for ${new Date(drill.scheduledAt).toLocaleString()}`,
  };

  const data = {
    type: 'DRILL_SCHEDULED',
    drillId: drill._id.toString(),
    drillType: drill.type,
    scheduledAt: drill.scheduledAt.toISOString(),
    schoolId: (drill.institutionId || drill.schoolId).toString(),
  };

  return await sendNotificationToSchool(drill.institutionId || drill.schoolId, notification, data);
};

/**
 * Send push notification when drill starts
 * Phase 1: Enhanced drill notification system
 * @param {object} drill - Drill object
 */
export const sendDrillStartNotification = async (drill) => {
  try {
    const schoolId = drill.institutionId?.toString() || drill.schoolId?.toString();
    if (!schoolId) {
      logger.warn('No institution ID found for drill notification');
      return { success: false, error: 'No institution ID' };
    }

    // Get all participant user IDs
    const participantIds = drill.participants?.map(p => p.userId?.toString() || p.userId) || [];
    
    if (participantIds.length === 0) {
      logger.warn(`No participants found for drill ${drill._id}`);
      return { success: false, error: 'No participants' };
    }

    // Get FCM tokens for all participants
    const users = await User.find({
      _id: { $in: participantIds },
      deviceToken: { $exists: true, $ne: null },
      isActive: true,
    }).select('deviceToken name');

    const fcmTokens = users
      .map(user => user.deviceToken)
      .filter(token => token != null);

    if (fcmTokens.length === 0) {
      logger.warn(`No FCM tokens found for drill ${drill._id} participants`);
      return { success: false, error: 'No FCM tokens found' };
    }

    const drillTypeName = drill.type.charAt(0).toUpperCase() + drill.type.slice(1);
    const notification = {
      title: '🚨 Drill Started',
      body: `A ${drillTypeName} drill has started. Please acknowledge your participation.`,
    };

    const data = {
      type: 'drill_start',
      drillId: drill._id.toString(),
      drillType: drill.type,
      startTime: drill.actualStart?.toISOString() || new Date().toISOString(),
      duration: drill.duration?.toString() || '10',
      schoolId: schoolId,
    };

    logger.info(`Sending drill start notification to ${fcmTokens.length} participants for drill ${drill._id}`);
    return await sendNotificationToMultipleUsers(fcmTokens, notification, data);
  } catch (error) {
    logger.error('Failed to send drill start notification:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send push notification when drill ends
 * Phase 1: Enhanced drill notification system
 * @param {object} drill - Drill object with summary
 */
export const sendDrillEndNotification = async (drill) => {
  try {
    const schoolId = drill.institutionId?.toString() || drill.schoolId?.toString();
    if (!schoolId) {
      logger.warn('No institution ID found for drill end notification');
      return { success: false, error: 'No institution ID' };
    }

    // Get all participant user IDs
    const participantIds = drill.participants?.map(p => p.userId?.toString() || p.userId) || [];
    
    if (participantIds.length === 0) {
      logger.warn(`No participants found for drill ${drill._id}`);
      return { success: false, error: 'No participants' };
    }

    // Get FCM tokens for all participants
    const users = await User.find({
      _id: { $in: participantIds },
      deviceToken: { $exists: true, $ne: null },
      isActive: true,
    }).select('deviceToken name');

    const fcmTokens = users
      .map(user => user.deviceToken)
      .filter(token => token != null);

    if (fcmTokens.length === 0) {
      logger.warn(`No FCM tokens found for drill ${drill._id} participants`);
      return { success: false, error: 'No FCM tokens found' };
    }

    const drillTypeName = drill.type.charAt(0).toUpperCase() + drill.type.slice(1);
    const participationRate = drill.results?.participationRate || 0;
    
    const notification = {
      title: '✅ Drill Completed',
      body: `The ${drillTypeName} drill has ended. Participation: ${participationRate}%`,
    };

    const data = {
      type: 'drill_end',
      drillId: drill._id.toString(),
      drillType: drill.type,
      endTime: drill.completedAt?.toISOString() || new Date().toISOString(),
      participationRate: participationRate.toString(),
      schoolId: schoolId,
    };

    logger.info(`Sending drill end notification to ${fcmTokens.length} participants for drill ${drill._id}`);
    return await sendNotificationToMultipleUsers(fcmTokens, notification, data);
  } catch (error) {
    logger.error('Failed to send drill end notification:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Phase 3: Send student activity notification
 * @param {string} studentId - Student user ID
 * @param {object} activity - Activity data
 * @param {array} parentIds - Array of parent IDs to notify
 * @param {array} teacherIds - Array of teacher IDs to notify
 */
export const sendStudentActivityNotification = async (studentId, activity, parentIds = [], teacherIds = []) => {
  try {
    const User = (await import('../models/User.js')).default;
    const student = await User.findById(studentId).select('name email');
    
    if (!student) {
      logger.warn(`Student ${studentId} not found for activity notification`);
      return { success: false, error: 'Student not found' };
    }

    // Get notification payload based on activity type
    const notificationTemplates = {
      module_complete: {
        title: 'Module Completed! 🎉',
        body: `${student.name} completed the module: ${activity.activityData?.moduleName || 'Module'}`
      },
      quiz_complete: {
        title: 'Quiz Completed! 📝',
        body: `${student.name} completed a quiz with score: ${activity.activityData?.quizScore || 0}/${activity.activityData?.quizTotalQuestions || 0}`
      },
      game_complete: {
        title: 'Game Completed! 🎮',
        body: `${student.name} completed the game: ${activity.activityData?.gameName || 'Game'}`
      },
      badge_earned: {
        title: 'Badge Earned! 🏆',
        body: `${student.name} earned a new badge: ${activity.activityData?.badgeName || 'Badge'}`
      },
      xp_milestone: {
        title: 'XP Milestone! ⭐',
        body: `${student.name} reached ${activity.activityData?.totalXP || 0} XP!`
      },
      progress_update: {
        title: 'Progress Update 📈',
        body: `${student.name}'s preparedness score: ${activity.activityData?.preparednessScore || 0}%`
      },
      safety_status_change: {
        title: 'Safety Status Alert! 🚨',
        body: `${student.name}'s safety status changed to: ${activity.activityData?.safetyStatus || 'Unknown'}`
      },
      drill_participation: {
        title: 'Drill Participation 🚨',
        body: `${student.name} is participating in a drill`
      },
      drill_complete: {
        title: 'Drill Completed ✅',
        body: `${student.name} completed the drill`
      }
    };

    const template = notificationTemplates[activity.activityType] || {
      title: 'Activity Update',
      body: `${student.name} performed an activity`
    };

    const notification = template;
    const data = {
      type: 'student_activity',
      activityType: activity.activityType,
      studentId: studentId.toString(),
      activityId: activity._id.toString(),
      timestamp: activity.createdAt.toISOString(),
      ...activity.activityData
    };

    // Get FCM tokens for parents
    const parents = await User.find({
      _id: { $in: parentIds },
      deviceToken: { $exists: true, $ne: null }
    }).select('deviceToken');

    // Get FCM tokens for teachers
    const teachers = await User.find({
      _id: { $in: teacherIds },
      deviceToken: { $exists: true, $ne: null }
    }).select('deviceToken');

    const allTokens = [
      ...parents.map(p => p.deviceToken),
      ...teachers.map(t => t.deviceToken)
    ].filter(Boolean);

    if (allTokens.length === 0) {
      logger.warn(`No FCM tokens found for activity notification (student: ${studentId})`);
      return { success: false, error: 'No FCM tokens found' };
    }

    logger.info(`Sending activity notification to ${allTokens.length} devices for student ${studentId}`);
    return await sendNotificationToMultipleUsers(allTokens, notification, data);
  } catch (error) {
    logger.error('Failed to send student activity notification:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Phase 3: Send parent QR code scanned notification
 * @param {string} parentId - Parent user ID
 * @param {object} scanData - QR code scan data
 */
export const sendQRCodeScannedNotification = async (parentId, scanData) => {
  try {
    const User = (await import('../models/User.js')).default;
    const parent = await User.findById(parentId).select('deviceToken name');
    const scanner = await User.findById(scanData.scannedBy).select('name role');

    if (!parent || !parent.deviceToken) {
      logger.warn(`No FCM token found for parent ${parentId}`);
      return { success: false, error: 'No FCM token' };
    }

    const notification = {
      title: 'QR Code Scanned 📱',
      body: `Your QR code was scanned by ${scanner?.name || 'Teacher'} for verification`
    };

    const data = {
      type: 'qr_code_scanned',
      qrCodeId: scanData.qrCodeId?.toString(),
      scannedBy: scanData.scannedBy.toString(),
      scannedByName: scanner?.name,
      scannedByRole: scanner?.role,
      studentId: scanData.studentId?.toString(),
      verified: scanData.verified || false,
      timestamp: new Date().toISOString()
    };

    logger.info(`Sending QR code scanned notification to parent ${parentId}`);
    return await sendNotificationToUser(parent.deviceToken, notification, data);
  } catch (error) {
    logger.error('Failed to send QR code scanned notification:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Phase 3: Send parent verification approved notification
 * @param {string} parentId - Parent user ID
 * @param {object} verificationData - Verification data
 */
export const sendParentVerificationApprovedNotification = async (parentId, verificationData) => {
  try {
    const User = (await import('../models/User.js')).default;
    const parent = await User.findById(parentId).select('deviceToken name');
    const student = await User.findById(verificationData.studentId).select('name');

    if (!parent || !parent.deviceToken) {
      logger.warn(`No FCM token found for parent ${parentId}`);
      return { success: false, error: 'No FCM token' };
    }

    const notification = {
      title: 'Verification Approved ✅',
      body: `Your relationship with ${student?.name || 'your child'} has been verified`
    };

    const data = {
      type: 'parent_verification_approved',
      studentId: verificationData.studentId.toString(),
      studentName: student?.name,
      verifiedBy: verificationData.verifiedBy?.toString(),
      verificationMethod: verificationData.verificationMethod || 'qr_scan',
      timestamp: new Date().toISOString()
    };

    logger.info(`Sending verification approved notification to parent ${parentId}`);
    return await sendNotificationToUser(parent.deviceToken, notification, data);
  } catch (error) {
    logger.error('Failed to send verification approved notification:', error);
    return { success: false, error: error.message };
  }
};

export default {
  sendNotificationToUser,
  sendNotificationToMultipleUsers,
  sendNotificationToSchool,
  sendCrisisAlertNotification,
  sendDrillScheduledNotification,
  sendDrillStartNotification,
  sendDrillEndNotification,
  sendStudentActivityNotification,
  sendQRCodeScannedNotification,
  sendParentVerificationApprovedNotification,
  isInitialized: () => firebaseAdminInitialized,
};

