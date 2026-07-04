/// Phase 5.3: Mesh Offline Queue Service
/// Stores mesh messages in Hive for offline persistence and sync

import 'package:hive_flutter/hive_flutter.dart';
import '../../../core/services/storage_service.dart';
import '../models/mesh_message.dart';
import 'package:flutter/foundation.dart';

/// Phase 5.3: Mesh Offline Queue
/// Persists mesh messages for offline sync
class MeshOfflineQueue {
  final StorageService _storageService;
  static const String _queueBoxName = 'meshOfflineQueueBox';
  Box<dynamic>? _queueBox;

  MeshOfflineQueue({
    StorageService? storageService,
  }) : _storageService = storageService ?? StorageService();

  /// Initialize queue storage
  Future<void> initialize() async {
    if (_queueBox == null || !_queueBox!.isOpen) {
      _queueBox = await _storageService.openBox(_queueBoxName);
    }
  }

  /// Add message to offline queue
  Future<void> addMessage(MeshMessage message) async {
    await initialize();
    
    try {
      // Store message with msgId as key for deduplication
      final messageJson = message.toJson();
      await _queueBox!.put(message.msgId, {
        ...messageJson,
        'queuedAt': DateTime.now().millisecondsSinceEpoch,
        'synced': false,
      });
      
      if (kDebugMode) {
        print('📦 Mesh Queue: Added message ${message.msgId} to offline queue');
      }
    } catch (e) {
      if (kDebugMode) {
        print('⚠️ Mesh Queue: Error adding message: $e');
      }
      rethrow;
    }
  }

  /// Get all unsynced messages
  Future<List<MeshMessage>> getUnsyncedMessages({int? limit}) async {
    await initialize();
    
    try {
      final messages = <MeshMessage>[];
      
      for (final key in _queueBox!.keys) {
        final item = _queueBox!.get(key);
        if (item is Map) {
          final synced = item['synced'] as bool? ?? false;
          if (!synced) {
            try {
              // Remove queue-specific fields before creating message
              final messageData = Map<String, dynamic>.from(item);
              messageData.remove('queuedAt');
              messageData.remove('synced');
              
              final message = MeshMessage.fromJson(messageData);
              messages.add(message);
              
              // Limit results if specified
              if (limit != null && messages.length >= limit) {
                break;
              }
            } catch (e) {
              if (kDebugMode) {
                print('⚠️ Mesh Queue: Error parsing message $key: $e');
              }
            }
          }
        }
      }
      
      // Sort by timestamp (oldest first)
      messages.sort((a, b) => a.timestamp.compareTo(b.timestamp));
      
      return messages;
    } catch (e) {
      if (kDebugMode) {
        print('⚠️ Mesh Queue: Error getting unsynced messages: $e');
      }
      return [];
    }
  }

  /// Mark message as synced
  Future<void> markAsSynced(String msgId) async {
    await initialize();
    
    try {
      final item = _queueBox!.get(msgId);
      if (item is Map) {
        final updatedItem = Map<String, dynamic>.from(item);
        updatedItem['synced'] = true;
        updatedItem['syncedAt'] = DateTime.now().millisecondsSinceEpoch;
        await _queueBox!.put(msgId, updatedItem);
        
        if (kDebugMode) {
          print('✅ Mesh Queue: Marked message $msgId as synced');
        }
      }
    } catch (e) {
      if (kDebugMode) {
        print('⚠️ Mesh Queue: Error marking message as synced: $e');
      }
    }
  }

  /// Remove message from queue (after successful sync)
  Future<void> removeMessage(String msgId) async {
    await initialize();
    
    try {
      await _queueBox!.delete(msgId);
      
      if (kDebugMode) {
        print('🗑️ Mesh Queue: Removed message $msgId from queue');
      }
    } catch (e) {
      if (kDebugMode) {
        print('⚠️ Mesh Queue: Error removing message: $e');
      }
    }
  }

  /// Check if message exists in queue
  Future<bool> hasMessage(String msgId) async {
    await initialize();
    return _queueBox!.containsKey(msgId);
  }

  /// Get queue size
  Future<int> getQueueSize() async {
    await initialize();
    return _queueBox!.length;
  }

  /// Get synced count
  Future<int> getSyncedCount() async {
    await initialize();
    
    int count = 0;
    for (final key in _queueBox!.keys) {
      final item = _queueBox!.get(key);
      if (item is Map) {
        final synced = item['synced'] as bool? ?? false;
        if (synced) {
          count++;
        }
      }
    }
    return count;
  }

  /// Clear old synced messages (older than specified duration)
  Future<void> clearOldSyncedMessages({Duration maxAge = const Duration(days: 7)}) async {
    await initialize();
    
    try {
      final now = DateTime.now().millisecondsSinceEpoch;
      final cutoff = now - maxAge.inMilliseconds;
      
      final keysToDelete = <dynamic>[];
      
      for (final key in _queueBox!.keys) {
        final item = _queueBox!.get(key);
        if (item is Map) {
          final synced = item['synced'] as bool? ?? false;
          final syncedAt = item['syncedAt'] as int?;
          
          if (synced && syncedAt != null && syncedAt < cutoff) {
            keysToDelete.add(key);
          }
        }
      }
      
      for (final key in keysToDelete) {
        await _queueBox!.delete(key);
      }
      
      if (kDebugMode && keysToDelete.isNotEmpty) {
        print('🧹 Mesh Queue: Cleared ${keysToDelete.length} old synced messages');
      }
    } catch (e) {
      if (kDebugMode) {
        print('⚠️ Mesh Queue: Error clearing old messages: $e');
      }
    }
  }

  /// Clear all messages from queue
  Future<void> clearAll() async {
    await initialize();
    await _queueBox!.clear();
    
    if (kDebugMode) {
      print('🗑️ Mesh Queue: Cleared all messages');
    }
  }

  /// Get queue statistics
  Future<Map<String, dynamic>> getStatistics() async {
    await initialize();
    
    int total = 0;
    int synced = 0;
    int unsynced = 0;
    final oldestTimestamp = <int>[];
    
    for (final key in _queueBox!.keys) {
      final item = _queueBox!.get(key);
      if (item is Map) {
        total++;
        final syncedFlag = item['synced'] as bool? ?? false;
        if (syncedFlag) {
          synced++;
        } else {
          unsynced++;
          final timestamp = item['timestamp'] as int?;
          if (timestamp != null) {
            oldestTimestamp.add(timestamp);
          }
        }
      }
    }
    
    return {
      'total': total,
      'synced': synced,
      'unsynced': unsynced,
      'oldestTimestamp': oldestTimestamp.isNotEmpty 
          ? oldestTimestamp.reduce((a, b) => a < b ? a : b)
          : null,
    };
  }
}

