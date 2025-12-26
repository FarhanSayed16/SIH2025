/**
 * Phase 3.4.3: Broadcast Controller
 * Handles broadcast message endpoints
 */

import {
  sendBroadcast,
  scheduleBroadcast,
  getBroadcastStats
} from '../services/broadcast.service.js';
import BroadcastMessage from '../models/BroadcastMessage.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response.js';
import logger from '../config/logger.js';

/**
 * Send broadcast message
 * POST /api/broadcast/send
 */
export const sendBroadcastEndpoint = async (req, res) => {
  try {
    const {
      type,
      priority,
      recipients,
      channels,
      subject,
      title,
      message,
      templateId,
      templateVariables,
      alertId,
      drillId,
      metadata
    } = req.body;

    const result = await sendBroadcast({
      institutionId: req.user?.institutionId,
      createdBy: req.user?._id || req.userId,
      senderRole: req.user?.role || req.userRole,
      type,
      priority,
      recipients,
      channels,
      subject,
      title,
      message,
      templateId,
      templateVariables,
      alertId,
      drillId,
      metadata
    });

    if (result.success) {
      return successResponse(res, result, 'Broadcast sent successfully');
    } else {
      return errorResponse(res, result.error || 'Failed to send broadcast', 400);
    }
  } catch (error) {
    logger.error('Send broadcast endpoint error:', error);
    return errorResponse(res, error.message || 'Failed to send broadcast', 500);
  }
};

/**
 * Schedule broadcast message
 * POST /api/broadcast/schedule
 */
export const scheduleBroadcastEndpoint = async (req, res) => {
  try {
    const {
      scheduledAt,
      ...broadcastData
    } = req.body;

    if (!scheduledAt) {
      return errorResponse(res, 'scheduledAt is required', 400);
    }

    const result = await scheduleBroadcast({
      ...broadcastData,
      institutionId: req.user?.institutionId,
      createdBy: req.user?._id || req.userId,
      scheduledAt
    });

    if (result.success) {
      return successResponse(res, result, 'Broadcast scheduled successfully', 201);
    } else {
      return errorResponse(res, result.error || 'Failed to schedule broadcast', 400);
    }
  } catch (error) {
    logger.error('Schedule broadcast endpoint error:', error);
    return errorResponse(res, error.message || 'Failed to schedule broadcast', 500);
  }
};

/**
 * Get broadcast messages
 * GET /api/broadcast
 */
export const getBroadcasts = async (req, res) => {
  try {
    const { page = 1, limit = 20, type, status, startDate, endDate } = req.query;

    const query = {
      institutionId: req.user?.institutionId
    };

    if (type) query.type = type;
    if (status) query.status = status;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const broadcasts = await BroadcastMessage.find(query)
      .populate('createdBy', 'name email')
      .populate('templateId', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await BroadcastMessage.countDocuments(query);

    return paginatedResponse(
      res,
      broadcasts,
      {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      },
      'Broadcasts retrieved successfully'
    );
  } catch (error) {
    logger.error('Get broadcasts error:', error);
    return errorResponse(res, error.message || 'Failed to get broadcasts', 500);
  }
};

/**
 * Get broadcast by ID
 * GET /api/broadcast/:id
 */
export const getBroadcastById = async (req, res) => {
  try {
    const { id } = req.params;

    const broadcast = await BroadcastMessage.findById(id)
      .populate('createdBy', 'name email')
      .populate('templateId', 'name');

    if (!broadcast) {
      return errorResponse(res, 'Broadcast not found', 404);
    }

    // Check authorization
    if (broadcast.institutionId?.toString() !== req.user?.institutionId?.toString() && req.user?.role !== 'admin') {
      return errorResponse(res, 'Access denied', 403);
    }

    return successResponse(res, broadcast, 'Broadcast retrieved successfully');
  } catch (error) {
    logger.error('Get broadcast by ID error:', error);
    return errorResponse(res, error.message || 'Failed to get broadcast', 500);
  }
};

/**
 * Get broadcast statistics
 * GET /api/broadcast/:id/stats
 */
export const getBroadcastStatistics = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await getBroadcastStats(id);

    if (result.success) {
      return successResponse(res, result.stats, 'Broadcast statistics retrieved successfully');
    } else {
      return errorResponse(res, result.error || 'Failed to get statistics', 500);
    }
  } catch (error) {
    logger.error('Get broadcast statistics error:', error);
    return errorResponse(res, error.message || 'Failed to get statistics', 500);
  }
};

