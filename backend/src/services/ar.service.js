/**
 * Phase 5.7: AR Service
 * Handles AR session logging and management
 */

import ARSession from '../models/ARSession.js';
import logger from '../config/logger.js';

/**
 * Log AR session event
 * @param {Object} sessionData - Session data
 * @returns {Promise<Object>} Created session
 */
export const logARSession = async (sessionData) => {
  try {
    const session = await ARSession.create({
      sessionId: sessionData.sessionId,
      userId: sessionData.userId,
      schoolId: sessionData.schoolId,
      sessionType: sessionData.type,
      eventType: sessionData.eventType || 'session_start',
      drillId: sessionData.drillId,
      alertId: sessionData.alertId,
      metadata: sessionData.eventData || {
        waypoints: sessionData.waypoints || [],
        safeZone: sessionData.safeZone,
        fireId: sessionData.fireId,
        score: sessionData.score,
        timeToExtinguish: sessionData.timeToExtinguish,
        eventData: sessionData.eventData,
      },
      location: sessionData.location,
      timestamp: sessionData.timestamp ? new Date(sessionData.timestamp) : new Date(),
    });

    logger.info(`AR session logged: ${session.sessionId} (${session.sessionType})`);
    return session;
  } catch (error) {
    logger.error('Error logging AR session:', error);
    throw error;
  }
};

/**
 * Get AR sessions for a user
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} AR sessions
 */
export const getUserARSessions = async (userId, options = {}) => {
  try {
    const { limit = 50, sessionType, drillId, sessionId } = options;
    
    const query = { userId };
    if (sessionType) query.sessionType = sessionType;
    if (drillId) query.drillId = drillId;
    if (sessionId) query.sessionId = sessionId;

    const sessions = await ARSession.find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .populate('drillId', 'type status')
      .populate('alertId', 'type status')
      .lean();

    return sessions;
  } catch (error) {
    logger.error('Error getting user AR sessions:', error);
    throw error;
  }
};

/**
 * Get AR sessions for a school
 * @param {string} schoolId - School ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} AR sessions
 */
export const getSchoolARSessions = async (schoolId, options = {}) => {
  try {
    const { limit = 100, sessionType, startDate, endDate } = options;
    
    const query = { schoolId };
    if (sessionType) query.sessionType = sessionType;
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const sessions = await ARSession.find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .populate('userId', 'name role')
      .populate('drillId', 'type status')
      .lean();

    return sessions;
  } catch (error) {
    logger.error('Error getting school AR sessions:', error);
    throw error;
  }
};

/**
 * Get AR session statistics
 * @param {string} schoolId - School ID
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Statistics
 */
export const getARSessionStatistics = async (schoolId, options = {}) => {
  try {
    const { startDate, endDate } = options;
    
    const query = { schoolId };
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const [
      totalSessions,
      evacuationSessions,
      fireSimulationSessions,
      uniqueUsers,
    ] = await Promise.all([
      ARSession.countDocuments(query),
      ARSession.countDocuments({ ...query, sessionType: 'path_placement' }),
      ARSession.countDocuments({ ...query, sessionType: 'fire_simulation' }),
      ARSession.distinct('userId', query),
    ]);

    return {
      totalSessions,
      evacuationSessions,
      fireSimulationSessions,
      uniqueUsers: uniqueUsers.length,
    };
  } catch (error) {
    logger.error('Error getting AR session statistics:', error);
    throw error;
  }
};

