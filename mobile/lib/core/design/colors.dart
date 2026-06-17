/// Phase 101.1: Color System
/// Comprehensive color palette for EduSafe mobile app
/// 
/// This file defines all colors used throughout the app, organized by purpose.
/// Colors are defined for both Peace Mode and Crisis Mode themes.

import 'package:flutter/material.dart';

/// App Colors
/// Centralized color definitions for the entire application
class AppColors {
  AppColors._(); // Private constructor to prevent instantiation

  // ============================================================================
  // PRIMARY COLORS - Peace Mode (Default)
  // ============================================================================

  /// Primary Green - Main brand color for Peace Mode
  static const Color primaryGreen = Color(0xFF4CAF50);
  
  /// Primary Green Dark - For emphasis and hover states
  static const Color primaryGreenDark = Color(0xFF388E3C);
  
  /// Primary Green Light - For subtle backgrounds
  static const Color primaryGreenLight = Color(0xFF81C784);
  
  /// Primary Green Subtle - For very light backgrounds
  static const Color primaryGreenSubtle = Color(0xFFC8E6C9);

  // ============================================================================
  // PRIMARY COLORS - Crisis Mode
  // ============================================================================

  /// Primary Red - Main brand color for Crisis Mode
  static const Color primaryRed = Color(0xFFD32F2F);
  
  /// Primary Red Dark - For emphasis
  static const Color primaryRedDark = Color(0xFFB71C1C);
  
  /// Primary Red Light - For subtle backgrounds
  static const Color primaryRedLight = Color(0xFFE57373);
  
  /// Primary Red Subtle - For very light backgrounds
  static const Color primaryRedSubtle = Color(0xFFFFCDD2);

  // ============================================================================
  // ACCENT COLORS
  // ============================================================================

  /// Accent Blue - For secondary actions and highlights
  static const Color accentBlue = Color(0xFF2196F3);
  
  /// Accent Blue Dark
  static const Color accentBlueDark = Color(0xFF1976D2);
  
  /// Accent Blue Light
  static const Color accentBlueLight = Color(0xFF64B5F6);

  /// Accent Orange - For warnings and attention
  static const Color accentOrange = Color(0xFFFF9800);
  
  /// Accent Orange Dark
  static const Color accentOrangeDark = Color(0xFFF57C00);
  
  /// Accent Orange Light
  static const Color accentOrangeLight = Color(0xFFFFB74D);

  /// Accent Yellow - For highlights and alerts
  static const Color accentYellow = Color(0xFFFFEB3B);
  
  /// Accent Yellow Dark
  static const Color accentYellowDark = Color(0xFFFBC02D);
  
  /// Accent Yellow Light
  static const Color accentYellowLight = Color(0xFFFFF176);

  // ============================================================================
  // NEUTRAL COLORS - Backgrounds
  // ============================================================================

  /// Background White - Primary surface color
  static const Color backgroundWhite = Color(0xFFFFFFFF);
  
  /// Background Light - For subtle backgrounds
  static const Color backgroundLight = Color(0xFFF5F5F5);
  
  /// Background Medium - For slightly elevated surfaces
  static const Color backgroundMedium = Color(0xFFEEEEEE);
  
  /// Background Dark - For dark mode backgrounds
  static const Color backgroundDark = Color(0xFF1A1A1A);
  
  /// Background Black - For crisis mode backgrounds
  static const Color backgroundBlack = Color(0xFF000000);
  
  /// Background Overlay - For modals and overlays
  static const Color backgroundOverlay = Color(0x80000000); // 50% opacity black

  // ============================================================================
  // TEXT COLORS
  // ============================================================================

  /// Text Primary - Main text color
  static const Color textPrimary = Color(0xFF212121);
  
  /// Text Secondary - Secondary text color
  static const Color textSecondary = Color(0xFF757575);
  
  /// Text Tertiary - Tertiary text color
  static const Color textTertiary = Color(0xFF9E9E9E);
  
  /// Text Disabled - Disabled text color
  static const Color textDisabled = Color(0xFFBDBDBD);
  
  /// Text White - White text for dark backgrounds
  static const Color textWhite = Color(0xFFFFFFFF);
  
  /// Text Light - Light text for dark backgrounds
  static const Color textLight = Color(0xFFE0E0E0);
  
  /// Text on Primary - Text color on primary colored backgrounds
  static const Color textOnPrimary = Color(0xFFFFFFFF);
  
  /// Text on Secondary - Text color on secondary colored backgrounds
  static const Color textOnSecondary = Color(0xFFFFFFFF);

  // ============================================================================
  // STATUS COLORS
  // ============================================================================

