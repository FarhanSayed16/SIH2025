import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import logger from '../config/logger.js';

// CRITICAL: JWT_SECRET must be set in environment variables
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  logger.error('JWT_SECRET environment variable is required');
  throw new Error('JWT_SECRET environment variable is required. Please set it in your .env file.');
}

const JWT_EXPIRE = process.env.JWT_EXPIRE || '15m';
const JWT_REFRESH_EXPIRE = process.env.JWT_REFRESH_EXPIRE || '7d';

/**
 * Generate JWT access token
 */
export const generateAccessToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRE }
  );
};

/**
 * Generate JWT refresh token
 */
export const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId, type: 'refresh' },
    JWT_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRE }
  );
};

/**
 * Verify JWT token
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

/**
 * Register new user
 */
export const registerUser = async (userData) => {
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Phase 3.4.6.1: Create new user with all fields
    const userDataToCreate = {
      email: userData.email,
      password: userData.password, // Will be hashed by pre-save hook
      name: userData.name,
      role: userData.role || 'student',
    };

    // Add institutionId (required for non-admin roles)
    if (userData.institutionId) {
      userDataToCreate.institutionId = userData.institutionId;
    }

    // CRITICAL REFACTOR: Registration via /api/auth/register always creates account_user
    // Any user who goes through public registration provides credentials, so they are account users
    // Grade is purely informational and does NOT influence userType
    
    // Set userType: ALL registrations via this route are account_user
    userDataToCreate.userType = 'account_user';
    
    // Add student-specific fields if provided (grade is just stored, doesn't affect userType)
    if (userData.role === 'student') {
      // PHASE B2: Student registration with OPTIONAL classCode
      // Students can register without classCode and join a class later via /api/student/join-class
      if (userData.classCode && userData.classCode.trim()) {
        // If classCode is provided during registration, link student to class
        const Class = (await import('../models/Class.js')).default;
        const classData = await Class.findOne({ 
          classCode: userData.classCode.trim(),
          isActive: true 
        });
        
        if (!classData) {
          const error = new Error('Invalid class code');
          error.fieldErrors = { classCode: 'Invalid class code. Please check and try again.' };
          throw error;
        }
        
        // Link student to class - set all class-related fields from the class
        userDataToCreate.classId = classData._id;
        userDataToCreate.institutionId = classData.institutionId;
        userDataToCreate.grade = classData.grade;
        userDataToCreate.section = classData.section;
        
        // Students start as registered; class membership approval is separate
        userDataToCreate.approvalStatus = 'registered';
        
        // Store classData for later use (to add student to class's studentIds array)
        userDataToCreate._tempClassData = classData;
      } else {
        // No classCode provided - student can join class later
        // Start as registered; approval is explicit later
        userDataToCreate.approvalStatus = 'registered';
      }
    } else if (userData.role === 'teacher') {
      // Teachers start as registered; admin approves explicitly
      userDataToCreate.approvalStatus = 'registered';
    } else {
      // Admins, parents start as registered; approval can be elevated
      userDataToCreate.approvalStatus = 'registered';
    }

    // Phone is REQUIRED for account_user (all registrations via this route are account_user)
    if (!userData.phone || !userData.phone.trim()) {
      const error = new Error('Phone number is required');
      error.fieldErrors = { phone: 'Phone number is required' };
      throw error;
    }
    // Validate phone format (10-digit Indian number)
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(userData.phone.trim())) {
      const error = new Error('Enter a valid 10-digit Indian phone number');
      error.fieldErrors = { phone: 'Enter a valid 10-digit Indian phone number' };
      throw error;
    }
    // Only add phone if it's provided and valid (don't set to null)
    userDataToCreate.phone = userData.phone.trim();

    // Parent Monitoring System: Set parentProfile for parent role
    if (userData.role === 'parent') {
      userDataToCreate.parentProfile = {
        phoneNumber: userData.phone.trim(),
        relationship: userData.relationship || 'other',
        emergencyContact: true,
        verified: false // Will be verified by admin/teacher later
      };
    }

    // Create new user
    const user = await User.create(userDataToCreate);

    // PHASE 2: Create ClassroomJoinRequest if student registered with classCode
    if (userData.role === 'student' && userDataToCreate._tempClassData) {
      const classData = userDataToCreate._tempClassData;
      
      // Create ClassroomJoinRequest for class membership tracking
      const ClassroomJoinRequest = (await import('../models/ClassroomJoinRequest.js')).default;
      await ClassroomJoinRequest.create({
        studentId: user._id,
        classId: classData._id,
        teacherId: classData.teacherId,
        qrCode: `REG-${classData.classCode}-${Date.now()}`, // Generate unique code
        joinMethod: 'classCode',
        status: 'pending', // Needs teacher approval
        studentInfo: {
          name: user.name,
          email: user.email,
          phone: user.phone
        }
      });
      
      // Add student to class's studentIds array
      await classData.addStudent(user._id);
      logger.info(`Student ${user.email} registered with class ${classData.classCode} (pending approval)`);
      // Clean up temp data
      delete userDataToCreate._tempClassData;
    }

    // Generate tokens
    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token to user
    user.refreshToken = refreshToken;
    await user.save();

    // Remove password from response
    const userObj = user.toJSON();

    logger.info(`User registered: ${user.email} (${user.role})${userData.role === 'student' ? ` in class ${userDataToCreate.classId}` : ''}`);

    return {
      user: userObj,
      accessToken,
      refreshToken
    };
  } catch (error) {
    logger.error('Registration error:', error);
    throw error;
  }
};

