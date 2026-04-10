# 🔔 Complete Notification System Rebuild Plan

## 📋 Executive Summary

**Goal**: Remove all existing notification code and rebuild a unified, reliable notification system that handles:
- ✅ IoT Device Alerts (Fire, Flood, Earthquake)
- ✅ Real-time Socket.io Updates
- ✅ Broadcast Notifications (Admin → All Users)
- ✅ Drill Notifications
- ✅ Crisis Alerts
- ✅ Parent/Teacher/Student Notifications

**Time Estimate**: 4-6 hours (with focused implementation)

**Approach**: Clean slate → Unified architecture → Step-by-step implementation

---

## 🎯 Phase 1: Analysis & Cleanup (30 minutes)

### Step 1.1: Document Current State

**Files to Review:**
- ✅ `backend/src/services/fcm.service.js`
- ✅ `backend/src/services/notification.service.js`
- ✅ `backend/src/services/broadcast.service.js`
- ✅ `backend/src/services/communication.service.js`
- ✅ `mobile/lib/core/services/fcm_service.dart`
- ✅ `mobile/lib/features/fcm/`
- ✅ `web/lib/services/browser-notifications.ts`
- ✅ `web/lib/services/alert-sound-service.ts`

**Action**: Create a list of all notification-related code locations

### Step 1.2: Identify Dependencies

**Backend Dependencies:**
- Firebase Admin SDK (for FCM)
- Socket.io (for real-time)
- User model (for FCM tokens)

**Mobile Dependencies:**
- `firebase_messaging`
- `flutter_local_notifications`
- Socket.io client

**Web Dependencies:**
- Socket.io client
- Browser Notifications API
- Web Audio API (for sounds)

### Step 1.3: Create Backup

**Action**: 
```bash
# Create backup branch
git checkout -b backup/notification-system-$(date +%Y%m%d)
git add .
git commit -m "Backup: Current notification system before rebuild"
git checkout main
```

---

## 🗑️ Phase 2: Removal (45 minutes)

### Step 2.1: Remove Backend Notification Code

**Files to DELETE:**
- ❌ `backend/src/services/notification.service.js` (will recreate)
- ❌ `backend/src/services/fcm.service.js` (will recreate)
- ❌ `backend/src/services/broadcast.service.js` (will recreate)

**Files to MODIFY (remove notification calls):**
- `backend/src/services/iotDeviceMonitoring.service.js` - Remove FCM calls
- `backend/src/controllers/device.controller.js` - Remove FCM calls
- `backend/src/controllers/alert.controller.js` - Remove FCM calls
- `backend/src/controllers/drill.controller.js` - Remove FCM calls
- `backend/src/services/alertPipeline.service.js` - Remove FCM calls
- `backend/src/services/crisisAlert.service.js` - Remove FCM calls

**Action**: Comment out all `sendNotification`, `sendFCM`, `broadcastNotification` calls

### Step 2.2: Remove Mobile Notification Code

**Files to DELETE:**
- ❌ `mobile/lib/core/services/fcm_service.dart` (will recreate)
- ❌ `mobile/lib/features/fcm/providers/fcm_provider.dart` (will recreate)
- ❌ `mobile/lib/features/fcm/handlers/fcm_message_handler.dart` (will recreate)

**Files to MODIFY:**
- `mobile/lib/main.dart` - Remove FCM initialization and handlers
- `mobile/lib/features/socket/handlers/socket_event_handler.dart` - Remove notification calls
- `mobile/lib/features/iot/widgets/iot_alert_dialog.dart` - Keep (UI only)

**Action**: Comment out FCM-related code, keep Socket.io intact

### Step 2.3: Remove Web Notification Code

**Files to DELETE:**
- ❌ `web/lib/services/browser-notifications.ts` (will recreate)
- ❌ `web/lib/services/alert-sound-service.ts` (will recreate)
- ❌ `web/components/notifications/IoTAlertToast.tsx` (will recreate)
- ❌ `web/components/alerts/IoTAlertModal.tsx` (will recreate)

**Files to MODIFY:**
- `web/app/dashboard/page.tsx` - Remove notification calls
- `web/app/admin/crisis-dashboard/page.tsx` - Remove notification calls

