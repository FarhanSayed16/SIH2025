import ProjectorSession from '../models/ProjectorSession.js';
import Device from '../models/Device.js';
import logger from '../config/logger.js';

/**
 * Create a new projector session
 * @param {Object} sessionData - Session data
 * @returns {Object} Created session
 */
export const createSession = async (sessionData) => {
  try {
    const sessionId = await ProjectorSession.generateSessionId();
    
    const session = await ProjectorSession.create({
      ...sessionData,
      sessionId
    });

    logger.info(`Projector session created: ${sessionId} by ${sessionData.startedBy}`);
    return session;
  } catch (error) {
    logger.error('Create projector session error:', error);
    throw error;
  }
};

/**
 * Get active session for device
 * @param {string} deviceId - Device ID
 * @returns {Object|null} Active session
 */
export const getActiveSession = async (deviceId) => {
  try {
    const session = await ProjectorSession.findOne({
      deviceId,
      status: 'active'
    })
      .populate('classId', 'grade section classCode')
      .populate('startedBy', 'name email')
      .populate('institutionId', 'name');

    return session;
  } catch (error) {
    logger.error('Get active session error:', error);
    throw error;
  }
};

/**
 * Get session by ID
 * @param {string} sessionId - Session ID
 * @returns {Object|null} Session
 */
export const getSession = async (sessionId) => {
  try {
    const session = await ProjectorSession.findOne({ sessionId })
      .populate('classId', 'grade section classCode')
      .populate('startedBy', 'name email')
      .populate('institutionId', 'name');

    return session;
  } catch (error) {
    logger.error('Get session error:', error);
    throw error;
  }
};

/**
 * Update session content
 * @param {string} sessionId - Session ID
 * @param {Object} contentData - Content data
 * @returns {Object} Updated session
 */
export const updateContent = async (sessionId, contentData) => {
  try {
    const session = await ProjectorSession.findOne({ sessionId, status: 'active' });
    
    if (!session) {
      throw new Error('Session not found or not active');
    }

    await session.updateContent(contentData);
    
    logger.info(`Session ${sessionId} content updated`);
    return session;
  } catch (error) {
    logger.error('Update content error:', error);
    throw error;
  }
};

/**
 * Connect device to session
 * @param {string} sessionId - Session ID
 * @param {string} deviceId - Device ID
 * @param {string} deviceName - Device name
 * @returns {Object} Updated session
 */
export const connectDevice = async (sessionId, deviceId, deviceName) => {
  try {
    const session = await ProjectorSession.findOne({ sessionId, status: 'active' });
    
    if (!session) {
      throw new Error('Session not found or not active');
    }

    await session.addDevice(deviceId, deviceName);
    
    logger.info(`Device ${deviceId} connected to session ${sessionId}`);
    return session;
  } catch (error) {
    logger.error('Connect device error:', error);
    throw error;
  }
};

/**
 * End session
 * @param {string} sessionId - Session ID
 * @returns {Object} Ended session
 */
export const endSession = async (sessionId) => {
  try {
    const session = await ProjectorSession.findOne({ sessionId });
    
    if (!session) {
      throw new Error('Session not found');
    }

    session.status = 'ended';
    await session.save();
    
    logger.info(`Session ${sessionId} ended`);
    return session;
  } catch (error) {
    logger.error('End session error:', error);
    throw error;
  }
};

