/**
 * Phase 3.2: Game Controller
 * Handles game score submissions and game item retrieval
 */

import GameScore from '../models/GameScore.js';
import GameItem from '../models/GameItem.js';
import Hazard from '../models/Hazard.js';
import { successResponse, errorResponse } from '../utils/response.js';
import logger from '../config/logger.js';
import GroupActivity from '../models/GroupActivity.js';

/**
 * Submit game score
 * POST /api/games/scores
 */
export const submitScore = async (req, res) => {
  try {
    const {
      gameType,
      score,
      maxScore = 0,
      level = 1,
      difficulty = 'easy',
      gameData = {},
      itemsCorrect = 0,
      itemsIncorrect = 0,
      timeTaken = null,
      isGroupMode = false,
      groupActivityId = null,
      studentIds = [] // For group mode: list of student IDs
    } = req.body;

    const userId = req.userId || req.user?.id;

    if (!gameType) {
      return errorResponse(res, 'Game type is required', 400);
    }

    if (score === undefined || score === null) {
      return errorResponse(res, 'Score is required', 400);
    }

    if (!userId && !isGroupMode) {
      return errorResponse(res, 'User ID is required for individual games', 400);
    }

    if (isGroupMode && (!groupActivityId && studentIds.length === 0)) {
      return errorResponse(res, 'Group activity ID or student IDs required for group mode', 400);
    }

    // Get institutionId from user or request body
    let institutionId = req.user?.institutionId || req.body.institutionId;
    
    // If still no institutionId but we have userId, try to get from user profile
    if (!institutionId && userId) {
      try {
        const User = (await import('../models/User.js')).default;
        const user = await User.findById(userId).select('institutionId');
        if (user && user.institutionId) {
          institutionId = user.institutionId;
        }
      } catch (userError) {
        logger.warn('Could not fetch user institution:', userError);
      }
    }
    
    if (!institutionId) {
      return errorResponse(res, 'Institution ID is required. Please provide in request body or ensure user has institution assigned.', 400);
    }

    // Create game score record
    const gameScoreData = {
      userId: userId || null,
      institutionId,
      gameType,
      score,
      maxScore,
      level,
      difficulty,
      gameData,
      itemsCorrect,
      itemsIncorrect,
      timeTaken,
      isGroupMode,
      groupActivityId: groupActivityId || null
    };

    const gameScore = new GameScore(gameScoreData);
    
    // Calculate XP
    gameScore.calculateXP();

    // If group mode, update group activity
    if (isGroupMode && groupActivityId) {
      try {
        const groupActivity = await GroupActivity.findById(groupActivityId);
        if (groupActivity) {
          // Update participant scores
          if (studentIds.length > 0) {
            for (const studentId of studentIds) {
              await groupActivity.updateParticipantScore(
                studentId,
                score,
                true // completed
              );
            }
          }
          await groupActivity.calculateResults();
        }
      } catch (groupError) {
        logger.warn('Failed to update group activity:', groupError);
        // Continue anyway - game score is still saved
      }
    }

    await gameScore.save();

    // Phase 3.3.1: Trigger preparedness score update (non-blocking)
    if (userId && !isGroupMode) {
      // For individual scores, update user's preparedness score in background
      const { recalculateScore } = await import('../services/preparednessScore.service.js');
      recalculateScore(userId).catch(err => {
        logger.warn('Failed to update preparedness score after game:', err);
      });

      // Phase 3.3.3: Check and award badges (non-blocking)
      const { checkAndAwardBadges } = await import('../services/badge.service.js');
      checkAndAwardBadges(userId, 'game', {
        gameType,
        score,
        maxScore,
        level,
        isPerfect: maxScore > 0 && score >= maxScore
      }).catch(err => {
        logger.warn('Failed to check badges after game completion:', err);
      });
    } else if (isGroupMode && studentIds.length > 0) {
      // For group mode, update each student's score
      const { recalculateScore } = await import('../services/preparednessScore.service.js');
      studentIds.forEach(studentId => {
        recalculateScore(studentId).catch(err => {
          logger.warn(`Failed to update preparedness score for student ${studentId}:`, err);
        });
      });
    }

    logger.info(`Game score submitted: ${gameType}, Score: ${score}, User: ${userId || 'Group'}`);

    return successResponse(res, {
      gameScore: {
        id: gameScore._id,
        score: gameScore.score,
        xpEarned: gameScore.xpEarned,
        completedAt: gameScore.completedAt
      }
    }, 'Game score submitted successfully');
  } catch (error) {
    logger.error('Submit game score error:', error);
    return errorResponse(res, error.message || 'Failed to submit game score', 500);
  }
};

/**
 * Get game scores for user
 * GET /api/games/scores
 */
export const getScores = async (req, res) => {
  try {
    const userId = req.userId || req.user?.id;
    const { gameType, limit = 10, groupActivityId } = req.query;

    const query = {};

    if (userId) {
      query.userId = userId;
    }

    if (gameType) {
      query.gameType = gameType;
    }

    if (groupActivityId) {
      query.groupActivityId = groupActivityId;
    }

    const scores = await GameScore.find(query)
      .sort({ completedAt: -1 })
      .limit(parseInt(limit))
      .populate('userId', 'name email')
      .lean();

    return successResponse(res, { scores }, 'Game scores retrieved successfully');
  } catch (error) {
    logger.error('Get game scores error:', error);
    return errorResponse(res, 'Failed to retrieve game scores', 500);
  }
};

