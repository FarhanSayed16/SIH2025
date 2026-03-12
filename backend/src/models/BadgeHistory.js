/**
 * Phase 3.3.3: Badge History Model
 * Tracks when badges were awarded to users
 */

import mongoose from 'mongoose';

const badgeHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  badgeId: {
    type: String,
    required: true,
    index: true
  },
  awardedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  xpEarned: {
    type: Number,
    default: 0,
    min: 0
  },
  triggerType: {
    type: String,
    enum: ['module', 'game', 'drill', 'streak', 'score', 'manual'],
    default: 'manual'
  },
  triggerData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Compound indexes
badgeHistorySchema.index({ userId: 1, awardedAt: -1 });
badgeHistorySchema.index({ badgeId: 1, awardedAt: -1 });
badgeHistorySchema.index({ userId: 1, badgeId: 1 }, { unique: true }); // Prevent duplicate awards (though we check in code too)

const BadgeHistory = mongoose.model('BadgeHistory', badgeHistorySchema);

export default BadgeHistory;

