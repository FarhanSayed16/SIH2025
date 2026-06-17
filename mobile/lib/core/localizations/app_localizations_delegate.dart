import 'package:flutter/material.dart';
import '../../l10n/app_localizations.dart';
import '../../l10n/app_localizations_en.dart';
import '../../l10n/app_localizations_hi.dart';
import '../../l10n/app_localizations_mr.dart';
import '../../l10n/app_localizations_pa.dart';

/// App Localizations Delegate
/// Phase 4.9: Enhanced to support English, Hindi, Marathi, and Punjabi
class AppLocalizationsDelegate extends LocalizationsDelegate<AppLocalizations> {
  const AppLocalizationsDelegate();

  @override
  bool isSupported(Locale locale) {
    return ['en', 'hi', 'mr', 'pa'].contains(locale.languageCode);
  }

  @override
  Future<AppLocalizations> load(Locale locale) async {
    switch (locale.languageCode) {
      case 'hi':
        return AppLocalizationsHi();
      case 'mr':
        return AppLocalizationsMr();
      case 'pa':
        return AppLocalizationsPa();
      case 'en':
      default:
        return AppLocalizationsEn();
    }
  }

  @override
  bool shouldReload(AppLocalizationsDelegate old) => false;
}

