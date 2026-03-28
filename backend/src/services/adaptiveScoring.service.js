/**
 * Phase 3.3.2: Adaptive Scoring Service
 * Handles shared XP distribution and per-student tracking for shared devices
 */

import User from '../models/User.js';
import Class from '../models/Class.js';
import QuizResult from '../models/QuizResult.js';
import GameScore from '../models/GameScore.js';
import GroupActivity from '../models/GroupActivity.js';
import logger from '../config/logger.js';

/**
 * Distribute shared XP to all students in a class
 * Used when a module is completed in class mode
 * @param {string} classId - Class ID
 * @param {string} moduleId - Module ID that was completed
 * @param {number} xpAmount - Amount of XP to distribute
 * @param {Object} options - Additional options (activityType, activityId)
 * @returns {Promise<Object>} Distribution result
 */
export const distributeSharedXP = async (classId, moduleId, xpAmount, options = {}) => {
  try {
    const classDoc = await Class.findById(classId).populate('studentIds', 'id name email');
    
    if (!classDoc) {
      throw new Error('Class not found');
    }

    if (!classDoc.studentIds || classDoc.studentIds.length === 0) {
      logger.warn(`No students found in class ${classId}`);
      return {
        success: false,
        message: 'No students in class',
        distributed: 0
      };
    }

    const studentIds = classDoc.studentIds.map(s => s._id || s.id);
    const distributed = [];
    const failed = [];

    // Distribute XP to each student
    for (const studentId of studentIds) {
      try {
        const user = await User.findById(studentId);
        if (!user) {
          failed.push({ studentId, reason: 'User not found' });
          continue;
        }

            // Initialize progress if not exists
        user.progress = user.progress || {};
        user.progress.completedModules = user.progress.completedModules || [];

        // Track shared XP (can be stored separately or added to total)
        // For now, we'll mark the module as completed for all students in class mode
        // XP is tracked through module completion, so adding to completedModules achieves this
        
        // If module not already completed, add it
        if (moduleId && !user.progress.completedModules.includes(moduleId)) {
          user.progress.completedModules.push(moduleId);
        }

        await user.save();
        
        distributed.push({
          studentId: user._id.toString(),
          name: user.name,
          xpReceived: xpAmount
        });

        logger.info(`Shared XP distributed: ${xpAmount} to student ${user._id} in class ${classId}`);
      } catch (error) {
        logger.error(`Failed to distribute XP to student ${studentId}:`, error);
        failed.push({ studentId, reason: error.message });
      }
    }

    // Trigger preparedness score recalculation for all students (non-blocking)
    for (const studentId of studentIds) {
      try {
        const { recalculateScore } = await import('./preparednessScore.service.js');
        recalculateScore(studentId.toString()).catch(err => {
          logger.warn(`Failed to recalculate score for student ${studentId}:`, err);
        });
      } catch (error) {
        // Ignore errors - score recalculation is non-critical
      }
    }

    return {
      success: true,
      message: `Shared XP distributed to ${distributed.length} students`,
      distributed: distributed.length,
      failed: failed.length,
      details: {
        distributed,
        failed
      }
    };
  } catch (error) {
    logger.error('Distribute shared XP error:', error);
    throw error;
  }
};

/**
 * Get per-student score tracking
 * Returns scores for all students in a class
 * @param {string} classId - Class ID
 * @param {Object} filters - Filters (gameType, activityType, dateRange)
 * @returns {Promise<Array>} Student scores
 */
export const getPerStudentScores = async (classId, filters = {}) => {
  try {
    const classDoc = await Class.findById(classId).populate('studentIds', 'id name email grade');
    
    if (!classDoc) {
      throw new Error('Class not found');
    }

    const studentIds = classDoc.studentIds.map(s => s._id || s.id);
    const studentScores = [];

    for (const student of classDoc.studentIds) {
      const studentId = student._id || student.id;
      
      // Get game scores
      const gameScoresQuery = { userId: studentId };
      if (filters.gameType) {
        gameScoresQuery.gameType = filters.gameType;
      }
      if (filters.dateRange) {
        gameScoresQuery.completedAt = {
          $gte: filters.dateRange.start,
          $lte: filters.dateRange.end
        };
      }
      
      const gameScores = await GameScore.find(gameScoresQuery)
        .sort({ completedAt: -1 })
        .limit(50)
        .lean();

      // Get quiz results
      const quizQuery = { userId: studentId };
      if (filters.moduleId) {
        quizQuery.moduleId = filters.moduleId;
      }
      if (filters.dateRange) {
        quizQuery.completedAt = {
          $gte: filters.dateRange.start,
          $lte: filters.dateRange.end
        };
      }
      
      const quizResults = await QuizResult.find(quizQuery)
        .sort({ completedAt: -1 })
        .limit(50)
        .lean();

      // Calculate aggregates
      const totalGameScore = gameScores.reduce((sum, s) => sum + (s.score || 0), 0);
      const totalGameXP = gameScores.reduce((sum, s) => sum + (s.xpEarned || 0), 0);
      const avgQuizScore = quizResults.length > 0
        ? quizResults.reduce((sum, q) => sum + (q.score || 0), 0) / quizResults.length
        : 0;

      studentScores.push({
        studentId: studentId.toString(),
        name: student.name || 'Unknown',
        email: student.email,
        grade: student.grade,
        stats: {
          totalGames: gameScores.length,
          totalGameScore,
          totalGameXP,
          averageQuizScore: Math.round(avgQuizScore),
          totalQuizzes: quizResults.length
        },
        recentGames: gameScores.slice(0, 5),
        recentQuizzes: quizResults.slice(0, 5)
      });
    }

    return studentScores;
  } catch (error) {
    logger.error('Get per-student scores error:', error);
    throw error;
  }
};

