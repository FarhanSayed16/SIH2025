/// Phase 3.2: Game Service
/// Handles game API calls (scores, items, leaderboard)

import 'package:dio/dio.dart';
import 'package:hive_flutter/hive_flutter.dart';
import '../../../core/services/api_service.dart';
import '../../../core/constants/api_endpoints.dart';
import '../../../core/constants/app_constants.dart';
import '../models/game_models.dart'; // Includes GameItem, GameScore, HazardItem
import 'offline_game_service.dart';
import 'game_sync_service.dart';

class GameService {
  final ApiService _apiService;
  final OfflineGameService _offlineGameService;
  final GameSyncService _syncService;

  GameService({
    ApiService? apiService,
    OfflineGameService? offlineGameService,
    GameSyncService? syncService,
  })  : _apiService = apiService ?? ApiService(),
        _offlineGameService = offlineGameService ?? OfflineGameService(),
        _syncService = syncService ?? GameSyncService();

  /// Get game items
  Future<List<GameItem>> getGameItems({
    String gameType = 'bag-packer',
    String? category,
    String? gradeLevel,
  }) async {
    try {
      final queryParams = <String, dynamic>{
        'gameType': gameType,
      };
      if (category != null) queryParams['category'] = category;
      if (gradeLevel != null) queryParams['gradeLevel'] = gradeLevel;

      final response = await _apiService.get(
        ApiEndpoints.gameItems,
        queryParameters: queryParams,
      );

      if (response.statusCode == 200 &&
          (response.data['success'] == true ||
              response.data['success'] == 'true')) {
        final data = response.data['data'] ?? response.data;
        final items = (data['items'] as List? ?? [])
            .map((item) => GameItem.fromJson(item as Map<String, dynamic>))
            .toList();
        return items;
      }
      return [];
    } catch (e) {
      print('Error getting game items: $e');
      return [];
    }
  }

  /// Submit game score (with offline support)
  /// CRITICAL: Always attempts API call first, falls back to offline if it fails
  Future<GameScore?> submitScore(GameScore score) async {
    try {
      // REMOVED: Unreliable connectivity check - let API service handle connection errors
      // The connectivity_plus package only checks network interface, not actual internet
      // We'll attempt API call and handle errors properly
      
      print('🎮 [GAME SERVICE] Submitting game score...');
      print('🎮 [GAME SERVICE] Game: ${score.gameType}, Score: ${score.score}, Max: ${score.maxScore}');

      // Try to submit online FIRST (optimistic - attempt API call)
      // If it fails, we'll save offline
      try {
        // CRITICAL: Explicit logging before API call
        print('📤 [GAME SERVICE] Sending game score to backend:');
        print('📤 [GAME SERVICE] Endpoint: ${ApiEndpoints.gameScores}');
        print('📤 [GAME SERVICE] Data: ${score.toJson()}');
        print('📤 [GAME SERVICE] Game Type: ${score.gameType}, Score: ${score.score}');
        
        final response = await _apiService.post(
          ApiEndpoints.gameScores,
          data: score.toJson(),
        );
        
        print('✅ [GAME SERVICE] API Response received: ${response.statusCode}');
        print('✅ [GAME SERVICE] Response data: ${response.data}');

        if (response.statusCode == 200 || response.statusCode == 201) {
          print('✅ [GAME SERVICE] Score successfully saved to backend');
          final responseData = response.data;
          final data = responseData['data'] ?? responseData;
          final gameScoreData = data['gameScore'] ?? data;

          // Create GameScore from response
          final submittedScore = GameScore(
            id: gameScoreData['id']?.toString(),
            gameType: score.gameType,
            score: score.score,
            maxScore: score.maxScore,
            level: score.level,
            difficulty: score.difficulty,
            isGroupMode: score.isGroupMode,
            itemsCorrect: score.itemsCorrect,
            itemsIncorrect: score.itemsIncorrect,
            timeTaken: score.timeTaken,
            xpEarned: (gameScoreData['xpEarned'] ?? 0) is int
                ? gameScoreData['xpEarned'] as int
                : int.tryParse((gameScoreData['xpEarned'] ?? 0).toString()) ??
                    0,
            completedAt: DateTime.now(),
          );

          // Save to Hive for immediate GameStatsProvider update
          // This ensures stats are updated even when online
          try {
            final box = await Hive.openBox<dynamic>(AppConstants.gameScoresBox);
            final scoreKey = 'gameScore_${DateTime.now().millisecondsSinceEpoch}';
            await box.put(scoreKey, {
              'gameScore': submittedScore.toJson(),
              'synced': true,
              'createdAt': DateTime.now().toIso8601String(),
            });
            print('💾 [GAME SERVICE] Score saved to Hive (triggers GameStatsProvider update)');
          } catch (e) {
            print('⚠️ [GAME SERVICE] Error saving to Hive: $e');
          }

          // Trigger background sync to sync any pending scores
          _syncService.sync();

          return submittedScore;
        } else {
          print('⚠️ [GAME SERVICE] Unexpected response status: ${response.statusCode}');
          print('⚠️ [GAME SERVICE] Response: ${response.data}');
        }
      } catch (onlineError) {
        print('❌ [GAME SERVICE] Online submission FAILED:');
        print('❌ [GAME SERVICE] Error type: ${onlineError.runtimeType}');
        print('❌ [GAME SERVICE] Error message: $onlineError');
        if (onlineError is DioException) {
          print('❌ [GAME SERVICE] DioException details:');
          print('❌ [GAME SERVICE]   - Type: ${onlineError.type}');
          print('❌ [GAME SERVICE]   - Status: ${onlineError.response?.statusCode}');
          print('❌ [GAME SERVICE]   - Message: ${onlineError.message}');
          print('❌ [GAME SERVICE]   - Response: ${onlineError.response?.data}');
        }
        // Fall through to offline save
      }

      // If online submission failed, save offline for later sync
      print('📴 [GAME SERVICE] Saving score offline (API call failed)');
      await _offlineGameService.savePendingScore(score);
      print('✅ [GAME SERVICE] Score saved offline, will sync when online');
      
      // Also save to Hive for immediate GameStatsProvider update
      // This ensures stats are updated even when offline
      // Note: savePendingScore already saves to Hive, but we do it here too for redundancy
      try {
        final box = await Hive.openBox<dynamic>(AppConstants.gameScoresBox);
        final scoreKey = 'gameScore_${DateTime.now().millisecondsSinceEpoch}';
        await box.put(scoreKey, {
          'gameScore': score.toJson(),
          'synced': false,
          'createdAt': DateTime.now().toIso8601String(),
        });
        print('💾 [GAME SERVICE] Score saved to Hive for immediate stats update');
      } catch (e) {
        print('⚠️ [GAME SERVICE] Error saving to Hive: $e');
      }

      // Return score with pending status
      return GameScore(
        id: 'pending_${DateTime.now().millisecondsSinceEpoch}',
        gameType: score.gameType,
        score: score.score,
        maxScore: score.maxScore,
        level: score.level,
        difficulty: score.difficulty,
        isGroupMode: score.isGroupMode,
        itemsCorrect: score.itemsCorrect,
        itemsIncorrect: score.itemsIncorrect,
        timeTaken: score.timeTaken,
        xpEarned: score.xpEarned,
        completedAt: score.completedAt,
      );
    } catch (e) {
      print('❌ Error submitting game score: $e');
      // Even on error, save offline as backup
      try {
        await _offlineGameService.savePendingScore(score);
      } catch (saveError) {
        print('❌ Failed to save score offline: $saveError');
      }
      return null;
    }
  }

