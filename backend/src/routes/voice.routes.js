/**
 * Phase 3.5.5: Voice Routes
 */

import express from 'express';
import { body, query } from 'express-validator';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validator.js';
import {
  processCommand,
  getAvailableCommands,
  testCommand,
} from '../controllers/voice.controller.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/voice/command
 * @desc    Process voice command
 * @access  Private
 */
router.post(
  '/command',
  [
    body('text')
      .notEmpty()
      .trim()
      .withMessage('Text is required'),
    body('context')
      .optional()
      .isIn(['module', 'quiz', 'game', 'home', 'any'])
      .withMessage('Invalid context'),
  ],
  validate,
  processCommand
);

/**
 * @route   GET /api/voice/commands
 * @desc    Get available commands
 * @access  Private
 * @query   context (optional)
 */
router.get(
  '/commands',
  [
    query('context')
      .optional()
      .isIn(['module', 'quiz', 'game', 'home', 'any'])
      .withMessage('Invalid context'),
  ],
  validate,
  getAvailableCommands
);

/**
 * @route   POST /api/voice/test
 * @desc    Test command parsing (development)
 * @access  Private (Admin only in production)
 */
router.post(
  '/test',
  [
    body('text')
      .notEmpty()
      .trim()
      .withMessage('Text is required'),
    body('context')
      .optional()
      .isIn(['module', 'quiz', 'game', 'home', 'any'])
      .withMessage('Invalid context'),
  ],
  validate,
  testCommand
);

export default router;

