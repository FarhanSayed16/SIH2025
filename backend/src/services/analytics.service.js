/**
 * Phase 3.4.1: Advanced Analytics Service
 * Provides comprehensive analytics for drills, student progress, and institution-level metrics
 */

import mongoose from 'mongoose';
import User from '../models/User.js';
import Module from '../models/Module.js';
import QuizResult from '../models/QuizResult.js';
import GameScore from '../models/GameScore.js';
import Drill from '../models/Drill.js';
import DrillLog from '../models/DrillLog.js';
import Class from '../models/Class.js';
import School from '../models/School.js';
import logger from '../config/logger.js';

/**
 * Get drill performance metrics
 * @param {string} institutionId - Institution ID (optional)
 * @param {string} drillId - Specific drill ID (optional)
 * @param {Object} dateRange - Date range {start: Date, end: Date}
 * @returns {Promise<Object>} Drill performance metrics
 */
export const getDrillPerformanceMetrics = async (institutionId = null, drillId = null, dateRange = null) => {
  try {
    const matchQuery = {};
    
    if (institutionId) {
      matchQuery.institutionId = new mongoose.Types.ObjectId(institutionId);
    }
    
    if (drillId) {
      matchQuery.drillId = new mongoose.Types.ObjectId(drillId);
    }
    
    if (dateRange) {
      matchQuery.completedAt = {
        $gte: new Date(dateRange.start),
        $lte: new Date(dateRange.end)
      };
    }

    // Aggregate drill performance data
    const drillStats = await DrillLog.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: drillId ? '$drillId' : null,
          totalParticipants: { $sum: 1 },
          avgEvacuationTime: { $avg: '$evacuationTime' },
          minEvacuationTime: { $min: '$evacuationTime' },
          maxEvacuationTime: { $max: '$evacuationTime' },
          avgScore: { $avg: '$score' },
          completionRate: {
            $avg: { $cond: [{ $gt: ['$evacuationTime', 0] }, 1, 0] }
          }
        }
      }
    ]);

    // Get drill details if specific drill requested
    let drillDetails = null;
    if (drillId) {
      drillDetails = await Drill.findById(drillId)
        .populate('institutionId', 'name')
        .lean();
    }

    // Get participation over time (daily/weekly)
    const participationOverTime = await DrillLog.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$completedAt' }
          },
          count: { $sum: 1 },
          avgTime: { $avg: '$evacuationTime' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const result = drillStats[0] || {
      totalParticipants: 0,
      avgEvacuationTime: 0,
      minEvacuationTime: 0,
      maxEvacuationTime: 0,
      avgScore: 0,
      completionRate: 0
    };

    return {
      ...result,
      drillDetails,
      participationOverTime: participationOverTime.map(item => ({
        date: item._id,
        participants: item.count,
        avgEvacuationTime: Math.round(item.avgTime || 0)
      }))
    };
  } catch (error) {
    logger.error('Get drill performance metrics error:', error);
    throw error;
  }
};

/**
 * Get student progress tracking
 * @param {string} institutionId - Institution ID
 * @param {string} classId - Class ID (optional)
 * @param {string} userId - Specific user ID (optional)
 * @param {Object} dateRange - Date range {start: Date, end: Date}
 * @returns {Promise<Object>} Student progress metrics
 */