**Action**: Comment out notification-related code, keep Socket.io listeners

---

## 🏗️ Phase 3: Unified Architecture Design (30 minutes)

### 3.1: Notification Types

```typescript
enum NotificationType {
  IOT_ALERT = 'iot_alert',        // Fire, Flood, Earthquake
  CRISIS_ALERT = 'crisis_alert',  // Manual alerts
  DRILL = 'drill',                 // Drill notifications
  BROADCAST = 'broadcast',         // Admin broadcasts
  PARENT = 'parent',               // Parent notifications
  TEACHER = 'teacher',             // Teacher notifications
  SYSTEM = 'system'                // System updates
}
```

### 3.2: Notification Priority

```typescript
enum NotificationPriority {
  CRITICAL = 'critical',  // Fire, immediate danger
  HIGH = 'high',         // Flood, Earthquake, Crisis
  MEDIUM = 'medium',     // Drills, Broadcasts
  LOW = 'low'            // System updates
}
```

### 3.3: Unified Backend Service Structure

```
backend/src/services/notifications/
├── notification.service.js          # Main unified service
├── fcm.service.js                   # FCM-specific logic
├── socket.service.js                # Socket.io broadcasting
├── channels/
│   ├── iot-alerts.channel.js        # IoT alert channel
│   ├── crisis-alerts.channel.js     # Crisis alert channel
│   ├── drill.channel.js              # Drill channel
│   └── broadcast.channel.js         # Broadcast channel
└── types/
    └── notification.types.js        # Type definitions
```

### 3.4: Unified Mobile Service Structure

```
mobile/lib/core/services/notifications/
├── notification_service.dart         # Main unified service
├── fcm_service.dart                  # FCM handling
├── local_notification_service.dart   # Local notifications
├── socket_notification_service.dart  # Socket.io notifications
└── notification_types.dart           # Type definitions
```

### 3.5: Unified Web Service Structure

```
web/lib/services/notifications/
├── notification-service.ts           # Main unified service
├── browser-notification-service.ts  # Browser notifications
├── sound-service.ts                  # Sound alerts
└── types.ts                          # Type definitions
```

---

## 🚀 Phase 4: Implementation (3-4 hours)

### Step 4.1: Backend - Unified Notification Service (1 hour)

**File**: `backend/src/services/notifications/notification.service.js`

```javascript
/**
 * Unified Notification Service
 * Handles all notification types: IoT, Crisis, Drill, Broadcast
 */

import { sendFCMNotification } from './fcm.service.js';
import { broadcastSocketEvent } from './socket.service.js';
import logger from '../../config/logger.js';

export class NotificationService {
  /**
   * Send notification via all channels (FCM + Socket.io)
   */
  static async send(notification) {
    const { type, priority, institutionId, userIds, data } = notification;
    
    // 1. Send FCM (if tokens available)
    if (userIds && userIds.length > 0) {
      await sendFCMNotification(notification);
    }
    
    // 2. Broadcast via Socket.io (real-time)
    await broadcastSocketEvent(institutionId, type, data);
    
    // 3. Log notification
    logger.info(`Notification sent: ${type} to ${institutionId}`);
  }
  
  /**
   * Send IoT Alert
   */
  static async sendIoTAlert(alertData) {
    return this.send({
      type: 'iot_alert',
      priority: this._getPriorityFromAlertType(alertData.alertType),
      institutionId: alertData.institutionId,
      userIds: null, // Will fetch from institution
      data: {
        alertType: alertData.alertType,
        deviceId: alertData.deviceId,
        deviceName: alertData.deviceName,
        severity: alertData.severity,
        sensorData: alertData.sensorData,
      },
    });
  }
  
  /**
   * Send Crisis Alert
   */
  static async sendCrisisAlert(alertData) {
    return this.send({
      type: 'crisis_alert',
      priority: alertData.severity || 'high',
      institutionId: alertData.institutionId,
      userIds: null,
      data: alertData,
    });
  }
  
  /**
   * Send Drill Notification
   */
  static async sendDrillNotification(drillData) {
    return this.send({
      type: 'drill',
      priority: 'medium',
      institutionId: drillData.institutionId,
      userIds: drillData.participantIds,
      data: drillData,
    });
  }
  
  /**
   * Send Broadcast
   */
  static async sendBroadcast(broadcastData) {
    return this.send({
      type: 'broadcast',
      priority: broadcastData.priority || 'medium',
      institutionId: broadcastData.institutionId,
      userIds: broadcastData.recipientIds,
      data: broadcastData,
    });
  }
  
  /**
   * Get priority from alert type
   */
  static _getPriorityFromAlertType(alertType) {
    switch (alertType?.toLowerCase()) {
      case 'fire':
        return 'critical';
      case 'flood':
      case 'earthquake':
        return 'high';
      default:
        return 'medium';
    }
  }
}
```

