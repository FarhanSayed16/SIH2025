# Student Join Class - Token Authentication Fix

## Problem

**Error**: `401 No token provided` when students try to join a class via QR code or manual code.

**Root Cause**: 
- `StudentService` was creating its own `ApiService()` instance
- This new instance didn't have `_authService` set
- The interceptor tried to get token from `_authService` (which was null)
- Token was not retrieved from storage
- Requests were sent without authentication token

## Fixes Implemented

### 1. Enhanced API Service Interceptor
**File**: `mobile/lib/core/services/api_service.dart`

**Changes**:
- ✅ **Fallback to StorageService**: If `_authService` is null, get token directly from `StorageService`
- ✅ **Token loading on init**: Load token from storage when `ApiService` is created
- ✅ **Better logging**: Log when token is attached or missing

**Code**:
```dart
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
      print('✅ Token attached to request: ${token.substring(0, 20)}...');
    } else {
      print('⚠️ No token available for request');
    }
  } catch (e) {
    print('⚠️ Warning: Could not get token from storage: $e');
  }
}
```

### 2. Updated StudentService
**File**: `mobile/lib/features/student/services/student_service.dart`

**Changes**:
- ✅ **Accept ApiService parameter**: Allow injecting shared `ApiService` instance
- ✅ **Use shared instance**: Use `apiServiceProvider` to get shared instance with token

**Code**:
```dart
class StudentService {
  final ApiService _apiService;

  StudentService({ApiService? apiService}) 
      : _apiService = apiService ?? ApiService();
}
```

### 3. Updated All StudentService Usages
**Files**:
- `mobile/lib/features/student/screens/join_class_screen.dart`
- `mobile/lib/features/auth/screens/login_screen.dart`
- `mobile/lib/features/profile/screens/profile_screen.dart`

**Changes**:
- ✅ **Use shared ApiService**: All `StudentService` instances now use shared `ApiService` from provider
- ✅ **Token guaranteed**: Shared `ApiService` has token loaded from storage

**Code**:
```dart
// In initState or method
final apiService = ref.read(apiServiceProvider);
final studentService = StudentService(apiService: apiService);
```

### 4. Token Loading on ApiService Initialization
**File**: `mobile/lib/core/services/api_service.dart`

**Changes**:
- ✅ **Auto-load token**: Load token from storage when `ApiService` is created
- ✅ **Immediate availability**: Token is available even if `_authService` is not set

**Code**:
```dart
ApiService() {
  // ... setup code ...
  _setupInterceptors();
  _loadTokenFromStorage(); // Load token on initialization
}

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
```

## How It Works Now

1. **ApiService Creation**:
   - When `ApiService` is created, it automatically loads token from storage
   - Token is set in `_dio.options.headers['Authorization']`

2. **Request Interceptor**:
   - Checks if `Authorization` header is already set
   - If not, tries to get token from `_authService` (if available)
   - Falls back to `StorageService` if `_authService` is null
   - Attaches token to request headers

3. **StudentService**:
   - Uses shared `ApiService` from `apiServiceProvider`
   - Shared instance has token already loaded
   - All requests include authentication token

## Testing

### Before Fix:
- ❌ `401 No token provided` error
- ❌ Students couldn't join classes
- ❌ Token not attached to requests

### After Fix:
- ✅ Token automatically loaded from storage
- ✅ Token attached to all requests
- ✅ Students can join classes via QR code or manual code
- ✅ Works even if `_authService` is not set

## Files Modified

1. `mobile/lib/core/services/api_service.dart`
   - Enhanced interceptor to check `StorageService` directly
   - Added `_loadTokenFromStorage()` method
   - Better error logging

2. `mobile/lib/features/student/services/student_service.dart`
   - Accept `ApiService` as parameter
   - Use shared instance from provider

3. `mobile/lib/features/student/screens/join_class_screen.dart`
   - Use shared `ApiService` from provider

4. `mobile/lib/features/auth/screens/login_screen.dart`
   - Use shared `ApiService` from provider

5. `mobile/lib/features/profile/screens/profile_screen.dart`
   - Use shared `ApiService` from provider

## Summary

The fix ensures that:
1. ✅ Token is always loaded from storage when `ApiService` is created
2. ✅ Interceptor has fallback to get token directly from storage
3. ✅ All `StudentService` instances use shared `ApiService` with token
4. ✅ Students can now join classes successfully

**Status**: ✅ Fixed - Students can now join classes via QR code or manual code

