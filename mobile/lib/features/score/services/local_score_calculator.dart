/// Phase 2: Local Score Calculator
/// Calculates preparedness score from local Hive data
/// Matches backend calculation logic for consistency

import '../../../core/services/storage_service.dart';
import '../../../core/constants/app_constants.dart';
import '../models/preparedness_score_model.dart';
import '../../modules/services/local_completion_service.dart';
import '../../games/models/game_models.dart';

/// Local Score Calculator
/// Calculates preparedness score from Hive data for instant updates
class LocalScoreCalculator {
  final StorageService _storageService;
  final LocalCompletionService _localCompletionService;

  LocalScoreCalculator({
    StorageService? storageService,
    LocalCompletionService? localCompletionService,
  })  : _storageService = storageService ?? StorageService(),
        _localCompletionService = localCompletionService ?? LocalCompletionService();

  /// Calculate preparedness score from local data
  /// Returns a PreparednessScore with breakdown
  Future<PreparednessScore> calculateFromLocal({String? userId}) async {
    try {
      // Get all score components
      final components = await Future.wait([
        _calculateModuleScore(),
        _calculateGameScore(),
        _calculateQuizScore(),
        _calculateDrillScore(),
        _calculateStreakScore(),
      ]);

      final moduleScore = components[0];
      final gameScore = components[1];
      final quizScore = components[2];
      final drillScore = components[3];
      final streakScore = components[4];

      // Calculate weighted total (matches backend logic)
      final totalScore = (moduleScore * 0.4 +
              gameScore * 0.25 +
              quizScore * 0.2 +
              drillScore * 0.1 +
              streakScore * 0.05)
          .round()
          .clamp(0, 100);

      final breakdown = ScoreBreakdown(
        module: ScoreComponent(score: moduleScore, weight: 40),
        game: ScoreComponent(score: gameScore, weight: 25),
        quiz: ScoreComponent(score: quizScore, weight: 20),
        drill: ScoreComponent(score: drillScore, weight: 10),
        streak: ScoreComponent(score: streakScore, weight: 5),
      );

      return PreparednessScore(
        userId: userId,
        score: totalScore,
        breakdown: breakdown,
        lastUpdated: DateTime.now(),
      );
    } catch (e) {
      print('❌ Error calculating local score: $e');
      // Return zero score on error
      return PreparednessScore(
        userId: userId,
        score: 0,
        breakdown: ScoreBreakdown(
          module: ScoreComponent(score: 0, weight: 40),
          game: ScoreComponent(score: 0, weight: 25),
          quiz: ScoreComponent(score: 0, weight: 20),
          drill: ScoreComponent(score: 0, weight: 10),
          streak: ScoreComponent(score: 0, weight: 5),
        ),
        lastUpdated: DateTime.now(),
      );
    }
  }

  /// Calculate module completion score (0-100)
  /// Matches backend logic: NDMA (50%), NDRF (30%), Hearing Impaired (20%)
  /// Phase 2: Simplified calculation - can be enhanced with actual module counts from API
  Future<int> _calculateModuleScore() async {
    try {
      // Get completed modules from local storage
      final completedModules = await _localCompletionService.getCompletedModules();
      final completedCount = completedModules.length;

      if (completedCount == 0) return 0;

      // Estimate total modules
      // NDMA: We'll use a reasonable estimate (can be improved with actual count from API)
      // In production, this should be fetched from backend or cached
      const estimatedTotalNdmaModules = 10; // This should ideally come from API
      
      // Calculate NDMA completion rate
      final ndmaCompletionRate = estimatedTotalNdmaModules > 0
          ? (completedCount / estimatedTotalNdmaModules) * 100
          : 0;

      // For Phase 2, we'll use a simplified calculation
      // In Phase 3, we can enhance this to track NDRF and Hearing Impaired separately
      // by checking ModuleProgress entries in Hive
      final totalCompletionRate = ndmaCompletionRate.clamp(0, 100);

      return totalCompletionRate.round();
    } catch (e) {
      print('Error calculating module score: $e');
      return 0;
    }
  }

