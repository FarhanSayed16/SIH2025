/**
 * Activity Tracking Service
 * Tracks student activities and triggers notifications to parents and teachers
 * Phase 1: Backend Foundation
 */

import StudentActivityLog from '../models/StudentActivityLog.js';
import User from '../models/User.js';
import Class from '../models/Class.js';
import ParentStudentRelationship from '../models/ParentStudentRelationship.js';
import logger from '../config/logger.js';

/**
 * Determine priority level based on activity type
 * @param {string} activityType - Type of activity
 * @returns {string} Priority level
 */
const getActivityPriority = (activityType) => {
  const criticalActivities = [
    'safety_status_change',
    'location_update'
  ];
  
  const highPriorityActivities = [
    'module_complete',
    'quiz_complete',
    'badge_earned',
    'xp_milestone',
    'drill_participation',
    'drill_complete'
  ];
  
  if (criticalActivities.includes(activityType)) {
    return 'critical';
  } else if (highPriorityActivities.includes(activityType)) {
    return 'high';
  }
  
  return 'normal';
};

/**
 * Track student activity
 * @param {string} studentId - Student user ID
 * @param {string} activityType - Type of activity
 * @param {Object} activityData - Activity data
 * @returns {Promise<Object>} Created activity log
 */
export const trackStudentActivity = async (studentId, activityType, activityData = {}) => {
  try {
    // Verify student exists
    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      throw new Error('Student not found');
    }

    // Get student's class
    const classId = student.classId || null;

    // Determine priority
    const priority = getActivityPriority(activityType);

    // Create activity log
    const activityLog = await StudentActivityLog.create({
      studentId,
      classId,
      activityType,
      activityData: {
        ...activityData,
        // Add metadata
        metadata: {
          studentName: student.name,
          studentEmail: student.email,
          grade: student.grade,
          section: student.section
        }
      },
      priority,
      notifiedParents: [],
      notifiedTeachers: [],
      notificationStatus: {
        fcmSent: false,
        socketSent: false,
        emailSent: false,
        notificationCount: 0
      }
    });

    logger.info(`Activity tracked: ${activityType} for student ${studentId} (priority: ${priority})`);

    return activityLog;
  } catch (error) {
    logger.error('Error tracking student activity:', error);
    throw error;
  }
};

/**
 * Get parents and teachers to notify for a student activity
 * @param {string} studentId - Student user ID
 * @returns {Promise<Object>} Object with parentIds and teacherIds arrays
 */
export const getNotificationRecipients = async (studentId) => {
  try {
    // Get verified parent relationships
    const ParentStudentRel = ParentStudentRelationship;
    const relationships = await ParentStudentRel.find({
      studentId,
      verified: true
    }).select('parentId');

    const parentIds = relationships.map(rel => rel.parentId);

    // Get student's class and teacher
    const student = await User.findById(studentId).populate('classId');
    let teacherIds = [];

    if (student.classId) {
      const classData = await Class.findById(student.classId).populate('teacherId');
      if (classData && classData.teacherId) {
        teacherIds = [classData.teacherId._id];
      }
    }

    return {
      parentIds,
      teacherIds
    };
  } catch (error) {
    logger.error('Error getting notification recipients:', error);
    return {
      parentIds: [],
      teacherIds: []
    };
  }
};

/**
 * Notify parents and teachers about student activity
 * This function will be called by the Event Broadcasting Service
 * @param {string} activityLogId - Activity log ID
 * @param {Array} parentIds - Array of parent IDs to notify
 * @param {Array} teacherIds - Array of teacher IDs to notify
 * @returns {Promise<Object>} Updated activity log
 */
export const markActivityNotified = async (activityLogId, parentIds = [], teacherIds = []) => {
  try {
    const activityLog = await StudentActivityLog.findById(activityLogId);
    if (!activityLog) {
      throw new Error('Activity log not found');
    }

    // Update notified arrays (avoid duplicates)
    const uniqueParentIds = [...new Set([...activityLog.notifiedParents.map(id => id.toString()), ...parentIds.map(id => id.toString())])];
    const uniqueTeacherIds = [...new Set([...activityLog.notifiedTeachers.map(id => id.toString()), ...teacherIds.map(id => id.toString())])];

    activityLog.notifiedParents = uniqueParentIds;
    activityLog.notifiedTeachers = uniqueTeacherIds;
    activityLog.notificationStatus.notificationCount = uniqueParentIds.length + uniqueTeacherIds.length;

    await activityLog.save();

    return activityLog;
  } catch (error) {
    logger.error('Error marking activity as notified:', error);
    throw error;
  }
};

/**
 * Get student activity timeline
 * @param {string} studentId - Student user ID
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Activity timeline with pagination
 */
export const getStudentActivityTimeline = async (studentId, options = {}) => {
  try {
    const {
      startDate,
      endDate,
      activityType,
      limit = 50,
      page = 1
    } = options;

    const activities = await StudentActivityLog.getStudentTimeline(studentId, {
      startDate,
      endDate,
      activityType,
      limit: parseInt(limit),
      page: parseInt(page)
    });

    const total = await StudentActivityLog.countDocuments({
      studentId,
      ...(startDate || endDate ? {
        createdAt: {
          ...(startDate ? { $gte: new Date(startDate) } : {}),
          ...(endDate ? { $lte: new Date(endDate) } : {})
        }
      } : {}),
      ...(activityType ? { activityType } : {})
    });

    return {
      activities,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    };
  } catch (error) {
    logger.error('Error getting student activity timeline:', error);
    throw error;
  }
};

/**
 * Get class activity summary
 * @param {string} classId - Class ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Activity summary by type
 */
export const getClassActivitySummary = async (classId, options = {}) => {
  try {
    const {
      startDate,
      endDate,
      activityType
    } = options;

    const summary = await StudentActivityLog.getClassActivitySummary(classId, {
      startDate,
      endDate,
      activityType
    });

    return summary;
  } catch (error) {
    logger.error('Error getting class activity summary:', error);
    throw error;
  }
};

/**
 * Get recent activities that need notification
 * @param {number} limit - Maximum number of activities to return
 * @returns {Promise<Array>} Array of activity logs
 */
export const getRecentActivitiesForNotification = async (limit = 10) => {
  try {
    const activities = await StudentActivityLog.getRecentActivitiesForNotification(limit);
    return activities;
  } catch (error) {
    logger.error('Error getting recent activities for notification:', error);
    throw error;
  }
};

export default {
  trackStudentActivity,
  getNotificationRecipients,
  markActivityNotified,
  getStudentActivityTimeline,
  getClassActivitySummary,
  getRecentActivitiesForNotification
};

