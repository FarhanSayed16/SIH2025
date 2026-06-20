import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter/material.dart';
import 'dart:io';
import '../constants/app_constants.dart';

/// FCM Service - Handles Firebase Cloud Messaging
class FcmService {
  final FirebaseMessaging _firebaseMessaging = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();

  String? _fcmToken;
  bool _initialized = false;

  // Callbacks
  Function(String)? onTokenReceived;
  Function(RemoteMessage)? onMessageReceived;
  Function(RemoteMessage)? onBackgroundMessage;

  String? get fcmToken => _fcmToken;
  bool get isInitialized => _initialized;

  /// Initialize FCM service
  Future<void> initialize() async {
    if (_initialized) return;

    try {
      // Request notification permissions
      final settings = await _firebaseMessaging.requestPermission(
        alert: true,
        badge: true,
        sound: true,
        provisional: false,
      );

      if (settings.authorizationStatus == AuthorizationStatus.authorized ||
          settings.authorizationStatus == AuthorizationStatus.provisional) {
        // Initialize local notifications
        await _initializeLocalNotifications();

        // Get FCM token
        _fcmToken = await _firebaseMessaging.getToken();
        if (_fcmToken != null) {
          onTokenReceived?.call(_fcmToken!);
        }

        // Listen for token refresh
        _firebaseMessaging.onTokenRefresh.listen((newToken) {
          _fcmToken = newToken;
          onTokenReceived?.call(newToken);
        });

        // Setup message handlers
        _setupMessageHandlers();

        _initialized = true;
      }
    } catch (e) {
      // Firebase might not be configured - that's okay
      print('FCM initialization error (Firebase may not be configured): $e');
    }
  }

  /// Initialize local notifications
  Future<void> _initializeLocalNotifications() async {
    const androidSettings =
        AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosSettings = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );

    const initSettings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await _localNotifications.initialize(
      initSettings,
      onDidReceiveNotificationResponse: _onNotificationTapped,
    );

    // Create notification channel for Android
    if (Platform.isAndroid) {
      const androidChannel = AndroidNotificationChannel(
        'high_importance_channel',
        'EduSafe Alerts',
        description: 'Emergency alerts and notifications',
        importance:
            Importance.max, // Maximum importance for heads-up notifications
        playSound: true,
        enableVibration: true,
        showBadge: true,
      );

      await _localNotifications
          .resolvePlatformSpecificImplementation<
              AndroidFlutterLocalNotificationsPlugin>()
          ?.createNotificationChannel(androidChannel);
    }
  }

  /// Setup message handlers
  void _setupMessageHandlers() {
    // Note: Foreground messages are handled in main.dart's initState()
    // to ensure heads-up notifications work correctly
    // FirebaseMessaging.onMessage is set up there instead

    // Background message handler (must be top-level function)
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

    // Notification tap when app is terminated
    FirebaseMessaging.instance.getInitialMessage().then((message) {
      if (message != null) {
        _handleMessage(message);
      }
    });

    // Notification tap when app is in background
    FirebaseMessaging.onMessageOpenedApp.listen((message) {
      _handleMessage(message);
    });
  }

  /// Handle foreground message
  void _handleForegroundMessage(RemoteMessage message) {
    // Show local notification for foreground messages
    _showLocalNotification(message);

    // Trigger callback
    onMessageReceived?.call(message);
  }

  /// Handle message (when notification is tapped)
  void _handleMessage(RemoteMessage message) {
    // This will be handled by the app's navigation
    onMessageReceived?.call(message);
  }

  /// Show local notification
  Future<void> _showLocalNotification(RemoteMessage message) async {
    final notification = message.notification;
    final android = message.notification?.android;

    if (notification == null) return;

    final androidDetails = AndroidNotificationDetails(
      'high_importance_channel',
      'EduSafe Alerts',
      channelDescription: 'Emergency alerts and notifications',
      importance:
          Importance.max, // Maximum importance for heads-up notifications
      priority: Priority.max, // Maximum priority
      icon: android?.smallIcon ?? '@mipmap/ic_launcher',
      color: const Color(0xFFFF0000), // Red color for alerts
      playSound: true,
      enableVibration: true,
      showWhen: true,
      enableLights: true,
      ledColor: const Color(0xFFFF0000), // Red LED for alerts
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

    await _localNotifications.show(
      message.hashCode,
      notification.title ?? 'EduSafe Alert',
      notification.body ?? '',
      details,
      payload: message.data.toString(),
    );
  }

  /// Handle notification tap
  void _onNotificationTapped(NotificationResponse response) {
    // This will be handled by the app's navigation
    // The payload can be used to navigate to specific screen
  }

  /// Subscribe to topic
  Future<void> subscribeToTopic(String topic) async {
    try {
      await _firebaseMessaging.subscribeToTopic(topic);
    } catch (e) {
      print('Failed to subscribe to topic: $e');
    }
  }

  /// Unsubscribe from topic
  Future<void> unsubscribeFromTopic(String topic) async {
    try {
      await _firebaseMessaging.unsubscribeFromTopic(topic);
    } catch (e) {
      print('Failed to unsubscribe from topic: $e');
    }
  }

  /// Delete token
  Future<void> deleteToken() async {
    try {
      await _firebaseMessaging.deleteToken();
      _fcmToken = null;
    } catch (e) {
      print('Failed to delete token: $e');
    }
  }
}

/// Background message handler (must be top-level function)
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  // Handle background message
  // This is called when app is in background or terminated
  print('Background message received: ${message.messageId}');
}
