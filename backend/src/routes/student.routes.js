/**
 * Student Routes
 * Handles student-specific endpoints
 */

import express from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validator.js';
import { joinClass, leaveClassController } from '../controllers/student.controller.js';

const router = express.Router();

// All student routes require authentication
router.use(authenticate);

// Verify user is a student
router.use((req, res, next) => {
  if (req.userRole !== 'student') {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Student role required'
    });
  }
  next();
});

/**
 * Join a class using classCode OR classId
 * POST /api/student/join-class
 * Body: { classCode: "..." } OR { classId: "..." }
 */
router.post(
  '/join-class',
  [
    body('classCode')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Class code cannot be empty'),
    body('classId')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Class ID cannot be empty')
      .isMongoId()
      .withMessage('Class ID must be a valid MongoDB ObjectId'),
  ],
  validate,
  joinClass
);

/**
 * Leave current class
 * POST /api/student/leave-class
 */
router.post(
  '/leave-class',
  leaveClassController
);

export default router;

