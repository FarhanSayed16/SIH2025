# FCM Foreground Notifications Implementation

## ✅ Implementation Complete

### 1. Dependency Check
- ✅ `flutter_local_notifications: ^18.0.1` is already present in `pubspec.yaml`

### 2. Main.dart Updates

#### Global Instance
- Created global `FlutterLocalNotificationsPlugin` instance for reuse across the app

#### Notification Channel Creation (in `main()` before `runApp()`)
- ✅ Initialized `FlutterLocalNotificationsPlugin` with Android and iOS settings
- ✅ Created Android notification channel `'high_importance_channel'` with:
  - `importance: Importance.max` (for heads-up notifications)
  - `playSound: true`
  - `enableVibration: true`
  - `showBadge: true`
- ✅ Requested notification permissions using `FirebaseMessaging.instance.requestPermission()`

#### Foreground Message Handler (in `initState()`)
- ✅ Set up `FirebaseMessaging.onMessage` listener in `_setupForegroundFCMHandler()`
- ✅ Shows local notification immediately when FCM message arrives in foreground
- ✅ Uses `flutter_local_notifications` to display heads-up notification

#### Notification Details
- ✅ Channel: `'high_importance_channel'`
- ✅ Icon: `@mipmap/ic_launcher`
- ✅ Color: `Color(0xFFFF0000)` (Red) for alerts
- ✅ LED Color: `Color(0xFFFF0000)` (Red)
- ✅ Priority: `Priority.max`
- ✅ Importance: `Importance.max`

### 3. AndroidManifest.xml Updates
- ✅ Added `<meta-data>` tag for `com.google.firebase.messaging.default_notification_channel_id`
- ✅ Set value to `'high_importance_channel'`

### 4. FCM Service Updates
- ✅ Updated notification channel from `'kavach_alerts'` to `'high_importance_channel'`
- ✅ Updated importance to `Importance.max`
- ✅ Added red color (`Color(0xFFFF0000)`) to notifications
- ✅ Disabled duplicate foreground handler (now handled in `main.dart`)

## Files Modified

1. **`mobile/lib/main.dart`**
   - Added global `FlutterLocalNotificationsPlugin` instance
   - Added notification channel creation in `main()` before `runApp()`
   - Added `_setupForegroundFCMHandler()` in `initState()`
   - Added `_showForegroundNotification()` method

2. **`mobile/lib/core/services/fcm_service.dart`**
   - Updated channel name to `'high_importance_channel'`
   - Updated importance to `Importance.max`
   - Added red color to notifications
   - Disabled duplicate foreground handler

3. **`mobile/android/app/src/main/AndroidManifest.xml`**
   - Added `com.google.firebase.messaging.default_notification_channel_id` meta-data

## How It Works

### Foreground Notification Flow

1. **App Starts:**
   - `main()` initializes `FlutterLocalNotificationsPlugin`
   - Creates `'high_importance_channel'` with maximum importance
   - Requests notification permissions

2. **App Initializes:**
   - `initState()` sets up `FirebaseMessaging.onMessage` listener
   - Listener is active when app is in foreground

3. **FCM Message Arrives (Foreground):**
   - `FirebaseMessaging.onMessage` triggers
   - `_showForegroundNotification()` is called
   - Local notification is shown immediately with:
     - Red color
     - Maximum priority
     - Sound and vibration
     - Heads-up display (on Android)

4. **Background/Terminated:**
   - Handled by existing `_firebaseMessagingBackgroundHandler`
   - System shows notification automatically

## Testing

### Test Steps

1. **Build and Run App:**
   ```bash
   cd mobile
   flutter run
   ```

2. **Keep App in Foreground:**
   - Open the app and keep it visible on screen

3. **Send Test FCM Notification:**
   - Use Firebase Console or backend API to send a test notification
   - Or trigger an IoT alert from ESP32

4. **Expected Behavior:**
   - ✅ Heads-up notification appears at top of screen (Android)
   - ✅ Notification has red color
   - ✅ Sound plays
   - ✅ Device vibrates
   - ✅ Notification shows title and body
   - ✅ Notification is dismissible

### Debug Logs

Look for these logs in Flutter console:
```
✅ Android notification channel created: high_importance_channel
✅ Notification permissions granted
📱 Foreground FCM message received: <message_id>
   Title: <title>
   Body: <body>
✅ Foreground notification shown: <title>
```

## Troubleshooting

### Notifications Not Appearing

1. **Check Permissions:**
   - Verify notification permissions are granted
   - Check logs for: `✅ Notification permissions granted`

2. **Check Channel:**
   - Verify channel is created: `✅ Android notification channel created`
   - Check Android settings → Apps → KAVACH → Notifications
   - Ensure `'high_importance_channel'` is enabled

3. **Check FCM Message Format:**
   - FCM message must have `notification` field (not just `data`)
   - Backend should send:
     ```json
     {
       "notification": {
         "title": "Alert Title",
         "body": "Alert Body"
       },
       "data": { ... }
     }
     ```

4. **Check Logs:**
   - Look for: `📱 Foreground FCM message received`
   - Look for: `✅ Foreground notification shown`

### Notification Not Heads-Up

1. **Check Channel Importance:**
   - Must be `Importance.max`
   - Check Android notification settings for the channel

2. **Check Priority:**
   - Must be `Priority.max` in `AndroidNotificationDetails`

3. **Check Do Not Disturb:**
   - Ensure device is not in Do Not Disturb mode
   - Some devices require "Allow interruptions" for heads-up notifications

## Key Features

- ✅ **Heads-up Notifications:** Maximum importance channel ensures notifications appear at top of screen
- ✅ **Red Color:** Alert color (`Color(0xFFFF0000)`) for visual prominence
- ✅ **Sound & Vibration:** Enabled for all foreground notifications
- ✅ **LED Indicator:** Red LED flashes on devices with LED support
- ✅ **Icon:** Uses app launcher icon (`@mipmap/ic_launcher`)
- ✅ **Immediate Display:** Notifications show instantly when FCM message arrives

## Next Steps

1. Test with actual FCM notifications from backend
2. Test with IoT alerts from ESP32
3. Verify on different Android versions (especially Android 13+)
4. Test notification tap handling (navigation to specific screens)

