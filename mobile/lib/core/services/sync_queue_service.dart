/// Phase 3.4.0: Sync Queue Service
/// Manages sync queue with priority, retry, and persistence

import 'dart:async';
import 'package:hive_flutter/hive_flutter.dart';
import 'storage_service.dart';
import 'api_service.dart';
import '../constants/api_endpoints.dart';
import '../../features/sync/models/sync_queue_model.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/foundation.dart';
import 'package:device_info_plus/device_info_plus.dart';

class SyncQueueService {
  final StorageService _storageService;
  final ApiService _apiService;
  final Connectivity _connectivity = Connectivity();

  static const String _syncQueueBoxName = 'syncQueueBox';
  Box<dynamic>? _syncQueueBox;

  Timer? _backgroundSyncTimer;
  bool _isProcessing = false;
  StreamController<SyncQueueStatus>? _statusController;

  SyncQueueService({
    StorageService? storageService,
    ApiService? apiService,
  })  : _storageService = storageService ?? StorageService(),
        _apiService = apiService ?? ApiService();

  /// Initialize sync queue storage
  Future<void> initialize() async {
    _syncQueueBox = await _storageService.openBox(_syncQueueBoxName);
  }

  /// Get sync queue status stream
  Stream<SyncQueueStatus> get statusStream {
    _statusController ??= StreamController<SyncQueueStatus>.broadcast();
    return _statusController!.stream;
  }

  /// Check if device is online
  Future<bool> _isOnline() async {
    try {
      final connectivityResult = await _connectivity.checkConnectivity();
      return connectivityResult != ConnectivityResult.none;
    } catch (e) {
      return false;
    }
  }

  /// Get device metadata
  Future<SyncMetadata> _getMetadata() async {
    try {
      final deviceInfo = DeviceInfoPlugin();
      String? deviceId;
      
      if (defaultTargetPlatform == TargetPlatform.android) {
        final androidInfo = await deviceInfo.androidInfo;
        deviceId = androidInfo.id;
      } else if (defaultTargetPlatform == TargetPlatform.iOS) {
        final iosInfo = await deviceInfo.iosInfo;
        deviceId = iosInfo.identifierForVendor;
      }

      // Get app version from constants (package_info_plus not needed)
      return SyncMetadata(
        deviceId: deviceId,
        appVersion: '1.0.0', // Use from AppConstants if needed
        syncVersion: '1.0',
        createdAt: DateTime.now(),
      );
    } catch (e) {
      debugPrint('Error getting metadata: $e');
      return SyncMetadata(
        appVersion: '1.0.0',
        syncVersion: '1.0',
        createdAt: DateTime.now(),
      );
    }
  }

  /// Add item to sync queue
  Future<String> addToQueue({
    required String dataType,
    required Map<String, dynamic> payload,
    int priority = 5,
    int maxRetries = 3,
    DateTime? createdAt,
  }) async {
    try {
      await initialize();
      final metadata = await _getMetadata();

      final item = SyncQueueItem(
        id: '${dataType}_${DateTime.now().millisecondsSinceEpoch}_${payload.hashCode}',
        dataType: dataType,
        priority: priority,
        status: 'pending',
        payload: payload,
        maxRetries: maxRetries,
        metadata: metadata.copyWith(createdAt: createdAt ?? DateTime.now()),
        createdAt: createdAt ?? DateTime.now(),
        updatedAt: DateTime.now(),
      );

      await _syncQueueBox!.put(item.id, item.toJson());

      debugPrint('✅ Added ${dataType} to sync queue (priority: $priority, id: ${item.id})');

      // Notify listeners
      _notifyStatusUpdate();

      return item.id;
    } catch (e) {
      debugPrint('❌ Error adding to sync queue: $e');
      rethrow;
    }
  }

  /// Get pending items from queue (ordered by priority)
  Future<List<SyncQueueItem>> getPendingItems({int limit = 10}) async {
    try {
      await initialize();
      final allItems = <SyncQueueItem>[];

      for (var key in _syncQueueBox!.keys) {
        final data = _syncQueueBox!.get(key);
        if (data != null && data is Map) {
          try {
            final item = SyncQueueItem.fromJson(Map<String, dynamic>.from(data));
            if (item.status == 'pending') {
              allItems.add(item);
            }
          } catch (e) {
            debugPrint('Error parsing queue item: $e');
          }
        }
      }

      // Sort by priority (lower = higher priority), then by creation time
      allItems.sort((a, b) {
        final priorityCompare = a.priority.compareTo(b.priority);
        if (priorityCompare != 0) return priorityCompare;
        return a.createdAt.compareTo(b.createdAt);
      });

      return allItems.take(limit).toList();
    } catch (e) {
      debugPrint('Error getting pending items: $e');
      return [];
    }
  }

