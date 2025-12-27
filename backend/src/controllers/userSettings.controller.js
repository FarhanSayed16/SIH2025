/**
 * Phase 4.9: User Settings Controller
 * Handles user settings API endpoints
 */

import {
  getUserSettings,
  updateUserSettings,
  updateAccessibilitySettings,
  updateLanguagePreference,
  updateUIPreferences,
  getSupportedLanguages,
} from '../services/userSettings.service.js';
import { successResponse, errorResponse } from '../utils/response.js';
import logger from '../config/logger.js';

/**
 * Get user settings
 * GET /api/settings
 */
export const getUserSettingsController = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const settings = await getUserSettings(userId);

    return successResponse(
      res,
      settings,
      'User settings retrieved successfully'
    );
  } catch (error) {
    logger.error('Get user settings controller error:', error);
    return errorResponse(
      res,
      error.message || 'Failed to retrieve user settings',
      500
    );
  }
};

/**
 * Update user settings
 * PUT /api/settings
 */
export const updateUserSettingsController = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const updates = req.body;

    // Validate updates
    if (updates.language && !['en', 'hi', 'mr', 'pa'].includes(updates.language)) {
      return errorResponse(res, 'Invalid language code. Supported: en, hi, mr, pa', 400);
    }

    const settings = await updateUserSettings(userId, updates);

    return successResponse(
      res,
      settings,
      'User settings updated successfully'
    );
  } catch (error) {
    logger.error('Update user settings controller error:', error);
    return errorResponse(
      res,
      error.message || 'Failed to update user settings',
      500
    );
  }
};

/**
 * Update accessibility settings
 * PUT /api/settings/accessibility
 */
export const updateAccessibilitySettingsController = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const accessibilityUpdates = req.body;

    const settings = await updateAccessibilitySettings(userId, accessibilityUpdates);

    return successResponse(
      res,
      settings,
      'Accessibility settings updated successfully'
    );
  } catch (error) {
    logger.error('Update accessibility settings controller error:', error);
    return errorResponse(
      res,
      error.message || 'Failed to update accessibility settings',
      500
    );
  }
};

/**
 * Update language preference
 * PUT /api/settings/language
 */
export const updateLanguagePreferenceController = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { language } = req.body;

    if (!language) {
      return errorResponse(res, 'Language code is required', 400);
    }

    const settings = await updateLanguagePreference(userId, language);

    return successResponse(
      res,
      settings,
      'Language preference updated successfully'
    );
  } catch (error) {
    logger.error('Update language preference controller error:', error);
    return errorResponse(
      res,
      error.message || 'Failed to update language preference',
      500
    );
  }
};

/**
 * Update UI preferences
 * PUT /api/settings/ui
 */
export const updateUIPreferencesController = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const uiUpdates = req.body;

    const settings = await updateUIPreferences(userId, uiUpdates);

    return successResponse(
      res,
      settings,
      'UI preferences updated successfully'
    );
  } catch (error) {
    logger.error('Update UI preferences controller error:', error);
    return errorResponse(
      res,
      error.message || 'Failed to update UI preferences',
      500
    );
  }
};

/**
 * Get supported languages
 * GET /api/settings/languages
 */
export const getSupportedLanguagesController = async (req, res) => {
  try {
    const languages = getSupportedLanguages();

    return successResponse(
      res,
      { languages },
      'Supported languages retrieved successfully'
    );
  } catch (error) {
    logger.error('Get supported languages controller error:', error);
    return errorResponse(
      res,
      error.message || 'Failed to retrieve supported languages',
      500
    );
  }
};

