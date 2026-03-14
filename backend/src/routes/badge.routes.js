/**
 * Phase 3.3.3: Badge Routes
 */

import express from 'express';
import { body, param, query } from 'express-validator';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validator.js';
import {
  listBadges,
  getBadgeById,
  getMyBadges,
  getMyBadgeHistory,
  manualAwardBadge,
  checkBadges
} from '../controllers/badge.controller.js';

const router = express.Router();

/**
 * GET /api/badges
 * Get all available badges
 */
router.get(
  '/',
  [
    query('category').optional().isString().trim(),
    query('gradeLevel').optional().isString().trim(),
    validate
  ],
  listBadges
);

/**
 * GET /api/badges/my-badges
 * Get current user's badges
 * NOTE: Must be before /:badgeId route to avoid matching "my-badges" as badgeId
 */
router.get(
  '/my-badges',
  authenticate,
  getMyBadges
);

/**
 * GET /api/badges/:badgeId
 * Get specific badge details
 */
router.get(
  '/:badgeId',
  [
    param('badgeId').notEmpty().trim(),
    validate
  ],
  getBadgeById
);

/**
 * GET /api/badges/my-badges/history
 * Get badge award history for current user
 */
router.get(
  '/my-badges/history',
  authenticate,
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('badgeId').optional().isString().trim(),
    validate
  ],
  getMyBadgeHistory
);

/**
 * POST /api/badges/:badgeId/award
 * Manually award badge (admin/teacher only)
 */
router.post(
  '/:badgeId/award',
  authenticate,
  [
    param('badgeId').notEmpty().trim(),
    body('userId').optional().isMongoId(),
    validate
  ],
  manualAwardBadge
);

/**
 * POST /api/badges/check
 * Check and award badges for current user
 */
router.post(
  '/check',
  authenticate,
  [
    body('triggerType').optional().isString().trim(),
    body('triggerData').optional().isObject(),
    validate
  ],
  checkBadges
);

export default router;

