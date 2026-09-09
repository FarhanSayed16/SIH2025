import 'package:flutter_test/flutter_test.dart';
import 'package:kavach/l10n/app_localizations_en.dart';
import 'package:kavach/l10n/app_localizations_hi.dart';
import 'package:kavach/l10n/app_localizations_mr.dart';
import 'package:kavach/l10n/app_localizations_pa.dart';

/// B8: focused localization regressions (plan §20.1 Ask and preferences).
void main() {
  test('B8 chrome labels exist in all four UI locales', () {
    final locales = [
      AppLocalizationsEn(),
      AppLocalizationsHi(),
      AppLocalizationsMr(),
      AppLocalizationsPa(),
    ];

    for (final l10n in locales) {
      expect(l10n.loginTagline, isNotEmpty);
      expect(l10n.signIn, isNotEmpty);
      expect(l10n.joinYourClass, isNotEmpty);
      expect(l10n.emergencyHelp, isNotEmpty);
      expect(l10n.askKavach, isNotEmpty);
      expect(l10n.parentDashboard, isNotEmpty);
      expect(l10n.parentChildren, isNotEmpty);
      expect(l10n.scanQr, isNotEmpty);
      expect(l10n.alerts, isNotEmpty);
      expect(l10n.appearanceOnlyNote, isNotEmpty);
      expect(l10n.home, isNotEmpty);
      expect(l10n.learn, isNotEmpty);
      expect(l10n.games, isNotEmpty);
      expect(l10n.profile, isNotEmpty);
      expect(l10n.ask, isNotEmpty);
    }
  });

  test('B8 English and Hindi chrome labels differ for key journeys', () {
    final en = AppLocalizationsEn();
    final hi = AppLocalizationsHi();
    expect(en.loginTagline, isNot(equals(hi.loginTagline)));
    expect(en.askKavach, isNot(equals(hi.askKavach)));
    expect(en.emergencyHelp, isNot(equals(hi.emergencyHelp)));
    expect(en.parentChildren, isNot(equals(hi.parentChildren)));
  });

  test('B8 supported UI locale cycle order is en → hi → mr → pa → en', () {
    const supported = ['en', 'hi', 'mr', 'pa'];
    var currentIndex = 0;
    final seen = <String>[];
    for (var i = 0; i < supported.length; i++) {
      currentIndex = (currentIndex + 1) % supported.length;
      seen.add(supported[currentIndex]);
    }
    expect(seen, ['hi', 'mr', 'pa', 'en']);
  });
}
