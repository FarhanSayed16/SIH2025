/// Student Service
/// Handles student-specific API calls (join/leave class)

import 'dart:convert';
import 'package:dio/dio.dart';
import '../../../core/constants/api_endpoints.dart';
import '../../../core/services/api_service.dart';

class StudentService {
  final ApiService _apiService;

  StudentService({ApiService? apiService}) 
      : _apiService = apiService ?? ApiService();

  /// Parse QR code JSON and extract classId
  /// Returns classId if valid, null otherwise
  String? parseClassQRCode(String qrCodeString) {
    try {
      final parsed = jsonDecode(qrCodeString) as Map<String, dynamic>;
      if (parsed['type'] == 'classroom_join' && parsed['classId'] != null) {
        return parsed['classId'] as String;
      }
    } catch (e) {
      // Not JSON or invalid format
    }
    return null;
  }

  /// Join a class using classCode
  /// POST /api/student/join-class
  Future<Map<String, dynamic>> joinClass(String classCode) async {
    try {
      final response = await _apiService.post(
        ApiEndpoints.studentJoinClass,
        data: {
          'classCode': classCode.trim(),
        },
      );

      if (response.statusCode == 200 && response.data['success'] == true) {
        return response.data as Map<String, dynamic>;
      } else {
        throw DioException(
          requestOptions: response.requestOptions,
          response: response,
          type: DioExceptionType.badResponse,
        );
      }
    } on DioException catch (e) {
      // Extract error message from response
      String message = 'Failed to join class';
      if (e.response?.data != null) {
        final data = e.response!.data;
        if (data is Map<String, dynamic>) {
          message = (data['message'] as String?) ?? message;
          // Check for field errors
          if (data['errors'] != null && data['errors'] is Map) {
            final errors = data['errors'] as Map<String, dynamic>;
            if (errors['classCode'] != null) {
              message = errors['classCode'].toString();
            }
          }
        }
      }
      throw Exception(message);
    } catch (e) {
      throw Exception('Failed to join class: ${e.toString()}');
    }
  }

  /// Join a class using classId (from QR code)
  /// POST /api/student/join-class
  Future<Map<String, dynamic>> joinClassByQR(String classId) async {
    try {
      final response = await _apiService.post(
        ApiEndpoints.studentJoinClass,
        data: {
          'classId': classId.trim(),
        },
      );

      if (response.statusCode == 200 && response.data['success'] == true) {
        return response.data as Map<String, dynamic>;
      } else {
        throw DioException(
          requestOptions: response.requestOptions,
          response: response,
          type: DioExceptionType.badResponse,
        );
      }
    } on DioException catch (e) {
      // Extract error message from response
      String message = 'Failed to join class';
      if (e.response?.data != null) {
        final data = e.response!.data;
        if (data is Map<String, dynamic>) {
          message = (data['message'] as String?) ?? message;
          // Check for field errors
          if (data['errors'] != null && data['errors'] is Map) {
            final errors = data['errors'] as Map<String, dynamic>;
            if (errors['classId'] != null) {
              message = errors['classId'].toString();
            }
          }
        }
      }
      throw Exception(message);
    } catch (e) {
      throw Exception('Failed to join class: ${e.toString()}');
    }
  }

  /// Leave current class
  /// POST /api/student/leave-class
  Future<Map<String, dynamic>> leaveClass() async {
    try {
      final response = await _apiService.post(
        ApiEndpoints.studentLeaveClass,
      );

      if (response.statusCode == 200 && response.data['success'] == true) {
        return response.data as Map<String, dynamic>;
      } else {
        throw DioException(
          requestOptions: response.requestOptions,
          response: response,
          type: DioExceptionType.badResponse,
        );
      }
    } on DioException catch (e) {
      String message = 'Failed to leave class';
      if (e.response?.data != null) {
        final data = e.response!.data;
        if (data is Map<String, dynamic>) {
          message = (data['message'] as String?) ?? message;
        }
      }
      throw Exception(message);
    } catch (e) {
      throw Exception('Failed to leave class: ${e.toString()}');
    }
  }

  /// Get student's current class information
  /// GET /api/auth/profile
  Future<Map<String, dynamic>> getStudentClassInfo() async {
    try {
      final response = await _apiService.get('/auth/profile');

      if (response.statusCode == 200 && response.data['success'] == true) {
        return response.data as Map<String, dynamic>;
      } else {
        throw DioException(
          requestOptions: response.requestOptions,
          response: response,
          type: DioExceptionType.badResponse,
        );
      }
    } on DioException catch (e) {
      String message = 'Failed to load class information';
      if (e.response?.data != null) {
        final data = e.response!.data;
        if (data is Map<String, dynamic>) {
          message = (data['message'] as String?) ?? message;
        }
      }
      throw Exception(message);
    } catch (e) {
      throw Exception('Failed to load class information: ${e.toString()}');
    }
  }
}

