# FCM Token & User Profile Endpoint Fixes

## Date: 2025-11-24

## Issues Found & Fixed

### 1. ✅ FCM Token Registration Endpoint
**Issue**: Test script was failing to extract user ID from login response.

**Root Cause**: 
- Login response returns `user._id` (MongoDB ObjectId)
- Test script was looking for `user.id` (which doesn't exist in the response)

**Fix**: 
- Updated test to use `$studentRes.data.user._id` instead of `$studentRes.data.user.id`
- Endpoint itself was working correctly: `POST /api/users/:id/fcm-token`

**Test Result**: ✅ **SUCCESS**
```json
{
  "success": true,
  "message": "FCM token registered successfully"
}
```

### 2. ✅ User Profile GET Endpoint
**Issue**: Test script was failing with "Insufficient permissions".

**Root Cause**: 
- Same issue as above - user ID was not being extracted correctly
- `requireOwnershipOrAdmin` middleware was comparing `req.userId` (from token) with `req.params.id` (from URL)
- Since user ID was empty/null, the comparison failed

**Fix**: 
- Updated test to use correct user ID from login response
- Endpoint itself was working correctly: `GET /api/users/:id`

**Test Result**: ✅ **SUCCESS**
```json
{
  "success": true,
  "data": {
    "user": {
      "name": "Rohan Sharma",
      "grade": "10",
      "section": "A",
      ...
    }
  }
}
```

## Endpoint Verification

### FCM Token Registration
- **Route**: `POST /api/users/:id/fcm-token`
- **Auth**: Required (Bearer token)
- **Authorization**: User must own the resource or be admin
- **Body**: `{ "fcmToken": "string" }`
- **Status**: ✅ Working

### User Profile GET
- **Route**: `GET /api/users/:id`
- **Auth**: Required (Bearer token)
- **Authorization**: User must own the resource or be admin
- **Status**: ✅ Working

## Mobile App Integration

### FCM Token Registration
- **File**: `mobile/lib/features/fcm/providers/fcm_provider.dart`
- **Method**: `POST` (was `PUT`, already fixed)
- **Endpoint**: `/api/users/:userId/fcm-token`
- **Status**: ✅ Ready for testing

### User Profile Fetch
- **File**: `mobile/lib/features/auth/services/auth_service.dart`
- **Method**: `GET`
- **Endpoint**: `/api/users/:userId`
- **Status**: ✅ Ready for testing

## Testing Instructions

### Manual Test (Backend)
```powershell
# 1. Login as student
$body = @{ email = "rohan.sharma@student.com"; password = "student123" } | ConvertTo-Json
$res = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method Post -Body $body -ContentType "application/json"
$token = $res.data.accessToken
$userId = $res.data.user._id

# 2. Register FCM token
$fcmBody = @{ fcmToken = "test-token-123" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3000/api/users/$userId/fcm-token" -Method Post -Body $fcmBody -ContentType "application/json" -Headers @{ Authorization = "Bearer $token" }

# 3. Get user profile
Invoke-RestMethod -Uri "http://localhost:3000/api/users/$userId" -Method Get -Headers @{ Authorization = "Bearer $token" }
```

### Mobile App Test
1. Launch mobile app
2. Login as student (`rohan.sharma@student.com` / `student123`)
3. Check console logs for:
   - ✅ FCM token registration success
   - ✅ User profile fetch success
4. Verify no 401/403 errors

## Summary

✅ **All endpoints are working correctly**
✅ **Mobile app code is ready**
✅ **No backend changes needed**
✅ **Ready for comprehensive testing**

The issues were in the test scripts, not in the actual implementation. Both endpoints are functioning as expected.

