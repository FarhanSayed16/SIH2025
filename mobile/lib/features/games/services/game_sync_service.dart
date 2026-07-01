/// Phase 3.2.5: Game Sync Service
/// Handles syncing game scores and states from offline storage to backend

import 'dart:async';
import '../../../core/services/api_service.dart';
import '../../../core/constants/api_endpoints.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import '../models/game_models.dart';
import 'offline_game_service.dart';

enum GameSyncStatus {
  idle,
  syncing,
  synced,
  failed,
  offline,
}

class GameSyncResult {
  final bool success;
  final String message;
  final int syncedScores;
  final int syncedStates;
  final List<String> conflicts;
  final List<String> errors;

  GameSyncResult({
    required this.success,
    required this.message,
    this.syncedScores = 0,
    this.syncedStates = 0,
    this.conflicts = const [],
    this.errors = const [],
  });
}

class GameSyncService {
  final ApiService _apiService;
  final OfflineGameService _offlineGameService;
  final Connectivity _connectivity = Connectivity();

  StreamController<GameSyncStatus>? _syncStatusController;
  Timer? _backgroundSyncTimer;
  bool _isSyncing = false;

  GameSyncService({
    ApiService? apiService,
    OfflineGameService? offlineGameService,
  })  : _apiService = apiService ?? ApiService(),
        _offlineGameService = offlineGameService ?? OfflineGameService();

  /// Sync status stream
  Stream<GameSyncStatus> get syncStatusStream {
    _syncStatusController ??= StreamController<GameSyncStatus>.broadcast();
    return _syncStatusController!.stream;
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

  /// Start background sync (auto-sync every 5 minutes when online)
  void startBackgroundSync({Duration interval = const Duration(minutes: 5)}) {
    _backgroundSyncTimer?.cancel();
    _backgroundSyncTimer = Timer.periodic(interval, (_) async {
      if (await _isOnline() && !_isSyncing) {
        await sync();
      }
    });
    print(
        '✅ Background game sync started (interval: ${interval.inMinutes} minutes)');
  }

  /// Stop background sync
  void stopBackgroundSync() {
    _backgroundSyncTimer?.cancel();
    _backgroundSyncTimer = null;
    print('⏹️  Background game sync stopped');
  }

  /// Manual sync trigger
  Future<GameSyncResult> sync({bool force = false}) async {
    if (_isSyncing && !force) {
      return GameSyncResult(
        success: false,
        message: 'Sync already in progress',
      );
    }

    _isSyncing = true;
    _updateSyncStatus(GameSyncStatus.syncing);

    try {
      // Check if online
      if (!await _isOnline()) {
        _updateSyncStatus(GameSyncStatus.offline);
        return GameSyncResult(
          success: false,
          message: 'No internet connection',
        );
      }

      // Get pending scores and states
      final pendingScores = await _offlineGameService.getPendingScores();

      if (pendingScores.isEmpty) {
        _updateSyncStatus(GameSyncStatus.synced);
        _isSyncing = false;
        return GameSyncResult(
          success: true,
          message: 'No game data to sync',
        );
      }

      int syncedCount = 0;
      final errors = <String>[];
      final conflicts = <String>[];

      // Sync each pending score
      for (final score in pendingScores) {
        try {
          final response = await _apiService.post(
            ApiEndpoints.gameScores,
            data: score.toJson(),
          );

          if (response.statusCode == 200 || response.statusCode == 201) {
            // Mark as synced
            final scoreKey = score.id ??
                'pending_${score.completedAt.millisecondsSinceEpoch}';
            await _offlineGameService.markScoreAsSynced(scoreKey);
            syncedCount++;
          } else if (response.statusCode == 409) {
            // Conflict - server already has this score
            conflicts.add(score.id ?? 'unknown');
            // Mark as synced anyway (conflict resolved)
            final scoreKey = score.id ??
                'pending_${score.completedAt.millisecondsSinceEpoch}';
            await _offlineGameService.markScoreAsSynced(scoreKey);
          } else {
            errors.add(
                'Score ${score.id}: ${response.data['message'] ?? 'Unknown error'}');
          }
        } catch (e) {
          errors.add('Score ${score.id ?? 'unknown'}: ${e.toString()}');
        }
      }

      _isSyncing = false;

      if (syncedCount > 0) {
        _updateSyncStatus(GameSyncStatus.synced);
        return GameSyncResult(
          success: true,
          message: 'Synced $syncedCount scores successfully',
          syncedScores: syncedCount,
          conflicts: conflicts,
          errors: errors,
        );
      } else {
        _updateSyncStatus(GameSyncStatus.failed);
        return GameSyncResult(
          success: false,
          message: 'Failed to sync scores',
          errors: errors,
        );
      }
    } catch (e) {
      _isSyncing = false;
      _updateSyncStatus(GameSyncStatus.failed);
      return GameSyncResult(
        success: false,
        message: 'Sync error: $e',
        errors: [e.toString()],
      );
    }
  }

  /// Sync specific score immediately (with retry)
  Future<bool> syncScore(GameScore score, {int maxRetries = 3}) async {
    int attempts = 0;

    while (attempts < maxRetries) {
      try {
        if (!await _isOnline()) {
          // Save offline for later sync
          await _offlineGameService.savePendingScore(score);
          return false;
        }

        final response = await _apiService.post(
          ApiEndpoints.gameScores,
          data: score.toJson(),
        );

        if (response.statusCode == 200 || response.statusCode == 201) {
          return true;
        }

        attempts++;
        if (attempts < maxRetries) {
          await Future<void>.delayed(
              Duration(seconds: attempts * 2)); // Exponential backoff
        }
      } catch (e) {
        attempts++;
        if (attempts >= maxRetries) {
          // Save offline for later sync
          await _offlineGameService.savePendingScore(score);
          return false;
        }
        await Future<void>.delayed(Duration(seconds: attempts * 2));
      }
    }

    return false;
  }

  /// Handle conflict resolution
  Future<bool> resolveConflict(
      String scoreId, GameScore localScore, GameScore serverScore) async {
    // Simple conflict resolution: use higher score
    // Can be enhanced with more sophisticated logic
    final finalScore =
        localScore.score > serverScore.score ? localScore : serverScore;

    try {
      final response = await _apiService.post(
        ApiEndpoints.gameScores,
        data: finalScore.toJson(),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        // Mark as synced
        await _offlineGameService.markScoreAsSynced(scoreId);
        return true;
      }
      return false;
    } catch (e) {
      print('❌ Error resolving conflict: $e');
      return false;
    }
  }

  /// Get sync statistics
  Future<Map<String, dynamic>> getSyncStats() async {
    final stats = await _offlineGameService.getStorageStats();
    final isOnline = await _isOnline();

    return {
      ...stats,
      'isOnline': isOnline,
      'isSyncing': _isSyncing,
      'lastSync': null, // TODO: Track last sync time
    };
  }

  /// Update sync status and notify listeners
  void _updateSyncStatus(GameSyncStatus status) {
    _syncStatusController?.add(status);
  }

  /// Dispose resources
  void dispose() {
    stopBackgroundSync();
    _syncStatusController?.close();
    _syncStatusController = null;
  }
}
