# 🚀 Notification System Rebuild - Quick Start Guide

## ⏱️ Time-Efficient Approach (4-5 hours total)

**Strategy**: Build new system alongside old one, then switch over (safer & faster)

---

## 📦 Phase 1: Create New Unified Services (2 hours)

### Step 1.1: Backend - Create New Notification Service (45 min)

**Create**: `backend/src/services/notifications/notification.service.js`

```javascript
/**
 * Unified Notification Service - NEW IMPLEMENTATION
 * Single entry point for all notifications
 */

import { sendFCM } from './fcm.service.js';
import { broadcastSocket } from './socket.service.js';
import logger from '../../config/logger.js';
import User from '../../models/User.js';

export class NotificationService {
  /**
   * Send notification via all channels
   */
  static async send({
    type,           // 'iot_alert', 'crisis_alert', 'drill', 'broadcast'
    priority,       // 'critical', 'high', 'medium', 'low'
    institutionId,
    userIds = null, // Specific users, or null for all in institution
    data = {},
  }) {
    // 1. Get FCM tokens
    let fcmTokens = [];
    if (userIds && userIds.length > 0) {
      const users = await User.find({ _id: { $in: userIds } }).select('deviceToken');
      fcmTokens = users.map(u => u.deviceToken).filter(Boolean);
    } else if (institutionId) {
      const users = await User.find({ 
        institutionId, 
        deviceToken: { $exists: true, $ne: null } 
      }).select('deviceToken');
      fcmTokens = users.map(u => u.deviceToken).filter(Boolean);
    }
    
    // 2. Build notification payload
    const payload = this._buildPayload(type, priority, data);
    
    // 3. Send FCM (if tokens available)
    if (fcmTokens.length > 0) {
      await sendFCM(fcmTokens, payload);
    }
    
    // 4. Broadcast Socket.io (real-time)
    await broadcastSocket(institutionId, type, data);
    
    logger.info(`✅ Notification sent: ${type} to ${institutionId} (${fcmTokens.length} FCM, Socket.io)`);
  }
  
  /**
   * IoT Alert
   */
  static async sendIoTAlert({
    institutionId,
    alertType,
    deviceId,
    deviceName,
    severity,
    sensorData,
  }) {
    const priority = alertType === 'fire' ? 'critical' : 
                     (alertType === 'flood' || alertType === 'earthquake') ? 'high' : 'medium';
    
    return this.send({
      type: 'iot_alert',
      priority,
      institutionId,
      userIds: null, // All users in institution
      data: {
        alertType,
        deviceId,
        deviceName,
        severity,
        sensorData,
        title: this._getIoTTitle(alertType, deviceName),
        body: this._getIoTBody(alertType, deviceName, sensorData),
      },
    });
  }
  
  /**
   * Crisis Alert
   */
  static async sendCrisisAlert({
    institutionId,
    alertId,
    type,
    severity,
    title,
    description,
  }) {
    return this.send({
      type: 'crisis_alert',
      priority: severity || 'high',
      institutionId,
      userIds: null,
      data: { alertId, type, severity, title, description },
    });
  }
  
  /**
   * Drill Notification
   */
  static async sendDrill({
    institutionId,
    drillId,
    type,
    title,
    participantIds,
  }) {
    return this.send({
      type: 'drill',
      priority: 'medium',
      institutionId,
      userIds: participantIds,
      data: { drillId, type, title },
    });
  }
  
  /**
   * Broadcast
   */
  static async sendBroadcast({
    institutionId,
    title,
    message,
    recipientIds,
    priority = 'medium',
  }) {
    return this.send({
      type: 'broadcast',
      priority,
      institutionId,
      userIds: recipientIds,
      data: { title, message },
    });
  }
  
  // Helper methods
  static _buildPayload(type, priority, data) {
    return {
      notification: {
        title: data.title || 'EduSafe Alert',
        body: data.body || 'You have a new notification',
      },
      data: {
        type,
        priority,
        ...data,
        timestamp: new Date().toISOString(),
      },
      android: {
        priority: priority === 'critical' ? 'high' : 'normal',
        notification: {
          sound: 'default',
          channelId: priority === 'critical' ? 'high_importance_channel' : 'default_channel',
        },
      },
    };
  }
  
  static _getIoTTitle(alertType, deviceName) {
    switch (alertType?.toLowerCase()) {
      case 'fire': return '🔥 Fire Detected!';
      case 'flood': return '🌊 Flood Alert!';
      case 'earthquake': return '⚠️ Earthquake Detected!';
      default: return '⚠️ Device Alert';
    }
  }
  
  static _getIoTBody(alertType, deviceName, sensorData) {
    const location = deviceName || 'IoT Device';
    switch (alertType?.toLowerCase()) {
      case 'fire':
        return `Fire detected at ${location}. Immediate action required!`;
      case 'flood':
        const water = sensorData?.water;
        return `Flood alert at ${location}${water ? ` (Level: ${water})` : ''}`;
      case 'earthquake':
        const mag = sensorData?.magnitude;
        return `Earthquake at ${location}${mag ? ` (${mag.toFixed(2)}G)` : ''}`;
      default:
        return `Alert from ${location}`;
    }
  }
}
```

