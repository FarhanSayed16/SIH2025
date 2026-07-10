/// Activity Tracker Helper
/// Phase 5: Parent-Teacher-Student Linkage
/// Utility class to easily track activities throughout the app

import '../services/activity_service.dart';
import '../../../core/services/api_service.dart';

class ActivityTrackerHelper {
  static ActivityService? _activityService;

  static ActivityService get _service {
    _activityService ??= ActivityService(ApiService());
    return _activityService!;
  }

  /// Track module completion
  static Future<void> trackModuleComplete({
    required String moduleId,
    required String moduleName,
    int? xpEarned,
    double? score,
  }) async {
    try {
      await _service.trackModuleComplete(
        moduleId: moduleId,
        moduleName: moduleName,
        xpEarned: xpEarned,
        score: score,
      );
      print('✅ Activity tracked: module_complete - $moduleName');
    } catch (e) {
      print('❌ Failed to track module completion: $e');
      // Don't throw - activity tracking should not break the app
    }
  }

  /// Track quiz completion
  static Future<void> trackQuizComplete({
    required String quizId,
    required int quizScore,
    required int quizTotalQuestions,
    double? percentage,
  }) async {
    try {
      await _service.trackQuizComplete(
        quizId: quizId,
        quizScore: quizScore,
        quizTotalQuestions: quizTotalQuestions,
        percentage: percentage,
      );
      print('✅ Activity tracked: quiz_complete - Score: $quizScore/$quizTotalQuestions');
    } catch (e) {
      print('❌ Failed to track quiz completion: $e');
    }
  }

  /// Track game completion
  static Future<void> trackGameComplete({
    required String gameId,
    required String gameName,
    int? gameScore,
    int? xpEarned,
  }) async {
    try {
      await _service.trackGameComplete(
        gameId: gameId,
        gameName: gameName,
        gameScore: gameScore,
        xpEarned: xpEarned,
      );
      print('✅ Activity tracked: game_complete - $gameName');
    } catch (e) {
      print('❌ Failed to track game completion: $e');
    }
  }

  /// Track badge earned
  static Future<void> trackBadgeEarned({
    required String badgeId,
    required String badgeName,
  }) async {
    try {
      await _service.trackBadgeEarned(
        badgeId: badgeId,
        badgeName: badgeName,
      );
      print('✅ Activity tracked: badge_earned - $badgeName');
    } catch (e) {
      print('❌ Failed to track badge earned: $e');
    }
  }

  /// Track XP milestone
  static Future<void> trackXPMilestone({
    required int totalXP,
    required int milestoneXP,
  }) async {
    try {
      await _service.trackXPMilestone(
        totalXP: totalXP,
        milestoneXP: milestoneXP,
      );
      print('✅ Activity tracked: xp_milestone - $totalXP XP');
    } catch (e) {
      print('❌ Failed to track XP milestone: $e');
    }
  }

  /// Track progress update
  static Future<void> trackProgressUpdate({
    required double preparednessScore,
    int? modulesCompleted,
    int? totalXP,
  }) async {
    try {
      await _service.trackProgressUpdate(
        preparednessScore: preparednessScore,
        modulesCompleted: modulesCompleted,
        totalXP: totalXP,
      );
      print('✅ Activity tracked: progress_update - Score: $preparednessScore%');
    } catch (e) {
      print('❌ Failed to track progress update: $e');
    }
  }

  /// Track safety status change
  static Future<void> trackSafetyStatusChange({
    required String safetyStatus,
    Map<String, double>? location,
  }) async {
    try {
      await _service.trackSafetyStatusChange(
        safetyStatus: safetyStatus,
        location: location,
      );
      print('✅ Activity tracked: safety_status_change - $safetyStatus');
    } catch (e) {
      print('❌ Failed to track safety status change: $e');
    }
  }

  /// Track drill participation
  static Future<void> trackDrillParticipation({
    required String drillId,
    required String drillType,
  }) async {
    try {
      await _service.trackDrillParticipation(
        drillId: drillId,
        drillType: drillType,
      );
      print('✅ Activity tracked: drill_participation - $drillType');
    } catch (e) {
      print('❌ Failed to track drill participation: $e');
    }
  }

  /// Track drill completion
  static Future<void> trackDrillComplete({
    required String drillId,
    required String drillType,
    int? evacuationTime,
  }) async {
    try {
      await _service.trackDrillComplete(
        drillId: drillId,
        drillType: drillType,
        evacuationTime: evacuationTime,
      );
      print('✅ Activity tracked: drill_complete - $drillType');
    } catch (e) {
      print('❌ Failed to track drill completion: $e');
    }
  }
}