/**
 * Login user
 * IMPORTANT: This function ONLY finds existing users, never creates new ones
 */
export const loginUser = async (email, password) => {
  try {
    // Validate inputs are provided (should be caught by route validation, but double-check)
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    // Find user with password (select: false by default)
    // This ONLY queries existing users - never creates new User documents
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }

    // Fix for old users: Set userType if missing (backward compatibility)
    // CRITICAL REFACTOR: Use credential-based logic, not grade-based
    if (!user.userType) {
      // If user has email and password, they should be account_user
      const hasCredentials = !!(user.email && user.password);
      if (hasCredentials) {
        user.userType = 'account_user';
      } else {
        // No credentials = roster_record (likely created by admin)
        user.userType = 'roster_record';
      }
      // Save the updated userType
      await user.save();
    }

    // CRITICAL REFACTOR: Only account_user can login
    // Roster records are blocked from login (they don't have credentials)
    if (user.userType === 'roster_record') {
      throw new Error('Roster records cannot login. Please register or contact your school admin.');
    }

    // PHASE 1 FIX: Remove approval block from login
    // Students can log in immediately after registration
    // Only block explicitly blocked accounts or roster records
    if (user.approvalStatus === 'blocked') {
      throw new Error('Your account has been blocked. Please contact your administrator.');
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
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

    logger.info(`User logged in: ${user.email} (${user.role})`);

    return {
      user: userObj,
      accessToken,
      refreshToken
    };
  } catch (error) {
    logger.error('Login error:', error);
    throw error;
  }
};

/**
 * Refresh access token
 */
export const refreshAccessToken = async (refreshToken) => {
  try {
    // Verify refresh token
    const decoded = verifyToken(refreshToken);
    
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    // Find user with this refresh token
    const user = await User.findById(decoded.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Check if refresh token matches
    if (user.refreshToken !== refreshToken) {
      throw new Error('Invalid refresh token');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }

    // PHASE 1 FIX: Remove approval block from token refresh
    // Only block explicitly blocked accounts
    if (user.approvalStatus === 'blocked') {
      throw new Error('Your account has been blocked. Please contact your administrator.');
    }

    // Generate new access token
    const accessToken = generateAccessToken(user._id, user.role);

    logger.info(`Token refreshed for user: ${user.email}`);

    return {
      accessToken,
      user: user.toJSON()
    };
  } catch (error) {
    logger.error('Token refresh error:', error);
    throw error;
  }
};

/**
 * Logout user (invalidate refresh token)
 */
export const logoutUser = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (user) {
      user.refreshToken = null;
      await user.save();
      logger.info(`User logged out: ${user.email}`);
    }
    return true;
  } catch (error) {
    logger.error('Logout error:', error);
    throw error;
  }
};

/**
 * Get user by ID
 * @param {string} userId - User ID
 * @param {boolean} populateInstitution - Whether to populate institution data
 */
export const getUserById = async (userId, populateInstitution = false) => {
  try {
    // CRITICAL FIX: Explicitly select role and other essential fields
    // Use .select() with field names to ensure they're included
    // Don't use +role syntax as role is not excluded by default
    let query = User.findById(userId);
    
    // For teachers, always populate institutionId to ensure access checks work
    if (populateInstitution) {
      query = query.populate('institutionId', 'name address location');
    } else {
      // Still populate institutionId as ObjectId reference for access checks
      query = query.populate('institutionId', '_id name');
    }
    
    // Execute query - role should be included by default (it's not excluded in schema)
    const user = await query;
    
    if (!user) {
      throw new Error('User not found');
    }

    // CRITICAL: Verify role is present and log if missing
    if (!user.role) {
      logger.error(`[getUserById] WARNING: User ${userId} has no role field! User object keys: ${Object.keys(user.toObject ? user.toObject() : user).join(', ')}`);
    } else {
      logger.debug(`[getUserById] User ${userId} role: ${user.role}`);
    }

    // Return user object (not toJSON) so middleware can access all fields
    // The toJSON will be called by the response handler if needed
    return user;
  } catch (error) {
    logger.error('Get user error:', error);
    throw error;
  }
};

/**
 * Forgot password - Generate reset token
 * @param {string} email - User email
 * @returns {Promise<{message: string}>}
 */
