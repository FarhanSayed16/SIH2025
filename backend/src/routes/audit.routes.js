/**
 * Phase 3.4.4: Audit Routes
 * API routes for audit logs
 */

import express from 'express';
import { query } from 'express-validator';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validator.js';
import {
  getAuditLogsEndpoint,
  getSecurityEventsEndpoint,
  getSuspiciousActivitiesEndpoint
} from '../controllers/audit.controller.js';

const router = express.Router();

// All routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

/**
 * Get audit logs
 * GET /api/audit/logs
 * Admin only
 */
router.get(
  '/logs',
  query('action').optional().isIn([
    'login', 'logout', 'create', 'read', 'update', 'delete',
    'export', 'import', 'authentication_failure', 'authorization_failure',
    'rate_limit_exceeded', 'data_access', 'data_modification',
    'data_deletion', 'configuration_change', 'permission_change',
    'password_change', 'account_creation', 'account_deletion',
    'gdpr_export', 'gdpr_deletion', 'security_event', 'other'
  ]),
  query('severity').optional().isIn(['low', 'medium', 'high', 'critical']),
  validate,
  getAuditLogsEndpoint
);

/**
 * Get security events
 * GET /api/audit/security
 * Admin only
 */
router.get(
  '/security',
  getSecurityEventsEndpoint
);

/**
 * Get suspicious activities
 * GET /api/audit/suspicious
 * Admin only
 */
router.get(
  '/suspicious',
  getSuspiciousActivitiesEndpoint
);

export default router;

