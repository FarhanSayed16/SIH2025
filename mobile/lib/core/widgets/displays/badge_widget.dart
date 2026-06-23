/// Phase 101.2: Badge Widget Component
/// A badge/chip widget for labels and status indicators

import 'package:flutter/material.dart';
import '../../design/design_system.dart';

/// Badge type
enum BadgeType {
  primary,
  success,
  warning,
  error,
  info,
}

/// Badge Widget - Small badge/chip for labels
class BadgeWidget extends StatelessWidget {
  /// Badge text
  final String text;

  /// Badge type
  final BadgeType type;

  /// Custom color
  final Color? color;

  /// Custom text color
  final Color? textColor;

  /// Badge size
  final BadgeSize size;

  const BadgeWidget({
    super.key,
    required this.text,
    this.type = BadgeType.primary,
    this.color,
    this.textColor,
    this.size = BadgeSize.medium,
  });

  @override
  Widget build(BuildContext context) {
    final colors = _getColorsForType(type);
    final badgeColor = color ?? colors['background']!;
    final badgeTextColor = textColor ?? colors['text']!;
    final padding = _getPadding();
    final fontSize = _getFontSize();

    return Container(
      padding: padding,
      decoration: BoxDecoration(
        color: badgeColor,
        borderRadius: AppBorders.borderRadiusXs,
      ),
      child: Text(
        text,
        style: AppTextStyles.caption.copyWith(
          color: badgeTextColor,
          fontSize: fontSize,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  Map<String, Color> _getColorsForType(BadgeType type) {
    switch (type) {
      case BadgeType.primary:
        return {
          'background': AppColors.primaryGreenSubtle,
          'text': AppColors.primaryGreen,
        };
      case BadgeType.success:
        return {
          'background': AppColors.successBackground,
          'text': AppColors.success,
        };
      case BadgeType.warning:
        return {
          'background': AppColors.warningBackground,
          'text': AppColors.warning,
        };
      case BadgeType.error:
        return {
          'background': AppColors.errorBackground,
          'text': AppColors.error,
        };
      case BadgeType.info:
        return {
          'background': AppColors.infoBackground,
          'text': AppColors.info,
        };
    }
  }

  EdgeInsets _getPadding() {
    switch (size) {
      case BadgeSize.small:
        return const EdgeInsets.symmetric(horizontal: 6, vertical: 2);
      case BadgeSize.medium:
        return const EdgeInsets.symmetric(horizontal: 8, vertical: 4);
      case BadgeSize.large:
        return const EdgeInsets.symmetric(horizontal: 12, vertical: 6);
    }
  }

  double _getFontSize() {
    switch (size) {
      case BadgeSize.small:
        return 10;
      case BadgeSize.medium:
        return 12;
      case BadgeSize.large:
        return 14;
    }
  }
}

/// Badge size enum
enum BadgeSize {
  small,
  medium,
  large,
}

