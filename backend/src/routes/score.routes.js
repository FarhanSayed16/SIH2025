/**
 * Phase 3.3.1: Score Routes
 * Routes for preparedness score calculation and history
 */

import express from 'express';
import { param, query } from 'express-validator';
import {
  getPreparednessScore,
  recalculatePreparednessScore,
  getScoreHistoryController
} from '../controllers/preparednessScore.controller.js';
import { authenticate, optionalAuth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validator.js';
import { cacheMiddleware, DEFAULT_TTL } from '../middleware/cache.middleware.js'; // Phase 3.5.1

const router = express.Router();

// Get preparedness score
// Phase 3.5.1: Added caching
router.get(
  '/preparedness/:userId?',
  authenticate,
  param('userId').optional().isMongoId().withMessage('Invalid user ID'),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  validate,
  cacheMiddleware({
    prefix: 'score',
    ttl: DEFAULT_TTL.PREPAREDNESS_SCORE,
    keyGenerator: (req) => `score:preparedness:${req.params.userId || req.userId}`
  }),
  getPreparednessScore
);

// Recalculate score
router.post(
  '/recalculate/:userId?',
  authenticate,
  param('userId').optional().isMongoId().withMessage('Invalid user ID'),
  validate,
  recalculatePreparednessScore
);

// Get score history
router.get(
  '/history/:userId?',
  authenticate,
  param('userId').optional().isMongoId().withMessage('Invalid user ID'),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  validate,
  getScoreHistoryController
);

export default router;

