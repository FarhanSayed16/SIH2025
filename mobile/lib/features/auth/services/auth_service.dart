import 'package:dio/dio.dart';
import '../../../core/services/api_service.dart';
import '../../../core/services/storage_service.dart';
import '../../../core/constants/api_endpoints.dart';
import '../models/auth_response.dart';
import '../models/user_model.dart';

/// Authentication Service
class AuthService {
  final ApiService _apiService;
  final StorageService _storageService;

  AuthService({
    ApiService? apiService,
    StorageService? storageService,
  })  : _apiService = apiService ?? ApiService(),
        _storageService = storageService ?? StorageService();

  /// Login user
  Future<AuthResponse> login(String email, String password) async {
    try {
      // Reset logout flag before attempting login to allow the request
      _apiService.resetLogoutFlag();
      print('🔐 Attempting login for: $email');
      final response = await _apiService.post(
        ApiEndpoints.login,
        data: {
          'email': email,
          'password': password,
        },
      );

      print('🔐 Login response received: ${response.statusCode}');
      print('🔐 Response data: ${response.data}');

      final responseData = response.data as Map<String, dynamic>;
      final authResponse = AuthResponse.fromJson(responseData);

      // Validate response
      if (authResponse.accessToken.isEmpty) {
        throw Exception('Invalid response: Access token is missing');
      }
      if (authResponse.user.id.isEmpty) {
        throw Exception('Invalid response: User ID is missing');
      }

      // Store tokens
      await _storageService.storeAccessToken(authResponse.accessToken);
      await _storageService.storeRefreshToken(authResponse.refreshToken);
      await _storageService.storeUserId(authResponse.user.id);

      // Set auth token in API service
      _apiService.setAuthToken(authResponse.accessToken);
      // Reset logout flag after successful login
      _apiService.resetLogoutFlag();

      print('✅ Login successful for: ${authResponse.user.email}');
      return authResponse;
    } catch (e) {
      print('❌ Login error: $e');
      if (e is DioException) {
        final errorMessage = _handleDioError(e);
        print('🔍 Processed error message: $errorMessage');
        // Preserve the original error message for approval pending detection
        // The login screen checks for "pending teacher approval" in the error string
        final exception = Exception(errorMessage);
        // Add the message as a property for easier checking
        (exception as dynamic).message = errorMessage;
        throw exception;
      }
      rethrow;
    }
  }

