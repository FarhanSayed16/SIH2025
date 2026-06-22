/// Phase 101.2: Alert Card Component
/// A card for displaying alerts/warnings

import 'package:flutter/material.dart';
import '../../design/design_system.dart';

/// Alert type
enum AlertType {
  info,
  success,
  warning,
  error,
}

/// Alert Card - Card for displaying alerts
class AlertCard extends StatelessWidget {
  /// Alert title
  final String title;

  /// Alert message
  final String? message;

  /// Alert type
  final AlertType type;

  /// Leading icon (optional, defaults based on type)
  final IconData? icon;

  /// Callback when dismissed
  final VoidCallback? onDismiss;

  /// Custom padding
  final EdgeInsets? padding;

  const AlertCard({
    super.key,
    required this.title,
    this.message,
    this.type = AlertType.info,
    this.icon,
    this.onDismiss,
    this.padding,
  });

  @override
  Widget build(BuildContext context) {
    final colors = _getColorsForType(type);
    final defaultIcon = _getIconForType(type);
    final alertIcon = icon ?? defaultIcon;

    return Card(
      color: colors['background'],
      elevation: 2,
      shadowColor: AppColors.shadow,
      shape: RoundedRectangleBorder(
        borderRadius: AppBorders.borderRadiusMd,
        side: BorderSide(
          color: colors['border']!,
          width: AppBorders.borderWidthThin,
        ),
      ),
      child: Padding(
        padding: padding ?? AppSpacing.card,
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(
              alertIcon,
              size: 24,
              color: colors['icon'],
            ),
            SizedBox(width: AppSpacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    title,
                    style: AppTextStyles.h5.copyWith(
                      color: colors['text'],
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (message != null) ...[
                    SizedBox(height: AppSpacing.xs),
                    Text(
                      message!,
                      style: AppTextStyles.bodySmall.copyWith(
                        color: colors['text'],
                      ),
                      maxLines: 3,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ],
              ),
            ),
            if (onDismiss != null)
              IconButton(
                icon: Icon(Icons.close, size: 20),
                onPressed: onDismiss,
                color: colors['text'],
                padding: EdgeInsets.zero,
                constraints: BoxConstraints(),
              ),
          ],
        ),
      ),
    );
  }

  Map<String, Color> _getColorsForType(AlertType type) {
    switch (type) {
      case AlertType.info:
        return {
          'background': AppColors.infoBackground,
          'border': AppColors.info,
          'icon': AppColors.info,
          'text': AppColors.textPrimary,
        };
      case AlertType.success:
        return {
          'background': AppColors.successBackground,
          'border': AppColors.success,
          'icon': AppColors.success,
          'text': AppColors.textPrimary,
        };
      case AlertType.warning:
        return {
          'background': AppColors.warningBackground,
          'border': AppColors.warning,
          'icon': AppColors.warning,
          'text': AppColors.textPrimary,
        };
      case AlertType.error:
        return {
          'background': AppColors.errorBackground,
          'border': AppColors.error,
          'icon': AppColors.error,
          'text': AppColors.textPrimary,
        };
    }
  }

  IconData _getIconForType(AlertType type) {
    switch (type) {
      case AlertType.info:
        return Icons.info_outline;
      case AlertType.success:
        return Icons.check_circle_outline;
      case AlertType.warning:
        return Icons.warning_amber_rounded;
      case AlertType.error:
        return Icons.error_outline;
    }
  }
}

