import { loginWithDevice, registerDevice } from '../services/device-auth.service.js';
import { successResponse, errorResponse } from '../utils/response.js';
import logger from '../config/logger.js';

/**
 * Login with device token
 * POST /api/auth/device-login
 */
export const deviceLogin = async (req, res) => {
  try {
    const { deviceToken } = req.body;

    if (!deviceToken) {
      return errorResponse(res, 'Device token is required', 400);
    }

    const result = await loginWithDevice(deviceToken);

    return successResponse(
      res,
      result,
      'Device login successful'
    );
  } catch (error) {
    logger.error('Device login controller error:', error);
    return errorResponse(
      res,
      error.message || 'Device login failed',
      401
    );
  }
};

/**
 * Register a new device
 * POST /api/devices/register
 */
export const register = async (req, res) => {
  try {
    const { deviceId, deviceName, deviceType, institutionId, classId, metadata } = req.body;

    if (!deviceId || !deviceName || !deviceType || !institutionId) {
      return errorResponse(res, 'Missing required fields: deviceId, deviceName, deviceType, institutionId', 400);
    }

    const result = await registerDevice({
      deviceId,
      deviceName,
      deviceType,
      institutionId,
      classId: classId || null,
      metadata: metadata || {}
    });

    return successResponse(
      res,
      result,
      'Device registered successfully',
      201
    );
  } catch (error) {
    logger.error('Device registration controller error:', error);
    return errorResponse(
      res,
      error.message || 'Device registration failed',
      400
    );
  }
};

