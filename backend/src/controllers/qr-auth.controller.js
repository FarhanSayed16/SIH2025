import { loginWithQR, verifyQRCode } from '../services/qr-auth.service.js';
import { successResponse, errorResponse } from '../utils/response.js';
import logger from '../config/logger.js';

/**
 * Login with QR code
 * POST /api/auth/qr-login
 */
export const qrLogin = async (req, res) => {
  try {
    const { qrCode } = req.body;

    if (!qrCode) {
      return errorResponse(res, 'QR code is required', 400);
    }

    const result = await loginWithQR(qrCode);

    return successResponse(
      res,
      result,
      'QR login successful'
    );
  } catch (error) {
    logger.error('QR login controller error:', error);
    return errorResponse(
      res,
      error.message || 'QR login failed',
      401
    );
  }
};

/**
 * Verify QR code (without login)
 * GET /api/qr/verify/:qrCode
 */
export const verifyQR = async (req, res) => {
  try {
    const { qrCode } = req.params;

    if (!qrCode) {
      return errorResponse(res, 'QR code is required', 400);
    }

    const studentInfo = await verifyQRCode(qrCode);

    return successResponse(
      res,
      studentInfo,
      'QR code verified successfully'
    );
  } catch (error) {
    logger.error('QR verify controller error:', error);
    return errorResponse(
      res,
      error.message || 'QR verification failed',
      400
    );
  }
};

