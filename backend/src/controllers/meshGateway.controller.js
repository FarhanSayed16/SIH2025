/**
 * Phase 5.9: Mesh Gateway Controller
 * Handles mesh gateway API endpoints
 */

import { successResponse, errorResponse } from '../utils/response.js';
import {
  registerGateway,
  updateGatewayStats,
  getSchoolGateways,
  getGatewayById,
} from '../services/meshGateway.service.js';
import logger from '../config/logger.js';

/**
 * Register mesh gateway
 * POST /api/mesh/gateways
 */
export const registerGatewayController = async (req, res) => {
  try {
    const gatewayData = {
      ...req.body,
      schoolId: req.body.schoolId || req.user.institutionId,
    };

    const gateway = await registerGateway(gatewayData);

    return successResponse(res, { gateway }, 'Mesh gateway registered successfully', 201);
  } catch (error) {
    logger.error('Register gateway error:', error);
    return errorResponse(res, error.message || 'Failed to register gateway', 500);
  }
};

/**
 * Get school gateways
 * GET /api/mesh/gateways
 */
export const getSchoolGatewaysController = async (req, res) => {
  try {
    const schoolId = req.query.schoolId || req.user.institutionId;

    if (!schoolId) {
      return errorResponse(res, 'School ID is required', 400);
    }

    const gateways = await getSchoolGateways(schoolId);

    return successResponse(res, { gateways }, 'Gateways retrieved successfully');
  } catch (error) {
    logger.error('Get school gateways error:', error);
    return errorResponse(res, error.message || 'Failed to get gateways', 500);
  }
};

/**
 * Get gateway by ID
 * GET /api/mesh/gateways/:gatewayId
 */
export const getGatewayByIdController = async (req, res) => {
  try {
    const { gatewayId } = req.params;

    const gateway = await getGatewayById(gatewayId);

    if (!gateway) {
      return errorResponse(res, 'Gateway not found', 404);
    }

    return successResponse(res, { gateway }, 'Gateway retrieved successfully');
  } catch (error) {
    logger.error('Get gateway error:', error);
    return errorResponse(res, error.message || 'Failed to get gateway', 500);
  }
};

/**
 * Update gateway statistics
 * POST /api/mesh/gateways/:gatewayId/stats
 */
export const updateGatewayStatsController = async (req, res) => {
  try {
    const { gatewayId } = req.params;
    const stats = req.body;

    const gateway = await updateGatewayStats(gatewayId, stats);

    return successResponse(res, { gateway }, 'Gateway statistics updated successfully');
  } catch (error) {
    logger.error('Update gateway stats error:', error);
    return errorResponse(res, error.message || 'Failed to update gateway stats', 500);
  }
};

