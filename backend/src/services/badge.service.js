/**
 * Phase 3.3.3: Badge Service
 * Handles badge awarding logic and badge checking
 */

import Badge from '../models/Badge.js';
import BadgeHistory from '../models/BadgeHistory.js';
import User from '../models/User.js';
import Module from '../models/Module.js';
import GameScore from '../models/GameScore.js';
import QuizResult from '../models/QuizResult.js';
import DrillLog from '../models/DrillLog.js';
import logger from '../config/logger.js';

/**
 * Check and award badges for a user
 * @param {string} userId - User ID
 * @param {string} triggerType - Type of action that triggered check ('module', 'game', 'drill', 'streak', 'score')
 * @param {Object} triggerData - Data related to the trigger
 * @returns {Promise<Array>} Array of newly awarded badge IDs
 */
export const checkAndAwardBadges = async (userId, triggerType = null, triggerData = {}) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Get all active badges
    const badges = await Badge.find({ isActive: true }).lean();

    const newlyAwarded = [];

    for (const badge of badges) {
      // Skip if user already has this badge
      if (user.progress?.badges?.includes(badge.id)) {
        continue;
      }

      // Check if badge matches user's grade level
      if (!badge.gradeLevel.includes('all') && user.grade && !badge.gradeLevel.includes(user.grade)) {
        continue;
      }

      // Check badge criteria
      const meetsCriteria = await checkBadgeCriteria(userId, badge, triggerType, triggerData);

      if (meetsCriteria) {
        // Award badge
        await awardBadge(userId, badge.id, triggerType, triggerData);
        newlyAwarded.push(badge.id);
        logger.info(`Badge awarded: ${badge.id} to user ${userId}`);
      }
    }

    return newlyAwarded;
  } catch (error) {
    logger.error('Check and award badges error:', error);
    return [];
  }
};

/**
 * Check if user meets badge criteria
 */
const checkBadgeCriteria = async (userId, badge, triggerType, triggerData) => {
  const { type, value, moduleCategory, gameType } = badge.criteria;

  try {
    switch (type) {
      case 'module_complete':
        // Badge for completing a specific module or module category
        const user = await User.findById(userId).select('progress');
        if (moduleCategory) {
          // Check if all modules in category are completed
          const modules = await Module.find({ 
            category: moduleCategory, 
            isActive: true 
          }).lean();
          
          const completedModules = user.progress?.completedModules || [];
          const allCompleted = modules.every(module => 
            completedModules.some(id => id.toString() === module._id.toString())
          );
          
          return allCompleted && modules.length > 0;
        } else if (value) {
          // Check if specific module is completed
          const completedModules = user.progress?.completedModules || [];
          return completedModules.some(id => id.toString() === value.toString());
        }
        break;

      case 'module_all':
        // Badge for completing all modules
        const totalModules = await Module.countDocuments({ isActive: true });
        const userModules = await User.findById(userId).select('progress');
        const completedCount = userModules.progress?.completedModules?.length || 0;
        return completedCount >= totalModules && totalModules > 0;

      case 'game_wins':
        // Badge for winning games
        const winCount = parseInt(value) || 1;
        const gameScores = await GameScore.find({ 
          userId,
          gameType: gameType === 'all' ? { $exists: true } : gameType
        });
        
        const wins = gameScores.filter(score => 
          score.maxScore > 0 && score.score >= score.maxScore
        ).length;
        
        return wins >= winCount;

      case 'game_perfect':
        // Badge for perfect game scores
        const perfectGames = await GameScore.find({
          userId,
          gameType: gameType === 'all' ? { $exists: true } : gameType,
          maxScore: { $gt: 0 }
        });
        
        const perfectCount = perfectGames.filter(score => 
          score.score >= score.maxScore
        ).length;
        
        return perfectCount >= (parseInt(value) || 1);

      case 'drill_ack':
        // Badge for acknowledging drills
        const ackCount = parseInt(value) || 1;
        const drillLogs = await DrillLog.countDocuments({ userId });
        return drillLogs >= ackCount;

      case 'drill_speed':
        // Badge for fast drill acknowledgment
        // This would need drill acknowledgment time tracking
        // For now, simplified check
        return false; // Placeholder

      case 'streak_days':
        // Badge for login streaks
        const streakDays = parseInt(value) || 30;
        const userStreak = await User.findById(userId).select('progress.loginStreak');
        return (userStreak.progress?.loginStreak || 0) >= streakDays;

      case 'score_threshold':
        // Badge for reaching preparedness score threshold
        const threshold = parseInt(value) || 80;
        const userScore = await User.findById(userId).select('progress.preparednessScore');
        return (userScore.progress?.preparednessScore || 0) >= threshold;

      default:
        return false;
    }
  } catch (error) {
    logger.error(`Error checking badge criteria for ${badge.id}:`, error);
    return false;
  }

  return false;
};