**Create**: `backend/src/services/notifications/fcm.service.js`

```javascript
import admin from 'firebase-admin';
import logger from '../../config/logger.js';

let initialized = false;

export function initialize() {
  if (admin.apps.length > 0) {
    initialized = true;
    return;
  }
  
  try {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(serviceAccount)),
      });
      initialized = true;
      logger.info('✅ FCM initialized');
    }
  } catch (error) {
    logger.warn('⚠️ FCM not configured');
  }
}

export async function sendFCM(tokens, payload) {
  if (!initialized || tokens.length === 0) return;
  
  try {
    const response = await admin.messaging().sendEachForMulticast({
      tokens,
      ...payload,
    });
    logger.info(`✅ FCM: ${response.successCount}/${tokens.length} sent`);
    return response;
  } catch (error) {
    logger.error('❌ FCM error:', error);
    return null;
  }
}
```

**Create**: `backend/src/services/notifications/socket.service.js`

```javascript
import logger from '../../config/logger.js';

export async function broadcastSocket(institutionId, eventType, data) {
  // This will be called with io instance from controllers
  // Return data for controller to broadcast
  return { institutionId, eventType, data };
}
```

### Step 1.2: Update Controllers to Use New Service (30 min)

**Update**: `backend/src/controllers/iotDevice.controller.js`

```javascript
import { NotificationService } from '../services/notifications/notification.service.js';

// In processTelemetry, after alert created:
if (result.alertCreated) {
  await NotificationService.sendIoTAlert({
    institutionId: result.institutionId,
    alertType: result.alertType,
    deviceId: deviceId,
    deviceName: result.device.deviceName,
    severity: result.severity,
    sensorData: result.readings,
  });
  
  // Also broadcast Socket.io
  const io = req.app.get('io');
  if (io) {
    const { broadcastToSchool } = await import('../socket/rooms.js');
    broadcastToSchool(io, result.institutionId, 'DEVICE_ALERT', {
      deviceId,
      alertId: result.alertCreated,
      alertType: result.alertType,
      deviceName: result.device.deviceName,
      deviceType: result.device.deviceType,
      room: result.device.room,
      severity: result.severity,
      readings: result.readings,
    });
  }
}
```

**Update**: `backend/src/controllers/device.controller.js`

```javascript
import { NotificationService } from '../services/notifications/notification.service.js';

// In deviceAlert, after alert created:
await NotificationService.sendIoTAlert({
  institutionId: device.institutionId,
  alertType: alertTypeLower,
  deviceId: device.deviceId,
  deviceName: device.deviceName,
  severity: severityLower,
  sensorData: sensorData || {},
});

// Socket.io broadcast (already exists, keep it)
```

### Step 1.3: Mobile - Create Unified Service (45 min)

**Create**: `mobile/lib/core/services/notifications/unified_notification_service.dart`

```dart
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter/material.dart';
import 'dart:io';

class UnifiedNotificationService {
  static final UnifiedNotificationService _instance = UnifiedNotificationService._internal();
  factory UnifiedNotificationService() => _instance;
  UnifiedNotificationService._internal();
  
  final FlutterLocalNotificationsPlugin _localNotifications = FlutterLocalNotificationsPlugin();
  bool _initialized = false;
  
  Future<void> initialize() async {
    if (_initialized) return;
    
    // Initialize local notifications
    const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosSettings = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );
    
    await _localNotifications.initialize(
      InitializationSettings(android: androidSettings, iOS: iosSettings),
    );
    
    // Create channels
    if (Platform.isAndroid) {
      await _createChannels();
    }
    
    // Setup FCM foreground handler
    FirebaseMessaging.onMessage.listen(_handleForegroundFCM);
    
    _initialized = true;
  }
  
  Future<void> _createChannels() async {
    const criticalChannel = AndroidNotificationChannel(
      'high_importance_channel',
      'EduSafe Critical',
      description: 'Critical alerts (Fire)',
      importance: Importance.max,
      playSound: true,
      enableVibration: true,
    );
    
    const highChannel = AndroidNotificationChannel(
      'high_priority_channel',
      'EduSafe High Priority',
      description: 'High priority alerts',
      importance: Importance.high,
      playSound: true,
      enableVibration: true,
    );
    
    await _localNotifications
        .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(criticalChannel);
    await _localNotifications
        .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(highChannel);
  }
  
  void _handleForegroundFCM(RemoteMessage message) {
    final notification = message.notification;
    if (notification == null) return;
    
    final priority = _getPriorityFromData(message.data);
    showNotification(
      title: notification.title ?? 'EduSafe Alert',
      body: notification.body ?? '',
      priority: priority,
    );
  }
  
  Future<void> showNotification({
    required String title,
    required String body,
    NotificationPriority priority = NotificationPriority.medium,
  }) async {
    String channelId;
    Importance importance;
    Color color;
    
    switch (priority) {
      case NotificationPriority.critical:
        channelId = 'high_importance_channel';
        importance = Importance.max;
        color = Colors.red;
        break;
      case NotificationPriority.high:
        channelId = 'high_priority_channel';
        importance = Importance.high;
        color = Colors.orange;
        break;
      default:
        channelId = 'default_channel';
        importance = Importance.defaultImportance;
        color = Colors.blue;
    }
    
    final androidDetails = AndroidNotificationDetails(
      channelId,
      'EduSafe Alerts',
      importance: importance,
      priority: Priority.high,
      icon: '@mipmap/ic_launcher',
      color: color,
      playSound: true,
      enableVibration: true,
    );
    
    await _localNotifications.show(
      DateTime.now().millisecondsSinceEpoch % 100000,
      title,
      body,
      NotificationDetails(android: androidDetails),
    );
  }
  
  NotificationPriority _getPriorityFromData(Map<String, dynamic> data) {
    final priority = data['priority']?.toString().toLowerCase();
    if (priority == 'critical' || data['alertType'] == 'fire') {
      return NotificationPriority.critical;
    } else if (priority == 'high') {
      return NotificationPriority.high;
    }
    return NotificationPriority.medium;
  }
  
  // Handle Socket.io notifications
  void handleSocketNotification(String eventType, Map<String, dynamic> data) {
    if (eventType == 'DEVICE_ALERT') {
      final alertType = data['alertType']?.toString().toUpperCase();
      String title = '';
      String body = '';
      NotificationPriority priority = NotificationPriority.high;
      
      switch (alertType) {
        case 'FIRE':
          title = '🔥 Fire Detected!';
          body = 'Fire detected at ${data['deviceName'] ?? 'IoT Device'}';
          priority = NotificationPriority.critical;
          break;
        case 'FLOOD':
          title = '🌊 Flood Alert!';
          body = 'Flood alert at ${data['deviceName'] ?? 'IoT Device'}';
          break;
        case 'EARTHQUAKE':
          title = '⚠️ Earthquake Detected!';
          body = 'Earthquake detected at ${data['deviceName'] ?? 'IoT Device'}';
          break;
      }
      
      showNotification(title: title, body: body, priority: priority);
    }
  }
}

enum NotificationPriority { critical, high, medium, low }
```

