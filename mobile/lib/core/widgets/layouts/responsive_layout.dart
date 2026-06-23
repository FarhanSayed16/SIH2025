/// Phase 101.9.6: Responsive Layout Component
/// Responsive layout wrapper for different screen sizes

import 'package:flutter/material.dart';
import '../../utils/responsive_utils.dart';

/// Responsive Layout - Adapts to screen size
class ResponsiveLayout extends StatelessWidget {
  /// Mobile layout
  final Widget mobile;

  /// Tablet layout (optional, defaults to mobile)
  final Widget? tablet;

  /// Desktop layout (optional, defaults to tablet or mobile)
  final Widget? desktop;

  const ResponsiveLayout({
    super.key,
    required this.mobile,
    this.tablet,
    this.desktop,
  });

  @override
  Widget build(BuildContext context) {
    if (ResponsiveUtils.isDesktop(context)) {
      return desktop ?? tablet ?? mobile;
    } else if (ResponsiveUtils.isTablet(context)) {
      return tablet ?? mobile;
    } else {
      return mobile;
    }
  }
}

/// Responsive Container - Container with responsive padding
class ResponsiveContainer extends StatelessWidget {
  /// Child widget
  final Widget child;

  /// Whether to apply max width constraint
  final bool constrainWidth;

  /// Custom padding override
  final EdgeInsets? padding;

  const ResponsiveContainer({
    super.key,
    required this.child,
    this.constrainWidth = true,
    this.padding,
  });

  @override
  Widget build(BuildContext context) {
    final responsivePadding = padding ?? ResponsiveUtils.responsivePadding(context);
    final maxWidth = constrainWidth ? ResponsiveUtils.getMaxContentWidth(context) : double.infinity;

    return Container(
      width: double.infinity,
      constraints: BoxConstraints(maxWidth: maxWidth),
      padding: responsivePadding,
      child: child,
    );
  }
}

/// Responsive Grid - Grid that adapts column count
class ResponsiveGrid extends StatelessWidget {
  /// Children widgets
  final List<Widget> children;

  /// Spacing between items
  final double spacing;

  /// Child aspect ratio
  final double childAspectRatio;

  const ResponsiveGrid({
    super.key,
    required this.children,
    this.spacing = 12.0,
    this.childAspectRatio = 1.0,
  });

  @override
  Widget build(BuildContext context) {
    final crossAxisCount = ResponsiveUtils.responsiveColumnCount(context);

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: crossAxisCount,
        crossAxisSpacing: spacing,
        mainAxisSpacing: spacing,
        childAspectRatio: childAspectRatio,
      ),
      itemCount: children.length,
      itemBuilder: (context, index) => children[index],
    );
  }
}

