/// Phase 101.2: Chip Widget Component
/// A chip widget for tags and filters

import 'package:flutter/material.dart';
import '../../design/design_system.dart';

/// Chip Widget - Filter/tag chip widget
class ChipWidget extends StatelessWidget {
  /// Chip label
  final String label;

  /// Whether chip is selected
  final bool isSelected;

  /// Callback when chip is tapped
  final VoidCallback? onTap;

  /// Callback when chip is deleted
  final VoidCallback? onDeleted;

  /// Leading icon
  final IconData? icon;

  /// Custom color
  final Color? color;

  const ChipWidget({
    super.key,
    required this.label,
    this.isSelected = false,
    this.onTap,
    this.onDeleted,
    this.icon,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    return FilterChip(
      label: Text(label, style: AppTextStyles.bodySmall),
      selected: isSelected,
      onSelected: onTap != null ? (_) => onTap!() : null,
      deleteIcon: onDeleted != null
          ? Icon(Icons.close, size: 18, color: AppColors.textSecondary)
          : null,
      onDeleted: onDeleted,
      avatar: icon != null
          ? Icon(icon, size: 16, color: isSelected ? AppColors.textWhite : AppColors.textSecondary)
          : null,
      selectedColor: color ?? AppColors.primaryGreen,
      checkmarkColor: AppColors.textWhite,
      labelStyle: AppTextStyles.bodySmall.copyWith(
        color: isSelected ? AppColors.textWhite : AppColors.textPrimary,
      ),
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      shape: RoundedRectangleBorder(
        borderRadius: AppBorders.borderRadiusSm,
      ),
    );
  }
}

