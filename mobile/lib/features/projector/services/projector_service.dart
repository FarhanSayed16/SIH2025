import '../../../core/services/api_service.dart';

/// Projector Service
/// Phase 2.5: K-12 Multi-Access
class ProjectorService {
  final ApiService _apiService;

  ProjectorService({ApiService? apiService})
      : _apiService = apiService ?? ApiService();

  /// Create projector session
  Future<Map<String, dynamic>> createSession({
    required String deviceId,
    required String institutionId,
    String? classId,
    Map<String, dynamic>? currentContent,
  }) async {
    try {
      final response = await _apiService.post(
        '/projector/sessions',
        data: {
          'deviceId': deviceId,
          'institutionId': institutionId,
          if (classId != null) 'classId': classId,
          if (currentContent != null) 'currentContent': currentContent,
        },
      );

      final data = response.data as Map<String, dynamic>;
      return data['data'] as Map<String, dynamic>? ?? {};
    } catch (e) {
      print('❌ Create session error: $e');
      rethrow;
    }
  }

  /// Get active session for device
  Future<Map<String, dynamic>?> getActiveSession(String deviceId) async {
    try {
      final response = await _apiService.get('/projector/sessions/device/$deviceId');
      final data = response.data as Map<String, dynamic>;
      if (data['success'] == true && data['data'] != null) {
        return data['data'] as Map<String, dynamic>;
      }
      return null;
    } catch (e) {
      print('❌ Get active session error: $e');
      return null;
    }
  }

  /// Get session by ID
  Future<Map<String, dynamic>> getSession(String sessionId) async {
    try {
      final response = await _apiService.get('/projector/sessions/$sessionId');
      final data = response.data as Map<String, dynamic>;
      return data['data'] as Map<String, dynamic>? ?? {};
    } catch (e) {
      print('❌ Get session error: $e');
      rethrow;
    }
  }

  /// Update session content
  Future<Map<String, dynamic>> updateContent(
    String sessionId,
    Map<String, dynamic> contentData,
  ) async {
    try {
      final response = await _apiService.put(
        '/projector/sessions/$sessionId/content',
        data: {
          'contentData': contentData,
        },
      );

      final data = response.data as Map<String, dynamic>;
      return data['data'] as Map<String, dynamic>? ?? {};
    } catch (e) {
      print('❌ Update content error: $e');
      rethrow;
    }
  }

  /// Connect device to session
  Future<Map<String, dynamic>> connectDevice(
    String sessionId,
    String deviceId,
    String deviceName,
  ) async {
    try {
      final response = await _apiService.post(
        '/projector/sessions/$sessionId/connect',
        data: {
          'deviceId': deviceId,
          'deviceName': deviceName,
        },
      );

      final data = response.data as Map<String, dynamic>;
      return data['data'] as Map<String, dynamic>? ?? {};
    } catch (e) {
      print('❌ Connect device error: $e');
      rethrow;
    }
  }

  /// End session
  Future<void> endSession(String sessionId) async {
    try {
      await _apiService.post('/projector/sessions/$sessionId/end');
    } catch (e) {
      print('❌ End session error: $e');
      rethrow;
    }
  }
}

