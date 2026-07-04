/// Phase 5.4: Message Deduplicator Service
/// LRU cache for seen messages with persistence across app restarts

import 'dart:collection';
import 'package:hive_flutter/hive_flutter.dart';
import '../../../core/services/storage_service.dart';
import 'package:flutter/foundation.dart';

/// Phase 5.4: Message Deduplicator
/// Manages seen message IDs with LRU cache and persistence
class MessageDeduplicator {
  final StorageService _storageService;
  static const String _seenMessagesBoxName = 'meshSeenMessagesBox';
  static const int maxSize = 10000; // Cap at 10k IDs
  static const Duration cleanupAge = Duration(hours: 1); // Cleanup entries older than 1 hour

  Box<dynamic>? _seenMessagesBox;
  final LinkedHashMap<String, DateTime> _seenMessagesLRU = LinkedHashMap();

  MessageDeduplicator({
    StorageService? storageService,
  }) : _storageService = storageService ?? StorageService();

  /// Initialize deduplicator storage
  Future<void> initialize() async {
    if (_seenMessagesBox == null || !_seenMessagesBox!.isOpen) {
      _seenMessagesBox = await _storageService.openBox(_seenMessagesBoxName);
      
      // Load persisted seen messages
      await _loadPersistedMessages();
      
      // Cleanup old entries
      await cleanup();
      
      if (kDebugMode) {
        print('✅ Message Deduplicator: Initialized with ${_seenMessagesLRU.length} persisted messages');
      }
    }
  }

  /// Load persisted seen messages from storage
  Future<void> _loadPersistedMessages() async {
    try {
      if (_seenMessagesBox == null) return;
      
      final keys = _seenMessagesBox!.keys.toList();
      for (final key in keys) {
        if (key is String) {
          final timestampMillis = _seenMessagesBox!.get(key) as int?;
          if (timestampMillis != null) {
            final timestamp = DateTime.fromMillisecondsSinceEpoch(timestampMillis);
            // Only load if not too old
            if (DateTime.now().difference(timestamp) < cleanupAge) {
              _seenMessagesLRU[key] = timestamp;
            } else {
              // Remove old entry
              await _seenMessagesBox!.delete(key);
            }
          }
        }
      }
    } catch (e) {
      if (kDebugMode) {
        print('⚠️ Message Deduplicator: Error loading persisted messages: $e');
      }
    }
  }

  /// Check if message ID has been seen
  bool hasSeen(String msgId) {
    return _seenMessagesLRU.containsKey(msgId);
  }

  /// Mark message ID as seen
  /// Phase 5.4: LRU cache with persistence
  Future<void> markSeen(String msgId) async {
    await initialize();
    
    final now = DateTime.now();
    
    // Remove oldest if at capacity (LRU)
    if (_seenMessagesLRU.length >= maxSize) {
      final oldestKey = _seenMessagesLRU.keys.first;
      _seenMessagesLRU.remove(oldestKey);
      
      // Remove from persistent storage
      try {
        await _seenMessagesBox?.delete(oldestKey);
      } catch (e) {
        if (kDebugMode) {
          print('⚠️ Message Deduplicator: Error removing oldest entry: $e');
        }
      }
    }
    
    // Add/update message ID (move to end for LRU)
    if (_seenMessagesLRU.containsKey(msgId)) {
      // Remove and re-add to move to end (most recently used)
      _seenMessagesLRU.remove(msgId);
    }
    _seenMessagesLRU[msgId] = now;
    
    // Persist to storage
    try {
      await _seenMessagesBox?.put(msgId, now.millisecondsSinceEpoch);
    } catch (e) {
      if (kDebugMode) {
        print('⚠️ Message Deduplicator: Error persisting seen message: $e');
      }
    }
  }

  /// Cleanup old entries (older than cleanupAge)
  Future<void> cleanup() async {
    await initialize();
    
    try {
      final cutoffTime = DateTime.now().subtract(cleanupAge);
      final toRemove = <String>[];
      
      _seenMessagesLRU.forEach((msgId, timestamp) {
        if (timestamp.isBefore(cutoffTime)) {
          toRemove.add(msgId);
        }
      });
      
      for (final msgId in toRemove) {
        _seenMessagesLRU.remove(msgId);
        await _seenMessagesBox?.delete(msgId);
      }
      
      if (kDebugMode && toRemove.isNotEmpty) {
        print('🧹 Message Deduplicator: Cleaned up ${toRemove.length} old entries');
      }
    } catch (e) {
      if (kDebugMode) {
        print('⚠️ Message Deduplicator: Error during cleanup: $e');
      }
    }
  }

  /// Get statistics
  Map<String, dynamic> getStatistics() {
    return {
      'totalSeen': _seenMessagesLRU.length,
      'maxSize': maxSize,
      'cleanupAge': cleanupAge.inHours,
      'oldestEntry': _seenMessagesLRU.values.isNotEmpty
          ? _seenMessagesLRU.values.first.toIso8601String()
          : null,
      'newestEntry': _seenMessagesLRU.values.isNotEmpty
          ? _seenMessagesLRU.values.last.toIso8601String()
          : null,
    };
  }

  /// Clear all seen messages (for testing)
  Future<void> clear() async {
    await initialize();
    
    _seenMessagesLRU.clear();
    
    try {
      await _seenMessagesBox?.clear();
      
      if (kDebugMode) {
        print('🗑️ Message Deduplicator: Cleared all seen messages');
      }
    } catch (e) {
      if (kDebugMode) {
        print('⚠️ Message Deduplicator: Error clearing: $e');
      }
    }
  }

  /// Get count of seen messages
  int get count => _seenMessagesLRU.length;
}

