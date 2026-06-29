import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/providers/access_level_provider.dart';
import '../../auth/providers/auth_provider.dart';
// Redirect to ModuleScreenFile
import '../../../../screens/module_screen_file.dart';

/// Learn Screen - Redirects to ModuleScreenFile
class LearnScreen extends ConsumerWidget {
  const LearnScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Phase 3.4.6.4: Feature gating - check access level
    final authState = ref.watch(authProvider);
    final user = authState.user;

    // Check if user has access to modules
    if (user != null && user.role == 'student') {
      final canAccessModules =
          AccessLevelProvider.canAccessFeature(user, 'modules');
      if (!canAccessModules) {
        return Scaffold(
          appBar: AppBar(
            title: const Text('Learn'),
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

    // Redirect to ModuleScreenFile
    return const ModuleScreenFile();
  }
}
