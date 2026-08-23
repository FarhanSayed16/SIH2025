
/// Helper functions for creating mock data in tests

class MockHelpers {
  /// Create a mock user object
  static Map<String, dynamic> createMockUser({
    String id = 'user123',
    String email = 'test@example.com',
    String name = 'Test User',
    String role = 'student',
    String? institutionId,
  }) {
    return {
      'id': id,
      'email': email,
      'name': name,
      'role': role,
      'institutionId': institutionId ?? 'school123',
    };
  }

  /// Create a mock auth response
  static Map<String, dynamic> createMockAuthResponse({
    String accessToken = 'test_access_token',
    String refreshToken = 'test_refresh_token',
    Map<String, dynamic>? user,
  }) {
    return {
      'success': true,
      'data': {
        'accessToken': accessToken,
        'refreshToken': refreshToken,
        'user': user ?? createMockUser(),
      }
    };
  }

  /// Create a mock drill object
  static Map<String, dynamic> createMockDrill({
    String id = 'drill123',
    String schoolId = 'school123',
    String type = 'fire',
    String status = 'scheduled',
  }) {
    return {
      '_id': id,
      'schoolId': schoolId,
      'type': type,
      'status': status,
      'scheduledAt': DateTime.now().toIso8601String(),
      'createdAt': DateTime.now().toIso8601String(),
      'updatedAt': DateTime.now().toIso8601String(),
    };
  }

  /// Create a mock alert object
  static Map<String, dynamic> createMockAlert({
    String id = 'alert123',
    String schoolId = 'school123',
    String type = 'fire',
    String severity = 'high',
    String message = 'Test alert',
  }) {
    return {
      '_id': id,
      'schoolId': schoolId,
      'type': type,
      'severity': severity,
      'message': message,
      'status': 'active',
      'triggeredBy': 'user123',
      'createdAt': DateTime.now().toIso8601String(),
      'updatedAt': DateTime.now().toIso8601String(),
    };
  }
}

