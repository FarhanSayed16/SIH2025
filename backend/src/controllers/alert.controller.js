import Alert from '../models/Alert.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response.js';
import {
  createAlert,
  updateStudentStatus,
  resolveAlert
} from '../services/alert.service.js';
import logger from '../config/logger.js';

/**
 * Create alert
 * POST /api/alerts
 * Phase 4.0: Enhanced with crisis alert broadcasting
 * Phase 4.10: Now uses central alert pipeline
 */
export const createAlertNow = async (req, res) => {
  try {
    const alertData = {
      ...req.body,
      type: req.body.type || 'sos',
      severity: req.body.severity || 'critical',
      institutionId: req.body.institutionId || req.user.institutionId,
      triggeredBy: req.userId,
      metadata: {
        ...(req.body.metadata || {}),
        sos: req.body.type === 'sos' || req.body.metadata?.sos || false,
        source: req.body.source || 'mobile',
      },
      // normalize location if lat/lng provided
      ...(req.body.lat &&
      req.body.lng
          ? {
              location: {
                type: 'Point',
                coordinates: [req.body.lng, req.body.lat],
              },
            }
          : {}),
    };

    // Phase 4.10: Use central alert pipeline for admin-triggered alerts
    try {
      const { processAdminAlert } = await import('../services/alertPipeline.service.js');
      const result = await processAdminAlert(alertData, req.userId);
      
      logger.info(`Alert created via pipeline: ${result.alert.type} (ID: ${result.alert._id})`);
      return successResponse(res, { 
        alert: result.alert,
        alertLog: result.alertLog,
        affectedUsersCount: result.affectedUsersCount
      }, 'Alert created successfully', 201);
    } catch (pipelineError) {
      logger.warn('Alert pipeline failed, falling back to legacy method:', pipelineError);
      // Fallback to legacy method if pipeline fails
    }

    // Legacy method (fallback)
    const alert = await createAlert(alertData);

    // Phase 4.4: Initialize student statuses for the alert
    try {
      const { initializeStatusesForAlert } = await import('./alertStatus.controller.js');
      await initializeStatusesForAlert(alert);
    } catch (error) {
      logger.warn('Failed to initialize student statuses:', error);
      // Don't fail the request if initialization fails
    }

    // Phase 4.0: Use crisis alert service for broadcasting
    try {
      const { broadcastCrisisAlert } = await import('../services/crisisAlert.service.js');
      const isDrill = alertData.metadata?.isDrill || false;
      await broadcastCrisisAlert(alert, { isDrill });
    } catch (error) {
      logger.warn('Failed to broadcast crisis alert via Socket.io:', error);
      // Don't fail the request if broadcast fails
    }

    // Send push notification via FCM
    try {
      const { sendCrisisAlertNotification } = await import('../services/fcm.service.js');
      await sendCrisisAlertNotification(alert);
    } catch (error) {
      logger.warn('Failed to send push notification:', error);
      // Don't fail the request if push notification fails
    }

    logger.info(`Alert created and broadcasted: ${alert.type} (ID: ${alert._id})`);

    return successResponse(res, { alert }, 'Alert created successfully', 201);
  } catch (error) {
    logger.error('Create alert error:', error);
    return errorResponse(res, error.message || 'Failed to create alert', 400);
  }
};

/**
 * Phase 4.0: Cancel alert
 * POST /api/alerts/:id/cancel
 */
export const cancelAlert = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const alert = await Alert.findById(id);
    if (!alert) {
      return errorResponse(res, 'Alert not found', 404);
    }

    // Verify permissions (admin or institution admin)
    if (req.user.role !== 'admin' && alert.institutionId.toString() !== req.user.institutionId?.toString()) {
      return errorResponse(res, 'Unauthorized to cancel this alert', 403);
    }

    // Update alert status
    alert.status = 'false_alarm';
    alert.resolvedAt = new Date();
    alert.resolvedBy = req.userId;
    await alert.save();

    // Phase 4.0: Broadcast cancellation
    try {
      const { broadcastAlertCancel } = await import('../services/crisisAlert.service.js');
      await broadcastAlertCancel(id, alert.institutionId, reason || 'Alert cancelled by admin');
    } catch (error) {
      logger.warn('Failed to broadcast alert cancellation:', error);
    }

    return successResponse(res, { alert }, 'Alert cancelled successfully');
  } catch (error) {
    logger.error('Cancel alert error:', error);
    return errorResponse(res, error.message || 'Failed to cancel alert', 400);
  }
};

