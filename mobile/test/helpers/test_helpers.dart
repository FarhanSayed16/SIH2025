import 'package:flutter_test/flutter_test.dart';

/// Test helper utilities
class TestHelpers {
  /// Create a mock user data
  static Map<String, dynamic> createMockUser({
    String id = '1',
    String email = 'test@example.com',
    String name = 'Test User',
    String role = 'student',
  }) {
    return {
      'id': id,
      'email': email,
      'name': name,
      'role': role,
    };
  }

  /// Create a mock school data
  static Map<String, dynamic> createMockSchool({
    String id = '1',
    String name = 'Test School',
  }) {
    return {
      'id': id,
      'name': name,
      'address': '123 Test Street',
      'location': {
        'type': 'Point',
        'coordinates': [75.0, 30.0],
      },
    };
  }
}

