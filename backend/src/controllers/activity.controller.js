/**
 * Activity Tracking Controller
 * Handles student activity tracking and timeline endpoints
 * Phase 2: API Endpoints
 */

import {
  trackStudentActivity,
  getStudentActivityTimeline,
  getClassActivitySummary,
  getRecentActivitiesForNotification
} from '../services/activity-tracking.service.js';
import { processActivityNotification } from '../services/event-broadcasting.service.js';
import { successResponse, errorResponse } from '../utils/response.js';
import logger from '../config/logger.js';

/**
 * Track student activity
 * POST /api/activity/track
 */
export const trackActivity = async (req, res) => {
  try {
    const { studentId, activityType, activityData } = req.body;
    const userId = req.userId;

    // Validate required fields
    if (!studentId || !activityType) {
      return errorResponse(res, 'Student ID and activity type are required', 400);
    }

    // Verify user is the student or has permission (teacher/admin)
    if (userId !== studentId) {
      const user = await import('../models/User.js').then(m => m.default.findById(userId));
      if (!user || (user.role !== 'teacher' && user.role !== 'admin' && user.role !== 'SYSTEM_ADMIN')) {
        return errorResponse(res, 'Unauthorized: Only students can track their own activities or teachers/admins can track for students', 403);
      }
    }

    // Track the activity
    const activityLog = await trackStudentActivity(studentId, activityType, activityData || {});

    // Process notifications asynchronously (don't wait for it)
    processActivityNotification(activityLog._id.toString()).catch(error => {
      logger.error('Error processing activity notification:', error);
    });

    return successResponse(
      res,
      {
        activityId: activityLog._id,
        activityType: activityLog.activityType,
        createdAt: activityLog.createdAt
      },
      'Activity tracked successfully'
    );
  } catch (error) {
    logger.error('Track activity controller error:', error);
    return errorResponse(
      res,
      error.message || 'Failed to track activity',
      500
    );
  }
};

/**
 * Get student activity timeline
 * GET /api/activity/student/:studentId
 */
export const getStudentTimeline = async (req, res) => {
  try {
    const { studentId } = req.params;
    const userId = req.userId;
    const { startDate, endDate, activityType, limit = 50, page = 1 } = req.query;

    // Verify user has permission to view this student's activities
    const User = (await import('../models/User.js')).default;
    const user = await User.findById(userId);
    const student = await User.findById(studentId);

    if (!student || student.role !== 'student') {
      return errorResponse(res, 'Student not found', 404);
    }

    // Check permissions: student can view own activities, parent can view child's, teacher can view class student's
    let hasPermission = false;

    if (userId === studentId) {
      hasPermission = true; // Student viewing own activities
    } else if (user.role === 'parent') {
      // Check if parent is linked to this student
      const ParentStudentRelationship = (await import('../models/ParentStudentRelationship.js')).default;
      const relationship = await ParentStudentRelationship.findOne({
        parentId: userId,
        studentId,
        verified: true
      });
      hasPermission = !!relationship;
    } else if (user.role === 'teacher' || user.role === 'admin' || user.role === 'SYSTEM_ADMIN') {
      // Teacher/admin can view if student is in their class or they're admin
      if (user.role === 'admin' || user.role === 'SYSTEM_ADMIN') {
        hasPermission = true;
      } else if (student.classId) {
        const Class = (await import('../models/Class.js')).default;
        const classData = await Class.findById(student.classId);
        hasPermission = classData && classData.teacherId.toString() === userId;
      }
    }

    if (!hasPermission) {
      return errorResponse(res, 'Unauthorized: You do not have permission to view this student\'s activities', 403);
    }

    // Get activity timeline
    const result = await getStudentActivityTimeline(studentId, {
      startDate,
      endDate,
      activityType,
      limit: parseInt(limit),
      page: parseInt(page)
    });

    return successResponse(
      res,
      result,
      'Activity timeline retrieved successfully'
    );
  } catch (error) {
    logger.error('Get student timeline controller error:', error);
    return errorResponse(
      res,
      error.message || 'Failed to retrieve activity timeline',
      500
    );
  }
};

/**
 * Get class activity summary
 * GET /api/activity/class/:classId
 */
export const getClassActivity = async (req, res) => {
  try {
    const { classId } = req.params;
    const userId = req.userId;
    const { startDate, endDate, activityType } = req.query;

    // Verify user is teacher of this class or admin
    const User = (await import('../models/User.js')).default;
    const Class = (await import('../models/Class.js')).default;
    
    const user = await User.findById(userId);
    const classData = await Class.findById(classId);

    if (!classData) {
      return errorResponse(res, 'Class not found', 404);
    }

    // Check permissions
    const isAdmin = user.role === 'admin' || user.role === 'SYSTEM_ADMIN';
    const isTeacher = user.role === 'teacher' && classData.teacherId.toString() === userId;

    if (!isAdmin && !isTeacher) {
      return errorResponse(res, 'Unauthorized: Only teachers of this class or admins can view class activity', 403);
    }

    // Get activity summary
    const summary = await getClassActivitySummary(classId, {
      startDate,
      endDate,
      activityType
    });

    return successResponse(
      res,
      { summary },
      'Class activity summary retrieved successfully'
    );
  } catch (error) {
    logger.error('Get class activity controller error:', error);
    return errorResponse(
      res,
      error.message || 'Failed to retrieve class activity summary',
      500
    );
  }
};

