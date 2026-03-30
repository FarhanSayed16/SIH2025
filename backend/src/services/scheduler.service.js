/**
 * Phase 3.4.3: Scheduler Service
 * Handles scheduled message processing
 */

import { processScheduledBroadcasts } from './broadcast.service.js';
import logger from '../config/logger.js';

let schedulerInterval = null;
let isRunning = false;

/**
 * Start the scheduler
 * Checks for scheduled broadcasts every minute
 */
export const startScheduler = () => {
  if (isRunning) {
    logger.warn('Scheduler is already running');
    return;
  }

  // Process immediately on start
  processScheduledBroadcasts().catch(error => {
    logger.error('Error in initial scheduled broadcast processing:', error);
  });

  // Then check every minute
  schedulerInterval = setInterval(async () => {
    try {
      await processScheduledBroadcasts();
    } catch (error) {
      logger.error('Error processing scheduled broadcasts:', error);
    }
  }, 60 * 1000); // Check every minute

  isRunning = true;
  logger.info('✅ Message scheduler started (checking every minute)');
};

/**
 * Stop the scheduler
 */
export const stopScheduler = () => {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    isRunning = false;
    logger.info('Message scheduler stopped');
  }
};

/**
 * Process scheduled broadcasts manually (for testing)
 */
export const processScheduledNow = async () => {
  return await processScheduledBroadcasts();
};

export default {
  startScheduler,
  stopScheduler,
  processScheduledNow,
  isRunning: () => isRunning
};

