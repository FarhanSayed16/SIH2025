/// Unified helper for submitting game scores and updating all related state
/// Phase: Games Scoring & Preparedness Integration
/// 
/// This helper ensures:
/// 1. Score is saved to Hive
/// 2. Score is synced with backend
/// 3. Game stats are updated
/// 4. Preparedness score is recalculated
/// 5. User gets feedback

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/game_models.dart';
import '../services/game_service.dart';
import '../providers/game_stats_provider.dart';
import '../../score/providers/preparedness_score_provider.dart';
import '../../auth/providers/auth_provider.dart';

/// Unified helper for submitting game scores and updating all related state
/// Phase: Games Scoring & Preparedness Integration
class GameScoreHelper {
  final GameService _gameService;
  final WidgetRef _ref;
  final BuildContext? _context;

  GameScoreHelper({
    required GameService gameService,
    required WidgetRef ref,
    BuildContext? context,
  })  : _gameService = gameService,
        _ref = ref,
        _context = context;

  /// Submit game score and update all related state
  /// This ensures:
  /// 1. Score is saved to Hive
  /// 2. Score is synced with backend
  /// 3. Game stats are updated
  /// 4. Preparedness score is recalculated
  /// 5. User gets feedback
  Future<void> submitScoreAndUpdate(GameScore score) async {
    try {
      print('🎮 [GAME SCORE HELPER] Submitting score: ${score.gameType}, ${score.score}');
      
      // 1. Submit score (saves to Hive + syncs with backend)
      await _gameService.submitScore(score);
      print('✅ [GAME SCORE HELPER] Score submitted successfully');
      
      // 2. Update game stats
      _ref.read(gameStatsProvider.notifier).updateStats(score);
      print('✅ [GAME SCORE HELPER] Game stats updated');
      
      // 3. Trigger preparedness score recalculation
      final userId = _ref.read(authProvider).user?.id;
      if (userId != null) {
        await _ref.read(preparednessScoreProvider.notifier).recalculateScore(userId: userId);
        print('✅ [GAME SCORE HELPER] Preparedness score recalculated');
      } else {
        print('⚠️ [GAME SCORE HELPER] No user ID, skipping score recalculation');
      }
      
      // 4. Show success message
      if (_context != null && _context!.mounted) {
        ScaffoldMessenger.of(_context!).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(Icons.star, color: Colors.white),
                const SizedBox(width: 8),
                Text('Score submitted! +${score.xpEarned} XP earned'),
              ],
            ),
            backgroundColor: Colors.green,
            duration: const Duration(seconds: 2),
          ),
        );
      }
    } catch (e) {
      print('❌ [GAME SCORE HELPER] Error submitting score: $e');
      
      // Show error message
      if (_context != null && _context!.mounted) {
        ScaffoldMessenger.of(_context!).showSnackBar(
          SnackBar(
            content: const Text('Score saved offline. Will sync when online.'),
            backgroundColor: Colors.orange,
            duration: const Duration(seconds: 3),
          ),
        );
      }
      
      // Still update stats locally (optimistic)
      try {
        _ref.read(gameStatsProvider.notifier).updateStats(score);
        print('✅ [GAME SCORE HELPER] Stats updated locally (optimistic)');
      } catch (statsError) {
        print('❌ [GAME SCORE HELPER] Error updating stats: $statsError');
      }
    }
  }
}