**File**: `backend/src/services/notifications/fcm.service.js`

```javascript
/**
 * FCM Service - Handles Firebase Cloud Messaging
 */

import admin from 'firebase-admin';
import logger from '../../config/logger.js';
import User from '../../models/User.js';

let firebaseAdminInitialized = false;

// Initialize Firebase Admin
export function initializeFirebase() {
  if (admin.apps.length > 0) {
    firebaseAdminInitialized = true;
    return;
  }
  
  try {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (serviceAccount) {
      const serviceAccountJson = JSON.parse(serviceAccount);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccountJson),
      });
      firebaseAdminInitialized = true;
      logger.info('✅ Firebase Admin initialized for notifications');
    } else {
      logger.warn('⚠️ FIREBASE_SERVICE_ACCOUNT not set - FCM disabled');
    }
  } catch (error) {
    logger.error('❌ Firebase Admin initialization failed:', error);
  }
}

/**
 * Send FCM notification
 */
export async function sendFCMNotification(notification) {
  if (!firebaseAdminInitialized) {
    logger.warn('Firebase not initialized - skipping FCM');
    return { success: false, error: 'Firebase not configured' };
  }
  
  const { type, priority, institutionId, userIds, data } = notification;
  
  // Get FCM tokens
  let fcmTokens = [];
  if (userIds && userIds.length > 0) {
    // Get tokens for specific users
    const users = await User.find({ _id: { $in: userIds } }).select('deviceToken');
    fcmTokens = users.map(u => u.deviceToken).filter(Boolean);
  } else if (institutionId) {
    // Get tokens for all users in institution
    const users = await User.find({ institutionId, deviceToken: { $exists: true } })
      .select('deviceToken');
    fcmTokens = users.map(u => u.deviceToken).filter(Boolean);
  }
  
  if (fcmTokens.length === 0) {
    logger.warn(`No FCM tokens found for institution ${institutionId}`);
    return { success: false, error: 'No FCM tokens' };
  }
  
  // Build notification payload
  const { title, body, sound, channelId } = buildNotificationPayload(type, priority, data);
  
  // Send to all tokens
  try {
    const message = {
      notification: { title, body },
      data: {
        type,
        priority,
        ...data,
        timestamp: new Date().toISOString(),
      },
      android: {
        priority: priority === 'critical' ? 'high' : 'normal',
        notification: {
          sound: sound || 'default',
          channelId: channelId || 'high_importance_channel',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: sound || 'default',
            badge: 1,
            priority: priority === 'critical' ? 10 : 5,
          },
        },
      },
      tokens: fcmTokens,
    };
    
    const response = await admin.messaging().sendEachForMulticast(message);
    logger.info(`✅ FCM sent: ${response.successCount}/${fcmTokens.length} successful`);
    
    return { success: true, sent: response.successCount, failed: response.failureCount };
  } catch (error) {
    logger.error('❌ FCM send failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Build notification payload based on type
 */
function buildNotificationPayload(type, priority, data) {
  switch (type) {
    case 'iot_alert':
      return buildIoTAlertPayload(data);
    case 'crisis_alert':
      return buildCrisisAlertPayload(data);
    case 'drill':
      return buildDrillPayload(data);
    case 'broadcast':
      return buildBroadcastPayload(data);
    default:
      return {
        title: 'EduSafe Notification',
        body: 'You have a new notification',
        sound: 'default',
        channelId: 'high_importance_channel',
      };
  }
}

function buildIoTAlertPayload(data) {
  const { alertType, deviceName, severity } = data;
  
  let title = '';
  let body = '';
  
  switch (alertType?.toLowerCase()) {
    case 'fire':
      title = '🔥 Fire Detected!';
      body = `Fire detected at ${deviceName || 'IoT Device'}. Immediate action required!`;
      break;
    case 'flood':
      title = '🌊 Flood Alert!';
      body = `Flood alert at ${deviceName || 'IoT Device'}. Seek higher ground.`;
      break;
    case 'earthquake':
      title = '⚠️ Earthquake Detected!';
      body = `Earthquake detected at ${deviceName || 'IoT Device'}. Drop, Cover, Hold On!`;
      break;
    default:
      title = '⚠️ Device Alert';
      body = `Alert from ${deviceName || 'IoT Device'}`;
  }
  
  return {
    title,
    body,
    sound: 'default',
    channelId: severity === 'critical' ? 'high_importance_channel' : 'default_channel',
  };
}

function buildCrisisAlertPayload(data) {
  return {
    title: data.title || '🚨 Crisis Alert',
    body: data.description || 'A crisis alert has been triggered',
    sound: 'default',
    channelId: 'high_importance_channel',
  };
}

function buildDrillPayload(data) {
  return {
    title: `🚨 Drill: ${data.type || 'Practice Drill'}`,
    body: data.title || 'A safety drill has been scheduled',
    sound: 'default',
    channelId: 'default_channel',
  };
}

function buildBroadcastPayload(data) {
  return {
    title: data.title || '📢 Broadcast',
    body: data.message || 'You have a new broadcast message',
    sound: 'default',
    channelId: 'default_channel',
  };
}
```

