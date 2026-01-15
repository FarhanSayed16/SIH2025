/**
 * Verify Relationship Middleware
 * Ensures parent is linked to student before allowing access
 */

// Dynamic import to avoid circular dependencies
let ParentStudentRelationship;
import { errorResponse } from '../utils/response.js';
import logger from '../config/logger.js';

/**
 * Middleware to verify parent-student relationship
 * Must be used after authenticate and requireRole('parent') middleware
 */
export const verifyRelationship = async (req, res, next) => {
  try {
    const parentId = req.user.userId || req.userId;
    const studentId = req.params.studentId;

    if (!studentId) {
      return errorResponse(res, 'Student ID is required', 400);
    }

    // Dynamic import to avoid circular dependencies
    if (!ParentStudentRelationship) {
      const module = await import('../models/ParentStudentRelationship.js');
      ParentStudentRelationship = module.default;
    }

    // Check if relationship exists and is verified
    const isVerified = await ParentStudentRelationship.isVerified(parentId, studentId);

    if (!isVerified) {
      logger.warn(`Unauthorized access attempt: Parent ${parentId} tried to access student ${studentId}`);
      return errorResponse(
        res,
        'Unauthorized: You are not linked to this student or the relationship is not verified',
        403
      );
    }

    // Relationship verified, proceed
    next();
  } catch (error) {
    logger.error('Verify relationship middleware error:', error);
    return errorResponse(res, 'Error verifying relationship', 500);
  }
};

