/**
 * Phase 3.4.4: Security Controller
 * Handles security monitoring and statistics
 */

import { getSecurityStats } from '../services/security-monitoring.service.js';
import { successResponse, errorResponse } from '../utils/response.js';
import logger from '../config/logger.js';

/**
 * Get security statistics
 * GET /api/security/stats
 */
export const getSecurityStatsEndpoint = async (req, res) => {
  try {
    // Only admins can view security stats
    if (req.user?.role !== 'admin') {
      return errorResponse(res, 'Access denied', 403);
    }

    const timeRange = req.query.timeRange || '24h';
    const result = await getSecurityStats(req.user?.institutionId, timeRange);

    if (result.success) {
      return successResponse(res, result.stats, 'Security statistics retrieved successfully');
    } else {
      return errorResponse(res, result.error || 'Failed to get security statistics', 500);
    }
  } catch (error) {
    logger.error('Get security stats endpoint error:', error);
    return errorResponse(res, error.message || 'Failed to get security statistics', 500);
  }
};