**File**: `backend/src/services/notifications/socket.service.js`

```javascript
/**
 * Socket.io Broadcasting Service
 */

import logger from '../../config/logger.js';

/**
 * Broadcast notification via Socket.io
 */
export async function broadcastSocketEvent(institutionId, eventType, data) {
  // This will be called from routes/controllers with io instance
  // We'll pass io as parameter
  return { institutionId, eventType, data };
}

/**
 * Get Socket.io instance from app
 */
export function getSocketIO(req) {
  return req.app.get('io');
}
```

### Step 4.2: Backend - Update Controllers (30 minutes)

**Update**: `backend/src/controllers/iotDevice.controller.js`

```javascript
import { NotificationService } from '../services/notifications/notification.service.js';

// In processTelemetry or deviceAlert:
if (result.alertCreated) {
  await NotificationService.sendIoTAlert({
    institutionId: result.institutionId,
    alertId: result.alertCreated,
    alertType: result.alertType,
    deviceId: deviceId,
    deviceName: device.deviceName,
    severity: result.severity,
    sensorData: result.readings,
  });
}
```

**Update**: `backend/src/controllers/alert.controller.js`

```javascript
import { NotificationService } from '../services/notifications/notification.service.js';

// In createAlert:
await NotificationService.sendCrisisAlert({
  institutionId: alert.institutionId,
  alertId: alert._id,
  type: alert.type,
  severity: alert.severity,
  title: alert.title,
  description: alert.description,
});
```

**Update**: `backend/src/controllers/drill.controller.js`

```javascript
import { NotificationService } from '../services/notifications/notification.service.js';

// In createDrill or triggerDrill:
await NotificationService.sendDrillNotification({
  institutionId: drill.institutionId,
  drillId: drill._id,
  type: drill.type,
  title: drill.title,
  participantIds: drill.participantIds,
});
```

### Step 4.3: Mobile - Unified Notification Service (1 hour)

**File**: `mobile/lib/core/services/notifications/notification_service.dart`

