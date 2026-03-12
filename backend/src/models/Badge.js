/**
 * Phase 3.3.3: Badge Model
 * Defines available badges and their criteria
 */

import mongoose from 'mongoose';

const badgeSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  icon: {
    type: String, // Icon name or emoji
    default: '🏅'
  },
  category: {
    type: String,
    enum: ['module', 'game', 'drill', 'streak', 'achievement', 'special'],
    default: 'achievement'
  },
  // Criteria for earning the badge
  criteria: {
    type: {
      type: String,
      enum: ['module_complete', 'module_all', 'game_wins', 'game_perfect', 'drill_ack', 'drill_speed', 'streak_days', 'score_threshold', 'custom'],
      required: true
    },
    value: {
      type: mongoose.Schema.Types.Mixed, // Can be number, string, or object
      required: true
    },
    // For module badges: module category or specific module ID
    moduleCategory: {
      type: String,
      default: null
    },
    // For game badges: game type
    gameType: {
      type: String,
      enum: ['bag-packer', 'hazard-hunter', 'earthquake-shake', 'all'],
      default: null
    }
  },
  // Points/XP reward for earning badge
  xpReward: {
    type: Number,
    default: 50,
    min: 0
  },
  // Grade level restrictions
  gradeLevel: {
    type: [String],
    enum: ['KG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', 'all'],
    default: ['all']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isRare: {
    type: Boolean,
    default: false // Rare badges are harder to earn
  },
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes
badgeSchema.index({ id: 1 }, { unique: true });
badgeSchema.index({ category: 1, isActive: 1 });

const Badge = mongoose.model('Badge', badgeSchema);

export default Badge;

