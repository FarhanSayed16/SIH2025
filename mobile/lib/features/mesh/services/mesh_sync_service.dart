/// Phase 5.3: Mesh Sync Service
/// Syncs offline mesh messages to server when connectivity is restored

import '../../../core/services/api_service.dart';
import '../../../core/services/connectivity_service.dart';
import '../../../core/constants/api_endpoints.dart';
import '../models/mesh_message.dart';
import 'mesh_offline_queue.dart';
import 'package:flutter/foundation.dart';

/// Phase 5.3: Mesh Sync Service
/// Handles syncing offline mesh messages to server
class MeshSyncService {
  final ApiService _apiService;
  final ConnectivityService _connectivityService;
  final MeshOfflineQueue _offlineQueue;
  
  bool _isSyncing = false;

  MeshSyncService({
    ApiService? apiService,
    ConnectivityService? connectivityService,
    MeshOfflineQueue? offlineQueue,
  })  : _apiService = apiService ?? ApiService(),
        _connectivityService = connectivityService ?? ConnectivityService(),
        _offlineQueue = offlineQueue ?? MeshOfflineQueue();

  /// Initialize offline queue
  Future<void> initialize() async {
    await _offlineQueue.initialize();
  }

  /// Sync offline messages to server
  Future<Map<String, dynamic>> syncOfflineMessages({int batchSize = 50}) async {
    if (_isSyncing) {
      return {
        'success': false,
        'message': 'Sync already in progress',
      };
    }

    try {
      // Check connectivity
      if (!await _isOnline()) {
        return {
          'success': false,
          'message': 'No internet connection',
        };
      }

      // Get unsynced messages
      final unsyncedMessages = await _offlineQueue.getUnsyncedMessages(limit: batchSize);
      
      if (unsyncedMessages.isEmpty) {
        return {
          'success': true,
          'message': 'No messages to sync',
          'synced': 0,
        };
      }

      _isSyncing = true;

      // Prepare messages for sync
      final messagesToSync = unsyncedMessages.map((msg) => msg.toJson()).toList();

      // Sync to server
      // Phase 5.3: Server endpoint expects messages array
      // POST /api/mesh/sync
      // Body: { messages: [...] }
      
      final response = await _apiService.post(
        ApiEndpoints.meshSync,
        data: {
          'messages': messagesToSync,
        },
      );

      final responseData = response.data as Map<String, dynamic>?;
      final data = responseData?['data'] as Map<String, dynamic>? ?? responseData ?? {};
      final syncResults = data['syncResults'] as Map<String, dynamic>? ?? {};
      
      final synced = syncResults['synced'] as int? ?? 0;
      final duplicates = syncResults['duplicates'] as int? ?? 0;
      final failed = syncResults['failed'] as int? ?? 0;
      
      // Mark all messages as synced (server deduplicates)
      // Remove successfully synced messages from queue
      for (final msg in unsyncedMessages) {
        // Mark as synced and remove from queue
        await _offlineQueue.markAsSynced(msg.msgId);
        await _offlineQueue.removeMessage(msg.msgId);
      }

      if (kDebugMode) {
        print('📤 Mesh Sync: Synced $synced messages (${duplicates} duplicates, ${failed} failed)');
      }

      return {
        'success': true,
        'message': 'Sync completed',
        'synced': synced,
        'duplicates': duplicates,
        'failed': failed,
        'total': unsyncedMessages.length,
      };
    } catch (e) {
      if (kDebugMode) {
        print('❌ Mesh Sync: Error syncing messages: $e');
      }
      return {
        'success': false,
        'message': 'Sync failed: $e',
      };
    } finally {
      _isSyncing = false;
    }
  }

  /// Add message to offline queue
  Future<void> queueMessage(MeshMessage message) async {
    await _offlineQueue.initialize();
    await _offlineQueue.addMessage(message);
    
    // Try to sync immediately if online
    if (await _isOnline()) {
      // Trigger sync in background (don't await)
      syncOfflineMessages();
    }
  }

  /// Get queue statistics
  Future<Map<String, dynamic>> getQueueStatistics() async {
    await _offlineQueue.initialize();
    return await _offlineQueue.getStatistics();
  }

  /// Clear old synced messages
  Future<void> clearOldSyncedMessages({Duration maxAge = const Duration(days: 7)}) async {
    await _offlineQueue.initialize();
    await _offlineQueue.clearOldSyncedMessages(maxAge: maxAge);
  }

  /// Check if device is online
  Future<bool> _isOnline() async {
    try {
      // Use connectivity service if available
      final isOnline = await _connectivityService.checkOnline();
      return isOnline;
    } catch (e) {
      return false;
    }
  }

}

