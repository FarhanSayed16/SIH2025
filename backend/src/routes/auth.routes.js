import express from 'express';
import { body } from 'express-validator';
import {
  register,
  login,
  refresh,
  logout,
  getProfile,
  forgotPasswordController,
  resetPasswordController
} from '../controllers/auth.controller.js';
import { qrLogin } from '../controllers/qr-auth.controller.js';
import { deviceLogin } from '../controllers/device-auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validator.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { successResponse } from '../utils/response.js';

const router = express.Router();

// Validation rules
const registerValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters'),
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Enter a valid 10-digit Indian phone number'),
  body('role')
    .optional()
    .isIn(['student', 'teacher', 'admin', 'parent'])
    .withMessage('Invalid role'),
  body('institutionId')
    .optional()
    .isMongoId()
    .withMessage('Invalid institution ID'),
  // Phase 3.4.6.1: Student-specific fields
  body('grade')
    .optional()
    .isIn(['KG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'])
    .withMessage('Invalid grade'),
  body('section')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Section cannot be empty'),
  body('classId')
    .optional()
    .isMongoId()
    .withMessage('Invalid class ID'),
  // PHASE B2.5: ClassCode validation for student registration
  // NOTE: classCode is OPTIONAL during registration - students can join class later
  body('classCode')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Class code cannot be empty if provided')
];

const loginValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 1 })
    .withMessage('Password cannot be empty')
];

const forgotPasswordValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
];

const resetPasswordValidation = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
];

// Routes
router.post(
  '/register',
  authLimiter,
  registerValidation,
  validate,
  register
);

router.post(
  '/login',
  authLimiter,
  loginValidation,
  validate,
  login
);

router.post(
  '/refresh',
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required'),
  validate,
  refresh
);

router.post(
  '/logout',
  authenticate,
  logout
);

router.get(
  '/profile',
  authenticate,
  getProfile
);

// Phase 2.5: Multi-Access Authentication Routes
router.post(
  '/qr-login',
  authLimiter,
  body('qrCode')
    .notEmpty()
    .withMessage('QR code is required'),
  validate,
  qrLogin
);

router.post(
  '/device-login',
  authLimiter,
  body('deviceToken')
    .notEmpty()
    .withMessage('Device token is required'),
  validate,
  deviceLogin
);

// Teacher class selection (requires authentication)
router.post(
  '/select-class',
  authenticate,
  body('classId')
    .isMongoId()
    .withMessage('Valid class ID is required'),
  validate,
  async (req, res) => {
    // This will be implemented in teacher controller
    // For now, just return success
    return successResponse(res, { classId: req.body.classId }, 'Class selected successfully');
  }
);

// Password reset routes
router.post(
  '/forgot-password',
  authLimiter,
  forgotPasswordValidation,
  validate,
  forgotPasswordController
);

router.post(
  '/reset-password',
  authLimiter,
  resetPasswordValidation,
  validate,
  resetPasswordController
);

export default router;

