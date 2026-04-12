# Phase 1 Enhancement: FCM Token Registration Endpoint

## ✅ Added for Phase 2

### New Endpoint: Register FCM Token

**Endpoint**: `POST /api/users/:id/fcm-token`

**Purpose**: Register Firebase Cloud Messaging (FCM) token for push notifications

**Implementation**:
- **Controller**: `backend/src/controllers/user.controller.js`
- **Route**: `backend/src/routes/user.routes.js`
- **Model**: Uses existing `deviceToken` field in User model

**Request**:
```json
POST /api/users/:id/fcm-token
Headers: {
  "Authorization": "Bearer <accessToken>"
}
Body: {
  "fcmToken": "fcm-token-string"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "message": "FCM token registered successfully",
    "userId": "user-id"
  }
}
```

**Authentication**: Required (user can only register their own token or admin)

**Status**: ✅ Implemented and ready for Phase 2

---

## 📝 Notes

- Uses existing `deviceToken` field in User model
- Token is stored when user logs in from mobile app
- Backend can use this token to send push notifications via FCM
- Token can be updated by calling the endpoint again

---

**Added**: Phase 2 Planning  
**Status**: ✅ Complete

