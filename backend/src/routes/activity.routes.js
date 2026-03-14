/**
 * Activity Tracking Routes
 * API endpoints for student activity tracking
 * Phase 2: API Endpoints
 */

import express from 'express';
import { body, query } from 'express-validator';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validator.js';
import {
  trackActivity,
  getStudentTimeline,
  getClassActivity
} from '../controllers/activity.controller.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * Track student activity
 * POST /api/activity/track
 */
router.post(
  '/track',
  [
    body('studentId')
      .notEmpty()
      .withMessage('Student ID is required')
      .isMongoId()
      .withMessage('Invalid student ID format'),
    body('activityType')
      .notEmpty()
      .withMessage('Activity type is required')
      .isIn([
        'module_complete',
        'quiz_attempt',
        'quiz_complete',
        'game_play',
        'game_complete',
        'login',
        'logout',
        'progress_update',
        'safety_status_change',
        'badge_earned',
        'xp_milestone',
        'location_update',
        'drill_participation',
        'drill_complete'
      ])
      .withMessage('Invalid activity type'),
    body('activityData')
      .optional()
      .isObject()
      .withMessage('Activity data must be an object')
  ],
  validate,
  trackActivity
);

/**
 * Get student activity timeline
 * GET /api/activity/student/:studentId
 */
router.get(
  '/student/:studentId',
  [
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid ISO 8601 date'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid ISO 8601 date'),
    query('activityType')
      .optional()
      .isIn([
        'module_complete',
        'quiz_attempt',
        'quiz_complete',
        'game_play',
        'game_complete',
        'login',
        'logout',
        'progress_update',
        'safety_status_change',
        'badge_earned',
        'xp_milestone',
        'location_update',
        'drill_participation',
        'drill_complete'
      ])
      .withMessage('Invalid activity type'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer')
  ],
  validate,
  getStudentTimeline
);

/**
 * Get class activity summary
 * GET /api/activity/class/:classId
 */
router.get(
  '/class/:classId',
  [
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid ISO 8601 date'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid ISO 8601 date'),
    query('activityType')
      .optional()
      .isIn([
        'module_complete',
        'quiz_attempt',
        'quiz_complete',
        'game_play',
        'game_complete',
        'login',
        'logout',
        'progress_update',
        'safety_status_change',
        'badge_earned',
        'xp_milestone',
        'location_update',
        'drill_participation',
        'drill_complete'
      ])
      .withMessage('Invalid activity type')
  ],
  validate,
  getClassActivity
);

export default router;

