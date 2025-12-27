/**
 * Parent Controller
 * Handles all parent-related API endpoints
 * Parent Monitoring System - Phase 1
 */

import {
  getParentChildren,
  getChildDetails,
  getChildProgress,
  getChildLocation,
  getChildDrills,
  getChildAttendance,
  verifyStudentQR,
  linkStudentByQR,
  linkStudentById,
  getPendingLinkRequests,
  cancelLinkRequest,
  unlinkChildFromParent,
  updateRelationship,
  getChildRealTimeStatus,
  getDashboardSummary,
  updateParentProfile,
  changeParentPassword
} from '../services/parent.service.js';
import {
  getParentNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead
} from '../services/parent-notification.service.js';
import { successResponse, errorResponse } from '../utils/response.js';
import logger from '../config/logger.js';

/**
 * Get all children for authenticated parent
 * GET /api/parent/children
 */
export const getChildren = async (req, res) => {
  try {
    const parentId = req.user.userId || req.userId;
    const children = await getParentChildren(parentId);

    return successResponse(
      res,
      { children },
      'Children retrieved successfully'
    );
  } catch (error) {
    logger.error('Get children controller error:', error);
    return errorResponse(
      res,
      error.message || 'Failed to retrieve children',
      500
    );
  }
};

/**
 * Get detailed information about a specific child
 * GET /api/parent/children/:studentId
 */
export const getChildDetailsController = async (req, res) => {
  try {
    const parentId = req.user.userId || req.userId;
    const { studentId } = req.params;

    const childDetails = await getChildDetails(parentId, studentId);

    return successResponse(
      res,
      childDetails,
      'Child details retrieved successfully'
    );
  } catch (error) {
    logger.error('Get child details controller error:', error);
    return errorResponse(
      res,
      error.message || 'Failed to retrieve child details',
      error.message?.includes('Unauthorized') ? 403 : 500
    );
  }
};

/**
 * Get child's academic progress
 * GET /api/parent/children/:studentId/progress
 */
export const getChildProgressController = async (req, res) => {
  try {
    const parentId = req.user.userId || req.userId;
    const { studentId } = req.params;
    const { startDate, endDate } = req.query;

    const dateRange = (startDate && endDate) ? { start: startDate, end: endDate } : null;
    const progress = await getChildProgress(parentId, studentId, dateRange);

    return successResponse(
      res,
      progress,
      'Child progress retrieved successfully'
    );
  } catch (error) {
    logger.error('Get child progress controller error:', error);
    return errorResponse(
      res,
      error.message || 'Failed to retrieve child progress',
      error.message?.includes('Unauthorized') ? 403 : 500
    );
  }
};

/**
 * Get child's current location
 * GET /api/parent/children/:studentId/location
 */
export const getChildLocationController = async (req, res) => {
  try {
    const parentId = req.user.userId || req.userId;
    const { studentId } = req.params;

    const location = await getChildLocation(parentId, studentId);

    return successResponse(
      res,
      location,
      'Child location retrieved successfully'
    );
  } catch (error) {
    logger.error('Get child location controller error:', error);
    return errorResponse(
      res,
      error.message || 'Failed to retrieve child location',
      error.message?.includes('Unauthorized') ? 403 : 500
    );
  }
};

/**
 * Get child's drill participation history
 * GET /api/parent/children/:studentId/drills
 */
export const getChildDrillsController = async (req, res) => {
  try {
    const parentId = req.user.userId || req.userId;
    const { studentId } = req.params;

    const drills = await getChildDrills(parentId, studentId);

    return successResponse(
      res,
      { drills },
      'Child drill history retrieved successfully'
    );
  } catch (error) {
    logger.error('Get child drills controller error:', error);
    return errorResponse(
      res,
      error.message || 'Failed to retrieve child drill history',
      error.message?.includes('Unauthorized') ? 403 : 500
    );
  }
};

/**
 * Get child's attendance records
 * GET /api/parent/children/:studentId/attendance
 */
