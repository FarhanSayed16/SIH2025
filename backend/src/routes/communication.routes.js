/**
 * Phase 3.4.3: Communication Routes
 * API routes for communication features
 */

import express from 'express';
import { body, query } from 'express-validator';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validator.js';
import {
  sendNotificationEndpoint,
  sendNotificationWithTemplateEndpoint,
  sendTestToUser,
  getCommunicationLogs,
  getStatistics,
  updateStatus
} from '../controllers/communication.controller.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * Send notification
 * POST /api/communication/send
 */
router.post(
  '/send',
  body('channel').isIn(['sms', 'email', 'push']).withMessage('Valid channel is required'),
  body('recipient').notEmpty().withMessage('Recipient is required'),
  body('body').notEmpty().withMessage('Message body is required'),
  validate,
  sendNotificationEndpoint
);

/**
 * Send notification with template
 * POST /api/communication/send-template
 */
router.post(
  '/send-template',
  body('templateId').optional().isMongoId().withMessage('Valid template ID is required'),
  body('templateName').optional().notEmpty().withMessage('Template name is required'),
  body('channel').isIn(['sms', 'email', 'push']).withMessage('Valid channel is required'),
  body('recipient').notEmpty().withMessage('Recipient is required'),
  validate,
  sendNotificationWithTemplateEndpoint
);

/**
 * Get communication logs
 * GET /api/communication/logs
 */
router.get(
  '/logs',
  query('channel').optional().isIn(['sms', 'email', 'push']),
  query('status').optional().isIn(['pending', 'sent', 'delivered', 'failed', 'bounced', 'undelivered', 'skipped']),
  query('userId').optional().isMongoId().withMessage('Valid userId is required'),
  validate,
  getCommunicationLogs
);

/**
 * Send test notification to a specific user (push + email by default)
 * POST /api/communication/test-user
 */
router.post(
  '/test-user',
  body('userId').isMongoId().withMessage('Valid userId is required'),
  body('channels').optional().isArray().withMessage('channels must be an array'),
  validate,
  sendTestToUser
);

/**
 * Get delivery statistics
 * GET /api/communication/statistics
 */
router.get(
  '/statistics',
  getStatistics
);

/**
 * Update delivery status (webhook)
 * POST /api/communication/status/:messageId
 */
router.post(
  '/status/:messageId',
  body('status').isIn(['pending', 'sent', 'delivered', 'failed', 'bounced', 'undelivered', 'skipped']).withMessage('Valid status is required'),
  validate,
  updateStatus
);

export default router;

