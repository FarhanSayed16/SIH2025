import {
  createSession,
  getActiveSession,
  getSession,
  updateContent,
  connectDevice,
  endSession
} from '../services/projector.service.js';
import { successResponse, errorResponse } from '../utils/response.js';
import logger from '../config/logger.js';

/**
 * Create projector session
 * POST /api/projector/sessions
 */
export const create = async (req, res) => {
  try {
    const { deviceId, classId, institutionId, currentContent } = req.body;

    if (!deviceId || !institutionId) {
      return errorResponse(res, 'Device ID and Institution ID are required', 400);
    }

    const session = await createSession({
      deviceId,
      classId: classId || null,
      institutionId,
      startedBy: req.userId,
      currentContent: currentContent || {
        type: 'module',
        slideIndex: 0
      }
    });

    return successResponse(
      res,
      session,
      'Projector session created successfully',
      201
    );
  } catch (error) {
    logger.error('Create session controller error:', error);
    return errorResponse(
      res,
      error.message || 'Failed to create session',
      500
    );
  }
};

/**
 * Get active session for device
 * GET /api/projector/sessions/device/:deviceId
 */
export const getActive = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const session = await getActiveSession(deviceId);

    if (!session) {
      return errorResponse(res, 'No active session found', 404);
    }

    return successResponse(
      res,
      session,
      'Active session retrieved successfully'
    );
  } catch (error) {
    logger.error('Get active session controller error:', error);
    return errorResponse(
      res,
      error.message || 'Failed to get active session',
      500
    );
  }
};

/**
 * Get session by ID
 * GET /api/projector/sessions/:sessionId
 */
export const get = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await getSession(sessionId);

    if (!session) {
      return errorResponse(res, 'Session not found', 404);
    }

    return successResponse(
      res,
      session,
      'Session retrieved successfully'
    );
  } catch (error) {
    logger.error('Get session controller error:', error);
    return errorResponse(
      res,
      error.message || 'Failed to get session',
      500
    );
  }
};

/**
 * Update session content
 * PUT /api/projector/sessions/:sessionId/content
 */
export const updateSessionContent = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { contentData } = req.body;

    if (!contentData) {
      return errorResponse(res, 'Content data is required', 400);
    }

    const session = await updateContent(sessionId, contentData);

    return successResponse(
      res,
      session,
      'Content updated successfully'
    );
  } catch (error) {
    logger.error('Update content controller error:', error);
    return errorResponse(
      res,
      error.message || 'Failed to update content',
      500
    );
  }
};

/**
 * Connect device to session
 * POST /api/projector/sessions/:sessionId/connect
 */
export const connect = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { deviceId, deviceName } = req.body;

    if (!deviceId || !deviceName) {
      return errorResponse(res, 'Device ID and name are required', 400);
    }

    const session = await connectDevice(sessionId, deviceId, deviceName);

    return successResponse(
      res,
      session,
      'Device connected successfully'
    );
  } catch (error) {
    logger.error('Connect device controller error:', error);
    return errorResponse(
      res,
      error.message || 'Failed to connect device',
      500
    );
  }
};

/**
 * End session
 * POST /api/projector/sessions/:sessionId/end
 */
export const end = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await endSession(sessionId);

    return successResponse(
      res,
      session,
      'Session ended successfully'
    );
  } catch (error) {
    logger.error('End session controller error:', error);
    return errorResponse(
      res,
      error.message || 'Failed to end session',
      500
    );
  }
};

