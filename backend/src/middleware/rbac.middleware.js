import { errorResponse } from '../utils/response.js';
import logger from '../config/logger.js';

/**
 * Role-Based Access Control middleware
 * Restricts routes based on user roles
 * Checks both req.userRole (from JWT) and req.user.role (from DB) for reliability
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    // Check if user is authenticated
    if (!req.user) {
      logger.warn(`[requireRole] No user found on ${req.method} ${req.path}`);
      return errorResponse(res, 'Authentication required', 401);
    }

    // Flatten array if first argument is an array (handles both requireRole(['teacher', 'admin']) and requireRole('teacher', 'admin'))
    let rolesToCheck = allowedRoles;
    if (allowedRoles.length === 1 && Array.isArray(allowedRoles[0])) {
      rolesToCheck = allowedRoles[0];
    }

    // Normalize roles (trim, lowercase) for comparison
    const normalizedAllowedRoles = rolesToCheck.map(r => String(r).toLowerCase().trim());
    
    // CRITICAL FIX: Always prefer database role (req.user.role) over JWT role
    // JWT role might be stale if user was recently approved or role was changed
    // If DB role is not available, log warning and try JWT role as fallback
    let userRole = req.user.role;
    
    // Normalize user role
    if (userRole) {
      userRole = String(userRole).toLowerCase().trim();
    }
    
    // If DB role is missing, try JWT role but log a warning
    if (!userRole && req.userRole) {
      logger.warn(`[requireRole] DB role missing for user ${req.userId}, using JWT role: ${req.userRole}`);
      userRole = String(req.userRole).toLowerCase().trim();
    }
    
    // Log role mismatch for debugging
    if (req.user.role && req.userRole && req.user.role.toLowerCase() !== req.userRole.toLowerCase()) {
      logger.warn(`[requireRole] Role mismatch for user ${req.userId}: DB=${req.user.role}, JWT=${req.userRole}`);
    }

    // Debug logging with more detail
    logger.info(`[requireRole] User ${req.userId}: role=${userRole || 'undefined'}, allowedRoles=[${normalizedAllowedRoles.join(', ')}], path=${req.path}`);

    if (!userRole) {
      logger.error(`[requireRole] User role not found for user ${req.userId || req.user._id} on ${req.path}. JWT role: ${req.userRole}, DB role: ${req.user.role}, user object keys: ${req.user ? Object.keys(req.user).join(', ') : 'none'}`);
      return res.status(403).json({
        success: false,
        message: 'User role not found. Please log out and log back in.',
        code: 'ROLE_NOT_FOUND',
        debug: {
          jwtRole: req.userRole,
          dbRole: req.user.role,
          userId: req.userId,
          userKeys: req.user ? Object.keys(req.user) : []
        }
      });
    }

    // Check if user role is allowed (case-insensitive comparison)
    if (!normalizedAllowedRoles.includes(userRole)) {
      logger.warn(`[requireRole] Access denied: role '${userRole}' not in [${normalizedAllowedRoles.join(', ')}]`);
      // Return more detailed error for debugging
      return res.status(403).json({
        success: false,
        message: `Insufficient permissions. Your role '${userRole}' is not allowed. Required: ${normalizedAllowedRoles.join(' or ')}`,
        code: 'INSUFFICIENT_PERMISSIONS',
        debug: {
          userRole: userRole,
          jwtRole: req.userRole,
          dbRole: req.user?.role,
          allowedRoles: normalizedAllowedRoles,
          userId: req.userId,
          path: req.path
        }
      });
    }

    logger.debug(`[requireRole] Access granted for role '${userRole}' to ${req.method} ${req.path}`);
    next();
  };
};

/**
 * Require admin role (admin or SYSTEM_ADMIN)
 */
export const requireAdmin = requireRole('admin', 'SYSTEM_ADMIN');

/**
 * Require SYSTEM_ADMIN role (highest level)
 */
export const requireSuperAdmin = requireRole('SYSTEM_ADMIN');

/**
 * Require teacher or admin
 */
export const requireTeacher = requireRole('teacher', 'admin');

/**
 * Require teacher access (approved + has institution)
 * Teachers must be approved and have an institutionId to access teacher routes
 */
