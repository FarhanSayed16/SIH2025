import 'package:device_info_plus/device_info_plus.dart';
import '../../../core/services/api_service.dart';
import '../../../core/constants/api_endpoints.dart';

/// Device Service
/// Phase 2.5: K-12 Multi-Access
class DeviceService {
  final ApiService _apiService;

  DeviceService({ApiService? apiService})
      : _apiService = apiService ?? ApiService();

  /// Get device ID
  Future<String> getDeviceId() async {
    try {
      final deviceInfo = DeviceInfoPlugin();
      final androidInfo = await deviceInfo.androidInfo;
      if (androidInfo.isPhysicalDevice) {
        return androidInfo.id; // Android ID
      }
      // For iOS or other platforms
      try {
        final iosInfo = await deviceInfo.iosInfo;
        return iosInfo.identifierForVendor ?? 'unknown';
      } catch (_) {
        return 'unknown';
      }
    } catch (e) {
      print('Error getting device ID: $e');
      // Fallback: generate a unique ID based on timestamp
      return 'device_${DateTime.now().millisecondsSinceEpoch}';
    }
  }

  /// Register device
  Future<Map<String, dynamic>> registerDevice({
    required String deviceName,
    required String deviceType,
    required String institutionId,
    String? classId,
  }) async {
    try {
      final deviceId = await getDeviceId();
      
      final response = await _apiService.post(
        ApiEndpoints.registerDevice,
        data: {
          'deviceId': deviceId,
          'deviceName': deviceName,
          'deviceType': deviceType,
          'institutionId': institutionId,
          if (classId != null) 'classId': classId,
        },
      );

      final data = response.data as Map<String, dynamic>;
      return data['data'] as Map<String, dynamic>? ?? {};
    } catch (e) {
      print('❌ Device registration error: $e');
      rethrow;
    }
  }

  /// Login with device token
  Future<Map<String, dynamic>> loginWithDevice(String deviceToken) async {
    try {
      final response = await _apiService.post(
        ApiEndpoints.deviceLogin,
        data: {
          'deviceToken': deviceToken,
        },
      );

      final data = response.data as Map<String, dynamic>;
      return data['data'] as Map<String, dynamic>? ?? {};
    } catch (e) {
      print('❌ Device login error: $e');
      rethrow;
    }
  }

  /// Get device info
  Future<Map<String, dynamic>> getDevice(String deviceId) async {
    try {
      final response = await _apiService.get(ApiEndpoints.device(deviceId));
      final data = response.data as Map<String, dynamic>;
      return data['data'] as Map<String, dynamic>? ?? {};
    } catch (e) {
      print('❌ Get device error: $e');
      rethrow;
    }
  }
}

