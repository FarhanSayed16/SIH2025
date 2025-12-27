import { getMeshKey, rotateMeshKey, syncMeshMessages } from '../services/mesh.service.js';
import { successResponse, errorResponse } from '../utils/response.js';
import logger from '../config/logger.js';

/**
 * Phase 5.3: Mesh Networking Controller
 * Handles mesh key management and message sync endpoints
 */

/**
 * Get mesh key for current user's school
 * GET /api/mesh/key
 */
export const getMeshKeyController = async (req, res) => {
  try {
    const userId = req.user.userId;
    const schoolId = req.user.institutionId;

    if (!schoolId) {
      return errorResponse(res, 'User does not belong to a school', 400);
    }

    const key = await getMeshKey(schoolId.toString());

    return successResponse(res, {
      schoolId: schoolId.toString(),
      meshKey: key,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    });
  } catch (error) {
    logger.error('Error getting mesh key:', error);
    return errorResponse(res, error.message || 'Failed to get mesh key', 500);
  }
};

/**
 * Rotate mesh key for current user's school (admin only)
 * POST /api/mesh/key/rotate
 */
export const rotateMeshKeyController = async (req, res) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;
    const schoolId = req.user.institutionId;

    // Only admin can rotate keys
    if (userRole !== 'admin') {
      return errorResponse(res, 'Only admins can rotate mesh keys', 403);
    }

    if (!schoolId) {
      return errorResponse(res, 'User does not belong to a school', 400);
    }

    const newKey = await rotateMeshKey(schoolId.toString());

    logger.info(`Mesh key rotated by admin ${userId} for school ${schoolId}`);

    return successResponse(res, {
      schoolId: schoolId.toString(),
      meshKey: newKey,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      rotated: true,
    });
  } catch (error) {
    logger.error('Error rotating mesh key:', error);
    return errorResponse(res, error.message || 'Failed to rotate mesh key', 500);
  }
};

/**
 * Sync offline mesh messages
 * POST /api/mesh/sync
 */
export const syncMeshMessagesController = async (req, res) => {
  try {
    const userId = req.user.userId;
    const schoolId = req.user.institutionId;
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return errorResponse(res, 'Messages array is required', 400);
    }

    if (!schoolId) {
      return errorResponse(res, 'User does not belong to a school', 400);
    }

    // Limit message count per sync
    if (messages.length > 1000) {
      return errorResponse(res, 'Too many messages in sync batch (max 1000)', 400);
    }

    const results = await syncMeshMessages(
      userId,
      messages,
      schoolId.toString()
    );

    return successResponse(res, {
      syncResults: results,
      syncedAt: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error syncing mesh messages:', error);
    return errorResponse(res, error.message || 'Failed to sync mesh messages', 500);
  }
};

