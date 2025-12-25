/**
 * Phase 4.7: AR Navigation Controller
 * Handles AR navigation API endpoints
 */

import {
  calculateARRoute,
  getARMarkers,
} from '../services/arNavigation.service.js';
import { successResponse, errorResponse } from '../utils/response.js';
import logger from '../config/logger.js';

/**
 * Calculate AR route
 * POST /api/ar-navigation/route
 */
export const calculateRoute = async (req, res) => {
  try {
    const { schoolId, startLat, startLng, endLat, endLng, alertType } = req.body;
    const userId = req.userId;

    // Validate required fields
    if (!schoolId || startLat === undefined || startLng === undefined) {
      return errorResponse(res, 'School ID, start latitude, and start longitude are required', 400);
    }

    // Validate coordinates
    if (
      typeof startLat !== 'number' ||
      typeof startLng !== 'number' ||
      (startLat < -90 || startLat > 90) ||
      (startLng < -180 || startLng > 180)
    ) {
      return errorResponse(res, 'Invalid coordinates', 400);
    }

    // Validate optional end coordinates if provided
    if (
      (endLat !== undefined && endLat !== null) ||
      (endLng !== undefined && endLng !== null)
    ) {
      if (
        typeof endLat !== 'number' ||
        typeof endLng !== 'number' ||
        (endLat < -90 || endLat > 90) ||
        (endLng < -180 || endLng > 180)
      ) {
        return errorResponse(res, 'Invalid end coordinates', 400);
      }
    }

    // Calculate route
    const route = await calculateARRoute(
      schoolId,
      startLat,
      startLng,
      endLat || null,
      endLng || null,
      alertType || 'other'
    );

    logger.info(`AR route calculated for user ${userId} to school ${schoolId}`);

    return successResponse(res, { route }, 'AR route calculated successfully');
  } catch (error) {
    logger.error('Calculate AR route controller error:', error);
    return errorResponse(res, error.message || 'Failed to calculate AR route', 500);
  }
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

