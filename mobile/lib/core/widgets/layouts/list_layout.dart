/// Phase 101.2: List Layout Component
/// A styled list layout widget

import 'package:flutter/material.dart';
import '../../design/design_system.dart';

/// List Layout - Styled list layout
class ListLayout extends StatelessWidget {
  /// List items
  final List<Widget> children;

  /// Spacing between items
  final double spacing;

  /// Padding around list
  final EdgeInsets? padding;

  /// Whether to scroll
  final bool scrollable;

  /// Scroll direction
  final Axis scrollDirection;

  /// Whether to show dividers
  final bool showDividers;

  /// Divider color
  final Color? dividerColor;

  /// List separator widget
  final Widget? separator;

  const ListLayout({
    super.key,
    required this.children,
    this.spacing = 0,
    this.padding,
    this.scrollable = true,
    this.scrollDirection = Axis.vertical,
    this.showDividers = false,
    this.dividerColor,
    this.separator,
  });

  @override
  Widget build(BuildContext context) {
    Widget list;

    if (separator != null || showDividers) {
      list = ListView.separated(
        padding: padding ?? EdgeInsets.zero,
        itemCount: children.length,
        separatorBuilder: (context, index) =>
            separator ??
            Divider(
              height: spacing,
              color: dividerColor ?? AppColors.divider,
            ),
        itemBuilder: (context, index) => children[index],
        scrollDirection: scrollDirection,
        shrinkWrap: !scrollable,
        physics: scrollable
            ? const AlwaysScrollableScrollPhysics()
            : const NeverScrollableScrollPhysics(),
      );
    } else {
      list = ListView.builder(
        padding: padding ?? EdgeInsets.zero,
        itemCount: children.length,
        itemBuilder: (context, index) {
          if (spacing > 0 && index < children.length - 1) {
            return Column(
              children: [
                children[index],
                SizedBox(
                  height: spacing,
                  width: scrollDirection == Axis.horizontal ? spacing : double.infinity,
                ),
              ],
            );
          }
          return children[index];
        },
        scrollDirection: scrollDirection,
        shrinkWrap: !scrollable,
        physics: scrollable
            ? const AlwaysScrollableScrollPhysics()
            : const NeverScrollableScrollPhysics(),
      );
    }

    if (!scrollable) {
      return list;
    }

    return SingleChildScrollView(
      scrollDirection: scrollDirection,
      child: list,
    );
  }
}

