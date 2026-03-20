/**
 * RBAC Refinement: Roster Management Routes
 * Handles KG-4th grade students (roster records) management
 */

import express from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validator.js';
import { successResponse, errorResponse } from '../utils/response.js';
import logger from '../config/logger.js';
import {
  createRosterRecord,
  updateRosterRecord,
  getClassRoster,
  markRosterAttendance,
  bulkCheckIn,
  deleteRosterRecord
} from '../services/roster-management.service.js';

const router = express.Router();

/**
 * Teacher: Create roster record (KG-4th student)
 * POST /api/roster/:classId/students
 */
router.post(
  '/:classId/students',
  authenticate,
  requireRole(['teacher', 'admin']),
  [
    body('name').notEmpty().withMessage('Student name is required'),
    body('parentName').optional().isString(),
    body('parentPhone').optional().isString(),
    body('parentId').optional().isMongoId(),
    body('notes').optional().isString()
  ],
  validate,
  async (req, res) => {
    try {
      const { classId } = req.params;
      const teacherId = req.user.userId;
      const studentInfo = req.body;

      const result = await createRosterRecord(classId, teacherId, studentInfo);

      return successResponse(
        res,
        result,
        'Roster record created successfully',
        201
      );
    } catch (error) {
      logger.error('Create roster record error:', error);
      return errorResponse(
        res,
        error.message || 'Failed to create roster record',
        400
      );
    }
  }
);

/**
 * Teacher: Get class roster (all students)
 * GET /api/roster/:classId/students
 */
router.get(
  '/:classId/students',
  authenticate,
  requireRole(['teacher', 'admin']),
  async (req, res) => {
    try {
      const { classId } = req.params;
      const teacherId = req.user.userId;

      const result = await getClassRoster(classId, teacherId);

      return successResponse(
        res,
        result,
        'Class roster retrieved successfully'
      );
    } catch (error) {
      logger.error('Get class roster error:', error);
      return errorResponse(
        res,
        error.message || 'Failed to retrieve class roster',
        400
      );
    }
  }
);

/**
 * Teacher: Update roster record
 * PUT /api/roster/students/:studentId
 */
router.put(
  '/students/:studentId',
  authenticate,
  requireRole(['teacher', 'admin']),
  [
    body('name').optional().isString(),
    body('parentName').optional().isString(),
    body('parentPhone').optional().isString(),
    body('parentId').optional().isMongoId(),
    body('notes').optional().isString()
  ],
  validate,
  async (req, res) => {
    try {
      const { studentId } = req.params;
      const teacherId = req.user.userId;
      const updates = req.body;

      const result = await updateRosterRecord(studentId, teacherId, updates);

      return successResponse(
        res,
        result,
        'Roster record updated successfully'
      );
    } catch (error) {
      logger.error('Update roster record error:', error);
      return errorResponse(
        res,
        error.message || 'Failed to update roster record',
        400
      );
    }
  }
);

/**
 * Teacher: Delete roster record
 * DELETE /api/roster/students/:studentId
 */
router.delete(
  '/students/:studentId',
  authenticate,
  requireRole(['teacher', 'admin']),
  async (req, res) => {
    try {
      const { studentId } = req.params;
      const teacherId = req.user.userId;

      const result = await deleteRosterRecord(studentId, teacherId);

      return successResponse(
        res,
        result,
        'Roster record deleted successfully'
      );
    } catch (error) {
      logger.error('Delete roster record error:', error);
      return errorResponse(
        res,
        error.message || 'Failed to delete roster record',
        400
      );
    }
  }
);

/**
 * Teacher: Mark roster attendance during drill
 * POST /api/roster/:classId/attendance
 */
router.post(
  '/:classId/attendance',
  authenticate,
  requireRole(['teacher', 'admin']),
  [
    body('drillId').notEmpty().isMongoId().withMessage('Drill ID is required'),
    body('studentIds').isArray().withMessage('Student IDs must be an array'),
    body('studentIds.*').isMongoId().withMessage('Invalid student ID'),
    body('status').isIn(['safe', 'missing', 'at_risk', 'evacuating']).withMessage('Invalid status')
  ],
  validate,
  async (req, res) => {
    try {
      const { classId } = req.params;
      const { drillId, studentIds, status } = req.body;
      const teacherId = req.user.userId;

      const result = await markRosterAttendance(classId, drillId, studentIds, status, teacherId);

      return successResponse(
        res,
        result,
        'Roster attendance marked successfully'
      );
    } catch (error) {
      logger.error('Mark roster attendance error:', error);
      return errorResponse(
        res,
        error.message || 'Failed to mark roster attendance',
        400
      );
    }
  }
);

/**
 * Teacher: Bulk check-in during drill
 * POST /api/roster/:classId/bulk-checkin
 */
router.post(
  '/:classId/bulk-checkin',
  authenticate,
  requireRole(['teacher', 'admin']),
  [
    body('drillId').notEmpty().isMongoId().withMessage('Drill ID is required'),
    body('studentIds').optional().isArray().withMessage('Student IDs must be an array'),
    body('studentIds.*').optional().isMongoId().withMessage('Invalid student ID')
  ],
  validate,
  async (req, res) => {
    try {
      const { classId } = req.params;
      const { drillId, studentIds } = req.body;
      const teacherId = req.user.userId;

      const result = await bulkCheckIn(classId, drillId, studentIds, teacherId);

      return successResponse(
        res,
        result,
        'Bulk check-in completed successfully'
      );
    } catch (error) {
      logger.error('Bulk check-in error:', error);
      return errorResponse(
        res,
        error.message || 'Failed to perform bulk check-in',
        400
      );
    }
  }
);

export default router;

