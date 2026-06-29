import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/access_level_provider.dart';
import '../../../l10n/app_localizations.dart';
import '../../auth/providers/auth_provider.dart';
// Redirect to MainMenuScreen
import '../../../screens/main_menu_screen.dart';

/// Games Screen - Redirects to MainMenuScreen
class GamesScreen extends ConsumerWidget {
  const GamesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final authState = ref.watch(authProvider);
    final user = authState.user;

    // Phase 3.4.6.4: Feature gating - check access level
    if (user != null && user.role == 'student') {
      final canAccessGames =
          AccessLevelProvider.canAccessFeature(user, 'games');
      if (!canAccessGames) {
        return Scaffold(
          appBar: AppBar(
            title: Text(l10n.games),
            automaticallyImplyLeading: false,
          ),
          body: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.lock_outline, size: 80, color: Colors.grey[400]),
                const SizedBox(height: 16),
                Text(
                  'Access Restricted',
                  style: Theme.of(context).textTheme.headlineSmall,
                ),
                const SizedBox(height: 8),
                Text(
                  'This feature is not available for your access level',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Colors.grey[600],
                      ),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        );
      }
    }

    // Redirect to MainMenuScreen
    return const MainMenuScreen();
  }
}