export const forgotPassword = async (email) => {
  try {
    // Find user by email
    const user = await User.findOne({ email });
    
    // For security, always return success message even if user doesn't exist
    // This prevents email enumeration attacks
    if (!user) {
      logger.warn(`Password reset requested for non-existent email: ${email}`);
      return {
        message: 'If this email is registered, a password reset link has been sent.'
      };
    }

    // Check if user is an account user (roster records can't reset password)
    if (user.userType === 'roster_record') {
      logger.warn(`Password reset requested for roster record: ${email}`);
      return {
        message: 'If this email is registered, a password reset link has been sent.'
      };
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Hash token for storage (optional but recommended)
    // For now, store plain token (can be hashed later if needed)
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    // Set token and expiry (30 minutes from now)
    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    await user.save();

    // Send email with reset link
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/reset-password?token=${resetToken}`;
    
    // Import email service dynamically
    const { sendEmail } = await import('./email.service.js');
    
    // Prepare email content
    const emailSubject = 'Password Reset Request - Kavach';
    const emailText = `
Hello,

You have requested to reset your password for your Kavach account.

Click the link below to reset your password:
${resetUrl}

This link will expire in 30 minutes.

If you did not request this password reset, please ignore this email.

Stay safe,
The Kavach Team
    `.trim();
    
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #10b981; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
    .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px; }
    .button { display: inline-block; background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
    .warning { color: #ef4444; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🛡️ Kavach</h1>
      <h2>Password Reset Request</h2>
    </div>
    <div class="content">
      <p>Hello,</p>
      <p>You have requested to reset your password for your Kavach account.</p>
      <p>Click the button below to reset your password:</p>
      <div style="text-align: center;">
        <a href="${resetUrl}" class="button">Reset Password</a>
      </div>
      <p>Or copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #6b7280; font-size: 12px;">${resetUrl}</p>
      <p class="warning">⚠️ This link will expire in 30 minutes.</p>
      <p>If you did not request this password reset, please ignore this email. Your password will remain unchanged.</p>
      <p>Stay safe,<br>The Kavach Team</p>
    </div>
    <div class="footer">
      <p>This is an automated message. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
    `.trim();
    
    // Try to send email
    try {
      const emailResult = await sendEmail(user.email, emailSubject, emailText, emailHtml);
      
      if (emailResult.success) {
        logger.info(`✅ Password reset email sent successfully to ${email}`);
      } else {
        // Email failed, but still log the link for development
        logger.warn(`⚠️ Failed to send password reset email to ${email}: ${emailResult.error}`);
        logger.info(`Password reset link for ${email}: ${resetUrl}`);
        console.log('\n🔐 PASSWORD RESET LINK (Email failed, logged for development):');
        console.log('='.repeat(60));
        console.log(`Email: ${email}`);
        console.log(`Reset URL: ${resetUrl}`);
        console.log(`Token: ${resetToken}`);
        console.log('='.repeat(60));
        console.log('⚠️  This link expires in 30 minutes\n');
      }
    } catch (emailError) {
      // Email service error, but still log the link
      logger.error(`❌ Error sending password reset email: ${emailError.message}`);
      logger.info(`Password reset link for ${email}: ${resetUrl}`);
      console.log('\n🔐 PASSWORD RESET LINK (Email error, logged for development):');
      console.log('='.repeat(60));
      console.log(`Email: ${email}`);
      console.log(`Reset URL: ${resetUrl}`);
      console.log(`Token: ${resetToken}`);
      console.log('='.repeat(60));
      console.log('⚠️  This link expires in 30 minutes\n');
    }

    return {
      message: 'If this email is registered, a password reset link has been sent.'
    };
  } catch (error) {
    logger.error('Forgot password error:', error);
    // Still return generic success message for security
    return {
      message: 'If this email is registered, a password reset link has been sent.'
    };
  }
};

/**
 * Reset password using token
 * @param {string} token - Reset token
 * @param {string} password - New password
 * @returns {Promise<{message: string}>}
 */
export const resetPassword = async (token, password) => {
  try {
    if (!token || !password) {
      throw new Error('Token and password are required');
    }

    // Hash the provided token to compare with stored hash
    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid token and not expired
    const user = await User.findOne({
      resetPasswordToken: resetTokenHash,
      resetPasswordExpires: { $gt: new Date() } // Token not expired
    });

    if (!user) {
      throw new Error('Invalid or expired token');
    }

    // Check if user is an account user
    if (user.userType === 'roster_record') {
      throw new Error('Roster records cannot reset password');
    }

    // Validate password strength (min 6 characters as per schema)
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    // Set new password (will be hashed by pre-save hook)
    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    logger.info(`Password reset successful for user: ${user.email}`);

    return {
      message: 'Password has been reset successfully. You can now log in.'
    };
  } catch (error) {
    logger.error('Reset password error:', error);
    throw error;
  }
};