/**
 * Award badge to user
 * Phase 3.3.3: Enhanced with history tracking
 */
export const awardBadge = async (userId, badgeId, triggerType = 'manual', triggerData = {}) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const badge = await Badge.findOne({ id: badgeId });
    if (!badge) {
      throw new Error('Badge not found');
    }

    // Check if badge was already awarded (check both user progress and history)
    const existingHistory = await BadgeHistory.findOne({ userId, badgeId });
    if (existingHistory) {
      logger.info(`Badge ${badgeId} already awarded to user ${userId}`);
      return false; // Already awarded
    }

    // Add badge if not already present
    if (!user.progress) {
      user.progress = {};
    }
    if (!user.progress.badges) {
      user.progress.badges = [];
    }

    if (!user.progress.badges.includes(badgeId)) {
      user.progress.badges.push(badgeId);
      await user.save();
    }

    // Create badge history record
    await BadgeHistory.create({
      userId,
      badgeId,
      xpEarned: badge.xpReward || 0,
      triggerType,
      triggerData
    });

    // Add XP reward if configured
    // This could trigger score recalculation
    if (badge.xpReward > 0) {
      // XP can be added to user's total XP or used in score calculation
      // Implementation depends on XP system design
    }

    return true;
  } catch (error) {
    // Handle duplicate key error (unique index)
    if (error.code === 11000) {
      logger.info(`Badge ${badgeId} already awarded to user ${userId} (duplicate prevented)`);
      return false;
    }
    logger.error('Award badge error:', error);
    throw error;
  }
};

/**
 * Get all badges for a user
 */
export const getUserBadges = async (userId) => {
  try {
    const user = await User.findById(userId).select('progress.badges');
    const badgeIds = user.progress?.badges || [];

    const badges = await Badge.find({ id: { $in: badgeIds }, isActive: true })
      .sort({ order: 1, createdAt: 1 })
      .lean();

    return badges;
  } catch (error) {
    logger.error('Get user badges error:', error);
    return [];
  }
};

/**
 * Get all available badges
 */
export const getAllBadges = async (gradeLevel = 'all', category = null) => {
  try {
    const query = { isActive: true };
    
    if (gradeLevel !== 'all') {
      query.$or = [
        { gradeLevel: 'all' },
        { gradeLevel: gradeLevel }
      ];
    }

    if (category) {
      query.category = category;
    }

    const badges = await Badge.find(query)
      .sort({ order: 1, category: 1 })
      .lean();

    return badges;
  } catch (error) {
    logger.error('Get all badges error:', error);
    return [];
  }
};

/**
 * Get badge history for a user
 * Phase 3.3.3: Get award history with pagination
 */
export const getBadgeHistory = async (userId, options = {}) => {
  try {
    const {
      page = 1,
      limit = 20,
      badgeId = null
    } = options;

    const query = { userId };
    if (badgeId) {
      query.badgeId = badgeId;
    }

    const skip = (page - 1) * limit;

    const history = await BadgeHistory.find(query)
      .sort({ awardedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Populate badge details
    const badgeIds = [...new Set(history.map(h => h.badgeId))];
    const badges = await Badge.find({ id: { $in: badgeIds } }).lean();
    const badgeMap = new Map(badges.map(b => [b.id, b]));

    const enrichedHistory = history.map(h => ({
      ...h,
      badge: badgeMap.get(h.badgeId) || null
    }));

    const total = await BadgeHistory.countDocuments(query);

    return {
      history: enrichedHistory,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    logger.error('Get badge history error:', error);
    throw error;
  }
};

