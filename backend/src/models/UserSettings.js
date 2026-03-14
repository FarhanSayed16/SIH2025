/**
 * Phase 4.9: User Settings Model
 * Stores user preferences for accessibility, language, and UI settings
 */

import mongoose from 'mongoose';

const userSettingsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true,
  },
  // Language Preferences
  language: {
    type: String,
    enum: ['en', 'hi', 'mr', 'pa'], // English, Hindi, Marathi, Punjabi
    default: 'en',
  },
  // Accessibility Settings
  accessibility: {
    highContrast: {
      type: Boolean,
      default: false,
    },
    fontSize: {
      type: String,
      enum: ['small', 'medium', 'large', 'xlarge'],
      default: 'medium',
    },
    screenReader: {
      type: Boolean,
      default: false,
    },
    reducedMotion: {
      type: Boolean,
      default: false,
    },
    colorBlindMode: {
      type: String,
      enum: ['none', 'protanopia', 'deuteranopia', 'tritanopia'],
      default: 'none',
    },
  },
  // UI Preferences
  ui: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'auto',
    },
    animations: {
      type: Boolean,
      default: true,
    },
    compactMode: {
      type: Boolean,
      default: false,
    },
  },
  // Notification Preferences
  notifications: {
    email: {
      type: Boolean,
      default: true,
    },
    push: {
      type: Boolean,
      default: true,
    },
    sms: {
      type: Boolean,
      default: false,
    },
  },
}, {
  timestamps: true,
});

// Indexes
userSettingsSchema.index({ userId: 1 });

// Method to get default settings
userSettingsSchema.statics.getDefaultSettings = function() {
  return {
    language: 'en',
    accessibility: {
      highContrast: false,
      fontSize: 'medium',
      screenReader: false,
      reducedMotion: false,
      colorBlindMode: 'none',
    },
    ui: {
      theme: 'auto',
      animations: true,
      compactMode: false,
    },
    notifications: {
      email: true,
      push: true,
      sms: false,
    },
  };
};

// Method to update settings
userSettingsSchema.methods.updateSettings = function(updates) {
  if (updates.language) {
    this.language = updates.language;
  }

  if (updates.accessibility) {
    this.accessibility = {
      ...this.accessibility,
      ...updates.accessibility,
    };
  }

  if (updates.ui) {
    this.ui = {
      ...this.ui,
      ...updates.ui,
    };
  }

  if (updates.notifications) {
    this.notifications = {
      ...this.notifications,
      ...updates.notifications,
    };
  }

  return this.save();
};

const UserSettings = mongoose.model('UserSettings', userSettingsSchema);

export default UserSettings;