export const getStudentProgressMetrics = async (institutionId, classId = null, userId = null, dateRange = null) => {
  try {
    const userMatchQuery = { institutionId: new mongoose.Types.ObjectId(institutionId) };
    
    if (classId) {
      const classDoc = await Class.findById(classId);
      if (!classDoc) {
        throw new Error('Class not found');
      }
      userMatchQuery._id = { $in: classDoc.studentIds.map(id => new mongoose.Types.ObjectId(id)) };
    }
    
    if (userId) {
      userMatchQuery._id = new mongoose.Types.ObjectId(userId);
    }

    // Get all students
    const students = await User.find(userMatchQuery).lean();
    const studentIds = students.map(s => s._id);

    // Get module completion stats
    const moduleCompletionStats = await User.aggregate([
      { $match: userMatchQuery },
      {
        $project: {
          completedModules: { $size: { $ifNull: ['$progress.completedModules', []] } },
          preparednessScore: { $ifNull: ['$progress.preparednessScore', 0] },
          loginStreak: { $ifNull: ['$progress.loginStreak', 0] }
        }
      },
      {
        $group: {
          _id: null,
          avgModulesCompleted: { $avg: '$completedModules' },
          avgPreparednessScore: { $avg: '$preparednessScore' },
          avgLoginStreak: { $avg: '$loginStreak' },
          totalStudents: { $sum: 1 }
        }
      }
    ]);

    // Get quiz performance
    const quizDateQuery = dateRange ? {
      completedAt: {
        $gte: new Date(dateRange.start),
        $lte: new Date(dateRange.end)
      }
    } : {};

    const quizStats = await QuizResult.aggregate([
      {
        $match: {
          userId: { $in: studentIds },
          ...quizDateQuery
        }
      },
      {
        $group: {
          _id: '$userId',
          totalQuizzes: { $sum: 1 },
          avgScore: { $avg: '$score' },
          passedCount: { $sum: { $cond: ['$passed', 1, 0] } },
          avgTimeTaken: { $avg: '$timeTaken' }
        }
      },
      {
        $group: {
          _id: null,
          avgQuizzesPerStudent: { $avg: '$totalQuizzes' },
          avgQuizScore: { $avg: '$avgScore' },
          avgPassRate: { $avg: { $divide: ['$passedCount', '$totalQuizzes'] } },
          avgTimePerQuiz: { $avg: '$avgTimeTaken' }
        }
      }
    ]);

    // Get game performance
    const gameDateQuery = dateRange ? {
      completedAt: {
        $gte: new Date(dateRange.start),
        $lte: new Date(dateRange.end)
      }
    } : {};

    const gameStats = await GameScore.aggregate([
      {
        $match: {
          userId: { $in: studentIds },
          ...gameDateQuery
        }
      },
      {
        $group: {
          _id: '$gameType',
          totalGames: { $sum: 1 },
          avgScore: { $avg: '$score' },
          totalXP: { $sum: '$xpEarned' }
        }
      }
    ]);

    // Get progress over time
    const progressOverTime = await User.aggregate([
      { $match: userMatchQuery },
      {
        $project: {
          scoreHistory: { $ifNull: ['$progress.scoreHistory', []] }
        }
      },
      { $unwind: '$scoreHistory' },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$scoreHistory.date' }
          },
          avgScore: { $avg: '$scoreHistory.score' },
          studentCount: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    return {
      summary: {
        totalStudents: moduleCompletionStats[0]?.totalStudents || students.length,
        avgModulesCompleted: Math.round(moduleCompletionStats[0]?.avgModulesCompleted || 0),
        avgPreparednessScore: Math.round(moduleCompletionStats[0]?.avgPreparednessScore || 0),
        avgLoginStreak: Math.round(moduleCompletionStats[0]?.avgLoginStreak || 0)
      },
      quiz: {
        avgQuizzesPerStudent: Math.round(quizStats[0]?.avgQuizzesPerStudent || 0),
        avgQuizScore: Math.round(quizStats[0]?.avgQuizScore || 0),
        avgPassRate: Math.round((quizStats[0]?.avgPassRate || 0) * 100),
        avgTimePerQuiz: Math.round(quizStats[0]?.avgTimePerQuiz || 0)
      },
      games: gameStats.map(stat => ({
        gameType: stat._id,
        totalGames: stat.totalGames,
        avgScore: Math.round(stat.avgScore || 0),
        totalXP: stat.totalXP || 0
      })),
      progressOverTime: progressOverTime.map(item => ({
        date: item._id,
        avgScore: Math.round(item.avgScore || 0),
        studentCount: item.studentCount
      }))
    };
  } catch (error) {
    logger.error('Get student progress metrics error:', error);
    throw error;
  }
};

/**
 * Get institution-level analytics
 * @param {string} institutionId - Institution ID
 * @param {Object} dateRange - Date range {start: Date, end: Date}
 * @returns {Promise<Object>} Institution analytics
 */
export const getInstitutionAnalytics = async (institutionId, dateRange = null) => {
  try {
    // Build date query properly - only include if dateRange exists
    const buildDateQuery = (fieldName) => {
      if (!dateRange) return {};
      return {
        [fieldName]: {
          $gte: new Date(dateRange.start),
          $lte: new Date(dateRange.end)
        }
      };
    };

    // Get institution details
    const institution = await School.findById(institutionId).lean();

    // Get total users
    const userCounts = await User.aggregate([
      {
        $match: {
          institutionId: new mongoose.Types.ObjectId(institutionId),
          isActive: true
        }
      },
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get class statistics
    const classes = await Class.find({ institutionId }).populate('teacherId', 'name').lean();
    
    // Get module completion rates
    const moduleCompletion = await User.aggregate([
      {
        $match: {
          institutionId: new mongoose.Types.ObjectId(institutionId),
          role: 'student'
        }
      },
      {
        $project: {
          completedCount: { $size: { $ifNull: ['$progress.completedModules', []] } }
        }
      },
      {
        $group: {
          _id: null,
          totalStudents: { $sum: 1 },
          avgModulesCompleted: { $avg: '$completedCount' },
          studentsWithModules: {
            $sum: { $cond: [{ $gt: ['$completedCount', 0] }, 1, 0] }
          }
        }
      }
    ]);

    // Get total activities - fix date query issue
    const quizQuery = { institutionId, ...buildDateQuery('completedAt') };
    const gameQuery = { institutionId, ...buildDateQuery('completedAt') };
    const drillLogQuery = { institutionId, ...buildDateQuery('completedAt') };
    const drillQuery = { institutionId, ...buildDateQuery('createdAt') };

    const activityCounts = await Promise.all([
      QuizResult.countDocuments(quizQuery),
      GameScore.countDocuments(gameQuery),
      DrillLog.countDocuments(drillLogQuery),
      Drill.countDocuments(drillQuery)
    ]);

    // Get preparedness score distribution
    const scoreDistribution = await User.aggregate([
      {
        $match: {
          institutionId: new mongoose.Types.ObjectId(institutionId),
          role: 'student'
        }
      },
      {
        $project: {
          score: { $ifNull: ['$progress.preparednessScore', 0] }
        }
      },
      {
        $bucket: {
          groupBy: '$score',
          boundaries: [0, 25, 50, 75, 100],
          default: 'other',
          output: {
            count: { $sum: 1 }
          }
        }
      }
    ]);

    return {
      institution: {
        id: institutionId,
        name: institution?.name || 'Unknown',
        totalUsers: userCounts.reduce((sum, item) => sum + item.count, 0),
        usersByRole: userCounts.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        totalClasses: classes.length,
        classes: classes.map(c => ({
          id: c._id,
          name: c.name,
          teacherName: c.teacherId?.name || 'Unknown',
          studentCount: c.studentIds?.length || 0
        }))
      },
      modules: {
        totalStudents: moduleCompletion[0]?.totalStudents || 0,
        avgModulesCompleted: Math.round(moduleCompletion[0]?.avgModulesCompleted || 0),
        completionRate: moduleCompletion[0]?.totalStudents > 0
          ? Math.round((moduleCompletion[0]?.studentsWithModules / moduleCompletion[0]?.totalStudents) * 100)
          : 0
      },
      activities: {
        totalQuizzes: activityCounts[0] || 0,
        totalGames: activityCounts[1] || 0,
        totalDrillLogs: activityCounts[2] || 0,
        totalDrills: activityCounts[3] || 0
      },
      scoreDistribution: scoreDistribution.map(item => ({
        range: `${item._id.min || 0}-${item._id.max || 100}`,
        count: item.count
      }))
    };
  } catch (error) {
    logger.error('Get institution analytics error:', error);
    throw error;
  }
};

/**
 * Get module completion rates
 * @param {string} institutionId - Institution ID
 * @param {Object} dateRange - Date range {start: Date, end: Date}
 * @returns {Promise<Array>} Module completion statistics
 */
export const getModuleCompletionRates = async (institutionId, dateRange = null) => {
  try {
    const students = await User.find({
      institutionId,
      role: 'student'
    }).select('progress.completedModules').lean();

    const totalStudents = students.length;
    
    // Get all modules
    const modules = await Module.find({ institutionId }).lean();
    
    // Calculate completion rates
    const completionRates = modules.map(module => {
      const completedCount = students.filter(student => {
        const completedModules = student.progress?.completedModules || [];
        return completedModules.some(id => id.toString() === module._id.toString());
      }).length;

      return {
        moduleId: module._id,
        moduleTitle: module.title,
        category: module.category,
        completedCount,
        totalStudents,
        completionRate: totalStudents > 0
          ? Math.round((completedCount / totalStudents) * 100)
          : 0
      };
    });

    return completionRates.sort((a, b) => b.completionRate - a.completionRate);
  } catch (error) {
    logger.error('Get module completion rates error:', error);
    throw error;
  }
};

/**
 * Get game performance analytics
 * @param {string} institutionId - Institution ID
 * @param {string} gameType - Game type (optional)
 * @param {Object} dateRange - Date range {start: Date, end: Date}
 * @returns {Promise<Object>} Game performance analytics
 */
export const getGamePerformanceAnalytics = async (institutionId, gameType = null, dateRange = null) => {
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

    // Aggregate game performance by game type
    const gameStats = await GameScore.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$gameType',
          totalGames: { $sum: 1 },
          uniquePlayers: { $addToSet: '$userId' },
          avgScore: { $avg: '$score' },
          maxScore: { $max: '$score' },
          minScore: { $min: '$score' },
          totalXP: { $sum: '$xpEarned' },
          avgLevel: { $avg: '$level' },
          avgTimeTaken: { $avg: '$timeTaken' }
        }
      },
      {
        $project: {
          gameType: '$_id',
          totalGames: 1,
          uniquePlayers: { $size: '$uniquePlayers' },
          avgScore: 1,
          maxScore: 1,
          minScore: 1,
          totalXP: 1,
          avgLevel: 1,
          avgTimeTaken: 1
        }
      }
    ]);

    // Get game performance over time
    const performanceOverTime = await GameScore.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: {
            gameType: '$gameType',
            date: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } }
          },
          avgScore: { $avg: '$score' },
          totalGames: { $sum: 1 }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    return {
      byGameType: gameStats.map(stat => ({
        gameType: stat.gameType,
        totalGames: stat.totalGames,
        uniquePlayers: stat.uniquePlayers,
        avgScore: Math.round(stat.avgScore || 0),
        maxScore: stat.maxScore || 0,
        minScore: stat.minScore || 0,
        totalXP: stat.totalXP || 0,
        avgLevel: Math.round(stat.avgLevel || 0),
        avgTimeTaken: Math.round(stat.avgTimeTaken || 0)
      })),
      overTime: performanceOverTime.map(item => ({
        gameType: item._id.gameType,
        date: item._id.date,
        avgScore: Math.round(item.avgScore || 0),
        totalGames: item.totalGames
      }))
    };
  } catch (error) {
    logger.error('Get game performance analytics error:', error);
    throw error;
  }
};

