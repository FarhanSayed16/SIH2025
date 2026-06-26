/// Phase 101.2: Section Layout Component
/// A section container with title and optional action

import 'package:flutter/material.dart';
import '../../design/design_system.dart';

/// Section Layout - Section container with title
class SectionLayout extends StatelessWidget {
  /// Section title
  final String? title;

  /// Section subtitle
  final String? subtitle;

  /// Section content
  final Widget child;

  /// Action widget (e.g., "See All" button)
  final Widget? action;

  /// Section padding
  final EdgeInsets? padding;

  /// Background color
  final Color? backgroundColor;

  /// Top margin
  final double? topMargin;

  /// Bottom margin
  final double? bottomMargin;

  const SectionLayout({
    super.key,
    this.title,
    this.subtitle,
    required this.child,
    this.action,
    this.padding,
    this.backgroundColor,
    this.topMargin,
    this.bottomMargin,
  });

  @override
  Widget build(BuildContext context) {
    Widget content = child;

    if (padding != null) {
      content = Padding(
        padding: padding!,
        child: content,
      );
    }

    return Container(
      margin: EdgeInsets.only(
        top: topMargin ?? 0,
        bottom: bottomMargin ?? AppSpacing.lg,
      ),
      color: backgroundColor,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (title != null || action != null)
            Padding(
              padding: padding ?? AppSpacing.screenHorizontal,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (title != null)
                          Text(
                            title!,
                            style: AppTextStyles.h4,
                          ),
                        if (subtitle != null) ...[
                          SizedBox(height: AppSpacing.xs),
                          Text(
                            subtitle!,
                            style: AppTextStyles.bodySmall,
                          ),
                        ],
                      ],
                    ),
                  ),
                  if (action != null) action!,
                ],
              ),
            ),
          content,
        ],
      ),
    );
  }
}

