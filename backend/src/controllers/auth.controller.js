import {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  getUserById,
  forgotPassword,
  resetPassword
} from '../services/auth.service.js';
import { successResponse, errorResponse } from '../utils/response.js';
import logger from '../config/logger.js';

/**
 * Register new user
 * POST /api/auth/register
 */
export const register = async (req, res) => {
  try {
    // Phase 3.4.6.1: Accept all registration fields
    const { email, password, name, role, phone, institutionId, grade, section, classId } = req.body;

    const result = await registerUser({
      email,
      password,
      name,
      role,
      phone,
      institutionId,
      grade,
      section,
      classId
    });

    return successResponse(
      res,
      result,
      'User registered successfully',
      201
    );
  } catch (error) {
    logger.error('Register controller error:', error);
    
    // If error has fieldErrors, include them in response
    if (error.fieldErrors) {
      return errorResponse(
        res,
        error.message || 'Registration failed',
        400,
        error.fieldErrors
      );
    }
    
    return errorResponse(
      res,
      error.message || 'Registration failed',
      400
    );
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await loginUser(email, password);

    return successResponse(
      res,
      result,
      'Login successful'
    );
  } catch (error) {
    logger.error('Login controller error:', error);
    return errorResponse(
      res,
      error.message || 'Login failed',
      401
    );
  }
};

/**
 * Refresh access token
 * POST /api/auth/refresh
 */
export const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return errorResponse(res, 'Refresh token is required', 400);
    }

    const result = await refreshAccessToken(refreshToken);

    return successResponse(
      res,
      result,
      'Token refreshed successfully'
    );
  } catch (error) {
    logger.error('Refresh controller error:', error);
    return errorResponse(
      res,
      error.message || 'Token refresh failed',
      401
    );
  }
};

/**
 * Logout user
 * POST /api/auth/logout
 */
export const logout = async (req, res) => {
  try {
    await logoutUser(req.userId);

    return successResponse(
      res,
      null,
      'Logout successful'
    );
  } catch (error) {
    logger.error('Logout controller error:', error);
    return errorResponse(
      res,
      'Logout failed',
      500
    );
  }
};

/**
 * Get user profile
 * GET /api/auth/profile
 */
export const getProfile = async (req, res) => {
  try {
    const user = await getUserById(req.userId, true); // Populate institution

    return successResponse(
      res,
      { user },
      'Profile retrieved successfully'
    );
  } catch (error) {
    logger.error('Get profile controller error:', error);
    return errorResponse(
      res,
      error.message || 'Failed to get profile',
      404
    );
  }
};

/**
 * Forgot password - Request password reset
 * POST /api/auth/forgot-password
 */
export const forgotPasswordController = async (req, res) => {
  try {
    const { email } = req.body;

    const result = await forgotPassword(email);

    return successResponse(
      res,
      result,
      result.message
    );
  } catch (error) {
    logger.error('Forgot password controller error:', error);
    // Still return success message for security (don't reveal if email exists)
    return successResponse(
      res,
      { message: 'If this email is registered, a password reset link has been sent.' },
      'If this email is registered, a password reset link has been sent.'
    );
  }
};

/**
 * Reset password using token
 * POST /api/auth/reset-password
 */
export const resetPasswordController = async (req, res) => {
  try {
    const { token, password } = req.body;

    const result = await resetPassword(token, password);

    return successResponse(
      res,
      result,
      result.message
    );
  } catch (error) {
    logger.error('Reset password controller error:', error);
    return errorResponse(
      res,
      error.message || 'Password reset failed',
      400
    );
  }
};

