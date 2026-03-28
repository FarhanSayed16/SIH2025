/**
 * Phase 4.7: AR Navigation Service
 * Calculates AR routes and navigation instructions
 */

import {
  getSafeZones,
  findNearestSafeZone,
  calculateDistance,
  formatDistance,
} from './safeZone.service.js';
import logger from '../config/logger.js';

/**
 * Calculate AR route from current location to destination
 * @param {string} schoolId - School ID
 * @param {number} startLat - Start latitude
 * @param {number} startLng - Start longitude
 * @param {number} endLat - End latitude (optional, will find nearest safe zone if not provided)
 * @param {number} endLng - End longitude (optional)
 * @param {string} alertType - Alert type for route optimization
 * @returns {Object} Route with waypoints and instructions
 */
export const calculateARRoute = async (
  schoolId,
  startLat,
  startLng,
  endLat = null,
  endLng = null,
  alertType = 'other'
) => {
  try {
    // If no destination provided, find nearest safe zone
    let destination = null;
    if (!endLat || !endLng) {
      destination = await findNearestSafeZone(schoolId, startLat, startLng, alertType);
      if (!destination) {
        throw new Error('No safe zone found');
      }
      endLat = destination.location.coordinates[1];
      endLng = destination.location.coordinates[0];
    }

    // Calculate route waypoints (simplified - can be enhanced with actual pathfinding)
    const waypoints = calculateWaypoints(startLat, startLng, endLat, endLng);
    
    // Generate turn-by-turn instructions
    const instructions = generateInstructions(waypoints, startLat, startLng);

    // Calculate total distance
    let totalDistance = 0;
    for (let i = 0; i < waypoints.length - 1; i++) {
      const dist = calculateDistance(
        waypoints[i].lat,
        waypoints[i].lng,
        waypoints[i + 1].lat,
        waypoints[i + 1].lng
      );
      totalDistance += dist;
    }

    // Estimate walking time (average walking speed: 1.4 m/s)
    const estimatedTimeSeconds = Math.round(totalDistance / 1.4);
    const estimatedTimeMinutes = Math.round(estimatedTimeSeconds / 60);

    const route = {
      routeId: `route-${Date.now()}-${schoolId}`,
      startLocation: {
        lat: startLat,
        lng: startLng,
      },
      endLocation: {
        lat: endLat,
        lng: endLng,
        name: destination?.name || 'Destination',
      },
      waypoints,
      instructions,
      totalDistance,
      totalDistanceFormatted: formatDistance(totalDistance),
      estimatedTime: estimatedTimeSeconds,
      estimatedTimeFormatted: `${estimatedTimeMinutes} min`,
      alertType,
      schoolId,
      createdAt: new Date(),
    };

    logger.info(`AR route calculated: ${totalDistance}m to ${destination?.name || 'destination'}`);
    return route;
  } catch (error) {
    logger.error('Calculate AR route error:', error);
    throw error;
  }
};

/**
 * Calculate waypoints for route (simplified - direct route)
 * In production, this would use actual building floor plans and pathfinding
 * @param {number} startLat - Start latitude
 * @param {number} startLng - Start longitude
 * @param {number} endLat - End latitude
 * @param {number} endLng - End longitude
 * @returns {Array} Array of waypoints
 */
const calculateWaypoints = (startLat, startLng, endLat, endLng) => {
  // For now, create a simple direct route with intermediate points
  // In production, this would use actual building layout and pathfinding algorithm
  
  const waypoints = [
    {
      lat: startLat,
      lng: startLng,
      type: 'start',
    },
  ];

  // Add intermediate waypoints (can be enhanced with actual building corridors, doors, etc.)
  const numIntermediatePoints = 2; // Can be adjusted based on distance
  
  const distance = calculateDistance(startLat, startLng, endLat, endLng);
  
  if (distance > 50) { // Add intermediate points for longer routes
    for (let i = 1; i <= numIntermediatePoints; i++) {
      const fraction = i / (numIntermediatePoints + 1);
      waypoints.push({
        lat: startLat + (endLat - startLat) * fraction,
        lng: startLng + (endLng - startLng) * fraction,
        type: 'waypoint',
      });
    }
  }

  waypoints.push({
    lat: endLat,
    lng: endLng,
    type: 'end',
  });

  return waypoints;
};

