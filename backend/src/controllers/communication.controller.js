/**
 * Phase 3.4.3: Communication Controller
 * Handles communication API endpoints
 */

import {
  sendNotification,
  sendNotificationWithTemplate,
  sendMultiChannelNotification,
  updateDeliveryStatus,
  getDeliveryStatistics
} from '../services/communication.service.js';
import CommunicationLog from '../models/CommunicationLog.js';
import User from '../models/User.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response.js';
import logger from '../config/logger.js';

/**
 * Send notification
 * POST /api/communication/send
 */
export const sendNotificationEndpoint = async (req, res) => {
  try {
    const {
      channel,
      recipient,
      subject,
      title,
      body,
      templateId,
      templateVariables,
      alertId,
      drillId,
      metadata
    } = req.body;

    const result = await sendNotification({
      institutionId: req.user?.institutionId,
      channel,
      recipient,
      subject,
      title,
      body,
      templateId,
      templateVariables,
      alertId,
      drillId,
      metadata
    });

    if (result.success) {
      return successResponse(res, result, 'Notification sent successfully');
    } else {
      return errorResponse(res, result.error || 'Failed to send notification', 400);
    }
  } catch (error) {
    logger.error('Send notification endpoint error:', error);
    return errorResponse(res, error.message || 'Failed to send notification', 500);
  }
};

/**
 * Send notification with template
 * POST /api/communication/send-template
 */
export const sendNotificationWithTemplateEndpoint = async (req, res) => {
  try {
    const {
      templateId,
      templateName,
      channel,
      recipient,
      variables,
      alertId,
      drillId,
      metadata
    } = req.body;

    const result = await sendNotificationWithTemplate({
      templateId,
      templateName,
      institutionId: req.user?.institutionId,
      channel,
      recipient,
      variables,
      alertId,
      drillId,
      metadata
    });

    if (result.success) {
      return successResponse(res, result, 'Notification sent successfully');
    } else {
      return errorResponse(res, result.error || 'Failed to send notification', 400);
    }
  } catch (error) {
    logger.error('Send notification with template endpoint error:', error);
    return errorResponse(res, error.message || 'Failed to send notification', 500);
  }
};

/**
 * Get communication logs
 * GET /api/communication/logs
 */
export const getCommunicationLogs = async (req, res) => {
  try {
    const { page = 1, limit = 20, channel, status, startDate, endDate, userId } = req.query;

    const query = {
      institutionId: req.user?.institutionId
    };

    if (channel) query.channel = channel;
    if (status) query.status = status;
    if (userId) query['recipient.userId'] = userId;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const logs = await CommunicationLog.find(query)
      .populate('recipient.userId', 'name email')
      .populate('templateId', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await CommunicationLog.countDocuments(query);

    return paginatedResponse(
      res,
      logs,
      {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      },
      'Communication logs retrieved successfully'
    );
  } catch (error) {
    logger.error('Get communication logs error:', error);
    return errorResponse(res, error.message || 'Failed to get communication logs', 500);
  }
};

/**
 * Send test notification to a specific user (push + email by default)
 * POST /api/communication/test-user
 */
export const sendTestToUser = async (req, res) => {
  try {
    const {
      userId,
      channels = ['push', 'email'],
      title = 'Test Notification',
      subject = 'Test Notification',
      message = 'This is a test notification.'
    } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    const recipient = {
      userId: user._id,
      email: user.email,
      phone: user.phone,
      fcmToken: user.deviceToken,
      name: user.name
    };

    const result = await sendMultiChannelNotification({
      channels: channels.length > 0 ? channels : ['push', 'email'],
      institutionId: req.user?.institutionId,
      recipient,
      subject,
      title,
      body: message,
      metadata: { test: true, requestedBy: req.user?._id }
    });

    if (result.success) {
      return successResponse(res, result, 'Test notification sent');
    } else {
      return errorResponse(res, result.error || 'Failed to send test notification', 400);
    }
  } catch (error) {
    logger.error('Send test to user error:', error);
    return errorResponse(res, error.message || 'Failed to send test notification', 500);
  }
};

/**
 * Get delivery statistics
 * GET /api/communication/statistics
 */
export const getStatistics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const result = await getDeliveryStatistics(req.user?.institutionId, {
      startDate,
      endDate
    });

    if (result.success) {
      return successResponse(res, result.stats, 'Statistics retrieved successfully');
    } else {
      return errorResponse(res, result.error || 'Failed to get statistics', 500);
    }
  } catch (error) {
    logger.error('Get statistics error:', error);
    return errorResponse(res, error.message || 'Failed to get statistics', 500);
  }
};

/**
 * Update delivery status (webhook endpoint)
 * POST /api/communication/status/:messageId
 */
export const updateStatus = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { status, metadata } = req.body;

    const result = await updateDeliveryStatus(messageId, status, metadata);

    if (result.success) {
      return successResponse(res, result, 'Status updated successfully');
    } else {
      return errorResponse(res, result.error || 'Failed to update status', 400);
    }
  } catch (error) {
    logger.error('Update delivery status error:', error);
    return errorResponse(res, error.message || 'Failed to update status', 500);
  }
};

