/**
 * Event Broadcasting Service
 * Broadcasts student activities and events to parents and teachers via Socket.io and FCM
 * Phase 1: Backend Foundation
 */

import { getSocketIO } from '../config/socket.js';
import { 
  sendNotificationToUser, 
  sendNotificationToMultipleUsers,
  sendStudentActivityNotification,
  sendQRCodeScannedNotification,
  sendParentVerificationApprovedNotification
} from './fcm.service.js';
import { getNotificationRecipients } from './activity-tracking.service.js';
import { markActivityNotified } from './activity-tracking.service.js';
import {
  SERVER_EVENTS,
  createStudentActivityUpdateEvent,
  createStudentProgressUpdateEvent,
  createParentVerificationRequestEvent,
  createQRCodeScannedEvent
} from '../socket/events.js';
import StudentActivityLog from '../models/StudentActivityLog.js';
import User from '../models/User.js';
import logger from '../config/logger.js';

/**
 * Get notification payload for activity type
 * @param {Object} activityLog - Activity log document
 * @returns {Object} Notification payload
 */
const getNotificationPayload = (activityLog) => {
  const { activityType, activityData, student } = activityLog;
  const studentName = student?.name || activityData?.metadata?.studentName || 'Student';

  const notificationTemplates = {
    module_complete: {
      title: 'Module Completed! 🎉',
      body: `${studentName} completed the module: ${activityData?.moduleName || 'Module'}`
    },
    quiz_complete: {
      title: 'Quiz Completed! 📝',
      body: `${studentName} completed a quiz with score: ${activityData?.quizScore || 0}/${activityData?.quizTotalQuestions || 0}`
    },
    game_complete: {
      title: 'Game Completed! 🎮',
      body: `${studentName} completed the game: ${activityData?.gameName || 'Game'}`
    },
    badge_earned: {
      title: 'Badge Earned! 🏆',
      body: `${studentName} earned a new badge: ${activityData?.badgeName || 'Badge'}`
    },
    xp_milestone: {
      title: 'XP Milestone! ⭐',
      body: `${studentName} reached ${activityData?.totalXP || 0} XP!`
    },
    progress_update: {
      title: 'Progress Update 📈',
      body: `${studentName}'s preparedness score: ${activityData?.preparednessScore || 0}%`
    },
    safety_status_change: {
      title: 'Safety Status Alert! 🚨',
      body: `${studentName}'s safety status changed to: ${activityData?.safetyStatus || 'Unknown'}`
    },
    drill_participation: {
      title: 'Drill Participation 🚨',
      body: `${studentName} is participating in a drill`
    },
    drill_complete: {
      title: 'Drill Completed ✅',
      body: `${studentName} completed the drill`
    },
    location_update: {
      title: 'Location Update 📍',
      body: `${studentName}'s location has been updated`
    }
  };

  const template = notificationTemplates[activityType] || {
    title: 'Activity Update',
    body: `${studentName} performed an activity`
  };

  return {
    notification: template,
    data: {
      type: 'student_activity',
      activityType,
      studentId: activityLog.studentId.toString(),
      activityId: activityLog._id.toString(),
      timestamp: activityLog.createdAt.toISOString(),
      ...activityData
    }
  };
};

/**
 * Broadcast student activity via Socket.io
 * @param {Object} activityLog - Activity log document
 * @param {Array} parentIds - Array of parent IDs
 * @param {Array} teacherIds - Array of teacher IDs
 */