  /// Phase 3.4.6.1: Register user with all fields
  /// PHASE D: Added classCode parameter for student registration
  Future<AuthResponse> register({
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
    try {
      // Reset logout flag before attempting registration to allow the request
      _apiService.resetLogoutFlag();
      print('📝 Attempting registration for: $email');
      final data = <String, dynamic>{
        'email': email,
        'password': password,
        'name': name,
        'role': role,
        'phone': phone.trim(), // Phone is required for account_user
      };

      // Add optional fields
      if (institutionId != null && institutionId.isNotEmpty) {
        data['institutionId'] = institutionId;
      }
      if (grade != null && grade.isNotEmpty) {
        data['grade'] = grade;
      }
      if (section != null && section.isNotEmpty) {
        data['section'] = section;
      }
      if (classId != null && classId.isNotEmpty) {
        data['classId'] = classId;
      }
      // PHASE D: For students, classCode is required (replaces classId for registration)
      if (classCode != null && classCode.isNotEmpty) {
        data['classCode'] = classCode;
      }

      final response = await _apiService.post(
        ApiEndpoints.register,
        data: data,
      );

      print('📝 Registration response received: ${response.statusCode}');
      print('📝 Response data: ${response.data}');

      final responseData = response.data as Map<String, dynamic>;
      final authResponse = AuthResponse.fromJson(responseData);

      // Validate response
      if (authResponse.accessToken.isEmpty) {
        throw Exception('Invalid response: Access token is missing');
      }
      if (authResponse.user.id.isEmpty) {
        throw Exception('Invalid response: User ID is missing');
      }

      // Store tokens
      await _storageService.storeAccessToken(authResponse.accessToken);
      await _storageService.storeRefreshToken(authResponse.refreshToken);
      await _storageService.storeUserId(authResponse.user.id);

      // Set auth token in API service
      _apiService.setAuthToken(authResponse.accessToken);
      // Reset logout flag after successful registration
      _apiService.resetLogoutFlag();

      print('✅ Registration successful for: ${authResponse.user.email}');
      return authResponse;
    } catch (e) {
      print('❌ Registration error: $e');
      if (e is DioException) {
        final errorMessage = _handleDioError(e);
        final fieldErrors = extractFieldErrors(e);
        print('🔍 Field errors: $fieldErrors');
        final exception = Exception(errorMessage);
        // Add field errors for display in text fields
        (exception as dynamic).fieldErrors = fieldErrors;
        (exception as dynamic).message = errorMessage;
        throw exception;
      }
      rethrow;
    }
  }

  /// Refresh access token
  Future<String> refreshToken() async {
    try {
      final refreshToken = await _storageService.getRefreshToken();
      if (refreshToken == null) {
        throw Exception('No refresh token available');
      }

      final response = await _apiService.post(
        ApiEndpoints.refresh,
        data: {
          'refreshToken': refreshToken,
        },
      );

      final data = response.data as Map<String, dynamic>;
      final newAccessToken =
          (data['data'] as Map<String, dynamic>?)?['accessToken'] as String? ??
              data['accessToken'] as String? ??
              '';

      if (newAccessToken.isEmpty) {
        throw Exception('Invalid response: Access token is missing');
      }

      await _storageService.storeAccessToken(newAccessToken);
      _apiService.setAuthToken(newAccessToken);

      return newAccessToken;
    } catch (e) {
      if (e is DioException) {
        throw _handleDioError(e);
      }
      rethrow;
    }
  }

  /// Logout user
  Future<void> logout() async {
    try {
      await _apiService.post(ApiEndpoints.logout);
    } catch (e) {
      // Continue with logout even if API call fails
    } finally {
      // Clear local storage
      await _storageService.clearSecureStorage();
      _apiService.clearAuthToken();
    }
  }

  /// Check if user is authenticated
  Future<bool> isAuthenticated() async {
    final accessToken = await _storageService.getAccessToken();
    return accessToken != null && accessToken.isNotEmpty;
  }

  /// Get current user
  Future<UserModel?> getCurrentUser() async {
    try {
      final userId = await _storageService.getUserId();
      if (userId == null) return null;

      // Restore token from storage before making request
      final token = await _storageService.getAccessToken();
      if (token != null && token.isNotEmpty) {
        _apiService.setAuthToken(token);
      }

      final response = await _apiService.get(ApiEndpoints.user(userId));

      // Check if response is HTML (wrong server/route)
      if (response.data is String &&
          (response.data as String).contains('<!DOCTYPE html>')) {
        print('⚠️ WARNING: Received HTML instead of JSON for user profile');
        print('⚠️ This indicates a routing issue. Check API base URL.');
        return null;
      }

      final data = response.data as Map<String, dynamic>;

      // Handle both response formats: {success: true, data: {user: {...}}} and {user: {...}}
      Map<String, dynamic> userData;
      if (data.containsKey('data') && data['data'] is Map) {
        final dataObj = data['data'] as Map<String, dynamic>;
        userData = dataObj.containsKey('user')
            ? dataObj['user'] as Map<String, dynamic>
            : dataObj;
      } else {
        userData = data;
      }

      return UserModel.fromJson(userData);
    } catch (e) {
      print('❌ Error getting current user: $e');
      return null;
    }
  }

  /// Auto-refresh token if needed (called by interceptor)
  Future<String?> refreshTokenIfNeeded() async {
    try {
      return await refreshToken();
    } catch (e) {
      // If refresh fails, user needs to login again
      await logout();
      return null;
    }
  }

  /// Get access token from storage
  Future<String?> getAccessToken() async {
    return await _storageService.getAccessToken();
  }

  /// Phase 2.5: Login with QR code
  Future<AuthResponse> loginWithQR(String qrCode) async {
    try {
      print('📱 Attempting QR login');
      final response = await _apiService.post(
        ApiEndpoints.qrLogin,
        data: {
          'qrCode': qrCode,
        },
      );

      print('📱 QR login response received: ${response.statusCode}');
      final responseData = response.data as Map<String, dynamic>;
      final authResponse = AuthResponse.fromJson(responseData);

      // Validate response
      if (authResponse.accessToken.isEmpty) {
        throw Exception('Invalid response: Access token is missing');
      }

      // Store tokens
      await _storageService.storeAccessToken(authResponse.accessToken);
      await _storageService.storeRefreshToken(authResponse.refreshToken);
      await _storageService.storeUserId(authResponse.user.id);

      // Set auth token in API service
      _apiService.setAuthToken(authResponse.accessToken);
      // Reset logout flag after successful QR login
      _apiService.resetLogoutFlag();

      print('✅ QR login successful for: ${authResponse.user.name}');
      return authResponse;
    } catch (e) {
      print('❌ QR login error: $e');
      if (e is DioException) {
        throw _handleDioError(e);
      }
      rethrow;
    }
  }

  /// Phase 2.5: Login with device token
  Future<Map<String, dynamic>> loginWithDevice(String deviceToken) async {
    try {
      print('📱 Attempting device login');
      final response = await _apiService.post(
        ApiEndpoints.deviceLogin,
        data: {
          'deviceToken': deviceToken,
        },
      );

      print('📱 Device login response received: ${response.statusCode}');
      final responseData = response.data as Map<String, dynamic>;
      final data =
          responseData['data'] as Map<String, dynamic>? ?? responseData;

      // Device login doesn't return user tokens - returns device/class context
      return data;
    } catch (e) {
      print('❌ Device login error: $e');
      if (e is DioException) {
        throw _handleDioError(e);
      }
      rethrow;
    }
  }

  /// Phase 2.5: Select class (for teachers)
  Future<void> selectClass(String classId) async {
    try {
      await _apiService.post(
        ApiEndpoints.selectClass,
        data: {
          'classId': classId,
        },
      );
      print('✅ Class selected: $classId');
    } catch (e) {
      print('❌ Class selection error: $e');
      if (e is DioException) {
        throw _handleDioError(e);
      }
      rethrow;
    }
  }

  /// Forgot password - Request password reset link
  Future<Map<String, dynamic>> forgotPassword(String email) async {
    try {
      print('🔐 Requesting password reset for: $email');
      final response = await _apiService.post(
        ApiEndpoints.forgotPassword,
        data: {
          'email': email,
        },
      );

      print('🔐 Forgot password response received: ${response.statusCode}');
      final responseData = response.data as Map<String, dynamic>;

      return {
        'success': responseData['success'] ?? true,
        'message': responseData['message'] ??
            'If this email is registered, a password reset link has been sent.',
      };
    } catch (e) {
      print('❌ Forgot password error: $e');
      if (e is DioException) {
        final errorMessage = _handleDioError(e);
        final exception = Exception(errorMessage);
        (exception as dynamic).message = errorMessage;
        throw exception;
      }
      rethrow;
    }
  }

  /// Reset password - Set new password with token
  Future<Map<String, dynamic>> resetPassword(
      String token, String password) async {
    try {
      print('🔐 Resetting password with token');
      final response = await _apiService.post(
        ApiEndpoints.resetPassword,
        data: {
          'token': token,
          'password': password,
        },
      );

      print('🔐 Reset password response received: ${response.statusCode}');
      final responseData = response.data as Map<String, dynamic>;

      return {
        'success': responseData['success'] ?? true,
        'message':
            responseData['message'] ?? 'Password has been reset successfully.',
      };
    } catch (e) {
      print('❌ Reset password error: $e');
      if (e is DioException) {
        final errorMessage = _handleDioError(e);
        final exception = Exception(errorMessage);
        (exception as dynamic).message = errorMessage;
        throw exception;
      }
      rethrow;
    }
  }

  /// Extract field-specific errors from backend response
  /// Returns a map of field names to error messages
  static Map<String, String> extractFieldErrors(DioException error) {
    final fieldErrors = <String, String>{};

    if (error.response != null) {
      final errorData = error.response!.data as Map<String, dynamic>? ?? {};

      // Check for new formatted errors structure
      if (errorData.containsKey('errors')) {
        final errors = errorData['errors'];

        // Check for fields object (new format)
        if (errors is Map<String, dynamic> && errors.containsKey('fields')) {
          final fields = errors['fields'] as Map<String, dynamic>?;
          if (fields != null) {
            fields.forEach((field, errorMsg) {
              if (errorMsg is String) {
                fieldErrors[field] = errorMsg;
              } else if (errorMsg is List && errorMsg.isNotEmpty) {
                fieldErrors[field] = errorMsg.first.toString();
              }
            });
          }
        }

        // Also check for details array (backward compatibility)
        if (errors is Map<String, dynamic> && errors.containsKey('details')) {
          final details = errors['details'] as List?;
          if (details != null) {
            for (final detail in details) {
              if (detail is Map<String, dynamic>) {
                final param =
                    detail['param'] as String? ?? detail['path'] as String?;
                final msg = detail['msg'] as String?;
                if (param != null && msg != null) {
                  fieldErrors[param] = msg;
                }
              }
            }
          }
        }
      }
    }

    return fieldErrors;
  }

  /// Handle Dio errors
  String _handleDioError(DioException error) {
    if (error.response != null) {
      final statusCode = error.response!.statusCode;
      final errorData = error.response!.data as Map<String, dynamic>? ?? {};
      final message = (errorData['message'] as String?) ??
          (errorData['error'] as String?) ??
          'An error occurred';

      switch (statusCode) {
        case 400:
          // For validation errors, return the general message
          // Field-specific errors are extracted separately via extractFieldErrors
          return message;
        case 401:
          // Preserve the actual backend message for approval pending/rejected cases
          if (message.toLowerCase().contains('pending') ||
              message.toLowerCase().contains('approval') ||
              message.toLowerCase().contains('rejected')) {
            return message; // Return the actual backend message
          }
          return 'Invalid credentials';
        case 403:
          return 'Access denied: $message';
        case 404:
          return 'Resource not found';
        case 500:
          return 'Server error: $message';
        default:
          return message.toString();
      }
    } else if (error.type == DioExceptionType.connectionTimeout ||
        error.type == DioExceptionType.receiveTimeout) {
      return 'Connection timeout. Please check your internet connection.';
    } else if (error.type == DioExceptionType.connectionError) {
      return 'No internet connection. Please check your network.';
    } else {
      return 'An unexpected error occurred';
    }
  }
}
