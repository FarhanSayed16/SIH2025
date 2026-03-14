/**
 * Admin Routes
 * RBAC Refinement: Admin-only endpoints for class and user management
 */

import express from 'express';
import { body, param, query } from 'express-validator';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validator.js';
import {
  createClass,
  listClasses,
  updateClass,
  getClassById,
  assignTeacherToClass,
  cleanupClasses,
  deleteClass
} from '../controllers/class.controller.js';
import {
  createTeacherController,
  createStudentController,
  createParentController
} from '../controllers/admin-user.controller.js';
import {
  approveUser,
  assignInstitution,
  rejectUser,
  deleteUser
} from '../controllers/user.controller.js';

const router = express.Router();

// All routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

/**
 * Create a new class
 * POST /api/admin/classes
 */
router.post(
  '/classes',
  [
    body('institutionId').isMongoId().withMessage('Valid institution ID is required'),
    body('grade').isIn(['KG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']).withMessage('Valid grade is required'),
    body('section').trim().notEmpty().withMessage('Section is required'),
    body('teacherId').optional().isMongoId().withMessage('Valid teacher ID is required if provided'),
    body('academicYear').optional().trim().matches(/^\d{4}-\d{4}$/).withMessage('Academic year must be in format YYYY-YYYY (e.g., 2024-2025)'),
    body('roomNumber').optional().trim(),
    body('capacity').optional().isInt({ min: 1 }).withMessage('Capacity must be a positive integer'),
  ],
  validate,
  createClass
);

/**
 * List all classes
 * GET /api/admin/classes
 */
router.get(
  '/classes',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 1000 }), // FIX: Allow up to 1000 for admin to see all classes
    query('institutionId').optional().isMongoId(),
    query('teacherId').optional().isMongoId(),
    query('grade').optional().isIn(['KG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']),
    query('section').optional().trim(),
    query('academicYear').optional().trim(),
    query('includeInactive').optional().isIn(['true', 'false']),
  ],
  validate,
  listClasses
);

/**
 * Get class by ID
 * GET /api/admin/classes/:id
 */
router.get(
  '/classes/:id',
  param('id').isMongoId().withMessage('Invalid class ID'),
  validate,
  getClassById
);

/**
 * Update class
 * PUT /api/admin/classes/:id
 */
router.put(
  '/classes/:id',
  [
    param('id').isMongoId().withMessage('Invalid class ID'),
    body('grade').optional().isIn(['KG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']),
    body('section').optional().trim().notEmpty(),
    body('teacherId').optional().isMongoId(),
    body('roomNumber').optional().trim(),
    body('capacity').optional().isInt({ min: 1 }),
    body('isActive').optional().isBoolean(),
  ],
  validate,
  updateClass
);

/**
 * PHASE B5: Assign/Reassign teacher to class
 * PUT /api/admin/classes/:id/assign-teacher
 */
router.put(
  '/classes/:id/assign-teacher',
  [
    param('id').isMongoId().withMessage('Invalid class ID'),
    body('teacherId').optional().custom((value) => {
      // Allow empty string, null, or valid MongoId
      if (value === '' || value === null || value === undefined) {
        return true; // Allow empty to remove teacher
      }
      // If provided, must be valid MongoId
      return /^[0-9a-fA-F]{24}$/.test(value);
    }).withMessage('Valid teacher ID is required if provided'),
  ],
  validate,
  assignTeacherToClass
);

/**
 * Phase 2: Admin User Creation Endpoints
 */

/**
 * Create a teacher
 * POST /api/admin/users/teacher
 */
router.post(
  '/users/teacher',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail(),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    body('phone').optional().trim(),
    body('institutionId').optional().isMongoId().withMessage('Invalid institution ID'),
  ],
  validate,
  createTeacherController
);

/**
 * Create a student (roster record)
 * POST /api/admin/users/student
 */
router.post(
  '/users/student',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('grade')
      .isIn(['KG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'])
      .withMessage('Valid grade is required'),
    body('section').trim().notEmpty().withMessage('Section is required'),
    body('rollNo').optional().trim(),
    body('parentName').optional().trim(),
    body('parentPhone').optional().trim(),
    body('parentId').optional().isMongoId().withMessage('Invalid parent ID'),
    body('institutionId').optional().isMongoId().withMessage('Invalid institution ID'),
  ],
  validate,
  createStudentController
);

/**
 * Create a parent
 * POST /api/admin/users/parent
 */
router.post(
  '/users/parent',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('phone').trim().notEmpty().withMessage('Phone is required'),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    body('email')
      .optional()
      .trim()
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail(),
    body('institutionId').optional().isMongoId().withMessage('Invalid institution ID'),
  ],
  validate,
  createParentController
);

/**
 * Approve a teacher
 * PUT /api/admin/users/:userId/approve
 */
router.put(
  '/users/:userId/approve',
  [
    param('userId').isMongoId().withMessage('Invalid user ID'),
  ],
  validate,
  approveUser
);

/**
 * Assign institution to a user
 * PUT /api/admin/users/:userId/assign-institution
 */
router.put(
  '/users/:userId/assign-institution',
  [
    param('userId').isMongoId().withMessage('Invalid user ID'),
    body('institutionId').isMongoId().withMessage('Valid institution ID is required'),
  ],
  validate,
  assignInstitution
);

/**
 * Reject a teacher
 * PUT /api/admin/users/:userId/reject
 */
router.put(
  '/users/:userId/reject',
  [
    param('userId').isMongoId().withMessage('Invalid user ID'),
    body('reason').optional().trim(),
  ],
  validate,
  rejectUser
);

/**
 * Delete a teacher
 * DELETE /api/admin/users/:userId
 */
router.delete(
  '/users/:userId',
  [
    param('userId').isMongoId().withMessage('Invalid user ID'),
  ],
  validate,
  deleteUser
);

/**
 * Delete a single class
 * DELETE /api/admin/classes/:id
 */
router.delete(
  '/classes/:id',
  [
    param('id').isMongoId().withMessage('Invalid class ID'),
  ],
  validate,
  deleteClass
);

/**
 * Cleanup endpoint - Delete all classes for a test institution (ONE-TIME USE)
 * DELETE /api/admin/classes/cleanup
 * WARNING: Destructive operation - use only for testing/demo cleanup
 */
router.delete(
  '/classes/cleanup',
  [
    body('institutionId').isMongoId().withMessage('Valid institution ID is required'),
    body('confirm').equals('DELETE_ALL_CLASSES').withMessage('Safety confirmation required'),
  ],
  validate,
  cleanupClasses
);

export default router;

