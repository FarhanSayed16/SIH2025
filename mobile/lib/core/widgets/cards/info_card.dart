/// Phase 101.2: Info Card Component
/// A card for displaying information

import 'package:flutter/material.dart';
import '../../design/design_system.dart';

/// Info Card - Card for displaying information
class InfoCard extends StatelessWidget {
  /// Card title
  final String? title;

  /// Card content
  final Widget? content;

  /// Card subtitle
  final String? subtitle;

  /// Leading icon
  final IconData? leadingIcon;

  /// Trailing icon
  final IconData? trailingIcon;

  /// Callback when trailing icon is pressed
  final VoidCallback? onTrailingPressed;

  /// Custom padding
  final EdgeInsets? padding;

  /// Whether card is clickable
  final bool clickable;

  /// Callback when card is tapped
  final VoidCallback? onTap;

  /// Background color
  final Color? backgroundColor;

  const InfoCard({
    super.key,
    this.title,
    this.content,
    this.subtitle,
    this.leadingIcon,
    this.trailingIcon,
    this.onTrailingPressed,
    this.padding,
    this.clickable = false,
    this.onTap,
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
        onTap: clickable ? onTap : null,
        borderRadius: AppBorders.borderRadiusMd,
        child: Padding(
          padding: padding ?? AppSpacing.card,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              if (title != null || leadingIcon != null || trailingIcon != null)
                Row(
                  children: [
                    if (leadingIcon != null) ...[
                      Icon(
                        leadingIcon,
                        size: 24,
                        color: AppColors.primaryGreen,
                      ),
                      SizedBox(width: AppSpacing.sm),
                    ],
                    if (title != null)
                      Expanded(
                        child: Text(
                          title!,
                          style: AppTextStyles.h4,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    if (trailingIcon != null)
                      IconButton(
                        icon: Icon(trailingIcon),
                        onPressed: onTrailingPressed,
                        iconSize: 20,
                        color: AppColors.textSecondary,
                      ),
                  ],
                ),
              if (subtitle != null) ...[
                if (title != null) SizedBox(height: AppSpacing.xs),
                Text(
                  subtitle!,
                  style: AppTextStyles.bodySmall,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
              if (content != null) ...[
                if (title != null || subtitle != null)
                  SizedBox(height: AppSpacing.sm),
                content!,
              ],
            ],
          ),
        ),
      ),
    );
  }
}

