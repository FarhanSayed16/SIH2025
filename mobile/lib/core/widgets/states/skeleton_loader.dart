/// Phase 101.2: Skeleton Loader Component
/// A skeleton/shimmer loading widget

import 'package:flutter/material.dart';
import '../../design/design_system.dart';
import 'dart:math' as math;

/// Skeleton Loader - Shimmer/skeleton loading effect
class SkeletonLoader extends StatefulWidget {
  /// Widget to show skeleton for
  final Widget child;

  /// Whether skeleton is active
  final bool isLoading;

  /// Shimmer color
  final Color? shimmerColor;

  /// Base color
  final Color? baseColor;

  const SkeletonLoader({
    super.key,
    required this.child,
    this.isLoading = true,
    this.shimmerColor,
    this.baseColor,
  });

  @override
  State<SkeletonLoader> createState() => _SkeletonLoaderState();
}

class _SkeletonLoaderState extends State<SkeletonLoader>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (!widget.isLoading) {
      return widget.child;
    }

    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return ShaderMask(
          shaderCallback: (bounds) {
            return LinearGradient(
              begin: Alignment(-1.0 - _controller.value * 2, 0),
              end: Alignment(1.0 - _controller.value * 2, 0),
              colors: [
                widget.baseColor ?? AppColors.backgroundMedium,
                widget.shimmerColor ?? AppColors.backgroundLight,
                widget.baseColor ?? AppColors.backgroundMedium,
              ],
            ).createShader(bounds);
          },
          child: widget.child,
        );
      },
    );
  }
}

/// Skeleton Box - Individual skeleton box
class SkeletonBox extends StatelessWidget {
  /// Box width
  final double? width;

  /// Box height
  final double? height;

  /// Border radius
  final BorderRadius? borderRadius;

  const SkeletonBox({
    super.key,
    this.width,
    this.height,
    this.borderRadius,
  });

  @override
  Widget build(BuildContext context) {
    return SkeletonLoader(
      child: Container(
        width: width ?? double.infinity,
        height: height ?? 20,
        decoration: BoxDecoration(
          color: AppColors.backgroundMedium,
          borderRadius: borderRadius ?? AppBorders.borderRadiusXs,
        ),
      ),
    );
  }
}

/// Skeleton Card - Skeleton loading for cards
class SkeletonCard extends StatelessWidget {
  /// Number of lines
  final int lines;

  const SkeletonCard({
    super.key,
    this.lines = 3,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      color: AppColors.backgroundWhite,
      elevation: 2,
      child: Padding(
        padding: AppSpacing.card,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SkeletonBox(width: double.infinity, height: 20),
            ...List.generate(
              lines,
              (index) => Padding(
                padding: EdgeInsets.only(
                  top: AppSpacing.sm,
                ),
                child: SkeletonBox(
                  width: index == lines - 1 ? 150 : double.infinity,
                  height: 16,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