export const getChildAttendanceController = async (req, res) => {
  try {
    const parentId = req.user.userId || req.userId;
    const { studentId } = req.params;
    const { startDate, endDate } = req.query;

    const attendance = await getChildAttendance(parentId, studentId, startDate, endDate);

    return successResponse(
      res,
      attendance,
      'Child attendance retrieved successfully'
    );
  } catch (error) {
    logger.error('Get child attendance controller error:', error);
    return errorResponse(
      res,
      error.message || 'Failed to retrieve child attendance',
      error.message?.includes('Unauthorized') ? 403 : 500
    );
  }
};

/**
 * Verify student QR code
 * POST /api/parent/verify-student-qr
 */
export const verifyStudentQRController = async (req, res) => {
  try {
    const parentId = req.user.userId || req.userId;
    const { qrCode } = req.body;

    if (!qrCode) {
      return errorResponse(res, 'QR code is required', 400);
    }

    const result = await verifyStudentQR(parentId, qrCode);

    return successResponse(
      res,
      result,
      result.verified ? 'Student verified successfully' : 'Student not linked to your account'
    );
  } catch (error) {
    logger.error('Verify student QR controller error:', error);
    return errorResponse(
      res,
      error.message || 'Failed to verify student QR code',
      500
    );
  }
};

/**
 * Get parent notifications
 * GET /api/parent/notifications
 */
export const getNotifications = async (req, res) => {
  try {
    const parentId = req.user.userId || req.userId;
    const { type, read, limit } = req.query;

    const filters = {};
    if (type) filters.type = type;
    if (read !== undefined) filters.read = read === 'true';
    if (limit) filters.limit = parseInt(limit);

    const notifications = await getParentNotifications(parentId, filters);

    return successResponse(
      res,
      { notifications },
      'Notifications retrieved successfully'
    );
  } catch (error) {
    logger.error('Get notifications controller error:', error);
    return errorResponse(
      res,
      error.message || 'Failed to retrieve notifications',
      500
    );
  }
};

/**
 * Mark notification as read
 * PUT /api/parent/notifications/:notificationId/read
 */
export const markNotificationRead = async (req, res) => {
  try {
    const parentId = req.user.userId || req.userId;
    const { notificationId } = req.params;

    const notification = await markNotificationAsRead(parentId, notificationId);

    return successResponse(
      res,
      notification,
      'Notification marked as read'
    );
  } catch (error) {
    logger.error('Mark notification read controller error:', error);
    return errorResponse(
      res,
      error.message || 'Failed to mark notification as read',
      500
    );
  }
};

/**
 * Mark all notifications as read
 * PUT /api/parent/notifications/read-all
 */
export const markAllNotificationsRead = async (req, res) => {
  try {
    const parentId = req.user.userId || req.userId;

    const count = await markAllNotificationsAsRead(parentId);

    return successResponse(
      res,
      { count },
      `${count} notifications marked as read`
    );
  } catch (error) {
    logger.error('Mark all notifications read controller error:', error);
    return errorResponse(
      res,
      error.message || 'Failed to mark all notifications as read',
      500
    );
  }
};

/**
 * Link student to parent via QR code
 * POST /api/parent/children/link/qr
 */
export const linkStudentByQRController = async (req, res) => {
  try {
    const parentId = req.user.userId || req.userId;
    const { qrCode, relationship } = req.body;

    if (!qrCode) {
      return errorResponse(res, 'QR code is required', 400);
    }

    const result = await linkStudentByQR(parentId, qrCode, relationship || 'other');

    return successResponse(
      res,
      result,
      result.autoVerified 
        ? 'Child linked successfully' 
        : 'Link request submitted. Awaiting approval.'
    );
  } catch (error) {
    logger.error('Link student by QR controller error:', error);
    return errorResponse(
      res,
      error.message || 'Failed to link student',
      500
    );
  }
};

/**
 * Link student to parent via student ID
 * POST /api/parent/children/link/id
 */
