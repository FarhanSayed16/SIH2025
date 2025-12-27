/**
 * Phase 3.3.1: Preparedness Score Controller
 * Handles score calculation, retrieval, and history
 */

import { 
  calculatePreparednessScore, 
  recalculateScore,
  getScoreHistory,
  addScoreHistory
} from '../services/preparednessScore.service.js';
import { successResponse, errorResponse } from '../utils/response.js';
import logger from '../config/logger.js';

/**
 * Get preparedness score for user
 * GET /api/scores/preparedness/:userId
 * GET /api/scores/preparedness (for current user)
 */
export const getPreparednessScore = async (req, res) => {
  try {
    const userId = req.params.userId || req.userId || req.user?.id;
    
    if (!userId) {
      return errorResponse(res, 'User ID is required', 400);
    }

    // Check if user is requesting their own score or is admin/teacher
    const requestingUserId = req.userId || req.user?.id;
    if (userId !== requestingUserId && req.user?.role !== 'admin' && req.user?.role !== 'teacher') {
      return errorResponse(res, 'Unauthorized to view this score', 403);
    }

    // Recalculate score to ensure it's up-to-date
    const breakdown = await calculatePreparednessScore(userId);

    return successResponse(res, {
      userId,
      score: breakdown.total,
      breakdown: {
        module: breakdown.module,
        game: breakdown.game,
        quiz: breakdown.quiz,
        drill: breakdown.drill,
        streak: breakdown.streak,
      },
      lastUpdated: breakdown.lastUpdated
    }, 'Preparedness score retrieved successfully');
  } catch (error) {
    logger.error('Get preparedness score error:', error);
    return errorResponse(res, error.message || 'Failed to retrieve preparedness score', 500);
  }
};

/**
 * Recalculate preparedness score
 * POST /api/scores/recalculate/:userId
 * POST /api/scores/recalculate (for current user)
 */
export const recalculatePreparednessScore = async (req, res) => {
  try {
    const userId = req.params.userId || req.userId || req.user?.id;
    
    if (!userId) {
      return errorResponse(res, 'User ID is required', 400);
    }

    const breakdown = await recalculateScore(userId);

    // Add to history
    await addScoreHistory(userId, breakdown.total);

    return successResponse(res, {
      userId,
      score: breakdown.total,
      breakdown: {
        module: breakdown.module,
        game: breakdown.game,
        quiz: breakdown.quiz,
        drill: breakdown.drill,
        streak: breakdown.streak,
      },
      lastUpdated: breakdown.lastUpdated
    }, 'Score recalculated successfully');
  } catch (error) {
    logger.error('Recalculate score error:', error);
    return errorResponse(res, error.message || 'Failed to recalculate score', 500);
  }
};

/**
 * Get score history
 * GET /api/scores/history/:userId
 * GET /api/scores/history (for current user)
 */
export const getScoreHistoryController = async (req, res) => {
  try {
    const userId = req.params.userId || req.userId || req.user?.id;
    const limit = parseInt(req.query.limit) || 30;
    
    if (!userId) {
      return errorResponse(res, 'User ID is required', 400);
    }

    // Check authorization
    const requestingUserId = req.userId || req.user?.id;
    if (userId !== requestingUserId && req.user?.role !== 'admin' && req.user?.role !== 'teacher') {
      return errorResponse(res, 'Unauthorized to view this history', 403);
    }

    const history = await getScoreHistory(userId, limit);

    return successResponse(res, {
      userId,
      history,
      count: history.length
    }, 'Score history retrieved successfully');
  } catch (error) {
    logger.error('Get score history error:', error);
    return errorResponse(res, 'Failed to retrieve score history', 500);
  }
};

