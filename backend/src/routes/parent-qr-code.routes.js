/**
 * Parent QR Code Routes
 * API endpoints for parent-student relationship QR codes
 * Phase 2: API Endpoints
 */

import express from 'express';
import { body, param } from 'express-validator';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validator.js';
import {
  generateQR,
  verifyQR,
  refreshQR,
  getStudentQRCodes,
  getParentQRCodes,
  getQRCodeDetailsController
} from '../controllers/parent-qr-code.controller.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * Generate QR code for parent-student relationship
 * POST /api/qr/parent/generate
 */
router.post(
  '/generate',
  [
    body('parentId')
      .notEmpty()
      .withMessage('Parent ID is required')
      .isMongoId()
      .withMessage('Invalid parent ID format'),
    body('studentId')
      .notEmpty()
      .withMessage('Student ID is required')
      .isMongoId()
      .withMessage('Invalid student ID format')
  ],
  validate,
  generateQR
);

/**
 * Verify QR code (when teacher scans it)
 * POST /api/qr/parent/verify
 */
router.post(
  '/verify',
  [
    body('qrCodeData')
      .notEmpty()
      .withMessage('QR code data is required')
      .isString()
      .withMessage('QR code data must be a string'),
    body('location')
      .optional()
      .isObject()
      .withMessage('Location must be an object'),
    body('location.lat')
      .optional()
      .isFloat({ min: -90, max: 90 })
      .withMessage('Latitude must be between -90 and 90'),
    body('location.lng')
      .optional()
      .isFloat({ min: -180, max: 180 })
      .withMessage('Longitude must be between -180 and 180')
  ],
  validate,
  verifyQR
);

/**
 * Refresh QR code
 * POST /api/qr/parent/:qrCodeId/refresh
 */
router.post(
  '/:qrCodeId/refresh',
  [
    param('qrCodeId')
      .isMongoId()
      .withMessage('Invalid QR code ID format')
  ],
  validate,
  refreshQR
);

/**
 * Get QR codes for a student's parents
 * GET /api/qr/parent/student/:studentId
 */
router.get(
  '/student/:studentId',
  [
    param('studentId')
      .isMongoId()
      .withMessage('Invalid student ID format')
  ],
  validate,
  getStudentQRCodes
);

/**
 * Get QR codes for authenticated parent's children
 * GET /api/qr/parent/qr-codes
 */
router.get(
  '/qr-codes',
  getParentQRCodes
);

/**
 * Get QR code details by ID
 * GET /api/qr/parent/:qrCodeId
 */
router.get(
  '/:qrCodeId',
  [
    param('qrCodeId')
      .isMongoId()
      .withMessage('Invalid QR code ID format')
  ],
  validate,
  getQRCodeDetailsController
);

export default router;

