/**
 * Parent QR Code Controller
 * Handles QR code generation and verification for parent-student relationships
 * Phase 2: API Endpoints
 */

import {
  generateParentQRCode,
  verifyQRCode,
  refreshQRCode,
  getQRCodesForStudent,
  getQRCodesForParent,
  getQRCodeDetails
} from '../services/parent-qr-code.service.js';
import { successResponse, errorResponse } from '../utils/response.js';
import logger from '../config/logger.js';

/**
 * Generate QR code for parent-student relationship
 * POST /api/qr/parent/generate
 */
export const generateQR = async (req, res) => {
  try {
    const { parentId, studentId } = req.body;
    const userId = req.userId;

    // Validate required fields
    if (!parentId || !studentId) {
      return errorResponse(res, 'Parent ID and Student ID are required', 400);
    }

    // Verify user is the parent or has permission (admin/teacher)
    const User = (await import('../models/User.js')).default;
    const user = await User.findById(userId);

    if (userId !== parentId) {
      if (!user || (user.role !== 'admin' && user.role !== 'SYSTEM_ADMIN' && user.role !== 'teacher')) {
        return errorResponse(res, 'Unauthorized: Only parents can generate their own QR codes or admins/teachers can generate for parents', 403);
      }
    }

    // Generate QR code
    const qrCode = await generateParentQRCode(parentId, studentId);

    return successResponse(
      res,
      qrCode,
      'QR code generated successfully'
    );
  } catch (error) {
    logger.error('Generate QR code controller error:', error);
    return errorResponse(
      res,
      error.message || 'Failed to generate QR code',
      500
    );
  }
};

/**
 * Verify QR code (when teacher scans it)
 * POST /api/qr/parent/verify
 */
export const verifyQR = async (req, res) => {
  try {
    const { qrCodeData, location } = req.body;
    const scannedBy = req.userId;

    // Validate required fields
    if (!qrCodeData) {
      return errorResponse(res, 'QR code data is required', 400);
    }

    // Verify user is teacher or admin
    const User = (await import('../models/User.js')).default;
    const user = await User.findById(scannedBy);

    if (!user || (user.role !== 'teacher' && user.role !== 'admin' && user.role !== 'SYSTEM_ADMIN')) {
      return errorResponse(res, 'Unauthorized: Only teachers and admins can verify QR codes', 403);
    }

    // Verify QR code
    const verificationResult = await verifyQRCode(qrCodeData, scannedBy, location);

    return successResponse(
      res,
      verificationResult,
      'QR code verified successfully'
    );
  } catch (error) {
    logger.error('Verify QR code controller error:', error);
    return errorResponse(
      res,
      error.message || 'Failed to verify QR code',
      error.message?.includes('Invalid') || error.message?.includes('expired') ? 400 : 500
    );
  }
};

/**
 * Refresh QR code
 * POST /api/qr/parent/:qrCodeId/refresh
 */
export const refreshQR = async (req, res) => {
  try {
    const { qrCodeId } = req.params;
    const userId = req.userId;

    // Verify user has permission (parent, admin, or teacher)
    const User = (await import('../models/User.js')).default;
    const ParentQRCode = (await import('../models/ParentQRCode.js')).default;
    
    const user = await User.findById(userId);
    const qrCode = await ParentQRCode.findById(qrCodeId);

    if (!qrCode) {
      return errorResponse(res, 'QR code not found', 404);
    }

    // Check permissions: parent can refresh own QR codes, admin/teacher can refresh any
    const isAdmin = user.role === 'admin' || user.role === 'SYSTEM_ADMIN';
    const isTeacher = user.role === 'teacher';
    const isParent = user.role === 'parent' && qrCode.parentId.toString() === userId;

    if (!isAdmin && !isTeacher && !isParent) {
      return errorResponse(res, 'Unauthorized: You do not have permission to refresh this QR code', 403);
    }

    // Refresh QR code
    const newQRCode = await refreshQRCode(qrCodeId);

    return successResponse(
      res,
      newQRCode,
      'QR code refreshed successfully'
    );
  } catch (error) {
    logger.error('Refresh QR code controller error:', error);
    return errorResponse(
      res,
      error.message || 'Failed to refresh QR code',
      500
    );
  }
};

