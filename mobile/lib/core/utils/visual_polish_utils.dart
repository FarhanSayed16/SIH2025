/// Phase 101.9.5: Visual Polish Utilities
/// Utilities for visual enhancements and polish

import 'package:flutter/material.dart';
import '../design/design_system.dart';

/// Visual polish utilities
class VisualPolishUtils {
  /// Get gradient background
  static LinearGradient getGradient({
    Color? startColor,
    Color? endColor,
    AlignmentGeometry begin = Alignment.topLeft,
    AlignmentGeometry end = Alignment.bottomRight,
  }) {
    return LinearGradient(
      begin: begin,
      end: end,
      colors: [
        startColor ?? AppColors.primaryGreen,
        endColor ?? AppColors.primaryGreen.withOpacity(0.7),
      ],
    );
  }

  /// Get elevation shadow
  static List<BoxShadow> getElevationShadow(int elevation) {
    switch (elevation) {
      case 1:
        return [
          BoxShadow(
            color: AppColors.shadow.withOpacity(0.1),
            blurRadius: 2,
            offset: const Offset(0, 1),
          ),
        ];
      case 2:
        return [
          BoxShadow(
            color: AppColors.shadow.withOpacity(0.15),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ];
      case 3:
        return [
          BoxShadow(
            color: AppColors.shadow.withOpacity(0.2),
            blurRadius: 8,
            offset: const Offset(0, 4),
          ),
        ];
      case 4:
        return [
          BoxShadow(
            color: AppColors.shadow.withOpacity(0.25),
            blurRadius: 12,
            offset: const Offset(0, 6),
          ),
        ];
      default:
        return [];
    }
  }

  /// Get shimmer gradient
  static LinearGradient getShimmerGradient({
    Color? baseColor,
    Color? highlightColor,
  }) {
    return LinearGradient(
      begin: Alignment(-1.0, -1.0),
      end: Alignment(1.0, 1.0),
      colors: [
        baseColor ?? AppColors.backgroundMedium,
        highlightColor ?? AppColors.backgroundLight,
        baseColor ?? AppColors.backgroundMedium,
      ],
      stops: const [0.0, 0.5, 1.0],
    );
  }

  /// Get image placeholder
  static Widget getImagePlaceholder({
    IconData icon = Icons.image,
    double size = 100,
    Color? color,
  }) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: color ?? AppColors.backgroundMedium,
        borderRadius: AppBorders.borderRadiusMd,
      ),
      child: Icon(
        icon,
        size: size * 0.4,
        color: AppColors.textSecondary,
      ),
    );
  }

  /// Add subtle border glow effect
  static BoxDecoration getGlowBorder({
    required Color color,
    double width = 2,
    double blurRadius = 8,
  }) {
    return BoxDecoration(
      borderRadius: AppBorders.borderRadiusMd,
      border: Border.all(
        color: color,
        width: width,
      ),
      boxShadow: [
        BoxShadow(
          color: color.withOpacity(0.3),
          blurRadius: blurRadius,
          spreadRadius: 1,
        ),
      ],
    );
  }
}

