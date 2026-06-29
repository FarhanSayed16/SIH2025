/// Phase 3.3.3: Badge Service
/// Handles API calls for badge system

import '../../../core/services/api_service.dart';
import '../../../core/constants/api_endpoints.dart';
import '../models/badge_model.dart';

class BadgeService {
  final ApiService _apiService;

  BadgeService({required ApiService apiService}) : _apiService = apiService;

  /// Get all available badges
  /// [category] - Optional filter by category
  /// [gradeLevel] - Optional filter by grade level
  Future<List<Badge>> getAllBadges({
    String? category,
    String? gradeLevel,
  }) async {
    try {
      final queryParams = <String, dynamic>{};
      if (category != null) queryParams['category'] = category;
      if (gradeLevel != null) queryParams['gradeLevel'] = gradeLevel;

      final response = await _apiService.get(
        ApiEndpoints.badges,
        queryParameters: queryParams.isEmpty ? null : queryParams,
      );

      if (response.statusCode == 200 &&
          (response.data['success'] == true ||
              response.data['success'] == 'true')) {
        final data = response.data['data'] ?? response.data;
        final badgesList = data['badges'] as List<dynamic>? ?? [];
        return badgesList
            .map((json) => Badge.fromJson(json as Map<String, dynamic>))
            .toList();
      }

      throw Exception('Failed to fetch badges');
    } catch (e) {
      print('Error fetching badges: $e');
      rethrow;
    }
  }

  /// Get specific badge by ID
  Future<Badge> getBadgeById(String badgeId) async {
    try {
      final response = await _apiService.get(
        ApiEndpoints.badge(badgeId),
      );

      if (response.statusCode == 200 &&
          (response.data['success'] == true ||
              response.data['success'] == 'true')) {
        final data = response.data['data'] ?? response.data;
        final badgeData = data['badge'] ?? data;
        return Badge.fromJson(badgeData as Map<String, dynamic>);
      }

      throw Exception('Failed to fetch badge');
    } catch (e) {
      print('Error fetching badge: $e');
      rethrow;
    }
  }

  /// Get current user's earned badges
  Future<List<Badge>> getMyBadges() async {
    try {
      final response = await _apiService.get(ApiEndpoints.myBadges);

      if (response.statusCode == 200 &&
          (response.data['success'] == true ||
              response.data['success'] == 'true')) {
        final data = response.data['data'] ?? response.data;
        final badgesList = data['badges'] as List<dynamic>? ?? [];
        return badgesList
            .map((json) => Badge.fromJson(json as Map<String, dynamic>))
            .toList();
      }

      throw Exception('Failed to fetch user badges');
    } catch (e) {
      print('Error fetching user badges: $e');
      rethrow;
    }
  }

  /// Get badge award history for current user
  /// [page] - Page number for pagination
  /// [limit] - Number of items per page
  /// [badgeId] - Optional filter by badge ID
  Future<Map<String, dynamic>> getBadgeHistory({
    int page = 1,
    int limit = 20,
    String? badgeId,
  }) async {
    try {
      final queryParams = <String, dynamic>{
        'page': page,
        'limit': limit,
      };
      if (badgeId != null) queryParams['badgeId'] = badgeId;

      final response = await _apiService.get(
        ApiEndpoints.badgeHistory,
        queryParameters: queryParams,
      );

      if (response.statusCode == 200 &&
          (response.data['success'] == true ||
              response.data['success'] == 'true')) {
        final data = response.data['data'] ?? response.data;
        final historyList = data['data'] as List<dynamic>? ?? [];
        final pagination = response.data['pagination'] as Map<String, dynamic>?;

        final history = historyList
            .map((json) =>
                BadgeHistory.fromJson(json as Map<String, dynamic>))
            .toList();

        return {
          'history': history,
          'pagination': pagination ?? {},
        };
      }

      throw Exception('Failed to fetch badge history');
    } catch (e) {
      print('Error fetching badge history: $e');
      rethrow;
    }
  }

  /// Manually award badge (admin/teacher only)
  /// [badgeId] - Badge ID to award
  /// [userId] - Optional user ID (defaults to current user)
  Future<Map<String, dynamic>> awardBadge({
    required String badgeId,
    String? userId,
  }) async {
    try {
      final requestData = <String, dynamic>{};
      if (userId != null) requestData['userId'] = userId;

      final response = await _apiService.post(
        ApiEndpoints.awardBadge(badgeId),
        data: requestData.isEmpty ? null : requestData,
      );

      if ((response.statusCode == 200 || response.statusCode == 201) &&
          (response.data['success'] == true ||
              response.data['success'] == 'true')) {
        return (response.data['data'] ?? response.data) as Map<String, dynamic>;
      }

      throw Exception('Failed to award badge');
    } catch (e) {
      print('Error awarding badge: $e');
      rethrow;
    }
  }

  /// Check and award badges for current user
  /// [triggerType] - Type of action that triggered check
  /// [triggerData] - Data related to the trigger
  Future<List<String>> checkBadges({
    String? triggerType,
    Map<String, dynamic>? triggerData,
  }) async {
    try {
      final requestData = <String, dynamic>{};
      if (triggerType != null) requestData['triggerType'] = triggerType;
      if (triggerData != null) requestData['triggerData'] = triggerData;

      final response = await _apiService.post(
        ApiEndpoints.checkBadges,
        data: requestData.isEmpty ? null : requestData,
      );

      if (response.statusCode == 200 &&
          (response.data['success'] == true ||
              response.data['success'] == 'true')) {
        final data = response.data['data'] ?? response.data;
        final newlyAwarded = data['newlyAwarded'] as List<dynamic>? ?? [];
        return newlyAwarded.map((e) => e.toString()).toList();
      }

      throw Exception('Failed to check badges');
    } catch (e) {
      print('Error checking badges: $e');
      rethrow;
    }
  }
}

