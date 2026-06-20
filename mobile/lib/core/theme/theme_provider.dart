import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../constants/app_constants.dart';

/// App mode state (Peace or Crisis)
enum AppMode {
  peace,
  crisis,
}

/// Theme mode state (Light or Dark)
enum AppThemeMode {
  light,
  dark,
}

/// App mode notifier
class AppModeNotifier extends StateNotifier<AppMode> {
  AppModeNotifier() : super(AppMode.peace);

  void setPeaceMode() {
    state = AppMode.peace;
  }

  void setCrisisMode() {
    state = AppMode.crisis;
  }

  void toggle() {
    state = state == AppMode.peace ? AppMode.crisis : AppMode.peace;
  }

  bool get isCrisis => state == AppMode.crisis;
  bool get isPeace => state == AppMode.peace;
}

/// Theme mode notifier
class ThemeModeNotifier extends StateNotifier<AppThemeMode> {
  ThemeModeNotifier() : super(AppThemeMode.light);

  void setLight() {
    state = AppThemeMode.light;
  }

  void setDark() {
    state = AppThemeMode.dark;
  }

  void toggle() {
    state = state == AppThemeMode.light ? AppThemeMode.dark : AppThemeMode.light;
  }
}

/// Providers
final appModeProvider = StateNotifierProvider<AppModeNotifier, AppMode>((ref) {
  return AppModeNotifier();
});

final themeModeProvider = StateNotifierProvider<ThemeModeNotifier, AppThemeMode>((ref) {
  return ThemeModeNotifier();
});

