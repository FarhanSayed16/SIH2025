/**
 * Phase 4.4: Dead Man's Switch Service
 * 
 * Automatically marks users as POTENTIALLY_TRAPPED if they haven't responded
 * within 5 minutes of an alert being triggered.
 * 
 * Cron job runs every 30 seconds to check for unresponsive users.
 */

import Alert from '../models/Alert.js';
import logger from '../config/logger.js';
import { broadcastUserStatusUpdate } from './crisisAlert.service.js';

const DEAD_MANS_SWITCH_TIMEOUT = 5 * 60 * 1000; // 5 minutes in milliseconds
const CHECK_INTERVAL = 30 * 1000; // 30 seconds

let cronInterval = null;

/**
 * Check for users who need to be marked as POTENTIALLY_TRAPPED
 */
export const checkDeadManSwitch = async () => {
  try {
    const now = new Date();
    
    // Get all active alerts
    const activeAlerts = await Alert.find({ status: 'active' })
      .populate('studentStatus.userId', 'name email role');

    let processedCount = 0;

    for (const alert of activeAlerts) {
      const alertStartTime = new Date(alert.createdAt);
      const timeSinceAlert = now - alertStartTime;

      // Only check alerts older than 5 minutes
      if (timeSinceAlert < DEAD_MANS_SWITCH_TIMEOUT) {
        continue;
      }

      // Check each user's status
      for (const studentStatus of alert.studentStatus) {
        const status = studentStatus.status;
        const lastUpdate = new Date(studentStatus.lastUpdate);
        const timeSinceUpdate = now - lastUpdate;

        // Check if user hasn't responded (status is 'missing' or 'at_risk')
        // and it's been more than 5 minutes since alert started
        // and more than 5 minutes since last update
        if (
          (status === 'missing' || status === 'at_risk') &&
          timeSinceAlert >= DEAD_MANS_SWITCH_TIMEOUT &&
          timeSinceUpdate >= DEAD_MANS_SWITCH_TIMEOUT
        ) {
          // Mark as potentially trapped
          studentStatus.status = 'potentially_trapped';
          studentStatus.lastUpdate = now;
          
          processedCount++;

          logger.warn(
            `🚨 Dead Man's Switch activated for user ${studentStatus.userId?._id || studentStatus.userId} ` +
            `in alert ${alert._id}. Time since alert: ${Math.round(timeSinceAlert / 1000)}s`
          );

          // Broadcast status update via Socket.io
          try {
            await broadcastUserStatusUpdate(
              studentStatus.userId._id || studentStatus.userId,
              alert.institutionId,
              'POTENTIALLY_TRAPPED',
              studentStatus.location?.coordinates ? {
                lat: studentStatus.location.coordinates[1],
                lng: studentStatus.location.coordinates[0]
              } : null
            );
          } catch (error) {
            logger.warn('Failed to broadcast Dead Man Switch status update:', error);
          }
        }
      }

      // Save alert if we made changes
      if (processedCount > 0) {
        await alert.save();
      }
    }

    if (processedCount > 0) {
      logger.info(`✅ Dead Man's Switch processed ${processedCount} users across ${activeAlerts.length} alerts`);
    }
  } catch (error) {
    logger.error('Dead Man Switch check error:', error);
  }
};

/**
 * Start the Dead Man's Switch cron job
 */
export const startDeadManSwitch = () => {
  if (cronInterval) {
    logger.warn('Dead Man Switch cron job already running');
    return;
  }

  logger.info('🚀 Starting Dead Man Switch cron job (checks every 30 seconds)');
  
  // Run immediately on start
  checkDeadManSwitch();

  // Then run every 30 seconds
  cronInterval = setInterval(() => {
    checkDeadManSwitch();
  }, CHECK_INTERVAL);
};

/**
 * Stop the Dead Man's Switch cron job
 */
export const stopDeadManSwitch = () => {
  if (cronInterval) {
    clearInterval(cronInterval);
    cronInterval = null;
    logger.info('🛑 Stopped Dead Man Switch cron job');
  }
};

// Note: Dead Man Switch should be started manually after MongoDB connection is established
// Auto-start removed to prevent database connection issues