  /// Success - Green for success states
  static const Color success = Color(0xFF4CAF50);
  
  /// Success Dark
  static const Color successDark = Color(0xFF388E3C);
  
  /// Success Light
  static const Color successLight = Color(0xFF81C784);
  
  /// Success Background - Light background for success messages
  static const Color successBackground = Color(0xFFE8F5E9);

  /// Warning - Orange for warning states
  static const Color warning = Color(0xFFFF9800);
  
  /// Warning Dark
  static const Color warningDark = Color(0xFFF57C00);
  
  /// Warning Light
  static const Color warningLight = Color(0xFFFFB74D);
  
  /// Warning Background - Light background for warning messages
  static const Color warningBackground = Color(0xFFFFF3E0);

  /// Error - Red for error states
  static const Color error = Color(0xFFF44336);
  
  /// Error Dark
  static const Color errorDark = Color(0xFFD32F2F);
  
  /// Error Light
  static const Color errorLight = Color(0xFFE57373);
  
  /// Error Background - Light background for error messages
  static const Color errorBackground = Color(0xFFFFEBEE);

  /// Info - Blue for informational states
  static const Color info = Color(0xFF2196F3);
  
  /// Info Dark
  static const Color infoDark = Color(0xFF1976D2);
  
  /// Info Light
  static const Color infoLight = Color(0xFF64B5F6);
  
  /// Info Background - Light background for info messages
  static const Color infoBackground = Color(0xFFE3F2FD);

  // ============================================================================
  // BORDER COLORS
  // ============================================================================

  /// Border Light - Subtle borders
  static const Color borderLight = Color(0xFFE0E0E0);
  
  /// Border Medium - Medium borders
  static const Color borderMedium = Color(0xFFBDBDBD);
  
  /// Border Dark - Prominent borders
  static const Color borderDark = Color(0xFF9E9E9E);
  
  /// Border Focus - For focused input fields
  static const Color borderFocus = primaryGreen;
  
  /// Border Error - For error states
  static const Color borderError = error;

  // ============================================================================
  // DIVIDER COLORS
  // ============================================================================

  /// Divider - For separating sections
  static const Color divider = Color(0xFFE0E0E0);
  
  /// Divider Dark - For dark mode
  static const Color dividerDark = Color(0xFF424242);

  // ============================================================================
  // SHADOW COLORS
  // ============================================================================

  /// Shadow Color - For elevation shadows
  static const Color shadow = Color(0x1F000000); // 12% opacity black
  
  /// Shadow Dark - For dark mode shadows
  static const Color shadowDark = Color(0x3F000000); // 25% opacity black

  // ============================================================================
  // GRADIENT COLORS
  // ============================================================================

  /// Primary Gradient Start
  static const Color gradientStart = primaryGreen;
  
  /// Primary Gradient End
  static const Color gradientEnd = primaryGreenDark;
  
  /// Crisis Gradient Start
  static const Color gradientCrisisStart = primaryRed;
  
  /// Crisis Gradient End
  static const Color gradientCrisisEnd = primaryRedDark;

  // ============================================================================
  // OVERLAY COLORS
  // ============================================================================

  /// Overlay Light - Light overlay for modals
  static const Color overlayLight = Color(0x40000000); // 25% opacity
  
  /// Overlay Medium - Medium overlay
  static const Color overlayMedium = Color(0x66000000); // 40% opacity
  
  /// Overlay Dark - Dark overlay
  static const Color overlayDark = Color(0x80000000); // 50% opacity

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /// Get color with opacity
  static Color withOpacity(Color color, double opacity) {
    return color.withOpacity(opacity);
  }

  /// Get color brightness (true for light, false for dark)
  static bool isLight(Color color) {
    return color.computeLuminance() > 0.5;
  }

  /// Get contrasting text color (white or black) for a background
  static Color getContrastingText(Color backgroundColor) {
    return isLight(backgroundColor) ? textPrimary : textWhite;
  }
}

/// Color Extensions
/// Useful extensions for Color class
extension ColorExtensions on Color {
  /// Get darker shade
  Color darker([double amount = 0.1]) {
    assert(amount >= 0 && amount <= 1);
    final hsl = HSLColor.fromColor(this);
    return hsl.withLightness((hsl.lightness - amount).clamp(0.0, 1.0)).toColor();
  }

  /// Get lighter shade
  Color lighter([double amount = 0.1]) {
    assert(amount >= 0 && amount <= 1);
    final hsl = HSLColor.fromColor(this);
    return hsl.withLightness((hsl.lightness + amount).clamp(0.0, 1.0)).toColor();
  }
}

