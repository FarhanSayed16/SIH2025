import QuizResult from '../models/QuizResult.js';
import DrillLog from '../models/DrillLog.js';
import User from '../models/User.js';
import Module from '../models/Module.js';
import { calculatePreparednessScore } from '../utils/helpers.js';
import logger from '../config/logger.js';

/**
 * Sync offline data (Phase 3.1.2 Enhanced)
 * Handles bulk synchronization of quizzes, drill logs, and module downloads
 */
export const syncOfflineData = async (userId, syncData) => {
  try {
    const { quizzes = [], drillLogs = [], modules = [], games = [] } = syncData;
    const results = {
      quizzes: { synced: 0, failed: 0 },
      drillLogs: { synced: 0, failed: 0 },
      games: { synced: 0, failed: 0 },
      modules: { downloaded: 0, failed: 0 },
      conflicts: []
    };

    // Get user to access institutionId
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Sync quiz results
    if (quizzes.length > 0) {
      const quizResults = quizzes.map(quiz => ({
        ...quiz,
        userId,
        institutionId: user.institutionId,
        synced: true,
        syncedAt: new Date()
      }));

      try {
        await QuizResult.insertMany(quizResults, { ordered: false });
        results.quizzes.synced = quizResults.length;
        logger.info(`Synced ${quizResults.length} quiz results for user ${userId}`);
      } catch (error) {
        // Handle duplicate key errors (already synced)
        if (error.code === 11000) {
          results.quizzes.failed = quizzes.length;
          results.conflicts.push({
            type: 'quizzes',
            message: 'Some quizzes were already synced'
          });
        } else {
          throw error;
        }
      }
    }

    // Sync drill logs
    if (drillLogs.length > 0) {
      const logs = drillLogs.map(log => ({
        ...log,
        userId,
        institutionId: user.institutionId,
        synced: true,
        syncedAt: new Date()
      }));

      try {
        await DrillLog.insertMany(logs, { ordered: false });
        results.drillLogs.synced = logs.length;
        logger.info(`Synced ${logs.length} drill logs for user ${userId}`);
      } catch (error) {
        if (error.code === 11000) {
          results.drillLogs.failed = drillLogs.length;
          results.conflicts.push({
            type: 'drillLogs',
            message: 'Some drill logs were already synced'
          });
        } else {
          throw error;
        }
      }
    }

    // Handle module downloads (Phase 3.1.2)
    if (modules.length > 0) {
      try {
        const moduleIds = modules.map(m => m.moduleId || m._id || m.id).filter(Boolean);
        const downloadedModules = await Module.find({
          _id: { $in: moduleIds },
          isActive: true
        }).select('-quiz.questions.correctAnswer'); // Don't expose answers

        results.modules.downloaded = downloadedModules.length;
        logger.info(`Downloaded ${downloadedModules.length} modules for user ${userId}`);
      } catch (error) {
        results.modules.failed = modules.length;
        results.conflicts.push({
          type: 'modules',
          message: `Failed to download modules: ${error.message}`
        });
        logger.error(`Module download error for user ${userId}:`, error);
      }
    }

    // Sync game scores (Phase 3.4.0: Added game support)
    if (games.length > 0) {
      const GameScore = (await import('../models/GameScore.js')).default;
      const gameScores = games.map(game => ({
        ...game,
        userId,
        institutionId: user.institutionId,
        synced: true,
        syncedAt: new Date()
      }));

      try {
        for (const gameData of gameScores) {
          try {
            // Use the existing GameScore model logic
            const gameScore = new GameScore({
              userId: gameData.userId,
              institutionId: gameData.institutionId,
              gameType: gameData.gameType,
              score: gameData.score,
              maxScore: gameData.maxScore || 0,
              level: gameData.level || 1,
              difficulty: gameData.difficulty || 'easy',
              isGroupMode: gameData.isGroupMode || false,
              groupActivityId: gameData.groupActivityId || null,
              itemsCorrect: gameData.itemsCorrect || 0,
              itemsIncorrect: gameData.itemsIncorrect || 0,
              timeTaken: gameData.timeTaken || null,
              completedAt: gameData.completedAt ? new Date(gameData.completedAt) : new Date(),
              synced: true,
              syncedAt: new Date(),
            });
            gameScore.calculateXP();
            await gameScore.save();
            results.games.synced++;
          } catch (gameError) {
            // Handle duplicate key errors
            if (gameError.code === 11000) {
              results.games.failed++;
              results.conflicts.push({
                type: 'games',
                message: 'Some game scores were already synced'
              });
            } else {
              throw gameError;
            }
          }
        }
        logger.info(`Synced ${results.games.synced} game scores for user ${userId}`);
      } catch (error) {
        if (error.code !== 11000) {
          results.games.failed = games.length;
          results.conflicts.push({
            type: 'games',
            message: `Failed to sync games: ${error.message}`
          });
          logger.error(`Game sync error for user ${userId}:`, error);
        }
      }
    }

    // Recalculate user preparedness score
    if (results.quizzes.synced > 0 || results.drillLogs.synced > 0 || results.games.synced > 0) {
      await updateUserPreparednessScore(userId);
    }

    return results;
  } catch (error) {
    logger.error('Sync offline data error:', error);
    throw error;
  }
};

/**
 * Update user preparedness score based on their activities
 */
const updateUserPreparednessScore = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    // Get quiz completion rate
    const totalModules = await (await import('../models/Module.js')).default.countDocuments({ isActive: true });
    const completedModules = user.progress.completedModules.length;
    const quizCompletionRate = totalModules > 0 ? (completedModules / totalModules) : 0;

    // Get average quiz score
    const quizResults = await QuizResult.find({ userId });
    const avgQuizScore = quizResults.length > 0
      ? quizResults.reduce((sum, r) => sum + r.score, 0) / quizResults.length
      : 0;

    // Get drill participation rate
    const totalDrills = await (await import('../models/Drill.js')).default.countDocuments({
      institutionId: user.institutionId,
      status: 'completed'
    });
    const participatedDrills = await DrillLog.countDocuments({ userId });
    const drillParticipationRate = totalDrills > 0 ? (participatedDrills / totalDrills) : 0;

    // Get average evacuation time
    const drillLogs = await DrillLog.find({ userId });
    const avgEvacuationTime = drillLogs.length > 0
      ? drillLogs.reduce((sum, log) => sum + log.evacuationTime, 0) / drillLogs.length
      : null;

    // Calculate score
    const score = calculatePreparednessScore({
      quizCompletionRate,
      averageQuizScore: avgQuizScore,
      drillParticipationRate,
      avgEvacuationTime
    });

    user.progress.preparednessScore = score;
    await user.save();

    logger.info(`Updated preparedness score for user ${userId}: ${score}`);
  } catch (error) {
    logger.error('Update preparedness score error:', error);
  }
};

