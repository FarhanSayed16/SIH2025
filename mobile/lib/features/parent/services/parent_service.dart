/// Parent Service
/// Handles all parent-related API calls
/// Parent Monitoring System - Phase 3

import '../../../core/services/api_service.dart';
import '../../../core/constants/api_endpoints.dart';
import '../models/parent_models.dart';

class ParentService {
  final ApiService _apiService;

  ParentService(this._apiService);

  /// Get all children for authenticated parent
  Future<List<ParentChild>> getChildren() async {
    try {
      final response = await _apiService.get(ApiEndpoints.parentChildren);
      if (response.data['success'] == true) {
        final children = response.data['data']?['children'] as List<dynamic>?;
        return children
                ?.map((e) => ParentChild.fromJson(e as Map<String, dynamic>))
                .toList() ??
            [];
      }
      throw Exception(response.data['message'] ?? 'Failed to load children');
    } catch (e) {
      print('Error getting children: $e');
      rethrow;
    }
  }

  /// Get detailed information about a specific child
  Future<ChildProgress> getChildDetails(String studentId) async {
    try {
      final response =
          await _apiService.get(ApiEndpoints.parentChildDetails(studentId));
      if (response.data['success'] == true) {
        return ChildProgress.fromJson(
            (response.data['data'] as Map<String, dynamic>?) ??
                <String, dynamic>{});
      }
      throw Exception(
          response.data['message'] ?? 'Failed to load child details');
    } catch (e) {
      print('Error getting child details: $e');
      rethrow;
    }
  }

  /// Get child's academic progress
  Future<ChildProgress> getChildProgress(
    String studentId, {
    String? startDate,
    String? endDate,
  }) async {
    try {
      String endpoint = ApiEndpoints.parentChildProgress(studentId);
      if (startDate != null || endDate != null) {
        final params = <String>[];
        if (startDate != null) params.add('startDate=$startDate');
        if (endDate != null) params.add('endDate=$endDate');
        endpoint += '?${params.join('&')}';
      }
      final response = await _apiService.get(endpoint);
      if (response.data['success'] == true) {
        return ChildProgress.fromJson(
            (response.data['data'] as Map<String, dynamic>?) ??
                <String, dynamic>{});
      }
      throw Exception(
          response.data['message'] ?? 'Failed to load child progress');
    } catch (e) {
      print('Error getting child progress: $e');
      rethrow;
    }
  }

  /// Get child's current location
  Future<ChildLocation> getChildLocation(String studentId) async {
    try {
      final response =
          await _apiService.get(ApiEndpoints.parentChildLocation(studentId));
      if (response.data['success'] == true) {
        return ChildLocation.fromJson(
            (response.data['data'] as Map<String, dynamic>?) ??
                <String, dynamic>{});
      }
      throw Exception(
          response.data['message'] ?? 'Failed to load child location');
    } catch (e) {
      print('Error getting child location: $e');
      rethrow;
    }
  }

  /// Get child's drill participation history
  Future<List<DrillParticipation>> getChildDrills(String studentId) async {
    try {
      final response =
          await _apiService.get(ApiEndpoints.parentChildDrills(studentId));
      if (response.data['success'] == true) {
        final drills = response.data['data']?['drills'] as List<dynamic>?;
        return drills
                ?.map((e) =>
                    DrillParticipation.fromJson(e as Map<String, dynamic>))
                .toList() ??
            [];
      }
      throw Exception(
          response.data['message'] ?? 'Failed to load drill history');
    } catch (e) {
      print('Error getting child drills: $e');
      rethrow;
    }
  }

  /// Get child's attendance records
  Future<AttendanceData> getChildAttendance(
    String studentId, {
    String? startDate,
    String? endDate,
  }) async {
    try {
      String endpoint = ApiEndpoints.parentChildAttendance(studentId);
      if (startDate != null || endDate != null) {
        final params = <String>[];
        if (startDate != null) params.add('startDate=$startDate');
        if (endDate != null) params.add('endDate=$endDate');
        endpoint += '?${params.join('&')}';
      }
      final response = await _apiService.get(endpoint);
      if (response.data['success'] == true) {
        return AttendanceData.fromJson(
            (response.data['data'] as Map<String, dynamic>?) ??
                <String, dynamic>{});
      }
      throw Exception(response.data['message'] ?? 'Failed to load attendance');
    } catch (e) {
      print('Error getting child attendance: $e');
      rethrow;
    }
  }

