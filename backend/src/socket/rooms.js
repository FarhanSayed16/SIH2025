import logger from '../config/logger.js';

/**
 * Room management utilities for Socket.io
 */

/**
 * Get room name for a school
 */
export const getSchoolRoom = (schoolId) => {
  return `school:${schoolId}`;
};

/**
 * Join a school room
 */
export const joinSchoolRoom = async (socket, schoolId) => {
  try {
    const roomName = getSchoolRoom(schoolId);
    await socket.join(roomName);
    logger.info(`Socket ${socket.id} joined room: ${roomName}`);
    return roomName;
  } catch (error) {
    logger.error('Error joining school room:', error);
    throw error;
  }
};

/**
 * Leave a school room
 */
export const leaveSchoolRoom = async (socket, schoolId) => {
  try {
    const roomName = getSchoolRoom(schoolId);
    await socket.leave(roomName);
    logger.info(`Socket ${socket.id} left room: ${roomName}`);
    return roomName;
  } catch (error) {
    logger.error('Error leaving school room:', error);
    throw error;
  }
};

/**
 * Get all sockets in a school room
 */
export const getRoomSockets = async (io, schoolId) => {
  try {
    const roomName = getSchoolRoom(schoolId);
    const sockets = await io.in(roomName).fetchSockets();
    return sockets;
  } catch (error) {
    logger.error('Error getting room sockets:', error);
    return [];
  }
};

/**
 * Get room count (number of users in room)
 */
export const getRoomCount = async (io, schoolId) => {
  try {
    const roomName = getSchoolRoom(schoolId);
    const sockets = await io.in(roomName).fetchSockets();
    return sockets.length;
  } catch (error) {
    logger.error('Error getting room count:', error);
    return 0;
  }
};

/**
 * Broadcast to school room
 */
export const broadcastToSchool = (io, schoolId, event, payload) => {
  const roomName = getSchoolRoom(schoolId);
  io.to(roomName).emit(event, {
    ...payload,
    timestamp: new Date().toISOString()
  });
  logger.info(`Broadcasted ${event} to room: ${roomName}`);
};

/**
 * Broadcast to all rooms
 */
export const broadcastToAll = (io, event, payload) => {
  io.emit(event, {
    ...payload,
    timestamp: new Date().toISOString()
  });
  logger.info(`Broadcasted ${event} to all clients`);
};

