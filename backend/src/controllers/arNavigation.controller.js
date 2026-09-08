/**
 * Phase 4.7: AR Navigation Controller
 * Handles AR navigation API endpoints
 */

import { getARMarkers } from '../services/arNavigation.service.js';
import { successResponse, errorResponse } from '../utils/response.js';
import logger from '../config/logger.js';

/**
 * Calculate AR route
 * POST /api/ar-navigation/route
 */
export const calculateRoute = async (_req, res) => {
  // Geographic proximity cannot establish a traversable evacuation path.
  return errorResponse(
    res,
    'AR evacuation guidance is unavailable until a validated map and calibrated, traversable path are available. Follow the posted emergency plan and staff instructions.',
    503
  );
};

/**
 * Get AR markers for a school
 * GET /api/ar-navigation/markers/:schoolId
 */
export const getMarkers = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const { alertType } = req.query;

    if (!schoolId) {
      return errorResponse(res, 'School ID is required', 400);
    }

    const markers = await getARMarkers(schoolId, alertType || null);

    return successResponse(res, { markers }, 'AR markers retrieved successfully');
  } catch (error) {
    logger.error('Get AR markers controller error:', error);
    return errorResponse(res, error.message || 'Failed to get AR markers', 500);
  }
};

/**
 * Get route instructions
 * GET /api/ar-navigation/instructions/:routeId
 * Note: For now, instructions are included in the route response
 * This endpoint can be enhanced to store routes and retrieve them later
 */
export const getInstructions = async (req, res) => {
  try {
    const { routeId } = req.params;

    // For now, return error as routes are not persisted
    // This can be enhanced to store routes in a database
    return errorResponse(
      res,
      'Route instructions are included in route calculation. Routes are not persisted yet.',
      501
    );
  } catch (error) {
    logger.error('Get instructions controller error:', error);
    return errorResponse(res, error.message || 'Failed to get instructions', 500);
  }
};