  /// Verify student QR code
  Future<QRVerificationResult> verifyStudentQR(String qrCode) async {
    try {
      final response = await _apiService.post(
        ApiEndpoints.parentVerifyStudentQR,
        data: {'qrCode': qrCode},
      );
      if (response.data['success'] == true) {
        return QRVerificationResult.fromJson(
            (response.data['data'] as Map<String, dynamic>?) ??
                <String, dynamic>{});
      }
      throw Exception(response.data['message'] ?? 'Failed to verify QR code');
    } catch (e) {
      print('Error verifying QR code: $e');
      rethrow;
    }
  }

  /// Get parent notifications
  Future<List<ParentNotification>> getNotifications({
    String? type,
    bool? read,
    int? limit,
  }) async {
    try {
      String endpoint = ApiEndpoints.parentNotifications;
      final params = <String>[];
      if (type != null) params.add('type=$type');
      if (read != null) params.add('read=$read');
      if (limit != null) params.add('limit=$limit');
      if (params.isNotEmpty) endpoint += '?${params.join('&')}';

      final response = await _apiService.get(endpoint);
      if (response.data['success'] == true) {
        final notifications =
            response.data['data']?['notifications'] as List<dynamic>?;
        return notifications
                ?.map((e) =>
                    ParentNotification.fromJson(e as Map<String, dynamic>))
                .toList() ??
            [];
      }
      throw Exception(
          response.data['message'] ?? 'Failed to load notifications');
    } catch (e) {
      print('Error getting notifications: $e');
      rethrow;
    }
  }

  /// Mark notification as read
  Future<void> markNotificationRead(String notificationId) async {
    try {
      final response = await _apiService.put(
        ApiEndpoints.parentNotificationRead(notificationId),
        data: {},
      );
      if (response.data['success'] != true) {
        throw Exception(
            response.data['message'] ?? 'Failed to mark notification as read');
      }
    } catch (e) {
      print('Error marking notification as read: $e');
      rethrow;
    }
  }

  /// Mark all notifications as read
  Future<int> markAllNotificationsRead() async {
    try {
      final response = await _apiService.put(
        ApiEndpoints.parentMarkAllNotificationsRead,
        data: {},
      );
      if (response.data['success'] == true) {
        return (response.data['data']?['count'] as int?) ?? 0;
      }
      throw Exception(response.data['message'] ??
          'Failed to mark all notifications as read');
    } catch (e) {
      print('Error marking all notifications as read: $e');
      rethrow;
    }
  }

  /// Link child by QR code
  Future<QRVerificationResult> linkChildByQR(String qrCode) async {
    try {
      final response = await _apiService.post(
        ApiEndpoints.parentLinkChildByQr,
        data: {'qrCode': qrCode, 'relationship': 'other'},
      );
      if (response.data['success'] == true) {
        return QRVerificationResult.fromJson(
          (response.data['data'] as Map<String, dynamic>?) ??
              <String, dynamic>{},
        );
      }
      throw Exception(
          response.data['message'] ?? 'Failed to link child by QR code');
    } catch (e) {
      print('Error linking child by QR: $e');
      rethrow;
    }
  }

  /// Link child by Student ID
  Future<QRVerificationResult> linkChildById(String studentId) async {
    try {
      final response = await _apiService.post(
        ApiEndpoints.parentLinkChildById,
        data: {'studentId': studentId, 'relationship': 'other'},
      );
      if (response.data['success'] == true) {
        return QRVerificationResult.fromJson(
          (response.data['data'] as Map<String, dynamic>?) ??
              <String, dynamic>{},
        );
      }
      throw Exception(
          response.data['message'] ?? 'Failed to link child by Student ID');
    } catch (e) {
      print('Error linking child by ID: $e');
      rethrow;
    }
  }

  /// Unlink a child from parent
  Future<void> unlinkChild(String studentId) async {
    try {
      final response =
          await _apiService.delete(ApiEndpoints.parentUnlinkChild(studentId));
      if (response.data['success'] != true) {
        throw Exception(response.data['message'] ?? 'Failed to unlink child');
      }
    } catch (e) {
      print('Error unlinking child: $e');
      rethrow;
    }
  }

  /// Update relationship type
  Future<void> updateRelationship(String studentId, String relationship) async {
    try {
      final response = await _apiService.put(
        ApiEndpoints.parentUpdateRelationship(studentId),
        data: {'relationship': relationship},
      );
      if (response.data['success'] != true) {
        throw Exception(
            response.data['message'] ?? 'Failed to update relationship');
      }
    } catch (e) {
      print('Error updating relationship: $e');
      rethrow;
    }
  }

