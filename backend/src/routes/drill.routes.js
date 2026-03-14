import express from 'express';
import { body, param, query } from 'express-validator';
import {
  createDrill,
  listDrills,
  getDrillById,
  triggerDrillNow,
  acknowledgeDrillParticipation,
  completeDrill,
  endDrillNow,
  finalizeDrillNow,
  getDrillSummaryController,
  getActiveDrills,
  getDrillParticipants
} from '../controllers/drill.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireAdmin, requireTeacher } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validator.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// List drills
router.get(
  '/',
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('schoolId').optional().isMongoId(),
  query('status').optional().isIn(['scheduled', 'in_progress', 'completed', 'cancelled']),
  query('type').optional().isIn(['fire', 'earthquake', 'flood', 'cyclone', 'stampede', 'heatwave']),
  validate,
  listDrills
);

// Get active drills - Phase 1
router.get(
  '/active',
  validate,
  getActiveDrills
);

// Get drill by ID
router.get(
  '/:id',
  param('id').isMongoId().withMessage('Invalid drill ID'),
  validate,
  getDrillById
);

// Schedule drill (Admin/Teacher)
router.post(
  '/',
  body('type').isIn(['fire', 'earthquake', 'flood', 'cyclone', 'stampede', 'heatwave']).withMessage('Invalid drill type'),
  body('scheduledAt').isISO8601().withMessage('Invalid scheduled date'),
  body('institutionId').optional().isMongoId().withMessage('Invalid institution ID'),
  validate,
  requireTeacher,
  createDrill
);

// Trigger drill (Admin/Teacher)
router.post(
  '/:id/trigger',
  param('id').isMongoId().withMessage('Invalid drill ID'),
  validate,
  requireTeacher,
  triggerDrillNow
);

// Acknowledge drill
router.post(
  '/:id/acknowledge',
  param('id').isMongoId().withMessage('Invalid drill ID'),
  validate,
  acknowledgeDrillParticipation
);

// Complete drill participation
router.post(
  '/:id/complete',
  param('id').isMongoId().withMessage('Invalid drill ID'),
  body('evacuationTime').isInt({ min: 0 }).withMessage('Evacuation time is required'),
  body('route').optional().isString(),
  body('score').optional().isInt({ min: 0, max: 100 }),
  validate,
  completeDrill
);

// End drill (Admin/Teacher) - Phase 4.2
router.post(
  '/:id/end',
  param('id').isMongoId().withMessage('Invalid drill ID'),
  validate,
  requireTeacher,
  endDrillNow
);

// Finalize drill (Admin/Teacher)
router.post(
  '/:id/finalize',
  param('id').isMongoId().withMessage('Invalid drill ID'),
  validate,
  requireTeacher,
  finalizeDrillNow
);

// Get drill summary - Phase 4.2
router.get(
  '/:id/summary',
  param('id').isMongoId().withMessage('Invalid drill ID'),
  validate,
  getDrillSummaryController
);

// Get drill participants - Phase 1
router.get(
  '/:id/participants',
  param('id').isMongoId().withMessage('Invalid drill ID'),
  validate,
  getDrillParticipants
);

export default router;