  /// Get conflicts
  Future<List<SyncQueueItem>> getConflicts() async {
    try {
      await initialize();
      final conflicts = <SyncQueueItem>[];

      for (var key in _syncQueueBox!.keys) {
        final data = _syncQueueBox!.get(key);
        if (data != null && data is Map) {
          try {
            final item = SyncQueueItem.fromJson(Map<String, dynamic>.from(data));
            if (item.status == 'conflict') {
              conflicts.add(item);
            }
          } catch (e) {
            debugPrint('Error parsing conflict item: $e');
          }
        }
      }

      conflicts.sort((a, b) => (a.createdAt).compareTo(b.createdAt));
      return conflicts;
    } catch (e) {
      debugPrint('Error getting conflicts: $e');
      return [];
    }
  }

  /// Process sync queue
  Future<SyncResult> processQueue({int batchSize = 10, bool force = false}) async {
    if (_isProcessing && !force) {
      return SyncResult(
        success: false,
        message: 'Queue processing already in progress',
      );
    }

    _isProcessing = true;

    try {
      if (!await _isOnline()) {
        return SyncResult(
          success: false,
          message: 'No internet connection',
        );
      }

      final pendingItems = await getPendingItems(limit: batchSize);
      if (pendingItems.isEmpty) {
        _isProcessing = false;
        return SyncResult(
          success: true,
          message: 'No pending items to sync',
          processed: 0,
          synced: 0,
          failed: 0,
        );
      }

      // Group items by data type
      final groupedByType = <String, List<SyncQueueItem>>{};
      for (final item in pendingItems) {
        groupedByType.putIfAbsent(item.dataType, () => []).add(item);
      }

      int processed = 0;
      int synced = 0;
      int failed = 0;
      final errors = <String>[];

      // Process each type
      for (final entry in groupedByType.entries) {
        final dataType = entry.key;
        final items = entry.value;

        // Update status to processing
        for (final item in items) {
          await _updateItemStatus(item.id, 'processing', retryCount: item.retryCount + 1);
        }

        try {
          // Prepare sync payload
          final syncPayload = <String, dynamic>{
            'useQueue': false, // Direct sync
          };

          if (dataType == 'quiz') {
            syncPayload['quizzes'] = items.map((item) => item.payload).toList();
          } else if (dataType == 'drill') {
            syncPayload['drillLogs'] = items.map((item) => item.payload).toList();
          } else if (dataType == 'game') {
            syncPayload['games'] = items.map((item) => item.payload).toList();
          }

          // Sync to backend
          final response = await _apiService.post(
            ApiEndpoints.sync,
            data: syncPayload,
          );

          if (response.statusCode == 200 || response.statusCode == 201) {
            final result = response.data['data'] ?? response.data;

            // Update items based on result
            for (final item in items) {
              processed++;
              bool itemSynced = false;

              if (dataType == 'quiz') {
                final syncedCount = (result['quizzes']?['synced'] as int?) ?? 0;
                if (syncedCount > 0) {
                  itemSynced = true;
                }
              } else if (dataType == 'drill') {
                final syncedCount = (result['drillLogs']?['synced'] as int?) ?? 0;
                if (syncedCount > 0) {
                  itemSynced = true;
                }
              } else if (dataType == 'game') {
                final syncedCount = (result['games']?['synced'] as int?) ?? 0;
                if (syncedCount > 0) {
                  itemSynced = true;
                }
              }

              if (itemSynced) {
                await _updateItemStatus(item.id, 'synced', syncedAt: DateTime.now());
                synced++;
              } else {
                // Check if max retries reached
                if (item.retryCount >= item.maxRetries) {
                  await _updateItemStatus(item.id, 'failed', error: 'Max retries exceeded');
                  failed++;
                } else {
                  await _updateItemStatus(item.id, 'pending');
                }
              }
            }
          } else {
            throw Exception(response.data['message'] ?? 'Sync failed');
          }
        } catch (e) {
          debugPrint('Error syncing ${dataType}: $e');
          // Update items based on retry count
          for (final item in items) {
            processed++;
            if (item.retryCount >= item.maxRetries) {
              await _updateItemStatus(item.id, 'failed', error: e.toString());
              failed++;
            } else {
              await _updateItemStatus(item.id, 'pending', error: e.toString());
            }
          }
          errors.add('${dataType}: ${e.toString()}');
        }
      }

      _notifyStatusUpdate();

      return SyncResult(
        success: synced > 0,
        message: 'Processed $processed items: $synced synced, $failed failed',
        processed: processed,
        synced: synced,
        failed: failed,
        errors: errors,
      );
    } catch (e) {
      debugPrint('Error processing queue: $e');
      return SyncResult(
        success: false,
        message: 'Queue processing error: $e',
      );
    } finally {
      _isProcessing = false;
    }
  }

