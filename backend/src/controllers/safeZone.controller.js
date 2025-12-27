/**
 * Phase 4.7: Safe Zone Controller
 * Handles safe zone API endpoints
 */

import {
  getSafeZones,
  findNearestSafeZone,
  getSafeZonesWithinRadius,
} from '../services/safeZone.service.js';
import { successResponse, errorResponse } from '../utils/response.js';
import logger from '../config/logger.js';

/**
 * Get all safe zones for a school
 * GET /api/safe-zones/:schoolId
 */
export const getSafeZonesForSchool = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const { alertType } = req.query;

    if (!schoolId) {
      return errorResponse(res, 'School ID is required', 400);
    }

    const safeZones = await getSafeZones(schoolId, alertType || null);

    return successResponse(res, { safeZones }, 'Safe zones retrieved successfully');
  } catch (error) {
    logger.error('Get safe zones controller error:', error);
    return errorResponse(res, error.message || 'Failed to get safe zones', 500);
  }
};

/**
 * Find nearest safe zone
 * GET /api/safe-zones/nearest
 */
export const findNearest = async (req, res) => {
  try {
    const { schoolId, lat, lng, alertType } = req.query;

    // Validate required fields
    if (!schoolId || lat === undefined || lng === undefined) {
      return errorResponse(
        res,
        'School ID, latitude, and longitude are required',
        400
      );
    }

    // Validate coordinates
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);

    if (
      isNaN(latNum) ||
      isNaN(lngNum) ||
      latNum < -90 ||
      latNum > 90 ||
      lngNum < -180 ||
      lngNum > 180
    ) {
      return errorResponse(res, 'Invalid coordinates', 400);
    }

    const nearestZone = await findNearestSafeZone(
      schoolId,
      latNum,
      lngNum,
      alertType || null
    );

    if (!nearestZone) {
      return errorResponse(res, 'No safe zone found', 404);
    }

    return successResponse(res, { safeZone: nearestZone }, 'Nearest safe zone found');
  } catch (error) {
    logger.error('Find nearest safe zone controller error:', error);
    return errorResponse(res, error.message || 'Failed to find nearest safe zone', 500);
  }
};

/**
 * Get safe zones within radius
 * GET /api/safe-zones/:schoolId/within-radius
 */
export const getWithinRadius = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const { lat, lng, radius } = req.query;

    if (!schoolId || lat === undefined || lng === undefined) {
      return errorResponse(
        res,
        'School ID, latitude, and longitude are required',
        400
      );
    }

    // Validate coordinates
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    const radiusMeters = radius ? parseFloat(radius) : 1000; // Default 1km

    if (
      isNaN(latNum) ||
      isNaN(lngNum) ||
      latNum < -90 ||
      latNum > 90 ||
      lngNum < -180 ||
      lngNum > 180
    ) {
      return errorResponse(res, 'Invalid coordinates', 400);
    }

    if (isNaN(radiusMeters) || radiusMeters < 0) {
      return errorResponse(res, 'Invalid radius', 400);
    }

    const safeZones = await getSafeZonesWithinRadius(
      schoolId,
      latNum,
      lngNum,
      radiusMeters
    );

    return successResponse(
      res,
      { safeZones, radius: radiusMeters },
      'Safe zones within radius retrieved successfully'
    );
  } catch (error) {
    logger.error('Get safe zones within radius controller error:', error);
    return errorResponse(
      res,
      error.message || 'Failed to get safe zones within radius',
      500
    );
  }
};

