/// Game Stats Persistence Service
/// Handles saving and loading game statistics to/from Hive

import '../../../core/services/storage_service.dart';
import '../../../core/constants/app_constants.dart';
import '../models/game_stats_model.dart';

class GameStatsPersistenceService {
  final StorageService _storageService;

  GameStatsPersistenceService({StorageService? storageService})
      : _storageService = storageService ?? StorageService();

  /// Save game stats to Hive
  /// [stats] - The game stats data to save
  Future<void> saveStats(GameStatsData stats) async {
    try {
      final box = await _storageService.openBox(AppConstants.gameScoresBox);
      await box.put('gameStats', stats.toJson());
      print('💾 [GAME STATS] Saved stats to Hive: ${stats.totalGamesPlayed} games, ${stats.highScore} high score');
    } catch (e) {
      print('❌ [GAME STATS] Error saving stats to Hive: $e');
      rethrow;
    }
  }

  /// Load game stats from Hive
  /// Returns the saved stats or null if not found
  Future<GameStatsData?> loadStats() async {
    try {
      final box = await _storageService.openBox(AppConstants.gameScoresBox);
      final data = box.get('gameStats');
      
      if (data == null) {
        print('📂 [GAME STATS] No saved stats found in Hive');
        return null;
      }

      if (data is Map) {
        final stats = GameStatsData.fromJson(Map<String, dynamic>.from(data));
        print('📂 [GAME STATS] Loaded stats from Hive: ${stats.totalGamesPlayed} games, ${stats.highScore} high score');
        return stats;
      }

      print('⚠️ [GAME STATS] Invalid data format in Hive');
      return null;
    } catch (e) {
      print('❌ [GAME STATS] Error loading stats from Hive: $e');
      return null;
    }
  }

  /// Clear all saved game stats (for testing/debugging)
  Future<void> clearStats() async {
    try {
      final box = await _storageService.openBox(AppConstants.gameScoresBox);
      await box.delete('gameStats');
      print('✅ [GAME STATS] Cleared saved stats from Hive');
    } catch (e) {
      print('❌ [GAME STATS] Error clearing stats: $e');
    }
  }
}

