import express from 'express';
import { body, param, query } from 'express-validator';
import {
  getUserById,
  updateUser,
  updateUserLocation,
  updateSafetyStatus,
  listUsers,
  registerFCMToken,
  bulkUserOperation,
  exportUsers
} from '../controllers/user.controller.js';
import { getUserProgress } from '../controllers/module.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireAdmin, requireOwnershipOrAdmin, requireTeacher, requireOwnershipOrTeacherAdmin } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validator.js';
import { cacheMiddleware, DEFAULT_TTL } from '../middleware/cache.middleware.js'; // Phase 3.5.1
import { invalidateCache } from '../middleware/cache.middleware.js'; // Phase 3.5.1

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get user profile (own or admin)
// Phase 3.5.1: Added caching
router.get(
  '/:id',
  param('id').isMongoId().withMessage('Invalid user ID'),
  validate,
  requireOwnershipOrAdmin('id'),
  cacheMiddleware({
    prefix: 'user',
    ttl: DEFAULT_TTL.USER_PROFILE,
    keyGenerator: (req) => `user:profile:${req.params.id}`
  }),
  getUserById
);

// Update user (own, admin, or teacher for student approval)
router.put(
  '/:id',
  param('id').isMongoId().withMessage('Invalid user ID'),
  body('name').optional().trim().notEmpty(),
  body('deviceToken').optional().isString(),
  body('approvalStatus').optional().isIn(['pending', 'registered', 'approved', 'rejected']), // RBAC Refinement
  validate,
  requireOwnershipOrTeacherAdmin('id'), // Allow teachers to approve students
  updateUser
);

// Update user location
router.put(
  '/:id/location',
  param('id').isMongoId().withMessage('Invalid user ID'),
  body('lat').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  body('lng').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
  validate,
  requireOwnershipOrAdmin('id'),
  updateUserLocation
);

// Update safety status
router.put(
  '/:id/safety-status',
  param('id').isMongoId().withMessage('Invalid user ID'),
  body('status').isIn(['safe', 'missing', 'at_risk', 'evacuating']).withMessage('Invalid status'),
  validate,
  requireOwnershipOrAdmin('id'),
  updateSafetyStatus
);

// Register FCM token (for push notifications)
router.post(
  '/:id/fcm-token',
  param('id').isMongoId().withMessage('Invalid user ID'),
  body('fcmToken').trim().notEmpty().withMessage('FCM token is required'),
  validate,
  requireOwnershipOrAdmin('id'),
  registerFCMToken
);

// List users (Admin and Teacher)
// Teachers can view students for approval, Admins have full access
// Increased limit to 500 for admin users to see all teachers at once
router.get(
  '/',
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 500 }), // Increased from 100 to 500 for admin use cases
  query('role').optional().isIn(['student', 'teacher', 'admin', 'parent']),
  query('institutionId').optional().isMongoId(),
  query('search').optional().isString(),
  query('approvalStatus').optional().isIn(['pending', 'registered', 'approved', 'rejected']), // RBAC Refinement
  validate,
  requireTeacher, // Allow teachers and admins
  listUsers
);

// Phase 3.5.4: Bulk operations (Admin only)
router.post(
  '/bulk',
  body('userIds').isArray({ min: 1 }).withMessage('User IDs array is required'),
  body('userIds.*').isMongoId().withMessage('Invalid user ID'),
  body('action').isIn(['activate', 'deactivate', 'delete']).withMessage('Invalid action'),
  validate,
  requireAdmin,
  bulkUserOperation
);

// Phase 3.5.4: Export users (Admin only)
router.get(
  '/export',
  query('format').optional().isIn(['csv', 'excel']),
  query('role').optional().isIn(['student', 'teacher', 'admin', 'parent']),
  query('institutionId').optional().isMongoId(),
  query('search').optional().isString(),
  query('isActive').optional().isBoolean(),
  validate,
  requireAdmin,
  exportUsers
);

// Get user progress (own or admin/teacher)
router.get(
  '/:userId/progress',
  param('userId').isMongoId().withMessage('Invalid user ID'),
  validate,
  requireOwnershipOrTeacherAdmin('userId'),
  getUserProgress
);

export default router;

