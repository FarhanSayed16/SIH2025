import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../features/socket/providers/socket_provider.dart';
import '../../../features/mesh/providers/mesh_provider.dart';
import '../../../core/design/design_system.dart';

/// Connectivity Indicator — honest offline / mesh wording (B4 §8.4).
class ConnectivityIndicator extends ConsumerWidget {
  const ConnectivityIndicator({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final socketState = ref.watch(socketProvider);
    final meshActive = ref.watch(meshConnectivityProvider);

    if (socketState.isOffline) {
      final label = meshActive ? 'Offline · Mesh active' : 'Offline';
      return _chip(
        color: AppColors.error,
        icon: Icons.wifi_off,
        label: label,
      );
    }

    if (socketState.isConnecting) {
      return _chip(
        color: AppColors.warning,
        icon: null,
        label: 'Connecting…',
        busy: true,
      );
    }

    if (socketState.isConnected) {
      return _chip(
        color: AppColors.success,
        icon: Icons.wifi,
        label: 'Online',
      );
    }

    return const SizedBox.shrink();
  }

  Widget _chip({
    required Color color,
    required String label,
    IconData? icon,
    bool busy = false,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (busy)
            const SizedBox(
              width: 12,
              height: 12,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
              ),
            )
          else if (icon != null)
            Icon(icon, color: Colors.white, size: 16),
          const SizedBox(width: 4),
          Text(
            label,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}
