import Device from '../models/Device.js';
import { errorResponse } from '../utils/response.js';
import logger from '../config/logger.js';

/**
 * Device authentication middleware
 * Validates device token for IoT device requests
 */
export const authenticateDevice = async (req, res, next) => {
  try {
    // Phase 4.3: Support both Bearer token format and custom headers
    let deviceToken = null;
    
    // Check Bearer token format (Phase 4.3 requirement)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      deviceToken = authHeader.substring(7); // Remove 'Bearer ' prefix
    }
    
    // Fallback to custom headers (existing format)
    if (!deviceToken) {
      deviceToken = req.headers['x-device-token'] || req.headers['device-token'];
    }
    
    if (!deviceToken) {
      return errorResponse(res, 'Device token required. Use Authorization: Bearer <token> or x-device-token header', 401);
    }

    // Find device by token
    const device = await Device.findOne({ deviceToken });
    
    if (!device) {
      logger.warn(`Device authentication failed: Invalid token`);
      return errorResponse(res, 'Invalid device token', 401);
    }

    // Check if device is active
    if (device.status !== 'active') {
      logger.warn(`Device authentication failed: Device ${device.deviceId} is ${device.status}`);
      return errorResponse(res, 'Device is not active', 403);
    }

    // Update last seen
    device.lastSeen = new Date();
    device.status = 'active';
    await device.save();

    // Attach device to request
    req.device = device;
    req.deviceId = device._id;
    req.institutionId = device.institutionId;

    next();
  } catch (error) {
    logger.error('Device authentication error:', error);
    return errorResponse(res, 'Device authentication failed', 401);
  }
};

/**
 * Optional device authentication
 * Attaches device if token is present, but doesn't fail if missing
 */
export const optionalDeviceAuth = async (req, res, next) => {
  try {
    const deviceToken = req.headers['x-device-token'] || req.headers['device-token'];
    
    if (deviceToken) {
      const device = await Device.findOne({ deviceToken });
      if (device && device.status === 'active') {
        req.device = device;
        req.deviceId = device._id;
        req.institutionId = device.institutionId;
        device.lastSeen = new Date();
        await device.save();
      }
    }
    
    next();
  } catch (error) {
    // Continue without device authentication
    next();
  }
};

