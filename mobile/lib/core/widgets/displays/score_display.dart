/// Phase 101.2: Score Display Component
/// A styled score/points display widget

import 'package:flutter/material.dart';
import '../../design/design_system.dart';

/// Score Display - Display score/points with icon
class ScoreDisplay extends StatelessWidget {
  /// Score value
  final int score;

  /// Score label
  final String? label;

  /// Icon to display
  final IconData? icon;

  /// Icon color
  final Color? iconColor;

  /// Score color
  final Color? scoreColor;

  /// Display size
  final ScoreDisplaySize size;

  const ScoreDisplay({
    super.key,
    required this.score,
    this.label,
    this.icon,
    this.iconColor,
    this.scoreColor,
    this.size = ScoreDisplaySize.medium,
  });

  @override
  Widget build(BuildContext context) {
    final scoreStyle = _getScoreStyle();
    final labelStyle = _getLabelStyle();
    final iconSize = _getIconSize();

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (icon != null) ...[
          Icon(
            icon,
            size: iconSize,
            color: iconColor ?? AppColors.accentYellow,
          ),
          SizedBox(width: AppSpacing.xs),
        ],
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              score.toString(),
              style: scoreStyle.copyWith(
                color: scoreColor ?? AppColors.textPrimary,
              ),
            ),
            if (label != null) ...[
              SizedBox(height: 2),
              Text(
                label!,
                style: labelStyle,
              ),
            ],
          ],
        ),
      ],
    );
  }

  TextStyle _getScoreStyle() {
    switch (size) {
      case ScoreDisplaySize.small:
        return AppTextStyles.displaySmall;
      case ScoreDisplaySize.medium:
        return AppTextStyles.displayMedium;
      case ScoreDisplaySize.large:
        return AppTextStyles.displayLarge;
    }
  }

  TextStyle _getLabelStyle() {
    switch (size) {
      case ScoreDisplaySize.small:
        return AppTextStyles.caption;
      case ScoreDisplaySize.medium:
        return AppTextStyles.bodySmall;
      case ScoreDisplaySize.large:
        return AppTextStyles.bodyMedium;
    }
  }

  double _getIconSize() {
    switch (size) {
      case ScoreDisplaySize.small:
        return 20;
      case ScoreDisplaySize.medium:
        return 28;
      case ScoreDisplaySize.large:
        return 36;
    }
  }
}

/// Score display size enum
enum ScoreDisplaySize {
  small,
  medium,
  large,
}

