import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/constants/app_constants.dart';
import '../providers/device_mode_provider.dart';
import '../../qr/screens/qr_scanner_screen.dart';

/// Class Device Mode Screen
/// Phase 2.5: K-12 Multi-Access
/// For school-owned tablets in classroom mode
class ClassDeviceModeScreen extends ConsumerWidget {
  const ClassDeviceModeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final deviceState = ref.watch(deviceModeProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Class Device Mode'),
        elevation: 0,
      ),
      body: deviceState.isLoading
          ? const Center(child: CircularProgressIndicator())
          : deviceState.selectedClass == null
              ? _buildClassSelection(context, ref, deviceState)
              : _buildClassMode(context, ref, deviceState),
    );
  }

  Widget _buildClassSelection(
    BuildContext context,
    WidgetRef ref,
    DeviceModeState state,
  ) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.tablet,
              size: 100,
              color: Colors.green,
            ),
            const SizedBox(height: 24),
            const Text(
              'Select Class',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              'This device is in class mode. Please select a class to continue.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 16,
                color: Colors.grey,
              ),
            ),
            const SizedBox(height: 32),
            ElevatedButton.icon(
              onPressed: () {
                // Show class selection dialog
                // For now, just show a placeholder
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Class selection coming soon'),
                  ),
                );
              },
              icon: const Icon(Icons.school),
              label: const Text('Select Class'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildClassMode(
    BuildContext context,
    WidgetRef ref,
    DeviceModeState state,
  ) {
    final classData = state.selectedClass!;
    final grade = classData['grade'] as String? ?? '';
    final section = classData['section'] as String? ?? '';

    return Column(
      children: [
        // Class Header
        Container(
          padding: const EdgeInsets.all(16),
          color: Theme.of(context).colorScheme.primaryContainer,
          child: Row(
            children: [
              CircleAvatar(
                backgroundColor: Theme.of(context).colorScheme.primary,
                child: Text(
                  '$grade-$section',
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Grade $grade - Section $section',
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Text(
                      'Class Device Mode',
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey[600],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        // Quick Actions
        Expanded(
          child: GridView.count(
            crossAxisCount: 2,
            padding: const EdgeInsets.all(16),
            crossAxisSpacing: 16,
            mainAxisSpacing: 16,
            children: [
              _buildActionCard(
                context,
                icon: Icons.qr_code_scanner,
                title: 'Scan QR',
                color: Colors.blue,
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => QRScannerScreen(
                        title: 'Scan Student QR',
                        onQRScanned: (qrCode) {
                          // Handle QR scan
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text('QR Scanned: $qrCode'),
                            ),
                          );
                        },
                      ),
                    ),
                  );
                },
              ),
              _buildActionCard(
                context,
                icon: Icons.people,
                title: 'Group Activity',
                color: Colors.green,
                onTap: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Group activity coming soon'),
                    ),
                  );
                },
              ),
              _buildActionCard(
                context,
                icon: Icons.tv,
                title: 'Projector Mode',
                color: Colors.orange,
                onTap: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Projector mode coming soon'),
                    ),
                  );
                },
              ),
              _buildActionCard(
                context,
                icon: Icons.school,
                title: 'Class Info',
                color: Colors.purple,
                onTap: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Class info coming soon'),
                    ),
                  );
                },
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildActionCard(
    BuildContext context, {
    required IconData icon,
    required String title,
    required Color color,
    required VoidCallback onTap,
  }) {
    return Card(
      elevation: 2,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 48, color: color),
            const SizedBox(height: 12),
            Text(
              title,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      ),
    );
  }
}


