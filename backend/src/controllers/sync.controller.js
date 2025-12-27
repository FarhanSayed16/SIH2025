import { syncOfflineData } from '../services/sync.service.js';
import {
  addToSyncQueue,
  processSyncQueue,
  resolveConflict,
  getQueueStatus,
  clearOldSyncedItems,
} from '../services/syncQueue.service.js';
import { successResponse, errorResponse } from '../utils/response.js';
import logger from '../config/logger.js';
import User from '../models/User.js';
import QuizResult from '../models/QuizResult.js';
import DrillLog from '../models/DrillLog.js';
import GameScore from '../models/GameScore.js';

/**
 * Sync offline data (Phase 3.1.2 Enhanced, 3.4.0: Queue support)
 * POST /api/sync
 * Supports: quizzes, drillLogs, games, and module downloads
 * Options: useQueue (boolean) - if true, adds to queue instead of syncing immediately
 */
export const sync = async (req, res) => {
  try {
    const { quizzes = [], drillLogs = [], games = [], modules = [], useQueue = false, metadata = {} } = req.body;

    if (quizzes.length === 0 && drillLogs.length === 0 && games.length === 0 && modules.length === 0) {
      return errorResponse(res, 'No data to sync', 400);
    }

    // Phase 3.4.0: If useQueue is true, add to queue instead of syncing immediately
    if (useQueue) {
      const queueItems = [];
      
      // Get user institutionId if not in metadata
      let institutionId = metadata.institutionId;
      if (!institutionId) {
        try {
          const user = await User.findById(req.userId).select('institutionId').lean();
          institutionId = user?.institutionId?.toString();
        } catch (err) {
          logger.warn('Could not fetch user institutionId:', err.message);
        }
      }
      
      // Add quizzes to queue
      for (const quiz of quizzes) {
        const item = await addToSyncQueue(
          req.userId,
          'quiz',
          quiz,
          {
            priority: metadata.priority || 5,
            deviceId: metadata.deviceId,
            appVersion: metadata.appVersion,
            institutionId: institutionId,
            createdAt: quiz.completedAt ? new Date(quiz.completedAt) : new Date(),
          }
        );
        queueItems.push(item._id.toString());
      }

      // Add drill logs to queue
      for (const drill of drillLogs) {
        const item = await addToSyncQueue(
          req.userId,
          'drill',
          drill,
          {
            priority: metadata.priority || 5,
            deviceId: metadata.deviceId,
            appVersion: metadata.appVersion,
            institutionId: institutionId,
            createdAt: drill.completedAt ? new Date(drill.completedAt) : new Date(),
          }
        );
        queueItems.push(item._id.toString());
      }

      // Add games to queue
      for (const game of games) {
        const item = await addToSyncQueue(
          req.userId,
          'game',
          game,
          {
            priority: metadata.priority || 5,
            deviceId: metadata.deviceId,
            appVersion: metadata.appVersion,
            institutionId: institutionId,
            createdAt: game.completedAt ? new Date(game.completedAt) : new Date(),
          }
        );
        queueItems.push(item._id.toString());
      }

      // Process modules immediately (they don't need queue as they're downloads)
      let moduleResult = { downloaded: 0, failed: 0 };
      if (modules.length > 0) {
        const syncResult = await syncOfflineData(req.userId, { modules });
        moduleResult = syncResult.modules || moduleResult;
      }

      // Process queue in background (don't wait)
      processSyncQueue(req.userId, 10).catch(err => {
        logger.error('Background queue processing error:', err);
      });

      return successResponse(
        res,
        {
          queued: queueItems.length,
          queueItemIds: queueItems,
          modules: moduleResult,
          message: `Added ${queueItems.length} items to sync queue`
        },
        'Items added to sync queue'
      );
    }

    // Direct sync (existing behavior)
    const result = await syncOfflineData(req.userId, {
      quizzes,
      drillLogs,
      games,
      modules
    });

    logger.info(`Sync completed for user ${req.userId}: ${result.quizzes.synced} quizzes, ${result.drillLogs.synced} drill logs, ${result.games?.synced || 0} games, ${result.modules?.downloaded || 0} modules`);

    return successResponse(
      res,
      {
        ...result,
        message: `Synced ${result.quizzes.synced + result.drillLogs.synced + (result.games?.synced || 0) + (result.modules?.downloaded || 0)} items successfully`
      },
      'Sync completed successfully'
    );
  } catch (error) {
    logger.error('Sync controller error:', error);
    return errorResponse(res, error.message || 'Sync failed', 500);
  }
};

