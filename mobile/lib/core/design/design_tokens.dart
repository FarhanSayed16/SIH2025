/// Phase 101.1: Design Tokens
/// Centralized design system tokens for EduSafe mobile app
/// 
/// This file exports all design tokens from individual system files and provides
/// a single entry point for accessing the complete design system.

export 'colors.dart';
export 'typography.dart';
export 'spacing.dart';
export 'borders.dart';

/// Design System
/// Main entry point for the design system
class DesignSystem {
  DesignSystem._(); // Private constructor to prevent instantiation

  // Design system documentation
  static const String version = '1.0.0';
  static const String description = 'EduSafe Mobile App Design System';
  
  // Quick access to design tokens
  // Colors, Typography, Spacing, Borders are exported from their respective files
}