```dart
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter/material.dart';
import 'dart:io';
import 'fcm_service.dart';
import 'local_notification_service.dart';
import 'socket_notification_service.dart';
import 'notification_types.dart';

/// Unified Notification Service
class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();
  
  final FCMService _fcmService = FCMService();
  final LocalNotificationService _localService = LocalNotificationService();
  final SocketNotificationService _socketService = SocketNotificationService();
  
  bool _initialized = false;
  
  /// Initialize all notification services
  Future<void> initialize() async {
    if (_initialized) return;
    
    // 1. Initialize FCM
    await _fcmService.initialize();
    
    // 2. Initialize Local Notifications
    await _localService.initialize();
    
    // 3. Setup FCM foreground handler
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      _handleForegroundMessage(message);
    });
    
    // 4. Setup FCM background handler
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
    
    // 5. Setup Socket.io notification handler
    _socketService.setupHandlers();
    
    _initialized = true;
  }
  
  /// Handle foreground FCM message
  void _handleForegroundMessage(RemoteMessage message) {
    // Show local notification immediately
    _localService.showNotification(
      title: message.notification?.title ?? 'EduSafe Alert',
      body: message.notification?.body ?? '',
      payload: message.data.toString(),
      priority: _getPriorityFromData(message.data),
    );
  }
  
  /// Handle Socket.io notification
  void handleSocketNotification(String eventType, Map<String, dynamic> data) {
    final notification = _parseSocketEvent(eventType, data);
    if (notification != null) {
      _localService.showNotification(
        title: notification['title'],
        body: notification['body'],
        payload: data.toString(),
        priority: notification['priority'],
      );
    }
  }
  
  /// Get priority from notification data
  NotificationPriority _getPriorityFromData(Map<String, dynamic> data) {
    final priority = data['priority']?.toString().toLowerCase();
    switch (priority) {
      case 'critical':
        return NotificationPriority.critical;
      case 'high':
        return NotificationPriority.high;
      case 'medium':
        return NotificationPriority.medium;
      default:
        return NotificationPriority.low;
    }
  }
  
  /// Parse Socket.io event to notification
  Map<String, dynamic>? _parseSocketEvent(String eventType, Map<String, dynamic> data) {
    switch (eventType) {
      case 'DEVICE_ALERT':
        return _parseIoTAlert(data);
      case 'CRISIS_ALERT':
        return _parseCrisisAlert(data);
      case 'DRILL_SCHEDULED':
        return _parseDrillNotification(data);
      default:
        return null;
    }
  }
  
  Map<String, dynamic> _parseIoTAlert(Map<String, dynamic> data) {
    final alertType = data['alertType']?.toString().toUpperCase();
    String title = '';
    String body = '';
    
    switch (alertType) {
      case 'FIRE':
        title = '🔥 Fire Detected!';
        body = 'Fire detected at ${data['deviceName'] ?? 'IoT Device'}';
        break;
      case 'FLOOD':
        title = '🌊 Flood Alert!';
        body = 'Flood alert at ${data['deviceName'] ?? 'IoT Device'}';
        break;
      case 'EARTHQUAKE':
        title = '⚠️ Earthquake Detected!';
        body = 'Earthquake detected at ${data['deviceName'] ?? 'IoT Device'}';
        break;
      default:
        title = '⚠️ Device Alert';
        body = 'Alert from ${data['deviceName'] ?? 'IoT Device'}';
    }
    
    return {
      'title': title,
      'body': body,
      'priority': data['severity'] == 'critical' || alertType == 'FIRE'
          ? NotificationPriority.critical
          : NotificationPriority.high,
    };
  }
  
  Map<String, dynamic> _parseCrisisAlert(Map<String, dynamic> data) {
    return {
      'title': data['title'] ?? '🚨 Crisis Alert',
      'body': data['description'] ?? 'A crisis alert has been triggered',
      'priority': NotificationPriority.high,
    };
  }
  
  Map<String, dynamic> _parseDrillNotification(Map<String, dynamic> data) {
    return {
      'title': '🚨 Drill: ${data['type'] ?? 'Practice Drill'}',
      'body': data['title'] ?? 'A safety drill has been scheduled',
      'priority': NotificationPriority.medium,
    };
  }
  
  /// Register FCM token with backend
  Future<void> registerToken(String userId) async {
    await _fcmService.registerToken(userId);
  }
}

/// Background message handler (must be top-level)
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  // Handle background message
  debugPrint('Background message: ${message.messageId}');
}
```

