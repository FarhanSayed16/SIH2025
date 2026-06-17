/// Phase 101.1: Design System
/// Main entry point for the EduSafe design system
/// 
/// This file provides a single import point for all design system components:
/// - Colors
/// - Typography
/// - Spacing
/// - Borders & Shadows
/// - Theme Configuration
/// - Design Tokens

// Export all design system components
export 'colors.dart';
export 'typography.dart';
export 'spacing.dart';
export 'borders.dart';
export 'design_tokens.dart';
export 'app_theme.dart';

/// Design System
/// Main class providing access to the complete design system
class DesignSystem {
  DesignSystem._(); // Private constructor to prevent instantiation

  /// Design System Version
  static const String version = '1.0.0';
  
  /// Design System Name
  static const String name = 'EduSafe Design System';
  
  /// Design System Description
  static const String description = 
      'Comprehensive design system for EduSafe mobile app, including colors, '
      'typography, spacing, borders, and theme configurations.';

  // Quick access documentation
  static const Map<String, String> components = {
    'colors': 'AppColors - Color palette for Peace Mode, Crisis Mode, and all UI elements',
    'typography': 'AppTextStyles - Text styles for headings, body, buttons, labels',
    'spacing': 'AppSpacing - Consistent spacing scale for margins, padding, gaps',
    'borders': 'AppBorders & AppShadows - Border radius and shadow/elevation system',
    'theme': 'AppThemeEnhanced - Complete Material 3 theme configuration',
    'tokens': 'DesignSystem - Centralized design tokens',
  };
}

