/// Game Stats Provider
/// Single source of truth for all game statistics
/// Replaces GameManager singleton with Riverpod provider for better state management and persistence

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_flutter/hive_flutter.dart';
import '../../../core/services/storage_service.dart';
import '../../../core/constants/app_constants.dart';
import '../models/game_stats_model.dart';
import '../models/game_models.dart';
import '../services/game_stats_persistence_service.dart';
import '../../score/providers/preparedness_score_provider.dart';
import '../../auth/providers/auth_provider.dart';

/// Game Stats State
class GameStatsState {
  final int totalGamesPlayed;
  final int highScore;
  final int lifetimeScore;
  final int runnerHighScore;
  final int floodHighScore;
  final int maxLevelUnlocked;
  final bool isLoading;
  final String? error;
  final DateTime? lastUpdated;

  GameStatsState({
    this.totalGamesPlayed = 0,
    this.highScore = 0,
    this.lifetimeScore = 0,
    this.runnerHighScore = 0,
    this.floodHighScore = 0,
    this.maxLevelUnlocked = 1,
    this.isLoading = false,
    this.error,
    this.lastUpdated,
  });

  GameStatsState copyWith({
    int? totalGamesPlayed,
    int? highScore,
    int? lifetimeScore,
    int? runnerHighScore,
    int? floodHighScore,
    int? maxLevelUnlocked,
    bool? isLoading,
    String? error,
    DateTime? lastUpdated,
  }) {
    return GameStatsState(
      totalGamesPlayed: totalGamesPlayed ?? this.totalGamesPlayed,
      highScore: highScore ?? this.highScore,
      lifetimeScore: lifetimeScore ?? this.lifetimeScore,
      runnerHighScore: runnerHighScore ?? this.runnerHighScore,
      floodHighScore: floodHighScore ?? this.floodHighScore,
      maxLevelUnlocked: maxLevelUnlocked ?? this.maxLevelUnlocked,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      lastUpdated: lastUpdated ?? this.lastUpdated,
    );
  }
}

/// Game Stats Persistence Service Provider
final gameStatsPersistenceServiceProvider = Provider<GameStatsPersistenceService>((ref) {
  return GameStatsPersistenceService();
});

/// Game Stats Notifier
/// Manages game statistics state and persistence
class GameStatsNotifier extends StateNotifier<GameStatsState> {
  final StorageService _storageService;
  final GameStatsPersistenceService _persistenceService;
  final Ref _ref;
  Box<dynamic>? _gameScoresBox;

  GameStatsNotifier(
    this._storageService,
    this._persistenceService,
    this._ref,
  ) : super(GameStatsState(isLoading: true)) {
    _loadFromHive(); // Load immediately on initialization
    _setupHiveListeners(); // Auto-update on changes
  }

  /// Setup Hive listeners for auto-updates
  Future<void> _setupHiveListeners() async {
    try {
      _gameScoresBox = await Hive.openBox(AppConstants.gameScoresBox);
      _gameScoresBox!.watch().listen((event) {
        // Reload stats when game scores change
        if (event.key != 'gameStats') {
          // Only reload if it's not our own update
          _recalculateFromScores();
        }
      });
      print('✅ [GAME STATS] Hive listeners setup for auto-updates');
    } catch (e) {
      print('⚠️ [GAME STATS] Error setting up Hive listeners: $e');
    }
  }

