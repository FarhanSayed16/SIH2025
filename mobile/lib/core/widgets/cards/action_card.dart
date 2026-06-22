/// Phase 101.2: Action Card Component
/// A clickable card with action indication

import 'package:flutter/material.dart';
import '../../design/design_system.dart';

/// Action Card - Clickable card for actions
class ActionCard extends StatelessWidget {
  /// Card title
  final String title;

  /// Card subtitle/description
  final String? subtitle;

  /// Leading icon
  final IconData? leadingIcon;

  /// Trailing icon (default: chevron_right)
  final IconData trailingIcon;

  /// Trailing icon color
  final Color? trailingIconColor;

  /// Callback when card is tapped
  final VoidCallback? onTap;

  /// Custom padding
  final EdgeInsets? padding;

  /// Background color
  final Color? backgroundColor;

  const ActionCard({
    super.key,
    required this.title,
    this.subtitle,
    this.leadingIcon,
    this.trailingIcon = Icons.chevron_right,
    this.trailingIconColor,
    this.onTap,
    this.padding,
    this.backgroundColor,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      color: backgroundColor ?? AppColors.backgroundWhite,
      elevation: 2,
      shadowColor: AppColors.shadow,
      shape: RoundedRectangleBorder(
        borderRadius: AppBorders.borderRadiusMd,
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: AppBorders.borderRadiusMd,
        child: Padding(
          padding: padding ?? AppSpacing.card,
          child: Row(
            children: [
              if (leadingIcon != null) ...[
                Icon(
                  leadingIcon,
                  size: 28,
                  color: AppColors.primaryGreen,
                ),
                SizedBox(width: AppSpacing.md),
              ],
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      title,
                      style: AppTextStyles.h5,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    if (subtitle != null) ...[
                      SizedBox(height: AppSpacing.xs),
                      Text(
                        subtitle!,
                        style: AppTextStyles.bodySmall,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ],
                ),
              ),
              Icon(
                trailingIcon,
                size: 24,
                color: trailingIconColor ?? AppColors.textSecondary,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