export const linkStudentByIdController = async (req, res) => {
  try {
    const parentId = req.user.userId || req.userId;
    const { studentId, relationship } = req.body;

    if (!studentId) {
      return errorResponse(res, 'Student ID is required', 400);
    }

    const result = await linkStudentById(parentId, studentId, relationship || 'other');

    return successResponse(
      res,
      result,
      result.autoVerified 
        ? 'Child linked successfully' 
        : 'Link request submitted. Awaiting approval.'
    );
  } catch (error) {
    logger.error('Link student by ID controller error:', error);
    return errorResponse(
      res,
      error.message || 'Failed to link student',
      500
    );
  }
};

/**
 * Get pending link requests
 * GET /api/parent/children/link-requests
 */
export const getPendingLinkRequestsController = async (req, res) => {
  try {
    const parentId = req.user.userId || req.userId;
    const requests = await getPendingLinkRequests(parentId);

    return successResponse(
      res,
      { requests },
      'Pending link requests retrieved successfully'
    );
  } catch (error) {
    logger.error('Get pending link requests controller error:', error);
    return errorResponse(
      res,
      error.message || 'Failed to retrieve pending requests',
      500
    );
  }
};

/**
 * Cancel a pending link request
 * DELETE /api/parent/children/link-requests/:requestId
 */
export const cancelLinkRequestController = async (req, res) => {
  try {
    const parentId = req.user.userId || req.userId;
    const { requestId } = req.params;

    const result = await cancelLinkRequest(requestId, parentId);

    return successResponse(
      res,
      result,
      'Link request cancelled successfully'
    );
  } catch (error) {
    logger.error('Cancel link request controller error:', error);
    return errorResponse(
      res,
      error.message || 'Failed to cancel link request',
      500
    );
  }
};

/**
 * Unlink a child from parent
 * DELETE /api/parent/children/:studentId/unlink
 */
export const unlinkChildController = async (req, res) => {
  try {
    const parentId = req.user.userId || req.userId;
    const { studentId } = req.params;

    const result = await unlinkChildFromParent(parentId, studentId);

    return successResponse(
      res,
      result,
      'Child unlinked successfully'
    );
  } catch (error) {
    logger.error('Unlink child controller error:', error);
    return errorResponse(
      res,
      error.message || 'Failed to unlink child',
      500
    );
  }
};

/**
 * Update relationship type
 * PUT /api/parent/children/:studentId/relationship
 */
export const updateRelationshipController = async (req, res) => {
  try {
    const parentId = req.user.userId || req.userId;
    const { studentId } = req.params;
    const { relationship } = req.body;

    if (!relationship) {
      return errorResponse(res, 'Relationship type is required', 400);
    }

    const result = await updateRelationship(parentId, studentId, relationship);

    return successResponse(
      res,
      result,
      'Relationship updated successfully'
    );
  } catch (error) {
    logger.error('Update relationship controller error:', error);
    return errorResponse(
      res,
      error.message || 'Failed to update relationship',
      500
    );
  }
};

/**
 * Get child real-time status
 * GET /api/parent/children/:studentId/status
 */
export const getChildStatusController = async (req, res) => {
  try {
    const parentId = req.user.userId || req.userId;
    const { studentId } = req.params;

    const status = await getChildRealTimeStatus(parentId, studentId);

    return successResponse(
      res,
      status,
      'Child status retrieved successfully'
    );
  } catch (error) {
    logger.error('Get child status controller error:', error);
    return errorResponse(
      res,
      error.message || 'Failed to get child status',
      500
    );
  }
};

/**
 * Get dashboard summary
 * GET /api/parent/dashboard/summary
 */
export const getDashboardSummaryController = async (req, res) => {
  try {
    const parentId = req.user.userId || req.userId;

    const summary = await getDashboardSummary(parentId);

    return successResponse(
      res,
      summary,
      'Dashboard summary retrieved successfully'
    );
  } catch (error) {
    logger.error('Get dashboard summary controller error:', error);
    return errorResponse(
      res,
      error.message || 'Failed to get dashboard summary',
      500
    );
  }
};

