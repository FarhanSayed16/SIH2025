# Firebase Setup Guide - Kavach Project

## 🔥 Complete Firebase Configuration

This guide will help you set up Firebase for push notifications (FCM) in the Kavach mobile app.

---

## 📋 Prerequisites

1. **Firebase Account**: Create a free account at [Firebase Console](https://console.firebase.google.com/)
2. **Flutter CLI**: Ensure Flutter is installed
3. **Android Studio**: For Android configuration
4. **Xcode**: For iOS configuration (macOS only)

---

## 🚀 Step-by-Step Setup

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or **"Create a project"**
3. Enter project name: **"Kavach"**
4. Enable Google Analytics (optional)
5. Click **"Create project"**
6. Wait for project creation to complete

---

### Step 2: Add Android App

1. In Firebase Console, click **"Add app"** → Select **Android**
2. **Android package name**: `com.kavach.app`
3. **App nickname**: Kavach Android (optional)
4. **Debug signing certificate SHA-1**: (optional for now)
5. Click **"Register app"**
6. Download `google-services.json`
7. Place it in: `mobile/android/app/google-services.json`

---

### Step 3: Add iOS App (if needed)

1. In Firebase Console, click **"Add app"** → Select **iOS**
2. **iOS bundle ID**: `com.kavach.app`
3. **App nickname**: Kavach iOS (optional)
4. Click **"Register app"**
5. Download `GoogleService-Info.plist`
6. Place it in: `mobile/ios/Runner/GoogleService-Info.plist`

---

### Step 4: Enable Cloud Messaging

1. In Firebase Console, go to **"Cloud Messaging"** (left sidebar)
2. Click **"Get started"** if prompted
3. Note your **Server key** (you'll need this for backend)

---

### Step 5: Configure Android

1. **Update `mobile/android/build.gradle`**:
   ```gradle
   buildscript {
       dependencies {
           // Add this line
           classpath 'com.google.gms:google-services:4.4.0'
       }
   }
   ```

2. **Update `mobile/android/app/build.gradle`**:
   ```gradle
   // Add at the bottom
   apply plugin: 'com.google.gms.google-services'
   ```

3. **Verify `google-services.json` is in place**:
   - Location: `mobile/android/app/google-services.json`

---

### Step 6: Configure iOS (if needed)

1. **Open Xcode**:
   ```bash
   cd mobile/ios
   open Runner.xcworkspace
   ```

2. **Add `GoogleService-Info.plist`**:
   - Drag and drop into Xcode project
   - Make sure "Copy items if needed" is checked

3. **Update `mobile/ios/Podfile`**:
   ```ruby
   platform :ios, '12.0'
   ```

4. **Install pods**:
   ```bash
   cd mobile/ios
   pod install
   ```

---

### Step 7: Configure Backend

1. **Get Firebase Server Key**:
   - Go to Firebase Console → Project Settings → Cloud Messaging
   - Copy **Server key**

2. **Update `backend/.env`**:
   ```env
   FIREBASE_SERVER_KEY=your-server-key-here
   ```

3. **Backend is already configured** to use FCM token from user's `deviceToken` field

---

### Step 8: Update Mobile App

The mobile app is already configured to:
- Initialize Firebase on startup
- Request notification permissions
- Get FCM token
- Register token with backend
- Handle foreground/background messages

**No code changes needed** - just ensure Firebase is initialized in `main.dart`:

```dart
// In mobile/lib/main.dart
await Firebase.initializeApp();
```

---

## ✅ Verification Steps

### 1. Check Firebase Initialization

Run the app and check logs:
```bash
cd mobile
flutter run
```

Look for:
- ✅ "Firebase initialized successfully"
- ✅ "FCM token received: ..."
- ✅ "FCM token registered with backend"

### 2. Test FCM Token Registration

1. Login to the app
2. Check backend logs for: "FCM token updated for user ..."
3. Verify in database: User's `deviceToken` field should have FCM token

### 3. Test Push Notification

**From Backend** (using Postman or curl):
```bash
POST https://fcm.googleapis.com/fcm/send
Headers:
  Authorization: key=YOUR_SERVER_KEY
  Content-Type: application/json

Body:
{
  "to": "USER_FCM_TOKEN",
  "notification": {
    "title": "Test Alert",
    "body": "This is a test notification"
  },
  "data": {
    "type": "CRISIS_ALERT",
    "alertId": "test123"
  }
}
```

---

## 🔧 Troubleshooting

### Issue: Firebase not initializing

**Solution**:
1. Check `google-services.json` is in correct location
2. Verify package name matches: `com.kavach.app`
3. Run `flutter clean && flutter pub get`

### Issue: FCM token not received

**Solution**:
1. Check notification permissions are granted
2. Verify Firebase is initialized before FCM
3. Check device has Google Play Services (Android)

### Issue: Token not registering with backend

**Solution**:
1. Check backend API is running
2. Verify user is authenticated
3. Check backend logs for errors
4. Verify endpoint: `PUT /api/users/:id/fcm-token`

---

## 📝 Environment Variables

### Mobile App
No additional env vars needed - Firebase config is in `google-services.json`

### Backend
```env
FIREBASE_SERVER_KEY=your-server-key-from-firebase-console
```

---

## 🎯 Next Steps

After Firebase setup:
1. ✅ Test push notifications from backend
2. ✅ Verify notifications appear on device
3. ✅ Test foreground/background message handling
4. ✅ Test notification tap navigation

---

## 📚 Resources

- [Firebase Console](https://console.firebase.google.com/)
- [FlutterFire Setup](https://firebase.flutter.dev/docs/overview)
- [FCM Documentation](https://firebase.google.com/docs/cloud-messaging)

---

**Status**: Firebase setup guide ready ✅  
**Next**: Follow steps above to configure Firebase

