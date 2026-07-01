/// Phase 3.2.5: Offline Game Service
/// Handles offline game storage, state persistence, and sync

import '../../../core/services/storage_service.dart';
import '../../../core/constants/app_constants.dart';
import '../models/game_models.dart';

class OfflineGameService {
  final StorageService _storageService;

  OfflineGameService({StorageService? storageService})
      : _storageService = storageService ?? StorageService();

  /// Save game state offline
  Future<void> saveGameState({
    required String gameType,
    required Map<String, dynamic> gameState,
    String? gameId,
  }) async {
    try {
      final box = await _storageService.openBox(AppConstants.gameStatesBox);
      final stateKey =
          gameId ?? '${gameType}_${DateTime.now().millisecondsSinceEpoch}';

      await box.put(stateKey, {
        'gameType': gameType,
        'gameId': stateKey,
        'state': gameState,
        'savedAt': DateTime.now().toIso8601String(),
        'synced': false,
      });

      print('✅ Game state saved offline: $stateKey');
    } catch (e) {
      print('❌ Error saving game state offline: $e');
      rethrow;
    }
  }

  /// Get saved game state
  Future<Map<String, dynamic>?> getGameState(String gameId) async {
    try {
      final box = await _storageService.openBox(AppConstants.gameStatesBox);
      final state = box.get(gameId);

      if (state != null && state is Map) {
        return Map<String, dynamic>.from(state);
      }
      return null;
    } catch (e) {
      print('❌ Error getting game state: $e');
      return null;
    }
  }

  /// Get all unsynced game states
  Future<List<Map<String, dynamic>>> getUnsyncedStates() async {
    try {
      final box = await _storageService.openBox(AppConstants.gameStatesBox);
      final allKeys = box.keys.toList();
      final unsyncedStates = <Map<String, dynamic>>[];

      for (final key in allKeys) {
        final state = box.get(key);
        if (state != null && state is Map) {
          final synced = state['synced'] as bool? ?? false;
          if (!synced) {
            unsyncedStates.add({
              'gameId': key.toString(),
              ...Map<String, dynamic>.from(state),
            });
          }
        }
      }

      return unsyncedStates;
    } catch (e) {
      print('❌ Error getting unsynced states: $e');
      return [];
    }
  }

  /// Save game score offline (pending sync)
  Future<void> savePendingScore(GameScore score) async {
    try {
      final box = await _storageService.openBox(AppConstants.gameScoresBox);
      final scoreKey =
          score.id ?? 'pending_${DateTime.now().millisecondsSinceEpoch}';

      await box.put(scoreKey, {
        'gameScore': score.toJson(),
        'savedAt': DateTime.now().toIso8601String(),
        'synced': false,
        'syncAttempts': 0,
      });

      print('✅ Game score saved offline (pending sync): $scoreKey');
    } catch (e) {
      print('❌ Error saving pending score: $e');
      rethrow;
    }
  }

  /// Get all pending scores
  Future<List<GameScore>> getPendingScores() async {
    try {
      final box = await _storageService.openBox(AppConstants.gameScoresBox);
      final allKeys = box.keys.toList();
      final pendingScores = <GameScore>[];

      for (final key in allKeys) {
        final data = box.get(key);
        if (data != null && data is Map) {
          final synced = data['synced'] as bool? ?? false;
          if (!synced) {
            final scoreData = data['gameScore'] as Map<String, dynamic>?;
            if (scoreData != null) {
              try {
                final score = GameScore.fromJson(scoreData);
                pendingScores.add(score);
              } catch (e) {
                print('⚠️ Error parsing pending score $key: $e');
              }
            }
          }
        }
      }

      return pendingScores;
    } catch (e) {
      print('❌ Error getting pending scores: $e');
      return [];
    }
  }

  /// Mark score as synced
  Future<void> markScoreAsSynced(String scoreKey) async {
    try {
      final box = await _storageService.openBox(AppConstants.gameScoresBox);
      final data = box.get(scoreKey);

      if (data != null && data is Map) {
        await box.put(scoreKey, {
          ...Map<String, dynamic>.from(data),
          'synced': true,
          'syncedAt': DateTime.now().toIso8601String(),
        });
        print('✅ Score marked as synced: $scoreKey');
      }
    } catch (e) {
      print('❌ Error marking score as synced: $e');
    }
  }