export const broadcastStudentActivity = async (activityLog, parentIds = [], teacherIds = []) => {
  try {
    const io = getSocketIO();
    if (!io) {
      logger.warn('Socket.io not available for activity broadcast');
      return;
    }

    const notificationPayload = getNotificationPayload(activityLog);

    // Create Socket.io event payload
    const activityEvent = createStudentActivityUpdateEvent(activityLog);

    // Broadcast to parents
    for (const parentId of parentIds) {
      const parent = await User.findById(parentId).select('deviceToken');
      if (parent) {
        io.to(`user:${parentId}`).emit(SERVER_EVENTS.STUDENT_ACTIVITY_UPDATE, activityEvent);
        io.to(`user:${parentId}`).emit(SERVER_EVENTS.PARENT_NOTIFICATION, {
          ...notificationPayload,
          studentId: activityLog.studentId.toString()
        });
      }
    }

    // Broadcast to teachers
    for (const teacherId of teacherIds) {
      io.to(`user:${teacherId}`).emit(SERVER_EVENTS.STUDENT_ACTIVITY_UPDATE, activityEvent);
      io.to(`user:${teacherId}`).emit(SERVER_EVENTS.TEACHER_NOTIFICATION, {
        ...notificationPayload,
        studentId: activityLog.studentId.toString(),
        classId: activityLog.classId?.toString()
      });
    }

    // Also broadcast to class room if classId exists
    if (activityLog.classId) {
      io.to(`class:${activityLog.classId}`).emit(SERVER_EVENTS.CLASS_ACTIVITY_UPDATE, {
        ...activityEvent,
        classId: activityLog.classId.toString()
      });
    }

    // Mark as socket sent
    await activityLog.markNotificationSent('socket', [...parentIds, ...teacherIds]);

    logger.info(`Activity broadcasted via Socket.io: ${activityLog.activityType} for student ${activityLog.studentId}`);
  } catch (error) {
    logger.error('Error broadcasting student activity via Socket.io:', error);
  }
};

/**
 * Send FCM push notifications for student activity
 * @param {Object} activityLog - Activity log document
 * @param {Array} parentIds - Array of parent IDs
 * @param {Array} teacherIds - Array of teacher IDs
 */
export const sendActivityNotifications = async (activityLog, parentIds = [], teacherIds = []) => {
  try {
    const notificationPayload = getNotificationPayload(activityLog);

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
      logger.warn('No FCM tokens found for activity notification');
      return;
    }

    // Send bulk notifications using the new FCM service function
    const results = await sendStudentActivityNotification(
      activityLog.studentId.toString(),
      activityLog,
      parentIds,
      teacherIds
    );

    // Mark as FCM sent
    const notifiedUserIds = [
      ...parents.map(p => p._id),
      ...teachers.map(t => t._id)
    ];

    await activityLog.markNotificationSent('fcm', notifiedUserIds);

    logger.info(`FCM notifications sent: ${activityLog.activityType} to ${allTokens.length} devices`);
    return results;
  } catch (error) {
    logger.error('Error sending FCM notifications:', error);
    throw error;
  }
};

/**
 * Notify parents about student activity
 * @param {string} studentId - Student user ID
 * @param {Object} notification - Notification object
 */
export const notifyParents = async (studentId, notification) => {
  try {
    const { parentIds } = await getNotificationRecipients(studentId);

    if (parentIds.length === 0) {
      logger.warn(`No parents found to notify for student ${studentId}`);
      return;
    }

    // Get parent FCM tokens
    const parents = await User.find({
      _id: { $in: parentIds },
      deviceToken: { $exists: true, $ne: null }
    }).select('deviceToken _id');

    const tokens = parents.map(p => p.deviceToken).filter(Boolean);

    if (tokens.length > 0) {
      await sendNotificationToMultipleUsers(tokens, notification.notification || {}, notification.data || {});
      logger.info(`Notified ${tokens.length} parents about student ${studentId}`);
    }

    // Also broadcast via Socket.io
    const io = getSocketIO();
    if (io) {
      for (const parentId of parentIds) {
        io.to(`user:${parentId}`).emit('parent_notification', {
          studentId,
          ...notification
        });
      }
    }
  } catch (error) {
    logger.error('Error notifying parents:', error);
    throw error;
  }
};

