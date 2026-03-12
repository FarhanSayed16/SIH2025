/**
 * Phase 3.4.3: Broadcast Message Model
 * Tracks broadcast messages sent to multiple recipients
 */

import mongoose from 'mongoose';

const broadcastMessageSchema = new mongoose.Schema({
  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true,
    index: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['emergency', 'announcement', 'drill', 'general'],
    required: true,
    index: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
    index: true
  },
  // Recipient groups
  recipients: {
    type: {
      type: String,
      enum: ['all', 'students', 'teachers', 'parents', 'admins', 'custom'],
      required: true
    },
    userIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    classIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class'
    }]
  },
  // Message channels
  channels: [{
    type: String,
    enum: ['sms', 'email', 'push'],
    required: true
  }],
  // Message content
  subject: String,
  title: String,
  message: {
    type: String,
    required: true
  },
  // Template used
  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MessageTemplate'
  },
  // Scheduling
  scheduledAt: Date,
  sentAt: Date,
  // Processing lock (prevents duplicate processing)
  processingLock: Date,
  // Status
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'sending', 'sent', 'failed', 'cancelled'],
    default: 'draft',
    index: true
  },
  // Statistics
  stats: {
    totalRecipients: {
      type: Number,
      default: 0
    },
    sent: {
      type: Number,
      default: 0
    },
    delivered: {
      type: Number,
      default: 0
    },
    failed: {
      type: Number,
      default: 0
    },
    pending: {
      type: Number,
      default: 0
    },
    queued: {
      type: Number,
      default: 0
    }
  },
  // Related entities
  alertId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Alert'
  },
  drillId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Drill'
  },
  // Metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes
broadcastMessageSchema.index({ institutionId: 1, createdAt: -1 });
broadcastMessageSchema.index({ status: 1, scheduledAt: 1 });
broadcastMessageSchema.index({ type: 1, priority: 1 });

const BroadcastMessage = mongoose.model('BroadcastMessage', broadcastMessageSchema);

export default BroadcastMessage;

