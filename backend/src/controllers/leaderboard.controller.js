/**
 * Phase 3.3.5: Enhanced Leaderboard Controller
 * Supports multiple leaderboard types with Redis caching
 */

import {
  getPreparednessLeaderboard,
  getQuizLeaderboard,
  getGameLeaderboard,
  getBadgeLeaderboard,
  getClassLeaderboard,
  getSquadWarsLeaderboard,
  updateUserScore,
  refreshLeaderboardCache,
} from '../services/leaderboard.service.js';
import { successResponse, errorResponse } from '../utils/response.js';
import logger from '../config/logger.js';

/**
 * Get main leaderboard
 * GET /api/leaderboard
 */
export const getLeaderboard = async (req, res) => {
  try {
    const { schoolId, type = 'overall', limit = 50 } = req.query;

    const institutionId = schoolId || req.user?.institutionId;

    if (!institutionId) {
      return errorResponse(res, 'School ID is required', 400);
    }

    let leaderboard = [];
    let leaderboardData = {};

    switch (type) {
      case 'overall':
      case 'preparedness':
        leaderboard = await getPreparednessLeaderboard(
          institutionId,
          parseInt(limit)
        );
        leaderboardData = {
          leaderboard,
          type: 'preparedness',
          institutionId,
          count: leaderboard.length,
        };
        break;

      case 'quizzes':
        leaderboard = await getQuizLeaderboard(
          institutionId,
          parseInt(limit)
        );
        leaderboardData = {
          leaderboard,
          type: 'quizzes',
          institutionId,
          count: leaderboard.length,
        };
        break;

      case 'games':
        const { gameType } = req.query;
        if (!gameType) {
          return errorResponse(
            res,
            'Game type is required for games leaderboard',
            400
          );
        }
        try {
          leaderboard = await getGameLeaderboard(
            gameType,
            institutionId,
            parseInt(limit)
          );
        } catch (error) {
          logger.warn(`Game leaderboard error: ${error.message}`);
          leaderboard = []; // Return empty if error (e.g., no game scores)
        }
        leaderboardData = {
          leaderboard,
          type: 'games',
          gameType,
          institutionId,
          count: leaderboard.length,
        };
        break;

      case 'badges':
        try {
          leaderboard = await getBadgeLeaderboard(
            institutionId,
            parseInt(limit)
          );
        } catch (error) {
          logger.warn(`Badge leaderboard error: ${error.message}`);
          leaderboard = []; // Return empty if error (e.g., no badges)
        }
        leaderboardData = {
          leaderboard,
          type: 'badges',
          institutionId,
          count: leaderboard.length,
        };
        break;

      case 'class':
        // Import service function with alias to avoid conflict
        const { getClassLeaderboard: getClassLeaderboardService } = await import('../services/leaderboard.service.js');
        leaderboard = await getClassLeaderboardService(
          institutionId,
          parseInt(limit)
        );
        leaderboardData = {
          leaderboard,
          type: 'class',
          institutionId,
          count: leaderboard.length,
        };
        break;

      case 'drills':
        // Keep existing drill logic
        const DrillLog = (await import('../models/DrillLog.js')).default;
        const drillStats = await DrillLog.aggregate([
          {
            $match: {
              institutionId: institutionId,
            },
          },
          {
            $group: {
              _id: '$userId',
              avgTime: { $avg: '$evacuationTime' },
              bestTime: { $min: '$evacuationTime' },
              totalDrills: { $sum: 1 },
            },
          },
          {
            $sort: { avgTime: 1 },
          },
          {
            $limit: parseInt(limit),
          },
          {
            $lookup: {
              from: 'users',
              localField: '_id',
              foreignField: '_id',
              as: 'user',
            },
          },
          {
            $unwind: '$user',
          },
          {
            $project: {
              userId: '$_id',
              name: '$user.name',
              email: '$user.email',
              avgTime: { $round: ['$avgTime', 2] },
              bestTime: '$bestTime',
              totalDrills: '$totalDrills',
            },
          },
        ]);

        leaderboard = drillStats.map((stat, index) => ({
          rank: index + 1,
          ...stat,
        }));
        leaderboardData = {
          leaderboard,
          type: 'drills',
          institutionId,
          count: leaderboard.length,
        };
        break;

      default:
        return errorResponse(res, 'Invalid leaderboard type', 400);
    }

    logger.info(
      `Leaderboard retrieved: ${type} for institution ${institutionId}`
    );

    return successResponse(
      res,
      leaderboardData,
      'Leaderboard retrieved successfully'
    );
  } catch (error) {
    logger.error('Get leaderboard error:', error);
    return errorResponse(res, 'Failed to get leaderboard', 500);
  }
};

