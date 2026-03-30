/**
 * Phase 4.7: Safe Zone Service
 * Manages safe zones for schools and calculates nearest safe zones
 */

import School from '../models/School.js';
import { calculateDistance as geospatialCalculateDistance } from '../utils/geospatial.js';
import logger from '../config/logger.js';

// Re-export calculateDistance for convenience
export const calculateDistance = geospatialCalculateDistance;

/**
 * Get all safe zones for a school
 * @param {string} schoolId - School ID
 * @param {string} alertType - Optional: Filter by alert type
 * @returns {Array} Array of safe zones
 */
export const getSafeZones = async (schoolId, alertType = null) => {
  try {
    const school = await School.findById(schoolId);
    if (!school) {
      throw new Error('School not found');
    }

    let safeZones = school.safeZones || [];

    // Filter by alert type if provided
    // Note: Safe zones should be compatible with all alert types by default
    // This can be enhanced later to have alertType-specific safe zones

    // Enrich safe zones with additional data
    const enrichedZones = safeZones.map((zone, index) => ({
      zoneId: `${schoolId}-${index}`,
      name: zone.name,
      location: {
        type: 'Point',
        coordinates: zone.location.coordinates,
        lat: zone.location.coordinates[1],
        lng: zone.location.coordinates[0],
      },
      capacity: zone.capacity || 0,
      description: zone.description || '',
      schoolId: schoolId.toString(),
      building: school.name, // Can be enhanced with building info
    }));

    logger.info(`Retrieved ${enrichedZones.length} safe zones for school ${schoolId}`);
    return enrichedZones;
  } catch (error) {
    logger.error('Get safe zones error:', error);
    throw error;
  }
};

/**
 * Find nearest safe zone to a location
 * @param {string} schoolId - School ID
 * @param {number} lat - Current latitude
 * @param {number} lng - Current longitude
 * @param {string} alertType - Optional: Filter by alert type
 * @returns {Object|null} Nearest safe zone with distance
 */
export const findNearestSafeZone = async (schoolId, lat, lng, alertType = null) => {
  try {
    const safeZones = await getSafeZones(schoolId, alertType);
    
    if (safeZones.length === 0) {
      return null;
    }

    // Calculate distance to each safe zone
    const zonesWithDistance = safeZones.map((zone) => {
      const zoneLat = zone.location.coordinates[1];
      const zoneLng = zone.location.coordinates[0];
      const distance = calculateDistance(lat, lng, zoneLat, zoneLng);

      return {
        ...zone,
        distance, // in meters
        distanceFormatted: formatDistance(distance),
      };
    });

    // Sort by distance and return nearest
    zonesWithDistance.sort((a, b) => a.distance - b.distance);
    
    const nearest = zonesWithDistance[0];
    logger.info(`Nearest safe zone for school ${schoolId}: ${nearest.name} (${nearest.distanceFormatted} away)`);
    
    return nearest;
  } catch (error) {
    logger.error('Find nearest safe zone error:', error);
    throw error;
  }
};

/**
 * Format distance in human-readable format
 * @param {number} distanceMeters - Distance in meters
 * @returns {string} Formatted distance string
 */
export const formatDistance = (distanceMeters) => {
  if (distanceMeters < 1000) {
    return `${Math.round(distanceMeters)}m`;
  }
  return `${(distanceMeters / 1000).toFixed(2)}km`;
};

/**
 * Get safe zones within a radius
 * @param {string} schoolId - School ID
 * @param {number} lat - Center latitude
 * @param {number} lng - Center longitude
 * @param {number} radiusMeters - Radius in meters
 * @returns {Array} Array of safe zones within radius
 */
export const getSafeZonesWithinRadius = async (schoolId, lat, lng, radiusMeters = 1000) => {
  try {
    const safeZones = await getSafeZones(schoolId);
    
    const zonesWithinRadius = safeZones
      .map((zone) => {
        const zoneLat = zone.location.coordinates[1];
        const zoneLng = zone.location.coordinates[0];
        const distance = calculateDistance(lat, lng, zoneLat, zoneLng);

        return {
          ...zone,
          distance,
          distanceFormatted: formatDistance(distance),
        };
      })
      .filter((zone) => zone.distance <= radiusMeters)
      .sort((a, b) => a.distance - b.distance);

    logger.info(`Found ${zonesWithinRadius.length} safe zones within ${radiusMeters}m of (${lat}, ${lng})`);
    return zonesWithinRadius;
  } catch (error) {
    logger.error('Get safe zones within radius error:', error);
    throw error;
  }
};

