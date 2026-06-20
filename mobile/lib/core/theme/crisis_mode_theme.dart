import 'package:flutter/material.dart';

/// Crisis Mode Theme - High contrast, emergency, red/black theme
class CrisisModeTheme {
  // Color Palette
  static const Color primaryRed = Color(0xFFD32F2F);
  static const Color primaryRedDark = Color(0xFFB71C1C);
  static const Color backgroundBlack = Color(0xFF000000);
  static const Color backgroundDark = Color(0xFF1A1A1A);
  static const Color textWhite = Color(0xFFFFFFFF);
  static const Color textLight = Color(0xFFE0E0E0);
  static const Color accentYellow = Color(0xFFFFEB3B);
  static const Color warningColor = Color(0xFFFF9800);

  static ThemeData get theme => ThemeData(
        useMaterial3: true,
        brightness: Brightness.dark,
        colorScheme: const ColorScheme.dark(
          primary: primaryRed,
          primaryContainer: primaryRedDark,
          secondary: accentYellow,
          surface: backgroundDark,
          background: backgroundBlack,
          error: primaryRed,
          onPrimary: Colors.white,
          onSecondary: Colors.black,
          onSurface: textWhite,
          onBackground: textWhite,
          onError: Colors.white,
        ),
        scaffoldBackgroundColor: backgroundBlack,
        appBarTheme: const AppBarTheme(
          backgroundColor: primaryRed,
          foregroundColor: Colors.white,
          elevation: 0,
          centerTitle: true,
        ),
        cardTheme: CardThemeData(
          color: backgroundDark,
          elevation: 4,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
            side: const BorderSide(color: primaryRed, width: 2),
          ),
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: primaryRed,
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8),
            ),
            elevation: 4,
          ),
        ),
        textTheme: const TextTheme(
          displayLarge: TextStyle(
            fontSize: 36,
            fontWeight: FontWeight.bold,
            color: textWhite,
            letterSpacing: 1.2,
          ),
          displayMedium: TextStyle(
            fontSize: 28,
            fontWeight: FontWeight.bold,
            color: textWhite,
            letterSpacing: 1.0,
          ),
          displaySmall: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            color: textWhite,
          ),
          headlineLarge: TextStyle(
            fontSize: 22,
            fontWeight: FontWeight.w700,
            color: textWhite,
          ),
          headlineMedium: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w700,
            color: textWhite,
          ),
          bodyLarge: TextStyle(
            fontSize: 18,
            color: textWhite,
            fontWeight: FontWeight.w500,
          ),
          bodyMedium: TextStyle(
            fontSize: 16,
            color: textLight,
          ),
          bodySmall: TextStyle(
            fontSize: 14,
            color: textLight,
          ),
        ),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: backgroundDark,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: const BorderSide(color: primaryRed, width: 2),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: const BorderSide(color: primaryRed),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: const BorderSide(color: accentYellow, width: 2),
          ),
        ),
        iconTheme: const IconThemeData(
          color: textWhite,
          size: 28,
        ),
      );
}

