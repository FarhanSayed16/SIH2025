/// Phase 3.3.2: Adaptive Scoring Service
/// Handles API calls for per-student tracking and shared XP distribution

import '../../../core/services/api_service.dart';
import '../../../core/constants/api_endpoints.dart';
import '../models/adaptive_scoring_models.dart';

class AdaptiveScoringService {
  final ApiService _apiService;

  AdaptiveScoringService({required ApiService apiService})
      : _apiService = apiService;

  /// Get per-student scores for a class
  /// [classId] - Class ID
  /// [filters] - Optional filters (gameType, moduleId, startDate, endDate)
  Future<List<StudentScore>> getPerStudentScores(
    String classId, {
    String? gameType,
    String? moduleId,
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    try {
      final queryParams = <String, dynamic>{};
      if (gameType != null) queryParams['gameType'] = gameType;
      if (moduleId != null) queryParams['moduleId'] = moduleId;
      if (startDate != null) {
        queryParams['startDate'] = startDate.toIso8601String();
      }
      if (endDate != null) {
        queryParams['endDate'] = endDate.toIso8601String();
      }

      final response = await _apiService.get(
        ApiEndpoints.getPerStudentScores(classId),
        queryParameters: queryParams.isEmpty ? null : queryParams,
      );

      if (response.statusCode == 200 &&
          (response.data['success'] == true ||
              response.data['success'] == 'true')) {
        final data = response.data['data'] ?? response.data;
        final scoresList = data['scores'] as List<dynamic>? ?? [];
        return scoresList
            .map((json) => StudentScore.fromJson(json as Map<String, dynamic>))
            .toList();
      }

      throw Exception('Failed to fetch per-student scores');
    } catch (e) {
      print('Error fetching per-student scores: $e');
      rethrow;
    }
  }

  /// Get shared XP distribution history for a class
  /// [classId] - Class ID
  /// [filters] - Optional filters (activityType, startDate, endDate)
  Future<List<SharedXPDistribution>> getSharedXPDistribution(
    String classId, {
    String? activityType,
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    try {
      final queryParams = <String, dynamic>{};
      if (activityType != null) queryParams['activityType'] = activityType;
      if (startDate != null) {
        queryParams['startDate'] = startDate.toIso8601String();
      }
      if (endDate != null) {
        queryParams['endDate'] = endDate.toIso8601String();
      }

      final response = await _apiService.get(
        ApiEndpoints.getSharedXPDistribution(classId),
        queryParameters: queryParams.isEmpty ? null : queryParams,
      );

      if (response.statusCode == 200 &&
          (response.data['success'] == true ||
              response.data['success'] == 'true')) {
        final data = response.data['data'] ?? response.data;
        final distributionsList =
            data['distributions'] as List<dynamic>? ?? [];
        return distributionsList
            .map((json) =>
                SharedXPDistribution.fromJson(json as Map<String, dynamic>))
            .toList();
      }

      throw Exception('Failed to fetch shared XP distribution');
    } catch (e) {
      print('Error fetching shared XP distribution: $e');
      rethrow;
    }
  }

  /// Get aggregated student scores (individual + group activities)
  /// [studentId] - Student ID
  Future<AggregatedStudentScores> getAggregatedStudentScores(
    String studentId,
  ) async {
    try {
      final response = await _apiService.get(
        ApiEndpoints.getAggregatedStudentScores(studentId),
      );

      if (response.statusCode == 200 &&
          (response.data['success'] == true ||
              response.data['success'] == 'true')) {
        final data = response.data['data'] ?? response.data;
        return AggregatedStudentScores.fromJson(
          data as Map<String, dynamic>,
        );
      }

      throw Exception('Failed to fetch aggregated student scores');
    } catch (e) {
      print('Error fetching aggregated student scores: $e');
      rethrow;
    }
  }

  /// Distribute shared XP to all students in a class
  /// [classId] - Class ID
  /// [moduleId] - Module ID that was completed
  /// [xpAmount] - Amount of XP to distribute
  /// [activityType] - Optional activity type
  /// [activityId] - Optional activity ID
  Future<Map<String, dynamic>> distributeSharedXP({
    required String classId,
    required String moduleId,
    required int xpAmount,
    String? activityType,
    String? activityId,
  }) async {
    try {
      final requestData = <String, dynamic>{
        'classId': classId,
        'moduleId': moduleId,
        'xpAmount': xpAmount,
      };
      if (activityType != null) requestData['activityType'] = activityType;
      if (activityId != null) requestData['activityId'] = activityId;

      final response = await _apiService.post(
        ApiEndpoints.distributeSharedXP,
        data: requestData,
      );

      if ((response.statusCode == 200 || response.statusCode == 201) &&
          (response.data['success'] == true ||
              response.data['success'] == 'true')) {
        final data = response.data['data'] ?? response.data;
        return data as Map<String, dynamic>;
      }

      throw Exception('Failed to distribute shared XP');
    } catch (e) {
      print('Error distributing shared XP: $e');
      rethrow;
    }
  }
}

