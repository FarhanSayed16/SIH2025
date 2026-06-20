import 'package:flutter/material.dart';
import '../../features/auth/providers/auth_provider.dart';
import '../../features/auth/models/user_model.dart';
import '../../features/auth/screens/login_screen.dart';
import '../../features/dashboard/screens/dashboard_screen.dart';
import '../../features/teacher/screens/teacher_dashboard_screen.dart';
import '../../features/parent/screens/parent_dashboard_screen.dart';
import '../../features/kid/screens/kid_home_screen.dart';
import '../../core/providers/kid_mode_provider.dart';

/// App Router
/// Handles navigation based on user role and access level
class AppRouter {
  /// Generate route based on authentication state
  static Route<dynamic> generateRoute(
    RouteSettings settings,
    AuthState authState,
  ) {
    final user = authState.user;

    // Not authenticated - show login
    if (user == null || !authState.isAuthenticated) {
      return MaterialPageRoute(
        builder: (_) => const LoginScreen(),
        settings: settings,
      );
    }

    // Route based on role
    switch (user.role) {
      case 'admin':
        return MaterialPageRoute(
          builder: (_) => const DashboardScreen(), // Admin dashboard
          settings: settings,
        );

      case 'teacher':
        return MaterialPageRoute(
          builder: (_) => const TeacherDashboardScreen(),
          settings: settings,
        );

      case 'student':
        return _routeStudent(user, settings);

      case 'parent':
        return MaterialPageRoute(
          builder: (_) => const ParentDashboardScreen(),
          settings: settings,
        );

      default:
        return MaterialPageRoute(
          builder: (_) => const LoginScreen(),
          settings: settings,
        );
    }
  }

  /// Route student based on access level
  static Route<dynamic> _routeStudent(
    UserModel user,
    RouteSettings settings,
  ) {
    // Check if kid mode should be enabled
    if (KidModeProvider.shouldShowKidMode(user)) {
      return MaterialPageRoute(
        builder: (_) => const KidHomeScreen(),
        settings: settings,
      );
    }

    final accessLevel = user.accessLevel ?? 'none';

    switch (accessLevel) {
      case 'full':
        // 9th-12th std: Full dashboard
        return MaterialPageRoute(
          builder: (_) => const DashboardScreen(),
          settings: settings,
        );

      case 'shared':
        // 6th-8th std: Shared access screen
        return MaterialPageRoute(
          builder: (_) => const DashboardScreen(), // Will be customized later
          settings: settings,
        );

      case 'teacher_led':
        // KG-5th: Should not reach here (they don't login)
        // But if they do, show kid mode
        return MaterialPageRoute(
          builder: (_) => const KidHomeScreen(),
          settings: settings,
        );

      default:
        return MaterialPageRoute(
          builder: (_) => const LoginScreen(),
          settings: settings,
        );
    }
  }

  /// Get initial route based on auth state
  static String getInitialRoute(AuthState authState) {
    if (!authState.isAuthenticated || authState.user == null) {
      return '/login';
    }

    final user = authState.user!;

    switch (user.role) {
      case 'admin':
        return '/admin';
      case 'teacher':
        return '/teacher';
      case 'student':
        final accessLevel = user.accessLevel ?? 'none';
        switch (accessLevel) {
          case 'full':
            return '/student';
          case 'shared':
            return '/student-shared';
          default:
            return '/login';
        }
      default:
        return '/login';
    }
  }

  /// Phase 3.4.6.2: Get initial screen widget based on auth state
  /// This is used for the home property in MaterialApp
  static Widget getInitialScreen(AuthState authState) {
    final user = authState.user;

    // Not authenticated - show login
    if (user == null || !authState.isAuthenticated) {
      return const LoginScreen();
    }

    // Route based on role
    switch (user.role) {
      case 'admin':
        return const DashboardScreen(); // Admin dashboard

      case 'teacher':
        return const TeacherDashboardScreen(); // Teacher dashboard

      case 'student':
        // Check if kid mode should be enabled
        if (KidModeProvider.shouldShowKidMode(user)) {
          return const KidHomeScreen();
        }

        final accessLevel = user.accessLevel ?? 'none';
        switch (accessLevel) {
          case 'full':
            // 9th-12th std: Full dashboard
            return const DashboardScreen();
          case 'shared':
            // 6th-8th std: Shared access screen
            return const DashboardScreen(); // Will be customized later
          case 'teacher_led':
            // KG-5th: Should not reach here, but show kid mode if they do
            return const KidHomeScreen();
          default:
            return const LoginScreen();
        }

      case 'parent':
        return const ParentDashboardScreen(); // Parent dashboard

      default:
        return const LoginScreen();
    }
  }
}
