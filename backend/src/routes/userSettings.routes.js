/**
 * Phase 4.9: User Settings Routes
 */

import express from 'express';
import { body } from 'express-validator';
import {
  getUserSettingsController,
  updateUserSettingsController,
  updateAccessibilitySettingsController,
  updateLanguagePreferenceController,
  updateUIPreferencesController,
  getSupportedLanguagesController,
} from '../controllers/userSettings.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validator.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * Get user settings
 * GET /api/settings
 */
router.get('/', getUserSettingsController);

/**
 * Update user settings
 * PUT /api/settings
 */
router.put(
  '/',
  body('language').optional().isIn(['en', 'hi', 'mr', 'pa']).withMessage('Invalid language code'),
  body('accessibility.highContrast').optional().isBoolean(),
  body('accessibility.fontSize').optional().isIn(['small', 'medium', 'large', 'xlarge']),
  body('accessibility.screenReader').optional().isBoolean(),
  body('accessibility.reducedMotion').optional().isBoolean(),
  body('accessibility.colorBlindMode').optional().isIn(['none', 'protanopia', 'deuteranopia', 'tritanopia']),
  body('ui.theme').optional().isIn(['light', 'dark', 'auto']),
  body('ui.animations').optional().isBoolean(),
  body('ui.compactMode').optional().isBoolean(),
  validate,
  updateUserSettingsController
);

/**
 * Update accessibility settings
 * PUT /api/settings/accessibility
 */
router.put(
  '/accessibility',
  body('highContrast').optional().isBoolean(),
  body('fontSize').optional().isIn(['small', 'medium', 'large', 'xlarge']),
  body('screenReader').optional().isBoolean(),
  body('reducedMotion').optional().isBoolean(),
  body('colorBlindMode').optional().isIn(['none', 'protanopia', 'deuteranopia', 'tritanopia']),
  validate,
  updateAccessibilitySettingsController
);

/**
 * Update language preference
 * PUT /api/settings/language
 */
router.put(
  '/language',
  body('language').isIn(['en', 'hi', 'mr', 'pa']).withMessage('Invalid language code'),
  validate,
  updateLanguagePreferenceController
);

/**
 * Update UI preferences
 * PUT /api/settings/ui
 */
router.put(
  '/ui',
  body('theme').optional().isIn(['light', 'dark', 'auto']),
  body('animations').optional().isBoolean(),
  body('compactMode').optional().isBoolean(),
  validate,
  updateUIPreferencesController
);

/**
 * Get supported languages
 * GET /api/settings/languages
 */
router.get('/languages', getSupportedLanguagesController);

export default router;

