import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'dart:io';

// Core Imports
import 'core/config/env.dart';
import 'core/theme/app_theme.dart';
import 'core/theme/theme_provider.dart';
import 'core/constants/app_constants.dart';
import 'core/providers/locale_provider.dart';
import 'core/localizations/app_localizations_delegate.dart';
import 'core/navigation/app_router.dart';
import 'core/services/content_sync_service.dart';
import 'core/services/storage_service.dart';

// Feature Imports - Auth
import 'features/auth/providers/auth_provider.dart';
import 'features/auth/screens/login_screen.dart';
import 'features/auth/screens/forgot_password_screen.dart';
import 'features/auth/screens/reset_password_screen.dart';

// Feature Imports - Dashboard
import 'features/dashboard/screens/dashboard_screen.dart';

// Feature Imports - Connectivity & Messaging
import 'features/socket/providers/socket_provider.dart';
import 'features/socket/handlers/socket_event_handler.dart';
import 'features/fcm/providers/fcm_provider.dart';
import 'features/fcm/handlers/fcm_message_handler.dart';
import 'features/mesh/providers/mesh_provider.dart';

// Global FlutterLocalNotificationsPlugin instance for foreground notifications
final FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin =
    FlutterLocalNotificationsPlugin();

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // 1. Initialize Firebase
  try {
    await Firebase.initializeApp();
    debugPrint('✅ Firebase initialized successfully');
  } catch (e) {
    debugPrint('⚠️ Firebase initialization failed (may not be configured): $e');
    debugPrint(
        '⚠️ App will continue without Firebase. FCM will not work until Firebase is configured.');
  }

  // 2. Load environment variables
  await Env.load();

  // 3. Initialize Hive for local storage
  await Hive.initFlutter();

  // 4. Open required Hive boxes
  await Hive.openBox(AppConstants.userBox);
  await Hive.openBox(AppConstants.settingsBox);
  await Hive.openBox(AppConstants.cacheBox);
  await Hive.openBox(AppConstants.modulesBox);
  await Hive.openBox(AppConstants
      .completedModulesBox); // Phase 1: Local completion persistence
  await Hive.openBox(
      AppConstants.videoProgressBox); // NDMA Module Video Progress Persistence
  await Hive.openBox(AppConstants.drillLogsBox);
  await Hive.openBox(AppConstants.quizResultsBox);
  await Hive.openBox(AppConstants.quizzesBox); // Phase 3.1.4: AI quiz cache

  // Phase 3.2.5: Game offline storage
  await Hive.openBox(AppConstants.gameScoresBox);
  await Hive.openBox(AppConstants.gameStatesBox);
  await Hive.openBox(AppConstants.gameItemsBox);

  // Phase 5.3: Mesh offline queue
  await Hive.openBox(AppConstants.meshOfflineQueueBox);

  // 5. Initialize Flutter Local Notifications and create notification channel

  // Android initialization settings
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

  await flutterLocalNotificationsPlugin.initialize(
    initSettings,
    onDidReceiveNotificationResponse: (NotificationResponse response) {
      // Handle notification tap
      debugPrint('Notification tapped: ${response.payload}');
    },
  );

  // Create Android notification channel with maximum importance for heads-up notifications
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

    await flutterLocalNotificationsPlugin
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(androidChannel);

    debugPrint(
        '✅ Android notification channel created: high_importance_channel');
  }

  // Request notification permissions
  try {
    final settings = await FirebaseMessaging.instance.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      provisional: false,
    );

    if (settings.authorizationStatus == AuthorizationStatus.authorized ||
        settings.authorizationStatus == AuthorizationStatus.provisional) {
      debugPrint('✅ Notification permissions granted');
    } else {
      debugPrint('⚠️ Notification permissions denied');
    }
  } catch (e) {
    debugPrint('⚠️ Error requesting notification permissions: $e');
  }

  // 6. Inject mock data if needed (Optional Debugging)
  try {
    final storageService = StorageService();
    final contentSyncService = ContentSyncService(
      storageService: storageService,
    );
    if (await contentSyncService.shouldInjectMockData()) {
      await contentSyncService.injectMockData();
    }
  } catch (e) {
    debugPrint('Mock data injection skipped: $e');
  }

  runApp(
    const ProviderScope(
      child: KavachApp(),
    ),
  );
}

