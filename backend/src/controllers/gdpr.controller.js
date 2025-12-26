/**
 * Phase 3.4.4: GDPR Controller
 * Handles GDPR compliance endpoints
 */

import { exportUserData, deleteUserData, verifyUserIdentity } from '../services/gdpr.service.js';
import { logGDPRRequest } from '../services/audit.service.js';
import { successResponse, errorResponse } from '../utils/response.js';
import logger from '../config/logger.js';

/**
 * Export user data (GDPR Right to Data Portability)
 * GET /api/gdpr/export
 */
export const exportData = async (req, res) => {
  try {
    const userId = req.userId || req.user?._id;
    
    if (!userId) {
      return errorResponse(res, 'User not authenticated', 401);
    }

    // Verify identity (basic check - can be enhanced)
    const verificationData = {
      email: req.body.email || req.user?.email
    };
    
    const verified = await verifyUserIdentity(userId, verificationData);
    if (!verified) {
      return errorResponse(res, 'Identity verification failed', 403);
    }

    // Log GDPR request
    await logGDPRRequest(userId, req.user?.institutionId, 'export', req);

    // Export data
    const result = await exportUserData(userId);
    
    if (result.success) {
      return successResponse(res, result.data, 'Data export successful');
    } else {
      return errorResponse(res, result.error || 'Failed to export data', 500);
    }
  } catch (error) {
    logger.error('GDPR export endpoint error:', error);
    return errorResponse(res, error.message || 'Failed to export data', 500);
  }
};

/**
 * Delete user data (GDPR Right to be Forgotten)
 * DELETE /api/gdpr/delete
 */
export const deleteData = async (req, res) => {
  try {
    const userId = req.userId || req.user?._id;
    
    if (!userId) {
      return errorResponse(res, 'User not authenticated', 401);
    }

    // Verify identity (enhanced for deletion)
    const verificationData = {
      email: req.body.email || req.user?.email,
      confirm: req.body.confirm
    };
    
    if (!verificationData.confirm) {
      return errorResponse(res, 'Deletion confirmation required', 400);
    }

    const verified = await verifyUserIdentity(userId, verificationData);
    if (!verified) {
      return errorResponse(res, 'Identity verification failed', 403);
    }

    // Log GDPR request
    await logGDPRRequest(userId, req.user?.institutionId, 'delete', req, {
      confirmation: true,
      timestamp: new Date().toISOString()
    });

    // Delete data
    const result = await deleteUserData(userId);
    
    if (result.success) {
      return successResponse(res, result, 'Data deletion successful');
    } else {
      return errorResponse(res, result.error || 'Failed to delete data', 500);
    }
  } catch (error) {
    logger.error('GDPR deletion endpoint error:', error);
    return errorResponse(res, error.message || 'Failed to delete data', 500);
  }
};

