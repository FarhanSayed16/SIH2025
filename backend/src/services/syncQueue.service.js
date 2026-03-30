/**
 * Phase 3.4.0: Sync Queue Service
 * Phase 3.5.2: Enhanced with better conflict resolution and queue optimization
 * Manages sync queue with priority, retry, and conflict resolution
 */

import mongoose from 'mongoose';
import SyncQueue from '../models/SyncQueue.js';
import { syncOfflineData } from './sync.service.js';
import { detectConflict, resolveConflict as resolveConflictWithStrategy, RESOLUTION_STRATEGIES, getDefaultStrategy } from './conflictResolution.service.js';
import QuizResult from '../models/QuizResult.js';
import DrillLog from '../models/DrillLog.js';
import GameScore from '../models/GameScore.js';
import logger from '../config/logger.js';

/**
 * Add item to sync queue
 * Phase 3.5.2: Enhanced with duplicate detection
 * @param {string} userId - User ID
 * @param {string} dataType - Type of data ('quiz', 'drill', 'game', 'module')
 * @param {Object} payload - Data to sync
 * @param {Object} options - Options (priority, metadata)
 */
export const addToSyncQueue = async (userId, dataType, payload, options = {}) => {
  try {
    // Phase 3.5.2: Check for duplicate pending items to avoid duplicates
    const existingItem = await SyncQueue.findOne({
      userId,
      dataType,
      status: { $in: ['pending', 'processing'] },
      // Check if same data (basic duplicate detection)
      'payload.userId': payload.userId || userId,
      'payload.moduleId': payload.moduleId,
      'payload.drillId': payload.drillId,
      'payload.completedAt': payload.completedAt,
    });

    if (existingItem) {
      logger.debug(`Duplicate sync item detected, skipping: ${dataType} for user ${userId}`);
      return existingItem; // Return existing item
    }

    const queueItem = await SyncQueue.create({
      userId,
      institutionId: options.institutionId || null,
      dataType,
      payload,
      priority: options.priority || getDefaultPriority(dataType),
      metadata: {
        deviceId: options.deviceId,
        appVersion: options.appVersion,
        syncVersion: options.syncVersion || '1.0',
        createdAt: options.createdAt || new Date(),
      },
    });

    logger.info(`Added ${dataType} to sync queue for user ${userId} (priority: ${queueItem.priority})`);
    return queueItem;
  } catch (error) {
    logger.error('Add to sync queue error:', error);
    throw error;
  }
};

/**
 * Get default priority for data type
 * Phase 3.5.2: Priority-based queue management
 */
const getDefaultPriority = (dataType) => {
  const priorities = {
    'drill': 1,      // Highest priority - drills are time-sensitive
    'quiz': 3,       // Medium-high priority
    'game': 5,       // Medium priority
    'module': 7,     // Lower priority - modules are downloaded, not synced
  };
  return priorities[dataType] || 5;
};

/**
 * Process sync queue (process N items in priority order)
 * Phase 3.5.2: Enhanced with better conflict resolution and performance
 * @param {string} userId - User ID (optional, if not provided processes all users)
 * @param {number} batchSize - Number of items to process
 * @param {Object} options - Processing options
 * @returns {Object} Processing results
 */