  /// Get child real-time status
  Future<Map<String, dynamic>> getChildStatus(String studentId) async {
    try {
      final response =
          await _apiService.get(ApiEndpoints.parentChildStatus(studentId));
      if (response.data['success'] == true) {
        return (response.data['data'] as Map<String, dynamic>?) ??
            <String, dynamic>{};
      }
      throw Exception(response.data['message'] ?? 'Failed to get child status');
    } catch (e) {
      print('Error getting child status: $e');
      rethrow;
    }
  }

  /// Get dashboard summary
  Future<Map<String, dynamic>> getDashboardSummary() async {
    try {
      final response =
          await _apiService.get(ApiEndpoints.parentDashboardSummary);
      if (response.data['success'] == true) {
        return (response.data['data'] as Map<String, dynamic>?) ??
            <String, dynamic>{};
      }
      throw Exception(
          response.data['message'] ?? 'Failed to get dashboard summary');
    } catch (e) {
      print('Error getting dashboard summary: $e');
      rethrow;
    }
  }

  /// Update parent profile
  Future<Map<String, dynamic>> updateProfile(
      Map<String, dynamic> profileData) async {
    try {
      final response = await _apiService.put(
        ApiEndpoints.parentProfile,
        data: profileData,
      );
      if (response.data['success'] == true) {
        return (response.data['data'] as Map<String, dynamic>?) ??
            <String, dynamic>{};
      }
      throw Exception(response.data['message'] ?? 'Failed to update profile');
    } catch (e) {
      print('Error updating profile: $e');
      rethrow;
    }
  }

  /// Change parent password
  Future<void> changePassword(String oldPassword, String newPassword) async {
    try {
      final response = await _apiService.put(
        ApiEndpoints.parentChangePassword,
        data: {
          'oldPassword': oldPassword,
          'newPassword': newPassword,
        },
      );
      if (response.data['success'] != true) {
        throw Exception(
            response.data['message'] ?? 'Failed to change password');
      }
    } catch (e) {
      print('Error changing password: $e');
      rethrow;
    }
  }

  /// Phase 6: Get child activity timeline
  /// GET /api/parent/children/:studentId/activity
  Future<Map<String, dynamic>> getChildActivity(
    String studentId, {
    int? page,
    int? limit,
    String? activityType,
    String? startDate,
    String? endDate,
  }) async {
    try {
      String endpoint = '/parent/children/$studentId/activity';
      final params = <String>[];
      if (page != null) params.add('page=$page');
      if (limit != null) params.add('limit=$limit');
      if (activityType != null) params.add('activityType=$activityType');
      if (startDate != null) params.add('startDate=$startDate');
      if (endDate != null) params.add('endDate=$endDate');
      if (params.isNotEmpty) endpoint += '?${params.join('&')}';

      final response = await _apiService.get(endpoint);
      if (response.data['success'] == true) {
        return (response.data['data'] as Map<String, dynamic>?) ??
            <String, dynamic>{};
      }
      throw Exception(
          response.data['message'] ?? 'Failed to load child activity');
    } catch (e) {
      print('Error getting child activity: $e');
      rethrow;
    }
  }

  /// Phase 6: Get all QR codes for authenticated parent
  /// GET /api/parent/qr-codes
  Future<List<Map<String, dynamic>>> getQRCodes() async {
    try {
      final response = await _apiService.get('/parent/qr-codes');
      if (response.data['success'] == true) {
        final qrCodes = response.data['data']?['qrCodes'] as List<dynamic>?;
        return qrCodes
                ?.map((e) => e as Map<String, dynamic>)
                .toList() ??
            [];
      }
      throw Exception(response.data['message'] ?? 'Failed to load QR codes');
    } catch (e) {
      print('Error getting QR codes: $e');
      rethrow;
    }
  }

  /// Phase 6: Get QR code for a specific child
  /// GET /api/parent/qr-code/:studentId
  Future<Map<String, dynamic>> getChildQRCode(String studentId) async {
    try {
      final response = await _apiService.get('/parent/qr-code/$studentId');
      if (response.data['success'] == true) {
        return (response.data['data'] as Map<String, dynamic>?) ??
            <String, dynamic>{};
      }
      throw Exception(
          response.data['message'] ?? 'Failed to load child QR code');
    } catch (e) {
      print('Error getting child QR code: $e');
      rethrow;
    }
  }
}
