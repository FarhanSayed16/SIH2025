/**
 * Geospatial utility functions for MongoDB queries
 */

/**
 * Create a GeoJSON Point from latitude and longitude
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Object} GeoJSON Point
 */
export const createPoint = (lat, lng) => {
  return {
    type: 'Point',
    coordinates: [parseFloat(lng), parseFloat(lat)] // MongoDB uses [lng, lat]
  };
};

/**
 * Validate coordinates
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {boolean}
 */
export const validateCoordinates = (lat, lng) => {
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return false;
  }
  if (lat < -90 || lat > 90) {
    return false;
  }
  if (lng < -180 || lng > 180) {
    return false;
  }
  return true;
};

/**
 * Create $near query for MongoDB
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {number} maxDistance - Maximum distance in meters
 * @returns {Object} MongoDB $near query
 */
export const createNearQuery = (lat, lng, maxDistance = 5000) => {
  if (!validateCoordinates(lat, lng)) {
    throw new Error('Invalid coordinates');
  }

  return {
    $near: {
      $geometry: createPoint(lat, lng),
      $maxDistance: maxDistance
    }
  };
};

/**
 * Calculate distance between two points (Haversine formula)
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lng1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lng2 - Longitude of point 2
 * @returns {number} Distance in meters
 */
export const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371000; // Earth radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

