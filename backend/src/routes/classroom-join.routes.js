/**
 * RBAC Refinement: Classroom Join Routes
 * Handles classroom QR generation, scanning, and join request management
 */

import express from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole, requireTeacherAccess } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validator.js';
import { successResponse, errorResponse } from '../utils/response.js';
import logger from '../config/logger.js';
import {
  generateClassroomQR,
  scanClassroomQR,
  getPendingRequests,
  approveJoinRequest,
  rejectJoinRequest,
  expireClassroomQR
} from '../services/classroom-join.service.js';

const router = express.Router();

/**
 * Teacher: Generate classroom QR code
 * POST /api/classroom/:classId/qr/generate
 */
router.post(
  '/:classId/qr/generate',
  authenticate,
  // Debug: Log user info before role check
  (req, res, next) => {
    logger.info(`[QR Generate] Auth check - User ID: ${req.userId}, JWT Role: ${req.userRole}, DB Role: ${req.user?.role}, ApprovalStatus: ${req.user?.approvalStatus}, InstitutionId: ${req.user?.institutionId}`);
    next();
  },
  requireRole(['teacher', 'admin']), // Allow both teachers and admins
  requireTeacherAccess, // For teachers: ensures approved + has institution (admins bypass automatically)
  async (req, res) => {
    try {
      const { classId } = req.params;
      const teacherId = req.userId;
      const userRole = req.userRole || req.user?.role;

      logger.info(`[QR Generate] User ${teacherId} (role: ${userRole}, approvalStatus: ${req.user?.approvalStatus}, institutionId: ${req.user?.institutionId}) attempting to generate QR for class ${classId}`);

      // Validate classId format
      if (!classId || classId.length !== 24) {
        logger.warn(`[QR Generate] Invalid classId format: ${classId}`);
        return errorResponse(
          res,
          'Invalid class ID format',
          400
        );
      }

      const result = await generateClassroomQR(classId, teacherId);

      logger.info(`[QR Generate] Success - User ${teacherId} generated QR for class ${classId}`);
      return successResponse(
        res,
        result,
        'Classroom QR code generated successfully'
      );
    } catch (error) {
      logger.error(`[QR Generate] Error - User ${req.userId}, Class ${req.params.classId}:`, error);
      return errorResponse(
        res,
        error.message || 'Failed to generate classroom QR code',
        400
      );
    }
  }
);

/**
 * Teacher: Get pending join requests
 * GET /api/classroom/:classId/join-requests
 */
router.get(
  '/:classId/join-requests',
  authenticate,
  requireRole(['teacher', 'admin']),
  requireTeacherAccess, // For teachers: ensures approved + has institution (admins bypass automatically)
  async (req, res) => {
    try {
      const { classId } = req.params;
      const teacherId = req.userId; // Fixed: use req.userId from authenticate middleware

      const requests = await getPendingRequests(classId, teacherId);

      return successResponse(
        res,
        { requests },
        'Pending join requests retrieved successfully'
      );
    } catch (error) {
      logger.error('Get pending requests error:', error);
      return errorResponse(
        res,
        error.message || 'Failed to retrieve join requests',
        400
      );
    }
  }
);

/**
 * Teacher: Approve join request
 * POST /api/classroom/join-requests/:requestId/approve
 */
router.post(
  '/join-requests/:requestId/approve',
  authenticate,
  requireRole(['teacher', 'admin']),
  requireTeacherAccess, // For teachers: ensures approved + has institution (admins bypass automatically)
  [
    body('notes').optional().isString().trim()
  ],
  validate,
  async (req, res) => {
    try {
      const { requestId } = req.params;
      const { notes } = req.body;
      const teacherId = req.userId; // Fixed: use req.userId from authenticate middleware

      const result = await approveJoinRequest(requestId, teacherId, notes);

      return successResponse(
        res,
        result,
        'Join request approved successfully'
      );
    } catch (error) {
      logger.error('Approve join request error:', error);
      return errorResponse(
        res,
        error.message || 'Failed to approve join request',
        400
      );
    }
  }
);

/**
 * Teacher: Reject join request
 * POST /api/classroom/join-requests/:requestId/reject
 */
router.post(
  '/join-requests/:requestId/reject',
  authenticate,
  requireRole(['teacher', 'admin']),
  requireTeacherAccess, // For teachers: ensures approved + has institution (admins bypass automatically)
  [
    body('reason').optional().isString().trim()
  ],
  validate,
  async (req, res) => {
    try {
      const { requestId } = req.params;
      const { reason } = req.body;
      const teacherId = req.userId; // Fixed: use req.userId from authenticate middleware

      const result = await rejectJoinRequest(requestId, teacherId, reason);

      return successResponse(
        res,
        result,
        'Join request rejected successfully'
      );
    } catch (error) {
      logger.error('Reject join request error:', error);
      return errorResponse(
        res,
        error.message || 'Failed to reject join request',
        400
      );
    }
  }
);

/**
 * Student: Scan classroom QR code
 * POST /api/classroom/join/scan
 */
router.post(
  '/join/scan',
  [
    body('qrCode').notEmpty().withMessage('QR code is required'),
    body('studentInfo.name').notEmpty().withMessage('Student name is required'),
    body('studentInfo.email').optional().isEmail().withMessage('Invalid email format'),
    body('studentInfo.phone').optional().isString(),
    body('studentInfo.parentName').optional().isString(),
    body('studentInfo.parentPhone').optional().isString(),
    body('studentInfo.password').optional().isString().isLength({ min: 6 })
  ],
  validate,
  async (req, res) => {
    try {
      const { qrCode, studentInfo } = req.body;

      const result = await scanClassroomQR(qrCode, studentInfo);

      return successResponse(
        res,
        result,
        'Join request submitted successfully'
      );
    } catch (error) {
      logger.error('Scan classroom QR error:', error);
      return errorResponse(
        res,
        error.message || 'Failed to scan classroom QR code',
        400
      );
    }
  }
);

/**
 * Teacher: Expire classroom QR code
 * POST /api/classroom/:classId/qr/expire
 */
router.post(
  '/:classId/qr/expire',
  authenticate,
  requireRole(['teacher', 'admin']),
  requireTeacherAccess, // For teachers: ensures approved + has institution (admins bypass automatically)
  async (req, res) => {
    try {
      const { classId } = req.params;
      const teacherId = req.userId; // Fixed: use req.userId from authenticate middleware

      const result = await expireClassroomQR(classId, teacherId);

      return successResponse(
        res,
        result,
        'Classroom QR code expired successfully'
      );
    } catch (error) {
      logger.error('Expire classroom QR error:', error);
      return errorResponse(
        res,
        error.message || 'Failed to expire classroom QR code',
        400
      );
    }
  }
);

export default router;

