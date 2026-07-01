import '../../../core/services/api_service.dart';
import '../../../core/constants/api_endpoints.dart';
import '../models/leaderboard_model.dart';
import 'package:flutter/foundation.dart';
import 'package:dio/dio.dart';

class LeaderboardService {
  final ApiService _apiService;

  LeaderboardService({ApiService? apiService})
      : _apiService = apiService ?? ApiService();

  /// Get main leaderboard
  Future<LeaderboardResponse> getLeaderboard({
    String? schoolId,
    String type = 'overall',
    String? gameType,
    int limit = 50,
  }) async {
    try {
      // Validate: gameType is required when type is 'games'
      if (type == 'games' && (gameType == null || gameType.isEmpty)) {
        // Default to 'bag-packer' if not specified
        gameType = 'bag-packer';
        debugPrint('⚠️ Game type not specified for games leaderboard, defaulting to: $gameType');
      }

      final queryParams = <String, dynamic>{
        'type': type,
        'limit': limit,
      };
      if (schoolId != null) queryParams['schoolId'] = schoolId;
      // CRITICAL: Always include gameType when type is 'games' (required by backend)
      if (type == 'games') {
        queryParams['gameType'] = gameType!; // Safe because we defaulted it above
      } else if (gameType != null && gameType.isNotEmpty) {
        queryParams['gameType'] = gameType;
      }

      final response = await _apiService.get(
        ApiEndpoints.leaderboard,
        queryParameters: queryParams,
      );

      if (response.statusCode == 200) {
        // Handle both success: true and direct data responses
        if (response.data['success'] == true ||
            response.data['success'] == 'true' ||
            response.data['data'] != null) {
          return LeaderboardResponse.fromJson(
            response.data as Map<String, dynamic>,
          );
        }
      }

      // Extract error message from response
      final errorMsg = response.data['message'] ?? 
                       response.data['error'] ?? 
                       'Failed to fetch leaderboard';
      throw Exception(errorMsg);
    } catch (e) {
      debugPrint('Error fetching leaderboard: $e');
      if (e is DioException) {
        final errorMsg = e.response?.data?['message'] ?? 
                         e.response?.data?['error'] ?? 
                         e.message ?? 
                         'Network error';
        throw Exception(errorMsg);
      }
      rethrow;
    }
  }

  /// Get Squad Wars leaderboard
  Future<List<SquadWarsEntry>> getSquadWars({
    String? schoolId,
    int limit = 20,
  }) async {
    try {
      final queryParams = <String, dynamic>{
        'limit': limit,
      };
      if (schoolId != null) queryParams['schoolId'] = schoolId;

      final response = await _apiService.get(
        ApiEndpoints.squadWars,
        queryParameters: queryParams,
      );

      if (response.statusCode == 200) {
        if (response.data['success'] == true ||
            response.data['success'] == 'true' ||
            response.data['data'] != null) {
          final data = response.data['data'] ?? response.data;
          final leaderboardList = data['leaderboard'] as List<dynamic>? ?? [];
          return leaderboardList
              .map((entry) => SquadWarsEntry.fromJson(entry as Map<String, dynamic>))
              .toList();
        }
      }

      final errorMsg = response.data['message'] ?? 
                       response.data['error'] ?? 
                       'Failed to fetch Squad Wars leaderboard';
      throw Exception(errorMsg);
    } catch (e) {
      debugPrint('Error fetching Squad Wars leaderboard: $e');
      if (e is DioException) {
        final errorMsg = e.response?.data?['message'] ?? 
                         e.response?.data?['error'] ?? 
                         e.message ?? 
                         'Network error';
        throw Exception(errorMsg);
      }
      rethrow;
    }
  }

  /// Get class-specific leaderboard
  Future<LeaderboardResponse> getClassLeaderboard({
    required String classId,
    int limit = 50,
  }) async {
    try {
      final queryParams = <String, dynamic>{
        'limit': limit,
      };

      final response = await _apiService.get(
        ApiEndpoints.classLeaderboard(classId),
        queryParameters: queryParams,
      );

      if (response.statusCode == 200) {
        if (response.data['success'] == true ||
            response.data['success'] == 'true' ||
            response.data['data'] != null) {
          return LeaderboardResponse.fromJson(
            response.data as Map<String, dynamic>,
          );
        }
      }

      final errorMsg = response.data['message'] ?? 
                       response.data['error'] ?? 
                       'Failed to fetch class leaderboard';
      throw Exception(errorMsg);
    } catch (e) {
      debugPrint('Error fetching class leaderboard: $e');
      if (e is DioException) {
        final errorMsg = e.response?.data?['message'] ?? 
                         e.response?.data?['error'] ?? 
                         e.message ?? 
                         'Network error';
        throw Exception(errorMsg);
      }
      rethrow;
    }
  }

  /// Refresh leaderboard cache
  Future<bool> refreshLeaderboard({
    String type = 'preparedness',
    String? schoolId,
  }) async {
    try {
      final response = await _apiService.post(
        ApiEndpoints.refreshLeaderboard,
        data: {
          'type': type,
          if (schoolId != null) 'schoolId': schoolId,
        },
      );

      return response.statusCode == 200 &&
          (response.data['success'] == true ||
              response.data['success'] == 'true');
    } catch (e) {
      debugPrint('Error refreshing leaderboard: $e');
      return false;
    }
  }
}

