/// Phase 101.2: Progress Indicator Component
/// A styled progress indicator widget

import 'package:flutter/material.dart';
import '../../design/design_system.dart';

/// Progress Indicator - Styled progress indicator
class ProgressIndicatorCustom extends StatelessWidget {
  /// Progress value (0.0 to 1.0)
  final double? value;

  /// Whether to show as linear (true) or circular (false)
  final bool isLinear;

  /// Progress color
  final Color? color;

  /// Background color
  final Color? backgroundColor;

  /// Label text
  final String? label;

  /// Show percentage
  final bool showPercentage;

  /// Height (for linear)
  final double? height;

  /// Size (for circular)
  final double? size;

  const ProgressIndicatorCustom({
    super.key,
    this.value,
    this.isLinear = true,
    this.color,
    this.backgroundColor,
    this.label,
    this.showPercentage = false,
    this.height,
    this.size,
  });

  @override
  Widget build(BuildContext context) {
    if (isLinear) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          if (label != null || showPercentage) ...[
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                if (label != null)
                  Text(label!, style: AppTextStyles.bodySmall),
                if (showPercentage && value != null)
                  Text(
                    '${(value! * 100).toInt()}%',
                    style: AppTextStyles.bodySmall.bold,
                  ),
              ],
            ),
            SizedBox(height: AppSpacing.xs),
          ],
          LinearProgressIndicator(
            value: value,
            backgroundColor: backgroundColor ?? AppColors.backgroundMedium,
            valueColor: AlwaysStoppedAnimation<Color>(
              color ?? AppColors.primaryGreen,
            ),
            minHeight: height ?? 8,
            borderRadius: AppBorders.borderRadiusXs,
          ),
        ],
      );
    } else {
      return Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          SizedBox(
            width: size ?? 48,
            height: size ?? 48,
            child: CircularProgressIndicator(
              value: value,
              backgroundColor: backgroundColor ?? AppColors.backgroundMedium,
              valueColor: AlwaysStoppedAnimation<Color>(
                color ?? AppColors.primaryGreen,
              ),
              strokeWidth: 4,
            ),
          ),
          if (label != null || showPercentage) ...[
            SizedBox(height: AppSpacing.xs),
            if (label != null)
              Text(label!, style: AppTextStyles.bodySmall),
            if (showPercentage && value != null)
              Text(
                '${(value! * 100).toInt()}%',
                style: AppTextStyles.bodySmall.bold,
              ),
          ],
        ],
      );
    }
  }
}

