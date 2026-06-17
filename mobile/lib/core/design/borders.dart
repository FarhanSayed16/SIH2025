/// Phase 101.1: Border Radius & Shadow System
/// Comprehensive border radius and shadow definitions for EduSafe mobile app
/// 
/// This file defines all border radius values and shadow styles used throughout
/// the app, ensuring consistent rounded corners and elevation effects.

import 'package:flutter/material.dart';
import 'colors.dart';

/// App Borders
/// Centralized border radius and border style definitions
class AppBorders {
  AppBorders._(); // Private constructor to prevent instantiation

  // ============================================================================
  // BORDER RADIUS VALUES
  // ============================================================================

  /// Extra Small Radius - 4px
  /// Use for: Small badges, Tiny elements
  static const double radiusXs = 4.0;

  /// Small Radius - 8px
  /// Use for: Buttons, Small cards, Input fields
  static const double radiusSm = 8.0;

  /// Medium Radius - 12px
  /// Use for: Standard cards, Containers
  static const double radiusMd = 12.0;

  /// Large Radius - 16px
  /// Use for: Large cards, Featured sections
  static const double radiusLg = 16.0;

  /// Extra Large Radius - 20px
  /// Use for: Prominent cards, Hero sections
  static const double radiusXl = 20.0;

  /// Extra Extra Large Radius - 24px
  /// Use for: Very large cards, Special sections
  static const double radiusXxl = 24.0;

  /// Round - Fully rounded (50% of height)
  /// Use for: Pills, Avatar images, Circular buttons
  static double radiusRound(double size) => size / 2;

  // ============================================================================
  // BORDER RADIUS OBJECTS
  // ============================================================================

  /// Border Radius Extra Small
  static const BorderRadius borderRadiusXs = BorderRadius.all(Radius.circular(radiusXs));

  /// Border Radius Small
  static const BorderRadius borderRadiusSm = BorderRadius.all(Radius.circular(radiusSm));

  /// Border Radius Medium
  static const BorderRadius borderRadiusMd = BorderRadius.all(Radius.circular(radiusMd));

  /// Border Radius Large
  static const BorderRadius borderRadiusLg = BorderRadius.all(Radius.circular(radiusLg));

  /// Border Radius Extra Large
  static const BorderRadius borderRadiusXl = BorderRadius.all(Radius.circular(radiusXl));

  /// Border Radius Extra Extra Large
  static const BorderRadius borderRadiusXxl = BorderRadius.all(Radius.circular(radiusXxl));

  // ============================================================================
  // BORDER STYLES
  // ============================================================================

  /// Border Width Thin - 1px
  static const double borderWidthThin = 1.0;

  /// Border Width Medium - 2px
  static const double borderWidthMedium = 2.0;

  /// Border Width Thick - 3px
  static const double borderWidthThick = 3.0;

  /// Default Border - Light border
  static Border defaultBorder = Border.all(
    color: AppColors.borderLight,
    width: borderWidthThin,
  );

  /// Focus Border - Border for focused elements
  static Border focusBorder = Border.all(
    color: AppColors.borderFocus,
    width: borderWidthMedium,
  );

  /// Error Border - Border for error states
  static Border errorBorder = Border.all(
    color: AppColors.borderError,
    width: borderWidthMedium,
  );

  // ============================================================================
  // BORDER SIDES
  // ============================================================================

  /// Top Border Only
  static Border topBorder = Border(
    top: BorderSide(color: AppColors.borderLight, width: borderWidthThin),
  );

  /// Bottom Border Only
  static Border bottomBorder = Border(
    bottom: BorderSide(color: AppColors.borderLight, width: borderWidthThin),
  );

  /// Left Border Only
  static Border leftBorder = Border(
    left: BorderSide(color: AppColors.borderLight, width: borderWidthThin),
  );

  /// Right Border Only
  static Border rightBorder = Border(
    right: BorderSide(color: AppColors.borderLight, width: borderWidthThin),
  );
}

