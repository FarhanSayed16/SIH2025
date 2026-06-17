/// Phase 101.1: Spacing System
/// Comprehensive spacing definitions for EduSafe mobile app
/// 
/// This file defines all spacing values used throughout the app, ensuring
/// consistent margins, padding, and layout spacing.

import 'package:flutter/material.dart';

/// App Spacing
/// Centralized spacing system for consistent layout
class AppSpacing {
  AppSpacing._(); // Private constructor to prevent instantiation

  // ============================================================================
  // BASE SPACING SCALE
  // ============================================================================

  /// Extra Extra Small - 4px
  /// Use for: Tight spacing, Icon padding
  static const double xs = 4.0;

  /// Extra Small - 8px
  /// Use for: Tight spacing between related items
  static const double sm = 8.0;

  /// Small - 12px
  /// Use for: Spacing between form fields, List item spacing
  static const double md = 12.0;

  /// Medium - 16px
  /// Use for: Standard spacing, Card padding, Section spacing
  static const double lg = 16.0;

  /// Large - 24px
  /// Use for: Section spacing, Large card padding
  static const double xl = 24.0;

  /// Extra Large - 32px
  /// Use for: Screen edge padding, Major section spacing
  static const double xxl = 32.0;

  /// Extra Extra Large - 48px
  /// Use for: Screen edge padding (large screens), Major spacing
  static const double xxxl = 48.0;

  // ============================================================================
  // PADDING VALUES
  // ============================================================================

  /// Screen Padding - Standard padding for screen edges (16px)
  static const double screenPadding = lg;

  /// Screen Padding Large - Large padding for screen edges (24px)
  static const double screenPaddingLarge = xl;

  /// Card Padding - Standard padding inside cards (16px)
  static const double cardPadding = lg;

  /// Card Padding Small - Small padding inside cards (12px)
  static const double cardPaddingSmall = md;

  /// Card Padding Large - Large padding inside cards (24px)
  static const double cardPaddingLarge = xl;

  /// Button Padding Horizontal - Horizontal padding for buttons (24px)
  static const double buttonPaddingH = xl;

  /// Button Padding Vertical - Vertical padding for buttons (12px)
  static const double buttonPaddingV = md;

  /// Button Padding Small Horizontal - Small horizontal padding (16px)
  static const double buttonPaddingSmallH = lg;

  /// Button Padding Small Vertical - Small vertical padding (8px)
  static const double buttonPaddingSmallV = sm;

  /// Input Padding Horizontal - Horizontal padding for inputs (16px)
  static const double inputPaddingH = lg;

  /// Input Padding Vertical - Vertical padding for inputs (12px)
  static const double inputPaddingV = md;

  // ============================================================================
  // MARGIN VALUES
  // ============================================================================

  /// Section Margin - Margin between sections (24px)
  static const double sectionMargin = xl;

  /// Section Margin Large - Large margin between sections (32px)
  static const double sectionMarginLarge = xxl;

  /// Item Margin - Margin between items in a list (12px)
  static const double itemMargin = md;

  /// Item Margin Small - Small margin between items (8px)
  static const double itemMarginSmall = sm;

  /// Item Margin Large - Large margin between items (16px)
  static const double itemMarginLarge = lg;

  // ============================================================================
  // GAP VALUES (For Row/Column spacing)
  // ============================================================================

  /// Gap Extra Small - 4px gap
  static const double gapXs = xs;

  /// Gap Small - 8px gap
  static const double gapSm = sm;

  /// Gap Medium - 12px gap
  static const double gapMd = md;

  /// Gap Large - 16px gap
  static const double gapLg = lg;

  /// Gap Extra Large - 24px gap
  static const double gapXl = xl;

  /// Gap Extra Extra Large - 32px gap
  static const double gapXxl = xxl;

  // ============================================================================
  // EDGE INSETS HELPERS
  // ============================================================================

  /// All edges - Equal padding/margin on all sides
  static EdgeInsets all(double value) => EdgeInsets.all(value);