export const processSyncQueue = async (userId = null, batchSize = 10, options = {}) => {
  try {
    const { autoResolveConflicts = true, conflictStrategy = null } = options;

    // Find pending items, ordered by priority (lower number = higher priority) and creation time
    const query = { status: 'pending' };
    if (userId) {
      query.userId = userId;
    }

    // Phase 3.5.2: Optimize query with better indexing and limits
    const pendingItems = await SyncQueue.find(query)
      .sort({ priority: 1, createdAt: 1 })
      .limit(batchSize)
      .lean();

    if (pendingItems.length === 0) {
      return {
        processed: 0,
        synced: 0,
        failed: 0,
        conflicts: 0,
      };
    }

    const results = {
      processed: 0,
      synced: 0,
      failed: 0,
      conflicts: 0,
      autoResolved: 0,
    };

    // Phase 3.5.2: Group items by data type for batch processing (more efficient)
    const groupedByType = {};
    for (const item of pendingItems) {
      if (!groupedByType[item.dataType]) {
        groupedByType[item.dataType] = [];
      }
      groupedByType[item.dataType].push(item);
    }

    // Process each data type in batches
    for (const [dataType, items] of Object.entries(groupedByType)) {
      try {
        // Mark items as processing
        const itemIds = items.map((item) => item._id);
        await SyncQueue.updateMany(
          { _id: { $in: itemIds } },
          {
            status: 'processing',
            lastAttemptAt: new Date(),
            $inc: { retryCount: 1 },
          }
        );

        // Phase 3.5.2: Check for conflicts before syncing
        const itemsToSync = [];
        const conflictItems = [];

        for (const item of items) {
          // Try to detect conflicts by checking existing data
          try {
            const conflict = await checkForConflicts(item, dataType);
            if (conflict.hasConflict && autoResolveConflicts) {
              // Auto-resolve if possible
              const strategy = conflictStrategy || conflict.recommendedStrategy || getDefaultStrategy(dataType);
              const resolution = resolveConflictWithStrategy(conflict, strategy);

              if (resolution.resolved) {
                // Update payload with resolved data
                item.payload = resolution.data;
                itemsToSync.push(item);
                results.autoResolved++;
                logger.debug(`Auto-resolved conflict for ${dataType} item ${item._id}`);
              } else {
                conflictItems.push({ item, conflict, resolution });
              }
            } else if (conflict.hasConflict) {
              conflictItems.push({ item, conflict });
            } else {
              itemsToSync.push(item);
            }
          } catch (error) {
            // If conflict detection fails, try to sync anyway
            logger.warn(`Conflict detection failed for item ${item._id}:`, error.message);
            itemsToSync.push(item);
          }
        }

        // Handle conflicts that need manual resolution
        for (const { item, conflict, resolution } of conflictItems) {
          await SyncQueue.updateOne(
            { _id: item._id },
            {
              status: 'conflict',
              error: conflict.message || 'Conflict detected',
              'conflictData.serverData': conflict.serverData,
              'conflictData.localData': conflict.clientData,
              'conflictData.resolution': resolution?.requiresManualResolution ? 'manual' : (conflict.recommendedStrategy || 'manual'),
            }
          );
          results.conflicts++;
        }

        // Prepare sync payload for items without conflicts
        const syncData = {
          quizzes: [],
          drillLogs: [],
          games: [],
          modules: [],
        };

        for (const item of itemsToSync) {
          if (item.dataType === 'quiz') {
            syncData.quizzes.push(item.payload);
          } else if (item.dataType === 'drill') {
            syncData.drillLogs.push(item.payload);
          } else if (item.dataType === 'game') {
            syncData.games.push(item.payload);
          } else if (item.dataType === 'module') {
            syncData.modules.push(item.payload);
          }
        }

        // Sync the data
        if (itemsToSync.length > 0) {
          const userIdForSync = itemsToSync[0].userId;
          const syncResult = await syncOfflineData(userIdForSync, syncData);

          // Update queue items based on results
          let quizIndex = 0;
          let drillIndex = 0;
          let gameIndex = 0;

          for (const item of itemsToSync) {
            results.processed++;
            let itemSynced = false;

            if (item.dataType === 'quiz' && syncResult.quizzes.synced > quizIndex) {
              itemSynced = true;
              quizIndex++;
            } else if (item.dataType === 'drill' && syncResult.drillLogs.synced > drillIndex) {
              itemSynced = true;
              drillIndex++;
            } else if (item.dataType === 'game' && syncResult.games.synced > gameIndex) {
              itemSynced = true;
              gameIndex++;
            }

            if (itemSynced) {
              await SyncQueue.updateOne(
                { _id: item._id },
                {
                  status: 'synced',
                  syncedAt: new Date(),
                }
              );
              results.synced++;
            } else {
              // Check if retry limit reached
              const updatedItem = await SyncQueue.findById(item._id);
              if (updatedItem.retryCount >= updatedItem.maxRetries) {
                await SyncQueue.updateOne(
                  { _id: item._id },
                  {
                    status: 'failed',
                    error: 'Max retries exceeded',
                  }
                );
                results.failed++;
              } else {
                // Reset to pending for retry with exponential backoff
                const backoffDelay = Math.min(300000, Math.pow(2, updatedItem.retryCount) * 60000); // Max 5 minutes
                await SyncQueue.updateOne(
                  { _id: item._id },
                  {
                    status: 'pending',
                    $set: {
                      'metadata.retryAfter': new Date(Date.now() + backoffDelay),
                    },
                  }
                );
              }
            }
          }

          // Handle conflicts from sync result
          if (syncResult.conflicts && syncResult.conflicts.length > 0) {
            for (const conflict of syncResult.conflicts) {
              results.conflicts++;
              // Items already handled above, just log
              logger.warn(`Conflict during sync: ${conflict.type} - ${conflict.message}`);
            }
          }
        }
      } catch (error) {
        logger.error(`Error processing ${dataType} items:`, error);
        // Mark items as failed or reset for retry
        for (const item of items) {
          const updatedItem = await SyncQueue.findById(item._id);
          if (updatedItem.retryCount >= updatedItem.maxRetries) {
            await SyncQueue.updateOne(
              { _id: item._id },
              {
                status: 'failed',
                error: error.message,
              }
            );
            results.failed++;
          } else {
            // Exponential backoff
            const backoffDelay = Math.min(300000, Math.pow(2, updatedItem.retryCount) * 60000);
            await SyncQueue.updateOne(
              { _id: item._id },
              {
                status: 'pending',
                error: error.message,
                $set: {
                  'metadata.retryAfter': new Date(Date.now() + backoffDelay),
                },
              }
            );
          }
        }
      }
    }

    logger.info(
      `Processed sync queue: ${results.processed} items, ${results.synced} synced, ${results.failed} failed, ${results.conflicts} conflicts, ${results.autoResolved} auto-resolved`
    );

    return results;
  } catch (error) {
    logger.error('Process sync queue error:', error);
    throw error;
  }
};

