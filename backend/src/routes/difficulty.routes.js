/**
 * Phase 3.1.5: Difficulty Routes
 * Routes for grade-based difficulty and adaptive complexity
 */

import express from 'express';
import { param } from 'express-validator';
import {
  getDifficultyRecommendations,
  getQuizSettings
} from '../controllers/difficulty.controller.js';
import { optionalAuth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validator.js';

const router = express.Router();

// Get difficulty recommendations for grade level
router.get(
  '/recommendations/:gradeLevel',
  optionalAuth,
  param('gradeLevel').isIn(['KG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']).withMessage('Invalid grade level'),
  validate,
  getDifficultyRecommendations
);

// Get adaptive quiz settings for grade level
router.get(
  '/quiz-settings/:gradeLevel',
  optionalAuth,
  param('gradeLevel').isIn(['KG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']).withMessage('Invalid grade level'),
  validate,
  getQuizSettings
);

export default router;

