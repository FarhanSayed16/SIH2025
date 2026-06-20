import 'package:dio/dio.dart';
import 'package:dio/io.dart';
import 'dart:io';
import '../config/env.dart';
import '../constants/app_constants.dart';
import '../../features/auth/services/auth_service.dart';
import 'storage_service.dart';

/// API Service - Handles all HTTP requests
class ApiService {
  late final Dio _dio;
  AuthService? _authService;
  bool _isRefreshing = false; // Prevent multiple simultaneous refresh attempts
  bool _isLoggingOut = false; // Prevent infinite logout loop

  ApiService() {
    _dio = Dio(
      BaseOptions(
        baseUrl: Env.apiBaseUrl,
        connectTimeout: AppConstants.apiTimeout,
        receiveTimeout: AppConstants.apiTimeout,
        headers: {
          'Content-Type': 'application/json',
        },
      ),
    );

    // Allow self-signed certificates for DevTunnels (development only)
    if (Env.isDevelopment) {
      (_dio.httpClientAdapter as IOHttpClientAdapter).createHttpClient = () {
        final client = HttpClient();
        client.badCertificateCallback = (cert, host, port) => true;
        return client;
      };
    }

    _setupInterceptors();
    _loadTokenFromStorage(); // Load token on initialization
  }

  /// Load token from storage on initialization
  Future<void> _loadTokenFromStorage() async {
    try {
      final storageService = StorageService();
      final token = await storageService.getAccessToken();
      if (token != null && token.isNotEmpty) {
        setAuthToken(token);
        print('✅ Token loaded from storage on ApiService initialization');
      }
    } catch (e) {
      print('⚠️ Could not load token from storage on initialization: $e');
    }
  }

