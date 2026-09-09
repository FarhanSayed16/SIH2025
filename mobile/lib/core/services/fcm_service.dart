import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'dart:io';


/// FCM Service - Handles Firebase Cloud Messaging
class FcmService {
  final FirebaseMessaging _firebaseMessaging = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();

  String? _fcmToken;
  bool _initialized = false;

  // Callbacks
  void Function(String)? onTokenReceived;
  void Function(RemoteMessage)? onMessageReceived;
  void Function(RemoteMessage)? onBackgroundMessage;

  String? get fcmToken => _fcmToken;
  bool get isInitialized => _initialized;

  /// Initialize FCM without prompting. Uses existing authorization when present.
  Future<void> initialize({bool requestPermission = false}) async {
    if (_initialized) return;

    try {
      NotificationSettings settings;
      if (requestPermission) {
        settings = await _firebaseMessaging.requestPermission(
          alert: true,
          badge: true,
          sound: true,
          provisional: false,
        );
      } else {
        settings = await _firebaseMessaging.getNotificationSettings();
      }

      if (settings.authorizationStatus == AuthorizationStatus.authorized ||
          settings.authorizationStatus == AuthorizationStatus.provisional) {
        await _completeInitialization();
      }
    } catch (e) {
      // Firebase might not be configured - that's okay
      print('FCM initialization error (Firebase may not be configured): $e');
    }
  }

  /// Prompt for alert notifications at a relevant moment (e.g. Profile).
  Future<AuthorizationStatus> requestAlertPermission() async {
    try {
      final settings = await _firebaseMessaging.requestPermission(
        alert: true,
        badge: true,
        sound: true,
        provisional: false,
      );
      if (settings.authorizationStatus == AuthorizationStatus.authorized ||
          settings.authorizationStatus == AuthorizationStatus.provisional) {
        await _completeInitialization();
      }
      return settings.authorizationStatus;
    } catch (e) {
      print('FCM permission request error: $e');
      return AuthorizationStatus.notDetermined;
    }
  }

  Future<void> _completeInitialization() async {
    if (_initialized) return;

    await _initializeLocalNotifications();

    _fcmToken = await _firebaseMessaging.getToken();
    if (_fcmToken != null) {
      onTokenReceived?.call(_fcmToken!);
    }

    _firebaseMessaging.onTokenRefresh.listen((newToken) {
      _fcmToken = newToken;
      onTokenReceived?.call(newToken);
    });

    _setupMessageHandlers();
    _initialized = true;
  }

  /// Initialize local notifications
  Future<void> _initializeLocalNotifications() async {
    const androidSettings =
        AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosSettings = DarwinInitializationSettings(
      requestAlertPermission: false,
      requestBadgePermission: false,
      requestSoundPermission: false,
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
  /// Handle message (when notification is tapped)
  void _handleMessage(RemoteMessage message) {
    // This will be handled by the app's navigation
    onMessageReceived?.call(message);
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
