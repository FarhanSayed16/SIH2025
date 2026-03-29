/**
 * Phase 3.5.6: Content & Game Analytics Service
 * Enhanced analytics for content and game performance tracking
 */

import mongoose from 'mongoose';
import EventLog from '../models/EventLog.js';
import GameScore from '../models/GameScore.js';
import QuizResult from '../models/QuizResult.js';
import Module from '../models/Module.js';
import DrillLog from '../models/DrillLog.js';
import User from '../models/User.js';
import logger from '../config/logger.js';

/**
 * Get game attempt analytics
 * @param {string} institutionId - Institution ID
 * @param {string} gameType - Game type (optional)
 * @param {Object} dateRange - Date range {start: Date, end: Date}
 * @returns {Promise<Object>} Game attempt analytics
 */
export const getGameAttemptAnalytics = async (institutionId, gameType = null, dateRange = null) => {
  try {
    const matchQuery = {
      institutionId: new mongoose.Types.ObjectId(institutionId)
    };

    if (gameType) {
      matchQuery.gameType = gameType;
    }

    if (dateRange) {
      matchQuery.completedAt = {
        $gte: new Date(dateRange.start),
        $lte: new Date(dateRange.end)
      };
    }

    // Aggregate game attempts
    const attempts = await GameScore.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$gameType',
          totalAttempts: { $sum: 1 },
          uniquePlayers: { $addToSet: '$userId' },
          avgAttemptsPerPlayer: { $avg: 1 }
        }
      },
      {
        $project: {
          gameType: '$_id',
          totalAttempts: 1,
          uniquePlayers: { $size: '$uniquePlayers' },
          avgAttemptsPerPlayer: { $round: ['$avgAttemptsPerPlayer', 2] }
        }
      }
    ]);

    // Get attempts over time
    const attemptsOverTime = await GameScore.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: {
            gameType: '$gameType',
            date: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } }
          },
          attempts: { $sum: 1 }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    return {
      byGameType: attempts,
      overTime: attemptsOverTime.map(item => ({
        gameType: item._id.gameType,
        date: item._id.date,
        attempts: item.attempts
      }))
    };
  } catch (error) {
    logger.error('Get game attempt analytics error:', error);
    throw error;
  }
};

/**
 * Get module completion rate analytics
 * @param {string} institutionId - Institution ID
 * @param {Object} dateRange - Date range {start: Date, end: Date}
 * @returns {Promise<Object>} Module completion analytics
 */
export const getModuleCompletionRateAnalytics = async (institutionId, dateRange = null) => {
  try {
    const matchQuery = {
      institutionId: new mongoose.Types.ObjectId(institutionId)
    };

    if (dateRange) {
      matchQuery.completedAt = {
        $gte: new Date(dateRange.start),
        $lte: new Date(dateRange.end)
      };
    }

    // Get all users in institution
    const totalUsers = await User.countDocuments({
      institutionId: new mongoose.Types.ObjectId(institutionId),
      role: 'student'
    });

    // Get module views and completions from event log
    const moduleStats = await EventLog.aggregate([
      {
        $match: {
          institutionId: new mongoose.Types.ObjectId(institutionId),
          entityType: 'module',
          eventType: { $in: ['module_view', 'module_complete'] }
        }
      },
      {
        $group: {
          _id: {
            moduleId: '$entityId',
            eventType: '$eventType'
          },
          count: { $sum: 1 },
          uniqueUsers: { $addToSet: '$userId' }
        }
      }
    ]);

    // Process stats
    const moduleMap = new Map();

    moduleStats.forEach(stat => {
      const moduleId = stat._id.moduleId.toString();
      const eventType = stat._id.eventType;

      if (!moduleMap.has(moduleId)) {
        moduleMap.set(moduleId, {
          moduleId,
          views: 0,
          completions: 0,
          uniqueViewers: 0,
          uniqueCompleters: 0
        });
      }

      const module = moduleMap.get(moduleId);
      if (eventType === 'module_view') {
        module.views = stat.count;
        module.uniqueViewers = stat.uniqueUsers.length;
      } else if (eventType === 'module_complete') {
        module.completions = stat.count;
        module.uniqueCompleters = stat.uniqueUsers.length;
      }
    });

    // Calculate completion rates
    const completionRates = Array.from(moduleMap.values()).map(module => {
      const completionRate = totalUsers > 0
        ? (module.uniqueCompleters / totalUsers) * 100
        : 0;

      return {
        ...module,
        completionRate: Math.round(completionRate * 100) / 100
      };
    });

    return {
      totalUsers,
      modules: completionRates,
      overallCompletionRate: completionRates.length > 0
        ? Math.round(
            (completionRates.reduce((sum, m) => sum + m.completionRate, 0) / completionRates.length) * 100
          ) / 100
        : 0
    };
  } catch (error) {
    logger.error('Get module completion rate analytics error:', error);
    throw error;
  }
};

