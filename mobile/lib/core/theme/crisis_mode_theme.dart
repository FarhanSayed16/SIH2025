import 'package:flutter/material.dart';
import '../design/colors.dart';
import '../design/borders.dart';
import '../design/spacing.dart';

/// Crisis Mode Theme — high-contrast emergency UI (product state, not dark mode).
/// Wired to AppColors for B2 legibility; do not use as ThemeMode.dark.
class CrisisModeTheme {
  static Color get primaryRed => AppColors.primaryRed;
  static Color get primaryRedDark => AppColors.primaryRedDark;
  static Color get backgroundBlack => AppColors.backgroundBlack;
  static Color get backgroundDark => AppColors.backgroundDark;
  static Color get textWhite => AppColors.textWhite;
  static Color get textLight => AppColors.textLight;
  static Color get accentYellow => AppColors.accentYellow;
  static Color get warningColor => AppColors.accentOrange;

  static ThemeData get theme {
    const colorScheme = ColorScheme.dark(
      primary: AppColors.primaryRed,
      onPrimary: AppColors.textWhite,
      primaryContainer: AppColors.primaryRedDark,
      onPrimaryContainer: AppColors.textWhite,
      secondary: AppColors.accentYellow,
      onSecondary: AppColors.backgroundBlack,
      surface: AppColors.backgroundDark,
      onSurface: AppColors.textWhite,
      onSurfaceVariant: AppColors.textLight,
      error: AppColors.primaryRed,
      onError: AppColors.textWhite,
      outline: AppColors.accentYellow,
      outlineVariant: AppColors.primaryRedLight,
    );

    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      colorScheme: colorScheme,
      scaffoldBackgroundColor: AppColors.backgroundBlack,
      appBarTheme: const AppBarTheme(
        backgroundColor: AppColors.primaryRed,
        foregroundColor: AppColors.textWhite,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: TextStyle(
          fontSize: 20,
          fontWeight: FontWeight.w700,
          color: AppColors.textWhite,
        ),
      ),
      cardTheme: CardThemeData(
        color: AppColors.backgroundDark,
        elevation: 2,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppBorders.radiusMd),
          side: const BorderSide(color: AppColors.primaryRed, width: 2),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primaryRed,
          foregroundColor: AppColors.textWhite,
          minimumSize: const Size(48, 52),
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.xxl,
            vertical: AppSpacing.lg,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppBorders.radiusMd),
          ),
          elevation: 4,
          textStyle: const TextStyle(
            inherit: false,
            fontSize: 16,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: AppColors.accentYellow,
          minimumSize: const Size(48, 48),
        ),
      ),
      textTheme: const TextTheme(
        displayLarge: TextStyle(
          fontSize: 36,
          fontWeight: FontWeight.bold,
          color: AppColors.textWhite,
          letterSpacing: 1.2,
        ),
        displayMedium: TextStyle(
          fontSize: 28,
          fontWeight: FontWeight.bold,
          color: AppColors.textWhite,
          letterSpacing: 1.0,
        ),
        displaySmall: TextStyle(
          fontSize: 24,
          fontWeight: FontWeight.bold,
          color: AppColors.textWhite,
        ),
        headlineLarge: TextStyle(
          fontSize: 22,
          fontWeight: FontWeight.w700,
          color: AppColors.textWhite,
        ),
        headlineMedium: TextStyle(
          fontSize: 20,
          fontWeight: FontWeight.w700,
          color: AppColors.textWhite,
        ),
        titleLarge: TextStyle(
          fontSize: 18,
          fontWeight: FontWeight.w700,
          color: AppColors.textWhite,
        ),
        bodyLarge: TextStyle(
          fontSize: 18,
          color: AppColors.textWhite,
          fontWeight: FontWeight.w500,
          height: 1.35,
        ),
        bodyMedium: TextStyle(
          fontSize: 16,
          color: AppColors.textLight,
          height: 1.35,
        ),
        bodySmall: TextStyle(
          fontSize: 14,
          color: AppColors.textLight,
          height: 1.35,
        ),
        labelLarge: TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.w700,
          color: AppColors.textWhite,
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.backgroundDark,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.lg,
          vertical: AppSpacing.md,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppBorders.radiusMd),
          borderSide: const BorderSide(color: AppColors.primaryRed, width: 2),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppBorders.radiusMd),
          borderSide: const BorderSide(color: AppColors.primaryRed),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppBorders.radiusMd),
          borderSide: const BorderSide(color: AppColors.accentYellow, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppBorders.radiusMd),
          borderSide: const BorderSide(color: AppColors.accentYellow, width: 2),
        ),
        labelStyle: const TextStyle(color: AppColors.textLight),
        hintStyle: TextStyle(color: AppColors.textLight.withValues(alpha: 0.7)),
        errorStyle: const TextStyle(color: AppColors.accentYellow, fontSize: 14),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: AppColors.backgroundDark,
        selectedItemColor: AppColors.accentYellow,
        unselectedItemColor: AppColors.textLight,
        type: BottomNavigationBarType.fixed,
        elevation: 8,
      ),
      iconTheme: const IconThemeData(
        color: AppColors.textWhite,
        size: 28,
      ),
      dividerColor: AppColors.primaryRedDark,
    );
  }
}
