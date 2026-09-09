import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/storage_service.dart';
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

/// Theme mode notifier — ordinary light/dark appearance (B9), not crisis.
class ThemeModeNotifier extends StateNotifier<AppThemeMode> {
  final StorageService _storageService;

  ThemeModeNotifier(this._storageService) : super(AppThemeMode.light) {
    _loadSaved();
  }

  Future<void> _loadSaved() async {
    try {
      final saved = await _storageService.getFromBox(
        AppConstants.settingsBox,
        'theme_mode',
      );
      if (saved == 'dark') {
        state = AppThemeMode.dark;
      }
    } catch (_) {}
  }

  Future<void> _persist(AppThemeMode mode) async {
    try {
      await _storageService.storeInBox(
        AppConstants.settingsBox,
        'theme_mode',
        mode == AppThemeMode.dark ? 'dark' : 'light',
      );
    } catch (_) {}
  }

  void setLight() {
    state = AppThemeMode.light;
    unawaited(_persist(state));
  }

  void setDark() {
    state = AppThemeMode.dark;
    unawaited(_persist(state));
  }

  void toggle() {
    state =
        state == AppThemeMode.light ? AppThemeMode.dark : AppThemeMode.light;
    unawaited(_persist(state));
  }
}

/// Providers
final appModeProvider = StateNotifierProvider<AppModeNotifier, AppMode>((ref) {
  return AppModeNotifier();
});

final themeModeProvider =
    StateNotifierProvider<ThemeModeNotifier, AppThemeMode>((ref) {
  return ThemeModeNotifier(StorageService());
});
