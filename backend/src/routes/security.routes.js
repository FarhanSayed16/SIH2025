/**
 * Phase 3.4.4: Security Routes
 * API routes for security monitoring
 */

import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/rbac.middleware.js';
import { getSecurityStatsEndpoint } from '../controllers/security.controller.js';

const router = express.Router();

// All routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

/**
 * Get security statistics
 * GET /api/security/stats
 * Admin only
 */
router.get('/stats', getSecurityStatsEndpoint);

export default router;

