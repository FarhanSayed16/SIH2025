/**
 * Phase 3.4.0: Sync Queue Model
 * Manages sync queue for offline data synchronization
 */

import mongoose from 'mongoose';

const syncQueueSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      // Index created in compound indexes below to avoid duplicate
    },
    institutionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Institution',
      required: false, // Optional, for filtering
      index: true,
    },
    dataType: {
      type: String,
      required: true,
      enum: ['quiz', 'drill', 'game', 'module'],
      index: true,
    },
    priority: {
      type: Number,
      required: true,
      default: 5, // 1 = highest priority, 10 = lowest
      min: 1,
      max: 10,
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'processing', 'synced', 'failed', 'conflict'],
      default: 'pending',
      index: true,
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      required: true, // The actual data to sync
    },
    retryCount: {
      type: Number,
      default: 0,
    },
    maxRetries: {
      type: Number,
      default: 3,
    },
    lastAttemptAt: {
      type: Date,
    },
    syncedAt: {
      type: Date,
    },
    error: {
      type: String,
    },
    conflictData: {
      serverData: mongoose.Schema.Types.Mixed,
      localData: mongoose.Schema.Types.Mixed,
      resolution: {
        type: String,
        enum: ['server-wins', 'client-wins', 'merge', 'manual', 'last-write-wins', 'auto-merge'],
      },
    },
    metadata: {
      deviceId: String,
      appVersion: String,
      syncVersion: String,
      createdAt: Date, // When item was created offline
      retryAfter: Date, // Phase 3.5.2: Retry with exponential backoff
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
syncQueueSchema.index({ userId: 1, status: 1, priority: 1 });
syncQueueSchema.index({ userId: 1, dataType: 1, status: 1 });
syncQueueSchema.index({ status: 1, priority: 1, createdAt: 1 }); // For processing queue

// Index for finding conflicts
syncQueueSchema.index({ userId: 1, status: 'conflict' });

const SyncQueue = mongoose.model('SyncQueue', syncQueueSchema);

export default SyncQueue;

