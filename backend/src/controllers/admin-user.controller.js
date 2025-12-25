/**
 * Admin User Creation Controller
 * Phase 2: Handles admin creation of teachers, students, and parents
 */

import {
  createTeacher,
  createStudent,
  createParent
} from '../services/admin-user.service.js';
import { successResponse, errorResponse } from '../utils/response.js';
import logger from '../config/logger.js';

/**
 * Create a teacher
 * POST /api/admin/users/teacher
 */
export const createTeacherController = async (req, res) => {
  try {
    const adminId = req.userId || req.user._id;
    const teacherData = req.body;

    const teacher = await createTeacher(adminId, teacherData);

    return successResponse(
      res,
      { user: teacher },
      'Teacher created successfully',
      201
    );
  } catch (error) {
    logger.error('Create teacher controller error:', error);

    // Handle specific error types
    if (error.message.includes('already exists')) {
      return errorResponse(res, error.message, 400);
    }
    if (error.message.includes('required')) {
      return errorResponse(res, error.message, 400);
    }
    if (error.message.includes('Password must be')) {
      return errorResponse(res, error.message, 400);
    }

    return errorResponse(
      res,
      error.message || 'Failed to create teacher',
      400
    );
  }
};

/**
 * Create a student (roster record)
 * POST /api/admin/users/student
 */
export const createStudentController = async (req, res) => {
  try {
    const adminId = req.userId || req.user._id;
    const studentData = req.body;

    const student = await createStudent(adminId, studentData);

    return successResponse(
      res,
      { user: student },
      'Student created successfully',
      201
    );
  } catch (error) {
    logger.error('Create student controller error:', error);

    // Handle specific error types
    if (error.message.includes('already exists')) {
      return errorResponse(res, error.message, 400);
    }
    if (error.message.includes('required')) {
      return errorResponse(res, error.message, 400);
    }
    if (error.message.includes('Invalid grade')) {
      return errorResponse(res, error.message, 400);
    }

    return errorResponse(
      res,
      error.message || 'Failed to create student',
      400
    );
  }
};

/**
 * Create a parent
 * POST /api/admin/users/parent
 */
export const createParentController = async (req, res) => {
  try {
    const adminId = req.userId || req.user._id;
    const parentData = req.body;

    const parent = await createParent(adminId, parentData);

    return successResponse(
      res,
      { user: parent },
      'Parent created successfully',
      201
    );
  } catch (error) {
    logger.error('Create parent controller error:', error);

    // Handle specific error types
    if (error.message.includes('already exists')) {
      return errorResponse(res, error.message, 400);
    }
    if (error.message.includes('required')) {
      return errorResponse(res, error.message, 400);
    }
    if (error.message.includes('Password must be')) {
      return errorResponse(res, error.message, 400);
    }

    return errorResponse(
      res,
      error.message || 'Failed to create parent',
      400
    );
  }
};

