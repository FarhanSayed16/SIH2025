import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter/material.dart';
import '../services/storage_service.dart';
import '../constants/app_constants.dart';

/// Locale state
class LocaleState {
  final Locale locale;

  LocaleState(this.locale);

  LocaleState copyWith({Locale? locale}) {
    return LocaleState(locale ?? this.locale);
  }
}

/// Locale notifier
class LocaleNotifier extends StateNotifier<LocaleState> {
  final StorageService _storageService;

  LocaleNotifier(this._storageService) : super(LocaleState(const Locale('en'))) {
    _loadSavedLocale();
  }

  /// Load saved locale
  Future<void> _loadSavedLocale() async {
    try {
      final savedLocale = await _storageService.getFromBox(
        AppConstants.settingsBox,
        'locale',
      );
      if (savedLocale != null) {
        final localeCode = savedLocale.toString();
        state = LocaleState(Locale(localeCode));
      }
    } catch (e) {
      // Use default locale
    }
  }

  /// Set locale
  Future<void> setLocale(Locale locale) async {
    state = LocaleState(locale);
    await _storageService.storeInBox(
      AppConstants.settingsBox,
      'locale',
      locale.languageCode,
    );
  }

  /// Cycle through supported languages (en -> hi -> mr -> pa -> en)
  Future<void> cycleLocale() async {
    final currentCode = state.locale.languageCode;
    final supportedLanguages = ['en', 'hi', 'mr', 'pa'];
    final currentIndex = supportedLanguages.indexOf(currentCode);
    final nextIndex = (currentIndex + 1) % supportedLanguages.length;
    await setLocale(Locale(supportedLanguages[nextIndex]));
  }

  /// Toggle between English and Hindi (backward compatibility)
  Future<void> toggleLocale() async {
    final newLocale = state.locale.languageCode == 'en'
        ? const Locale('hi')
        : const Locale('en');
    await setLocale(newLocale);
  }
}

/// Locale provider
final localeProvider = StateNotifierProvider<LocaleNotifier, LocaleState>((ref) {
  final storageService = StorageService();
  return LocaleNotifier(storageService);
});

