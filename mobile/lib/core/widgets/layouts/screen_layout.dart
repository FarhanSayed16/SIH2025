/// Phase 101.2: Screen Layout Component
/// A consistent screen layout wrapper

import 'package:flutter/material.dart';
import '../../design/design_system.dart';

/// Screen Layout - Consistent screen layout wrapper
class ScreenLayout extends StatelessWidget {
  /// Screen content
  final Widget child;

  /// Screen padding
  final EdgeInsets? padding;

  /// Background color
  final Color? backgroundColor;

  /// Whether to use safe area (all sides by default)
  final bool useSafeArea;

  /// When true and [useSafeArea] is true, skip bottom inset —
  /// use when a parent shell already owns bottom navigation / FAB space.
  final bool excludeBottomSafeArea;

  /// App bar
  final PreferredSizeWidget? appBar;

  /// Bottom navigation bar
  final Widget? bottomNavigationBar;

  /// Floating action button
  final Widget? floatingActionButton;

  /// Drawer
  final Widget? drawer;

  /// Whether to show loading overlay
  final bool isLoading;

  /// Loading message
  final String? loadingMessage;

  const ScreenLayout({
    super.key,
    required this.child,
    this.padding,
    this.backgroundColor,
    this.useSafeArea = true,
    this.excludeBottomSafeArea = false,
    this.appBar,
    this.bottomNavigationBar,
    this.floatingActionButton,
    this.drawer,
    this.isLoading = false,
    this.loadingMessage,
  });

  /// Horizontal page padding: 16 below 600 width, 24 at/above.
  static EdgeInsets pagePaddingOf(BuildContext context) {
    final width = MediaQuery.sizeOf(context).width;
    final horizontal = width >= 600 ? AppSpacing.xl : AppSpacing.lg;
    return EdgeInsets.symmetric(horizontal: horizontal);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    Widget content = child;

    if (padding != null) {
      content = Padding(
        padding: padding!,
        child: content,
      );
    }

    if (useSafeArea) {
      content = SafeArea(
        bottom: !excludeBottomSafeArea && bottomNavigationBar == null,
        child: content,
      );
    }

    return Scaffold(
      backgroundColor:
          backgroundColor ?? theme.scaffoldBackgroundColor,
      appBar: appBar,
      drawer: drawer,
      bottomNavigationBar: bottomNavigationBar,
      floatingActionButton: floatingActionButton,
      body: Stack(
        children: [
          content,
          if (isLoading)
            Container(
              color: AppColors.overlayLight,
              child: Center(
                child: Card(
                  child: Padding(
                    padding: AppSpacing.cardLarge,
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        CircularProgressIndicator(
                          color: theme.colorScheme.primary,
                        ),
                        if (loadingMessage != null) ...[
                          SizedBox(height: AppSpacing.md),
                          Text(
                            loadingMessage!,
                            style: theme.textTheme.bodyMedium,
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