/**
 * Notify teachers about student activity
 * @param {string} classId - Class ID
 * @param {Object} notification - Notification object
 */
export const notifyTeachers = async (classId, notification) => {
  try {
    const Class = (await import('../models/Class.js')).default;
    const classData = await Class.findById(classId).populate('teacherId');

    if (!classData || !classData.teacherId) {
      logger.warn(`No teacher found for class ${classId}`);
      return;
    }

    const teacherId = classData.teacherId._id;

    // Get teacher FCM token
    const teacher = await User.findById(teacherId).select('deviceToken');

    if (teacher && teacher.deviceToken) {
      await sendNotificationToUser(
        teacher.deviceToken,
        notification.notification || {},
        notification.data || {}
      );
      logger.info(`Notified teacher ${teacherId} about class ${classId}`);
    }

    // Also broadcast via Socket.io
    const io = getSocketIO();
    if (io) {
      io.to(`user:${teacherId}`).emit('teacher_notification', {
        classId,
        ...notification
      });

      // Also broadcast to class room
      io.to(`class:${classId}`).emit('class_notification', {
        ...notification
      });
    }
  } catch (error) {
    logger.error('Error notifying teachers:', error);
    throw error;
  }
};

/**
 * Broadcast student progress update
 * @param {string} studentId - Student user ID
 * @param {Object} progressData - Progress data
 */
export const broadcastProgressUpdate = async (studentId, progressData) => {
  try {
    const { parentIds, teacherIds } = await getNotificationRecipients(studentId);

    const io = getSocketIO();
    if (io) {
      const progressEvent = createStudentProgressUpdateEvent(studentId, progressData);

      // Broadcast to parents
      for (const parentId of parentIds) {
        io.to(`user:${parentId}`).emit(SERVER_EVENTS.STUDENT_PROGRESS_UPDATE, progressEvent);
      }

      // Broadcast to teachers
      for (const teacherId of teacherIds) {
        io.to(`user:${teacherId}`).emit(SERVER_EVENTS.STUDENT_PROGRESS_UPDATE, progressEvent);
      }
    }

    logger.info(`Progress update broadcasted for student ${studentId}`);
  } catch (error) {
    logger.error('Error broadcasting progress update:', error);
    throw error;
  }
};

/**
 * Process activity log and send notifications
 * This is the main function to call after tracking an activity
 * @param {string} activityLogId - Activity log ID
 */
export const processActivityNotification = async (activityLogId) => {
  try {
    const activityLog = await StudentActivityLog.findById(activityLogId)
      .populate('student', 'name email grade section');

    if (!activityLog) {
      throw new Error('Activity log not found');
    }

    // Get notification recipients
    const { parentIds, teacherIds } = await getNotificationRecipients(activityLog.studentId);

    if (parentIds.length === 0 && teacherIds.length === 0) {
      logger.warn(`No recipients found for activity ${activityLogId}`);
      return;
    }

    // Broadcast via Socket.io (real-time)
    await broadcastStudentActivity(activityLog, parentIds, teacherIds);

    // Send FCM push notifications (for mobile apps)
    // Only send for high/critical priority activities
    if (activityLog.priority === 'high' || activityLog.priority === 'critical') {
      await sendActivityNotifications(activityLog, parentIds, teacherIds);
    } else {
      // For normal priority, still send but use the new service function
      await sendStudentActivityNotification(
        activityLog.studentId.toString(),
        activityLog,
        parentIds,
        teacherIds
      );
    }

    // Mark activity as notified
    await markActivityNotified(activityLogId, parentIds, teacherIds);

    logger.info(`Activity ${activityLogId} processed and notifications sent`);
  } catch (error) {
    logger.error('Error processing activity notification:', error);
    throw error;
  }
};

export default {
  broadcastStudentActivity,
  sendActivityNotifications,
  notifyParents,
  notifyTeachers,
  broadcastProgressUpdate,
  processActivityNotification
};

