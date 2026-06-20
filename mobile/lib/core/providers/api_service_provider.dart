/// Shared ApiService Provider
/// Ensures all services use the same ApiService instance with auth token

import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/api_service.dart';
import '../services/storage_service.dart';

/// ApiService Provider - Shared singleton instance
/// This creates a single ApiService instance that all services will use
/// Token restoration happens in the interceptor, so no need to do it here
final apiServiceProvider = Provider<ApiService>((ref) {
  final apiService = ApiService();
  
  // Restore token from storage on initialization
  // This ensures token is available immediately when services use ApiService
  final storageService = StorageService();
  storageService.getAccessToken().then((String? token) {
    if (token != null && token.isNotEmpty) {
      apiService.setAuthToken(token);
    }
  });
  
  return apiService;
});

