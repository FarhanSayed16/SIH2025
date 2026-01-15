/**
 * Phase 4.10: Alert Log Model
 * Complete audit trail for all alerts and incidents
 */

import mongoose from 'mongoose';

const alertLogSchema = new mongoose.Schema({
  alertId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Alert',
    required: function() {
      // Required when it's a real-time alert (non-historical, not a broadcast-only log)
      const hasBroadcastLink = this?.metadata?.broadcastId;
      return !this.isHistorical && !hasBroadcastLink;
    },
    default: null,
    index: true
  },
  source: {
    type: String,
    enum: ['iot', 'admin', 'teacher', 'ai', 'ndma', 'system', 'historical', 'broadcast'],
    required: [true, 'Alert source is required'],
    index: true
  },
  sourceDetails: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true
  },
  type: {
    type: String,
    enum: ['fire', 'earthquake', 'flood', 'cyclone', 'stampede', 'medical', 'other'],
    required: true
  },
  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true,
    index: true
  },
  affectedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  actions: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    action: {
      type: String,
      enum: ['created', 'acknowledged', 'status_updated', 'resolved', 'cancelled', 'escalated'],
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  }],
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  status: {
    type: String,
    enum: ['active', 'resolved', 'false_alarm', 'cancelled'],
    default: 'active',
    index: true
  },
  resolvedAt: {
    type: Date,
    default: null
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  // Historical Incident Fields
  isHistorical: {
    type: Boolean,
    default: false,
    index: true
  },
  historicalDate: {
    type: Date,
    default: null,
    // The actual date when the incident occurred (can be in the past)
    index: true
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
    // Admin who added this historical incident
  },
  addedAt: {
    type: Date,
    default: Date.now
    // When this historical incident was added to the system
  },
  historicalDetails: {
    originalSource: {
      type: String,
      enum: ['news', 'records', 'government', 'witness', 'other'],
      default: null
    },
    verifiedBy: {
      type: String,
      default: null
    },
    verificationDate: {
      type: Date,
      default: null
    },
    documentation: [{
      type: String // URLs to documents, news articles, etc.
    }],
    lessonsLearned: {
      type: String,
      default: null
    },
    precautionsTaken: {
      type: String,
      default: null
    },
    improvementsMade: {
      type: String,
      default: null
    },
    relatedIncidents: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AlertLog'
    }]
  },
  impact: {
    casualties: {
      fatal: { type: Number, default: 0 },
      injured: { type: Number, default: 0 },
      evacuated: { type: Number, default: 0 }
    },
    propertyDamage: {
      severity: {
        type: String,
        enum: ['none', 'minor', 'moderate', 'severe', 'extensive'],
        default: 'none'
      },
      estimatedCost: { type: Number, default: 0 }
    },
    duration: { type: Number, default: 0 }, // Duration in hours
    affectedArea: { type: String, default: null }
  },
  response: {
    responseTime: { type: Number, default: null }, // Response time in minutes
    responseTeam: [{ type: String }], // Who responded?
    actionsTaken: [{ type: String }], // What actions were taken?
    effectiveness: {
      type: String,
      enum: ['excellent', 'good', 'adequate', 'poor'],
      default: null
    }
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
alertLogSchema.index({ institutionId: 1, createdAt: -1 });
alertLogSchema.index({ source: 1, createdAt: -1 });
alertLogSchema.index({ status: 1, createdAt: -1 });
alertLogSchema.index({ 'actions.timestamp': -1 });
alertLogSchema.index({ isHistorical: 1, historicalDate: -1 });
alertLogSchema.index({ institutionId: 1, isHistorical: 1 });

// Method to log an action
alertLogSchema.methods.logAction = function(userId, action, details = {}) {
  this.actions.push({
    userId,
    action,
    timestamp: new Date(),
    details
  });
  return this.save();
};

// Method to resolve alert
alertLogSchema.methods.resolve = function(userId, resolutionDetails = {}) {
  this.status = 'resolved';
  this.resolvedAt = new Date();
  this.resolvedBy = userId;
  this.logAction(userId, 'resolved', resolutionDetails);
  return this.save();
};

const AlertLog = mongoose.model('AlertLog', alertLogSchema);

export default AlertLog;

