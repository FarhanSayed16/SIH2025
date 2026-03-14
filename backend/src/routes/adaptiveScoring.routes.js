/**
 * Phase 3.3.2: Adaptive Scoring Routes
 * Handles per-student tracking and shared XP distribution
 */

import express from 'express';
import {
  distributeXP,
  getClassStudentScores,
  getXPDistribution,
  getStudentAggregatedScores
} from '../controllers/adaptiveScoring.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { body, param } from 'express-validator';
import { validate } from '../middleware/validator.js';

const router = express.Router();

/**
 * POST /api/adaptive-scoring/distribute-xp
 * Distribute shared XP to class students
 * Requires: teacher/admin role
 */
router.post(
  '/distribute-xp',
  authenticate,
  [
    body('classId').isMongoId().withMessage('Invalid class ID'),
    body('moduleId').isMongoId().withMessage('Invalid module ID'),
    body('xpAmount').isNumeric().withMessage('XP amount must be a number'),
    body('activityType').optional().isIn(['module', 'quiz', 'game', 'drill']),
    body('activityId').optional().isMongoId().withMessage('Invalid activity ID')
  ],
  validate,
  distributeXP
);

/**
 * GET /api/adaptive-scoring/class/:classId/scores
 * Get per-student scores for a class
 * Requires: teacher/admin role
 */
router.get(
  '/class/:classId/scores',
  authenticate,
  [
    param('classId').isMongoId().withMessage('Invalid class ID')
    // Optional query params: gameType, activityType, moduleId, startDate, endDate (not validated)
  ],
  validate,
  getClassStudentScores
);

/**
 * GET /api/adaptive-scoring/class/:classId/xp-distribution
 * Get shared XP distribution history
 * Requires: teacher/admin role
 */
router.get(
  '/class/:classId/xp-distribution',
  authenticate,
  [
    param('classId').isMongoId().withMessage('Invalid class ID')
    // Optional query params: activityType, startDate, endDate (not validated)
  ],
  validate,
  getXPDistribution
);

/**
 * GET /api/adaptive-scoring/student/:studentId/aggregated
 * Get aggregated scores for a student (individual + group activities)
 * Requires: student can view own, teacher/admin can view any
 */
router.get(
  '/student/:studentId/aggregated',
  authenticate,
  [
    param('studentId').isMongoId().withMessage('Invalid student ID')
  ],
  validate,
  getStudentAggregatedScores
);

export default router;

