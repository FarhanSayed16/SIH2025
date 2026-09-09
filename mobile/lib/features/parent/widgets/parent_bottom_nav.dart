import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/design/design_system.dart';
import '../../../l10n/app_localizations.dart';
import '../screens/parent_shell_screen.dart';
import '../screens/qr_verification_screen.dart';
import '../screens/notifications_screen.dart';
import '../providers/parent_provider.dart';

class ParentBottomNav extends ConsumerWidget {
  final int currentIndex;
  final void Function(int) onTap;

  const ParentBottomNav({
    super.key,
    required this.currentIndex,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final unreadCount = ref.watch(unreadNotificationsCountProvider);
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final navTheme = theme.bottomNavigationBarTheme;
    final l10n = AppLocalizations.of(context);

    return BottomNavigationBar(
      currentIndex: currentIndex,
      onTap: onTap,
      type: BottomNavigationBarType.fixed,
      backgroundColor: navTheme.backgroundColor ?? colorScheme.surface,
      selectedItemColor: navTheme.selectedItemColor ?? colorScheme.primary,
      unselectedItemColor:
          navTheme.unselectedItemColor ?? colorScheme.onSurfaceVariant,
      selectedLabelStyle: AppTextStyles.caption.copyWith(
        fontWeight: FontWeight.bold,
      ),
      unselectedLabelStyle: AppTextStyles.caption,
      items: [
        BottomNavigationBarItem(
          icon: const Icon(Icons.dashboard),
          label: l10n.parentDashboard,
        ),
        BottomNavigationBarItem(
          icon: const Icon(Icons.people),
          label: l10n.parentChildren,
        ),
        BottomNavigationBarItem(
          icon: const Icon(Icons.qr_code_scanner),
          label: l10n.scanQr,
        ),
        BottomNavigationBarItem(
          icon: Stack(
            clipBehavior: Clip.none,
            children: [
              const Icon(Icons.notifications),
              if ((unreadCount ?? 0) > 0)
                Positioned(
                  right: -2,
                  top: -2,
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: BoxDecoration(
                      color: colorScheme.error,
                      shape: BoxShape.circle,
                    ),
                    constraints: const BoxConstraints(
                      minWidth: 12,
                      minHeight: 12,
                    ),
                  ),
                ),
            ],
          ),
          label: l10n.alerts,
        ),
        BottomNavigationBarItem(
          icon: const Icon(Icons.person),
          label: l10n.profile,
        ),
      ],
    );
  }
}

class ParentNavigationHelper {
  static void navigateToDashboard(BuildContext context) {
    Navigator.pushReplacement<void, void>(
      context,
      MaterialPageRoute<void>(
        builder: (context) => const ParentShellScreen(),
      ),
    );
  }

  static void navigateToQRScanner(BuildContext context) {
    Navigator.push<void>(
      context,
      MaterialPageRoute<void>(
        builder: (context) => const QRVerificationScreen(),
      ),
    );
  }

  static void navigateToNotifications(BuildContext context) {
    Navigator.push<void>(
      context,
      MaterialPageRoute<void>(
        builder: (context) => const NotificationsScreen(),
      ),
    );
  }
}
