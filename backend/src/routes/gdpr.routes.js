/**
 * Phase 3.4.4: GDPR Routes
 * API routes for GDPR compliance
 */

import express from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validator.js';
import { exportData, deleteData } from '../controllers/gdpr.controller.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * Export user data (GDPR Right to Data Portability)
 * GET /api/gdpr/export
 */
router.get(
  '/export',
  exportData
);

/**
 * Delete user data (GDPR Right to be Forgotten)
 * DELETE /api/gdpr/delete
 */
router.delete(
  '/delete',
  body('confirm').equals('true').withMessage('Deletion confirmation required'),
  validate,
  deleteData
);

export default router;

