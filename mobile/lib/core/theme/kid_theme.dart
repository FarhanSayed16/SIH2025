import 'package:flutter/material.dart';

/// Kid-Friendly Theme
/// Phase 2.5: K-12 Multi-Access
/// Designed for KG-5th grade students
class KidTheme {
  static ThemeData getTheme() {
    return ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: Colors.blue,
        brightness: Brightness.light,
        primary: const Color(0xFF2196F3), // Bright blue
        secondary: const Color(0xFFFF9800), // Bright orange
        tertiary: const Color(0xFF4CAF50), // Bright green
        error: const Color(0xFFF44336), // Bright red
        surface: Colors.white,
        onPrimary: Colors.white,
        onSecondary: Colors.white,
        onTertiary: Colors.white,
        onError: Colors.white,
        onSurface: Colors.black87,
      ),
      scaffoldBackgroundColor: const Color(0xFFF5F5F5),
      
      // Large text for readability
      textTheme: const TextTheme(
        displayLarge: TextStyle(fontSize: 48, fontWeight: FontWeight.bold, color: Colors.black87),
        displayMedium: TextStyle(fontSize: 36, fontWeight: FontWeight.bold, color: Colors.black87),
        displaySmall: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Colors.black87),
        headlineLarge: TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: Colors.black87),
        headlineMedium: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Colors.black87),
        headlineSmall: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.black87),
        titleLarge: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.black87),
        titleMedium: TextStyle(fontSize: 20, fontWeight: FontWeight.w600, color: Colors.black87),
        titleSmall: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: Colors.black87),
        bodyLarge: TextStyle(fontSize: 18, color: Colors.black87),
        bodyMedium: TextStyle(fontSize: 16, color: Colors.black87),
        bodySmall: TextStyle(fontSize: 14, color: Colors.black87),
        labelLarge: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: Colors.black87),
        labelMedium: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Colors.black87),
        labelSmall: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.black87),
      ),

      // Large buttons
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 20),
          minimumSize: const Size(120, 60),
          textStyle: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
        ),
      ),

      // Large icon buttons
      iconButtonTheme: IconButtonThemeData(
        style: IconButton.styleFrom(
          padding: const EdgeInsets.all(16),
          minimumSize: const Size(64, 64),
          iconSize: 32,
        ),
      ),

      // Large floating action buttons
      floatingActionButtonTheme: const FloatingActionButtonThemeData(
        elevation: 8,
      ),

      // Card theme with rounded corners
      cardTheme: CardThemeData(
        elevation: 4,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
        margin: const EdgeInsets.all(12),
      ),

      // App bar theme
      appBarTheme: const AppBarTheme(
        centerTitle: true,
        elevation: 0,
        titleTextStyle: TextStyle(
          fontSize: 24,
          fontWeight: FontWeight.bold,
          color: Colors.white,
        ),
      ),

      // Input decoration with large text
      inputDecorationTheme: InputDecorationTheme(
        contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(width: 2),
        ),
        filled: true,
        fillColor: Colors.white,
        labelStyle: const TextStyle(fontSize: 18),
        hintStyle: const TextStyle(fontSize: 18),
      ),
    );
  }

  // Kid-friendly colors
  static const Color primaryColor = Color(0xFF2196F3);
  static const Color secondaryColor = Color(0xFFFF9800);
  static const Color successColor = Color(0xFF4CAF50);
  static const Color warningColor = Color(0xFFFFC107);
  static const Color errorColor = Color(0xFFF44336);
  static const Color infoColor = Color(0xFF00BCD4);
}

