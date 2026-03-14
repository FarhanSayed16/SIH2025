/**
 * Phase 3.2: Game Routes
 * Routes for game scores, items, and leaderboards
 */

import express from 'express';
import { body, param, query } from 'express-validator';
import {
  submitScore,
  getScores,
  getGameItems,
  getLeaderboard,
  getHazards,
  verifyHazardTap
} from '../controllers/game.controller.js';
import { syncGameScores, getSyncStatus } from '../controllers/gameSync.controller.js'; // Phase 3.2.5
import { authenticate, optionalAuth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validator.js';

const router = express.Router();

// Submit game score
router.post(
  '/scores',
  optionalAuth, // Can submit scores for group mode without individual auth
  body('gameType').isIn([
    'bag-packer', 
    'hazard-hunter', 
    'earthquake-shake',
    'school-runner',
    'flood-escape',
    'punjab-safety',
    'school-safety-quiz',
    'fire-extinguisher-ar',
    'web-game'
  ]).withMessage('Invalid game type'),
  body('score').isNumeric().withMessage('Score must be a number'),
  body('maxScore').optional().isNumeric(),
  body('level').optional().isInt({ min: 1 }),
  body('difficulty').optional().isIn(['easy', 'medium', 'hard']),
  body('isGroupMode').optional().isBoolean(),
  body('groupActivityId').optional().isMongoId(),
  body('studentIds').optional().isArray(),
  validate,
  submitScore
);

// Get game scores
router.get(
  '/scores',
  optionalAuth,
  query('gameType').optional().isIn(['bag-packer', 'hazard-hunter', 'earthquake-shake']),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  validate,
  getScores
);

// Get game items
router.get(
  '/items',
  query('gameType').optional().isIn(['bag-packer', 'hazard-hunter', 'earthquake-shake']),
  query('category').optional().isString(),
  query('gradeLevel').optional().isString(),
  validate,
  getGameItems
);

// Get leaderboard
router.get(
  '/leaderboard/:gameType',
  param('gameType').isIn(['bag-packer', 'hazard-hunter', 'earthquake-shake']).withMessage('Invalid game type'),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('institutionId').optional().isMongoId(),
  query('difficulty').optional().isIn(['easy', 'medium', 'hard']),
  query('level').optional().isInt({ min: 1 }),
  validate,
  getLeaderboard
);

// Phase 3.2.2: Hazard Hunter endpoints
router.get(
  '/hazards',
  query('level').optional().isInt({ min: 1 }),
  query('difficulty').optional().isIn(['easy', 'medium', 'hard']),
  validate,
  getHazards
);

router.post(
  '/verify-hazard',
  body('hazardId').isMongoId().withMessage('Invalid hazard ID'),
  body('tapX').isNumeric().withMessage('Tap X coordinate is required'),
  body('tapY').isNumeric().withMessage('Tap Y coordinate is required'),
  body('imageId').optional().isString(),
  validate,
  verifyHazardTap
);

// Phase 3.2.5: Game Sync Routes (offline support)
// Bulk sync game scores
router.post(
  '/sync',
  authenticate,
  body('scores').isArray().withMessage('Scores must be an array'),
  body('scores.*.gameType').isIn(['bag-packer', 'hazard-hunter', 'earthquake-shake']).withMessage('Invalid game type'),
  body('scores.*.score').isNumeric().withMessage('Score must be a number'),
  validate,
  syncGameScores
);

// Get sync status
router.get(
  '/sync/status',
  authenticate,
  getSyncStatus
);

export default router;