  /// Calculate game performance score (0-100)
  /// Based on average game performance from local game scores
  /// Phase: Games Scoring & Preparedness Integration - Enhanced with better logging and XP handling
  Future<int> _calculateGameScore() async {
    try {
      print('🔄 [SCORE CALC] Calculating game score from Hive...');
      final box = await _storageService.openBox(AppConstants.gameScoresBox);
      final allKeys = box.keys.toList();

      if (allKeys.isEmpty) {
        print('📂 [SCORE CALC] No game scores found in Hive');
        return 0;
      }

      print('📊 [SCORE CALC] Found ${allKeys.length} game score entries in Hive');

      // Get all game scores from Hive
      final gameScores = <GameScore>[];
      for (final key in allKeys) {
        try {
          final data = box.get(key);
          if (data is Map) {
            final scoreData = Map<String, dynamic>.from(data);
            // Check if it's a game score entry
            if (scoreData.containsKey('gameScore')) {
              final gameScoreData = scoreData['gameScore'] as Map<String, dynamic>?;
              if (gameScoreData != null) {
                try {
                  gameScores.add(GameScore.fromJson(gameScoreData));
                } catch (parseError) {
                  print('⚠️ [SCORE CALC] Error parsing game score from gameScore field: $parseError');
                  print('⚠️ [SCORE CALC] Data: $gameScoreData');
                }
              }
            } else if (scoreData.containsKey('gameType')) {
              // Direct game score entry
              try {
                gameScores.add(GameScore.fromJson(scoreData));
              } catch (parseError) {
                print('⚠️ [SCORE CALC] Error parsing game score from direct entry: $parseError');
                print('⚠️ [SCORE CALC] Data: $scoreData');
              }
            }
          }
        } catch (e) {
          print('⚠️ [SCORE CALC] Error reading game score from Hive: $e');
        }
      }

      if (gameScores.isEmpty) {
        print('📂 [SCORE CALC] No valid game scores parsed');
        return 0;
      }

      print('✅ [SCORE CALC] Parsed ${gameScores.length} game scores');

      // Calculate average performance (matches backend logic)
      // Backend uses: average of (score/maxScore * 100) for each game
      double totalPerformance = 0;
      int count = 0;

      for (final gameScore in gameScores) {
        if (gameScore.maxScore > 0) {
          final performance = (gameScore.score / gameScore.maxScore) * 100;
          totalPerformance += performance;
          count++;
          print('📊 [SCORE CALC] Game: ${gameScore.gameType}, Score: ${gameScore.score}/${gameScore.maxScore}, Performance: ${performance.toStringAsFixed(1)}%');
        } else {
          // If no maxScore, use score directly (0-100 scale)
          // For games without maxScore (like runner games), normalize to 0-100
          final normalizedScore = gameScore.score.clamp(0, 100).toDouble();
          totalPerformance += normalizedScore;
          count++;
          print('📊 [SCORE CALC] Game: ${gameScore.gameType}, Score: ${gameScore.score} (no max), Performance: ${normalizedScore.toStringAsFixed(1)}%');
        }
      }

      if (count == 0) {
        print('⚠️ [SCORE CALC] No valid game scores to calculate average');
        return 0;
      }

      final averagePerformance = (totalPerformance / count).clamp(0, 100);
      print('✅ [SCORE CALC] Game score calculated: ${averagePerformance.toStringAsFixed(1)}% (from $count games)');
      return averagePerformance.round();
    } catch (e) {
      print('❌ [SCORE CALC] Error calculating game score: $e');
      return 0;
    }
  }

  /// Calculate quiz accuracy score (0-100)
  /// Based on average quiz scores from local quiz results
  Future<int> _calculateQuizScore() async {
    try {
      final box = await _storageService.openBox(AppConstants.quizResultsBox);
      final allKeys = box.keys.toList();

      if (allKeys.isEmpty) return 0;

      // Get all quiz results from Hive
      final quizScores = <int>[];
      for (final key in allKeys) {
        try {
          final data = box.get(key);
          if (data is Map) {
            final quizData = Map<String, dynamic>.from(data);
            final score = quizData['score'];
            if (score != null) {
              final scoreValue = score is int
                  ? score
                  : int.tryParse(score.toString()) ?? 0;
              quizScores.add(scoreValue.clamp(0, 100));
            }
          }
        } catch (e) {
          print('Error parsing quiz result: $e');
        }
      }

      if (quizScores.isEmpty) return 0;

      // Calculate average quiz score (matches backend logic)
      final totalScore = quizScores.reduce((a, b) => a + b);
      final averageScore = (totalScore / quizScores.length).clamp(0, 100);
      return averageScore.round();
    } catch (e) {
      print('Error calculating quiz score: $e');
      return 0;
    }
  }