/**
 * Get quiz accuracy analytics
 * @param {string} institutionId - Institution ID
 * @param {string} moduleId - Module ID (optional)
 * @param {Object} dateRange - Date range {start: Date, end: Date}
 * @returns {Promise<Object>} Quiz accuracy analytics
 */
export const getQuizAccuracyAnalytics = async (institutionId, moduleId = null, dateRange = null) => {
  try {
    const matchQuery = {
      institutionId: new mongoose.Types.ObjectId(institutionId)
    };

    if (moduleId) {
      matchQuery.moduleId = new mongoose.Types.ObjectId(moduleId);
    }

    if (dateRange) {
      matchQuery.completedAt = {
        $gte: new Date(dateRange.start),
        $lte: new Date(dateRange.end)
      };
    }

    // Aggregate quiz results
    const quizStats = await QuizResult.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$moduleId',
          totalAttempts: { $sum: 1 },
          avgAccuracy: { $avg: '$score' },
          minAccuracy: { $min: '$score' },
          maxAccuracy: { $max: '$score' },
          passedCount: {
            $sum: { $cond: ['$passed', 1, 0] }
          },
          totalTime: { $avg: '$timeTaken' }
        }
      },
      {
        $project: {
          moduleId: '$_id',
          totalAttempts: 1,
          avgAccuracy: { $round: ['$avgAccuracy', 2] },
          minAccuracy: 1,
          maxAccuracy: 1,
          passRate: {
            $round: [
              { $multiply: [{ $divide: ['$passedCount', '$totalAttempts'] }, 100] },
              2
            ]
          },
          avgTimeTaken: { $round: ['$totalTime', 2] }
        }
      }
    ]);

    // Get accuracy over time
    const accuracyOverTime = await QuizResult.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } }
          },
          avgAccuracy: { $avg: '$score' },
          attempts: { $sum: 1 }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    return {
      byModule: quizStats,
      overTime: accuracyOverTime.map(item => ({
        date: item._id.date,
        avgAccuracy: Math.round(item.avgAccuracy * 100) / 100,
        attempts: item.attempts
      }))
    };
  } catch (error) {
    logger.error('Get quiz accuracy analytics error:', error);
    throw error;
  }
};

/**
 * Get drill participation time analytics
 * @param {string} institutionId - Institution ID
 * @param {Object} dateRange - Date range {start: Date, end: Date}
 * @returns {Promise<Object>} Drill participation analytics
 */
