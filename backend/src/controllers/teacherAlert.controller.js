/**
 * Phase 4.10: Teacher Alert Controller
 * Allows teachers to trigger alerts from mobile app
 */

import { successResponse, errorResponse } from '../utils/response.js';
import { processTeacherAlert } from '../services/alertPipeline.service.js';
import logger from '../config/logger.js';

/**
 * Teacher trigger alert
 * POST /api/alerts/teacher
 */
export const triggerTeacherAlert = async (req, res) => {
  try {
    const { type, severity, title, description, locationDetails } = req.body;
    const userId = req.userId;
    const institutionId = req.user.institutionId;

    if (!type) {
      return errorResponse(res, 'Alert type is required', 400);
    }

    // Verify user is a teacher
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return errorResponse(res, 'Only teachers can trigger alerts', 403);
    }

    // Verify institution ID
    if (!institutionId) {
      return errorResponse(res, 'User must be associated with an institution', 400);
    }

    // Build alert data
    const alertData = {
      institutionId,
      type,
      severity: severity || 'high',
      title: title || `${type.toUpperCase()} Alert - Triggered by Teacher`,
      description: description || `Emergency alert triggered by teacher from mobile app`,
      locationDetails: locationDetails || {}
    };

    // Process through alert pipeline
    const result = await processTeacherAlert(alertData, userId);

    logger.info(`Teacher alert triggered: ${result.alert.type} by user ${userId} (ID: ${result.alert._id})`);

    return successResponse(res, {
      alert: result.alert,
      alertLog: result.alertLog,
      affectedUsersCount: result.affectedUsersCount
    }, 'Alert triggered successfully', 201);
  } catch (error) {
    logger.error('Teacher alert trigger error:', error);
    return errorResponse(res, error.message || 'Failed to trigger alert', 400);
  }
};

