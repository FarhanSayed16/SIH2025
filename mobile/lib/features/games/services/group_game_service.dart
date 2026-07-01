/// Phase 3.2.4: Group Game Service
/// Handles group game session management and score aggregation

import '../../../core/services/api_service.dart';
import '../../../core/constants/api_endpoints.dart';

class GroupGameService {
  final ApiService _apiService;

  GroupGameService({ApiService? apiService})
      : _apiService = apiService ?? ApiService();

  /// Start a group game session
  Future<Map<String, dynamic>> startGroupGameSession({
    required String classId,
    required String gameType,
    List<String>? participantIds,
  }) async {
    try {
      final response = await _apiService.post(
        ApiEndpoints.groupActivitiesCreate,
        data: {
          'activityType': 'game',
          'classId': classId,
          'metadata': {
            'activityName': gameType,
            'duration': 0,
          },
          if (participantIds != null && participantIds.isNotEmpty)
            'participantIds': participantIds,
        },
      );

      final data = response.data as Map<String, dynamic>;
      if (response.statusCode == 201 && data['success'] == true) {
        return data['data'] as Map<String, dynamic>;
      }
      throw Exception(data['message'] ?? 'Failed to start group game session');
    } catch (e) {
      print('Error starting group game session: $e');
      rethrow;
    }
  }

  /// Record a turn result in group game
  Future<Map<String, dynamic>> recordGroupGameTurn({
    required String activityId,
    required String studentId,
    required int score,
    Map<String, dynamic>? gameData,
  }) async {
    try {
      final response = await _apiService.post(
        ApiEndpoints.groupActivitySubmit(activityId),
        data: {
          'studentId': studentId,
          'score': score,
          'completed': true,
          if (gameData != null) 'gameData': gameData,
        },
      );

      final data = response.data as Map<String, dynamic>;
      if (response.statusCode == 200 && data['success'] == true) {
        return data['data'] as Map<String, dynamic>;
      }
      throw Exception(data['message'] ?? 'Failed to record turn');
    } catch (e) {
      print('Error recording group game turn: $e');
      rethrow;
    }
  }

  /// Get group game session details
  Future<Map<String, dynamic>> getGroupGameSession(String activityId) async {
    try {
      final response = await _apiService.get(
        ApiEndpoints.groupActivityResults(activityId),
      );

      final data = response.data as Map<String, dynamic>;
      if (response.statusCode == 200 && data['success'] == true) {
        return data['data'] as Map<String, dynamic>;
      }
      throw Exception(data['message'] ?? 'Failed to get group game session');
    } catch (e) {
      print('Error getting group game session: $e');
      rethrow;
    }
  }

  /// Complete group game session
  Future<Map<String, dynamic>> completeGroupGameSession(String activityId) async {
    try {
      // Get final results
      final session = await getGroupGameSession(activityId);
      
      // Update status to completed (this would typically be done via backend endpoint)
      // For now, we'll just return the session data
      return session;
    } catch (e) {
      print('Error completing group game session: $e');
      rethrow;
    }
  }

  /// Get aggregated scores for group game
  Future<Map<String, dynamic>> getGroupGameScores(String activityId) async {
    try {
      final session = await getGroupGameSession(activityId);
      
      // Calculate aggregated scores from session data
      final participants = session['participants'] as List<dynamic>? ?? [];
      final totalScore = participants.fold<int>(
        0,
        (sum, p) => sum + ((p['score'] as num?)?.toInt() ?? 0),
      );
      final averageScore = participants.isNotEmpty
          ? (totalScore / participants.length).round()
          : 0;
      final completedCount = participants
          .where((p) => p['completed'] == true)
          .length;

      return {
        'activityId': activityId,
        'totalTurns': participants.length,
        'totalScore': totalScore,
        'averageScore': averageScore,
        'completedCount': completedCount,
        'completionRate': participants.isNotEmpty
            ? ((completedCount / participants.length) * 100).round()
            : 0,
        'participants': participants,
      };
    } catch (e) {
      print('Error getting group game scores: $e');
      rethrow;
    }
  }
}

