/**
 * Phase 4.9: User Settings Service
 * Manages user preferences and settings
 */

import UserSettings from '../models/UserSettings.js';
import logger from '../config/logger.js';

/**
 * Get user settings (creates defaults if not exists)
 */
export const getUserSettings = async (userId) => {
  try {
    let settings = await UserSettings.findOne({ userId });

    if (!settings) {
      // Create default settings
      settings = new UserSettings({
        userId,
        ...UserSettings.getDefaultSettings(),
      });
      await settings.save();
    }

    return settings;
  } catch (error) {
    logger.error('Get user settings error:', error);
    throw error;
  }
};

/**
 * Update user settings
 */
export const updateUserSettings = async (userId, updates) => {
  try {
    let settings = await UserSettings.findOne({ userId });

    if (!settings) {
      // Create new settings if doesn't exist
      settings = new UserSettings({
        userId,
        ...UserSettings.getDefaultSettings(),
      });
    }

    await settings.updateSettings(updates);
    return settings;
  } catch (error) {
    logger.error('Update user settings error:', error);
    throw error;
  }
};

/**
 * Update accessibility settings
 */
export const updateAccessibilitySettings = async (userId, accessibilityUpdates) => {
  try {
    return await updateUserSettings(userId, { accessibility: accessibilityUpdates });
  } catch (error) {
    logger.error('Update accessibility settings error:', error);
    throw error;
  }
};

/**
 * Update language preference
 */
export const updateLanguagePreference = async (userId, language) => {
  try {
    if (!['en', 'hi', 'mr', 'pa'].includes(language)) {
      throw new Error('Invalid language code. Supported: en, hi, mr, pa');
    }

    return await updateUserSettings(userId, { language });
  } catch (error) {
    logger.error('Update language preference error:', error);
    throw error;
  }
};

/**
 * Update UI preferences
 */
export const updateUIPreferences = async (userId, uiUpdates) => {
  try {
    return await updateUserSettings(userId, { ui: uiUpdates });
  } catch (error) {
    logger.error('Update UI preferences error:', error);
    throw error;
  }
};

/**
 * Get supported languages
 */
export const getSupportedLanguages = () => {
  return [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
    { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
    { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
  ];
};

