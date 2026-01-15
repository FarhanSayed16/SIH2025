/**
 * Phase 5.7: AR Session Model
 * Tracks AR session metadata for analytics and sync
 */

import mongoose from 'mongoose';

const arSessionSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      index: true,
    },
    sessionType: {
      type: String,
      enum: ['path_placement', 'fire_simulation'],
      required: true,
    },
    eventType: {
      type: String,
      enum: ['session_start', 'session_end', 'fire_placed', 'fire_extinguished', 'path_placed'],
      required: true,
    },
    drillId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Drill',
      index: true,
    },
    alertId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Alert',
      index: true,
    },
    metadata: {
      waypoints: [{
        id: String,
        name: String,
        latitude: Number,
        longitude: Number,
        order: Number,
        isSafeZone: Boolean,
      }],
      safeZone: {
        id: String,
        name: String,
        latitude: Number,
        longitude: Number,
      },
      fireId: String,
      score: Number,
      timeToExtinguish: Number, // in seconds
      eventData: mongoose.Schema.Types.Mixed,
    },
    location: {
      latitude: Number,
      longitude: Number,
      accuracy: Number,
      altitude: Number,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      // Index created in compound index below to avoid duplicate
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
arSessionSchema.index({ userId: 1, timestamp: -1 });
arSessionSchema.index({ schoolId: 1, timestamp: -1 });
arSessionSchema.index({ drillId: 1, timestamp: -1 });
arSessionSchema.index({ sessionType: 1, timestamp: -1 });

const ARSession = mongoose.model('ARSession', arSessionSchema);

export default ARSession;