/**
 * Update parent profile
 * PUT /api/parent/profile
 */
export const updateParentProfileController = async (req, res) => {
  try {
    const parentId = req.user.userId || req.userId;
    const profileData = req.body;

    const updatedParent = await updateParentProfile(parentId, profileData);

    return successResponse(
      res,
      { user: updatedParent },
      'Profile updated successfully'
    );
  } catch (error) {
    logger.error('Update parent profile controller error:', error);
    return errorResponse(
      res,
      error.message || 'Failed to update profile',
      500
    );
  }
};

/**
 * Change parent password
 * PUT /api/parent/profile/password
 */
export const changeParentPasswordController = async (req, res) => {
  try {
    const parentId = req.user.userId || req.userId;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return errorResponse(res, 'Old password and new password are required', 400);
    }

    const result = await changeParentPassword(parentId, oldPassword, newPassword);

    return successResponse(
      res,
      result,
      'Password changed successfully'
    );
  } catch (error) {
    logger.error('Change parent password controller error:', error);
    return errorResponse(
      res,
      error.message || 'Failed to change password',
      500
    );
  }
};

/**
 * Phase 2: Get child activity timeline
 * GET /api/parent/children/:studentId/activity
 */
export const getChildActivityController = async (req, res) => {
  try {
    const parentId = req.user.userId || req.userId;
    const { studentId } = req.params;
    const { startDate, endDate, activityType, limit = 50, page = 1 } = req.query;

    // Verify relationship
    const ParentStudentRelationship = (await import('../models/ParentStudentRelationship.js')).default;
    const relationship = await ParentStudentRelationship.findOne({
      parentId,
      studentId,
      verified: true
    });

    if (!relationship) {
      return errorResponse(res, 'Unauthorized: You are not linked to this student', 403);
    }

    // Get activity timeline
    const { getStudentActivityTimeline } = await import('../services/activity-tracking.service.js');
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
      'Child activity timeline retrieved successfully'
    );
  } catch (error) {
    logger.error('Get child activity controller error:', error);
    return errorResponse(
      res,
      error.message || 'Failed to retrieve child activity',
      500
    );
  }
};

/**
 * Phase 2: Get QR codes for authenticated parent's children
 * GET /api/parent/qr-codes
 */
export const getParentQRCodesController = async (req, res) => {
  try {
    const parentId = req.user.userId || req.userId;

    // Get QR codes for all children
    const { getQRCodesForParent } = await import('../services/parent-qr-code.service.js');
    const qrCodes = await getQRCodesForParent(parentId);

    return successResponse(
      res,
      { qrCodes },
      'QR codes retrieved successfully'
    );
  } catch (error) {
    logger.error('Get parent QR codes controller error:', error);
    return errorResponse(
      res,
      error.message || 'Failed to retrieve QR codes',
      500
    );
  }
};

/**
 * Phase 2: Get QR code for a specific child
 * GET /api/parent/qr-code/:studentId
 */
export const getChildQRCodeController = async (req, res) => {
  try {
    const parentId = req.user.userId || req.userId;
    const { studentId } = req.params;

    // Verify relationship
    const ParentStudentRelationship = (await import('../models/ParentStudentRelationship.js')).default;
    const relationship = await ParentStudentRelationship.findOne({
      parentId,
      studentId,
      verified: true
    });

    if (!relationship) {
      return errorResponse(res, 'Unauthorized: You are not linked to this student', 403);
    }

    // Get QR codes for this student
    const { getQRCodesForStudent } = await import('../services/parent-qr-code.service.js');
    const qrCodes = await getQRCodesForStudent(studentId);

    // Filter to only return QR codes for this parent
    const parentQRCodes = qrCodes.filter(qr => qr.parent._id.toString() === parentId);

    return successResponse(
      res,
      { qrCodes: parentQRCodes },
      'QR code retrieved successfully'
    );
  } catch (error) {
    logger.error('Get child QR code controller error:', error);
    return errorResponse(
      res,
      error.message || 'Failed to retrieve QR code',
      500
    );
  }
};