/**
 * Get QR codes for a student's parents
 * GET /api/qr/parent/student/:studentId
 */
export const getStudentQRCodes = async (req, res) => {
  try {
    const { studentId } = req.params;
    const userId = req.userId;

    // Verify user has permission
    const User = (await import('../models/User.js')).default;
    const user = await User.findById(userId);
    const student = await User.findById(studentId);

    if (!student || student.role !== 'student') {
      return errorResponse(res, 'Student not found', 404);
    }

    // Check permissions: parent can view QR codes for their children, teacher/admin can view for class students
    let hasPermission = false;

    if (user.role === 'parent') {
      const ParentStudentRelationship = (await import('../models/ParentStudentRelationship.js')).default;
      const relationship = await ParentStudentRelationship.findOne({
        parentId: userId,
        studentId,
        verified: true
      });
      hasPermission = !!relationship;
    } else if (user.role === 'teacher' || user.role === 'admin' || user.role === 'SYSTEM_ADMIN') {
      if (user.role === 'admin' || user.role === 'SYSTEM_ADMIN') {
        hasPermission = true;
      } else if (student.classId) {
        const Class = (await import('../models/Class.js')).default;
        const classData = await Class.findById(student.classId);
        hasPermission = classData && classData.teacherId.toString() === userId;
      }
    }

    if (!hasPermission) {
      return errorResponse(res, 'Unauthorized: You do not have permission to view QR codes for this student', 403);
    }

    // Get QR codes
    const qrCodes = await getQRCodesForStudent(studentId);

    return successResponse(
      res,
      { qrCodes },
      'QR codes retrieved successfully'
    );
  } catch (error) {
    logger.error('Get student QR codes controller error:', error);
    return errorResponse(
      res,
      error.message || 'Failed to retrieve QR codes',
      500
    );
  }
};

/**
 * Get QR codes for a parent's children
 * GET /api/qr/parent/qr-codes
 */
export const getParentQRCodes = async (req, res) => {
  try {
    const parentId = req.userId;

    // Verify user is a parent
    const User = (await import('../models/User.js')).default;
    const user = await User.findById(parentId);

    if (!user || user.role !== 'parent') {
      return errorResponse(res, 'Unauthorized: Only parents can view their QR codes', 403);
    }

    // Get QR codes
    const qrCodes = await getQRCodesForParent(parentId);

    return successResponse(
      res,
      { qrCodes },
      'QR codes retrieved successfully'
    );
  } catch (error) {
    logger.error('Get parent QR codes controller error:', error);
    return errorResponse(
      res,
      error.message || 'Failed to retrieve QR codes',
      500
    );
  }
};

/**
 * Get QR code details by ID
 * GET /api/qr/parent/:qrCodeId
 */
export const getQRCodeDetailsController = async (req, res) => {
  try {
    const { qrCodeId } = req.params;
    const userId = req.userId;

    // Verify user has permission
    const User = (await import('../models/User.js')).default;
    const ParentQRCode = (await import('../models/ParentQRCode.js')).default;
    
    const user = await User.findById(userId);
    const qrCode = await ParentQRCode.findById(qrCodeId);

    if (!qrCode) {
      return errorResponse(res, 'QR code not found', 404);
    }

    // Check permissions: parent can view own QR codes, teacher/admin can view any
    const isAdmin = user.role === 'admin' || user.role === 'SYSTEM_ADMIN';
    const isTeacher = user.role === 'teacher';
    const isParent = user.role === 'parent' && qrCode.parentId.toString() === userId;

    if (!isAdmin && !isTeacher && !isParent) {
      return errorResponse(res, 'Unauthorized: You do not have permission to view this QR code', 403);
    }

    // Get QR code details
    const details = await getQRCodeDetails(qrCodeId);

    return successResponse(
      res,
      details,
      'QR code details retrieved successfully'
    );
  } catch (error) {
    logger.error('Get QR code details controller error:', error);
    return errorResponse(
      res,
      error.message || 'Failed to retrieve QR code details',
      500
    );
  }
};

