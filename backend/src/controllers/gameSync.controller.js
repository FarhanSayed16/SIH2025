/**
 * Phase 3.2.5: Game Sync Controller
 * Handles bulk sync of game scores from offline storage
 */

import GameScore from '../models/GameScore.js';
import { successResponse, errorResponse } from '../utils/response.js';
import logger from '../config/logger.js';
import GroupActivity from '../models/GroupActivity.js';
import User from '../models/User.js';

/**
 * Bulk sync game scores (for offline support)
 * POST /api/games/sync
 */
export const syncGameScores = async (req, res) => {
  try {
    const { scores = [] } = req.body;
    const userId = req.userId || req.user?.id;

    if (!scores || !Array.isArray(scores) || scores.length === 0) {
      return errorResponse(res, 'No scores provided for sync', 400);
    }

    const syncedScores = [];
    const conflicts = [];
    const errors = [];

    for (const scoreData of scores) {
      try {
        // Validate score data
        if (!scoreData.gameType || scoreData.score === undefined) {
          errors.push(`Invalid score data: ${JSON.stringify(scoreData)}`);
          continue;
        }

        // Check for duplicate/conflict
        const existingScore = await GameScore.findOne({
          userId: scoreData.userId || userId,
          gameType: scoreData.gameType,
          completedAt: new Date(scoreData.completedAt),
          score: scoreData.score,
        });

        if (existingScore) {
          // Conflict: score already exists
          conflicts.push({
            scoreId: scoreData.id || scoreData._id,
            existingId: existingScore._id,
            message: 'Score already exists on server',
          });
          continue;
        }

        // Get institutionId if not provided
        let institutionId = scoreData.institutionId || req.user?.institutionId;
        if (!institutionId && userId) {
          try {
            const user = await User.findById(userId).select('institutionId');
            if (user && user.institutionId) {
              institutionId = user.institutionId;
            }
          } catch (userError) {
            logger.warn(`Could not fetch institutionId for user ${userId}:`, userError.message);
          }
        }

        // Create game score
        const gameScore = new GameScore({
          userId: scoreData.userId || userId,
          institutionId: institutionId || null,
          gameType: scoreData.gameType,
          score: scoreData.score,
          maxScore: scoreData.maxScore || 0,
          level: scoreData.level || 1,
          difficulty: scoreData.difficulty || 'easy',
          isGroupMode: scoreData.isGroupMode || false,
          groupActivityId: scoreData.groupActivityId || null,
          itemsCorrect: scoreData.itemsCorrect || 0,
          itemsIncorrect: scoreData.itemsIncorrect || 0,
          timeTaken: scoreData.timeTaken || null,
          completedAt: scoreData.completedAt ? new Date(scoreData.completedAt) : new Date(),
          synced: true,
          syncedAt: new Date(),
        });

        // Calculate XP
        gameScore.calculateXP();

        await gameScore.save();

        // Phase 3.3.1: Trigger preparedness score update (non-blocking) for individual scores
        if (scoreData.userId && !scoreData.isGroupMode) {
          const { recalculateScore } = await import('../services/preparednessScore.service.js');
          recalculateScore(scoreData.userId).catch(err => {
            logger.warn('Failed to update preparedness score during sync:', err);
          });
        }

        // Update group activity if in group mode
        if (scoreData.isGroupMode && scoreData.groupActivityId) {
          try {
            const groupActivity = await GroupActivity.findById(scoreData.groupActivityId);
            if (groupActivity) {
              if (scoreData.studentIds && scoreData.studentIds.length > 0) {
                for (const studentId of scoreData.studentIds) {
                  await groupActivity.updateParticipantScore(
                    studentId,
                    scoreData.score,
                    true
                  );
                }
              }
              await groupActivity.calculateResults();
            }
          } catch (groupError) {
            logger.warn('Failed to update group activity during sync:', groupError);
          }
        }

        syncedScores.push({
          scoreId: scoreData.id || scoreData._id,
          newId: gameScore._id,
        });
      } catch (scoreError) {
        logger.error(`Error syncing score: ${scoreError.message}`, scoreError);
        errors.push({
          scoreId: scoreData.id || scoreData._id,
          error: scoreError.message,
        });
      }
    }

    logger.info(`Game sync completed: ${syncedScores.length} synced, ${conflicts.length} conflicts, ${errors.length} errors`);

    return successResponse(res, {
      synced: syncedScores.length,
      conflicts: conflicts.length,
      errors: errors.length,
      details: {
        syncedScores,
        conflicts,
        errors,
      },
    }, `Synced ${syncedScores.length} scores successfully`);
  } catch (error) {
    logger.error('Game sync error:', error);
    return errorResponse(res, error.message || 'Game sync failed', 500);
  }
};

/**
 * Get sync status
 * GET /api/games/sync/status
 */
export const getSyncStatus = async (req, res) => {
  try {
    const userId = req.userId;

    // Get pending scores count (would need offline storage access)
    // For now, just return basic status
    const recentScores = await GameScore.find({ userId })
      .sort({ completedAt: -1 })
      .limit(10)
      .select('synced syncedAt')
      .lean();

    const unsyncedCount = recentScores.filter(s => !s.synced).length;

    return successResponse(res, {
      hasPending: unsyncedCount > 0,
      pendingCount: unsyncedCount,
      lastSync: recentScores.find(s => s.synced)?.syncedAt || null,
    }, 'Sync status retrieved successfully');
  } catch (error) {
    logger.error('Get sync status error:', error);
    return errorResponse(res, error.message || 'Failed to get sync status', 500);
  }
};

