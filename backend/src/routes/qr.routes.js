import express from 'express';
import { body } from 'express-validator';
import {
  generateQR,
  generateQRForClassBulk,
  regenerateQR
} from '../controllers/qr-generator.controller.js';
import { verifyQR } from '../controllers/qr-auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validator.js';

const router = express.Router();

// Generate QR for student (requires auth - admin/teacher)
router.post(
  '/generate/:studentId',
  authenticate,
  generateQR
);

// Bulk generate QR for class (requires auth - admin/teacher)
router.post(
  '/generate-class/:classId',
  authenticate,
  generateQRForClassBulk
);

// Regenerate QR for student (requires auth - admin/teacher)
router.post(
  '/regenerate/:studentId',
  authenticate,
  regenerateQR
);

// Verify QR code (public - for scanning)
router.get(
  '/verify/:qrCode',
  verifyQR
);

export default router;

