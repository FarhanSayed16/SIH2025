import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../features/auth/models/user_model.dart';

/// Kid Mode Provider
/// Phase 2.5: K-12 Multi-Access
/// Determines if user should see kid-friendly UI
class KidModeProvider {
  /// Check if user should see kid mode
  static bool shouldShowKidMode(UserModel user) {
    if (user.role != 'student') return false;
    
    final grade = user.grade;
    if (grade == null) return false;

    // KG to 5th grade get kid mode
    if (grade == 'KG') return true;
    
    final gradeNum = int.tryParse(grade);
    if (gradeNum != null && gradeNum >= 1 && gradeNum <= 5) {
      return true;
    }

    return false;
  }

  /// Get kid mode description
  static String getKidModeDescription() {
    return 'Simplified interface for young learners';
  }
}

/// Kid Mode State Provider
final kidModeEnabledProvider = Provider<bool>((ref) {
  // This would be connected to auth provider in real implementation
  // For now, return false as default
  return false;
});

