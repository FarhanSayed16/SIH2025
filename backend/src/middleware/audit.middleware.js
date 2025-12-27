/**
 * Phase 3.4.4: Audit Middleware
 * Automatically logs requests for audit trail
 */

import { logAction } from '../services/audit.service.js';
import logger from '../config/logger.js';

/**
 * Audit middleware - logs requests automatically
 */
export const auditMiddleware = (options = {}) => {
  const {
    logReads = false, // Don't log read operations by default
    logWrites = true, // Log write operations
    excludedPaths = [] // Paths to exclude from audit
  } = options;

  return async (req, res, next) => {
    // Skip excluded paths
    if (excludedPaths.some(path => req.path.startsWith(path))) {
      return next();
    }

    // Determine action based on HTTP method
    const method = req.method.toUpperCase();
    let action = 'read';
    let severity = 'low';

    switch (method) {
      case 'POST':
        action = 'create';
        severity = 'medium';
        break;
      case 'PUT':
      case 'PATCH':
        action = 'update';
        severity = 'medium';
        break;
      case 'DELETE':
        action = 'delete';
        severity = 'high';
        break;
      case 'GET':
        action = 'read';
        severity = 'low';
        break;
    }

    // Skip logging reads if not enabled
    if (action === 'read' && !logReads) {
      return next();
    }

    // Skip logging writes if not enabled
    if (action !== 'read' && !logWrites) {
      return next();
    }

    // Capture response
    const originalSend = res.send;
    res.send = function(data) {
      res.send = originalSend;
      
      // Log after response
      const resource = req.path.split('/')[2] || 'unknown';
      const resourceId = req.params.id || req.params.userId || req.params.drillId || null;
      
      logAction({
        userId: req.userId || req.user?._id,
        institutionId: req.user?.institutionId,
        action,
        resource,
        resourceId,
        req: {
          ...req,
          statusCode: res.statusCode
        },
        status: res.statusCode < 400 ? 'success' : 'failure',
        severity,
        metadata: {
          method,
          endpoint: req.path,
          statusCode: res.statusCode
        }
      }).catch(err => {
        logger.error('Failed to log audit:', err);
      });
      
      return originalSend.call(this, data);
    };

    next();
  };
};

/**
 * Audit specific action manually
 */
export const auditAction = (action, resource, options = {}) => {
  return async (req, res, next) => {
    // Capture response
    const originalSend = res.send;
    res.send = function(data) {
      res.send = originalSend;
      
      logAction({
        userId: req.userId || req.user?._id,
        institutionId: req.user?.institutionId,
        action,
        resource,
        resourceId: req.params.id || options.resourceId,
        req: {
          ...req,
          statusCode: res.statusCode
        },
        status: res.statusCode < 400 ? 'success' : 'failure',
        severity: options.severity || 'medium',
        metadata: {
          ...options.metadata,
          endpoint: req.path
        }
      }).catch(err => {
        logger.error('Failed to log audit:', err);
      });
      
      return originalSend.call(this, data);
    };

    next();
  };
};

export default {
  auditMiddleware,
  auditAction
};