/**
 * Check for conflicts before syncing
 * Phase 3.5.2: Enhanced conflict detection
 */
const checkForConflicts = async (queueItem, dataType) => {
  try {
    const { userId, payload } = queueItem;

    // Try to find existing data that might conflict
    let existingData = null;

    switch (dataType) {
      case 'quiz':
        if (payload.moduleId && payload.completedAt) {
          existingData = await QuizResult.findOne({
            userId,
            moduleId: payload.moduleId,
            completedAt: {
              $gte: new Date(new Date(payload.completedAt).getTime() - 60000), // Within 1 minute
              $lte: new Date(new Date(payload.completedAt).getTime() + 60000),
            },
          }).lean();
        }
        break;

      case 'drill':
        if (payload.drillId && payload.participatedAt) {
          existingData = await DrillLog.findOne({
            userId,
            drillId: payload.drillId,
            participatedAt: {
              $gte: new Date(new Date(payload.participatedAt).getTime() - 60000),
              $lte: new Date(new Date(payload.participatedAt).getTime() + 60000),
            },
          }).lean();
        }
        break;

      case 'game':
        if (payload.gameType && payload.completedAt) {
          existingData = await GameScore.findOne({
            userId,
            gameType: payload.gameType,
            completedAt: {
              $gte: new Date(new Date(payload.completedAt).getTime() - 60000),
              $lte: new Date(new Date(payload.completedAt).getTime() + 60000),
            },
          }).lean();
        }
        break;
    }

    if (existingData) {
      // Convert MongoDB document to plain object if needed
      const serverData = existingData._id ? { ...existingData, _id: existingData._id.toString() } : existingData;
      const clientData = payload;

      return detectConflict(serverData, clientData, dataType);
    }

    return { hasConflict: false };
  } catch (error) {
    logger.warn(`Conflict check error for ${dataType}:`, error.message);
    return { hasConflict: false }; // If check fails, assume no conflict
  }
};

/**
 * Resolve conflict manually
 * Phase 3.5.2: Enhanced with new conflict resolution strategies
 * @param {string} queueItemId - Queue item ID
 * @param {string} resolution - Resolution strategy
 * @param {Object} resolvedData - Resolved data (if merge or client-wins)
 */
export const resolveConflict = async (queueItemId, resolution, resolvedData = null) => {
  try {
    const queueItem = await SyncQueue.findById(queueItemId);
    if (!queueItem) {
      throw new Error('Queue item not found');
    }

    if (queueItem.status !== 'conflict') {
      throw new Error('Item is not in conflict state');
    }

    // Use enhanced conflict resolution service
    const conflict = {
      serverData: queueItem.conflictData?.serverData,
      clientData: queueItem.payload,
      type: queueItem.conflictData?.type || 'generic',
    };

    const resolutionResult = resolveConflictWithStrategy(conflict, resolution, {
      mergedData: resolvedData,
    });

    if (!resolutionResult.resolved && resolutionResult.requiresManualResolution) {
      // Still needs manual resolution
      return {
        success: false,
        message: 'Item requires manual resolution',
        conflict: conflict,
      };
    }

    let finalData = resolutionResult.data;

    if (resolution === RESOLUTION_STRATEGIES.SERVER_WINS) {
      // Use server data (already in database, don't sync)
      await SyncQueue.updateOne(
        { _id: queueItemId },
        {
          status: 'synced',
          syncedAt: new Date(),
          'conflictData.resolution': resolution,
        }
      );
      return { success: true, message: 'Conflict resolved: server data used' };
    }

    // Try to sync again with resolved data
    try {
      const syncData = {};
      if (queueItem.dataType === 'quiz') {
        syncData.quizzes = [finalData];
      } else if (queueItem.dataType === 'drill') {
        syncData.drillLogs = [finalData];
      } else if (queueItem.dataType === 'game') {
        syncData.games = [finalData];
      }

      // Use updateOne instead of insertMany for conflicts
      await syncOfflineData(queueItem.userId, syncData);

      await SyncQueue.updateOne(
        { _id: queueItemId },
        {
          status: 'synced',
          syncedAt: new Date(),
          'conflictData.resolution': resolution,
        }
      );

      return { success: true, message: 'Conflict resolved and synced successfully' };
    } catch (syncError) {
      await SyncQueue.updateOne(
        { _id: queueItemId },
        {
          status: 'failed',
          error: syncError.message,
          'conflictData.resolution': resolution,
        }
      );
      throw syncError;
    }
  } catch (error) {
    logger.error('Resolve conflict error:', error);
    throw error;
  }
};