**File**: `mobile/lib/core/services/notifications/local_notification_service.dart`

```dart
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter/material.dart';
import 'dart:io';
import 'notification_types.dart';

class LocalNotificationService {
  static final LocalNotificationService _instance = LocalNotificationService._internal();
  factory LocalNotificationService() => _instance;
  LocalNotificationService._internal();
  
  final FlutterLocalNotificationsPlugin _plugin = FlutterLocalNotificationsPlugin();
  bool _initialized = false;
  
  Future<void> initialize() async {
    if (_initialized) return;
    
    const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosSettings = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );
    
    const initSettings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );
    
    await _plugin.initialize(initSettings);
    
    // Create notification channels
    if (Platform.isAndroid) {
      await _createChannels();
    }
    
    _initialized = true;
  }
  
  Future<void> _createChannels() async {
    // Critical channel (Fire alerts)
    const criticalChannel = AndroidNotificationChannel(
      'high_importance_channel',
      'EduSafe Critical Alerts',
      description: 'Critical emergency alerts (Fire, etc.)',
      importance: Importance.max,
      playSound: true,
      enableVibration: true,
      showBadge: true,
    );
    
    // High priority channel (Flood, Earthquake)
    const highChannel = AndroidNotificationChannel(
      'high_priority_channel',
      'EduSafe High Priority',
      description: 'High priority alerts (Flood, Earthquake)',
      importance: Importance.high,
      playSound: true,
      enableVibration: true,
    );
    
    // Default channel (Drills, Broadcasts)
    const defaultChannel = AndroidNotificationChannel(
      'default_channel',
      'EduSafe Notifications',
      description: 'General notifications',
      importance: Importance.defaultImportance,
      playSound: true,
      enableVibration: false,
    );
    
    await _plugin
        .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(criticalChannel);
    await _plugin
        .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(highChannel);
    await _plugin
        .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(defaultChannel);
  }
  
  Future<void> showNotification({
    required String title,
    required String body,
    String? payload,
    NotificationPriority priority = NotificationPriority.medium,
  }) async {
    String channelId;
    Importance importance;
    Priority androidPriority;
    Color? color;
    
    switch (priority) {
      case NotificationPriority.critical:
        channelId = 'high_importance_channel';
        importance = Importance.max;
        androidPriority = Priority.max;
        color = Colors.red;
        break;
      case NotificationPriority.high:
        channelId = 'high_priority_channel';
        importance = Importance.high;
        androidPriority = Priority.high;
        color = Colors.orange;
        break;
      case NotificationPriority.medium:
        channelId = 'default_channel';
        importance = Importance.defaultImportance;
        androidPriority = Priority.defaultPriority;
        color = Colors.blue;
        break;
      case NotificationPriority.low:
        channelId = 'default_channel';
        importance = Importance.low;
        androidPriority = Priority.low;
        color = null;
        break;
    }
    
    final androidDetails = AndroidNotificationDetails(
      channelId,
      'EduSafe Alerts',
      channelDescription: 'Emergency alerts and notifications',
      importance: importance,
      priority: androidPriority,
      icon: '@mipmap/ic_launcher',
      color: color ?? const Color(0xFFFF0000), // Default to red
      playSound: true,
      enableVibration: priority != NotificationPriority.low,
      showWhen: true,
      enableLights: true,
      ledColor: color ?? const Color(0xFFFF0000),
    );
    
    final iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );
    
    final details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );
    
    await _plugin.show(
      DateTime.now().millisecondsSinceEpoch % 100000,
      title,
      body,
      details,
      payload: payload,
    );
  }
}
```

**File**: `mobile/lib/core/services/notifications/notification_types.dart`

```dart
enum NotificationType {
  iotAlert,
  crisisAlert,
  drill,
  broadcast,
  parent,
  teacher,
  system,
}

enum NotificationPriority {
  critical,
  high,
  medium,
  low,
}
```

### Step 4.4: Mobile - Update Main.dart (15 minutes)

**Update**: `mobile/lib/main.dart`

