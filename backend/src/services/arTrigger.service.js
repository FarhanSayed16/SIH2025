/**
 * Phase 5.7: AR Trigger Service
 * Handles remote AR path triggers from admin dashboard
 */

import { v4 as uuidv4 } from 'uuid';
import logger from '../config/logger.js';

/**
 * Trigger AR path for a school
 * @param {Object} io - Socket.io instance
 * @param {string} schoolId - School ID
 * @param {Object} pathData - Path data (waypoints, safeZone, etc.)
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Trigger result
 */
export const triggerARPath = async (io, schoolId, pathData, options = {}) => {
  try {
    const sessionId = options.sessionId || uuidv4();
    const { broadcastToSchool } = await import('../socket/rooms.js');

    const triggerData = {
      sessionId,
      assetUrl: pathData.assetUrl || 'https://assets.kavach.app/ar/arrow.glb',
      waypoints: pathData.waypoints || [],
      safeZone: pathData.safeZone,
      schoolId,
      alertType: pathData.alertType,
      alertId: pathData.alertId,
      drillId: pathData.drillId,
      triggeredBy: options.triggeredBy,
      triggeredAt: new Date().toISOString(),
    };

    // Emit to school room
    broadcastToSchool(io, schoolId, 'AR_PATH_TRIGGER', triggerData);

    logger.info(`AR path triggered for school ${schoolId} (session: ${sessionId})`);

    return {
      success: true,
      sessionId,
      schoolId,
      timestamp: triggerData.triggeredAt,
    };
  } catch (error) {
    logger.error('Error triggering AR path:', error);
    throw error;
  }
};

