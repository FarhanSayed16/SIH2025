/**
 * Student Controller
 * Handles student-specific API requests
 */

import { joinClassByCode, joinClassByCodeOrId, leaveClass } from '../services/student.service.js';
import { successResponse, errorResponse } from '../utils/response.js';
import logger from '../config/logger.js';

/**
 * Join a class using classCode OR classId
 * POST /api/student/join-class
 * Body: { classCode: "..." } OR { classId: "..." }
 */
export const joinClass = async (req, res) => {
  try {
    const { classCode, classId } = req.body;
    const studentId = req.userId;

    // Validate: must have either classCode or classId
    if (!classCode && !classId) {
      return errorResponse(res, 'Class code or class ID is required', 400);
    }

    // Validate classCode if provided
    if (classCode && !classCode.trim()) {
      return errorResponse(res, 'Class code cannot be empty', 400);
    }

    // Validate classId if provided
    if (classId && !classId.trim()) {
      return errorResponse(res, 'Class ID cannot be empty', 400);
    }

    const student = await joinClassByCodeOrId(studentId, classCode, classId);

    return successResponse(
      res,
      { user: student },
      'Join request sent to your class teacher for approval. You will be notified once approved.',
      200
    );
  } catch (error) {
    logger.error('Join class controller error:', error);
    return errorResponse(
      res,
      error.message || 'Failed to join class',
      error.message?.includes('already') ? 400 : 
      error.message?.includes('not found') ? 404 : 400
    );
  }
};

/**
 * Leave current class
 * POST /api/student/leave-class
 */
export const leaveClassController = async (req, res) => {
  try {
    const studentId = req.userId;

    const student = await leaveClass(studentId);

    return successResponse(
      res,
      { user: student },
      'You have successfully left the class.',
      200
    );
  } catch (error) {
    logger.error('Leave class controller error:', error);
    return errorResponse(
      res,
      error.message || 'Failed to leave class',
      error.message?.includes('not found') ? 404 : 400
    );
  }
};

