import School from '../models/School.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response.js';
import { createNearQuery, validateCoordinates } from '../utils/geospatial.js';
import logger from '../config/logger.js';

/**
 * List all schools
 * GET /api/schools
 */
export const listSchools = async (req, res) => {
  try {
    const { page = 1, limit = 10, region, search } = req.query;

    const query = { isActive: true };
    if (region) query.region = region;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } }
      ];
    }

    const schools = await School.find(query)
      .select('-floorPlan.hazards') // Don't expose hazards by default
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await School.countDocuments(query);

    return paginatedResponse(res, schools, {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit)
    }, 'Schools retrieved successfully');
  } catch (error) {
    logger.error('List schools error:', error);
    return errorResponse(res, 'Failed to list schools', 500);
  }
};

/**
 * Get school by ID
 * GET /api/schools/:id
 */
export const getSchoolById = async (req, res) => {
  try {
    const { id } = req.params;

    const school = await School.findById(id);

    if (!school) {
      return errorResponse(res, 'School not found', 404);
    }

    return successResponse(res, { school }, 'School retrieved successfully');
  } catch (error) {
    logger.error('Get school error:', error);
    return errorResponse(res, 'Failed to get school', 500);
  }
};

/**
 * Create school (Admin only)
 * POST /api/schools
 */
export const createSchool = async (req, res) => {
  try {
    const schoolData = req.body;

    // Validate coordinates
    if (schoolData.location && schoolData.location.coordinates) {
      const [lng, lat] = schoolData.location.coordinates;
      if (!validateCoordinates(lat, lng)) {
        return errorResponse(res, 'Invalid coordinates', 400);
      }
    }

    const school = await School.create(schoolData);

    logger.info(`School created: ${school.name} (ID: ${school._id})`);

    return successResponse(res, { school }, 'School created successfully', 201);
  } catch (error) {
    logger.error('Create school error:', error);
    return errorResponse(res, error.message || 'Failed to create school', 400);
  }
};

/**
 * Update school (Admin only)
 * PUT /api/schools/:id
 */
export const updateSchool = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Validate coordinates if provided
    if (updates.location && updates.location.coordinates) {
      const [lng, lat] = updates.location.coordinates;
      if (!validateCoordinates(lat, lng)) {
        return errorResponse(res, 'Invalid coordinates', 400);
      }
    }

    const school = await School.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!school) {
      return errorResponse(res, 'School not found', 404);
    }

    logger.info(`School updated: ${school.name}`);

    return successResponse(res, { school }, 'School updated successfully');
  } catch (error) {
    logger.error('Update school error:', error);
    return errorResponse(res, 'Failed to update school', 500);
  }
};

/**
 * Find nearest schools (Add-on 1: Geo-Spatial Engine)
 * GET /api/schools/nearest?lat=30.0&lng=75.0&radius=5000
 */
export const findNearestSchools = async (req, res) => {
  try {
    const { lat, lng, radius = 5000 } = req.query;

    // Validate coordinates
    if (!lat || !lng) {
      return errorResponse(res, 'Latitude and longitude are required', 400);
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const maxDistance = parseInt(radius);

    if (!validateCoordinates(latitude, longitude)) {
      return errorResponse(res, 'Invalid coordinates', 400);
    }

    if (maxDistance <= 0 || maxDistance > 50000) {
      return errorResponse(res, 'Radius must be between 1 and 50000 meters', 400);
    }

    // Use MongoDB geospatial query
    const schools = await School.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude] // MongoDB uses [lng, lat]
          },
          $maxDistance: maxDistance
        }
      },
      isActive: true
    })
      .select('name address location safeZones contact region disasterTypes')
      .limit(20); // Limit results

    logger.info(`Found ${schools.length} schools within ${maxDistance}m of [${latitude}, ${longitude}]`);

    return successResponse(
      res,
      {
        schools,
        query: {
          location: { lat: latitude, lng: longitude },
          radius: maxDistance,
          count: schools.length
        }
      },
      'Nearest schools retrieved successfully'
    );
  } catch (error) {
    logger.error('Find nearest schools error:', error);
    return errorResponse(res, 'Failed to find nearest schools', 500);
  }
};

/**
 * Get school safe zones
 * GET /api/schools/:id/safe-zones
 */
export const getSafeZones = async (req, res) => {
  try {
    const { id } = req.params;

    const school = await School.findById(id).select('name safeZones');

    if (!school) {
      return errorResponse(res, 'School not found', 404);
    }

    return successResponse(res, {
      schoolName: school.name,
      safeZones: school.safeZones
    }, 'Safe zones retrieved successfully');
  } catch (error) {
    logger.error('Get safe zones error:', error);
    return errorResponse(res, 'Failed to get safe zones', 500);
  }
};