/**
 * Get quiz accuracy trends
 * @param {string} institutionId - Institution ID
 * @param {string} moduleId - Module ID (optional)
 * @param {Object} dateRange - Date range {start: Date, end: Date}
 * @returns {Promise<Object>} Quiz accuracy trends
 */
export const getQuizAccuracyTrends = async (institutionId, moduleId = null, dateRange = null) => {
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

    // Get quiz accuracy over time
    const accuracyOverTime = await QuizResult.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$completedAt' }
          },
          totalQuizzes: { $sum: 1 },
          avgScore: { $avg: '$score' },
          passedCount: { $sum: { $cond: ['$passed', 1, 0] } },
          totalAnswers: { $sum: { $size: '$answers' } },
          correctAnswers: {
            $sum: {
              $size: {
                $filter: {
                  input: '$answers',
                  as: 'answer',
                  cond: { $eq: ['$$answer.isCorrect', true] }
                }
              }
            }
          }
        }
      },
      {
        $project: {
          date: '$_id',
          totalQuizzes: 1,
          avgScore: 1,
          passRate: {
            $multiply: [
              { $divide: ['$passedCount', '$totalQuizzes'] },
              100
            ]
          },
          accuracyRate: {
            $cond: [
              { $gt: ['$totalAnswers', 0] },
              {
                $multiply: [
                  { $divide: ['$correctAnswers', '$totalAnswers'] },
                  100
                ]
              },
              0
            ]
          }
        }
      },
      { $sort: { date: 1 } }
    ]);

    // Get accuracy by module
    const accuracyByModule = await QuizResult.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$moduleId',
          totalQuizzes: { $sum: 1 },
          avgScore: { $avg: '$score' },
          passedCount: { $sum: { $cond: ['$passed', 1, 0] } }
        }
      },
      {
        $lookup: {
          from: 'modules',
          localField: '_id',
          foreignField: '_id',
          as: 'module'
        }
      },
      {
        $project: {
          moduleId: '$_id',
          moduleTitle: { $arrayElemAt: ['$module.title', 0] },
          totalQuizzes: 1,
          avgScore: 1,
          passRate: {
            $multiply: [
              { $divide: ['$passedCount', '$totalQuizzes'] },
              100
            ]
          }
        }
      }
    ]);

    return {
      overTime: accuracyOverTime.map(item => ({
        date: item.date,
        totalQuizzes: item.totalQuizzes,
        avgScore: Math.round(item.avgScore || 0),
        passRate: Math.round(item.passRate || 0),
        accuracyRate: Math.round(item.accuracyRate || 0)
      })),
      byModule: accuracyByModule.map(item => ({
        moduleId: item.moduleId,
        moduleTitle: item.moduleTitle || 'Unknown',
        totalQuizzes: item.totalQuizzes,
        avgScore: Math.round(item.avgScore || 0),
        passRate: Math.round(item.passRate || 0)
      }))
    };
  } catch (error) {
    logger.error('Get quiz accuracy trends error:', error);
    throw error;
  }
};

