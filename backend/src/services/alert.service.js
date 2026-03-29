import Alert from '../models/Alert.js';
import logger from '../config/logger.js';

/**
 * Create alert
 */
export const createAlert = async (alertData) => {
  try {
    // Normalize location (GeoJSON Point) if lat/lng provided
    const location =
      alertData.location ||
      (alertData.lat &&
        alertData.lng && {
          type: 'Point',
          coordinates: [alertData.lng, alertData.lat],
        });

    const alert = await Alert.create({
      ...alertData,
      ...(location ? { location } : {}),
    });

    logger.info(`Alert created: ${alert.type} (ID: ${alert._id})`);

    return alert;
  } catch (error) {
    logger.error('Create alert error:', error);
    throw error;
  }
};

/**
 * Update student status in alert
 */
export const updateStudentStatus = async (alertId, userId, status, location = null) => {
  try {
    const alert = await Alert.findById(alertId);
    
    if (!alert) {
      throw new Error('Alert not found');
    }
    
    await alert.updateStudentStatus(userId, status, location);
    
    logger.info(`Student status updated in alert ${alertId}: User ${userId} - ${status}`);
    
    return alert;
  } catch (error) {
    logger.error('Update student status error:', error);
    throw error;
  }
};

/**
 * Resolve alert
 */
export const resolveAlert = async (alertId, resolvedBy) => {
  try {
    const alert = await Alert.findById(alertId);
    
    if (!alert) {
      throw new Error('Alert not found');
    }
    
    await alert.resolve(resolvedBy);
    
    logger.info(`Alert resolved: ${alertId} by ${resolvedBy}`);
    
    return alert;
  } catch (error) {
    logger.error('Resolve alert error:', error);
    throw error;
  }
};