  /// Get game scores
  Future<List<GameScore>> getScores({
    String? gameType,
    int limit = 10, // ignore: parameter_assignments
    String? groupActivityId,
  }) async {
    try {
      final queryParams = <String, dynamic>{
        'limit': limit,
      };
      if (gameType != null) queryParams['gameType'] = gameType;
      if (groupActivityId != null)
        queryParams['groupActivityId'] = groupActivityId;

      final response = await _apiService.get(
        ApiEndpoints.gameScores,
        queryParameters: queryParams,
      );

      if (response.statusCode == 200) {
        final responseData = response.data as Map<String, dynamic>;
        final data = responseData['data'] ?? responseData;
        final scores = (data['scores'] as List? ?? [])
            .map((score) => GameScore.fromJson(score as Map<String, dynamic>))
            .toList();
        return scores;
      }
      return [];
    } catch (e) {
      print('Error getting game scores: $e');
      return [];
    }
  }

  /// Get leaderboard
  Future<List<GameScore>> getLeaderboard({
    required String gameType,
    int limit = 20,
    String? institutionId,
    String? difficulty,
    int? level,
  }) async {
    try {
      final queryParams = <String, dynamic>{
        'limit': limit,
      };
      if (institutionId != null) queryParams['institutionId'] = institutionId;
      if (difficulty != null) queryParams['difficulty'] = difficulty;
      if (level != null) queryParams['level'] = level;

      final response = await _apiService.get(
        ApiEndpoints.gameLeaderboard(gameType),
        queryParameters: queryParams,
      );

      if (response.statusCode == 200) {
        final responseData = response.data as Map<String, dynamic>;
        final data = responseData['data'] ?? responseData;
        final leaderboard = (data['leaderboard'] as List? ?? [])
            .map((score) => GameScore.fromJson(score as Map<String, dynamic>))
            .toList();
        return leaderboard;
      }
      return [];
    } catch (e) {
      print('Error getting leaderboard: $e');
      return [];
    }
  }

  /// Get hazards for Hazard Hunter game
  /// Phase 3.2.2: Hazard Hunter
  Future<List<HazardItem>> getHazards({
    int? level,
    String? difficulty,
    String? gradeLevel,
  }) async {
    try {
      final queryParams = <String, dynamic>{};
      if (level != null) queryParams['level'] = level;
      if (difficulty != null) queryParams['difficulty'] = difficulty;
      if (gradeLevel != null) queryParams['gradeLevel'] = gradeLevel;

      final response = await _apiService.get(
        ApiEndpoints.gameHazards,
        queryParameters: queryParams,
      );

      if (response.statusCode == 200 &&
          (response.data['success'] == true ||
              response.data['success'] == 'true')) {
        final data = response.data['data'] ?? response.data;
        final hazards = (data['hazards'] as List? ?? [])
            .map((hazard) => HazardItem.fromJson(hazard as Map<String, dynamic>))
            .toList();
        return hazards;
      }
      return [];
    } catch (e) {
      print('Error getting hazards: $e');
      return [];
    }
  }

  /// Verify hazard tap
  /// Phase 3.2.2: Hazard Hunter
  Future<Map<String, dynamic>?> verifyHazardTap({
    required String hazardId,
    required double tapX,
    required double tapY,
    String? imageId,
  }) async {
    try {
      final response = await _apiService.post(
        ApiEndpoints.verifyHazard,
        data: {
          'hazardId': hazardId,
          'tapX': tapX,
          'tapY': tapY,
          if (imageId != null) 'imageId': imageId,
        },
      );

      if (response.statusCode == 200 &&
          (response.data['success'] == true ||
              response.data['success'] == 'true')) {
        final data = response.data['data'] ?? response.data;
        return data as Map<String, dynamic>;
      }
      return null;
    } catch (e) {
      print('Error verifying hazard tap: $e');
      return null;
    }
  }
}
