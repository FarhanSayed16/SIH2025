/// Phase 101.1: Typography System
/// Comprehensive typography definitions for EduSafe mobile app
/// 
/// This file defines all text styles used throughout the app, ensuring
/// consistency in font sizes, weights, and line heights.

import 'package:flutter/material.dart';
import 'colors.dart';

/// App Text Styles
/// Centralized typography definitions for the entire application
class AppTextStyles {
  AppTextStyles._(); // Private constructor to prevent instantiation

  // ============================================================================
  // HEADINGS
  // ============================================================================

  /// Heading 1 - Largest heading (32sp, Bold)
  /// Use for: Main page titles, Hero text
  static const TextStyle h1 = TextStyle(
    fontSize: 32,
    fontWeight: FontWeight.bold,
    letterSpacing: -0.5,
    height: 1.2,
    color: AppColors.textPrimary,
  );

  /// Heading 2 - Large heading (24sp, Bold)
  /// Use for: Section titles, Card titles
  static const TextStyle h2 = TextStyle(
    fontSize: 24,
    fontWeight: FontWeight.bold,
    letterSpacing: -0.3,
    height: 1.3,
    color: AppColors.textPrimary,
  );

  /// Heading 3 - Medium heading (20sp, Semi-Bold)
  /// Use for: Subsection titles, List headers
  static const TextStyle h3 = TextStyle(
    fontSize: 20,
    fontWeight: FontWeight.w600,
    letterSpacing: -0.2,
    height: 1.4,
    color: AppColors.textPrimary,
  );

  /// Heading 4 - Small heading (18sp, Semi-Bold)
  /// Use for: Card subtitles, Form labels (large)
  static const TextStyle h4 = TextStyle(
    fontSize: 18,
    fontWeight: FontWeight.w600,
    letterSpacing: 0,
    height: 1.4,
    color: AppColors.textPrimary,
  );

  /// Heading 5 - Extra small heading (16sp, Semi-Bold)
  /// Use for: Small section titles, Table headers
  static const TextStyle h5 = TextStyle(
    fontSize: 16,
    fontWeight: FontWeight.w600,
    letterSpacing: 0,
    height: 1.5,
    color: AppColors.textPrimary,
  );

  // ============================================================================
  // BODY TEXT
  // ============================================================================

  /// Body Large - Large body text (16sp, Regular)
  /// Use for: Primary content, Important descriptions
  static const TextStyle bodyLarge = TextStyle(
    fontSize: 16,
    fontWeight: FontWeight.normal,
    letterSpacing: 0.15,
    height: 1.5,
    color: AppColors.textPrimary,
  );

  /// Body Medium - Medium body text (14sp, Regular)
  /// Use for: Standard content, Descriptions
  static const TextStyle bodyMedium = TextStyle(
    fontSize: 14,
    fontWeight: FontWeight.normal,
    letterSpacing: 0.25,
    height: 1.5,
    color: AppColors.textPrimary,
  );

  /// Body Small - Small body text (12sp, Regular)
  /// Use for: Secondary content, Captions
  static const TextStyle bodySmall = TextStyle(
    fontSize: 12,
    fontWeight: FontWeight.normal,
    letterSpacing: 0.4,
    height: 1.4,
    color: AppColors.textSecondary,
  );

  // ============================================================================
  // BUTTON TEXT
  // ============================================================================

  /// Button Large - Large button text (16sp, Semi-Bold)
  /// Use for: Primary buttons, CTA buttons
  static const TextStyle buttonLarge = TextStyle(
    fontSize: 16,
    fontWeight: FontWeight.w600,
    letterSpacing: 0.5,
    height: 1.2,
    color: AppColors.textOnPrimary,
  );

  /// Button Medium - Medium button text (14sp, Semi-Bold)
  /// Use for: Standard buttons, Secondary buttons
  static const TextStyle buttonMedium = TextStyle(
    fontSize: 14,
    fontWeight: FontWeight.w600,
    letterSpacing: 0.5,
    height: 1.2,
    color: AppColors.textOnPrimary,
  );

  /// Button Small - Small button text (12sp, Semi-Bold)
  /// Use for: Text buttons, Icon buttons with labels
  static const TextStyle buttonSmall = TextStyle(
    fontSize: 12,
    fontWeight: FontWeight.w600,
    letterSpacing: 0.4,
    height: 1.2,
    color: AppColors.primaryGreen,
  );

  // ============================================================================
  // LABEL TEXT
  // ============================================================================

  /// Label Large - Large labels (14sp, Medium)
  /// Use for: Form labels, Input labels
  static const TextStyle labelLarge = TextStyle(
    fontSize: 14,
    fontWeight: FontWeight.w500,
    letterSpacing: 0.1,
    height: 1.4,
    color: AppColors.textPrimary,
  );

  /// Label Medium - Medium labels (12sp, Medium)
  /// Use for: Standard labels, Field labels
  static const TextStyle labelMedium = TextStyle(
    fontSize: 12,
    fontWeight: FontWeight.w500,
    letterSpacing: 0.5,
    height: 1.4,
    color: AppColors.textPrimary,
  );

