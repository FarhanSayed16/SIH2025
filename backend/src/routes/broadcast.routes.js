/**
 * Phase 3.4.3: Broadcast Routes
 * API routes for broadcast messages
 */

import express from 'express';
import { body, query } from 'express-validator';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validator.js';
import {
  sendBroadcastEndpoint,
  scheduleBroadcastEndpoint,
  getBroadcasts,
  getBroadcastById,
  getBroadcastStatistics
} from '../controllers/broadcast.controller.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * Send broadcast
 * POST /api/broadcast/send
 */
router.post(
  '/send',
  body('type').isIn(['emergency', 'announcement', 'drill', 'general']).withMessage('Valid type is required'),
  body('recipients.type').isIn(['all', 'students', 'teachers', 'parents', 'admins', 'custom']).withMessage('Valid recipient type is required'),
  body('channels').isArray().withMessage('Channels array is required'),
  body('message').notEmpty().withMessage('Message is required'),
  validate,
  sendBroadcastEndpoint
);

/**
 * Schedule broadcast
 * POST /api/broadcast/schedule
 */
router.post(
  '/schedule',
  body('scheduledAt').isISO8601().withMessage('Valid scheduledAt date is required'),
  body('type').isIn(['emergency', 'announcement', 'drill', 'general']).withMessage('Valid type is required'),
  body('recipients.type').isIn(['all', 'students', 'teachers', 'parents', 'admins', 'custom']).withMessage('Valid recipient type is required'),
  body('channels').isArray().withMessage('Channels array is required'),
  body('message').notEmpty().withMessage('Message is required'),
  validate,
  scheduleBroadcastEndpoint
);

/**
 * Get broadcasts
 * GET /api/broadcast
 */
router.get(
  '/',
  query('type').optional().isIn(['emergency', 'announcement', 'drill', 'general']),
  query('status').optional().isIn(['draft', 'scheduled', 'sending', 'sent', 'failed', 'cancelled']),
  validate,
  getBroadcasts
);

/**
 * Get broadcast by ID
 * GET /api/broadcast/:id
 */
router.get(
  '/:id',
  getBroadcastById
);

/**
 * Get broadcast statistics
 * GET /api/broadcast/:id/stats
 */
router.get(
  '/:id/stats',
  getBroadcastStatistics
);

export default router;

