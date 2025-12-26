/**
 * Phase 3.3.3: Badge Controller
 * Handles badge-related API endpoints
 */

import { successResponse, errorResponse, paginatedResponse } from '../utils/response.js';
import logger from '../config/logger.js';
import {
  getAllBadges,
  getUserBadges,
  getBadgeHistory,
  awardBadge,
  checkAndAwardBadges
} from '../services/badge.service.js';
import Badge from '../models/Badge.js';
import User from '../models/User.js';

/**
 * Get all available badges
 * GET /api/badges
 */
export const listBadges = async (req, res) => {
  try {
    const { category, gradeLevel = 'all' } = req.query;

    const badges = await getAllBadges(gradeLevel, category);

    return successResponse(res, { badges }, 'Badges retrieved successfully');
  } catch (error) {
    logger.error('List badges error:', error);
    return errorResponse(res, error.message || 'Failed to retrieve badges', 500);
  }
};

/**
 * Get specific badge details
 * GET /api/badges/:badgeId
 */
export const getBadgeById = async (req, res) => {
  try {
    const { badgeId } = req.params;

    const badge = await Badge.findOne({ id: badgeId, isActive: true }).lean();
    
    if (!badge) {
      return errorResponse(res, 'Badge not found', 404);
    }

    return successResponse(res, { badge }, 'Badge retrieved successfully');
  } catch (error) {
    logger.error('Get badge by ID error:', error);
    return errorResponse(res, error.message || 'Failed to retrieve badge', 500);
  }
};

/**
 * Get current user's badges
 * GET /api/badges/my-badges
 */
export const getMyBadges = async (req, res) => {
  try {
    const userId = req.userId || req.user?.id;

    if (!userId) {
      return errorResponse(res, 'User ID required', 401);
    }

    const badges = await getUserBadges(userId);

    return successResponse(res, { badges }, 'User badges retrieved successfully');
  } catch (error) {
    logger.error('Get my badges error:', error);
    return errorResponse(res, error.message || 'Failed to retrieve user badges', 500);
  }
};

/**
 * Get badge award history for current user
 * GET /api/badges/my-badges/history
 */
export const getMyBadgeHistory = async (req, res) => {
  try {
    const userId = req.userId || req.user?.id;

    if (!userId) {
      return errorResponse(res, 'User ID required', 401);
    }

    const { page = 1, limit = 20, badgeId } = req.query;

    const result = await getBadgeHistory(userId, {
      page: parseInt(page),
      limit: parseInt(limit),
      badgeId: badgeId || null
    });

    return paginatedResponse(res, result.history, result.pagination, 'Badge history retrieved successfully');
  } catch (error) {
    logger.error('Get badge history error:', error);
    return errorResponse(res, error.message || 'Failed to retrieve badge history', 500);
  }
};

/**
 * Manually award badge (admin/teacher only)
 * POST /api/badges/:badgeId/award
 */
export const manualAwardBadge = async (req, res) => {
  try {
    const { badgeId } = req.params;
    const { userId: targetUserId } = req.body;
    const currentUserId = req.userId || req.user?.id;

    // Check if current user is admin or teacher
    const currentUser = await User.findById(currentUserId).select('role');
    if (!currentUser || !['admin', 'teacher'].includes(currentUser.role)) {
      return errorResponse(res, 'Unauthorized: Only admins and teachers can award badges', 403);
    }

    const userId = targetUserId || currentUserId;

    // Check if badge exists
    const badge = await Badge.findOne({ id: badgeId, isActive: true });
    if (!badge) {
      return errorResponse(res, 'Badge not found', 404);
    }

    // Award badge
    const awarded = await awardBadge(userId, badgeId, 'manual', {
      awardedBy: currentUserId
    });

    if (!awarded) {
      return errorResponse(res, 'Badge already awarded to this user', 400);
    }

    logger.info(`Badge ${badgeId} manually awarded to user ${userId} by ${currentUserId}`);

    return successResponse(res, {
      badgeId,
      userId,
      awarded: true
    }, 'Badge awarded successfully');
  } catch (error) {
    logger.error('Manual award badge error:', error);
    return errorResponse(res, error.message || 'Failed to award badge', 500);
  }
};

/**
 * Check and award badges (trigger badge checking)
 * POST /api/badges/check
 */
export const checkBadges = async (req, res) => {
  try {
    const userId = req.userId || req.user?.id;
    const { triggerType, triggerData } = req.body;

    if (!userId) {
      return errorResponse(res, 'User ID required', 401);
    }

    // Check and award badges
    const newlyAwarded = await checkAndAwardBadges(userId, triggerType || null, triggerData || {});

    return successResponse(res, {
      newlyAwarded,
      count: newlyAwarded.length
    }, 'Badge check completed');
  } catch (error) {
    logger.error('Check badges error:', error);
    return errorResponse(res, error.message || 'Failed to check badges', 500);
  }
};