/**
 * Get sync status (Phase 3.1.2 Enhanced, 3.4.0: Queue status)
 * GET /api/sync/status
 */
export const getSyncStatus = async (req, res) => {
  try {
    const userId = req.userId;

    // Phase 3.4.0: Get queue status
    const queueStatus = await getQueueStatus(userId);

    // Get pending sync counts from models (legacy support)
    const pendingQuizzes = await QuizResult.countDocuments({
      userId,
      synced: false
    });

    const pendingDrillLogs = await DrillLog.countDocuments({
      userId,
      synced: false
    });

    const pendingGames = await GameScore.countDocuments({
      userId,
      synced: false
    });

    // Get last sync time
    const lastQuizSync = await QuizResult.findOne({ userId, synced: true })
      .sort({ syncedAt: -1 })
      .select('syncedAt');

    const lastDrillSync = await DrillLog.findOne({ userId, synced: true })
      .sort({ syncedAt: -1 })
      .select('syncedAt');

    const lastGameSync = await GameScore.findOne({ userId, synced: true })
      .sort({ syncedAt: -1 })
      .select('syncedAt');

    const lastSyncTime = lastQuizSync?.syncedAt || lastDrillSync?.syncedAt || lastGameSync?.syncedAt || null;

    return successResponse(
      res,
      {
        // Legacy counts
        pendingQuizzes,
        pendingDrillLogs,
        pendingGames,
        lastSyncTime,
        hasPendingSync: pendingQuizzes > 0 || pendingDrillLogs > 0 || pendingGames > 0 || queueStatus.total > 0,
        // Phase 3.4.0: Queue status
        queue: {
          pending: queueStatus.pending,
          processing: queueStatus.processing,
          synced: queueStatus.synced,
          failed: queueStatus.failed,
          conflict: queueStatus.conflict,
          total: queueStatus.total,
          conflicts: queueStatus.conflicts, // Array of conflict details
        }
      },
      'Sync status retrieved successfully'
    );
  } catch (error) {
    logger.error('Get sync status error:', error);
    return errorResponse(res, error.message || 'Failed to get sync status', 500);
  }
};

/**
 * Process sync queue (Phase 3.4.0)
 * POST /api/sync/process-queue
 */
export const processQueue = async (req, res) => {
  try {
    const { batchSize = 10 } = req.body;
    const result = await processSyncQueue(req.userId, batchSize);

    return successResponse(
      res,
      result,
      `Processed ${result.processed} items from queue`
    );
  } catch (error) {
    logger.error('Process queue error:', error);
    return errorResponse(res, error.message || 'Failed to process queue', 500);
  }
};

/**
 * Resolve conflict (Phase 3.4.0)
 * POST /api/sync/resolve-conflict/:queueItemId
 */
export const resolveConflictController = async (req, res) => {
  try {
    const { queueItemId } = req.params;
    const { resolution, resolvedData } = req.body;

    if (!resolution || !['server-wins', 'client-wins', 'merge'].includes(resolution)) {
      return errorResponse(res, 'Invalid resolution strategy', 400);
    }

    const result = await resolveConflict(queueItemId, resolution, resolvedData);

    return successResponse(res, result, 'Conflict resolved successfully');
  } catch (error) {
    logger.error('Resolve conflict error:', error);
    return errorResponse(res, error.message || 'Failed to resolve conflict', 500);
  }
};

