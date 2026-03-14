import express from 'express';
import { body, param, query } from 'express-validator';
import {
  createAlertNow,
  listAlerts,
  getAlertById,
  updateStudentStatusInAlert,
  resolveAlertNow,
  cancelAlert
} from '../controllers/alert.controller.js';
import { triggerTeacherAlert } from '../controllers/teacherAlert.controller.js';
import {
  updateStatus,
  getStatuses,
  getSummary,
  markMissing
} from '../controllers/alertStatus.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireTeacher } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validator.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// List alerts
router.get(
  '/',
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('schoolId').optional().isMongoId(),
  query('status').optional().isIn(['active', 'resolved', 'false_alarm']),
  query('type').optional().isIn(['fire', 'earthquake', 'flood', 'cyclone', 'stampede', 'medical', 'other']),
  validate,
  listAlerts
);

// Get alert by ID
router.get(
  '/:id',
  param('id').isMongoId().withMessage('Invalid alert ID'),
  validate,
  getAlertById
);

// Create alert
router.post(
  '/',
  body('type').isIn(['fire', 'earthquake', 'flood', 'cyclone', 'stampede', 'medical', 'other']).withMessage('Invalid alert type'),
  body('title').trim().notEmpty().withMessage('Alert title is required'),
  body('severity').optional().isIn(['low', 'medium', 'high', 'critical']),
  body('institutionId').optional().isMongoId().withMessage('Invalid institution ID'),
  body('location.coordinates').optional().isArray({ min: 2, max: 2 }),
  validate,
  createAlertNow
);

// Phase 4.10: Teacher trigger alert (from mobile)
router.post(
  '/teacher',
  body('type').isIn(['fire', 'earthquake', 'flood', 'cyclone', 'stampede', 'medical', 'other']).withMessage('Invalid alert type'),
  body('severity').optional().isIn(['low', 'medium', 'high', 'critical']),
  body('title').optional().trim(),
  body('description').optional().trim(),
  body('locationDetails').optional().isObject(),
  validate,
  triggerTeacherAlert
);

// Update student status
router.put(
  '/:id/student-status',
  param('id').isMongoId().withMessage('Invalid alert ID'),
  body('userId').isMongoId().withMessage('Invalid user ID'),
  body('status').isIn(['safe', 'help', 'missing', 'at_risk', 'potentially_trapped']).withMessage('Invalid status'),
  body('location').optional().isObject(),
  validate,
  updateStudentStatusInAlert
);

// Phase 4.0: Cancel alert (Admin/Teacher)
router.post(
  '/:id/cancel',
  param('id').isMongoId().withMessage('Invalid alert ID'),
  body('reason').optional().trim(),
  validate,
  requireTeacher,
  cancelAlert
);

// Resolve alert (Teacher/Admin)
router.put(
  '/:id/resolve',
  param('id').isMongoId().withMessage('Invalid alert ID'),
  validate,
  requireTeacher,
  resolveAlertNow
);

// Phase 4.4: Emergency Acknowledgment & Triage Routes

// Update user status (self or admin)
router.post(
  '/:alertId/status',
  param('alertId').isMongoId().withMessage('Invalid alert ID'),
  body('status').isIn(['safe', 'help', 'missing', 'at_risk', 'potentially_trapped']).withMessage('Invalid status'),
  body('userId').optional().isMongoId().withMessage('Invalid user ID'),
  body('location').optional().isObject(),
  validate,
  updateStatus
);

// Get all user statuses for an alert
router.get(
  '/:alertId/status',
  param('alertId').isMongoId().withMessage('Invalid alert ID'),
  validate,
  getStatuses
);

// Get status summary for an alert
router.get(
  '/:alertId/summary',
  param('alertId').isMongoId().withMessage('Invalid alert ID'),
  validate,
  getSummary
);

// Mark user as missing (Admin/Teacher only)
router.post(
  '/:alertId/mark-missing',
  param('alertId').isMongoId().withMessage('Invalid alert ID'),
  body('userId').isMongoId().withMessage('Invalid user ID'),
  validate,
  requireTeacher,
  markMissing
);

export default router;

