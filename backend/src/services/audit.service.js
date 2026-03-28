/**
 * Phase 3.4.4: Audit Service
 * Comprehensive audit logging for security and compliance
 */

import AuditLog from '../models/AuditLog.js';
import logger from '../config/logger.js';

/**
 * Create audit log entry
 * @param {Object} auditData - Audit log data
 * @returns {Promise<Object>} Created audit log
 */
export const createAuditLog = async (auditData) => {
  try {
    const auditLog = await AuditLog.create(auditData);
    return {
      success: true,
      auditLog
    };
  } catch (error) {
    logger.error('Failed to create audit log:', error);
    // Don't throw - audit logging should never break the application
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Log user action
 * @param {Object} options - Log options
 */
export const logAction = async (options) => {
  const {
    userId,
    institutionId,
    action,
    resource,
    resourceId,
    req,
    status = 'success',
    severity = 'low',
    metadata = {}
  } = options;

  // Extract request information
  const ipAddress = req?.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                   req?.headers['x-real-ip'] ||
                   req?.ip ||
                   req?.connection?.remoteAddress ||
                   'unknown';
  const userAgent = req?.headers['user-agent'] || 'unknown';
  const method = req?.method || 'unknown';
  const endpoint = req?.originalUrl || req?.url || 'unknown';

  // Determine if suspicious
  const isSuspicious = determineIfSuspicious(action, status, severity, metadata);

  const auditData = {
    userId,
    institutionId,
    action,
    resource,
    resourceId,
    ipAddress,
    userAgent,
    method,
    endpoint,
    status,
    severity,
    isSuspicious,
    responseStatus: req?.statusCode,
    metadata: {
      ...metadata,
      timestamp: new Date().toISOString()
    }
  };

  // Create audit log (fire and forget)
  createAuditLog(auditData).catch(err => {
    logger.error('Background audit log creation failed:', err);
  });
};

/**
 * Determine if activity is suspicious
 */
const determineIfSuspicious = (action, status, severity, metadata) => {
  // Authentication failures
  if (action === 'authentication_failure') {
    return true;
  }
  
  // Authorization failures
  if (action === 'authorization_failure') {
    return true;
  }
  
  // Rate limit exceeded
  if (action === 'rate_limit_exceeded') {
    return true;
  }
  
  // Failed security-critical actions
  if (status === 'failure' && ['high', 'critical'].includes(severity)) {
    return true;
  }
  
  // Multiple failed attempts
  if (metadata.failedAttempts && metadata.failedAttempts > 3) {
    return true;
  }
  
  return false;
};

/**
 * Log authentication event
 */
export const logAuthentication = async (userId, institutionId, action, req, status = 'success', metadata = {}) => {
  await logAction({
    userId,
    institutionId,
    action: action === 'login' ? 'login' : 'logout',
    resource: 'user',
    resourceId: userId,
    req,
    status,
    severity: status === 'success' ? 'low' : 'high',
    metadata
  });
};

/**
 * Log data access
 */
export const logDataAccess = async (userId, institutionId, resource, resourceId, req, metadata = {}) => {
  await logAction({
    userId,
    institutionId,
    action: 'read',
    resource,
    resourceId,
    req,
    severity: 'low',
    metadata
  });
};

/**
 * Log data modification
 */
export const logDataModification = async (userId, institutionId, action, resource, resourceId, req, metadata = {}) => {
  await logAction({
    userId,
    institutionId,
    action: action || 'update',
    resource,
    resourceId,
    req,
    severity: 'medium',
    metadata
  });
};

/**
 * Log data deletion
 */
export const logDataDeletion = async (userId, institutionId, resource, resourceId, req, metadata = {}) => {
  await logAction({
    userId,
    institutionId,
    action: 'delete',
    resource,
    resourceId,
    req,
    severity: 'high',
    metadata
  });
};

/**
 * Log security event
 */
export const logSecurityEvent = async (userId, institutionId, action, resource, req, severity = 'high', metadata = {}) => {
  await logAction({
    userId,
    institutionId,
    action: action || 'security_event',
    resource,
    req,
    status: 'failure',
    severity,
    metadata
  });
};

/**
 * Log GDPR request
 */
export const logGDPRRequest = async (userId, institutionId, action, req, metadata = {}) => {
  await logAction({
    userId,
    institutionId,
    action: action === 'export' ? 'gdpr_export' : 'gdpr_deletion',
    resource: 'user_data',
    resourceId: userId,
    req,
    severity: 'high',
    metadata
  });
};

/**
 * Get audit logs
 */
export const getAuditLogs = async (filters = {}) => {
  try {
    const {
      userId,
      institutionId,
      action,
      resource,
      severity,
      isSuspicious,
      startDate,
      endDate,
      page = 1,
      limit = 50
    } = filters;

    const query = {};
    
    if (userId) query.userId = userId;
    if (institutionId) query.institutionId = institutionId;
    if (action) query.action = action;
    if (resource) query.resource = resource;
    if (severity) query.severity = severity;
    if (isSuspicious !== undefined) query.isSuspicious = isSuspicious;
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const logs = await AuditLog.find(query)
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await AuditLog.countDocuments(query);

    return {
      success: true,
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    logger.error('Failed to get audit logs:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get security events
 */
export const getSecurityEvents = async (filters = {}) => {
  try {
    const events = await AuditLog.getSecurityEvents(filters);
    return {
      success: true,
      events
    };
  } catch (error) {
    logger.error('Failed to get security events:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get suspicious activities
 */
export const getSuspiciousActivities = async (filters = {}) => {
  try {
    const activities = await AuditLog.getSuspiciousActivities(filters);
    return {
      success: true,
      activities
    };
  } catch (error) {
    logger.error('Failed to get suspicious activities:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export default {
  createAuditLog,
  logAction,
  logAuthentication,
  logDataAccess,
  logDataModification,
  logDataDeletion,
  logSecurityEvent,
  logGDPRRequest,
  getAuditLogs,
  getSecurityEvents,
  getSuspiciousActivities
};

