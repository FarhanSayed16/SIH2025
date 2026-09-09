import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../sync/providers/sync_provider.dart';
import '../../../core/design/design_system.dart';

/// Sync Indicator — learning queue only (B4 §8.4).
/// Does not claim crisis/mesh queues are delivered.
class SyncIndicator extends ConsumerWidget {
  const SyncIndicator({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final syncState = ref.watch(syncProvider);

    if (syncState.isSyncing) {
      return _chip(
        color: AppColors.info,
        label: 'Learning updates…',
        busy: true,
      );
    }

    if (syncState.pendingCount > 0) {
      return InkWell(
        onTap: () {
          ref.read(syncProvider.notifier).syncOfflineData();
        },
        borderRadius: BorderRadius.circular(20),
        child: _chip(
          color: AppColors.warning,
          icon: Icons.sync,
          label: 'Learning updates · ${syncState.pendingCount}',
        ),
      );
    }

    // A prior successful sync is not proof every queue is delivered — stay quiet.
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
