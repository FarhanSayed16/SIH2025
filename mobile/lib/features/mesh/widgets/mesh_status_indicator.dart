/// Phase 5.2: Mesh Status Indicator Widget
/// Displays mesh networking status, peer count, and bridge mode

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/mesh_provider.dart';
import '../services/battery_aware_mesh_manager.dart';
import '../services/mesh_service.dart';

/// Mesh Status Indicator Widget - Phase 5.2
/// Shows mesh networking status, peer count, bridge mode, and battery mode
class MeshStatusIndicator extends ConsumerWidget {
  final bool showDetails;
  final EdgeInsets? margin;

  const MeshStatusIndicator({
    super.key,
    this.showDetails = false,
    this.margin,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final meshService = ref.watch(meshServiceProvider);
    final isActive = ref.watch(meshConnectivityProvider);
    
    // Phase 5.2: Watch bridge mode status (if available)
    const isBridgeMode = false; // TODO: Add bridge mode provider
    
    // Phase 5.2: Watch battery mode (if available)
    const batteryMode = DutyCycleMode.lowAlert; // TODO: Add battery mode provider
    
    final peerCount = meshService.connectedPeerCount;

    if (!isActive && peerCount == 0) {
      return const SizedBox.shrink(); // Hide when not active
    }

    return Container(
      margin: margin ?? const EdgeInsets.all(8.0),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: _getStatusColor(isActive, isBridgeMode, batteryMode),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            _getStatusIcon(isActive, isBridgeMode),
            size: 16,
            color: Colors.white,
          ),
          const SizedBox(width: 8),
          Text(
            _getStatusText(isActive, isBridgeMode, peerCount),
            style: const TextStyle(
              color: Colors.white,
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
          if (showDetails) ...[
            const SizedBox(width: 8),
            _buildDetailsBadge(context, meshService, batteryMode),
          ],
        ],
      ),
    );
  }

  Widget _buildDetailsBadge(
    BuildContext context,
    MeshService meshService,
    DutyCycleMode batteryMode,
  ) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.2),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Text(
        '${meshService.connectedPeerCount}P',
        style: const TextStyle(
          color: Colors.white,
          fontSize: 10,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  Color _getStatusColor(bool isActive, bool isBridgeMode, DutyCycleMode batteryMode) {
    if (isBridgeMode) {
      return Colors.purple; // Bridge mode
    }
    
    switch (batteryMode) {
      case DutyCycleMode.highAlert:
        return Colors.red; // High alert - continuous
      case DutyCycleMode.lowAlert:
        return isActive ? Colors.orange : Colors.grey; // Peace mode
      case DutyCycleMode.batterySaver:
        return Colors.amber; // Battery saver
    }
  }

  IconData _getStatusIcon(bool isActive, bool isBridgeMode) {
    if (isBridgeMode) {
      return Icons.swap_horiz; // Bridge mode icon
    }
    if (isActive) {
      return Icons.bluetooth_connected;
    }
    return Icons.bluetooth_disabled;
  }

  String _getStatusText(bool isActive, bool isBridgeMode, int peerCount) {
    if (isBridgeMode) {
      return 'Bridge Mode Active';
    }
    if (isActive) {
      return 'Mesh: $peerCount peer${peerCount != 1 ? 's' : ''}';
    }
    return 'Mesh Offline';
  }
}

/// Compact Mesh Status Badge (for app bars, etc.)
class MeshStatusBadge extends StatelessWidget {
  final int peerCount;
  final bool isActive;

  const MeshStatusBadge({
    super.key,
    required this.peerCount,
    required this.isActive,
  });

  @override
  Widget build(BuildContext context) {
    if (!isActive) {
      return const SizedBox.shrink();
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.orange,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.bluetooth_connected, size: 14, color: Colors.white),
          const SizedBox(width: 4),
          Text(
            '$peerCount',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 12,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }
}

/// Mesh Status Banner (full-width for important alerts)
class MeshStatusBanner extends ConsumerWidget {
  const MeshStatusBanner({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isActive = ref.watch(meshConnectivityProvider);
    final meshService = ref.watch(meshServiceProvider);

    if (!isActive) {
      return const SizedBox.shrink();
    }

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      color: Colors.orange.withOpacity(0.9),
      child: Row(
        children: [
          const Icon(Icons.bluetooth_connected, color: Colors.white),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text(
                  'Offline Mesh Active',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  'Connected to ${meshService.connectedPeerCount} peer${meshService.connectedPeerCount != 1 ? 's' : ''}',
                  style: const TextStyle(
                    color: Colors.white70,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

