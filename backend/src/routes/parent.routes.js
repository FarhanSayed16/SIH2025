/**
 * Parent Routes
 * API endpoints for parent monitoring system
 * Parent Monitoring System - Phase 1
 */

import express from 'express';
import { body, query } from 'express-validator';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/rbac.middleware.js';
import { verifyRelationship } from '../middleware/verifyRelationship.middleware.js';
import { validate } from '../middleware/validator.js';
import {
  getChildren,
  getChildDetailsController,
  getChildProgressController,
  getChildLocationController,
  getChildDrillsController,
  getChildAttendanceController,
  verifyStudentQRController,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  linkStudentByQRController,
  linkStudentByIdController,
  getPendingLinkRequestsController,
  cancelLinkRequestController,
  unlinkChildController,
  updateRelationshipController,
  getChildStatusController,
  getDashboardSummaryController,
  updateParentProfileController,
  changeParentPasswordController,
  getChildActivityController,
  getParentQRCodesController,
  getChildQRCodeController
} from '../controllers/parent.controller.js';

const router = express.Router();

/**
 * Get all children for authenticated parent
 * GET /api/parent/children
 */
router.get(
  '/children',
  authenticate,
  requireRole(['parent']),
  getChildren
);

/**
 * Get detailed information about a specific child
 * GET /api/parent/children/:studentId
 */
router.get(
  '/children/:studentId',
  authenticate,
  requireRole(['parent']),
  verifyRelationship,
  getChildDetailsController
);

/**
 * Get child's academic progress
 * GET /api/parent/children/:studentId/progress
 */
router.get(
  '/children/:studentId/progress',
  authenticate,
  requireRole(['parent']),
  verifyRelationship,
  getChildProgressController
);

/**
 * Get child's current location (during drills/emergencies)
 * GET /api/parent/children/:studentId/location
 */
router.get(
  '/children/:studentId/location',
  authenticate,
  requireRole(['parent']),
  verifyRelationship,
  getChildLocationController
);

/**
 * Get child's drill participation history
 * GET /api/parent/children/:studentId/drills
 */
router.get(
  '/children/:studentId/drills',
  authenticate,
  requireRole(['parent']),
  verifyRelationship,
  getChildDrillsController
);

/**
 * Get child's attendance records
 * GET /api/parent/children/:studentId/attendance
 */
router.get(
  '/children/:studentId/attendance',
  authenticate,
  requireRole(['parent']),
  verifyRelationship,
  getChildAttendanceController
);

/**
 * Verify student QR code
 * POST /api/parent/verify-student-qr
 */
router.post(
  '/verify-student-qr',
  authenticate,
  requireRole(['parent']),
  [
    body('qrCode')
      .notEmpty()
      .withMessage('QR code is required')
      .trim()
  ],
  validate,
  verifyStudentQRController
);

/**
 * Get parent notifications
 * GET /api/parent/notifications
 */
router.get(
  '/notifications',
  authenticate,
  requireRole(['parent']),
  getNotifications
);

/**
 * Mark notification as read
 * PUT /api/parent/notifications/:notificationId/read
 */
router.put(
  '/notifications/:notificationId/read',
  authenticate,
  requireRole(['parent']),
  markNotificationRead
);

/**
 * Mark all notifications as read
 * PUT /api/parent/notifications/read-all
 */
router.put(
  '/notifications/read-all',
  authenticate,
  requireRole(['parent']),
  markAllNotificationsRead
);

/**
 * Link student to parent via QR code
 * POST /api/parent/children/link/qr
 */
router.post(
  '/children/link/qr',
  authenticate,
  requireRole(['parent']),
  [
    body('qrCode')
      .notEmpty()
      .withMessage('QR code is required')
      .trim(),
    body('relationship')
      .optional()
      .isIn(['father', 'mother', 'guardian', 'other'])
      .withMessage('Invalid relationship type')
  ],
  validate,
  linkStudentByQRController
);

/**
 * Link student to parent via student ID
 * POST /api/parent/children/link/id
 */
router.post(
  '/children/link/id',
  authenticate,
  requireRole(['parent']),
  [
    body('studentId')
      .notEmpty()
      .withMessage('Student ID is required')
      .isMongoId()
      .withMessage('Invalid student ID format'),
    body('relationship')
      .optional()
      .isIn(['father', 'mother', 'guardian', 'other'])
      .withMessage('Invalid relationship type')
  ],
  validate,
  linkStudentByIdController
);

