/// Activity Tracking Service
/// Phase 5: Parent-Teacher-Student Linkage
/// Handles tracking of student activities and progress updates

import '../../../core/services/api_service.dart';

class ActivityService {
  final ApiService _apiService;

  ActivityService(this._apiService);

  /// Track a student activity
  /// POST /api/activity/track
  Future<Map<String, dynamic>> trackActivity({
    required String activityType,
    required Map<String, dynamic> activityData,
    String? priority, // 'low', 'normal', 'high', 'critical'
  }) async {
    try {
      final response = await _apiService.post(
        '/activity/track',
        data: {
          'activityType': activityType,
          'activityData': activityData,
          if (priority != null) 'priority': priority,
        },
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        return {
          'success': true,
          'data': response.data['data'] ?? response.data,
        };
      } else {
        return {
          'success': false,
          'error': response.data['message'] ?? 'Failed to track activity',
        };
      }
    } catch (e) {
      print('❌ Error tracking activity: $e');
      return {
        'success': false,
        'error': e.toString(),
      };
    }
  }

  /// Get student activity timeline
  /// GET /api/activity/student/:studentId
  Future<Map<String, dynamic>> getStudentTimeline({
    required String studentId,
    int? page,
    int? limit,
    String? activityType,
    String? startDate,
    String? endDate,
  }) async {
    try {
      final queryParams = <String, dynamic>{};
      if (page != null) queryParams['page'] = page;
      if (limit != null) queryParams['limit'] = limit;
      if (activityType != null) queryParams['activityType'] = activityType;
      if (startDate != null) queryParams['startDate'] = startDate;
      if (endDate != null) queryParams['endDate'] = endDate;

      final response = await _apiService.get(
        '/activity/student/$studentId',
        queryParameters: queryParams.isNotEmpty ? queryParams : null,
      );

      if (response.statusCode == 200) {
        return {
          'success': true,
          'data': response.data['data'] ?? response.data,
        };
      } else {
        return {
          'success': false,
          'error': response.data['message'] ?? 'Failed to get activity timeline',
        };
      }
    } catch (e) {
      print('❌ Error getting activity timeline: $e');
      return {
        'success': false,
        'error': e.toString(),
      };
    }
  }

  /// Track module completion
  Future<Map<String, dynamic>> trackModuleComplete({
    required String moduleId,
    required String moduleName,
    int? xpEarned,
    double? score,
  }) async {
    return await trackActivity(
      activityType: 'module_complete',
      activityData: {
        'moduleId': moduleId,
        'moduleName': moduleName,
        if (xpEarned != null) 'xpEarned': xpEarned,
        if (score != null) 'score': score,
      },
      priority: 'normal',
    );
  }

  /// Track quiz completion
  Future<Map<String, dynamic>> trackQuizComplete({
    required String quizId,
    required int quizScore,
    required int quizTotalQuestions,
    double? percentage,
  }) async {
    return await trackActivity(
      activityType: 'quiz_complete',
      activityData: {
        'quizId': quizId,
        'quizScore': quizScore,
        'quizTotalQuestions': quizTotalQuestions,
        if (percentage != null) 'percentage': percentage,
      },
      priority: 'normal',
    );
  }

  /// Track game completion
  Future<Map<String, dynamic>> trackGameComplete({
    required String gameId,
    required String gameName,
    int? gameScore,
    int? xpEarned,
  }) async {
    return await trackActivity(
      activityType: 'game_complete',
      activityData: {
        'gameId': gameId,
        'gameName': gameName,
        if (gameScore != null) 'gameScore': gameScore,
        if (xpEarned != null) 'xpEarned': xpEarned,
      },
      priority: 'normal',
    );
  }

  /// Track badge earned
  Future<Map<String, dynamic>> trackBadgeEarned({
    required String badgeId,
    required String badgeName,
  }) async {
    return await trackActivity(
      activityType: 'badge_earned',
      activityData: {
        'badgeId': badgeId,
        'badgeName': badgeName,
      },
      priority: 'high',
    );
  }

  /// Track XP milestone
  Future<Map<String, dynamic>> trackXPMilestone({
    required int totalXP,
    required int milestoneXP,
  }) async {
    return await trackActivity(
      activityType: 'xp_milestone',
      activityData: {
        'totalXP': totalXP,
        'milestoneXP': milestoneXP,
      },
      priority: 'normal',
    );
  }

  /// Track progress update
  Future<Map<String, dynamic>> trackProgressUpdate({
    required double preparednessScore,
    int? modulesCompleted,
    int? totalXP,
  }) async {
    return await trackActivity(
      activityType: 'progress_update',
      activityData: {
        'preparednessScore': preparednessScore,
        if (modulesCompleted != null) 'modulesCompleted': modulesCompleted,
        if (totalXP != null) 'totalXP': totalXP,
      },
      priority: 'normal',
    );
  }

  /// Track safety status change
  Future<Map<String, dynamic>> trackSafetyStatusChange({
    required String safetyStatus,
    Map<String, double>? location,
  }) async {
    return await trackActivity(
      activityType: 'safety_status_change',
      activityData: {
        'safetyStatus': safetyStatus,
        if (location != null) 'location': location,
      },
      priority: 'critical',
    );
  }

  /// Track drill participation
  Future<Map<String, dynamic>> trackDrillParticipation({
    required String drillId,
    required String drillType,
  }) async {
    return await trackActivity(
      activityType: 'drill_participation',
      activityData: {
        'drillId': drillId,
        'drillType': drillType,
      },
      priority: 'high',
    );
  }

  /// Track drill completion
  Future<Map<String, dynamic>> trackDrillComplete({
    required String drillId,
    required String drillType,
    int? evacuationTime,
  }) async {
    return await trackActivity(
      activityType: 'drill_complete',
      activityData: {
        'drillId': drillId,
        'drillType': drillType,
        if (evacuationTime != null) 'evacuationTime': evacuationTime,
      },
      priority: 'high',
    );
  }
}