```dart
import 'core/services/notifications/notification_service.dart';

void main() async {
  // ... existing initialization ...
  
  // Initialize unified notification service
  await NotificationService().initialize();
  
  runApp(...);
}
```

**Update**: `mobile/lib/main.dart` - In `_KavachAppState`

```dart
@override
void initState() {
  super.initState();
  
  // Initialize notifications
  NotificationService().initialize();
  
  // Setup Socket.io handlers (notifications handled by NotificationService)
  WidgetsBinding.instance.addPostFrameCallback((_) {
    _setupSocketHandlers();
    _setupMeshConnectivity();
  });
}
```

### Step 4.5: Web - Unified Notification Service (45 minutes)

**File**: `web/lib/services/notifications/notification-service.ts`

```typescript
import { BrowserNotificationService } from './browser-notification-service';
import { SoundService } from './sound-service';
import { socketService } from '../socket-service';

export class NotificationService {
  private static instance: NotificationService;
  private browserService: BrowserNotificationService;
  private soundService: SoundService;
  
  private constructor() {
    this.browserService = BrowserNotificationService.getInstance();
    this.soundService = SoundService.getInstance();
  }
  
  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }
  
  async initialize() {
    await this.browserService.initialize();
    this.soundService.initialize();
    this.setupSocketListeners();
  }
  
  private setupSocketListeners() {
    socketService.on('DEVICE_ALERT', (data) => {
      this.handleIoTAlert(data);
    });
    
    socketService.on('CRISIS_ALERT', (data) => {
      this.handleCrisisAlert(data);
    });
    
    socketService.on('DRILL_SCHEDULED', (data) => {
      this.handleDrillNotification(data);
    });
  }
  
  private handleIoTAlert(data: any) {
    const { alertType, deviceName, severity } = data;
    
    let title = '';
    let body = '';
    let priority: 'critical' | 'high' | 'medium' | 'low' = 'high';
    
    switch (alertType?.toUpperCase()) {
      case 'FIRE':
        title = '🔥 Fire Detected!';
        body = `Fire detected at ${deviceName || 'IoT Device'}`;
        priority = 'critical';
        break;
      case 'FLOOD':
        title = '🌊 Flood Alert!';
        body = `Flood alert at ${deviceName || 'IoT Device'}`;
        priority = 'high';
        break;
      case 'EARTHQUAKE':
        title = '⚠️ Earthquake Detected!';
        body = `Earthquake detected at ${deviceName || 'IoT Device'}`;
        priority = 'high';
        break;
    }
    
    this.showNotification(title, body, priority, alertType);
  }
  
  private handleCrisisAlert(data: any) {
    this.showNotification(
      data.title || '🚨 Crisis Alert',
      data.description || 'A crisis alert has been triggered',
      'high',
      'crisis'
    );
  }
  
  private handleDrillNotification(data: any) {
    this.showNotification(
      `🚨 Drill: ${data.type || 'Practice Drill'}`,
      data.title || 'A safety drill has been scheduled',
      'medium',
      'drill'
    );
  }
  
  private showNotification(
    title: string,
    body: string,
    priority: 'critical' | 'high' | 'medium' | 'low',
    type: string
  ) {
    // 1. Browser notification
    if (!this.browserService.isTabActive()) {
      this.browserService.showNotification(title, body, {
        tag: `notification-${Date.now()}`,
        requireInteraction: priority === 'critical',
      });
    }
    
    // 2. Sound alert
    this.soundService.playAlertSound(type, priority);
    
    // 3. Toast notification (if using toast library)
    // This will be handled by the component that uses this service
  }
}
```

---

## ✅ Phase 5: Integration & Testing (1 hour)

### Step 5.1: Integration Checklist

**Backend:**
- [ ] Import `NotificationService` in all controllers
- [ ] Replace all FCM calls with `NotificationService.send*()`
- [ ] Test IoT alerts
- [ ] Test crisis alerts
- [ ] Test drill notifications
- [ ] Test broadcasts

