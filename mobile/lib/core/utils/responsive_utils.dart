/// Phase 101.9.6: Responsive Design Utilities
/// Utilities for responsive layouts and screen size adaptation

import 'package:flutter/material.dart';

/// Responsive breakpoints
class Breakpoints {
  static const double mobile = 600;
  static const double tablet = 900;
  static const double desktop = 1200;
}

/// Screen size categories
enum ScreenSize {
  mobile,
  tablet,
  desktop,
}

/// Responsive utilities
class ResponsiveUtils {
  /// Get screen size category
  static ScreenSize getScreenSize(BuildContext context) {
    final width = MediaQuery.of(context).size.width;
    if (width >= Breakpoints.desktop) {
      return ScreenSize.desktop;
    } else if (width >= Breakpoints.tablet) {
      return ScreenSize.tablet;
    } else {
      return ScreenSize.mobile;
    }
  }

  /// Check if is mobile
  static bool isMobile(BuildContext context) {
    return getScreenSize(context) == ScreenSize.mobile;
  }

  /// Check if is tablet
  static bool isTablet(BuildContext context) {
    return getScreenSize(context) == ScreenSize.tablet;
  }

  /// Check if is desktop
  static bool isDesktop(BuildContext context) {
    return getScreenSize(context) == ScreenSize.desktop;
  }

  /// Get responsive value based on screen size
  static T responsive<T>({
    required BuildContext context,
    required T mobile,
    T? tablet,
    T? desktop,
  }) {
    final screenSize = getScreenSize(context);
    switch (screenSize) {
      case ScreenSize.desktop:
        return desktop ?? tablet ?? mobile;
      case ScreenSize.tablet:
        return tablet ?? mobile;
      case ScreenSize.mobile:
        return mobile;
    }
  }

  /// Get responsive padding
  static EdgeInsets responsivePadding(BuildContext context) {
    final screenSize = getScreenSize(context);
    switch (screenSize) {
      case ScreenSize.desktop:
        return const EdgeInsets.symmetric(horizontal: 48, vertical: 24);
      case ScreenSize.tablet:
        return const EdgeInsets.symmetric(horizontal: 32, vertical: 20);
      case ScreenSize.mobile:
        return const EdgeInsets.symmetric(horizontal: 16, vertical: 16);
    }
  }

  /// Get responsive column count for grids
  static int responsiveColumnCount(BuildContext context) {
    final screenSize = getScreenSize(context);
    switch (screenSize) {
      case ScreenSize.desktop:
        return 4;
      case ScreenSize.tablet:
        return 3;
      case ScreenSize.mobile:
        return 2;
    }
  }

  /// Get responsive font scale
  static double responsiveFontScale(BuildContext context) {
    final screenSize = getScreenSize(context);
    switch (screenSize) {
      case ScreenSize.desktop:
        return 1.2;
      case ScreenSize.tablet:
        return 1.1;
      case ScreenSize.mobile:
        return 1.0;
    }
  }

  /// Check if in landscape orientation
  static bool isLandscape(BuildContext context) {
    return MediaQuery.of(context).orientation == Orientation.landscape;
  }

  /// Get max content width for readability
  static double getMaxContentWidth(BuildContext context) {
    final screenSize = getScreenSize(context);
    switch (screenSize) {
      case ScreenSize.desktop:
        return 1200;
      case ScreenSize.tablet:
        return 800;
      case ScreenSize.mobile:
        return double.infinity;
    }
  }
}

