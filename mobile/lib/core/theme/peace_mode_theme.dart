import 'package:flutter/material.dart';
import '../design/colors.dart';
import '../design/borders.dart';
import '../design/spacing.dart';

/// Peace Mode Theme — calm preparedness UI wired to AppColors tokens (B2).
class PeaceModeTheme {
  static Color get primaryGreen => AppColors.primaryGreen;
  static Color get primaryGreenDark => AppColors.primaryGreenDark;
  static Color get primaryGreenLight => AppColors.primaryGreenLight;
  static Color get accentBlue => AppColors.accentBlue;
  static Color get backgroundWhite => AppColors.backgroundWhite;
  static Color get backgroundLight => AppColors.backgroundLight;
  static Color get textPrimary => AppColors.textPrimary;
  static Color get textSecondary => AppColors.textSecondary;
  static Color get successColor => AppColors.success;
  static Color get warningColor => AppColors.warning;
  static Color get errorColor => AppColors.error;

  static ThemeData get theme {
    final colorScheme = ColorScheme.light(
      primary: AppColors.primaryGreen,
      onPrimary: AppColors.textOnPrimary,
      primaryContainer: AppColors.primaryGreenSubtle,
      onPrimaryContainer: AppColors.textPrimary,
      secondary: AppColors.accentBlue,
      onSecondary: AppColors.textOnSecondary,
      surface: AppColors.backgroundWhite,
      onSurface: AppColors.textPrimary,
      onSurfaceVariant: AppColors.textSecondary,
      error: AppColors.error,
      onError: AppColors.textOnPrimary,
      errorContainer: AppColors.errorBackground,
      outline: AppColors.borderMedium,
      outlineVariant: AppColors.borderLight,
    );

    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      colorScheme: colorScheme,
      scaffoldBackgroundColor: AppColors.backgroundLight,
      appBarTheme: AppBarTheme(
        backgroundColor: AppColors.primaryGreen,
        foregroundColor: AppColors.textOnPrimary,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: const TextStyle(
          fontSize: 20,
          fontWeight: FontWeight.w600,
          color: AppColors.textOnPrimary,
        ),
      ),
      cardTheme: CardThemeData(
        color: AppColors.backgroundWhite,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppBorders.radiusLg),
          side: const BorderSide(color: AppColors.borderLight, width: 1),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primaryGreen,
          foregroundColor: AppColors.textOnPrimary,
          minimumSize: const Size(48, 52),
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.xl,
            vertical: AppSpacing.md,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppBorders.radiusMd),
          ),
          textStyle: const TextStyle(
            inherit: false,
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: AppColors.primaryGreen,
          minimumSize: const Size(48, 48),
          textStyle: const TextStyle(
            inherit: false,
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      textTheme: const TextTheme(
        displayLarge: TextStyle(
          fontSize: 32,
          fontWeight: FontWeight.bold,
          color: AppColors.textPrimary,
        ),
        displayMedium: TextStyle(
          fontSize: 28,
          fontWeight: FontWeight.bold,
          color: AppColors.textPrimary,
        ),
        displaySmall: TextStyle(
          fontSize: 24,
          fontWeight: FontWeight.w700,
          color: AppColors.textPrimary,
        ),
        headlineLarge: TextStyle(
          fontSize: 22,
          fontWeight: FontWeight.w600,
          color: AppColors.textPrimary,
        ),
        headlineMedium: TextStyle(
          fontSize: 20,
          fontWeight: FontWeight.w600,
          color: AppColors.textPrimary,
        ),
        titleLarge: TextStyle(
          fontSize: 18,
          fontWeight: FontWeight.w600,
          color: AppColors.textPrimary,
        ),
        titleMedium: TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.w600,
          color: AppColors.textPrimary,
        ),
        bodyLarge: TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.w400,
          color: AppColors.textPrimary,
          height: 1.4,
        ),
        bodyMedium: TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w400,
          color: AppColors.textPrimary,
          height: 1.4,
        ),
        bodySmall: TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w400,
          color: AppColors.textSecondary,
          height: 1.35,
        ),
        labelLarge: TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.w600,
          color: AppColors.textPrimary,
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.backgroundWhite,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.lg,
          vertical: AppSpacing.md,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppBorders.radiusMd),
          borderSide: const BorderSide(color: AppColors.borderMedium),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppBorders.radiusMd),
          borderSide: const BorderSide(color: AppColors.borderMedium),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppBorders.radiusMd),
          borderSide: const BorderSide(color: AppColors.borderFocus, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppBorders.radiusMd),
          borderSide: const BorderSide(color: AppColors.borderError),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppBorders.radiusMd),
          borderSide: const BorderSide(color: AppColors.borderError, width: 2),
        ),
        labelStyle: const TextStyle(color: AppColors.textSecondary),
        hintStyle: const TextStyle(color: AppColors.textTertiary),
        errorStyle: const TextStyle(color: AppColors.error, fontSize: 13),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: AppColors.backgroundWhite,
        selectedItemColor: AppColors.primaryGreen,
        unselectedItemColor: AppColors.textSecondary,
        type: BottomNavigationBarType.fixed,
        elevation: 8,
        selectedLabelStyle: TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
        unselectedLabelStyle: TextStyle(fontSize: 12),
      ),
      dividerColor: AppColors.divider,
    );
  }
}
