/**
 * Phase 3.1.3: Audio Routes
 * Handles audio file upload, retrieval, and deletion
 */

import express from 'express';
import { param } from 'express-validator';
import {
  uploadModuleAudio,
  getAudioFile,
  deleteAudio,
  uploadAudio
} from '../controllers/audioController.js';
import { authenticate, optionalAuth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validator.js';

const router = express.Router();

// Upload audio for module (requires auth)
router.post(
  '/modules/:id/audio',
  authenticate,
  param('id').isMongoId().withMessage('Invalid module ID'),
  validate,
  uploadAudio.single('audio'),
  uploadModuleAudio
);

// Get audio file (public)
router.get(
  '/audio/:filename',
  optionalAuth,
  param('filename').notEmpty().withMessage('Filename is required'),
  validate,
  getAudioFile
);

// Delete audio file (requires auth)
router.delete(
  '/audio/:filename',
  authenticate,
  param('filename').notEmpty().withMessage('Filename is required'),
  validate,
  deleteAudio
);

export default router;