/**
 * Get pending link requests
 * GET /api/parent/children/link-requests
 */
router.get(
  '/children/link-requests',
  authenticate,
  requireRole(['parent']),
  getPendingLinkRequestsController
);

/**
 * Cancel a pending link request
 * DELETE /api/parent/children/link-requests/:requestId
 */
router.delete(
  '/children/link-requests/:requestId',
  authenticate,
  requireRole(['parent']),
  cancelLinkRequestController
);

/**
 * Unlink a child from parent
 * DELETE /api/parent/children/:studentId/unlink
 */
router.delete(
  '/children/:studentId/unlink',
  authenticate,
  requireRole(['parent']),
  verifyRelationship,
  unlinkChildController
);

/**
 * Update relationship type
 * PUT /api/parent/children/:studentId/relationship
 */
router.put(
  '/children/:studentId/relationship',
  authenticate,
  requireRole(['parent']),
  verifyRelationship,
  [
    body('relationship')
      .notEmpty()
      .withMessage('Relationship type is required')
      .isIn(['father', 'mother', 'guardian', 'other'])
      .withMessage('Invalid relationship type')
  ],
  validate,
  updateRelationshipController
);

/**
 * Get child real-time status
 * GET /api/parent/children/:studentId/status
 */
router.get(
  '/children/:studentId/status',
  authenticate,
  requireRole(['parent']),
  verifyRelationship,
  getChildStatusController
);

/**
 * Get dashboard summary
 * GET /api/parent/dashboard-summary (mobile app expects this)
 * GET /api/parent/dashboard/summary (web app uses this)
 */
router.get(
  '/dashboard-summary',
  authenticate,
  requireRole(['parent']),
  getDashboardSummaryController
);

router.get(
  '/dashboard/summary',
  authenticate,
  requireRole(['parent']),
  getDashboardSummaryController
);

/**
 * Update parent profile
 * PUT /api/parent/profile
 */
router.put(
  '/profile',
  authenticate,
  requireRole(['parent']),
  [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('email').optional().isEmail().withMessage('Invalid email format'),
    body('phone').optional().trim(),
    body('parentProfile.phoneNumber').optional().trim(),
    body('parentProfile.alternatePhoneNumber').optional().trim(),
    body('parentProfile.relationship').optional().isIn(['father', 'mother', 'guardian', 'other']).withMessage('Invalid relationship type')
  ],
  validate,
  updateParentProfileController
);

/**
 * Change parent password
 * PUT /api/parent/profile/password
 */
router.put(
  '/profile/password',
  authenticate,
  requireRole(['parent']),
  [
    body('oldPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters long')
  ],
  validate,
  changeParentPasswordController
);

/**
 * Phase 2: Get child activity timeline
 * GET /api/parent/children/:studentId/activity
 */
router.get(
  '/children/:studentId/activity',
  authenticate,
  requireRole(['parent']),
  verifyRelationship,
  [
    query('startDate').optional().isISO8601().withMessage('Start date must be a valid ISO 8601 date'),
    query('endDate').optional().isISO8601().withMessage('End date must be a valid ISO 8601 date'),
    query('activityType').optional().isIn([
      'module_complete',
      'quiz_attempt',
      'quiz_complete',
      'game_play',
      'game_complete',
      'login',
      'logout',
      'progress_update',
      'safety_status_change',
      'badge_earned',
      'xp_milestone',
      'location_update',
      'drill_participation',
      'drill_complete'
    ]).withMessage('Invalid activity type'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer')
  ],
  validate,
  getChildActivityController
);

/**
 * Phase 2: Get QR codes for authenticated parent's children
 * GET /api/parent/qr-codes
 */
router.get(
  '/qr-codes',
  authenticate,
  requireRole(['parent']),
  getParentQRCodesController
);

/**
 * Phase 2: Get QR code for a specific child
 * GET /api/parent/qr-code/:studentId
 */
router.get(
  '/qr-code/:studentId',
  authenticate,
  requireRole(['parent']),
  verifyRelationship,
  getChildQRCodeController
);

export default router;

