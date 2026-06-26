/// Phase 101.2: Custom App Bar Component
/// A styled app bar with consistent design

import 'package:flutter/material.dart';
import '../../design/design_system.dart';

/// Custom App Bar - Enhanced app bar with consistent styling
class AppBarCustom extends StatelessWidget implements PreferredSizeWidget {
  /// App bar title
  final String? title;

  /// Title widget (alternative to title string)
  final Widget? titleWidget;

  /// Leading widget (default: back button)
  final Widget? leading;

  /// Whether to automatically show back button
  final bool automaticallyImplyLeading;

  /// Actions list
  final List<Widget>? actions;

  /// Whether app bar is elevated
  final bool elevated;

  /// Background color
  final Color? backgroundColor;

  /// Foreground color
  final Color? foregroundColor;

  /// Search field (if provided, shows search instead of title)
  final Widget? searchField;

  /// Profile avatar
  final Widget? avatar;

  /// Callback when avatar is tapped
  final VoidCallback? onAvatarTap;

  const AppBarCustom({
    super.key,
    this.title,
    this.titleWidget,
    this.leading,
    this.automaticallyImplyLeading = true,
    this.actions,
    this.elevated = false,
    this.backgroundColor,
    this.foregroundColor,
    this.searchField,
    this.avatar,
    this.onAvatarTap,
  }) : assert(title == null || titleWidget == null, 'Cannot provide both title and titleWidget');

  @override
  Widget build(BuildContext context) {
    return AppBar(
      title: searchField ?? titleWidget ?? (title != null ? Text(title!) : null),
      leading: leading,
      automaticallyImplyLeading: automaticallyImplyLeading,
      elevation: elevated ? 2 : 0,
      backgroundColor: backgroundColor ?? AppColors.primaryGreen,
      foregroundColor: foregroundColor ?? AppColors.textWhite,
      centerTitle: true,
      actions: [
        ...?actions,
        if (avatar != null)
          GestureDetector(
            onTap: onAvatarTap,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm),
              child: avatar,
            ),
          ),
      ],
    );
  }

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);
}

