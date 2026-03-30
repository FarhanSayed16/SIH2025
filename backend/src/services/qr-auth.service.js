import User from '../models/User.js';
import { generateAccessToken, generateRefreshToken } from './auth.service.js';
import logger from '../config/logger.js';

/**
 * Login user with QR code
 * @param {string} qrCode - QR code string
 * @returns {Object} User object and tokens
 */
export const loginWithQR = async (qrCode) => {
  try {
    // Find user by QR code
    const user = await User.findOne({ qrCode, isActive: true });
    
    if (!user) {
      throw new Error('Invalid QR code');
    }

    // Check if student can use app
    if (user.role === 'student' && !user.canUseApp) {
      throw new Error('Student requires teacher assistance. Please contact your teacher.');
    }

    // Generate tokens
    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token and update last login
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();

    // Remove password from response
    const userObj = user.toJSON();

    logger.info(`QR login successful: ${user.email || user.name} (${user.role})`);

    return {
      user: userObj,
      accessToken,
      refreshToken
    };
  } catch (error) {
    logger.error('QR login error:', error);
    throw error;
  }
};

/**
 * Verify QR code and return student info (without login)
 * Used for teacher scanning student QR badges
 * @param {string} qrCode - QR code string
 * @returns {Object} Student information
 */
export const verifyQRCode = async (qrCode) => {
  try {
    const user = await User.findOne({ qrCode, isActive: true })
      .populate('classId', 'grade section classCode')
      .populate('institutionId', 'name');

    if (!user) {
      throw new Error('Invalid QR code');
    }

    if (user.role !== 'student') {
      throw new Error('QR code is not for a student');
    }

    return {
      studentId: user._id,
      name: user.name,
      grade: user.grade,
      section: user.section,
      classId: user.classId?._id,
      className: user.classId ? `${user.classId.grade}-${user.classId.section}` : null,
      schoolName: user.institutionId?.name,
      accessLevel: user.accessLevel,
      canUseApp: user.canUseApp
    };
  } catch (error) {
    logger.error('QR verification error:', error);
    throw error;
  }
};

