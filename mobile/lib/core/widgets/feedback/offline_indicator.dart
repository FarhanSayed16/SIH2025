/// Phase 101.9.4: Offline Indicator Widget
/// Shows offline status and sync information

import 'package:flutter/material.dart';
import '../../design/design_system.dart';

/// Offline Indicator - Banner showing offline status
class OfflineIndicator extends StatelessWidget {
  /// Whether device is offline
  final bool isOffline;

  /// Sync status message (optional)
  final String? syncStatus;

  /// Whether to show as banner at top
  final bool showAsBanner;

  const OfflineIndicator({
    super.key,
    required this.isOffline,
    this.syncStatus,
    this.showAsBanner = true,
  });

  @override
  Widget build(BuildContext context) {
    if (!isOffline) {
      return const SizedBox.shrink();
    }

    final widget = Container(
      width: double.infinity,
      padding: AppSpacing.card,
      decoration: BoxDecoration(
        color: AppColors.warningBackground,
        border: Border(
          bottom: BorderSide(
            color: AppColors.warning,
            width: 2,
          ),
        ),
      ),
      child: Row(
        children: [
          Icon(
            Icons.wifi_off,
            color: AppColors.warning,
            size: 20,
          ),
          SizedBox(width: AppSpacing.sm),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'You\'re offline',
                  style: AppTextStyles.bodyMedium.copyWith(
                    color: AppColors.warning,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                if (syncStatus != null) ...[
                  SizedBox(height: AppSpacing.xs),
                  Text(
                    syncStatus!,
                    style: AppTextStyles.bodySmall.copyWith(
                      color: AppColors.warning,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );

    if (showAsBanner) {
      return widget;
    }

    return widget;
  }
}

