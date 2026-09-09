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
  // B2: aligned to MOBILE_UI_UX_ENHANCEMENT_PLAN §4.2
  // ============================================================================

  /// Primary Green - Main brand color for Peace Mode
  static const Color primaryGreen = Color(0xFF216E39);
  
  /// Primary Green Dark - For emphasis and hover states
  static const Color primaryGreenDark = Color(0xFF1A572D);
  
  /// Primary Green Light - For subtle accents (not control outlines)
  static const Color primaryGreenLight = Color(0xFF4C9A63);
  
  /// Primary Green Subtle / primary container
  static const Color primaryGreenSubtle = Color(0xFFE8F3EB);

  // ============================================================================
  // PRIMARY COLORS - Crisis Mode
  // ============================================================================

  /// Primary Red - Main brand color for Crisis Mode / emergency emphasis
  static const Color primaryRed = Color(0xFFB3261E);
  
  /// Primary Red Dark - For emphasis
  static const Color primaryRedDark = Color(0xFF8C1D17);
  
  /// Primary Red Light - For subtle accents on dark surfaces
  static const Color primaryRedLight = Color(0xFFE57373);
  
  /// Primary Red Subtle / emergency container (light surfaces)
  static const Color primaryRedSubtle = Color(0xFFFCE9E7);

  // ============================================================================
  // ACCENT COLORS
  // ============================================================================

  /// Accent Blue - Informational labels and learning metadata
  static const Color accentBlue = Color(0xFF1D5F91);
  
  /// Accent Blue Dark
  static const Color accentBlueDark = Color(0xFF164A71);
  
  /// Accent Blue Light
  static const Color accentBlueLight = Color(0xFF64B5F6);

  /// Accent Orange - For warnings and attention (legacy bright accent)
  static const Color accentOrange = Color(0xFFFF9800);
  
  /// Accent Orange Dark
  static const Color accentOrangeDark = Color(0xFFF57C00);
  
  /// Accent Orange Light
  static const Color accentOrangeLight = Color(0xFFFFB74D);

  /// Accent Yellow - Crisis focus / highlights
  static const Color accentYellow = Color(0xFFFFEB3B);
  
  /// Accent Yellow Dark
  static const Color accentYellowDark = Color(0xFFFBC02D);
  
  /// Accent Yellow Light
  static const Color accentYellowLight = Color(0xFFFFF176);

  /// Sign-language format accent (chips/icons only — not a full theme)
  static const Color accentSignLanguage = Color(0xFF7542A6);

  // ============================================================================
  // NEUTRAL COLORS - Backgrounds
  // ============================================================================

  /// Background White - Primary surface color
  static const Color backgroundWhite = Color(0xFFFFFFFF);
  
  /// Background Light / canvas
  static const Color backgroundLight = Color(0xFFF6F8F7);
  
  /// Background Medium - For slightly elevated surfaces
  static const Color backgroundMedium = Color(0xFFEEF2EF);
  
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
  static const Color textPrimary = Color(0xFF17221B);
  
  /// Text Secondary - Supporting descriptions and timestamps
  static const Color textSecondary = Color(0xFF526057);
  
  /// Text Tertiary - Tertiary text color
  static const Color textTertiary = Color(0xFF6B7A70);
  
  /// Text Disabled - Disabled text color
  static const Color textDisabled = Color(0xFF9AA59E);
  
  /// Text White - White text for dark backgrounds
  static const Color textWhite = Color(0xFFFFFFFF);
  
  /// Text Light - Light text for dark backgrounds
  static const Color textLight = Color(0xFFE8ECE9);
  
  /// Text on Primary - Text color on primary colored backgrounds
  static const Color textOnPrimary = Color(0xFFFFFFFF);
  
  /// Text on Secondary - Text color on secondary colored backgrounds
  static const Color textOnSecondary = Color(0xFFFFFFFF);

  // ============================================================================
  // STATUS COLORS
  // ============================================================================

  /// Success - Green for success states
  static const Color success = Color(0xFF216E39);
  
  /// Success Dark
  static const Color successDark = Color(0xFF1A572D);
  
  /// Success Light
  static const Color successLight = Color(0xFF4C9A63);
  
  /// Success Background - Light background for success messages
  static const Color successBackground = Color(0xFFE8F3EB);

  /// Warning - Readable warning foreground on light surfaces
  static const Color warning = Color(0xFF805400);
  
  /// Warning Dark
  static const Color warningDark = Color(0xFF5C3C00);
  
  /// Warning Light
  static const Color warningLight = Color(0xFFFFB74D);
  
  /// Warning Background - Light background for warning messages
  static const Color warningBackground = Color(0xFFFFF4D6);

  /// Error - Red for error / emergency emphasis
  static const Color error = Color(0xFFB3261E);
  
  /// Error Dark
  static const Color errorDark = Color(0xFF8C1D17);
  
  /// Error Light
  static const Color errorLight = Color(0xFFE57373);
  
  /// Error Background - Light background for error messages
  static const Color errorBackground = Color(0xFFFCE9E7);

  /// Info - Blue for informational states
  static const Color info = Color(0xFF1D5F91);
  
  /// Info Dark
  static const Color infoDark = Color(0xFF164A71);
  
  /// Info Light
  static const Color infoLight = Color(0xFF64B5F6);
  
  /// Info Background - Light background for info messages
  static const Color infoBackground = Color(0xFFE3F2FD);

  // ============================================================================
  // BORDER COLORS
  // ============================================================================

  /// Border Light - Decorative card boundaries
  static const Color borderLight = Color(0xFFD8E2DB);
  
  /// Border Medium / control outline
  static const Color borderMedium = Color(0xFF66756B);
  
  /// Border Dark - Prominent borders
  static const Color borderDark = Color(0xFF526057);
  
  /// Border Focus - For focused input fields
  static const Color borderFocus = primaryGreen;
  
  /// Border Error - For error states
  static const Color borderError = error;

  // ============================================================================
  // DIVIDER COLORS
  // ============================================================================

  /// Divider - For separating sections
  static const Color divider = Color(0xFFD8E2DB);
  
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