/**
 * Generate turn-by-turn instructions
 * @param {Array} waypoints - Route waypoints
 * @param {number} startLat - Start latitude
 * @param {number} startLng - Start longitude
 * @returns {Array} Array of instruction objects
 */
const generateInstructions = (waypoints, startLat, startLng) => {
  const instructions = [];

  // Starting instruction
  instructions.push({
    step: 1,
    instruction: 'Start navigation to safe zone',
    distance: 0,
    direction: 'start',
    lat: startLat,
    lng: startLng,
  });

  // Generate instructions for each waypoint
  for (let i = 1; i < waypoints.length; i++) {
    const prevWaypoint = waypoints[i - 1];
    const currentWaypoint = waypoints[i];
    
    const distance = calculateDistance(
      prevWaypoint.lat,
      prevWaypoint.lng,
      currentWaypoint.lat,
      currentWaypoint.lng
    );

    // Calculate bearing for direction
    const bearing = calculateBearing(
      prevWaypoint.lat,
      prevWaypoint.lng,
      currentWaypoint.lat,
      currentWaypoint.lng
    );
    
    const direction = getDirectionFromBearing(bearing);
    const instruction = getInstructionText(direction, distance, i === waypoints.length - 1);

    instructions.push({
      step: i + 1,
      instruction,
      distance,
      distanceFormatted: formatDistance(distance),
      direction,
      bearing,
      lat: currentWaypoint.lat,
      lng: currentWaypoint.lng,
    });
  }

  return instructions;
};

/**
 * Calculate bearing between two points
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lng1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lng2 - Longitude of point 2
 * @returns {number} Bearing in degrees (0-360)
 */
const calculateBearing = (lat1, lng1, lat2, lng2) => {
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const lat1Rad = (lat1 * Math.PI) / 180;
  const lat2Rad = (lat2 * Math.PI) / 180;

  const y = Math.sin(dLng) * Math.cos(lat2Rad);
  const x =
    Math.cos(lat1Rad) * Math.sin(lat2Rad) -
    Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng);

  let bearing = (Math.atan2(y, x) * 180) / Math.PI;
  bearing = (bearing + 360) % 360;

  return bearing;
};

/**
 * Get direction text from bearing
 * @param {number} bearing - Bearing in degrees
 * @returns {string} Direction text
 */
const getDirectionFromBearing = (bearing) => {
  const directions = [
    'north',
    'northeast',
    'east',
    'southeast',
    'south',
    'southwest',
    'west',
    'northwest',
  ];
  
  const index = Math.round(bearing / 45) % 8;
  return directions[index];
};

/**
 * Get instruction text
 * @param {string} direction - Direction
 * @param {number} distance - Distance in meters
 * @param {boolean} isLast - Is this the last instruction
 * @returns {string} Instruction text
 */
const getInstructionText = (direction, distance, isLast) => {
  if (isLast) {
    return `You have arrived at the safe zone`;
  }
  
  const distanceText = formatDistance(distance);
  const directionText = direction.charAt(0).toUpperCase() + direction.slice(1);
  
  return `Head ${directionText} for ${distanceText}`;
};

/**
 * Get AR markers for a school (exits, safe zones, hazards)
 * @param {string} schoolId - School ID
 * @param {string} alertType - Optional: Filter markers by alert type
 * @returns {Array} Array of AR markers
 */
export const getARMarkers = async (schoolId, alertType = null) => {
  try {
    const markers = [];

    // Get safe zones as markers
    const safeZones = await getSafeZones(schoolId, alertType);
    safeZones.forEach((zone, index) => {
      markers.push({
        markerId: `safe-zone-${schoolId}-${index}`,
        type: 'safe_zone',
        location: zone.location,
        label: zone.name,
        icon: 'safe',
        schoolId,
        capacity: zone.capacity,
        description: zone.description,
      });
    });

    // Get exits from floor plan (if available)
    // This can be enhanced to read from School.floorPlan.exits
    
    logger.info(`Generated ${markers.length} AR markers for school ${schoolId}`);
    return markers;
  } catch (error) {
    logger.error('Get AR markers error:', error);
    throw error;
  }
};

