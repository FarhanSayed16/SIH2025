/**
 * Phase 4.4: Emergency Acknowledgment & Triage Service
 * 
 * Handles user status tracking, status summaries, and Dead Man's Switch logic
 */

import Alert from '../models/Alert.js';
import User from '../models/User.js';
import logger from '../config/logger.js';

/**
 * Update user status in alert
 * Phase 4.4: Enhanced with 'help' status and better error handling
 */
export const updateUserStatus = async (alertId, userId, status, location = null) => {
  try {
    const alert = await Alert.findById(alertId);
    
    if (!alert) {
      throw new Error('Alert not found');
    }

    // Validate status
    const validStatuses = ['safe', 'help', 'missing', 'at_risk', 'potentially_trapped'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}`);
    }

    // Update or add student status
    await alert.updateStudentStatus(userId, status, location);
    
    logger.info(`✅ User status updated in alert ${alertId}: User ${userId} - ${status}`);
    
    return alert;
  } catch (error) {
    logger.error('Update user status error:', error);
    throw error;
  }
};

/**
 * Get all user statuses for an alert
 * Phase 4.4: Returns detailed status information
 */
export const getUserStatuses = async (alertId) => {
  try {
    const alert = await Alert.findById(alertId)
      .populate('studentStatus.userId', 'name email role grade section')
      .populate('institutionId', 'name');

    if (!alert) {
      throw new Error('Alert not found');
    }

    return {
      alertId: alert._id,
      alertType: alert.type,
      institutionId: alert.institutionId,
      createdAt: alert.createdAt,
      statuses: alert.studentStatus
        .filter(ss => ss.userId !== null && ss.userId !== undefined) // Filter out null userIds
        .map(ss => ({
          userId: ss.userId._id,
          userName: ss.userId?.name || 'Unknown',
          userEmail: ss.userId?.email || '',
          userRole: ss.userId?.role || 'unknown',
          userGrade: ss.userId?.grade || null,
          userSection: ss.userId?.section || null,
          status: ss.status,
          lastUpdate: ss.lastUpdate,
          location: ss.location
        }))
    };
  } catch (error) {
    logger.error('Get user statuses error:', error);
    throw error;
  }
};

/**
 * Get status summary for an alert
 * Phase 4.4: Returns counts by status type
 */
export const getStatusSummary = async (alertId) => {
  try {
    const alert = await Alert.findById(alertId)
      .populate('institutionId', 'name')
      .populate('studentStatus.userId', 'name email role');

    if (!alert) {
      throw new Error('Alert not found');
    }

    // Count by status
    const summary = {
      safe: 0,
      help: 0,
      missing: 0,
      at_risk: 0,
      potentially_trapped: 0,
      total: alert.studentStatus.filter(ss => ss.userId !== null && ss.userId !== undefined).length
    };

    alert.studentStatus.forEach(ss => {
      // Only count if userId exists (filter out broken references)
      if (ss.userId && summary[ss.status] !== undefined) {
        summary[ss.status]++;
      }
    });

    // Calculate percentages
    const percentages = {};
    if (summary.total > 0) {
      Object.keys(summary).forEach(key => {
        if (key !== 'total') {
          percentages[key] = Math.round((summary[key] / summary.total) * 100);
        }
      });
    }

    return {
      alertId: alert._id,
      alertType: alert.type,
      alertTitle: alert.title,
      institutionId: alert.institutionId,
      createdAt: alert.createdAt,
      counts: summary,
      percentages,
      lastUpdated: alert.updatedAt
    };
  } catch (error) {
    logger.error('Get status summary error:', error);
    throw error;
  }
};

/**
 * Get affected users for an alert (by institution/class/location)
 * Phase 4.4: Determines which users should be tracked for this alert
 */
export const getAffectedUsers = async (alert) => {
  try {
    const { institutionId, location, metadata } = alert;

    // Get all users in the institution
    const query = {
      institutionId: institutionId,
      isActive: true,
      role: { $in: ['student', 'teacher'] } // Include both students and teachers
    };

    // If alert has location details, can filter by location (future enhancement)
    // For now, get all users in institution
    
    const users = await User.find(query)
      .select('_id name email role grade section classId currentLocation');

    logger.info(`📋 Found ${users.length} affected users for alert ${alert._id}`);

    return users;
  } catch (error) {
    logger.error('Get affected users error:', error);
    throw error;
  }
};

/**
 * Initialize student statuses for an alert
 * Phase 4.4: Populates initial status entries for all affected users
 */
export const initializeStudentStatuses = async (alert) => {
  try {
    // Get affected users
    const users = await getAffectedUsers(alert);

    // Initialize status entries for users not yet in studentStatus
    const existingUserIds = alert.studentStatus.map(ss => ss.userId.toString());
    const newStatuses = [];

    users.forEach(user => {
      if (!existingUserIds.includes(user._id.toString())) {
        newStatuses.push({
          userId: user._id,
          status: 'missing', // Default to missing until they respond
          lastUpdate: alert.createdAt, // Set to alert creation time
          location: user.currentLocation || {
            type: 'Point',
            coordinates: [0, 0]
          }
        });
      }
    });

    if (newStatuses.length > 0) {
      alert.studentStatus.push(...newStatuses);
      await alert.save();
      logger.info(`✅ Initialized ${newStatuses.length} student statuses for alert ${alert._id}`);
    }

    return alert;
  } catch (error) {
    logger.error('Initialize student statuses error:', error);
    throw error;
  }
};

/**
 * Mark user as missing (Admin/Teacher action)
 * Phase 4.4: Manual status update by authorized personnel
 */
export const markUserMissing = async (alertId, userId, markedBy) => {
  try {
    const alert = await Alert.findById(alertId);
    
    if (!alert) {
      throw new Error('Alert not found');
    }

    await alert.updateStudentStatus(userId, 'missing', null);
    
    logger.info(`⚠️ User ${userId} marked as missing in alert ${alertId} by ${markedBy}`);
    
    return alert;
  } catch (error) {
    logger.error('Mark user missing error:', error);
    throw error;
  }
};

