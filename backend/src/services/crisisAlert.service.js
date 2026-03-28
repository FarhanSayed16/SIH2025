/**
 * Phase 4.0: Crisis Alert Service
 * Centralized service for broadcasting crisis alerts via Socket.io
 */

import { getSocketIO } from '../config/socket.js';
import { createCrisisAlertEvent, SERVER_EVENTS } from '../socket/events.js';
import Alert from '../models/Alert.js';
import User from '../models/User.js';
import logger from '../config/logger.js';

/**
 * Broadcast crisis alert to school namespace
 * @param {Object} alert - Alert document
 * @param {Object} options - Options (isDrill, source, etc.)
 */
export const broadcastCrisisAlert = async (alert, options = {}) => {
  try {
    const io = getSocketIO();
    if (!io) {
      logger.warn('Socket.io not available for crisis alert broadcast');
      return;
    }

    const schoolId = alert.institutionId?.toString() || alert.institutionId;
    const roomName = `school:${schoolId}`;

    // Create enhanced event payload
    const eventPayload = createCrisisAlertEvent(alert, options);

    // Broadcast to school namespace
    io.to(roomName).emit(SERVER_EVENTS.CRISIS_ALERT, eventPayload);

    logger.info(`🚨 Crisis alert broadcasted: ${alert.type} (Drill: ${eventPayload.drillFlag}) to ${roomName}`);
    
    return eventPayload;
  } catch (error) {
    logger.error('Error broadcasting crisis alert:', error);
    throw error;
  }
};

/**
 * Broadcast drill start event
 * @param {Object} drill - Drill document
 */
export const broadcastDrillStart = async (drill) => {
  try {
    const io = getSocketIO();
    if (!io) {
      logger.warn('Socket.io not available for drill start broadcast');
      return;
    }

    const { createDrillStartEvent } = await import('../socket/events.js');
    const schoolId = drill.institutionId?.toString() || drill.institutionId;
    const roomName = `school:${schoolId}`;
    const eventPayload = createDrillStartEvent(drill);

    io.to(roomName).emit(SERVER_EVENTS.DRILL_START, eventPayload);

    logger.info(`🔔 Drill started: ${drill.type} (ID: ${drill._id}) in ${roomName}`);
    
    return eventPayload;
  } catch (error) {
    logger.error('Error broadcasting drill start:', error);
    throw error;
  }
};

/**
 * Broadcast drill end event
 * @param {Object} drill - Drill document
 */
export const broadcastDrillEnd = async (drill) => {
  try {
    const io = getSocketIO();
    if (!io) {
      logger.warn('Socket.io not available for drill end broadcast');
      return;
    }

    const { createDrillEndEvent } = await import('../socket/events.js');
    const schoolId = drill.institutionId?.toString() || drill.institutionId;
    const roomName = `school:${schoolId}`;
    const eventPayload = createDrillEndEvent(drill);

    io.to(roomName).emit(SERVER_EVENTS.DRILL_END, eventPayload);

    logger.info(`✅ Drill ended: ${drill.type} (ID: ${drill._id}) in ${roomName}`);
    
    return eventPayload;
  } catch (error) {
    logger.error('Error broadcasting drill end:', error);
    throw error;
  }
};

/**
 * Broadcast alert cancellation
 * @param {String} alertId - Alert ID
 * @param {String} schoolId - School ID
 * @param {String} reason - Cancellation reason
 */
export const broadcastAlertCancel = async (alertId, schoolId, reason = 'Alert cancelled by admin') => {
  try {
    const io = getSocketIO();
    if (!io) {
      logger.warn('Socket.io not available for alert cancellation');
      return;
    }

    const roomName = `school:${schoolId}`;
    const eventPayload = {
      alertId: alertId.toString(),
      reason,
      timestamp: new Date().toISOString()
    };

    io.to(roomName).emit(SERVER_EVENTS.ALERT_CANCEL, eventPayload);

    logger.info(`❌ Alert cancelled: ${alertId} in ${roomName}`);
    
    return eventPayload;
  } catch (error) {
    logger.error('Error broadcasting alert cancellation:', error);
    throw error;
  }
};

/**
 * Broadcast user status update
 * @param {String} userId - User ID
 * @param {String} schoolId - School ID
 * @param {String} status - Status (SAFE, HELP, MISSING, POTENTIALLY_TRAPPED)
 * @param {Object} location - Location coordinates (optional)
 */
export const broadcastUserStatusUpdate = async (userId, schoolId, status, location = null) => {
  try {
    const io = getSocketIO();
    if (!io) {
      logger.warn('Socket.io not available for status update');
      return;
    }

    // Get user details
    const user = await User.findById(userId).select('name email grade section');
    if (!user) {
      throw new Error('User not found');
    }

    const roomName = `school:${schoolId}`;
    const eventPayload = {
      userId: userId.toString(),
      userName: user.name,
      status: status.toUpperCase(),
      location: location || null,
      updatedAt: new Date().toISOString()
    };

    // Broadcast to school room
    io.to(roomName).emit(SERVER_EVENTS.USER_STATUS_UPDATE, eventPayload);
    
    // Also emit legacy event for backward compatibility
    io.to(roomName).emit('STUDENT_STATUS_UPDATE', eventPayload);

    logger.info(`📊 Status update: User ${user.name} (${userId}) → ${status} in ${roomName}`);
    
    return eventPayload;
  } catch (error) {
    logger.error('Error broadcasting user status update:', error);
    throw error;
  }
};

/**
 * Get all connected sockets in a school namespace
 * @param {String} schoolId - School ID
 * @returns {Number} - Number of connected sockets
 */
export const getConnectedUsersCount = (schoolId) => {
  try {
    const io = getSocketIO();
    if (!io) {
      return 0;
    }

    const roomName = `school:${schoolId}`;
    const room = io.sockets.adapter.rooms.get(roomName);
    return room ? room.size : 0;
  } catch (error) {
    logger.error('Error getting connected users count:', error);
    return 0;
  }
};

/**
 * Broadcast drill participation update
 * Phase 1: Real-time participation tracking
 * @param {String} drillId - Drill ID
 * @param {String} schoolId - School ID
 * @param {Object} participationData - Participation data
 */
export const broadcastDrillParticipationUpdate = async (drillId, schoolId, participationData) => {
  try {
    const io = getSocketIO();
    if (!io) {
      logger.warn('Socket.io not available for drill participation update');
      return;
    }

    const { createDrillParticipationUpdateEvent } = await import('../socket/events.js');
    const roomName = `school:${schoolId}`;
    const eventPayload = createDrillParticipationUpdateEvent(drillId, participationData);

    io.to(roomName).emit('DRILL_PARTICIPATION_UPDATE', eventPayload);

    logger.info(`📊 Drill participation update: Drill ${drillId} in ${roomName} - ${participationData.acknowledgedCount}/${participationData.totalParticipants} acknowledged`);
    
    return eventPayload;
  } catch (error) {
    logger.error('Error broadcasting drill participation update:', error);
    throw error;
  }
};

