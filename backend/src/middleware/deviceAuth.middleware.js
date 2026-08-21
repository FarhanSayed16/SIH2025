import Device from '../models/Device.js';
import { errorResponse } from '../utils/response.js';
import logger from '../config/logger.js';

const LAST_SEEN_MIN_INTERVAL_MS = 30_000;

/**
 * Device authentication middleware
 * Validates device token for IoT / device requests
 */
export const authenticateDevice = async (req, res, next) => {
  try {
    let deviceToken = null;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      deviceToken = authHeader.substring(7);
    }

    if (!deviceToken) {
      deviceToken = req.headers['x-device-token'] || req.headers['device-token'];
    }

    if (!deviceToken) {
      return errorResponse(
        res,
        'Device token required. Use Authorization: Bearer <token> or x-device-token header',
        401
      );
    }

    const device = await Device.findOne({ deviceToken });

    if (!device) {
      logger.warn('Device authentication failed: Invalid token');
      return errorResponse(res, 'Invalid device token', 401);
    }

    if (device.isActive === false || device.status === 'inactive' || device.status === 'maintenance') {
      logger.warn(
        `Device authentication failed: Device ${device.deviceId} is ${device.status} (isActive=${device.isActive})`
      );
      return errorResponse(res, 'Device is not active', 403);
    }

    // Throttle lastSeen writes — telemetry can be very frequent
    const now = Date.now();
    const last = device.lastSeen ? new Date(device.lastSeen).getTime() : 0;
    if (!last || now - last >= LAST_SEEN_MIN_INTERVAL_MS) {
      device.lastSeen = new Date();
      if (device.status === 'offline') device.status = 'active';
      await device.save();
    }

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
 */
export const optionalDeviceAuth = async (req, res, next) => {
  try {
    const deviceToken =
      req.headers['x-device-token'] ||
      req.headers['device-token'] ||
      (req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.substring(7)
        : null);

    if (deviceToken) {
      const device = await Device.findOne({ deviceToken });
      if (device && device.isActive !== false && device.status !== 'inactive') {
        req.device = device;
        req.deviceId = device._id;
        req.institutionId = device.institutionId;
        const now = Date.now();
        const last = device.lastSeen ? new Date(device.lastSeen).getTime() : 0;
        if (!last || now - last >= LAST_SEEN_MIN_INTERVAL_MS) {
          device.lastSeen = new Date();
          await device.save();
        }
      }
    }

    next();
  } catch (error) {
    next();
  }
};
