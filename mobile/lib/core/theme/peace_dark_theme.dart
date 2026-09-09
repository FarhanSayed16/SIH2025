import 'package:flutter/material.dart';
import '../design/colors.dart';
import '../design/borders.dart';
import '../design/spacing.dart';

/// Peace Mode dark appearance — ordinary dark UI (B9).
/// Distinct from Crisis Mode (emergency product state).
class PeaceDarkTheme {
  static const Color _canvas = Color(0xFF121A15);
  static const Color _surface = Color(0xFF1C2620);
  static const Color _surfaceElevated = Color(0xFF243028);
  static const Color _onSurface = Color(0xFFE8EEE9);
  static const Color _onSurfaceVariant = Color(0xFFA8B5AD);
  static const Color _outline = Color(0xFF3D4A42);
  static const Color _primaryContainer = Color(0xFF1F3D28);

  static ThemeData get theme {
    final colorScheme = ColorScheme.dark(
      primary: AppColors.primaryGreenLight,
      onPrimary: const Color(0xFF0B160F),
      primaryContainer: _primaryContainer,
      onPrimaryContainer: _onSurface,
      secondary: AppColors.accentBlueLight,
      onSecondary: const Color(0xFF0B160F),
      surface: _surface,
      onSurface: _onSurface,
      onSurfaceVariant: _onSurfaceVariant,
      error: AppColors.primaryRedLight,
      onError: const Color(0xFF1A0505),
      errorContainer: const Color(0xFF4A1C1A),
      outline: _outline,
      outlineVariant: const Color(0xFF2E3933),
    );

    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      colorScheme: colorScheme,
      scaffoldBackgroundColor: _canvas,
      appBarTheme: AppBarTheme(
        backgroundColor: AppColors.primaryGreenDark,
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
        color: _surfaceElevated,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppBorders.radiusMd),
          side: const BorderSide(color: _outline),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primaryGreenLight,
          foregroundColor: const Color(0xFF0B160F),
          minimumSize: const Size(48, 52),
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.xl,
            vertical: AppSpacing.md,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppBorders.radiusMd),
          ),
          textStyle: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: AppColors.primaryGreenLight,
          minimumSize: const Size(48, 48),
          textStyle: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      textTheme: const TextTheme(
        displayLarge: TextStyle(
          fontSize: 32,
          fontWeight: FontWeight.bold,
          color: _onSurface,
        ),
        displayMedium: TextStyle(
          fontSize: 28,
          fontWeight: FontWeight.bold,
          color: _onSurface,
        ),
        displaySmall: TextStyle(
          fontSize: 24,
          fontWeight: FontWeight.w700,
          color: _onSurface,
        ),
        headlineLarge: TextStyle(
          fontSize: 22,
          fontWeight: FontWeight.w600,
          color: _onSurface,
        ),
        headlineMedium: TextStyle(
          fontSize: 20,
          fontWeight: FontWeight.w600,
          color: _onSurface,
        ),
        titleLarge: TextStyle(
          fontSize: 18,
          fontWeight: FontWeight.w600,
          color: _onSurface,
        ),
        titleMedium: TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.w600,
          color: _onSurface,
        ),
        bodyLarge: TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.w400,
          color: _onSurface,
          height: 1.4,
        ),
        bodyMedium: TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w400,
          color: _onSurface,
          height: 1.4,
        ),
        bodySmall: TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w400,
          color: _onSurfaceVariant,
          height: 1.35,
        ),
        labelLarge: TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.w600,
          color: _onSurface,
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: _surfaceElevated,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.lg,
          vertical: AppSpacing.md,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppBorders.radiusMd),
          borderSide: const BorderSide(color: _outline),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppBorders.radiusMd),
          borderSide: const BorderSide(color: _outline),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppBorders.radiusMd),
          borderSide: const BorderSide(
            color: AppColors.primaryGreenLight,
            width: 2,
          ),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppBorders.radiusMd),
          borderSide: const BorderSide(color: AppColors.primaryRedLight),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppBorders.radiusMd),
          borderSide: const BorderSide(
            color: AppColors.primaryRedLight,
            width: 2,
          ),
        ),
        labelStyle: const TextStyle(color: _onSurfaceVariant),
        hintStyle: const TextStyle(color: _onSurfaceVariant),
        errorStyle: const TextStyle(color: AppColors.primaryRedLight, fontSize: 13),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: _surface,
        selectedItemColor: AppColors.primaryGreenLight,
        unselectedItemColor: _onSurfaceVariant,
        type: BottomNavigationBarType.fixed,
        elevation: 8,
        selectedLabelStyle: TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
        unselectedLabelStyle: TextStyle(fontSize: 12),
      ),
      dividerColor: _outline,
      dialogTheme: DialogThemeData(
        backgroundColor: _surfaceElevated,
      ),
    );
  }
}
