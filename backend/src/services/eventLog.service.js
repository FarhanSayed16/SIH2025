/**
 * Phase 3.5.6: Event Log Service
 * Handles logging and querying user events for analytics
 */

import EventLog from '../models/EventLog.js';
import logger from '../config/logger.js';

/**
 * Log an event
 * @param {Object} eventData - Event data
 * @returns {Promise<Object>} Created event log
 */
export const logEvent = async (eventData) => {
  try {
    const event = await EventLog.create({
      userId: eventData.userId,
      institutionId: eventData.institutionId,
      eventType: eventData.eventType,
      entityType: eventData.entityType,
      entityId: eventData.entityId,
      metadata: eventData.metadata || {},
      timestamp: eventData.timestamp || new Date(),
      streakContext: eventData.streakContext || null,
      streakCount: eventData.streakCount || 0
    });

    return event;
  } catch (error) {
    logger.error('Log event error:', error);
    throw error;
  }
};

/**
 * Log multiple events (batch insert)
 * @param {Array} events - Array of event data objects
 * @returns {Promise<Array>} Created events
 */
export const logEvents = async (events) => {
  try {
    const createdEvents = await EventLog.insertMany(events);
    return createdEvents;
  } catch (error) {
    logger.error('Log events batch error:', error);
    throw error;
  }
};

/**
 * Get events for a user
 * @param {string} userId - User ID
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} Events
 */
export const getUserEvents = async (userId, filters = {}) => {
  try {
    const query = { userId };

    if (filters.eventType) {
      query.eventType = filters.eventType;
    }

    if (filters.entityType) {
      query.entityType = filters.entityType;
    }

    if (filters.entityId) {
      query.entityId = filters.entityId;
    }

    if (filters.startDate || filters.endDate) {
      query.timestamp = {};
      if (filters.startDate) {
        query.timestamp.$gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        query.timestamp.$lte = new Date(filters.endDate);
      }
    }

    const events = await EventLog.find(query)
      .sort({ timestamp: -1 })
      .limit(filters.limit || 100)
      .lean();

    return events;
  } catch (error) {
    logger.error('Get user events error:', error);
    throw error;
  }
};

/**
 * Get events for an institution
 * @param {string} institutionId - Institution ID
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} Events
 */
export const getInstitutionEvents = async (institutionId, filters = {}) => {
  try {
    const query = { institutionId };

    if (filters.eventType) {
      query.eventType = filters.eventType;
    }

    if (filters.startDate || filters.endDate) {
      query.timestamp = {};
      if (filters.startDate) {
        query.timestamp.$gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        query.timestamp.$lte = new Date(filters.endDate);
      }
    }

    const events = await EventLog.find(query)
      .sort({ timestamp: -1 })
      .limit(filters.limit || 1000)
      .lean();

    return events;
  } catch (error) {
    logger.error('Get institution events error:', error);
    throw error;
  }
};

/**
 * Get event count by type
 * @param {Object} filters - Filter options
 * @returns {Promise<Object>} Event counts by type
 */
export const getEventCounts = async (filters = {}) => {
  try {
    const matchQuery = {};

    if (filters.userId) {
      matchQuery.userId = filters.userId;
    }

    if (filters.institutionId) {
      matchQuery.institutionId = filters.institutionId;
    }

    if (filters.startDate || filters.endDate) {
      matchQuery.timestamp = {};
      if (filters.startDate) {
        matchQuery.timestamp.$gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        matchQuery.timestamp.$lte = new Date(filters.endDate);
      }
    }

    const counts = await EventLog.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$eventType',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    return counts.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});
  } catch (error) {
    logger.error('Get event counts error:', error);
    throw error;
  }
};

export default {
  logEvent,
  logEvents,
  getUserEvents,
  getInstitutionEvents,
  getEventCounts
};