  /// Symmetric - Horizontal and vertical padding/margin
  static EdgeInsets symmetric({
    double horizontal = 0,
    double vertical = 0,
  }) =>
      EdgeInsets.symmetric(horizontal: horizontal, vertical: vertical);

  /// Only - Specific edges padding/margin
  static EdgeInsets only({
    double top = 0,
    double bottom = 0,
    double left = 0,
    double right = 0,
  }) =>
      EdgeInsets.only(top: top, bottom: bottom, left: left, right: right);

  // ============================================================================
  // COMMON PADDING COMBINATIONS
  // ============================================================================

  /// Screen Edge Padding - Standard screen edge padding
  static EdgeInsets get screenEdge => EdgeInsets.all(screenPadding);

  /// Screen Edge Padding Large - Large screen edge padding
  static EdgeInsets get screenEdgeLarge => EdgeInsets.all(screenPaddingLarge);

  /// Screen Horizontal Padding - Horizontal screen padding only
  static EdgeInsets get screenHorizontal => EdgeInsets.symmetric(horizontal: screenPadding);

  /// Screen Vertical Padding - Vertical screen padding only
  static EdgeInsets get screenVertical => EdgeInsets.symmetric(vertical: screenPadding);

  /// Card Padding - Standard card padding
  static EdgeInsets get card => EdgeInsets.all(cardPadding);

  /// Card Padding Small - Small card padding
  static EdgeInsets get cardSmall => EdgeInsets.all(cardPaddingSmall);

  /// Card Padding Large - Large card padding
  static EdgeInsets get cardLarge => EdgeInsets.all(cardPaddingLarge);

  /// Button Padding - Standard button padding
  static EdgeInsets get button => EdgeInsets.symmetric(
    horizontal: buttonPaddingH,
    vertical: buttonPaddingV,
  );

  /// Button Padding Small - Small button padding
  static EdgeInsets get buttonSmall => EdgeInsets.symmetric(
    horizontal: buttonPaddingSmallH,
    vertical: buttonPaddingSmallV,
  );

  /// Input Padding - Standard input padding
  static EdgeInsets get input => EdgeInsets.symmetric(
    horizontal: inputPaddingH,
    vertical: inputPaddingV,
  );

  // ============================================================================
  // COMMON MARGIN COMBINATIONS
  // ============================================================================

  /// Section Margin - Margin between sections
  static EdgeInsets get section => EdgeInsets.symmetric(vertical: sectionMargin);

  /// Section Margin Large - Large margin between sections
  static EdgeInsets get sectionLarge => EdgeInsets.symmetric(vertical: sectionMarginLarge);

  /// Item Margin - Margin between items
  static EdgeInsets get item => EdgeInsets.symmetric(vertical: itemMargin);

  /// Item Margin Small - Small margin between items
  static EdgeInsets get itemSmall => EdgeInsets.symmetric(vertical: itemMarginSmall);

  /// Item Margin Large - Large margin between items
  static EdgeInsets get itemLarge => EdgeInsets.symmetric(vertical: itemMarginLarge);
}

/// Spacing Extensions
/// Useful extensions for EdgeInsets
extension EdgeInsetsExtensions on EdgeInsets {
  /// Add spacing to all sides
  EdgeInsets addAll(double value) => this + EdgeInsets.all(value);

  /// Add horizontal spacing
  EdgeInsets addHorizontal(double value) =>
      this + EdgeInsets.symmetric(horizontal: value);

  /// Add vertical spacing
  EdgeInsets addVertical(double value) =>
      this + EdgeInsets.symmetric(vertical: value);

  /// Add top spacing
  EdgeInsets addTop(double value) => this + EdgeInsets.only(top: value);

  /// Add bottom spacing
  EdgeInsets addBottom(double value) => this + EdgeInsets.only(bottom: value);

  /// Add left spacing
  EdgeInsets addLeft(double value) => this + EdgeInsets.only(left: value);

  /// Add right spacing
  EdgeInsets addRight(double value) => this + EdgeInsets.only(right: value);
}

