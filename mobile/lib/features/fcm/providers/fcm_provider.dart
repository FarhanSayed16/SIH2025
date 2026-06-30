import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/services/fcm_service.dart';
import '../../../core/services/api_service.dart';
import '../../../core/services/storage_service.dart';
import '../../../core/constants/api_endpoints.dart';

/// FCM state
class FcmState {
  final String? token;
  final bool isInitialized;
  final String? error;

  FcmState({
    this.token,
    this.isInitialized = false,
    this.error,
  });

  FcmState copyWith({
    String? token,
    bool? isInitialized,
    String? error,
  }) {
    return FcmState(
      token: token ?? this.token,
      isInitialized: isInitialized ?? this.isInitialized,
      error: error,
    );
  }
}

/// FCM notifier
class FcmNotifier extends StateNotifier<FcmState> {
  final FcmService _fcmService;
  final ApiService _apiService;
  final StorageService _storageService;

  FcmNotifier(this._fcmService, this._apiService, this._storageService)
      : super(FcmState()) {
    _setupCallbacks();
  }

  void _setupCallbacks() {
    _fcmService.onTokenReceived = (token) {
      state = state.copyWith(token: token);
      // Auto-register token with backend
      _registerTokenWithBackend(token);
    };

    _fcmService.onMessageReceived = (message) {
      // Handle message received
      // This will trigger navigation in the app via FcmMessageHandler
    };
  }

  /// Initialize FCM
  Future<void> initialize() async {
    try {
      await _fcmService.initialize();
      state = state.copyWith(
        isInitialized: true,
        token: _fcmService.fcmToken,
      );
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }

  /// Register FCM token with backend
  Future<void> registerTokenWithBackend(String? userId) async {
    if (userId == null || state.token == null) return;

    try {
      // Wait a bit to ensure auth token is set in API service
      await Future<void>.delayed(const Duration(milliseconds: 1000));

      // Verify token is available in storage before making request
      final accessToken = await _storageService.getAccessToken();
      if (accessToken == null || accessToken.isEmpty) {
        print(
            '⚠️ Access token not available yet, skipping FCM token registration');
        return;
      }

      // Ensure API service has the token
      _apiService.setAuthToken(accessToken);

      // Backend expects POST, not PUT
      await _apiService.post(
        ApiEndpoints.userFcmToken(userId),
        data: {'fcmToken': state.token},
      );
      print('✅ FCM token registered successfully');
    } catch (e) {
      // Log error but don't fail - token will be registered on next app open
      // Connection errors are expected (network issues, dev tunnels, etc.)
      // Don't trigger logout or other auth flows for FCM registration failures
      if (e.toString().contains('connection') ||
          e.toString().contains('host lookup') ||
          e.toString().contains('timeout')) {
        print(
            '⚠️ FCM token registration failed due to network issue (will retry later): $e');
      } else {
        print('⚠️ Failed to register FCM token (will retry later): $e');
      }
    }
  }

  /// Auto-register token (called when token is received)
  Future<void> _registerTokenWithBackend(String token) async {
    final userId = await _storageService.getUserId();
    if (userId != null) {
      await registerTokenWithBackend(userId);
    }
  }

  /// Subscribe to school topic
  Future<void> subscribeToSchool(String? schoolId) async {
    if (schoolId == null || schoolId.isEmpty) {
      print('⚠️ Cannot subscribe to topic: schoolId is null or empty');
      return;
    }

    // FCM topic names must match: [a-zA-Z0-9-_.~%]+
    // Remove any invalid characters
    final sanitizedId = schoolId.replaceAll(RegExp(r'[^a-zA-Z0-9\-_.~%]'), '_');
    final topicName = 'school_$sanitizedId';

    // Validate topic name length (FCM has a limit)
    if (topicName.length > 100) {
      print('⚠️ Topic name too long: $topicName');
      return;
    }

    try {
      await _fcmService.subscribeToTopic(topicName);
      print('✅ Subscribed to FCM topic: $topicName');
    } catch (e) {
      print('⚠️ Failed to subscribe to topic: $e');
      state = state.copyWith(error: e.toString());
    }
  }

  /// Unsubscribe from school topic
  Future<void> unsubscribeFromSchool(String schoolId) async {
    try {
      await _fcmService.unsubscribeFromTopic('school_$schoolId');
    } catch (e) {
      // Ignore errors
    }
  }

  /// Delete token
  Future<void> deleteToken() async {
    try {
      await _fcmService.deleteToken();
      state = state.copyWith(token: null);
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }
}

/// FCM service provider
final fcmServiceProvider = Provider<FcmService>((ref) {
  return FcmService();
});

/// FCM state provider
final fcmProvider = StateNotifierProvider<FcmNotifier, FcmState>((ref) {
  final fcmService = ref.watch(fcmServiceProvider);
  final apiService = ApiService();
  final storageService = StorageService();
  return FcmNotifier(fcmService, apiService, storageService);
});
