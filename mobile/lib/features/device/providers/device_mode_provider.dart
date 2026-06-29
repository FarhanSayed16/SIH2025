import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/device_service.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Device Mode State
class DeviceModeState {
  final Map<String, dynamic>? device;
  final Map<String, dynamic>? selectedClass;
  final String? mode; // 'class_device', 'projector', 'teacher_device'
  final bool isLoading;
  final String? error;
  final String? registrationToken;

  DeviceModeState({
    this.device,
    this.selectedClass,
    this.mode,
    this.isLoading = false,
    this.error,
    this.registrationToken,
  });

  DeviceModeState copyWith({
    Map<String, dynamic>? device,
    Map<String, dynamic>? selectedClass,
    String? mode,
    bool? isLoading,
    String? error,
    String? registrationToken,
  }) {
    return DeviceModeState(
      device: device ?? this.device,
      selectedClass: selectedClass ?? this.selectedClass,
      mode: mode ?? this.mode,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      registrationToken: registrationToken ?? this.registrationToken,
    );
  }
}

/// Device Mode Notifier
class DeviceModeNotifier extends StateNotifier<DeviceModeState> {
  final DeviceService _deviceService;
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  DeviceModeNotifier(this._deviceService) : super(DeviceModeState()) {
    _checkDeviceRegistration();
  }

  /// Check if device is registered and auto-login
  Future<void> _checkDeviceRegistration() async {
    try {
      final token = await _storage.read(key: 'device_registration_token');
      if (token != null) {
        await loginWithDevice(token);
      }
    } catch (e) {
      print('Device registration check failed: $e');
    }
  }

  /// Register device
  Future<void> registerDevice({
    required String deviceName,
    required String deviceType,
    required String institutionId,
    String? classId,
  }) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final result = await _deviceService.registerDevice(
        deviceName: deviceName,
        deviceType: deviceType,
        institutionId: institutionId,
        classId: classId,
      );

      final registrationToken = result['registrationToken'] as String?;
      if (registrationToken != null) {
        await _storage.write(
          key: 'device_registration_token',
          value: registrationToken,
        );
      }

      state = state.copyWith(
        device: result['device'] as Map<String, dynamic>?,
        registrationToken: registrationToken,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  /// Login with device token
  Future<void> loginWithDevice(String deviceToken) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final result = await _deviceService.loginWithDevice(deviceToken);

      // Store token for future auto-login
      await _storage.write(
        key: 'device_registration_token',
        value: deviceToken,
      );

      state = state.copyWith(
        device: result['device'] as Map<String, dynamic>?,
        selectedClass: result['class'] as Map<String, dynamic>?,
        mode: result['mode'] as String?,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  /// Select class (for class devices)
  Future<void> selectClass(String classId) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      // This would typically fetch class data
      // For now, just update state
      state = state.copyWith(
        isLoading: false,
        // selectedClass would be set here
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  /// Check if device is in class device mode
  bool isClassDeviceMode() {
    return state.mode == 'class_device';
  }

  /// Clear error
  void clearError() {
    state = state.copyWith(error: null);
  }
}

/// Device Service Provider
final deviceServiceProvider = Provider<DeviceService>((ref) {
  return DeviceService();
});

/// Device Mode Provider
final deviceModeProvider = StateNotifierProvider<DeviceModeNotifier, DeviceModeState>((ref) {
  final deviceService = ref.watch(deviceServiceProvider);
  return DeviceModeNotifier(deviceService);
});

