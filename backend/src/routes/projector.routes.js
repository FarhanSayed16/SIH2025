import express from 'express';
import { body } from 'express-validator';
import {
  create,
  getActive,
  get,
  updateSessionContent,
  connect,
  end
} from '../controllers/projector.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validator.js';

const router = express.Router();

// Create session (requires auth - teacher/admin)
router.post(
  '/sessions',
  authenticate,
  body('deviceId').isMongoId().withMessage('Valid device ID is required'),
  body('institutionId').isMongoId().withMessage('Valid institution ID is required'),
  body('classId').optional().isMongoId().withMessage('Valid class ID is required'),
  validate,
  create
);

// Get active session for device (public - for projector device)
router.get('/sessions/device/:deviceId', getActive);

// Get session by ID (public - for connecting devices)
router.get('/sessions/:sessionId', get);

// Update content (requires auth - teacher/admin)
router.put(
  '/sessions/:sessionId/content',
  authenticate,
  body('contentData').isObject().withMessage('Content data is required'),
  validate,
  updateSessionContent
);

// Connect device (public - for mobile controllers)
router.post(
  '/sessions/:sessionId/connect',
  body('deviceId').notEmpty().withMessage('Device ID is required'),
  body('deviceName').notEmpty().withMessage('Device name is required'),
  validate,
  connect
);

// End session (requires auth - teacher/admin)
router.post(
  '/sessions/:sessionId/end',
  authenticate,
  end
);

export default router;

