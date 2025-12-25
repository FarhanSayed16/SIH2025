/**
 * Phase 5.7: AR Controller
 * Handles AR session API endpoints
 */

import { successResponse, errorResponse, paginatedResponse } from '../utils/response.js';
import {
  logARSession,
  getUserARSessions,
  getSchoolARSessions,
  getARSessionStatistics,
} from '../services/ar.service.js';
import { triggerARPath } from '../services/arTrigger.service.js';
import logger from '../config/logger.js';

/**
 * Log AR session
 * POST /api/ar/sessions
 */
export const logARSessionController = async (req, res) => {
  try {
    const sessionData = {
      ...req.body,
      userId: req.userId,
      schoolId: req.user.institutionId,
    };

    const session = await logARSession(sessionData);

    return successResponse(res, { session }, 'AR session logged successfully', 201);
  } catch (error) {
    logger.error('Log AR session error:', error);
    return errorResponse(res, error.message || 'Failed to log AR session', 500);
  }
};

/**
 * Get user's AR sessions
 * GET /api/ar/sessions
 */
export const getUserARSessionsController = async (req, res) => {
  try {
    const { sessionType, drillId, limit = 50 } = req.query;

    const sessions = await getUserARSessions(req.userId, {
      limit: parseInt(limit),
      sessionType,
      drillId,
    });

    return successResponse(res, { sessions }, 'AR sessions retrieved successfully');
  } catch (error) {
    logger.error('Get user AR sessions error:', error);
    return errorResponse(res, error.message || 'Failed to get AR sessions', 500);
  }
};

/**
 * Get AR session by ID
 * GET /api/ar/sessions/:sessionId
 */
export const getARSessionByIdController = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await getUserARSessions(req.userId, { sessionId });

    if (!session || session.length === 0) {
      return errorResponse(res, 'AR session not found', 404);
    }

    return successResponse(res, { session: session[0] }, 'AR session retrieved successfully');
  } catch (error) {
    logger.error('Get AR session by ID error:', error);
    return errorResponse(res, error.message || 'Failed to get AR session', 500);
  }
};

/**
 * Get school AR sessions (admin only)
 * GET /api/ar/sessions/school
 */
export const getSchoolARSessionsController = async (req, res) => {
  try {
    const { sessionType, startDate, endDate, limit = 100 } = req.query;

    if (!req.user.institutionId) {
      return errorResponse(res, 'School ID not found', 400);
    }

    const sessions = await getSchoolARSessions(req.user.institutionId, {
      limit: parseInt(limit),
      sessionType,
      startDate,
      endDate,
    });

    return successResponse(res, { sessions }, 'School AR sessions retrieved successfully');
  } catch (error) {
    logger.error('Get school AR sessions error:', error);
    return errorResponse(res, error.message || 'Failed to get school AR sessions', 500);
  }
};

/**
 * Get AR session statistics (admin only)
 * GET /api/ar/sessions/statistics
 */
export const getARSessionStatisticsController = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!req.user.institutionId) {
      return errorResponse(res, 'School ID not found', 400);
    }

    const statistics = await getARSessionStatistics(req.user.institutionId, {
      startDate,
      endDate,
    });

    return successResponse(res, { statistics }, 'AR session statistics retrieved successfully');
  } catch (error) {
    logger.error('Get AR session statistics error:', error);
    return errorResponse(res, error.message || 'Failed to get AR session statistics', 500);
  }
};

/**
 * Trigger AR path remotely (admin/teacher only)
 * POST /api/ar/trigger-path
 */
export const triggerARPathController = async (req, res) => {
  try {
    const { schoolId, waypoints, safeZone, alertType, alertId, drillId, assetUrl } = req.body;

    if (!schoolId) {
      return errorResponse(res, 'School ID is required', 400);
    }

    // Verify user has access to this school
    if (req.user.role !== 'admin' && req.user.institutionId?.toString() !== schoolId) {
      return errorResponse(res, 'Access denied to this school', 403);
    }

    const io = req.app.get('io');
    if (!io) {
      return errorResponse(res, 'Socket.io server not available', 500);
    }

    const result = await triggerARPath(io, schoolId, {
      waypoints,
      safeZone,
      alertType,
      alertId,
      drillId,
      assetUrl,
    }, {
      triggeredBy: req.userId,
    });

    return successResponse(res, result, 'AR path triggered successfully');
  } catch (error) {
    logger.error('Trigger AR path error:', error);
    return errorResponse(res, error.message || 'Failed to trigger AR path', 500);
  }
};

