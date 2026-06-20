/// Phase 101.9.2: Accessibility Utilities
/// Utilities for accessibility enhancements

import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart';

/// Accessibility utilities
class AccessibilityUtils {
  /// Minimum touch target size (44x44 points as per iOS/Android guidelines)
  static const double minTouchTarget = 44.0;

  /// Ensure widget meets minimum touch target size
  static Widget ensureMinSize(Widget child) {
    return ConstrainedBox(
      constraints: const BoxConstraints(
        minWidth: minTouchTarget,
        minHeight: minTouchTarget,
      ),
      child: child,
    );
  }

  /// Add semantic label for screen readers
  static Widget addSemanticLabel({
    required Widget child,
    required String label,
    String? hint,
    bool? isButton,
    bool? isHeader,
  }) {
    return Semantics(
      label: label,
      hint: hint,
      button: isButton ?? false,
      header: isHeader ?? false,
      child: child,
    );
  }

  /// Wrap with accessibility features
  static Widget wrapAccessible({
    required Widget child,
    required String label,
    String? hint,
    String? tooltip,
    bool? isButton,
    bool? isHeader,
    VoidCallback? onTap,
  }) {
    Widget widget = Semantics(
      label: label,
      hint: hint,
      tooltip: tooltip,
      button: isButton ?? false,
      header: isHeader ?? false,
      onTap: onTap,
      child: child,
    );

    if (tooltip != null) {
      widget = Tooltip(
        message: tooltip,
        child: widget,
      );
    }

    return ensureMinSize(widget);
  }

  /// Check if screen reader is enabled (approximation)
  static bool isScreenReaderEnabled(BuildContext context) {
    // Note: This is an approximation. Actual screen reader detection
    // requires platform-specific code or accessibility services.
    final mediaQuery = MediaQuery.of(context);
    // If text scale factor is very high, might indicate screen reader usage
    return mediaQuery.textScaler.scale(16) > 1.5;
  }

  /// Get high contrast colors
  static ColorScheme getHighContrastColors(bool isDark) {
    if (isDark) {
      return const ColorScheme.dark(
        primary: Colors.white,
        onPrimary: Colors.black,
        secondary: Colors.white,
        onSecondary: Colors.black,
      );
    } else {
      return const ColorScheme.light(
        primary: Colors.black,
        onPrimary: Colors.white,
        secondary: Colors.black,
        onSecondary: Colors.white,
      );
    }
  }

  /// Announce message to screen readers
  static void announce(BuildContext context, String message) {
    SemanticsService.announce(message, TextDirection.ltr);
  }
}

