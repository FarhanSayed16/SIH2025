/**
 * Phase 4.7: Safe Zone Routes
 */

import express from 'express';
import { param, query } from 'express-validator';
import {
  getSafeZonesForSchool,
  findNearest,
  getWithinRadius,
} from '../controllers/safeZone.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validator.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * Find nearest safe zone
 * GET /api/safe-zones/nearest
 * IMPORTANT: This route must come BEFORE /:schoolId to avoid route conflict
 */
router.get(
  '/nearest',
  query('schoolId').isMongoId().withMessage('Invalid school ID'),
  query('lat').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude is required'),
  query('lng').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude is required'),
  query('alertType').optional().isIn(['fire', 'earthquake', 'flood', 'cyclone', 'stampede', 'medical', 'other']),
  validate,
  findNearest
);

/**
 * Get safe zones within radius
 * GET /api/safe-zones/:schoolId/within-radius
 * IMPORTANT: This route must come BEFORE /:schoolId to avoid route conflict
 */
router.get(
  '/:schoolId/within-radius',
  param('schoolId').isMongoId().withMessage('Invalid school ID'),
  query('lat').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude is required'),
  query('lng').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude is required'),
  query('radius').optional().isFloat({ min: 0 }).withMessage('Radius must be positive'),
  validate,
  getWithinRadius
);

/**
 * Get all safe zones for a school
 * GET /api/safe-zones/:schoolId
 */
router.get(
  '/:schoolId',
  param('schoolId').isMongoId().withMessage('Invalid school ID'),
  query('alertType').optional().isIn(['fire', 'earthquake', 'flood', 'cyclone', 'stampede', 'medical', 'other']),
  validate,
  getSafeZonesForSchool
);

export default router;

