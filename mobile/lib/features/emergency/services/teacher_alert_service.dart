/**
 * Phase 4.10: Teacher Alert Service
 * Allows teachers to trigger emergency alerts from mobile app
 */

import 'package:dio/dio.dart';
import '../../../core/services/api_service.dart';
import '../../../core/constants/api_endpoints.dart';
import '../../../core/services/storage_service.dart';

class TeacherAlertService {
  final ApiService _apiService;
  final StorageService _storageService;

  TeacherAlertService({
    ApiService? apiService,
    StorageService? storageService,
  })  : _apiService = apiService ?? ApiService(),
        _storageService = storageService ?? StorageService();

  /// Trigger emergency alert
  Future<Map<String, dynamic>> triggerAlert({
    required String type,
    String severity = 'high',
    String? title,
    String? description,
    Map<String, dynamic>? locationDetails,
  }) async {
    try {
      final token = await _storageService.getAccessToken();
      if (token == null || token.isEmpty) {
        return {
          'success': false,
          'error': 'User not authenticated',
        };
      }

      _apiService.setAuthToken(token);

      final response = await _apiService.post(
        ApiEndpoints.teacherAlert,
        data: {
          'type': type,
          'severity': severity,
          'title': title,
          'description': description,
          'locationDetails': locationDetails ?? {},
        },
      );

      if (response.statusCode == 201 && response.data['success'] == true) {
        return {
          'success': true,
          'alert': response.data['data']['alert'],
          'alertLog': response.data['data']['alertLog'],
          'affectedUsersCount': response.data['data']['affectedUsersCount'],
        };
      } else {
        return {
          'success': false,
          'error': response.data['message'] ?? 'Failed to trigger alert',
        };
      }
    } catch (e) {
      print('Error triggering teacher alert: $e');
      return {
        'success': false,
        'error': e.toString(),
      };
    }
  }
}

