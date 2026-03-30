/**
 * Parent Notification Service
 * Handles creation and management of parent notifications
 * Parent Monitoring System - Phase 4 Complete
 */

import logger from '../config/logger.js';
import ParentNotification from '../models/ParentNotification.js';

/**
 * Create a notification for parents
 * @param {string} parentId - Parent user ID
 * @param {string} type - Notification type
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {Object} data - Additional data
 * @returns {Promise<Object>} Created notification
 */
export const createNotification = async (parentId, type, title, message, data = {}) => {
  try {
    const notification = new ParentNotification({
      parentId,
      studentId: data.studentId || null,
      type,
      title,
      message,
      data,
      read: false,
      priority: data.priority || 'normal'
    });

    await notification.save();

    logger.info(`Notification created for parent ${parentId}: ${type} - ${title}`);
    return notification.toObject();
  } catch (error) {
    logger.error('Create notification error:', error);
    throw error;
  }
};

/**
 * Create drill notification for parents
 * @param {string} studentId - Student user ID
 * @param {string} drillId - Drill ID
 * @param {string} status - Drill status ('started', 'completed', 'missed')
 * @param {Object} drillData - Drill information
 * @returns {Promise<Array>} Array of created notifications
 */
export const createDrillNotification = async (studentId, drillId, status, drillData = {}) => {
  try {
    // Dynamic import to avoid circular dependencies
    const ParentStudentRel = (await import('../models/ParentStudentRelationship.js')).default;
    // Find all verified parents for this student
    const relationships = await ParentStudentRel.findVerifiedByStudent(studentId);
    const parentIds = relationships.map(rel => rel.parentId.toString());

    const notifications = [];
    for (const parentId of parentIds) {
      let title, message;
      
      switch (status) {
        case 'started':
          title = 'Drill Started';
          message = `A ${drillData.type || 'safety'} drill has started for your child.`;
          break;
        case 'completed':
          title = 'Drill Completed';
          message = `Your child has completed the ${drillData.type || 'safety'} drill.`;
          break;
        case 'missed':
          title = 'Drill Missed';
          message = `Your child missed the ${drillData.type || 'safety'} drill.`;
          break;
        default:
          title = 'Drill Update';
          message = `Update on your child's drill participation.`;
      }

      const notification = await createNotification(
        parentId,
        'drill',
        title,
        message,
        {
          studentId,
          drillId,
          status,
          drillType: drillData.type,
          drillDate: drillData.date || new Date()
        }
      );
      notifications.push(notification);
    }

    return notifications;
  } catch (error) {
    logger.error('Create drill notification error:', error);
    throw error;
  }
};

/**
 * Create achievement notification for parents
 * @param {string} studentId - Student user ID
 * @param {string} achievementType - Type of achievement
 * @param {string} achievementTitle - Achievement title
 * @param {Object} achievementData - Achievement details
 * @returns {Promise<Array>} Array of created notifications
 */
export const createAchievementNotification = async (studentId, achievementType, achievementTitle, achievementData = {}) => {
  try {
    // Dynamic import to avoid circular dependencies
    const ParentStudentRel = (await import('../models/ParentStudentRelationship.js')).default;
    // Find all verified parents for this student
    const relationships = await ParentStudentRel.findVerifiedByStudent(studentId);
    const parentIds = relationships.map(rel => rel.parentId.toString());

    const notifications = [];
    for (const parentId of parentIds) {
      const notification = await createNotification(
        parentId,
        'achievement',
        'Achievement Unlocked! 🎉',
        `Your child has achieved: ${achievementTitle}`,
        {
          studentId,
          achievementType,
          achievementTitle,
          ...achievementData
        }
      );
      notifications.push(notification);
    }

    return notifications;
  } catch (error) {
    logger.error('Create achievement notification error:', error);
    throw error;
  }
};

/**
 * Create attendance alert for parents
 * @param {string} studentId - Student user ID
 * @param {string} status - Attendance status ('absent', 'late', 'excused')
 * @param {Date} date - Attendance date
 * @returns {Promise<Array>} Array of created notifications
 */
