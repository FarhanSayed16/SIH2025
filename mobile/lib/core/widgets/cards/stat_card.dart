/// Phase 101.2: Stat Card Component
/// A card for displaying statistics/numbers

import 'package:flutter/material.dart';
import '../../design/design_system.dart';

/// Stat Card - Card for displaying statistics
class StatCard extends StatelessWidget {
  /// Stat value (number or text)
  final String value;

  /// Stat label
  final String label;

  /// Stat icon
  final IconData? icon;

  /// Icon color
  final Color? iconColor;

  /// Value color
  final Color? valueColor;

  /// Background color
  final Color? backgroundColor;

  /// Custom padding
  final EdgeInsets? padding;

  /// Whether card is clickable
  final bool clickable;

  /// Callback when card is tapped
  final VoidCallback? onTap;

  const StatCard({
    super.key,
    required this.value,
    required this.label,
    this.icon,
    this.iconColor,
    this.valueColor,
    this.backgroundColor,
    this.padding,
    this.clickable = false,
    this.onTap,
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
              if (icon != null) ...[
                Icon(
                  icon,
                  size: 28,
                  color: iconColor ?? AppColors.primaryGreen,
                ),
                SizedBox(height: AppSpacing.sm),
              ],
              Text(
                value,
                style: AppTextStyles.displayMedium.copyWith(
                  color: valueColor ?? AppColors.textPrimary,
                  fontWeight: FontWeight.bold,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              SizedBox(height: AppSpacing.xs),
              Text(
                label,
                style: AppTextStyles.bodySmall,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

