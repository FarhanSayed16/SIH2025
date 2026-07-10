/// Phase 3.3.1: Preparedness Score Service
/// Handles API calls for preparedness score

import '../../../core/services/api_service.dart';
import '../../../core/constants/api_endpoints.dart';
import '../models/preparedness_score_model.dart';

class PreparednessScoreService {
  final ApiService _apiService;

  PreparednessScoreService({ApiService? apiService})
      : _apiService = apiService ?? ApiService();

  /// Get preparedness score for user
  /// [userId] - Optional user ID, if not provided uses current authenticated user
  Future<PreparednessScore> getPreparednessScore({String? userId}) async {
    try {
      final endpoint = ApiEndpoints.preparednessScore(userId);
      final response = await _apiService.get(endpoint);

      if (response.statusCode == 200 &&
          (response.data['success'] == true ||
              response.data['success'] == 'true')) {
        final data = response.data['data'] ?? response.data;
        return PreparednessScore.fromJson(data as Map<String, dynamic>);
      }

      throw Exception('Failed to fetch preparedness score');
    } catch (e) {
      print('Error fetching preparedness score: $e');
      rethrow;
    }
  }

  /// Recalculate preparedness score
  /// [userId] - Optional user ID, if not provided uses current authenticated user
  Future<PreparednessScore> recalculatePreparednessScore({String? userId}) async {
    try {
      final endpoint = ApiEndpoints.recalculateScore(userId);
      final response = await _apiService.post(endpoint);

      if ((response.statusCode == 200 || response.statusCode == 201) &&
          (response.data['success'] == true ||
              response.data['success'] == 'true')) {
        final data = response.data['data'] ?? response.data;
        return PreparednessScore.fromJson(data as Map<String, dynamic>);
      }

      throw Exception('Failed to recalculate preparedness score');
    } catch (e) {
      print('Error recalculating preparedness score: $e');
      rethrow;
    }
  }

  /// Get score history for user
  /// [userId] - Optional user ID, if not provided uses current authenticated user
  /// [limit] - Maximum number of history entries to return (default: 30)
  Future<ScoreHistory> getScoreHistory({String? userId, int limit = 30}) async {
    try {
      final endpoint = ApiEndpoints.scoreHistory(userId);
      final response = await _apiService.get(
        endpoint,
        queryParameters: {'limit': limit},
      );

      if (response.statusCode == 200 &&
          (response.data['success'] == true ||
              response.data['success'] == 'true')) {
        final data = response.data['data'] ?? response.data;
        return ScoreHistory.fromJson(data as Map<String, dynamic>);
      }

      throw Exception('Failed to fetch score history');
    } catch (e) {
      print('Error fetching score history: $e');
      rethrow;
    }
  }
}

