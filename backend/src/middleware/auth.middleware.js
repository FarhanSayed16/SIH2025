import { verifyToken, getUserById } from '../services/auth.service.js';
import { errorResponse } from '../utils/response.js';
import logger from '../config/logger.js';

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
export const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 'No token provided', 401);
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = verifyToken(token);

    // Check if it's a refresh token (should not be used for auth)
    if (decoded.type === 'refresh') {
      return errorResponse(res, 'Invalid token type', 401);
    }

    // Get user - always populate institutionId for proper access checks
    const user = await getUserById(decoded.userId, true);
    
    if (!user) {
      logger.warn(`[authenticate] User not found: ${decoded.userId}`);
      return errorResponse(res, 'User not found', 401);
    }
    
    // Convert to plain object for middleware access
    // Ensure all fields are accessible including approvalStatus and institutionId
    const userObj = user.toObject ? user.toObject() : user;
    
    // CRITICAL FIX: Ensure role is explicitly set from database
    // If role is missing from userObj, log error and use JWT role as fallback
    if (!userObj.role) {
      logger.error(`[authenticate] CRITICAL: User ${decoded.userId} has no role in DB! JWT role: ${decoded.role}, userObj keys: ${Object.keys(userObj).join(', ')}`);
      // Fallback to JWT role but this should never happen
      userObj.role = decoded.role;
    }
    
    // Debug logging with more detail
    logger.info(`[authenticate] User ${decoded.userId}: role from DB=${userObj.role}, role from JWT=${decoded.role}, approvalStatus=${userObj.approvalStatus || 'undefined'}, institutionId=${userObj.institutionId || 'undefined'}`);
    
    // Attach user to request
    req.user = userObj;
    req.userId = decoded.userId;
    req.userRole = decoded.role; // Keep JWT role, but DB role takes precedence in requireRole

    next();
  } catch (error) {
    logger.warn(`Authentication failed: ${error.message}`);
    return errorResponse(res, 'Invalid or expired token', 401);
  }
};

/**
 * Optional authentication middleware
 * Attaches user if token is present, but doesn't fail if missing
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const decoded = verifyToken(token);
        
        if (decoded && decoded.type !== 'refresh') {
          const user = await getUserById(decoded.userId);
          if (user) {
            req.user = user;
            req.userId = decoded.userId;
            req.userRole = decoded.role;
          }
        }
      } catch (tokenError) {
        // Invalid token - silently continue without authentication
        logger.debug(`Optional auth token invalid: ${tokenError.message}`);
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication on any error
    logger.debug(`Optional auth error: ${error.message}`);
    next();
  }
};