  void _setupInterceptors() {
    // Request interceptor - Add auth token and logging
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          // Allow auth endpoints (login, register, refresh, logout) even during logout
          // This prevents blocking new login attempts after token expiration
          final isAuthEndpoint = options.path.contains('/auth/login') ||
              options.path.contains('/auth/register') ||
              options.path.contains('/auth/refresh') ||
              options.path.contains('/auth/logout');

          // Skip if logging out to prevent more requests (except auth endpoints)
          if (_isLoggingOut && !isAuthEndpoint) {
            handler.reject(
              DioException(
                requestOptions: options,
                type: DioExceptionType.cancel,
                error: 'Logout in progress',
              ),
            );
            return;
          }

          // If this is a login/register attempt, reset logout flag to allow it
          if (isAuthEndpoint && _isLoggingOut) {
            print('🔄 Resetting logout flag to allow new login attempt');
            _isLoggingOut = false;
          }

          // Log request for debugging
          print('📤 [API SERVICE] Request: ${options.method} ${options.baseUrl}${options.path}');
          print('📤 [API SERVICE] Headers: ${options.headers}');
          if (options.data != null) {
            print('📤 [API SERVICE] Data: ${options.data}');
          }
          if (options.queryParameters.isNotEmpty) {
            print('📤 [API SERVICE] Query: ${options.queryParameters}');
          }

          // Ensure token is attached from storage if not already set
          if (!options.headers.containsKey('Authorization') && !_isLoggingOut) {
            try {
              String? token;

              // Try to get token from auth service first (if available)
              if (_authService != null) {
                token = await _authService!.getAccessToken();
              }

              // Fallback: Get token directly from storage if auth service is not available
              if (token == null || token.isEmpty) {
                final storageService = StorageService();
                token = await storageService.getAccessToken();
              }

              if (token != null && token.isNotEmpty) {
                options.headers['Authorization'] = 'Bearer $token';
                print(
                    '✅ Token attached to request: ${token.substring(0, 20)}...');
              } else {
                print('⚠️ No token available for request');
              }
            } catch (e) {
              // Ignore errors - token will be refreshed on 401
              print('⚠️ Warning: Could not get token from storage: $e');
            }
          }

          handler.next(options);
        },
        onResponse: (response, handler) {
          // Log successful response
          print(
              '✅ API Response: ${response.statusCode} ${response.requestOptions.path}');

          // Check if response is HTML (should be JSON)
          if (response.data is String &&
              (response.data as String).contains('<!DOCTYPE html>')) {
            print(
                '⚠️ WARNING: Received HTML instead of JSON. This might indicate a routing issue.');
            print('⚠️ Full URL: ${response.requestOptions.uri}');
            print('⚠️ Base URL: ${_dio.options.baseUrl}');
          } else {
            print('✅ Data: ${response.data}');
          }

          handler.next(response);
        },
        onError: (error, handler) async {
          // Log error for debugging
          print(
              '❌ [API SERVICE] Error: ${error.requestOptions.method} ${error.requestOptions.baseUrl}${error.requestOptions.path}');
          print('❌ [API SERVICE] Status: ${error.response?.statusCode ?? "No response"}');
          print('❌ [API SERVICE] Error Type: ${error.type}');
          print('❌ [API SERVICE] Message: ${error.message}');
          if (error.response?.data != null) {
            print('❌ [API SERVICE] Response Data: ${error.response?.data}');
          }

          // Don't try to refresh token on connection errors or if already logging out
          if (error.type == DioExceptionType.connectionError ||
              error.type == DioExceptionType.connectionTimeout ||
              error.type == DioExceptionType.receiveTimeout ||
              error.type == DioExceptionType.sendTimeout) {
            // Connection errors - just pass through, don't try to refresh
            print('⚠️ Connection error - skipping token refresh');
            handler.next(error);
            return;
          }

          // Handle 401 - Unauthorized (only for actual HTTP responses)
          if (error.response?.statusCode == 401) {
            // CRITICAL: Check if this is a refresh token request that failed
            final isRefreshRequest =
                error.requestOptions.path.contains('/auth/refresh');

            if (isRefreshRequest) {
              // Refresh token itself failed - force logout to break the loop
              print(
                  '❌ Refresh token invalid/expired - forcing logout to break loop');
              await _handleLogout();
              handler.next(error);
              return;
            }

            // Prevent multiple simultaneous refresh attempts
            if (_isRefreshing) {
              print('⏳ Token refresh already in progress, skipping...');
              handler.next(error);
              return;
            }

            // Prevent refresh if logout is in progress
            if (_isLoggingOut) {
              print('🚪 Logout in progress, skipping token refresh');
              handler.next(error);
              return;
            }

            // Try to refresh token
            if (_authService != null) {
              _isRefreshing = true;
              try {
                final newToken = await _authService!.refreshTokenIfNeeded();
                _isRefreshing = false;

                if (newToken != null && !_isLoggingOut) {
                  // Retry original request with new token
                  final opts = error.requestOptions;
                  opts.headers['Authorization'] = 'Bearer $newToken';
                  final response = await _dio.request<dynamic>(
                    opts.path,
                    options: Options(
                      method: opts.method,
                      headers: opts.headers,
                    ),
                    data: opts.data,
                    queryParameters: opts.queryParameters,
                  );
                  handler.resolve(response);
                  return;
                } else {
                  // Refresh failed or logout was triggered
                  print('❌ Token refresh failed - logout triggered');
                }
              } catch (e) {
                _isRefreshing = false;
                print('❌ Token refresh exception: $e');

                // Check if error is 401 on refresh endpoint
                if (e is DioException && e.response?.statusCode == 401) {
                  await _handleLogout();
                }
              }
            }
          }
          handler.next(error);
        },
      ),
    );
  }

  /// Set auth service for token refresh
  void setAuthService(AuthService authService) {
    _authService = authService;
  }

  /// Set authorization token
  void setAuthToken(String token) {
    _dio.options.headers['Authorization'] = 'Bearer $token';
  }

  /// Clear authorization token
  void clearAuthToken() {
    _dio.options.headers.remove('Authorization');
  }

  /// Handle logout when refresh token fails
  /// This breaks the infinite 401 loop by clearing storage and preventing retries
  Future<void> _handleLogout() async {
    if (_isLoggingOut) {
      return; // Already logging out, prevent infinite loop
    }

    _isLoggingOut = true;
    print('🚪 Forcing logout due to invalid refresh token - breaking 401 loop');

    try {
      // Clear tokens and storage
      if (_authService != null) {
        await _authService!.logout();
      } else {
        // Fallback: Clear storage directly if auth service not available
        final storageService = StorageService();
        await storageService.clearSecureStorage();
        clearAuthToken();
      }

      print('✅ Logout completed - user should be redirected to login');
    } catch (e) {
      print('❌ Error during logout: $e');
      // Even if logout fails, clear local state
      try {
        final storageService = StorageService();
        await storageService.clearSecureStorage();
        clearAuthToken();
      } catch (e2) {
        print('❌ Error clearing storage: $e2');
      }
    } finally {
      // Reset logout flag after cleanup to allow new login attempts
      // Storage is already cleared, so it's safe to allow new requests
      _isLoggingOut = false;
      print('🔄 Logout flag reset - ready for new login attempts');
    }
  }

  /// Reset logout flag (called after successful login)
  void resetLogoutFlag() {
    _isLoggingOut = false;
    _isRefreshing = false;
  }

  /// GET request
  Future<Response<dynamic>> get(String path,
      {Map<String, dynamic>? queryParameters}) async {
    try {
      return await _dio.get<dynamic>(path, queryParameters: queryParameters);
    } catch (e) {
      rethrow;
    }
  }

  /// POST request
  /// Use [options] to override timeouts (e.g. for AI image endpoints: Options(receiveTimeout: Duration(seconds: 90)))
  Future<Response<dynamic>> post(String path,
      {dynamic data, Map<String, dynamic>? queryParameters, Options? options}) async {
    try {
      return await _dio.post<dynamic>(path,
          data: data, queryParameters: queryParameters, options: options);
    } catch (e) {
      rethrow;
    }
  }

  /// PUT request
  Future<Response<dynamic>> put(String path,
      {dynamic data, Map<String, dynamic>? queryParameters}) async {
    try {
      return await _dio.put<dynamic>(path,
          data: data, queryParameters: queryParameters);
    } catch (e) {
      rethrow;
    }
  }

  /// DELETE request
  Future<Response<dynamic>> delete(String path,
      {Map<String, dynamic>? queryParameters}) async {
    try {
      return await _dio.delete<dynamic>(path, queryParameters: queryParameters);
    } catch (e) {
      rethrow;
    }
  }

  /// GET request with binary response (for PDFs, images, etc.)
  Future<Response<List<int>>> getBinary(String path,
      {Map<String, dynamic>? queryParameters}) async {
    try {
      return await _dio.get<List<int>>(
        path,
        queryParameters: queryParameters,
        options: Options(responseType: ResponseType.bytes),
      );
    } catch (e) {
      rethrow;
    }
  }

  /// Get Dio instance (for advanced usage)
  Dio get dio => _dio;
}
