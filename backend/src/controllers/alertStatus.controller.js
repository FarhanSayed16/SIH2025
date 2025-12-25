/**
 * Phase 4.4: Emergency Acknowledgment & Triage Controller
 * 
 * Handles user status updates, status retrieval, and status summaries
 */

import { successResponse, errorResponse } from '../utils/response.js';
import {
  updateUserStatus,
  getUserStatuses,
  getStatusSummary,
  markUserMissing,
  initializeStudentStatuses
} from '../services/alertStatus.service.js';
import Alert from '../models/Alert.js';
import logger from '../config/logger.js';
import { broadcastUserStatusUpdate } from '../services/crisisAlert.service.js';

/**
 * Update user status in alert
 * POST /api/alerts/:alertId/status
 * Phase 4.4: New simplified endpoint
 */
export const updateStatus = async (req, res) => {
  try {
    const { alertId } = req.params;
    const { status, location } = req.body;
    const userId = req.body.userId || req.userId; // Allow self-update or admin update

    if (!status) {
      return errorResponse(res, 'Status is required', 400);
    }

    // Validate status
    const validStatuses = ['safe', 'help', 'missing', 'at_risk', 'potentially_trapped'];
    if (!validStatuses.includes(status)) {
      return errorResponse(res, `Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);
    }

    // Verify alert exists
    const alert = await Alert.findById(alertId);
    if (!alert) {
      return errorResponse(res, 'Alert not found', 404);
    }

    // Update status
    const updatedAlert = await updateUserStatus(alertId, userId, status, location);

    // Broadcast status update via Socket.io
    try {
      await broadcastUserStatusUpdate(
        userId,
        alert.institutionId,
        status.toUpperCase(),
        location
      );
    } catch (error) {
      logger.warn('Failed to broadcast status update:', error);
      // Don't fail the request if broadcast fails
    }

    return successResponse(res, { alert: updatedAlert }, 'Status updated successfully');
  } catch (error) {
    logger.error('Update status error:', error);
    return errorResponse(res, error.message || 'Failed to update status', 400);
  }
};

/**
 * Get all user statuses for an alert
 * GET /api/alerts/:alertId/status
 * Phase 4.4: Returns detailed status information
 */
export const getStatuses = async (req, res) => {
  try {
    const { alertId } = req.params;

    // Validate alertId format
    if (!alertId || !alertId.match(/^[0-9a-fA-F]{24}$/)) {
      return errorResponse(res, 'Invalid alert ID format', 400);
    }

    const statuses = await getUserStatuses(alertId);

    // Ensure statuses array exists even if empty
    if (!statuses.statuses) {
      statuses.statuses = [];
    }

    return successResponse(res, statuses, 'User statuses retrieved successfully');
  } catch (error) {
    logger.error('Get statuses error:', error);
    
    // Provide more specific error messages
    if (error.message === 'Alert not found') {
      return errorResponse(res, 'Alert not found', 404);
    }
    
    return errorResponse(res, error.message || 'Failed to get user statuses', 500);
  }
};

/**
 * Get status summary for an alert
 * GET /api/alerts/:alertId/summary
 * Phase 4.4: Returns counts by status type
 */
export const getSummary = async (req, res) => {
  try {
    const { alertId } = req.params;

    // Validate alertId format
    if (!alertId || !alertId.match(/^[0-9a-fA-F]{24}$/)) {
      return errorResponse(res, 'Invalid alert ID format', 400);
    }

    const summary = await getStatusSummary(alertId);

    // Ensure counts object exists
    if (!summary.counts) {
      summary.counts = {
        safe: 0,
        help: 0,
        missing: 0,
        at_risk: 0,
        potentially_trapped: 0,
        total: 0
      };
    }

    return successResponse(res, summary, 'Status summary retrieved successfully');
  } catch (error) {
    logger.error('Get summary error:', error);
    
    // Provide more specific error messages
    if (error.message === 'Alert not found') {
      return errorResponse(res, 'Alert not found', 404);
    }
    
    return errorResponse(res, error.message || 'Failed to get status summary', 500);
  }
};

/**
 * Mark user as missing (Admin/Teacher only)
 * POST /api/alerts/:alertId/mark-missing
 * Phase 4.4: Manual status update by authorized personnel
 */
export const markMissing = async (req, res) => {
  try {
    const { alertId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return errorResponse(res, 'User ID is required', 400);
    }

    // Verify alert exists
    const alert = await Alert.findById(alertId);
    if (!alert) {
      return errorResponse(res, 'Alert not found', 404);
    }

    // Verify permissions (admin or teacher/admin of same institution)
    if (req.user.role !== 'admin' && alert.institutionId.toString() !== req.user.institutionId?.toString()) {
      return errorResponse(res, 'Unauthorized to mark users as missing', 403);
    }

    // Mark as missing
    const updatedAlert = await markUserMissing(alertId, userId, req.userId);

    // Broadcast status update
    try {
      await broadcastUserStatusUpdate(
        userId,
        alert.institutionId,
        'MISSING',
        null
      );
    } catch (error) {
      logger.warn('Failed to broadcast missing status update:', error);
    }

    return successResponse(res, { alert: updatedAlert }, 'User marked as missing successfully');
  } catch (error) {
    logger.error('Mark missing error:', error);
    return errorResponse(res, error.message || 'Failed to mark user as missing', 400);
  }
};

/**
 * Initialize student statuses for an alert (called when alert is created)
 * Phase 4.4: Internal function to populate initial status entries
 */
export const initializeStatusesForAlert = async (alert) => {
  try {
    await initializeStudentStatuses(alert);
  } catch (error) {
    logger.error('Initialize statuses error:', error);
    // Don't throw - this is a background operation
  }
};

