import '../../features/auth/models/user_model.dart';

/// Access Level Provider
/// Determines what features are available based on user's access level
class AccessLevelProvider {
  /// Check if user can access a specific feature
  static bool canAccessFeature(UserModel user, String feature) {
    final accessLevel = user.accessLevel ?? 'none';
    
    switch (accessLevel) {
      case 'full':
        // 9th-12th std: All features
        return true;
      
      case 'shared':
        // 6th-8th std: Limited features
        return [
          'modules',
          'games',
          'quizzes',
          'group_activities',
          'basic_drills',
        ].contains(feature);
      
      case 'teacher_led':
        // KG-5th: No direct access (teacher controls)
        return false;
      
      default:
        return false;
    }
  }

  /// Get list of available features for user
  static List<String> getAvailableFeatures(UserModel user) {
    final accessLevel = user.accessLevel ?? 'none';
    
    switch (accessLevel) {
      case 'full':
        return [
          'modules',
          'games',
          'quizzes',
          'drills',
          'ar_drills',
          'mesh_networking',
          'crisis_mode',
          'progress_tracking',
          'badges',
          'leaderboard',
        ];
      
      case 'shared':
        return [
          'modules',
          'games',
          'quizzes',
          'group_activities',
          'basic_drills',
          'progress_tracking',
        ];
      
      case 'teacher_led':
        return []; // No direct features
      
      default:
        return [];
    }
  }

  /// Check if user can use the app directly
  static bool canUseApp(UserModel user) {
    return user.canUseApp ?? false;
  }

  /// Check if user requires teacher authentication
  static bool requiresTeacherAuth(UserModel user) {
    return user.requiresTeacherAuth ?? false;
  }

  /// Get access level description
  static String getAccessLevelDescription(String? accessLevel) {
    switch (accessLevel) {
      case 'full':
        return 'Full Access - All features available';
      case 'shared':
        return 'Shared Access - Limited features, group activities';
      case 'teacher_led':
        return 'Teacher-Led - No direct app access';
      default:
        return 'No Access';
    }
  }
}

