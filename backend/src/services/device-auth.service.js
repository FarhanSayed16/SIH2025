import Device from '../models/Device.js';
import Class from '../models/Class.js';
import User from '../models/User.js';
import logger from '../config/logger.js';

/**
 * Login with device registration token
 * @param {string} deviceToken - Device registration token
 * @returns {Object} Device info and class context
 */
export const loginWithDevice = async (deviceToken) => {
  try {
    const device = await Device.findOne({ 
      registrationToken: deviceToken, 
      isActive: true 
    });

    if (!device) {
      throw new Error('Invalid device token');
    }

    // Update last seen
    device.updateLastSeen();

    // For class devices, return class context
    if (device.deviceType === 'class_tablet' && device.classId) {
      const classData = await Class.findById(device.classId)
        .populate('teacherId', 'name email')
        .populate('studentIds', 'name grade section qrCode')
        .populate('institutionId', 'name');

      if (!classData) {
        throw new Error('Class not found for this device');
      }

      logger.info(`Device login: ${device.deviceName} (Class: ${classData.classCode})`);

      return {
        device: {
          id: device._id,
          deviceId: device.deviceId,
          deviceName: device.deviceName,
          deviceType: device.deviceType,
          classId: device.classId
        },
        class: {
          id: classData._id,
          classCode: classData.classCode,
          grade: classData.grade,
          section: classData.section,
          teacher: classData.teacherId,
          students: classData.studentIds,
          school: classData.institutionId
        },
        mode: 'class_device',
        // No user token - device operates in class mode
      };
    }

    // For projector devices
    if (device.deviceType === 'projector_device') {
      const school = await device.populate('institutionId', 'name');

      logger.info(`Device login: ${device.deviceName} (Projector Mode)`);

      return {
        device: {
          id: device._id,
          deviceId: device.deviceId,
          deviceName: device.deviceName,
          deviceType: device.deviceType
        },
        school: school.institutionId,
        mode: 'projector',
        // Projector mode doesn't need user auth
      };
    }

    // For teacher devices
    if (device.deviceType === 'teacher_device') {
      // Teacher devices can have associated user
      // This would require additional logic if needed
      return {
        device: {
          id: device._id,
          deviceId: device.deviceId,
          deviceName: device.deviceName,
          deviceType: device.deviceType
        },
        mode: 'teacher_device'
      };
    }

    throw new Error('Unsupported device type for auto-login');
  } catch (error) {
    logger.error('Device login error:', error);
    throw error;
  }
};

/**
 * Register a new device
 * @param {Object} deviceData - Device information
 * @returns {Object} Registered device with token
 */
export const registerDevice = async (deviceData) => {
  try {
    const crypto = await import('crypto');
    
    // Generate registration token
    const registrationToken = crypto.randomBytes(32).toString('hex');

    const device = await Device.create({
      ...deviceData,
      registrationToken
    });

    logger.info(`Device registered: ${device.deviceName} (${device.deviceType})`);

    return {
      device: device.toJSON(),
      registrationToken // Return token for first-time setup
    };
  } catch (error) {
    logger.error('Device registration error:', error);
    throw error;
  }
};

