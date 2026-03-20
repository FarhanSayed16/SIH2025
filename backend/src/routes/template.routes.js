/**
 * Phase 3.4.3: Template Routes
 * API routes for message templates
 */

import express from 'express';
import { body, query } from 'express-validator';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validator.js';
import {
  createTemplateEndpoint,
  getTemplatesEndpoint,
  getTemplateByIdEndpoint,
  updateTemplateEndpoint,
  deleteTemplateEndpoint,
  previewTemplateEndpoint
} from '../controllers/template.controller.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * Create template
 * POST /api/templates
 */
router.post(
  '/',
  body('name').notEmpty().withMessage('Template name is required'),
  body('category').isIn(['emergency', 'drill', 'announcement', 'parent', 'general']).withMessage('Valid category is required'),
  body('channels').isArray().withMessage('Channels array is required'),
  validate,
  createTemplateEndpoint
);

/**
 * Get templates
 * GET /api/templates
 */
router.get(
  '/',
  query('category').optional().isIn(['emergency', 'drill', 'announcement', 'parent', 'general']),
  query('channel').optional().isIn(['sms', 'email', 'push']),
  validate,
  getTemplatesEndpoint
);

/**
 * Get template by ID
 * GET /api/templates/:id
 */
router.get(
  '/:id',
  getTemplateByIdEndpoint
);

/**
 * Update template
 * PUT /api/templates/:id
 */
router.put(
  '/:id',
  validate,
  updateTemplateEndpoint
);

/**
 * Delete template
 * DELETE /api/templates/:id
 */
router.delete(
  '/:id',
  deleteTemplateEndpoint
);

/**
 * Preview template
 * POST /api/templates/:id/preview
 */
router.post(
  '/:id/preview',
  body('channel').isIn(['sms', 'email', 'push']).withMessage('Valid channel is required'),
  validate,
  previewTemplateEndpoint
);

export default router;