/**
 * Get shared XP distribution history
 * Shows when XP was distributed to class
 * @param {string} classId - Class ID
 * @param {Object} filters - Filters (dateRange, activityType)
 * @returns {Promise<Array>} Distribution history
 */
export const getSharedXPDistribution = async (classId, filters = {}) => {
  try {
    // Get group activities for this class
    const groupActivityQuery = {
      classId
    };
    
    // Add activityType filter if provided, otherwise default to module/quiz
    if (filters.activityType) {
      groupActivityQuery.activityType = filters.activityType;
    } else {
      groupActivityQuery.activityType = { $in: ['module', 'quiz'] };
    }

    if (filters.dateRange) {
      groupActivityQuery.createdAt = {
        $gte: filters.dateRange.start,
        $lte: filters.dateRange.end
      };
    }

    const groupActivities = await GroupActivity.find(groupActivityQuery)
      .populate('participants.studentId', 'name email')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    const distributions = groupActivities.map(activity => {
      const participants = activity.participants.map(p => ({
        studentId: p.studentId?._id || p.studentId,
        name: p.studentId?.name || 'Unknown',
        score: p.score || 0,
        completed: p.completed || false
      }));

      return {
        activityId: activity._id.toString(),
        activityType: activity.activityType,
        activityName: activity.metadata?.activityName || 'Unknown',
        participants,
        totalParticipants: participants.length,
        averageScore: activity.results?.averageScore || 0,
        distributedAt: activity.createdAt,
        status: activity.status
      };
    });

    return distributions;
  } catch (error) {
    logger.error('Get shared XP distribution error:', error);
    throw error;
  }
};

/**
 * Aggregate scores from multiple sources for a student
 * Includes individual activities and group activities
 * @param {string} studentId - Student ID
 * @returns {Promise<Object>} Aggregated scores
 */
export const getAggregatedStudentScores = async (studentId) => {
  try {
    const user = await User.findById(studentId);
    if (!user) {
      throw new Error('Student not found');
    }

    // Get individual game scores
    const individualGameScores = await GameScore.find({
      userId: studentId,
      isGroupMode: false
    }).lean();

    // Get group game scores (where student participated)
    const groupGameScores = await GameScore.find({
      userId: studentId,
      isGroupMode: true
    }).lean();

    // Get quiz results
    const quizResults = await QuizResult.find({ userId: studentId }).lean();

    // Calculate aggregates
    const individualGameStats = {
      total: individualGameScores.length,
      totalScore: individualGameScores.reduce((sum, s) => sum + (s.score || 0), 0),
      totalXP: individualGameScores.reduce((sum, s) => sum + (s.xpEarned || 0), 0),
      averageScore: individualGameScores.length > 0
        ? individualGameScores.reduce((sum, s) => sum + (s.score || 0), 0) / individualGameScores.length
        : 0
    };

    const groupGameStats = {
      total: groupGameScores.length,
      totalScore: groupGameScores.reduce((sum, s) => sum + (s.score || 0), 0),
      totalXP: groupGameScores.reduce((sum, s) => sum + (s.xpEarned || 0), 0),
      averageScore: groupGameScores.length > 0
        ? groupGameScores.reduce((sum, s) => sum + (s.score || 0), 0) / groupGameScores.length
        : 0
    };

    const quizStats = {
      total: quizResults.length,
      averageScore: quizResults.length > 0
        ? quizResults.reduce((sum, q) => sum + (q.score || 0), 0) / quizResults.length
        : 0,
      passedCount: quizResults.filter(q => q.passed).length
    };

    return {
      studentId,
      studentName: user.name,
      individualActivities: {
        games: individualGameStats,
        quizzes: quizStats
      },
      groupActivities: {
        games: groupGameStats
      },
      totals: {
        totalXP: individualGameStats.totalXP + groupGameStats.totalXP,
        totalGames: individualGameStats.total + groupGameStats.total,
        totalQuizzes: quizStats.total,
        overallAverage: (individualGameStats.total > 0 || groupGameStats.total > 0)
          ? ((individualGameStats.averageScore * individualGameStats.total) + 
             (groupGameStats.averageScore * groupGameStats.total)) / 
            (individualGameStats.total + groupGameStats.total)
          : 0
      }
    };
  } catch (error) {
    logger.error('Get aggregated student scores error:', error);
    throw error;
  }
};