/**
 * Get queue status for a user
 * Phase 3.5.2: Enhanced with more statistics
 * @param {string} userId - User ID
 * @returns {Object} Queue status
 */
export const getQueueStatus = async (userId) => {
  try {
    const userIdObj = typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId;
    
    const counts = await SyncQueue.aggregate([
      { $match: { userId: userIdObj } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const statusCounts = {
      pending: 0,
      processing: 0,
      synced: 0,
      failed: 0,
      conflict: 0,
    };

    for (const item of counts) {
      statusCounts[item._id] = item.count;
    }

    // Get conflicts for detailed info
    const conflicts = await SyncQueue.find({
      userId,
      status: 'conflict',
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Phase 3.5.2: Get queue statistics
    const stats = await SyncQueue.aggregate([
      { $match: { userId: userIdObj } },
      {
        $group: {
          _id: '$dataType',
          count: { $sum: 1 },
          avgPriority: { $avg: '$priority' },
        },
      },
    ]);

    return {
      ...statusCounts,
      total: Object.values(statusCounts).reduce((sum, count) => sum + count, 0),
      conflicts: conflicts.map((item) => ({
        id: item._id,
        dataType: item.dataType,
        error: item.error,
        createdAt: item.createdAt,
        resolution: item.conflictData?.resolution,
      })),
      stats: stats.reduce((acc, stat) => {
        acc[stat._id] = {
          count: stat.count,
          avgPriority: stat.avgPriority.toFixed(2),
        };
        return acc;
      }, {}),
    };
  } catch (error) {
    logger.error('Get queue status error:', error);
    throw error;
  }
};

/**
 * Clear old synced items (cleanup)
 * Phase 3.5.2: Enhanced cleanup with configurable retention
 * @param {number} daysOld - Delete items older than X days
 */
export const clearOldSyncedItems = async (daysOld = 7) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    // Phase 3.5.2: Also clean up old failed items (after longer retention)
    const failedCutoffDate = new Date();
    failedCutoffDate.setDate(failedCutoffDate.getDate() - (daysOld * 2)); // Keep failed items longer

    const syncedResult = await SyncQueue.deleteMany({
      status: 'synced',
      syncedAt: { $lt: cutoffDate },
    });

    const failedResult = await SyncQueue.deleteMany({
      status: 'failed',
      updatedAt: { $lt: failedCutoffDate },
    });

    logger.info(`Cleared ${syncedResult.deletedCount} old synced items and ${failedResult.deletedCount} old failed items`);
    return {
      synced: syncedResult.deletedCount,
      failed: failedResult.deletedCount,
      total: syncedResult.deletedCount + failedResult.deletedCount,
    };
  } catch (error) {
    logger.error('Clear old synced items error:', error);
    throw error;
  }
};

/**
 * Phase 3.5.2: Get queue statistics for monitoring
 */
export const getQueueStatistics = async () => {
  try {
    const stats = await SyncQueue.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgPriority: { $avg: '$priority' },
          avgRetryCount: { $avg: '$retryCount' },
        },
      },
    ]);

    const byType = await SyncQueue.aggregate([
      {
        $group: {
          _id: { status: '$status', dataType: '$dataType' },
          count: { $sum: 1 },
        },
      },
    ]);

    const oldestPending = await SyncQueue.findOne({ status: 'pending' })
      .sort({ createdAt: 1 })
      .lean();

    return {
      byStatus: stats.reduce((acc, stat) => {
        acc[stat._id] = {
          count: stat.count,
          avgPriority: stat.avgPriority?.toFixed(2) || 0,
          avgRetryCount: stat.avgRetryCount?.toFixed(2) || 0,
        };
        return acc;
      }, {}),
      byType,
      oldestPending: oldestPending ? {
        id: oldestPending._id,
        createdAt: oldestPending.createdAt,
        age: Math.floor((Date.now() - new Date(oldestPending.createdAt).getTime()) / (1000 * 60 * 60)), // hours
      } : null,
    };
  } catch (error) {
    logger.error('Get queue statistics error:', error);
    throw error;
  }
};
