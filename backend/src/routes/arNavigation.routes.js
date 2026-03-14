/**
 * Phase 4.7: AR Navigation Routes
 */

import express from 'express';
import { body, param, query } from 'express-validator';
import {
  calculateRoute,
  getMarkers,
  getInstructions,
} from '../controllers/arNavigation.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validator.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * Calculate AR route
 * POST /api/ar-navigation/route
 */
router.post(
  '/route',
  body('schoolId').notEmpty().withMessage('School ID is required'),
  body('startLat').isFloat({ min: -90, max: 90 }).withMessage('Valid start latitude is required'),
  body('startLng').isFloat({ min: -180, max: 180 }).withMessage('Valid start longitude is required'),
  body('endLat').optional().isFloat({ min: -90, max: 90 }),
  body('endLng').optional().isFloat({ min: -180, max: 180 }),
  body('alertType').optional().isIn(['fire', 'earthquake', 'flood', 'cyclone', 'stampede', 'medical', 'other']),
  validate,
  calculateRoute
);

/**
 * Get AR markers for a school
 * GET /api/ar-navigation/markers/:schoolId
 */
router.get(
  '/markers/:schoolId',
  param('schoolId').isMongoId().withMessage('Invalid school ID'),
  query('alertType').optional().isIn(['fire', 'earthquake', 'flood', 'cyclone', 'stampede', 'medical', 'other']),
  validate,
  getMarkers
);

/**
 * Get route instructions
 * GET /api/ar-navigation/instructions/:routeId
 */
router.get(
  '/instructions/:routeId',
  param('routeId').notEmpty().withMessage('Route ID is required'),
  validate,
  getInstructions
);

export default router;