export const requireTeacherAccess = async (req, res, next) => {
  if (!req.user) {
    logger.warn(`[requireTeacherAccess] No user found on ${req.method} ${req.path}`);
    return errorResponse(res, 'Authentication required', 401);
  }

  // Normalize role (trim, lowercase)
  const userRole = (req.userRole || req.user.role || '').toLowerCase().trim();
  
  logger.debug(`[requireTeacherAccess] User ${req.userId}: role=${userRole}, path=${req.path}`);

  // CRITICAL: Admins bypass ALL teacher checks - check FIRST before any teacher checks
  if (userRole === 'admin' || userRole === 'system_admin') {
    logger.debug(`[requireTeacherAccess] Admin ${req.userId} bypassing teacher checks`);
    return next();
  }

  // Only apply to teachers
  if (userRole === 'teacher') {
    // CRITICAL: Fetch fresh user data from DB to ensure we have latest approvalStatus and institutionId
    // This prevents issues where admin approves teacher but teacher's token still has old data
    const User = (await import('../models/User.js')).default;
    const freshUser = await User.findById(req.userId)
      .populate('institutionId', '_id name')
      .select('approvalStatus institutionId isActive role email');
    
    if (!freshUser) {
      logger.error(`[requireTeacherAccess] User ${req.userId} not found in database`);
      return errorResponse(res, 'User not found', 404);
    }

    logger.debug(`[requireTeacherAccess] Fresh user data: approvalStatus=${freshUser.approvalStatus}, institutionId=${freshUser.institutionId ? (typeof freshUser.institutionId === 'object' ? freshUser.institutionId._id : freshUser.institutionId) : 'null'}, isActive=${freshUser.isActive}`);

    // PHASE 2: Specific error codes for better frontend handling
    // Check if teacher is approved
    if (freshUser.approvalStatus !== 'approved') {
      logger.warn(`[requireTeacherAccess] Teacher ${req.userId} (${freshUser.email || 'unknown'}) access denied: approvalStatus=${freshUser.approvalStatus}`);
      return res.status(403).json({
        success: false,
        code: 'TEACHER_NOT_APPROVED',
        message: 'Your account is pending approval. Please contact your administrator.'
      });
    }

    // Check if teacher has an institution (handle both ObjectId and populated object)
    const hasInstitution = freshUser.institutionId && (
      typeof freshUser.institutionId === 'object' ? freshUser.institutionId._id : freshUser.institutionId
    );
    
    if (!hasInstitution) {
      logger.warn(`[requireTeacherAccess] Teacher ${req.userId} (${freshUser.email || 'unknown'}) access denied: no institutionId`);
      return res.status(403).json({
        success: false,
        code: 'TEACHER_NO_INSTITUTION',
        message: 'You must be assigned to a school/institution by an admin.'
      });
    }

    // Check if teacher is active (undefined/null should be treated as active)
    if (freshUser.isActive === false) {
      logger.warn(`[requireTeacherAccess] Teacher ${req.userId} (${freshUser.email || 'unknown'}) access denied: isActive=false`);
      return res.status(403).json({
        success: false,
        code: 'TEACHER_DEACTIVATED',
        message: 'Your account has been deactivated. Please contact your administrator.',
        debug: {
          userId: req.userId,
          isActive: freshUser.isActive
        }
      });
    }

    // Update req.user with fresh data for downstream handlers
    req.user = {
      ...req.user,
      approvalStatus: freshUser.approvalStatus,
      institutionId: freshUser.institutionId,
      isActive: freshUser.isActive !== false // Treat undefined as true
    };
    
    logger.info(`[requireTeacherAccess] Teacher ${req.userId} access granted: approved=${freshUser.approvalStatus}, hasInstitution=${!!hasInstitution}, active=${freshUser.isActive !== false}`);
  } else {
    logger.debug(`[requireTeacherAccess] User ${req.userId} is not a teacher (role=${userRole}), allowing access`);
  }

  // Other roles (students, parents, etc.) pass through
  next();
};

/**
 * Require student, teacher, or admin
 */
export const requireUser = requireRole('student', 'teacher', 'admin', 'parent');

/**
 * Check if user owns resource or is admin
 */
export const requireOwnershipOrAdmin = (userIdParam = 'id') => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'Authentication required', 401);
    }

    // Get role from JWT or user object
    const userRole = req.userRole || req.user.role;

    // Admin and SYSTEM_ADMIN can access anything
    if (userRole === 'admin' || userRole === 'SYSTEM_ADMIN') {
      return next();
    }

    // Check if user owns the resource
    const resourceUserId = req.params[userIdParam];
    if (req.userId.toString() !== resourceUserId.toString()) {
      return errorResponse(res, 'Access denied', 403);
    }

    next();
  };
};

/**
 * Check if user belongs to same institution or is admin
 */
export const requireSameInstitution = (req, res, next) => {
  if (!req.user) {
    return errorResponse(res, 'Authentication required', 401);
  }

  // Get role from JWT or user object
  const userRole = req.userRole || req.user.role;

  // Admin and SYSTEM_ADMIN can access anything
  if (userRole === 'admin' || userRole === 'SYSTEM_ADMIN') {
    return next();
  }

  // For now, allow if user has institutionId
  // This can be enhanced to check specific institution matches
  if (!req.user.institutionId) {
    return errorResponse(res, 'User must belong to an institution', 403);
  }

  next();
};

/**
 * RBAC Refinement: Allow teachers/admins to update student approval status
 * Also allows users to update their own profile
 */
export const requireOwnershipOrTeacherAdmin = (userIdParam = 'id') => {
  return async (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'Authentication required', 401);
    }

    // Get role from JWT or user object
    const userRole = req.userRole || req.user.role;

    // Admin and SYSTEM_ADMIN can access anything
    if (userRole === 'admin' || userRole === 'SYSTEM_ADMIN') {
      return next();
    }

    // Check if user owns the resource
    const resourceUserId = req.params[userIdParam];
    if (req.userId.toString() === resourceUserId.toString()) {
      return next();
    }

    // Teachers can update student approval status if student belongs to their institution
    if (userRole === 'teacher') {
      const User = (await import('../models/User.js')).default;
      const targetUser = await User.findById(resourceUserId).select('role institutionId approvalStatus');
      
      if (!targetUser) {
        return errorResponse(res, 'User not found', 404);
      }

      // Only allow updating student approval status
      if (targetUser.role === 'student' && 
          targetUser.institutionId?.toString() === req.user.institutionId?.toString() &&
          req.body.approvalStatus) {
        return next();
      }
    }

    return errorResponse(res, 'Access denied', 403);
  };
};

