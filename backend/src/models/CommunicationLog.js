/**
 * Phase 3.4.3: Communication Log Model
 * Tracks all outgoing messages and their delivery status
 */

import mongoose from 'mongoose';

const communicationLogSchema = new mongoose.Schema({
  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true,
    index: true
  },
  messageId: {
    type: String,
    unique: true,
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['sms', 'email', 'push'],
    required: true,
    index: true
  },
  channel: {
    type: String,
    enum: ['sms', 'email', 'push'],
    required: true
  },
  recipient: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    email: String,
    phone: String,
    fcmToken: String,
    name: String
  },
  // Message content
  subject: String, // For email
  title: String, // For push
  body: {
    type: String,
    required: true
  },
  // Template used (if any)
  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MessageTemplate'
  },
  templateName: String,
  // Delivery status
  status: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'failed', 'bounced', 'undelivered', 'skipped'],
    default: 'pending',
    index: true
  },
  // Provider response
  providerId: String, // External provider message ID
  providerResponse: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // Delivery tracking
  sentAt: Date,
  deliveredAt: Date,
  failedAt: Date,
  failureReason: String,
  // Retry information
  retryCount: {
    type: Number,
    default: 0
  },
  maxRetries: {
    type: Number,
    default: 3
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
  broadcastId: {
    type: mongoose.Schema.Types.ObjectId
  },
  // Metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
communicationLogSchema.index({ institutionId: 1, createdAt: -1 });
communicationLogSchema.index({ status: 1, createdAt: -1 });
communicationLogSchema.index({ recipient: 1, createdAt: -1 });
communicationLogSchema.index({ channel: 1, status: 1 });
// TTL index - auto-delete logs older than 90 days
communicationLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

// Static method to get delivery statistics
communicationLogSchema.statics.getDeliveryStats = async function(institutionId, startDate, endDate) {
  const matchQuery = { institutionId };
  if (startDate || endDate) {
    matchQuery.createdAt = {};
    if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
    if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
  }

  const stats = await this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: { channel: '$channel', status: '$status' },
        count: { $sum: 1 }
      }
    }
  ]);

  return stats;
};

const CommunicationLog = mongoose.model('CommunicationLog', communicationLogSchema);

export default CommunicationLog;

