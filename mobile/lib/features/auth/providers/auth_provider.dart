import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/user_model.dart';
import '../services/auth_service.dart';
import '../../../core/services/storage_service.dart';
import '../../../core/providers/api_service_provider.dart';
import '../../progress/services/progress_restoration_service.dart';
import '../../drills/services/drill_service.dart';

/// Auth state
class AuthState {
  final UserModel? user;
  final bool isLoading;
  final String? error;
  final bool isAuthenticated;

  AuthState({
    this.user,
    this.isLoading = false,
    this.error,
    this.isAuthenticated = false,
  });

  AuthState copyWith({
    UserModel? user,
    bool? isLoading,
    String? error,
    bool? isAuthenticated,
  }) {
    return AuthState(
      user: user ?? this.user,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
    );
  }
}

/// Auth notifier
class AuthNotifier extends StateNotifier<AuthState> {
  final AuthService _authService;

  AuthNotifier(this._authService) : super(AuthState()) {
    _checkAuthStatus();
  }

  /// Check if user is already authenticated
  Future<void> _checkAuthStatus() async {
    state = state.copyWith(isLoading: true);
    try {
      final isAuth = await _authService.isAuthenticated();
      if (isAuth) {
        try {
          final user = await _authService.getCurrentUser();
          if (user != null) {
            state = state.copyWith(
              user: user,
              isAuthenticated: true,
              isLoading: false,
            );
            // Restore progress on app startup if already authenticated
            await _restoreUserProgress(user.id);
          } else {
            // Token exists but user fetch failed (likely expired token)
            // Clear auth state and let user login again
            state = state.copyWith(isLoading: false, isAuthenticated: false);
          }
        } catch (e) {
          // If getCurrentUser fails (401, etc.), token is invalid
          // Clear auth state silently - user will need to login again
          print('⚠️ Token validation failed on startup: $e');
          state = state.copyWith(isLoading: false, isAuthenticated: false);
        }
      } else {
        state = state.copyWith(isLoading: false);
      }
    } catch (e) {
      // If isAuthenticated check fails, just set loading to false
      print('⚠️ Auth status check failed: $e');
      state = state.copyWith(
        isLoading: false,
        isAuthenticated: false,
      );
    }
  }

  /// Login
  /// Phase: Progress Persistence Fix
  /// Changes: Triggers progress restoration after successful login
  Future<void> login(String email, String password) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final authResponse = await _authService.login(email, password);
      state = state.copyWith(
        user: authResponse.user,
        isAuthenticated: true,
        isLoading: false,
      );

      // Restore progress immediately after login
      await _restoreUserProgress(authResponse.user.id);
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
      rethrow;
    }
  }

  /// Get access token (for socket connection)
  Future<String?> getAccessToken() async {
    return await _authService.getAccessToken();
  }

  /// Phase 2.5: Login with QR code
  Future<void> loginWithQR(String qrCode) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final authResponse = await _authService.loginWithQR(qrCode);
      state = state.copyWith(
        user: authResponse.user,
        isAuthenticated: true,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
      rethrow;
    }
  }

  /// Phase 3.4.6.1: Register with all fields
  /// PHASE D: Added classCode parameter for student registration
  Future<void> register({
    required String email,
    required String password,
    required String name,
    required String role,
    required String phone,
    String? institutionId,
    String? grade,
    String? section,
    String? classId,
    String? classCode, // PHASE D: Class code for student registration
  }) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final authResponse = await _authService.register(
        email: email,
        password: password,
        name: name,
        role: role,
        phone: phone,
        institutionId: institutionId,
        grade: grade,
        section: section,
        classId: classId,
        classCode: classCode, // PHASE D
      );
      state = state.copyWith(
        user: authResponse.user,
        isAuthenticated: true,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
      rethrow;
    }
  }

  /// Logout
  Future<void> logout() async {
    state = state.copyWith(isLoading: true);
    try {
      await _authService.logout();
      state = AuthState();
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  /// Restore user progress after login/startup
  /// Phase: NDMA Module Video Progress Persistence
  /// This ensures all progress (including video progress) is loaded on app startup
  Future<void> _restoreUserProgress(String userId) async {
    try {
      final progressService = ProgressRestorationService();
      final progress = await progressService.restoreProgress(userId);
      print(
          '✅ [AUTH] User progress restored: ${progress.completedModules.length} modules, ${progress.gameStats?.totalGamesPlayed ?? 0} games');

      // Phase 2: Check for active drills after login/startup
      await _checkForActiveDrills();
    } catch (e) {
      print('⚠️ [AUTH] Error restoring progress: $e');
    }
  }

  /// Phase 2: Check for active drills on app startup/login
  Future<void> _checkForActiveDrills() async {
    try {
      final drillService = DrillService();
      final activeDrill = await drillService.checkForActiveDrills();

      if (activeDrill != null) {
        print(
            '✅ [AUTH] Active drill detected: ${activeDrill.id} (${activeDrill.type})');
        // Note: Navigation to drill screen will be handled by the main app widget
        // or by FCM/Socket handlers. We just log it here.
      }
    } catch (e) {
      print('⚠️ [AUTH] Error checking for active drills: $e');
      // Don't fail auth if drill check fails
    }
  }

  /// Clear error
  void clearError() {
    state = state.copyWith(error: null);
  }
}

/// Auth service provider
/// Uses shared ApiService from apiServiceProvider to ensure token consistency
final authServiceProvider = Provider<AuthService>((ref) {
  // Use shared ApiService instance to ensure all services use the same instance
  final apiService = ref.watch(apiServiceProvider);
  final storageService = StorageService();
  final authService = AuthService(
    apiService: apiService,
    storageService: storageService,
  );

  // Link auth service to API service for token refresh
  // This allows ApiService interceptor to refresh tokens automatically
  apiService.setAuthService(authService);

  return authService;
});

/// Auth state provider
final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final authService = ref.watch(authServiceProvider);
  return AuthNotifier(authService);
});
