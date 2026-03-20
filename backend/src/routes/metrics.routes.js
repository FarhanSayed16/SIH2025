/**
 * Phase 3.5.1: Metrics Routes
 * Provides performance and cache metrics endpoints
 */

import express from 'express';
import {
  getMetrics,
  resetMetrics
} from '../controllers/performance.controller.js';
import {
  getCacheMetrics
} from '../controllers/metrics.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/rbac.middleware.js';

const router = express.Router();

/**
 * @route   GET /api/metrics/performance
 * @desc    Get system performance metrics
 * @access  Public (can be protected in production)
 */
router.get('/performance', getMetrics);

/**
 * @route   POST /api/metrics/performance/reset
 * @desc    Reset performance metrics (Admin only)
 * @access  Private - Admin
 */
router.post('/performance/reset', authenticate, requireAdmin, resetMetrics);

/**
 * @route   GET /api/metrics/cache
 * @desc    Get cache statistics
 * @access  Public (can be protected in production)
 */
router.get('/cache', getCacheMetrics);

export default router;

