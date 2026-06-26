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

  /// Whether to use safe area
  final bool useSafeArea;

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
    this.appBar,
    this.bottomNavigationBar,
    this.floatingActionButton,
    this.drawer,
    this.isLoading = false,
    this.loadingMessage,
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

    if (useSafeArea) {
      content = SafeArea(child: content);
    }

    return Scaffold(
      backgroundColor: backgroundColor ?? AppColors.backgroundLight,
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
                          color: AppColors.primaryGreen,
                        ),
                        if (loadingMessage != null) ...[
                          SizedBox(height: AppSpacing.md),
                          Text(
                            loadingMessage!,
                            style: AppTextStyles.bodyMedium,
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

