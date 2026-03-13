/**
 * Phase 3.5.6: Event Log Model
 * Tracks user actions and events for analytics
 */

import mongoose from 'mongoose';

const eventLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true,
    index: true
  },
  eventType: {
    type: String,
    enum: [
      'module_view',
      'module_start',
      'module_complete',
      'quiz_attempt',
      'quiz_complete',
      'game_attempt',
      'game_complete',
      'drill_participate',
      'drill_complete',
      'hazard_recognize',
      'hazard_verify',
      'content_view',
      'content_interact'
    ],
    required: true,
    index: true
  },
  entityType: {
    type: String,
    enum: ['module', 'quiz', 'game', 'drill', 'hazard', 'content'],
    required: true,
    index: true
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
    // Can include: score, accuracy, timeTaken, itemsCorrect, etc.
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  // For tracking streaks
  streakContext: {
    type: String,
    enum: ['module', 'game', 'quiz', 'drill', 'login'],
    default: null
  },
  streakCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
eventLogSchema.index({ userId: 1, eventType: 1, timestamp: -1 });
eventLogSchema.index({ institutionId: 1, eventType: 1, timestamp: -1 });
eventLogSchema.index({ entityType: 1, entityId: 1, timestamp: -1 });
eventLogSchema.index({ timestamp: -1 }); // For time-based queries
eventLogSchema.index({ userId: 1, streakContext: 1, timestamp: -1 }); // For streak tracking

// TTL index - optionally expire old events after 1 year
eventLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 31536000 });

const EventLog = mongoose.model('EventLog', eventLogSchema);

export default EventLog;

