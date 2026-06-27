/// Phase 101.2: Split View Component
/// A split view layout widget

import 'package:flutter/material.dart';
import '../../design/design_system.dart';

/// Split View - Horizontal or vertical split layout
class SplitView extends StatelessWidget {
  /// Primary content
  final Widget primary;

  /// Secondary content
  final Widget secondary;

  /// Split direction
  final Axis direction;

  /// Split ratio (0.0 to 1.0)
  final double ratio;

  /// Minimum primary size
  final double? minPrimarySize;

  /// Minimum secondary size
  final double? minSecondarySize;

  /// Spacing between sections
  final double spacing;

  const SplitView({
    super.key,
    required this.primary,
    required this.secondary,
    this.direction = Axis.vertical,
    this.ratio = 0.5,
    this.minPrimarySize,
    this.minSecondarySize,
    this.spacing = 0,
  });

  @override
  Widget build(BuildContext context) {
    if (direction == Axis.horizontal) {
      return Row(
        children: [
          Expanded(
            flex: (ratio * 100).toInt(),
            child: ConstrainedBox(
              constraints: minPrimarySize != null
                  ? BoxConstraints(minWidth: minPrimarySize!)
                  : const BoxConstraints(),
              child: primary,
            ),
          ),
          if (spacing > 0) SizedBox(width: spacing),
          Expanded(
            flex: ((1 - ratio) * 100).toInt(),
            child: ConstrainedBox(
              constraints: minSecondarySize != null
                  ? BoxConstraints(minWidth: minSecondarySize!)
                  : const BoxConstraints(),
              child: secondary,
            ),
          ),
        ],
      );
    } else {
      return Column(
        children: [
          Expanded(
            flex: (ratio * 100).toInt(),
            child: ConstrainedBox(
              constraints: minPrimarySize != null
                  ? BoxConstraints(minHeight: minPrimarySize!)
                  : const BoxConstraints(),
              child: primary,
            ),
          ),
          if (spacing > 0) SizedBox(height: spacing),
          Expanded(
            flex: ((1 - ratio) * 100).toInt(),
            child: ConstrainedBox(
              constraints: minSecondarySize != null
                  ? BoxConstraints(minHeight: minSecondarySize!)
                  : const BoxConstraints(),
              child: secondary,
            ),
          ),
        ],
      );
    }
  }
}

/// Split View Builder - Builder version for dynamic split views
class SplitViewBuilder extends StatelessWidget {
  /// Primary builder
  final Widget Function(BuildContext, BoxConstraints) primaryBuilder;

  /// Secondary builder
  final Widget Function(BuildContext, BoxConstraints) secondaryBuilder;

  /// Split direction
  final Axis direction;

  /// Split ratio
  final double ratio;

  /// Minimum primary size
  final double? minPrimarySize;

  /// Minimum secondary size
  final double? minSecondarySize;

  /// Spacing
  final double spacing;

  const SplitViewBuilder({
    super.key,
    required this.primaryBuilder,
    required this.secondaryBuilder,
    this.direction = Axis.vertical,
    this.ratio = 0.5,
    this.minPrimarySize,
    this.minSecondarySize,
    this.spacing = 0,
  });

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final primaryConstraints = direction == Axis.horizontal
            ? BoxConstraints(
                maxWidth: (constraints.maxWidth * ratio) - spacing / 2,
                maxHeight: constraints.maxHeight,
              )
            : BoxConstraints(
                maxWidth: constraints.maxWidth,
                maxHeight: (constraints.maxHeight * ratio) - spacing / 2,
              );

        final secondaryConstraints = direction == Axis.horizontal
            ? BoxConstraints(
                maxWidth: (constraints.maxWidth * (1 - ratio)) - spacing / 2,
                maxHeight: constraints.maxHeight,
              )
            : BoxConstraints(
                maxWidth: constraints.maxWidth,
                maxHeight: (constraints.maxHeight * (1 - ratio)) - spacing / 2,
              );

        return SplitView(
          primary: primaryBuilder(context, primaryConstraints),
          secondary: secondaryBuilder(context, secondaryConstraints),
          direction: direction,
          ratio: ratio,
          spacing: spacing,
        );
      },
    );
  }
}