  /// Update item status
  Future<void> _updateItemStatus(
    String itemId,
    String status, {
    int? retryCount,
    DateTime? syncedAt,
    String? error,
  }) async {
    try {
      await initialize();
      final data = _syncQueueBox!.get(itemId);
      if (data != null && data is Map) {
        final item = SyncQueueItem.fromJson(Map<String, dynamic>.from(data));
        final updated = item.copyWith(
          status: status,
          retryCount: retryCount ?? item.retryCount,
          syncedAt: syncedAt ?? item.syncedAt,
          error: error ?? item.error,
          lastAttemptAt: DateTime.now(),
          updatedAt: DateTime.now(),
        );
        await _syncQueueBox!.put(itemId, updated.toJson());
      }
    } catch (e) {
      debugPrint('Error updating item status: $e');
    }
  }

  /// Resolve conflict
  Future<bool> resolveConflict({
    required String itemId,
    required String resolution, // 'server-wins', 'client-wins', 'merge'
    Map<String, dynamic>? resolvedData,
  }) async {
    try {
      if (!await _isOnline()) {
        throw Exception('No internet connection');
      }

      final response = await _apiService.post(
        ApiEndpoints.resolveConflict(itemId),
        data: {
          'resolution': resolution,
          if (resolvedData != null) 'resolvedData': resolvedData,
        },
      );

      if (response.statusCode == 200) {
        // Remove from local queue if resolved
        await _removeItem(itemId);
        _notifyStatusUpdate();
        return true;
      }

      return false;
    } catch (e) {
      debugPrint('Error resolving conflict: $e');
      return false;
    }
  }

  /// Remove item from queue
  Future<void> _removeItem(String itemId) async {
    try {
      await initialize();
      await _syncQueueBox!.delete(itemId);
    } catch (e) {
      debugPrint('Error removing item: $e');
    }
  }

  /// Get queue status
  Future<SyncQueueStatus> getQueueStatus() async {
    try {
      await initialize();
      final pending = await getPendingItems(limit: 1000);
      final conflicts = await getConflicts();

      int processing = 0;
      int synced = 0;
      int failed = 0;

      for (var key in _syncQueueBox!.keys) {
        final data = _syncQueueBox!.get(key);
        if (data != null && data is Map) {
          try {
            final item = SyncQueueItem.fromJson(Map<String, dynamic>.from(data));
            if (item.status == 'processing') processing++;
            if (item.status == 'synced') synced++;
            if (item.status == 'failed') failed++;
          } catch (e) {
            // Skip invalid items
          }
        }
      }

      return SyncQueueStatus(
        pending: pending.length,
        processing: processing,
        synced: synced,
        failed: failed,
        conflict: conflicts.length,
        total: pending.length + processing + synced + failed + conflicts.length,
        conflicts: conflicts.map((c) => ConflictItem(
          id: c.id,
          dataType: c.dataType,
          error: c.error,
          createdAt: c.createdAt,
        )).toList(),
      );
    } catch (e) {
      debugPrint('Error getting queue status: $e');
      return SyncQueueStatus();
    }
  }

  /// Start background sync (process queue periodically)
  void startBackgroundSync({Duration interval = const Duration(minutes: 5)}) {
    _backgroundSyncTimer?.cancel();
    _backgroundSyncTimer = Timer.periodic(interval, (_) async {
      if (await _isOnline() && !_isProcessing) {
        await processQueue();
      }
    });
    debugPrint('✅ Background sync queue processing started');
  }

  /// Stop background sync
  void stopBackgroundSync() {
    _backgroundSyncTimer?.cancel();
    _backgroundSyncTimer = null;
    debugPrint('⏹️  Background sync queue processing stopped');
  }

  /// Notify status update
  void _notifyStatusUpdate() {
    getQueueStatus().then((status) {
      _statusController?.add(status);
    });
  }

  /// Clear old synced items (cleanup)
  Future<int> clearOldSyncedItems({int daysOld = 7}) async {
    try {
      await initialize();
      final cutoffDate = DateTime.now().subtract(Duration(days: daysOld));
      int cleared = 0;

      for (var key in _syncQueueBox!.keys) {
        final data = _syncQueueBox!.get(key);
        if (data != null && data is Map) {
          try {
            final item = SyncQueueItem.fromJson(Map<String, dynamic>.from(data));
            if (item.status == 'synced' && item.syncedAt != null && item.syncedAt!.isBefore(cutoffDate)) {
              await _syncQueueBox!.delete(key);
              cleared++;
            }
          } catch (e) {
            // Skip invalid items
          }
        }
      }

      if (cleared > 0) {
        _notifyStatusUpdate();
      }

      return cleared;
    } catch (e) {
      debugPrint('Error clearing old items: $e');
      return 0;
    }
  }

  /// Dispose resources
  void dispose() {
    stopBackgroundSync();
    _statusController?.close();
    _statusController = null;
  }
}

class SyncResult {
  final bool success;
  final String message;
  final int processed;
  final int synced;
  final int failed;
  final List<String> errors;

  SyncResult({
    required this.success,
    required this.message,
    this.processed = 0,
    this.synced = 0,
    this.failed = 0,
    this.errors = const [],
  });
}