**Mobile:**
- [ ] Initialize `NotificationService` in `main.dart`
- [ ] Connect Socket.io handlers to `NotificationService`
- [ ] Test foreground notifications
- [ ] Test background notifications
- [ ] Test Socket.io notifications
- [ ] Test notification taps

**Web:**
- [ ] Initialize `NotificationService` in dashboard pages
- [ ] Connect Socket.io handlers
- [ ] Test browser notifications
- [ ] Test sound alerts
- [ ] Test toast notifications

### Step 5.2: Testing Scenarios

1. **IoT Alert (Fire)**
   - ESP32 sends fire alert
   - Backend receives → `NotificationService.sendIoTAlert()`
   - FCM sent to all users
   - Socket.io broadcast
   - Mobile: Shows heads-up notification (red, sound, vibration)
   - Web: Shows browser notification + sound

2. **Crisis Alert (Manual)**
   - Admin creates alert
   - Backend → `NotificationService.sendCrisisAlert()`
   - All channels work

3. **Drill Notification**
   - Admin schedules drill
   - Backend → `NotificationService.sendDrillNotification()`
   - Participants receive notification

---

## 📝 Phase 6: Documentation (15 minutes)

Create:
- `NOTIFICATION_SYSTEM_ARCHITECTURE.md` - Architecture overview
- `NOTIFICATION_SYSTEM_API.md` - API documentation
- `NOTIFICATION_TESTING_GUIDE.md` - Testing procedures

---

## ⚡ Quick Start Implementation Order

**Priority Order (Time-Critical Path):**

1. **Backend Unified Service** (1 hour) - Core functionality
2. **Mobile Unified Service** (1 hour) - User-facing
3. **Integration** (30 min) - Connect everything
4. **Testing** (30 min) - Verify it works
5. **Web Service** (45 min) - Dashboard notifications
6. **Cleanup** (15 min) - Remove old code

**Total Time**: ~4 hours

---

## 🎯 Success Criteria

- ✅ All notification types work (IoT, Crisis, Drill, Broadcast)
- ✅ Foreground notifications show on mobile
- ✅ Background notifications work
- ✅ Socket.io real-time updates work
- ✅ Web notifications work
- ✅ No duplicate notifications
- ✅ Proper priority handling (Critical = Red, High = Orange, etc.)
- ✅ Sound and vibration work correctly

---

## 🚨 Risk Mitigation

1. **Keep Socket.io intact** - Don't break real-time updates
2. **Test incrementally** - Test each notification type separately
3. **Keep backup branch** - Easy rollback if needed
4. **Document as you go** - Note any issues or changes

---

## 📋 Implementation Checklist

### Backend
- [ ] Create `notifications/` directory structure
- [ ] Implement `notification.service.js`
- [ ] Implement `fcm.service.js`
- [ ] Implement `socket.service.js`
- [ ] Update IoT controller
- [ ] Update Alert controller
- [ ] Update Drill controller
- [ ] Update Broadcast controller
- [ ] Remove old notification code
- [ ] Test all notification types

### Mobile
- [ ] Create `notifications/` directory structure
- [ ] Implement `notification_service.dart`
- [ ] Implement `fcm_service.dart`
- [ ] Implement `local_notification_service.dart`
- [ ] Implement `socket_notification_service.dart`
- [ ] Update `main.dart`
- [ ] Update Socket handlers
- [ ] Remove old FCM code
- [ ] Test all scenarios

### Web
- [ ] Create `notifications/` directory structure
- [ ] Implement `notification-service.ts`
- [ ] Update dashboard pages
- [ ] Test browser notifications
- [ ] Test sound alerts

---

## 💡 Key Principles

1. **Unified Interface**: One service for all notification types
2. **Multi-Channel**: FCM + Socket.io + Local notifications
3. **Priority-Based**: Different handling for Critical/High/Medium/Low
4. **Type-Specific**: Custom payloads for each notification type
5. **Fail-Safe**: Graceful degradation if FCM not configured
6. **Real-Time First**: Socket.io for instant updates
7. **FCM Backup**: FCM for reliability when app is backgrounded

---

This plan provides a clear, step-by-step approach to rebuild the notification system from scratch with a unified architecture that handles all notification types efficiently.

