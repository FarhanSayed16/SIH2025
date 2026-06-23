/// Phase 101.2: Grid Layout Component
/// A responsive grid layout widget

import 'package:flutter/material.dart';
import '../../design/design_system.dart';

/// Grid Layout - Responsive grid layout
class GridLayout extends StatelessWidget {
  /// Grid items
  final List<Widget> children;

  /// Number of columns (default: 2)
  final int crossAxisCount;

  /// Child aspect ratio
  final double childAspectRatio;

  /// Spacing between items
  final double spacing;

  /// Run spacing (vertical spacing)
  final double runSpacing;

  /// Padding around grid
  final EdgeInsets? padding;

  /// Whether to scroll
  final bool scrollable;

  /// Scroll direction
  final Axis scrollDirection;

  const GridLayout({
    super.key,
    required this.children,
    this.crossAxisCount = 2,
    this.childAspectRatio = 1.0,
    this.spacing = AppSpacing.md,
    this.runSpacing = AppSpacing.md,
    this.padding,
    this.scrollable = true,
    this.scrollDirection = Axis.vertical,
  });

  @override
  Widget build(BuildContext context) {
    final gridView = GridView.builder(
      padding: padding ?? EdgeInsets.zero,
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: crossAxisCount,
        childAspectRatio: childAspectRatio,
        crossAxisSpacing: spacing,
        mainAxisSpacing: runSpacing,
      ),
      itemCount: children.length,
      itemBuilder: (context, index) => children[index],
      scrollDirection: scrollDirection,
      shrinkWrap: !scrollable,
      physics: scrollable ? const AlwaysScrollableScrollPhysics() : const NeverScrollableScrollPhysics(),
    );

    if (!scrollable) {
      return gridView;
    }

    return SingleChildScrollView(
      scrollDirection: scrollDirection,
      child: gridView,
    );
  }
}