export const getDrillParticipationAnalytics = async (institutionId, dateRange = null) => {
  try {
    const matchQuery = {
      institutionId: new mongoose.Types.ObjectId(institutionId)
    };

    if (dateRange) {
      matchQuery.completedAt = {
        $gte: new Date(dateRange.start),
        $lte: new Date(dateRange.end)
      };
    }

    // Aggregate drill participation
    const participation = await DrillLog.aggregate([
      { $match: matchQuery },
      {
        $lookup: {
          from: 'drills',
          localField: 'drillId',
          foreignField: '_id',
          as: 'drill'
        }
      },
      {
        $unwind: {
          path: '$drill',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $group: {
          _id: '$drillId',
          totalParticipants: { $sum: 1 },
          avgEvacuationTime: { $avg: '$evacuationTime' },
          avgScore: { $avg: '$score' },
          minEvacuationTime: { $min: '$evacuationTime' },
          maxEvacuationTime: { $max: '$evacuationTime' },
          drillName: { $first: '$drill.name' }
        }
      },
      {
        $project: {
          drillId: '$_id',
          drillName: 1,
          totalParticipants: 1,
          avgEvacuationTimeSeconds: { $round: ['$avgEvacuationTime', 2] },
          avgScore: { $round: [{ $ifNull: ['$avgScore', 0] }, 2] },
          minEvacuationTimeSeconds: { $round: [{ $ifNull: ['$minEvacuationTime', 0] }, 2] },
          maxEvacuationTimeSeconds: { $round: [{ $ifNull: ['$maxEvacuationTime', 0] }, 2] }
        }
      }
    ]);

    return {
      drills: participation,
      totalParticipation: participation.reduce((sum, d) => sum + d.totalParticipants, 0),
      avgEvacuationTime: participation.length > 0
        ? Math.round(
            (participation.reduce((sum, d) => sum + (d.avgEvacuationTimeSeconds || 0), 0) / participation.length) * 100
          ) / 100
        : 0
    };
  } catch (error) {
    logger.error('Get drill participation analytics error:', error);
    throw error;
  }
};

/**
 * Get hazard recognition accuracy analytics
 * @param {string} institutionId - Institution ID
 * @param {Object} dateRange - Date range {start: Date, end: Date}
 * @returns {Promise<Object>} Hazard recognition analytics
 */
export const getHazardRecognitionAnalytics = async (institutionId, dateRange = null) => {
  try {
    const matchQuery = {
      institutionId: new mongoose.Types.ObjectId(institutionId),
      gameType: 'hazard-hunter'
    };

    if (dateRange) {
      matchQuery.completedAt = {
        $gte: new Date(dateRange.start),
        $lte: new Date(dateRange.end)
      };
    }

    // Get hazard recognition data from game scores
    const hazardStats = await GameScore.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalGames: { $sum: 1 },
          totalCorrect: { $sum: '$itemsCorrect' },
          totalIncorrect: { $sum: '$itemsIncorrect' },
          avgAccuracy: {
            $avg: {
              $cond: [
                { $gt: [{ $add: ['$itemsCorrect', '$itemsIncorrect'] }, 0] },
                {
                  $multiply: [
                    {
                      $divide: [
                        '$itemsCorrect',
                        { $add: ['$itemsCorrect', '$itemsIncorrect'] }
                      ]
                    },
                    100
                  ]
                },
                0
              ]
            }
          }
        }
      },
      {
        $project: {
          totalGames: 1,
          totalCorrect: 1,
          totalIncorrect: 1,
          totalIdentified: { $add: ['$totalCorrect', '$totalIncorrect'] },
          accuracyRate: { $round: ['$avgAccuracy', 2] }
        }
      }
    ]);

    return hazardStats[0] || {
      totalGames: 0,
      totalCorrect: 0,
      totalIncorrect: 0,
      totalIdentified: 0,
      accuracyRate: 0
    };
  } catch (error) {
    logger.error('Get hazard recognition analytics error:', error);
    throw error;
  }
};

/**
 * Get streak analytics
 * @param {string} institutionId - Institution ID
 * @param {string} streakType - Streak type (module, game, quiz, drill, login)
 * @returns {Promise<Object>} Streak analytics
 */
export const getStreakAnalytics = async (institutionId, streakType = null) => {
  try {
    const matchQuery = {
      institutionId: new mongoose.Types.ObjectId(institutionId)
    };

    if (streakType) {
      matchQuery.streakContext = streakType;
    }

    // Get users with streaks
    const userStreaks = await User.aggregate([
      {
        $match: {
          institutionId: new mongoose.Types.ObjectId(institutionId),
          role: 'student',
          'progress.loginStreak': { $gt: 0 }
        }
      },
      {
        $project: {
          userId: '$_id',
          loginStreak: '$progress.loginStreak',
          completedModules: { $size: { $ifNull: ['$progress.completedModules', []] } }
        }
      }
    ]);

    // Calculate streak statistics
    const streaks = userStreaks.map(user => ({
      userId: user.userId,
      loginStreak: user.loginStreak,
      moduleCount: user.completedModules
    }));

    const maxStreak = streaks.length > 0
      ? Math.max(...streaks.map(s => s.loginStreak))
      : 0;

    const avgStreak = streaks.length > 0
      ? Math.round((streaks.reduce((sum, s) => sum + s.loginStreak, 0) / streaks.length) * 100) / 100
      : 0;

    return {
      streaks,
      maxStreak,
      avgStreak,
      totalUsersWithStreaks: streaks.length
    };
  } catch (error) {
    logger.error('Get streak analytics error:', error);
    throw error;
  }
};

export default {
  getGameAttemptAnalytics,
  getModuleCompletionRateAnalytics,
  getQuizAccuracyAnalytics,
  getDrillParticipationAnalytics,
  getHazardRecognitionAnalytics,
  getStreakAnalytics
};

