import 'package:flutter/material.dart';
import '../../../l10n/app_localizations.dart';

/// Bottom Navigation Bar Widget
/// Phase 3.4.6.4: All tabs shown, access control handled by screens
class BottomNavBar extends StatelessWidget {
  final int currentIndex;
  final Function(int) onTap;

  const BottomNavBar({
    super.key,
    required this.currentIndex,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    
    return BottomNavigationBar(
      currentIndex: currentIndex,
      onTap: onTap,
      type: BottomNavigationBarType.fixed,
      items: [
        BottomNavigationBarItem(
          icon: const Icon(Icons.home),
          label: l10n.home,
        ),
        BottomNavigationBarItem(
          icon: const Icon(Icons.school),
          label: l10n.learn,
        ),
        BottomNavigationBarItem(
          icon: const Icon(Icons.games),
          label: l10n.games,
        ),
        BottomNavigationBarItem(
          icon: const Icon(Icons.person),
          label: l10n.profile,
        ),
      ],
    );
  }
}

