import { generateQRForStudent, generateQRForClass, regenerateQRForStudent } from '../services/qr-generator.service.js';
import { successResponse, errorResponse } from '../utils/response.js';
import logger from '../config/logger.js';

/**
 * Generate QR code for a student
 * POST /api/qr/generate/:studentId
 */
export const generateQR = async (req, res) => {
  try {
    const { studentId } = req.params;

    if (!studentId) {
      return errorResponse(res, 'Student ID is required', 400);
    }

    const result = await generateQRForStudent(studentId);

    return successResponse(
      res,
      result,
      'QR code generated successfully'
    );
  } catch (error) {
    logger.error('QR generation controller error:', error);
    return errorResponse(
      res,
      error.message || 'QR generation failed',
      400
    );
  }
};

/**
 * Bulk generate QR codes for a class
 * POST /api/qr/generate-class/:classId
 */
export const generateQRForClassBulk = async (req, res) => {
  try {
    const { classId } = req.params;

    if (!classId) {
      return errorResponse(res, 'Class ID is required', 400);
    }

    const result = await generateQRForClass(classId);

    return successResponse(
      res,
      result,
      'QR codes generated successfully'
    );
  } catch (error) {
    logger.error('Bulk QR generation controller error:', error);
    return errorResponse(
      res,
      error.message || 'Bulk QR generation failed',
      400
    );
  }
};

/**
 * Regenerate QR code for a student
 * POST /api/qr/regenerate/:studentId
 */
export const regenerateQR = async (req, res) => {
  try {
    const { studentId } = req.params;

    if (!studentId) {
      return errorResponse(res, 'Student ID is required', 400);
    }

    const result = await regenerateQRForStudent(studentId);

    return successResponse(
      res,
      result,
      'QR code regenerated successfully'
    );
  } catch (error) {
    logger.error('QR regeneration controller error:', error);
    return errorResponse(
      res,
      error.message || 'QR regeneration failed',
      400
    );
  }
};

