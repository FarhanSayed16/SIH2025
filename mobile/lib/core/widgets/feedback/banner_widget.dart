/// Phase 101.2: Banner Widget Component
/// A styled banner widget for notifications

import 'package:flutter/material.dart';
import '../../design/design_system.dart';

/// Banner type
enum BannerType {
  info,
  success,
  warning,
  error,
}

/// Banner Widget - Banner notification display
class BannerWidget extends StatelessWidget {
  /// Banner message
  final String message;

  /// Banner title (optional)
  final String? title;

  /// Banner type
  final BannerType type;

  /// Callback when dismissed
  final VoidCallback? onDismiss;

  /// Leading icon (optional)
  final IconData? icon;

  /// Action button label
  final String? actionLabel;

  /// Action callback
  final VoidCallback? onAction;

  const BannerWidget({
    super.key,
    required this.message,
    this.title,
    this.type = BannerType.info,
    this.onDismiss,
    this.icon,
    this.actionLabel,
    this.onAction,
  });

  @override
  Widget build(BuildContext context) {
    final colors = _getColorsForType(type);
    final bannerIcon = icon ?? _getIconForType(type);

    return Container(
      width: double.infinity,
      padding: AppSpacing.card,
      decoration: BoxDecoration(
        color: colors['background'],
        border: Border(
          left: BorderSide(
            color: colors['border']!,
            width: 4,
          ),
        ),
      ),
      child: Row(
        children: [
          Icon(bannerIcon, color: colors['icon'], size: 24),
          SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                if (title != null) ...[
                  Text(
                    title!,
                    style: AppTextStyles.h5.copyWith(
                      color: colors['text'],
                    ),
                  ),
                  SizedBox(height: AppSpacing.xs),
                ],
                Text(
                  message,
                  style: AppTextStyles.bodyMedium.copyWith(
                    color: colors['text'],
                  ),
                ),
                if (actionLabel != null && onAction != null) ...[
                  SizedBox(height: AppSpacing.sm),
                  TextButton(
                    onPressed: onAction,
                    child: Text(
                      actionLabel!,
                      style: AppTextStyles.buttonSmall.copyWith(
                        color: colors['icon'],
                      ),
                    ),
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
    );
  }

  Map<String, Color> _getColorsForType(BannerType type) {
    switch (type) {
      case BannerType.info:
        return {
          'background': AppColors.infoBackground,
          'border': AppColors.info,
          'icon': AppColors.info,
          'text': AppColors.textPrimary,
        };
      case BannerType.success:
        return {
          'background': AppColors.successBackground,
          'border': AppColors.success,
          'icon': AppColors.success,
          'text': AppColors.textPrimary,
        };
      case BannerType.warning:
        return {
          'background': AppColors.warningBackground,
          'border': AppColors.warning,
          'icon': AppColors.warning,
          'text': AppColors.textPrimary,
        };
      case BannerType.error:
        return {
          'background': AppColors.errorBackground,
          'border': AppColors.error,
          'icon': AppColors.error,
          'text': AppColors.textPrimary,
        };
    }
  }

  IconData _getIconForType(BannerType type) {
    switch (type) {
      case BannerType.info:
        return Icons.info_outline;
      case BannerType.success:
        return Icons.check_circle_outline;
      case BannerType.warning:
        return Icons.warning_amber_rounded;
      case BannerType.error:
        return Icons.error_outline;
    }
  }
}

