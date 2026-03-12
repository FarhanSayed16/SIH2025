/**
 * Phase 3.4.4: Audit Log Model
 * Comprehensive audit logging for security and compliance
 */

import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  // User/Entity information
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    index: true
  },
  
  // Action details
  action: {
    type: String,
    required: true,
    index: true,
    enum: [
      'login',
      'logout',
      'create',
      'read',
      'update',
      'delete',
      'export',
      'import',
      'authentication_failure',
      'authorization_failure',
      'rate_limit_exceeded',
      'data_access',
      'data_modification',
      'data_deletion',
      'configuration_change',
      'permission_change',
      'password_change',
      'account_creation',
      'account_deletion',
      'gdpr_export',
      'gdpr_deletion',
      'security_event',
      'other'
    ]
  },
  
  // Resource information
  resource: {
    type: String,
    required: true,
    index: true
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    index: true
  },
  
  // Request information
  ipAddress: {
    type: String,
    index: true
  },
  userAgent: String,
  method: String,
  endpoint: String,
  
  // Request/Response details
  requestData: {
    type: mongoose.Schema.Types.Mixed
  },
  responseStatus: Number,
  
  // Security flags
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low',
    index: true
  },
  isSuspicious: {
    type: Boolean,
    default: false,
    index: true
  },
  
  // Outcome
  status: {
    type: String,
    enum: ['success', 'failure', 'error'],
    default: 'success',
    index: true
  },
  errorMessage: String,
  
  // Metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ institutionId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ severity: 1, isSuspicious: 1 });
auditLogSchema.index({ resource: 1, resourceId: 1 });

// TTL index - auto-delete logs older than 2 years
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2 * 365 * 24 * 60 * 60 });

// Static method to get security events
auditLogSchema.statics.getSecurityEvents = async function(filters = {}) {
  const query = {
    severity: { $in: ['high', 'critical'] },
    ...filters
  };
  
  return this.find(query)
    .populate('userId', 'name email role')
    .sort({ createdAt: -1 })
    .limit(100);
};

// Static method to get suspicious activities
auditLogSchema.statics.getSuspiciousActivities = async function(filters = {}) {
  const query = {
    isSuspicious: true,
    ...filters
  };
  
  return this.find(query)
    .populate('userId', 'name email role')
    .sort({ createdAt: -1 })
    .limit(100);
};

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;

