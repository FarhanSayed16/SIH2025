/// Phase 101.2: Icon Display Component
/// A styled icon display widget

import 'package:flutter/material.dart';
import '../../design/design_system.dart';

/// Icon Display - Styled icon display with optional label
class IconDisplay extends StatelessWidget {
  /// Icon to display
  final IconData icon;

  /// Icon size
  final double size;

  /// Icon color
  final Color? color;

  /// Background color
  final Color? backgroundColor;

  /// Label text
  final String? label;

  /// Label position
  final IconLabelPosition labelPosition;

  /// Whether to show background circle
  final bool showBackground;

  const IconDisplay({
    super.key,
    required this.icon,
    this.size = 24,
    this.color,
    this.backgroundColor,
    this.label,
    this.labelPosition = IconLabelPosition.bottom,
    this.showBackground = false,
  });

  @override
  Widget build(BuildContext context) {
    final iconWidget = Icon(
      icon,
      size: size,
      color: color ?? AppColors.textPrimary,
    );

    final iconWithBackground = showBackground
        ? Container(
            width: size * 1.8,
            height: size * 1.8,
            decoration: BoxDecoration(
              color: backgroundColor ?? AppColors.backgroundLight,
              shape: BoxShape.circle,
            ),
            child: Center(child: iconWidget),
          )
        : iconWidget;

    if (label == null) {
      return iconWithBackground;
    }

    switch (labelPosition) {
      case IconLabelPosition.bottom:
        return Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            iconWithBackground,
            if (label != null) ...[
              SizedBox(height: AppSpacing.xs),
              Text(
                label!,
                style: AppTextStyles.bodySmall,
                textAlign: TextAlign.center,
              ),
            ],
          ],
        );
      case IconLabelPosition.right:
        return Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            iconWithBackground,
            if (label != null) ...[
              SizedBox(width: AppSpacing.xs),
              Text(label!, style: AppTextStyles.bodySmall),
            ],
          ],
        );
      case IconLabelPosition.top:
        return Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (label != null) ...[
              Text(
                label!,
                style: AppTextStyles.bodySmall,
                textAlign: TextAlign.center,
              ),
              SizedBox(height: AppSpacing.xs),
            ],
            iconWithBackground,
          ],
        );
      case IconLabelPosition.left:
        return Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (label != null) ...[
              Text(label!, style: AppTextStyles.bodySmall),
              SizedBox(width: AppSpacing.xs),
            ],
            iconWithBackground,
          ],
        );
    }
  }
}

/// Icon label position enum
enum IconLabelPosition {
  top,
  bottom,
  left,
  right,
}

