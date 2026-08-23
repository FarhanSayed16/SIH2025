import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/theme/theme_provider.dart';
import '../../../../core/services/storage_service.dart';
import '../../../../l10n/app_localizations.dart';
import '../../auth/providers/auth_provider.dart';
import '../../sync/providers/sync_provider.dart';
import '../../iot/screens/iot_device_list_screen.dart';
import '../../mesh/screens/mesh_test_screen.dart'; // Phase 5.1

/// Developer Menu - Hidden menu for testing and demos
class DeveloperMenu extends ConsumerWidget {
  const DeveloperMenu({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final appMode = ref.watch(appModeProvider);
    final authState = ref.watch(authProvider);
    final user = authState.user;
    final l10n = AppLocalizations.of(context);

    return Container(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
              Row(
            children: [
              Icon(Icons.developer_mode, color: Colors.orange),
              const SizedBox(width: 8),
              Text(
                l10n.developerMenu,
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          const Divider(),
          const SizedBox(height: 16),

          // Force Crisis Mode Toggle
          SwitchListTile(
            title: Text(l10n.forceCrisisMode),
            subtitle: Text('${l10n.crisisMode}...'),
            value: appMode == AppMode.crisis,
            onChanged: (value) {
              if (value) {
                ref.read(appModeProvider.notifier).setCrisisMode();
              } else {
                ref.read(appModeProvider.notifier).setPeaceMode();
              }
            },
          ),

          // Clear Local Storage
          ListTile(
            leading: const Icon(Icons.delete_outline),
            title: Text(l10n.clearLocalStorage),
            subtitle: const Text('Clear all cached data'),
            onTap: () async {
              final confirmed = await showDialog<bool>(
                context: context,
                builder: (context) => AlertDialog(
                  title: Text(l10n.clearLocalStorage),
                  content: const Text('This will clear all local data. Continue?'),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.pop(context, false),
                      child: Text(l10n.cancel),
                    ),
                    TextButton(
                      onPressed: () => Navigator.pop(context, true),
                      child: const Text('Clear'),
                    ),
                  ],
                ),
              );

              if (confirmed == true) {
                final storageService = StorageService();
                await storageService.clearSecureStorage();
                await storageService.clearBox(AppConstants.cacheBox);
                await storageService.clearBox(AppConstants.modulesBox);
                await storageService.clearBox(AppConstants.drillLogsBox);
                await storageService.clearBox(AppConstants.quizResultsBox);

                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Local storage cleared')),
                  );
                  Navigator.pop(context);
                }
              }
            },
          ),

          // Switch Role
          if (user != null)
            ListTile(
              leading: const Icon(Icons.swap_horiz),
              title: Text(l10n.switchRole),
              subtitle: Text('${l10n.role}: ${user.role}'),
              onTap: () {
                _showRoleSwitcher(context, ref, user.role);
              },
            ),

          // Inject Mock Data
          ListTile(
            leading: const Icon(Icons.data_object),
            title: Text(l10n.injectMockData),
            subtitle: const Text('Load demo data for testing'),
            onTap: () async {
              try {
                await ref.read(syncProvider.notifier).injectMockData();
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Mock data injected successfully'),
                      backgroundColor: Colors.green,
                    ),
                  );
                }
              } catch (e) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Failed to inject mock data: $e'),
                      backgroundColor: Colors.red,
                    ),
                  );
                }
              }
            },
          ),

          // Phase 5.1: Mesh Networking Test
          ListTile(
            leading: const Icon(Icons.bluetooth),
            title: const Text('Mesh Networking Test'),
            subtitle: const Text('Test P2P connections (Phase 5.1)'),
            onTap: () {
              Navigator.pop(context); // Close developer menu first
              Navigator.push(
                context,
                MaterialPageRoute<dynamic>(
                  builder: (context) => const MeshTestScreen(),
                ),
              );
            },
          ),

          // Phase 3.4.2: IoT Device List - Phase 3.4.6.5: Add navigation link
          ListTile(
            leading: const Icon(Icons.sensors),
            title: const Text('IoT Devices'),
            subtitle: const Text('View IoT sensor devices'),
            onTap: () {
              Navigator.pop(context); // Close developer menu first
              Navigator.push(
                context,
                MaterialPageRoute<dynamic>(
                  builder: (context) => const IoTDeviceListScreen(),
                ),
              );
            },
          ),

          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text(l10n.close),
            ),
          ),
        ],
      ),
    );
  }

  void _showRoleSwitcher(BuildContext context, WidgetRef ref, String currentRole) {
    final l10n = AppLocalizations.of(context);
    
    showDialog<void>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(l10n.switchRole),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              title: const Text('Student'),
              leading: const Icon(Icons.school),
              onTap: () {
                // TODO: Implement role switching (requires backend support)
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Role switching requires backend support')),
                );
              },
            ),
            ListTile(
              title: const Text('Teacher'),
              leading: const Icon(Icons.person),
              onTap: () {
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Role switching requires backend support')),
                );
              },
            ),
            ListTile(
              title: const Text('Admin'),
              leading: const Icon(Icons.admin_panel_settings),
              onTap: () {
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Role switching requires backend support')),
                );
              },
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(l10n.cancel),
          ),
        ],
      ),
    );
  }
}