/**
 * List alerts
 * GET /api/alerts
 */
export const listAlerts = async (req, res) => {
  try {
    const { page = 1, limit = 10, schoolId, status, type } = req.query;

    const query = {};
    if (schoolId) query.institutionId = schoolId;
    else if (req.user.institutionId && req.user.role !== 'admin') {
      query.institutionId = req.user.institutionId;
    }
    if (status) query.status = status;
    if (type) query.type = type;

    const alerts = await Alert.find(query)
      .populate('institutionId', 'name address')
      .populate('triggeredBy', 'name email role')
      .populate('deviceId', 'name type')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Alert.countDocuments(query);

    return paginatedResponse(res, alerts, {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit)
    }, 'Alerts retrieved successfully');
  } catch (error) {
    logger.error('List alerts error:', error);
    return errorResponse(res, 'Failed to list alerts', 500);
  }
};

/**
 * Get alert by ID
 * GET /api/alerts/:id
 */
export const getAlertById = async (req, res) => {
  try {
    const { id } = req.params;

    const alert = await Alert.findById(id)
      .populate('institutionId', 'name address location')
      .populate('triggeredBy', 'name email role')
      .populate('deviceId', 'name type location')
      .populate('studentStatus.userId', 'name email role');

    if (!alert) {
      return errorResponse(res, 'Alert not found', 404);
    }

    return successResponse(res, { alert }, 'Alert retrieved successfully');
  } catch (error) {
    logger.error('Get alert error:', error);
    return errorResponse(res, 'Failed to get alert', 500);
  }
};

/**
 * Update student status in alert
 * PUT /api/alerts/:id/student-status
 * Phase 4.0: Enhanced with status broadcasting
 */
export const updateStudentStatusInAlert = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, status, location } = req.body;

    if (!userId || !status) {
      return errorResponse(res, 'User ID and status are required', 400);
    }

    const alert = await updateStudentStatus(id, userId, status, location);

    // Phase 4.0: Use crisis alert service for status updates
    try {
      const { broadcastUserStatusUpdate } = await import('../services/crisisAlert.service.js');
      await broadcastUserStatusUpdate(userId, alert.institutionId, status.toUpperCase(), location);
    } catch (error) {
      logger.warn('Failed to broadcast status update via Socket.io:', error);
      // Don't fail the request if broadcast fails
    }

    return successResponse(res, { alert }, 'Student status updated successfully');
  } catch (error) {
    logger.error('Update student status error:', error);
    return errorResponse(res, error.message || 'Failed to update student status', 400);
  }
};

/**
 * Resolve alert
 * PUT /api/alerts/:id/resolve
 * Phase 4.0: Enhanced with cancellation broadcast
 */
export const resolveAlertNow = async (req, res) => {
  try {
    const { id } = req.params;

    const alert = await resolveAlert(id, req.userId);

    // Phase 4.0: Broadcast alert resolution
    try {
      const { broadcastAlertCancel } = await import('../services/crisisAlert.service.js');
      await broadcastAlertCancel(alert._id, alert.institutionId, 'Alert resolved');
    } catch (error) {
      logger.warn('Failed to broadcast alert resolution:', error);
      // Don't fail the request if broadcast fails
    }

    return successResponse(res, { alert }, 'Alert resolved successfully');
  } catch (error) {
    logger.error('Resolve alert error:', error);
    return errorResponse(res, error.message || 'Failed to resolve alert', 400);
  }
};
