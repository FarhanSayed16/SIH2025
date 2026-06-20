import 'package:flutter/material.dart';
import 'peace_mode_theme.dart';
import 'crisis_mode_theme.dart';

/// Base app theme configuration
class AppTheme {
  /// Get Peace Mode theme (default, friendly, gamified)
  static ThemeData get peaceMode => PeaceModeTheme.theme;

  /// Get Crisis Mode theme (high contrast, emergency)
  static ThemeData get crisisMode => CrisisModeTheme.theme;

  /// Get theme based on app mode
  static ThemeData getTheme(String mode) {
    switch (mode) {
      case 'crisis':
        return crisisMode;
      case 'peace':
      default:
        return peaceMode;
    }
  }
}