  /// Calculate drill participation score (0-100)
  /// Based on drill participation from local drill logs
  Future<int> _calculateDrillScore() async {
    try {
      final box = await _storageService.openBox(AppConstants.drillLogsBox);
      final allKeys = box.keys.toList();

      if (allKeys.isEmpty) return 0;

      // Count drill participations
      int participationCount = 0;
      double totalResponseTime = 0;
      int responseTimeCount = 0;

      for (final key in allKeys) {
        try {
          final data = box.get(key);
          if (data is Map) {
            final drillData = Map<String, dynamic>.from(data);
            if (drillData['completed'] == true || drillData['participated'] == true) {
              participationCount++;

              // Get response time if available
              final responseTime = drillData['responseTime'];
              if (responseTime != null) {
                final timeValue = responseTime is int
                    ? responseTime
                    : int.tryParse(responseTime.toString());
                if (timeValue != null && timeValue > 0) {
                  totalResponseTime += timeValue;
                  responseTimeCount++;
                }
              }
            }
          }
        } catch (e) {
          print('Error parsing drill log: $e');
        }
      }

      // Simplified calculation: participation rate
      // In a real scenario, we'd need total available drills
      // For now, we'll use a participation-based score
      if (participationCount == 0) return 0;

      // Calculate average response time score (faster = better)
      double responseTimeScore = 100;
      if (responseTimeCount > 0) {
        final avgResponseTime = totalResponseTime / responseTimeCount;
        // Normalize: < 30s = 100, 30-60s = 80, 60-120s = 60, > 120s = 40
        if (avgResponseTime < 30) {
          responseTimeScore = 100;
        } else if (avgResponseTime < 60) {
          responseTimeScore = 80;
        } else if (avgResponseTime < 120) {
          responseTimeScore = 60;
        } else {
          responseTimeScore = 40;
        }
      }

      // Participation score (simplified - assumes some drills available)
      // In real scenario, would compare against total available drills
      final participationScore = (participationCount * 10).clamp(0, 100).toDouble();

      // Combine participation (70%) and response time (30%)
      final drillScore = (participationScore * 0.7 + responseTimeScore * 0.3).clamp(0, 100);
      return drillScore.round();
    } catch (e) {
      print('Error calculating drill score: $e');
      return 0;
    }
  }

  /// Calculate login streak score (0-100)
  /// Based on login streaks from user data
  Future<int> _calculateStreakScore() async {
    try {
      final box = await _storageService.openBox(AppConstants.userBox);
      final userData = box.get('user');

      if (userData == null) return 0;

      final user = Map<String, dynamic>.from(userData as Map);
      final progress = user['progress'] as Map<String, dynamic>?;
      final loginStreak = progress?['loginStreak'] ?? 0;

      // Convert streak to score: 0-7 days = 0-50, 7-30 days = 50-80, 30+ days = 80-100
      final streakValue = loginStreak is int
          ? loginStreak
          : int.tryParse(loginStreak.toString()) ?? 0;

      if (streakValue == 0) return 0;
      if (streakValue < 7) {
        return ((streakValue / 7) * 50).round();
      } else if (streakValue < 30) {
        return (50 + ((streakValue - 7) / 23) * 30).round();
      } else {
        return (80 + ((streakValue - 30).clamp(0, 30) / 30) * 20).round().clamp(0, 100);
      }
    } catch (e) {
      print('Error calculating streak score: $e');
      return 0;
    }
  }

  /// Get score breakdown components
  /// Useful for displaying detailed breakdown
  Future<ScoreBreakdown> getBreakdown() async {
    final score = await calculateFromLocal();
    return score.breakdown;
  }
}