class KavachApp extends ConsumerStatefulWidget {
  const KavachApp({super.key});

  @override
  ConsumerState<KavachApp> createState() => _KavachAppState();
}

class _KavachAppState extends ConsumerState<KavachApp> {
  SocketEventHandler? _socketEventHandler;
  FcmMessageHandler? _fcmMessageHandler;

  @override
  void initState() {
    super.initState();

    // Initialize FCM immediately
    _initializeFCM();

    // Setup foreground FCM message handler
    _setupForegroundFCMHandler();

    // Setup listeners and handlers after the first frame
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _setupSocketHandlers();
      _setupFCMHandlers();
      _setupMeshConnectivity();
    });
  }

  /// Setup foreground FCM message handler
  void _setupForegroundFCMHandler() {
    // Listen to FirebaseMessaging.onMessage for foreground notifications
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      debugPrint('📱 Foreground FCM message received: ${message.messageId}');
      debugPrint('   Title: ${message.notification?.title}');
      debugPrint('   Body: ${message.notification?.body}');

      // Show local notification immediately using flutter_local_notifications
      _showForegroundNotification(message);
    });
  }

  /// Show local notification for foreground FCM messages
  Future<void> _showForegroundNotification(RemoteMessage message) async {
    final notification = message.notification;
    final android = message.notification?.android;

    if (notification == null) {
      debugPrint('⚠️ No notification data in FCM message');
      return;
    }

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

    await flutterLocalNotificationsPlugin.show(
      message.hashCode,
      notification.title ?? 'EduSafe Alert',
      notification.body ?? '',
      details,
      payload: message.data.toString(),
    );

    debugPrint('✅ Foreground notification shown: ${notification.title}');
  }

  /// Initialize FCM Provider
  Future<void> _initializeFCM() async {
    try {
      await ref.read(fcmProvider.notifier).initialize();
    } catch (e) {
      debugPrint('FCM initialization skipped: $e');
    }
  }

  /// Setup Socket Event Listeners (e.g., Drill Alerts)
  void _setupSocketHandlers() {
    final context = this.context;
    if (context.mounted) {
      _socketEventHandler = SocketEventHandler(context, ref);
      _socketEventHandler!.setupHandlers();
    }
  }

  /// Setup FCM Message Handlers (Foreground notifications)
  void _setupFCMHandlers() {
    final context = this.context;
    if (context.mounted) {
      _fcmMessageHandler = FcmMessageHandler(context, ref);
    }
  }

  /// Setup Mesh Networking & Connectivity Monitoring (Phase 5.1 & 5.2)
  void _setupMeshConnectivity() {
    final connectivityService = ref.read(connectivityServiceProvider);

    // Phase 5.2: Initialize Bridge Node Service
    try {
      final bridgeService = ref.read(bridgeNodeServiceProvider);
      if (bridgeService != null) {
        debugPrint('✅ Bridge Node Service initialized');
      }
    } catch (e) {
      debugPrint('⚠️ Bridge Node Service initialization skipped: $e');
    }

    // Auto-start mesh when offline
    connectivityService.onOffline = (isOffline) {
      if (isOffline) {
        ref.read(meshConnectivityProvider.notifier).onOffline();
      }
    };

    // Stop mesh when online
    connectivityService.onOnline = (isOnline) {
      if (isOnline) {
        ref.read(meshConnectivityProvider.notifier).onOnline();
      }
    };

    // Phase 5.2: Listen to crisis alerts to update battery duty cycle
    // This will be handled by socket event handlers
  }

  @override
  Widget build(BuildContext context) {
    final appMode = ref.watch(appModeProvider);
    final themeMode = ref.watch(themeModeProvider);
    final localeState = ref.watch(localeProvider);
    final authState = ref.watch(authProvider);
    final socketState = ref.watch(socketProvider);

    // Connect socket when authenticated
    if (authState.isAuthenticated &&
        !socketState.isConnected &&
        !socketState.isConnecting) {
      WidgetsBinding.instance.addPostFrameCallback((_) async {
        await ref.read(socketProvider.notifier).connect();

        // Wait a bit for connection to establish, then join room
        await Future<void>.delayed(const Duration(milliseconds: 500));

        // Join room if user has institutionId
        final institutionId = authState.user?.institutionId;
        if (institutionId != null && institutionId.isNotEmpty) {
          print('🔄 Joining Socket.io room: school:$institutionId');
          ref.read(socketProvider.notifier).joinRoom(institutionId);
        } else {
          print('⚠️ No institutionId available for room join');
        }
      });
    }

    // Disconnect socket when logged out
    if (!authState.isAuthenticated && socketState.isConnected) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        ref.read(socketProvider.notifier).disconnect();
      });
    }

    // Register FCM token when authenticated
    if (authState.isAuthenticated && authState.user != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) async {
        // Wait a bit to ensure auth token is fully set in API service
        await Future<void>.delayed(const Duration(milliseconds: 500));

        final fcmState = ref.read(fcmProvider);
        final user = authState.user!;
        final userId = user.id;

        if (fcmState.token != null &&
            fcmState.isInitialized &&
            userId.isNotEmpty) {
          ref.read(fcmProvider.notifier).registerTokenWithBackend(userId);

          // Subscribe to school topic if user has institutionId
          if (user.institutionId != null && user.institutionId!.isNotEmpty) {
            ref
                .read(fcmProvider.notifier)
                .subscribeToSchool(user.institutionId!);
          }
        }
      });
    }

    return MaterialApp(
      title: AppConstants.appName,
      debugShowCheckedModeBanner: false,

      // Theme Configuration
      theme: AppTheme.getTheme(appMode == AppMode.peace ? 'peace' : 'crisis'),
      themeMode:
          themeMode == AppThemeMode.light ? ThemeMode.light : ThemeMode.dark,

      // Localization Configuration
      locale: localeState.locale,
      localizationsDelegates: const [
        AppLocalizationsDelegate(),
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      supportedLocales: const [
        Locale('en', ''), // English
        Locale('hi', ''), // Hindi
        Locale('mr', ''), // Marathi
        Locale('pa', ''), // Punjabi
      ],

      // Phase 101.9.1: Smooth page transitions
      builder: (context, child) {
        return MediaQuery(
          // Phase 101.9.2: Text scaling support for accessibility
          data: MediaQuery.of(context).copyWith(
            textScaler: MediaQuery.of(context).textScaler.clamp(
                  minScaleFactor: 0.8,
                  maxScaleFactor: 1.5,
                ),
          ),
          child: child!,
        );
      },

      // Phase 3.4.6.2: Use AppRouter for role-based initial screen
      home: authState.isLoading
          ? const SplashScreen()
          : AppRouter.getInitialScreen(authState),
      routes: {
        '/login': (context) => const LoginScreen(),
        '/home': (context) => const DashboardScreen(),
        '/forgot-password': (context) => const ForgotPasswordScreen(),
      },
      onGenerateRoute: (settings) {
        // Handle reset-password with token from URL or arguments
        if (settings.name == '/reset-password') {
          String? token;

          // Try to get token from arguments
          if (settings.arguments is Map) {
            token = (settings.arguments as Map)['token'] as String?;
          }

          // If no token in arguments, try to parse from name (for deep links)
          if (token == null && settings.name != null) {
            try {
              final uri = Uri.parse(settings.name!);
              token = uri.queryParameters['token'];
            } catch (_) {
              // Ignore parsing errors
            }
          }

          return MaterialPageRoute(
            builder: (context) => ResetPasswordScreen(token: token),
            settings: settings,
          );
        }
        // Fall back to AppRouter for other routes
        return AppRouter.generateRoute(settings, authState);
      },
    );
  }
}

class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.shield,
              size: 100,
              color: Theme.of(context).colorScheme.primary,
            ),
            const SizedBox(height: 20),
            Text(
              AppConstants.appName,
              style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: 10),
            Text(
              AppConstants.appDescription,
              style: Theme.of(context).textTheme.bodyLarge,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 40),
            const CircularProgressIndicator(),
          ],
        ),
      ),
    );
  }
}