  /// Load stats from Hive
  Future<void> _loadFromHive() async {
    try {
      state = state.copyWith(isLoading: true, error: null);
      
      final stats = await _persistenceService.loadStats();
      
      if (stats != null) {
        state = GameStatsState(
          totalGamesPlayed: stats.totalGamesPlayed,
          highScore: stats.highScore,
          lifetimeScore: stats.lifetimeScore,
          runnerHighScore: stats.runnerHighScore,
          floodHighScore: stats.floodHighScore,
          maxLevelUnlocked: stats.maxLevelUnlocked,
          isLoading: false,
          lastUpdated: stats.lastUpdated,
        );
        print('✅ [GAME STATS] Loaded from Hive: ${stats.totalGamesPlayed} games, ${stats.highScore} high score');
      } else {
        // No saved stats - try to calculate from existing game scores
        await _recalculateFromScores();
        print('📂 [GAME STATS] No saved stats found, calculated from game scores');
      }
    } catch (e) {
      print('❌ [GAME STATS] Error loading from Hive: $e');
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  /// Recalculate stats from all game scores in Hive
  Future<void> _recalculateFromScores() async {
    try {
      final box = await _storageService.openBox(AppConstants.gameScoresBox);
      final allKeys = box.keys.toList();

      int totalGames = 0;
      int highestScore = 0;
      int totalXP = 0;
      int runnerHigh = 0;
      int floodHigh = 0;
      int maxLevel = 1;

      for (final key in allKeys) {
        if (key == 'gameStats') continue; // Skip our stats entry

        try {
          final data = box.get(key);
          if (data != null) {
            // Handle both Map<dynamic, dynamic> and Map<String, dynamic>
            // Hive returns Map<dynamic, dynamic>, so we need to cast properly
            if (data is! Map) {
              print('⚠️ [GAME STATS] Unexpected data type for key $key: ${data.runtimeType}');
              continue;
            }
            
            final scoreData = Map<String, dynamic>.from(data);
            
            // Check if it's a game score entry
            if (scoreData.containsKey('gameScore')) {
              final gameScoreDataRaw = scoreData['gameScore'];
              if (gameScoreDataRaw is Map) {
                try {
                  final gameScoreData = Map<String, dynamic>.from(gameScoreDataRaw);
                  final gameScore = GameScore.fromJson(gameScoreData);
                  totalGames++;
                  highestScore = highestScore > gameScore.score ? highestScore : gameScore.score;
                  totalXP += gameScore.xpEarned;
                  
                  // Track game-specific highs
                  if (gameScore.gameType == 'school-runner') {
                    runnerHigh = runnerHigh > gameScore.score ? runnerHigh : gameScore.score;
                  } else if (gameScore.gameType == 'flood-escape') {
                    floodHigh = floodHigh > gameScore.score ? floodHigh : gameScore.score;
                  }
                  
                  // Track max level
                  if (gameScore.level > maxLevel) {
                    maxLevel = gameScore.level;
                  }
                } catch (parseError) {
                  print('⚠️ [GAME STATS] Error parsing game score: $parseError');
                }
              }
            } else if (scoreData.containsKey('gameType')) {
              // Direct game score entry
              try {
                final gameScore = GameScore.fromJson(scoreData);
                totalGames++;
                highestScore = highestScore > gameScore.score ? highestScore : gameScore.score;
                totalXP += gameScore.xpEarned;
                
                if (gameScore.gameType == 'school-runner') {
                  runnerHigh = runnerHigh > gameScore.score ? runnerHigh : gameScore.score;
                } else if (gameScore.gameType == 'flood-escape') {
                  floodHigh = floodHigh > gameScore.score ? floodHigh : gameScore.score;
                }
                
                if (gameScore.level > maxLevel) {
                  maxLevel = gameScore.level;
                }
              } catch (parseError) {
                print('⚠️ [GAME STATS] Error parsing game score: $parseError');
              }
            }
          }
        } catch (e) {
          print('⚠️ [GAME STATS] Error reading game score: $e');
        }
      }

      // Update state with calculated values
      state = GameStatsState(
        totalGamesPlayed: totalGames,
        highScore: highestScore,
        lifetimeScore: totalXP,
        runnerHighScore: runnerHigh,
        floodHighScore: floodHigh,
        maxLevelUnlocked: maxLevel,
        isLoading: false,
        lastUpdated: DateTime.now(),
      );

      // Save calculated stats to Hive
      await _saveToHive();
      
      print('✅ [GAME STATS] Recalculated from scores: $totalGames games, $highestScore high score');
    } catch (e) {
      print('❌ [GAME STATS] Error recalculating from scores: $e');
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  /// Save stats to Hive
  Future<void> _saveToHive() async {
    try {
      final statsData = GameStatsData(
        totalGamesPlayed: state.totalGamesPlayed,
        highScore: state.highScore,
        lifetimeScore: state.lifetimeScore,
        runnerHighScore: state.runnerHighScore,
        floodHighScore: state.floodHighScore,
        maxLevelUnlocked: state.maxLevelUnlocked,
        lastUpdated: DateTime.now(),
      );
      await _persistenceService.saveStats(statsData);
    } catch (e) {
      print('❌ [GAME STATS] Error saving to Hive: $e');
    }
  }

  /// Update stats when a game is completed
  /// [score] - The game score from the completed game
  Future<void> updateStats(GameScore score) async {
    try {
      print('🔄 [GAME STATS] Updating stats with new game score: ${score.gameType}, ${score.score}');
      
      // Update local state
      final newTotalGames = state.totalGamesPlayed + 1;
      final newHighScore = state.highScore > score.score ? state.highScore : score.score;
      final newLifetimeScore = state.lifetimeScore + score.xpEarned;
      
      int newRunnerHigh = state.runnerHighScore;
      int newFloodHigh = state.floodHighScore;
      int newMaxLevel = state.maxLevelUnlocked;
      
      // Update game-specific highs
      if (score.gameType == 'school-runner') {
        newRunnerHigh = newRunnerHigh > score.score ? newRunnerHigh : score.score;
      } else if (score.gameType == 'flood-escape') {
        newFloodHigh = newFloodHigh > score.score ? newFloodHigh : score.score;
      }
      
      // Update max level
      if (score.level > newMaxLevel) {
        newMaxLevel = score.level;
      }
      
      state = state.copyWith(
        totalGamesPlayed: newTotalGames,
        highScore: newHighScore,
        lifetimeScore: newLifetimeScore,
        runnerHighScore: newRunnerHigh,
        floodHighScore: newFloodHigh,
        maxLevelUnlocked: newMaxLevel,
        lastUpdated: DateTime.now(),
      );
      
      // Save to Hive
      await _saveToHive();
      
      print('✅ [GAME STATS] Stats updated: $newTotalGames games, $newHighScore high score, $newLifetimeScore XP');
      
      // Trigger preparedness score recalculation
      try {
        final userId = _ref.read(authProvider).user?.id;
        if (userId != null) {
          _ref.read(preparednessScoreProvider.notifier).recalculateScore(userId: userId);
          print('✅ [GAME STATS] Triggered preparedness score recalculation');
        }
      } catch (e) {
        print('⚠️ [GAME STATS] Error triggering score recalculation: $e');
      }
    } catch (e) {
      print('❌ [GAME STATS] Error updating stats: $e');
      state = state.copyWith(error: e.toString());
    }
  }

  /// Refresh stats from Hive
  Future<void> refresh() async {
    await _loadFromHive();
  }

  /// Clear error
  void clearError() {
    state = state.copyWith(error: null);
  }
}

/// Game Stats Provider
final gameStatsProvider =
    StateNotifierProvider<GameStatsNotifier, GameStatsState>((ref) {
  final storageService = StorageService();
  final persistenceService = ref.watch(gameStatsPersistenceServiceProvider);
  final notifier = GameStatsNotifier(storageService, persistenceService, ref);
  return notifier;
});

