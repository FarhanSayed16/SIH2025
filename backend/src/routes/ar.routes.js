/**
 * Phase 5.7: AR Routes
 * Handles AR session and asset management endpoints
 */

import express from 'express';
import { query, body } from 'express-validator';
import {
  logARSessionController,
  getUserARSessionsController,
  getARSessionByIdController,
  getSchoolARSessionsController,
  getARSessionStatisticsController,
  triggerARPathController,
} from '../controllers/ar.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireAdmin, requireTeacher } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validator.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * Log AR session
 * POST /api/ar/sessions
 */
router.post('/sessions', logARSessionController);

/**
 * Get user's AR sessions
 * GET /api/ar/sessions
 */
router.get(
  '/sessions',
  [
    query('sessionType').optional().isIn(['path_placement', 'fire_simulation']),
    query('drillId').optional().isMongoId(),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validate,
  getUserARSessionsController
);

/**
 * Get AR session by ID
 * GET /api/ar/sessions/:sessionId
 */
router.get('/sessions/:sessionId', getARSessionByIdController);

/**
 * Get school AR sessions (admin/teacher only)
 * GET /api/ar/sessions/school
 */
router.get(
  '/sessions/school',
  requireTeacher,
  [
    query('sessionType').optional().isIn(['path_placement', 'fire_simulation']),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('limit').optional().isInt({ min: 1, max: 500 }),
  ],
  validate,
  getSchoolARSessionsController
);

/**
 * Get AR session statistics (admin only)
 * GET /api/ar/sessions/statistics
 */
router.get(
  '/sessions/statistics',
  requireAdmin,
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
  ],
  validate,
  getARSessionStatisticsController
);

/**
 * Trigger AR path remotely (admin/teacher only)
 * POST /api/ar/trigger-path
 */
router.post(
  '/trigger-path',
  requireTeacher,
  [
    body('schoolId').isMongoId().withMessage('Valid school ID is required'),
    body('waypoints').optional().isArray(),
    body('safeZone').optional(),
  ],
  validate,
  triggerARPathController
);

export default router;