export const createAttendanceAlert = async (studentId, status, date) => {
  try {
    // Dynamic import to avoid circular dependencies
    const ParentStudentRel = (await import('../models/ParentStudentRelationship.js')).default;
    // Find all verified parents for this student
    const relationships = await ParentStudentRel.findVerifiedByStudent(studentId);
    const parentIds = relationships.map(rel => rel.parentId.toString());

    let title, message;
    switch (status) {
      case 'absent':
        title = 'Absence Alert';
        message = 'Your child was marked absent today.';
        break;
      case 'late':
        title = 'Late Arrival Alert';
        message = 'Your child arrived late to school today.';
        break;
      case 'excused':
        title = 'Excused Absence';
        message = 'Your child\'s absence has been excused.';
        break;
      default:
        title = 'Attendance Update';
        message = 'Update on your child\'s attendance.';
    }

    const notifications = [];
    for (const parentId of parentIds) {
      const notification = await createNotification(
        parentId,
        'attendance',
        title,
        message,
        {
          studentId,
          status,
          date
        }
      );
      notifications.push(notification);
    }

    return notifications;
  } catch (error) {
    logger.error('Create attendance alert error:', error);
    throw error;
  }
};

/**
 * Create emergency alert for parents
 * @param {string} studentId - Student user ID
 * @param {string} alertType - Alert type ('drill_active', 'emergency', 'safety_concern')
 * @param {string} message - Alert message
 * @param {Object} alertData - Additional alert data
 * @returns {Promise<Array>} Array of created notifications
 */
export const createEmergencyAlert = async (studentId, alertType, message, alertData = {}) => {
  try {
    // Dynamic import to avoid circular dependencies
    const ParentStudentRel = (await import('../models/ParentStudentRelationship.js')).default;
    // Find all verified parents for this student
    const relationships = await ParentStudentRel.findVerifiedByStudent(studentId);
    const parentIds = relationships.map(rel => rel.parentId.toString());

    let title;
    switch (alertType) {
      case 'drill_active':
        title = '🚨 Active Drill';
        break;
      case 'emergency':
        title = '🚨 Emergency Alert';
        break;
      case 'safety_concern':
        title = '⚠️ Safety Concern';
        break;
      default:
        title = 'Alert';
    }

    const notifications = [];
    for (const parentId of parentIds) {
      const notification = await createNotification(
        parentId,
        'emergency',
        title,
        message,
        {
          studentId,
          alertType,
          ...alertData
        }
      );
      notifications.push(notification);
    }

    return notifications;
  } catch (error) {
    logger.error('Create emergency alert error:', error);
    throw error;
  }
};

/**
 * Get all notifications for a parent
 * @param {string} parentId - Parent user ID
 * @param {Object} filters - Filter options (type, read, limit)
 * @returns {Promise<Array>} Array of notifications
 */
export const getParentNotifications = async (parentId, filters = {}) => {
  try {
    const query = { parentId };

    // Apply filters
    if (filters.type) {
      query.type = filters.type;
    }
    if (filters.read !== undefined) {
      query.read = filters.read;
    }
    if (filters.studentId) {
      query.studentId = filters.studentId;
    }

    let queryBuilder = ParentNotification.find(query)
      .sort({ createdAt: -1 })
      .lean();

    // Apply limit
    if (filters.limit) {
      queryBuilder = queryBuilder.limit(filters.limit);
    }

    const parentNotifications = await queryBuilder;
    return parentNotifications;
  } catch (error) {
    logger.error('Get parent notifications error:', error);
    throw error;
  }
};

/**
 * Mark notification as read
 * @param {string} parentId - Parent user ID
 * @param {string} notificationId - Notification ID
 * @returns {Promise<Object>} Updated notification
 */
export const markNotificationAsRead = async (parentId, notificationId) => {
  try {
    const notification = await ParentNotification.findOne({
      _id: notificationId,
      parentId
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    await notification.markAsRead();
    return notification.toObject();
  } catch (error) {
    logger.error('Mark notification as read error:', error);
    throw error;
  }
};

/**
 * Mark all notifications as read for a parent
 * @param {string} parentId - Parent user ID
 * @returns {Promise<number>} Number of notifications marked as read
 */
export const markAllNotificationsAsRead = async (parentId) => {
  try {
    const result = await ParentNotification.markAllAsRead(parentId);
    return result.modifiedCount || 0;
  } catch (error) {
    logger.error('Mark all notifications as read error:', error);
    throw error;
  }
};