/**
 * Get Squad Wars leaderboard
 * GET /api/leaderboard/squad-wars
 */
export const getSquadWars = async (req, res) => {
  try {
    const { schoolId, limit = 20 } = req.query;

    const institutionId = schoolId || req.user?.institutionId;

    if (!institutionId) {
      return errorResponse(res, 'School ID is required', 400);
    }

    let leaderboard = [];
    try {
      leaderboard = await getSquadWarsLeaderboard(
        institutionId,
        parseInt(limit)
      );
    } catch (error) {
      logger.warn(`Squad Wars leaderboard error: ${error.message}`);
      leaderboard = []; // Return empty if error
    }

    return successResponse(
      res,
      {
        leaderboard,
        type: 'squad-wars',
        institutionId,
        count: leaderboard.length,
      },
      'Squad Wars leaderboard retrieved successfully'
    );
  } catch (error) {
    logger.error('Get Squad Wars leaderboard error:', error);
    return errorResponse(res, 'Failed to get Squad Wars leaderboard', 500);
  }
};

/**
 * Get class-specific leaderboard
 * GET /api/leaderboard/class/:classId
 */
export const getClassLeaderboardById = async (req, res) => {
  try {
    const { classId } = req.params;
    const { limit = 50 } = req.query;

    const Class = (await import('../models/Class.js')).default;
    const User = (await import('../models/User.js')).default;
    
    let classData;
    try {
      classData = await Class.findById(classId);
    } catch (error) {
      return errorResponse(res, 'Invalid class ID format', 400);
    }

    if (!classData) {
      return errorResponse(res, 'Class not found', 404);
    }

    // Get students in this class
    let students = [];
    try {
      students = await User.find({
        classId,
        role: 'student',
        isActive: true,
      })
        .select('name email progress.preparednessScore')
        .sort({ 'progress.preparednessScore': -1 })
        .limit(parseInt(limit))
        .lean();
    } catch (error) {
      logger.warn(`Error fetching students for class ${classId}: ${error.message}`);
      students = [];
    }

    const leaderboard = students.map((student, index) => ({
      rank: index + 1,
      userId: student._id,
      name: student.name,
      email: student.email,
      score: student.progress?.preparednessScore || 0,
    }));

    return successResponse(
      res,
      {
        leaderboard,
        classId,
        className: `${classData.grade || 'Unknown'}-${classData.section || 'Unknown'}`,
        count: leaderboard.length,
      },
      'Class leaderboard retrieved successfully'
    );
  } catch (error) {
    logger.error('Get class leaderboard error:', error);
    return errorResponse(res, 'Failed to get class leaderboard', 500);
  }
};

/**
 * Refresh leaderboard cache
 * POST /api/leaderboard/refresh
 */
export const refreshLeaderboard = async (req, res) => {
  try {
    const { type = 'preparedness', schoolId } = req.body;

    const institutionId = schoolId || req.user?.institutionId;

    if (!institutionId) {
      return errorResponse(res, 'School ID is required', 400);
    }

    const refreshed = await refreshLeaderboardCache(type, institutionId);

    if (refreshed) {
      return successResponse(
        res,
        { type, institutionId },
        'Leaderboard cache refreshed successfully'
      );
    } else {
      return successResponse(
        res,
        { type, institutionId },
        'Leaderboard cache refresh skipped (Redis not available)',
        200
      );
    }
  } catch (error) {
    logger.error('Refresh leaderboard error:', error);
    return errorResponse(res, 'Failed to refresh leaderboard', 500);
  }
};
