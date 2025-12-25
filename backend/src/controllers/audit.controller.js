/**
 * Phase 3.4.4: Audit Controller
 * Handles audit log endpoints
 */

import {
  getAuditLogs,
  getSecurityEvents,
  getSuspiciousActivities
} from '../services/audit.service.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response.js';
import logger from '../config/logger.js';

/**
 * Get audit logs
 * GET /api/audit/logs
 */
export const getAuditLogsEndpoint = async (req, res) => {
  try {
    const filters = {
      userId: req.query.userId,
      institutionId: req.user?.institutionId || req.query.institutionId,
      action: req.query.action,
      resource: req.query.resource,
      severity: req.query.severity,
      isSuspicious: req.query.isSuspicious === 'true' ? true : req.query.isSuspicious === 'false' ? false : undefined,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      page: req.query.page || 1,
      limit: req.query.limit || 50
    };

    // Non-admin users can only see their own logs
    if (req.user?.role !== 'admin') {
      filters.userId = req.userId || req.user?._id;
    }

    const result = await getAuditLogs(filters);

    if (result.success) {
      return paginatedResponse(
        res,
        result.logs,
        result.pagination,
        'Audit logs retrieved successfully'
      );
    } else {
      return errorResponse(res, result.error || 'Failed to get audit logs', 500);
    }
  } catch (error) {
    logger.error('Get audit logs endpoint error:', error);
    return errorResponse(res, error.message || 'Failed to get audit logs', 500);
  }
};

/**
 * Get security events
 * GET /api/audit/security
 */
export const getSecurityEventsEndpoint = async (req, res) => {
  try {
    // Only admins can view security events
    if (req.user?.role !== 'admin') {
      return errorResponse(res, 'Access denied', 403);
    }

    const filters = {
      institutionId: req.user?.institutionId,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    const result = await getSecurityEvents(filters);

    if (result.success) {
      return successResponse(res, result.events, 'Security events retrieved successfully');
    } else {
      return errorResponse(res, result.error || 'Failed to get security events', 500);
    }
  } catch (error) {
    logger.error('Get security events endpoint error:', error);
    return errorResponse(res, error.message || 'Failed to get security events', 500);
  }
};

/**
 * Get suspicious activities
 * GET /api/audit/suspicious
 */
export const getSuspiciousActivitiesEndpoint = async (req, res) => {
  try {
    // Only admins can view suspicious activities
    if (req.user?.role !== 'admin') {
      return errorResponse(res, 'Access denied', 403);
    }

    const filters = {
      institutionId: req.user?.institutionId,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    const result = await getSuspiciousActivities(filters);

    if (result.success) {
      return successResponse(res, result.activities, 'Suspicious activities retrieved successfully');
    } else {
      return errorResponse(res, result.error || 'Failed to get suspicious activities', 500);
    }
  } catch (error) {
    logger.error('Get suspicious activities endpoint error:', error);
    return errorResponse(res, error.message || 'Failed to get suspicious activities', 500);
  }
};