**Update**: `mobile/lib/main.dart`

```dart
import 'core/services/notifications/unified_notification_service.dart';

void main() async {
  // ... existing code ...
  
  // Initialize unified notification service
  await UnifiedNotificationService().initialize();
  
  runApp(...);
}

// In _KavachAppState initState:
@override
void initState() {
  super.initState();
  
  // Setup Socket.io notification handler
  WidgetsBinding.instance.addPostFrameCallback((_) {
    _setupSocketNotificationHandler();
  });
}

void _setupSocketNotificationHandler() {
  final socketNotifier = ref.read(socketProvider.notifier);
  socketNotifier.on('DEVICE_ALERT', (data) {
    UnifiedNotificationService().handleSocketNotification('DEVICE_ALERT', data);
  });
}
```

---

## 🔄 Phase 2: Switch Over (30 min)

### Step 2.1: Update All Controllers

Replace old notification calls with `NotificationService.send*()` methods

### Step 2.2: Test Each Notification Type

1. IoT Alert (Fire) → Should show red notification
2. IoT Alert (Flood) → Should show orange notification
3. Crisis Alert → Should show notification
4. Drill → Should show notification

### Step 2.3: Remove Old Code

Once new system works, delete old files:
- `backend/src/services/notification.service.js` (old)
- `mobile/lib/core/services/fcm_service.dart` (old)
- `mobile/lib/features/fcm/` (old, if not needed)

---

## ✅ Phase 3: Final Testing (30 min)

Test all scenarios:
- [ ] IoT Fire Alert (Foreground)
- [ ] IoT Fire Alert (Background)
- [ ] IoT Flood Alert
- [ ] IoT Earthquake Alert
- [ ] Crisis Alert
- [ ] Drill Notification
- [ ] Broadcast

---

## 🎯 Key Benefits of This Approach

1. **Unified Interface**: One service for all notification types
2. **Multi-Channel**: FCM + Socket.io + Local notifications
3. **Priority-Based**: Critical = Red, High = Orange, etc.
4. **Fail-Safe**: Works even if FCM not configured
5. **Real-Time**: Socket.io for instant updates
6. **Reliable**: FCM for background/terminated app

---

## 📋 Quick Checklist

**Backend (1.5 hours):**
- [ ] Create `notifications/` directory
- [ ] Create `notification.service.js`
- [ ] Create `fcm.service.js`
- [ ] Create `socket.service.js`
- [ ] Update IoT controller
- [ ] Update Alert controller
- [ ] Test IoT alerts

**Mobile (1.5 hours):**
- [ ] Create `notifications/` directory
- [ ] Create `unified_notification_service.dart`
- [ ] Update `main.dart`
- [ ] Connect Socket.io handler
- [ ] Test foreground notifications
- [ ] Test background notifications

**Web (30 min):**
- [ ] Update existing notification services
- [ ] Test browser notifications

**Testing (30 min):**
- [ ] Test all notification types
- [ ] Verify no duplicates
- [ ] Verify proper priority handling

---

This streamlined approach gets you a working unified notification system in ~4 hours with minimal risk.