  /// Mark game state as synced
  Future<void> markStateAsSynced(String gameId) async {
    try {
      final box = await _storageService.openBox(AppConstants.gameStatesBox);
      final data = box.get(gameId);

      if (data != null && data is Map) {
        await box.put(gameId, {
          ...Map<String, dynamic>.from(data),
          'synced': true,
          'syncedAt': DateTime.now().toIso8601String(),
        });
        print('✅ Game state marked as synced: $gameId');
      }
    } catch (e) {
      print('❌ Error marking state as synced: $e');
    }
  }

  /// Clear synced data (cleanup old synced records)
  Future<void> clearSyncedData({Duration? olderThan}) async {
    try {
      final cutoffDate =
          DateTime.now().subtract(olderThan ?? const Duration(days: 30));

      // Clear synced scores
      final scoresBox =
          await _storageService.openBox(AppConstants.gameScoresBox);
      final scoreKeys = scoresBox.keys.toList();

      for (final key in scoreKeys) {
        final data = scoresBox.get(key);
        if (data != null && data is Map) {
          final synced = data['synced'] as bool? ?? false;
          final syncedAt = data['syncedAt'] as String?;

          if (synced && syncedAt != null) {
            final syncedDate = DateTime.tryParse(syncedAt);
            if (syncedDate != null && syncedDate.isBefore(cutoffDate)) {
              await scoresBox.delete(key);
            }
          }
        }
      }

      // Clear synced game states
      final statesBox =
          await _storageService.openBox(AppConstants.gameStatesBox);
      final stateKeys = statesBox.keys.toList();

      for (final key in stateKeys) {
        final data = statesBox.get(key);
        if (data != null && data is Map) {
          final synced = data['synced'] as bool? ?? false;
          final syncedAt = data['syncedAt'] as String?;

          if (synced && syncedAt != null) {
            final syncedDate = DateTime.tryParse(syncedAt);
            if (syncedDate != null && syncedDate.isBefore(cutoffDate)) {
              await statesBox.delete(key);
            }
          }
        }
      }

      print('✅ Cleared old synced data');
    } catch (e) {
      print('❌ Error clearing synced data: $e');
    }
  }

  /// Delete game state
  Future<void> deleteGameState(String gameId) async {
    try {
      final box = await _storageService.openBox(AppConstants.gameStatesBox);
      await box.delete(gameId);
      print('✅ Game state deleted: $gameId');
    } catch (e) {
      print('❌ Error deleting game state: $e');
    }
  }

  /// Delete pending score
  Future<void> deletePendingScore(String scoreKey) async {
    try {
      final box = await _storageService.openBox(AppConstants.gameScoresBox);
      await box.delete(scoreKey);
      print('✅ Pending score deleted: $scoreKey');
    } catch (e) {
      print('❌ Error deleting pending score: $e');
    }
  }

  /// Get storage statistics
  Future<Map<String, dynamic>> getStorageStats() async {
    try {
      final scoresBox =
          await _storageService.openBox(AppConstants.gameScoresBox);
      final statesBox =
          await _storageService.openBox(AppConstants.gameStatesBox);

      final allScores = scoresBox.keys.toList();
      final allStates = statesBox.keys.toList();

      int syncedScores = 0;
      int pendingScores = 0;

      for (final key in allScores) {
        final data = scoresBox.get(key);
        if (data != null && data is Map) {
          if (data['synced'] == true) {
            syncedScores++;
          } else {
            pendingScores++;
          }
        }
      }

      return {
        'totalScores': allScores.length,
        'syncedScores': syncedScores,
        'pendingScores': pendingScores,
        'totalStates': allStates.length,
        'lastSync': null, // TODO: Track last sync time
      };
    } catch (e) {
      print('❌ Error getting storage stats: $e');
      return {
        'totalScores': 0,
        'syncedScores': 0,
        'pendingScores': 0,
        'totalStates': 0,
      };
    }
  }
}
