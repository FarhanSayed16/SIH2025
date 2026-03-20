import express from 'express';
import { query, param, body } from 'express-validator';
import {
  getLeaderboard,
  getSquadWars,
  getClassLeaderboardById,
  refreshLeaderboard,
} from '../controllers/leaderboard.controller.js';
import { authenticate, optionalAuth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validator.js';

const router = express.Router();

// Phase 3.3.5: Enhanced leaderboard routes

// Apply optional auth to all routes by default (can be overridden per route)
router.use(optionalAuth);

/**
 * GET /api/leaderboard
 * Main leaderboard endpoint
 */
router.get(
  '/',
  [
    query('schoolId').optional().isMongoId().withMessage('Invalid school ID'),
    query('type')
      .optional()
      .isIn([
        'overall',
        'preparedness',
        'quizzes',
        'games',
        'badges',
        'class',
        'drills',
      ])
      .withMessage('Invalid leaderboard type'),
    query('gameType')
      .optional()
      .isIn(['bag-packer', 'hazard-hunter', 'earthquake-shake'])
      .withMessage('Invalid game type'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    validate,
  ],
  getLeaderboard
);

/**
 * GET /api/leaderboard/squad-wars
 * Squad Wars leaderboard (team competitions)
 */
router.get(
  '/squad-wars',
  [
    query('schoolId').optional().isMongoId().withMessage('Invalid school ID'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    validate,
  ],
  getSquadWars
);

/**
 * GET /api/leaderboard/class/:classId
 * Class-specific leaderboard
 */
router.get(
  '/class/:classId',
  [
    param('classId').isMongoId().withMessage('Invalid class ID'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    validate,
  ],
  getClassLeaderboardById
);

/**
 * POST /api/leaderboard/refresh
 * Refresh leaderboard cache (admin/teacher only)
 * Must be authenticated - override optionalAuth with explicit authenticate
 */
router.post(
  '/refresh',
  authenticate, // Override optionalAuth - requires authentication
  [
    body('type')
      .optional()
      .isIn(['preparedness', 'quizzes', 'games', 'badges'])
      .withMessage('Invalid leaderboard type'),
    body('schoolId').optional().isMongoId().withMessage('Invalid school ID'),
    validate,
  ],
  refreshLeaderboard
);

export default router;
