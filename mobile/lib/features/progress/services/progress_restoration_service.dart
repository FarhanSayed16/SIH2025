/// Progress Restoration Service
/// Centralized service to restore all user progress on app startup/login
/// Phase: Progress Persistence Fix

import '../../modules/services/local_completion_service.dart';
import '../../games/services/game_stats_persistence_service.dart';
import '../../games/models/game_stats_model.dart';
import '../../score/services/local_score_calculator.dart';
import '../../score/models/preparedness_score_model.dart';
import '../../../data/module_data.dart';

/// User Progress Model
/// Contains all restored progress data
class UserProgress {
  final List<String> completedModules;
  final GameStatsData? gameStats;
  final PreparednessScore? score;

  UserProgress({
    required this.completedModules,
    this.gameStats,
    this.score,
  });
}

/// Progress Restoration Service
/// Restores all user progress from local storage
/// Note: This service is available for future use if explicit restoration is needed
/// Currently, providers (GameStatsProvider, PreparednessScoreProvider) auto-load from Hive
class ProgressRestorationService {
  final LocalCompletionService _localCompletionService;
  final GameStatsPersistenceService _gameStatsPersistence;
  final LocalScoreCalculator _localScoreCalculator;

  ProgressRestorationService({
    LocalCompletionService? localCompletionService,
    GameStatsPersistenceService? gameStatsPersistence,
    LocalScoreCalculator? localScoreCalculator,
  })  : _localCompletionService = localCompletionService ?? LocalCompletionService(),
        _gameStatsPersistence = gameStatsPersistence ?? GameStatsPersistenceService(),
        _localScoreCalculator = localScoreCalculator ?? LocalScoreCalculator();

  /// Restore all user progress from local storage
  /// [userId] - User ID for progress restoration
  /// Returns UserProgress with all restored data
  /// Phase: NDMA Module Video Progress Persistence - Added video progress restoration
  Future<UserProgress> restoreProgress(String userId) async {
    print('🔄 [PROGRESS] Starting progress restoration for user: $userId');
    
    try {
      // 1. Load module completions
      final completedModules = await _localCompletionService.getCompletedModules();
      print('✅ [PROGRESS] Restored ${completedModules.length} completed modules');
      
      // 2. Restore video progress for all NDMA modules (user-scoped)
      await _restoreVideoProgress(userId);
      
      // 3. Load game stats
      // Note: GameStatsProvider auto-loads from Hive on initialization
      // This is just for logging - the provider handles restoration automatically
      final gameStats = await _gameStatsPersistence.loadStats();
      if (gameStats != null) {
        print('✅ [PROGRESS] Restored game stats: ${gameStats.totalGamesPlayed} games, ${gameStats.highScore} high score');
      } else {
        print('📂 [PROGRESS] No saved game stats found (GameStatsProvider will calculate from scores)');
      }
      
      // 4. Calculate initial score
      final score = await _localScoreCalculator.calculateFromLocal(userId: userId);
      print('✅ [PROGRESS] Calculated initial score: ${score.score}%');
      
      final progress = UserProgress(
        completedModules: completedModules,
        gameStats: gameStats,
        score: score,
      );
      
      print('✅ [PROGRESS] Progress restoration complete');
      return progress;
    } catch (e) {
      print('❌ [PROGRESS] Error restoring progress: $e');
      // Return empty progress on error
      return UserProgress(completedModules: []);
    }
  }

  Future<void> _restoreVideoProgress(String userId) async {
    try {
      await ModuleRepository().initialize(userId: userId);
    } catch (_) {}
  }
}