/// App Shadows
/// Centralized shadow/elevation definitions
class AppShadows {
  AppShadows._(); // Private constructor to prevent instantiation

  // ============================================================================
  // ELEVATION SHADOWS
  // ============================================================================

  /// Elevation 0 - No shadow
  static const List<BoxShadow> elevation0 = [];

  /// Elevation 1 - Very subtle shadow (1dp)
  /// Use for: Subtle separation, Hover states
  static const List<BoxShadow> elevation1 = [
    BoxShadow(
      color: AppColors.shadow,
      blurRadius: 2.0,
      offset: Offset(0, 1),
      spreadRadius: 0,
    ),
  ];

  /// Elevation 2 - Subtle shadow (2dp)
  /// Use for: Cards, Containers
  static const List<BoxShadow> elevation2 = [
    BoxShadow(
      color: AppColors.shadow,
      blurRadius: 4.0,
      offset: Offset(0, 2),
      spreadRadius: 0,
    ),
  ];

  /// Elevation 3 - Medium shadow (3dp)
  /// Use for: Elevated cards, Floating buttons
  static const List<BoxShadow> elevation3 = [
    BoxShadow(
      color: AppColors.shadow,
      blurRadius: 6.0,
      offset: Offset(0, 3),
      spreadRadius: 0,
    ),
  ];

  /// Elevation 4 - Prominent shadow (4dp)
  /// Use for: Modals, Dialogs, Important cards
  static const List<BoxShadow> elevation4 = [
    BoxShadow(
      color: AppColors.shadow,
      blurRadius: 8.0,
      offset: Offset(0, 4),
      spreadRadius: 0,
    ),
  ];

  /// Elevation 6 - Very prominent shadow (6dp)
  /// Use for: Bottom sheets, Important modals
  static const List<BoxShadow> elevation6 = [
    BoxShadow(
      color: AppColors.shadow,
      blurRadius: 12.0,
      offset: Offset(0, 6),
      spreadRadius: 0,
    ),
  ];

  /// Elevation 8 - Maximum shadow (8dp)
  /// Use for: Navigation drawers, Maximum elevation
  static const List<BoxShadow> elevation8 = [
    BoxShadow(
      color: AppColors.shadow,
      blurRadius: 16.0,
      offset: Offset(0, 8),
      spreadRadius: 0,
    ),
  ];

  // ============================================================================
  // CUSTOM SHADOWS
  // ============================================================================

  /// Card Shadow - Standard shadow for cards
  static const List<BoxShadow> cardShadow = elevation2;

  /// Card Shadow Hover - Shadow for hovered cards
  static const List<BoxShadow> cardShadowHover = elevation4;

  /// Button Shadow - Shadow for elevated buttons
  static const List<BoxShadow> buttonShadow = elevation2;

  /// Button Shadow Pressed - Shadow for pressed buttons
  static const List<BoxShadow> buttonShadowPressed = elevation1;

  /// Modal Shadow - Shadow for modals and dialogs
  static const List<BoxShadow> modalShadow = elevation6;

  /// Bottom Sheet Shadow - Shadow for bottom sheets
  static const List<BoxShadow> bottomSheetShadow = elevation8;

  /// Floating Action Button Shadow - Shadow for FAB
  static const List<BoxShadow> fabShadow = elevation4;

  // ============================================================================
  // SHADOW UTILITIES
  // ============================================================================

  /// Create custom shadow
  static List<BoxShadow> custom({
    Color color = AppColors.shadow,
    double blurRadius = 4.0,
    Offset offset = const Offset(0, 2),
    double spreadRadius = 0.0,
  }) {
    return [
      BoxShadow(
        color: color,
        blurRadius: blurRadius,
        offset: offset,
        spreadRadius: spreadRadius,
      ),
    ];
  }

  /// Create multiple shadows (layered)
  static List<BoxShadow> layered(List<BoxShadow> shadows) {
    return shadows;
  }
}

