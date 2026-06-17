/// Phase 101.1: Enhanced Theme Configuration
/// Comprehensive Material 3 theme configuration using the new design system
/// 
/// This file creates complete Material 3 themes for Peace Mode, Crisis Mode,
/// and Kid Mode, integrating all design system tokens.

import 'package:flutter/material.dart';
import 'colors.dart';
import 'typography.dart';
import 'spacing.dart';
import 'borders.dart';
import '../theme/kid_theme.dart';

/// Enhanced App Theme
/// Provides comprehensive theme configuration using the design system
class AppThemeEnhanced {
  AppThemeEnhanced._(); // Private constructor to prevent instantiation

  // ============================================================================
  // PEACE MODE THEME (Light, Green-based)
  // ============================================================================

  /// Get Peace Mode Theme - Friendly, gamified, green/white theme
  static ThemeData get peaceMode {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      
      // Color Scheme
      colorScheme: ColorScheme.light(
        primary: AppColors.primaryGreen,
        primaryContainer: AppColors.primaryGreenLight,
        secondary: AppColors.accentBlue,
        tertiary: AppColors.accentOrange,
        surface: AppColors.backgroundWhite,
        background: AppColors.backgroundLight,
        error: AppColors.error,
        onPrimary: AppColors.textOnPrimary,
        onSecondary: AppColors.textOnSecondary,
        onSurface: AppColors.textPrimary,
        onBackground: AppColors.textPrimary,
        onError: AppColors.textWhite,
      ),
      
      // Scaffold
      scaffoldBackgroundColor: AppColors.backgroundLight,
      
      // App Bar Theme
      appBarTheme: AppBarTheme(
        backgroundColor: AppColors.primaryGreen,
        foregroundColor: AppColors.textWhite,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: AppTextStyles.h3.copyWith(color: AppColors.textWhite),
        iconTheme: const IconThemeData(color: AppColors.textWhite),
      ),
      
      // Card Theme
      cardTheme: CardThemeData(
        color: AppColors.backgroundWhite,
        elevation: 2,
        shadowColor: AppColors.shadow,
        shape: RoundedRectangleBorder(
          borderRadius: AppBorders.borderRadiusMd,
        ),
        margin: AppSpacing.card,
      ),
      
      // Elevated Button Theme
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primaryGreen,
          foregroundColor: AppColors.textWhite,
          padding: AppSpacing.button,
          minimumSize: const Size(88, 48), // Material Design minimum
          shape: RoundedRectangleBorder(
            borderRadius: AppBorders.borderRadiusSm,
          ),
          elevation: 2,
          textStyle: AppTextStyles.buttonLarge,
        ),
      ),
      
      // Text Button Theme
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: AppColors.primaryGreen,
          padding: AppSpacing.button,
          minimumSize: const Size(64, 48),
          shape: RoundedRectangleBorder(
            borderRadius: AppBorders.borderRadiusSm,
          ),
          textStyle: AppTextStyles.buttonMedium,
        ),
      ),
      
      // Outlined Button Theme
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.primaryGreen,
          padding: AppSpacing.button,
          minimumSize: const Size(88, 48),
          side: const BorderSide(color: AppColors.primaryGreen, width: AppBorders.borderWidthMedium),
          shape: RoundedRectangleBorder(
            borderRadius: AppBorders.borderRadiusSm,
          ),
          textStyle: AppTextStyles.buttonLarge,
        ),
      ),
      
      // Input Decoration Theme
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.backgroundWhite,
        contentPadding: AppSpacing.input,
        border: OutlineInputBorder(
          borderRadius: AppBorders.borderRadiusSm,
          borderSide: const BorderSide(color: AppColors.borderLight, width: AppBorders.borderWidthThin),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: AppBorders.borderRadiusSm,
          borderSide: const BorderSide(color: AppColors.primaryGreenLight, width: AppBorders.borderWidthThin),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: AppBorders.borderRadiusSm,
          borderSide: const BorderSide(color: AppColors.borderFocus, width: AppBorders.borderWidthMedium),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: AppBorders.borderRadiusSm,
          borderSide: const BorderSide(color: AppColors.borderError, width: AppBorders.borderWidthMedium),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: AppBorders.borderRadiusSm,
          borderSide: const BorderSide(color: AppColors.error, width: AppBorders.borderWidthMedium),
        ),
        labelStyle: AppTextStyles.labelLarge,
        hintStyle: AppTextStyles.labelSmall,
        errorStyle: AppTextStyles.errorText,
        helperStyle: AppTextStyles.helperText,
      ),
      
      // Text Theme
      textTheme: TextTheme(
        displayLarge: AppTextStyles.displayLarge,
        displayMedium: AppTextStyles.displayMedium,
        displaySmall: AppTextStyles.displaySmall,
        headlineLarge: AppTextStyles.h1,
        headlineMedium: AppTextStyles.h2,
        headlineSmall: AppTextStyles.h3,
        titleLarge: AppTextStyles.h4,
        titleMedium: AppTextStyles.h5,
        titleSmall: AppTextStyles.bodyLarge.medium,
        bodyLarge: AppTextStyles.bodyLarge,
        bodyMedium: AppTextStyles.bodyMedium,
        bodySmall: AppTextStyles.bodySmall,
        labelLarge: AppTextStyles.labelLarge,
        labelMedium: AppTextStyles.labelMedium,
        labelSmall: AppTextStyles.labelSmall,
      ),
      
      // Icon Theme
      iconTheme: const IconThemeData(
        color: AppColors.textPrimary,
        size: 24,
      ),
      
      // Divider Theme
      dividerTheme: const DividerThemeData(
        color: AppColors.divider,
        thickness: 1,
        space: 1,
      ),
      
      // Bottom Navigation Bar Theme
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor: AppColors.backgroundWhite,
        selectedItemColor: AppColors.primaryGreen,
        unselectedItemColor: AppColors.textSecondary,
        selectedLabelStyle: AppTextStyles.labelSmall,
        unselectedLabelStyle: AppTextStyles.labelSmall,
        type: BottomNavigationBarType.fixed,
        elevation: 8,
      ),
      
      // Floating Action Button Theme
      floatingActionButtonTheme: FloatingActionButtonThemeData(
        backgroundColor: AppColors.primaryGreen,
        foregroundColor: AppColors.textWhite,
        elevation: 4,
        shape: RoundedRectangleBorder(
          borderRadius: AppBorders.borderRadiusMd,
        ),
      ),
      
      // Dialog Theme
      dialogTheme: DialogThemeData(
        backgroundColor: AppColors.backgroundWhite,
        elevation: 8,
        shape: RoundedRectangleBorder(
          borderRadius: AppBorders.borderRadiusLg,
        ),
        titleTextStyle: AppTextStyles.h3,
        contentTextStyle: AppTextStyles.bodyMedium,
      ),
      
      // Bottom Sheet Theme
      bottomSheetTheme: BottomSheetThemeData(
        backgroundColor: AppColors.backgroundWhite,
        elevation: 8,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(
            top: Radius.circular(AppBorders.radiusLg),
          ),
        ),
      ),
    );
  }

  // ============================================================================
  // CRISIS MODE THEME (Dark, Red-based)
  // ============================================================================

  /// Get Crisis Mode Theme - High contrast, emergency, red/black theme
  static ThemeData get crisisMode {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      
      // Color Scheme
      colorScheme: const ColorScheme.dark(
        primary: AppColors.primaryRed,
        primaryContainer: AppColors.primaryRedDark,
        secondary: AppColors.accentYellow,
        tertiary: AppColors.accentOrange,
        surface: AppColors.backgroundDark,
        background: AppColors.backgroundBlack,
        error: AppColors.error,
        onPrimary: AppColors.textWhite,
        onSecondary: AppColors.textPrimary,
        onSurface: AppColors.textWhite,
        onBackground: AppColors.textLight,
        onError: AppColors.textWhite,
      ),
      
      // Scaffold
      scaffoldBackgroundColor: AppColors.backgroundBlack,
      
      // App Bar Theme
      appBarTheme: AppBarTheme(
        backgroundColor: AppColors.primaryRed,
        foregroundColor: AppColors.textWhite,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: AppTextStyles.crisisHeading,
        iconTheme: const IconThemeData(color: AppColors.textWhite, size: 28),
      ),
      
      // Card Theme
      cardTheme: CardThemeData(
        color: AppColors.backgroundDark,
        elevation: 4,
        shadowColor: AppColors.shadowDark,
        shape: RoundedRectangleBorder(
          borderRadius: AppBorders.borderRadiusSm,
          side: const BorderSide(color: AppColors.primaryRed, width: AppBorders.borderWidthMedium),
        ),
        margin: AppSpacing.card,
      ),
      
      // Elevated Button Theme
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primaryRed,
          foregroundColor: AppColors.textWhite,
          padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
          minimumSize: const Size(120, 56), // Larger for crisis mode
          shape: RoundedRectangleBorder(
            borderRadius: AppBorders.borderRadiusSm,
          ),
          elevation: 4,
          textStyle: AppTextStyles.crisisButton,
        ),
      ),
      
      // Text Button Theme
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: AppColors.textWhite,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          minimumSize: const Size(88, 48),
          shape: RoundedRectangleBorder(
            borderRadius: AppBorders.borderRadiusSm,
          ),
          textStyle: AppTextStyles.buttonLarge.copyWith(color: AppColors.textWhite),
        ),
      ),
      
      // Input Decoration Theme
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.backgroundDark,
        contentPadding: AppSpacing.input,
        border: OutlineInputBorder(
          borderRadius: AppBorders.borderRadiusSm,
          borderSide: const BorderSide(color: AppColors.primaryRed, width: AppBorders.borderWidthMedium),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: AppBorders.borderRadiusSm,
          borderSide: const BorderSide(color: AppColors.primaryRed, width: AppBorders.borderWidthThin),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: AppBorders.borderRadiusSm,
          borderSide: const BorderSide(color: AppColors.accentYellow, width: AppBorders.borderWidthMedium),
        ),
        labelStyle: AppTextStyles.labelLarge.copyWith(color: AppColors.textLight),
        hintStyle: AppTextStyles.labelSmall.copyWith(color: AppColors.textTertiary),
      ),
      
      // Text Theme
      textTheme: TextTheme(
        displayLarge: AppTextStyles.crisisHeading,
        displayMedium: AppTextStyles.crisisHeading.withSize(24),
        displaySmall: AppTextStyles.crisisHeading.withSize(20),
        headlineLarge: AppTextStyles.h2.copyWith(color: AppColors.textWhite),
        headlineMedium: AppTextStyles.h3.copyWith(color: AppColors.textWhite),
        headlineSmall: AppTextStyles.h4.copyWith(color: AppColors.textWhite),
        bodyLarge: AppTextStyles.crisisBody,
        bodyMedium: AppTextStyles.bodyMedium.copyWith(color: AppColors.textLight),
        bodySmall: AppTextStyles.bodySmall.copyWith(color: AppColors.textTertiary),
        labelLarge: AppTextStyles.labelLarge.copyWith(color: AppColors.textLight),
        labelMedium: AppTextStyles.labelMedium.copyWith(color: AppColors.textLight),
        labelSmall: AppTextStyles.labelSmall.copyWith(color: AppColors.textTertiary),
      ),
      
      // Icon Theme
      iconTheme: const IconThemeData(
        color: AppColors.textWhite,
        size: 28,
      ),
      
      // Divider Theme
      dividerTheme: const DividerThemeData(
        color: AppColors.dividerDark,
        thickness: 1,
        space: 1,
      ),
      
      // Dialog Theme
      dialogTheme: DialogThemeData(
        backgroundColor: AppColors.backgroundDark,
        elevation: 8,
        shape: RoundedRectangleBorder(
          borderRadius: AppBorders.borderRadiusLg,
          side: const BorderSide(color: AppColors.primaryRed, width: AppBorders.borderWidthMedium),
        ),
        titleTextStyle: AppTextStyles.crisisHeading,
        contentTextStyle: AppTextStyles.crisisBody,
      ),
    );
  }

  // ============================================================================
  // KID MODE THEME (Light, Bright colors)
  // ============================================================================

  /// Get Kid Mode Theme - Friendly, bright colors for younger users
  static ThemeData get kidMode {
    // Use existing KidTheme but enhance with design system
    final baseTheme = KidTheme.getTheme();
    
    return baseTheme.copyWith(
      useMaterial3: true,
      cardTheme: CardThemeData(
        elevation: 4,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppBorders.radiusXl),
        ),
        margin: AppSpacing.cardLarge,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 20),
          minimumSize: const Size(120, 60),
          textStyle: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppBorders.radiusLg),
          ),
        ),
      ),
    );
  }

  // ============================================================================
  // THEME GETTERS
  // ============================================================================

  /// Get theme based on app mode
  static ThemeData getTheme(String mode) {
    switch (mode.toLowerCase()) {
      case 'crisis':
        return crisisMode;
      case 'kid':
      case 'kid_mode':
        return kidMode;
      case 'peace':
      default:
        return peaceMode;
    }
  }

  /// Get theme based on app mode enum
  static ThemeData getThemeFromEnum(dynamic mode) {
    final modeString = mode.toString().split('.').last;
    return getTheme(modeString);
  }
}

/// Backward compatibility - Use existing themes
/// These maintain compatibility with existing code while providing access to enhanced themes
class AppTheme {
  /// Get Peace Mode theme (using enhanced theme)
  static ThemeData get peaceMode => AppThemeEnhanced.peaceMode;

  /// Get Crisis Mode theme (using enhanced theme)
  static ThemeData get crisisMode => AppThemeEnhanced.crisisMode;

  /// Get Kid Mode theme (using enhanced theme)
  static ThemeData get kidMode => AppThemeEnhanced.kidMode;

  /// Get theme based on app mode
  static ThemeData getTheme(String mode) => AppThemeEnhanced.getTheme(mode);
}