  /// Label Small - Small labels (11sp, Medium)
  /// Use for: Helper text, Placeholder text
  static const TextStyle labelSmall = TextStyle(
    fontSize: 11,
    fontWeight: FontWeight.w500,
    letterSpacing: 0.5,
    height: 1.3,
    color: AppColors.textSecondary,
  );

  // ============================================================================
  // CAPTION & OVERLINE
  // ============================================================================

  /// Caption - Caption text (12sp, Regular)
  /// Use for: Image captions, Timestamps
  static const TextStyle caption = TextStyle(
    fontSize: 12,
    fontWeight: FontWeight.normal,
    letterSpacing: 0.4,
    height: 1.3,
    color: AppColors.textSecondary,
  );

  /// Overline - Overline text (10sp, Medium, Uppercase)
  /// Use for: Tags, Categories, Status labels
  static const TextStyle overline = TextStyle(
    fontSize: 10,
    fontWeight: FontWeight.w500,
    letterSpacing: 1.5,
    height: 1.2,
    color: AppColors.textSecondary,
  );

  // ============================================================================
  // SPECIAL TEXT STYLES
  // ============================================================================

  /// Display Large - For large display numbers (48sp, Bold)
  /// Use for: Scores, Statistics, Large numbers
  static const TextStyle displayLarge = TextStyle(
    fontSize: 48,
    fontWeight: FontWeight.bold,
    letterSpacing: -1,
    height: 1.1,
    color: AppColors.textPrimary,
  );

  /// Display Medium - For medium display numbers (36sp, Bold)
  /// Use for: Medium statistics
  static const TextStyle displayMedium = TextStyle(
    fontSize: 36,
    fontWeight: FontWeight.bold,
    letterSpacing: -0.5,
    height: 1.2,
    color: AppColors.textPrimary,
  );

  /// Display Small - For small display numbers (24sp, Bold)
  /// Use for: Small statistics
  static const TextStyle displaySmall = TextStyle(
    fontSize: 24,
    fontWeight: FontWeight.bold,
    letterSpacing: 0,
    height: 1.3,
    color: AppColors.textPrimary,
  );

  // ============================================================================
  // ERROR & HELP TEXT
  // ============================================================================

  /// Error Text - For error messages (12sp, Regular)
  /// Use for: Form validation errors, Error messages
  static const TextStyle errorText = TextStyle(
    fontSize: 12,
    fontWeight: FontWeight.normal,
    letterSpacing: 0.4,
    height: 1.3,
    color: AppColors.error,
  );

  /// Helper Text - For helper/guidance text (12sp, Regular)
  /// Use for: Input helper text, Guidance messages
  static const TextStyle helperText = TextStyle(
    fontSize: 12,
    fontWeight: FontWeight.normal,
    letterSpacing: 0.4,
    height: 1.3,
    color: AppColors.textSecondary,
  );

  // ============================================================================
  // CRISIS MODE TEXT STYLES
  // ============================================================================

  /// Crisis Heading - Large heading for crisis mode (28sp, Bold)
  /// Use for: Emergency alerts, Crisis titles
  static const TextStyle crisisHeading = TextStyle(
    fontSize: 28,
    fontWeight: FontWeight.bold,
    letterSpacing: -0.5,
    height: 1.2,
    color: AppColors.textWhite,
  );

  /// Crisis Body - Body text for crisis mode (16sp, Regular)
  /// Use for: Emergency descriptions
  static const TextStyle crisisBody = TextStyle(
    fontSize: 16,
    fontWeight: FontWeight.normal,
    letterSpacing: 0.15,
    height: 1.5,
    color: AppColors.textLight,
  );

  /// Crisis Button - Button text for crisis mode (16sp, Bold)
  /// Use for: Emergency action buttons
  static const TextStyle crisisButton = TextStyle(
    fontSize: 16,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.5,
    height: 1.2,
    color: AppColors.textWhite,
  );
}

/// Text Style Extensions
/// Useful extensions for TextStyle
extension TextStyleExtensions on TextStyle {
  /// Apply color to text style
  TextStyle withColor(Color color) => copyWith(color: color);

  /// Apply font size to text style
  TextStyle withSize(double fontSize) => copyWith(fontSize: fontSize);

  /// Apply font weight to text style
  TextStyle withWeight(FontWeight fontWeight) => copyWith(fontWeight: fontWeight);

  /// Apply opacity to text style color
  TextStyle withOpacity(double opacity) {
    if (color == null) return this;
    return copyWith(color: color!.withOpacity(opacity));
  }

  /// Make text bold
  TextStyle get bold => copyWith(fontWeight: FontWeight.bold);

  /// Make text semi-bold
  TextStyle get semiBold => copyWith(fontWeight: FontWeight.w600);

  /// Make text medium
  TextStyle get medium => copyWith(fontWeight: FontWeight.w500);

  /// Make text regular
  TextStyle get regular => copyWith(fontWeight: FontWeight.normal);

  /// Make text light
  TextStyle get light => copyWith(fontWeight: FontWeight.w300);
}

