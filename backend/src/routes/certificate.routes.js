import express from 'express';
import { body, param } from 'express-validator';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validator.js';
import {
  generateCertificateController,
  getMyCertificates,
  getCertificate,
  downloadCertificate,
  checkCertificates
} from '../controllers/certificate.controller.js';

const router = express.Router();

/**
 * POST /api/certificates/generate
 * Generate a new certificate
 */
router.post(
  '/generate',
  authenticate,
  [
    body('certificateType')
      .isIn(['module_completion', 'score_milestone', 'badge_achievement', 'all_modules_completed'])
      .withMessage('Invalid certificate type'),
    body('achievement')
      .notEmpty()
      .trim()
      .withMessage('Achievement description is required'),
    body('metadata').optional().isObject(),
  ],
  validate,
  generateCertificateController
);

/**
 * GET /api/certificates/my-certificates
 * Get current user's certificates
 */
router.get(
  '/my-certificates',
  authenticate,
  getMyCertificates
);

/**
 * GET /api/certificates/:id
 * Get specific certificate details
 */
router.get(
  '/:id',
  authenticate,
  [
    param('id').isMongoId().withMessage('Invalid certificate ID'),
    validate
  ],
  getCertificate
);

/**
 * GET /api/certificates/:id/download
 * Download certificate PDF
 */
router.get(
  '/:id/download',
  authenticate,
  [
    param('id').isMongoId().withMessage('Invalid certificate ID'),
    validate
  ],
  downloadCertificate
);

/**
 * POST /api/certificates/check
 * Check and generate certificates for achievements
 */
router.post(
  '/check',
  authenticate,
  [
    body('triggerType').optional().isString().trim(),
    body('triggerData').optional().isObject(),
    validate
  ],
  checkCertificates
);

export default router;