/**
 * Get game items
 * GET /api/games/items
 */
export const getGameItems = async (req, res) => {
  try {
    const { gameType = 'bag-packer', category, gradeLevel } = req.query;

    const query = {
      gameType: { $in: [gameType, 'all'] },
      isActive: true
    };

    if (category) {
      query.category = category;
    }

    const items = await GameItem.find(query)
      .sort({ order: 1, createdAt: 1 })
      .lean();

    // Filter by grade level if provided
    let filteredItems = items;
    if (gradeLevel) {
      filteredItems = items.filter(item => 
        item.gradeLevel.includes('all') || item.gradeLevel.includes(gradeLevel)
      );
    }

    return successResponse(res, { items: filteredItems }, 'Game items retrieved successfully');
  } catch (error) {
    logger.error('Get game items error:', error);
    return errorResponse(res, 'Failed to retrieve game items', 500);
  }
};

/**
 * Get leaderboard for a game
 * GET /api/games/leaderboard/:gameType
 */
export const getLeaderboard = async (req, res) => {
  try {
    const { gameType } = req.params;
    const { limit = 20, institutionId, difficulty, level } = req.query;

    const query = { gameType };

    if (institutionId) {
      query.institutionId = institutionId;
    }

    if (difficulty) {
      query.difficulty = difficulty;
    }

    if (level) {
      query.level = parseInt(level);
    }

    const leaderboard = await GameScore.find(query)
      .sort({ score: -1, timeTaken: 1 }) // Highest score, fastest time
      .limit(parseInt(limit))
      .populate('userId', 'name email')
      .populate('institutionId', 'name')
      .lean();

    return successResponse(res, { leaderboard }, 'Leaderboard retrieved successfully');
  } catch (error) {
    logger.error('Get leaderboard error:', error);
    return errorResponse(res, 'Failed to retrieve leaderboard', 500);
  }
};

/**
 * Get hazards for Hazard Hunter game
 * GET /api/games/hazards
 * Phase 3.2.2: Hazard Hunter
 */
export const getHazards = async (req, res) => {
  try {
    const { level, difficulty, gradeLevel } = req.query;

    const query = { isActive: true };

    if (level) {
      query.level = parseInt(level);
    }

    if (difficulty) {
      query.difficulty = difficulty;
    }

    // Get hazards from database
    const hazards = await Hazard.find(query)
      .sort({ level: 1, difficulty: 1, createdAt: 1 })
      .lean();

    // Filter by grade level if provided
    let filteredHazards = hazards;
    if (gradeLevel) {
      filteredHazards = hazards.filter(hazard => 
        hazard.gradeLevel.includes('all') || hazard.gradeLevel.includes(gradeLevel)
      );
    }

    // Group hazards by level for response
    const hazardsByLevel = {};
    filteredHazards.forEach(hazard => {
      const levelKey = hazard.level || 1;
      if (!hazardsByLevel[levelKey]) {
        hazardsByLevel[levelKey] = [];
      }
      hazardsByLevel[levelKey].push(hazard);
    });

    return successResponse(res, { 
      hazards: filteredHazards,
      hazardsByLevel,
      total: filteredHazards.length
    }, 'Hazards retrieved successfully');
  } catch (error) {
    logger.error('Get hazards error:', error);
    return errorResponse(res, 'Failed to retrieve hazards', 500);
  }
};

/**
 * Verify hazard tap (check if user tapped on correct location)
 * POST /api/games/verify-hazard
 * Phase 3.2.2: Hazard Hunter
 */
export const verifyHazardTap = async (req, res) => {
  try {
    const { hazardId, tapX, tapY, imageId } = req.body;

    if (!hazardId || tapX === undefined || tapY === undefined) {
      return errorResponse(res, 'Hazard ID, tap X, and tap Y are required', 400);
    }

    const hazard = await Hazard.findById(hazardId);

    if (!hazard) {
      return errorResponse(res, 'Hazard not found', 404);
    }

    if (!hazard.isActive) {
      return errorResponse(res, 'Hazard is not active', 400);
    }

    // Check if tap is within hazard location bounds (with tolerance)
    const location = hazard.location;
    const tolerance = 5; // 5% tolerance

    const isCorrect = 
      tapX >= (location.x - tolerance) && 
      tapX <= (location.x + location.width + tolerance) &&
      tapY >= (location.y - tolerance) && 
      tapY <= (location.y + location.height + tolerance);

    return successResponse(res, {
      isCorrect,
      hazard: {
        id: hazard._id,
        name: hazard.name,
        type: hazard.type,
        description: hazard.description,
        points: isCorrect ? hazard.points : -hazard.penaltyPoints,
      },
      correctLocation: {
        x: location.x,
        y: location.y,
        width: location.width,
        height: location.height,
      },
      tapLocation: {
        x: tapX,
        y: tapY,
      }
    }, isCorrect ? 'Correct hazard found!' : 'Tap was not on a hazard');
  } catch (error) {
    logger.error('Verify hazard tap error:', error);
    return errorResponse(res, 'Failed to verify hazard tap', 500);
  }
};

