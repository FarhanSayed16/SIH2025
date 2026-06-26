/// Phase 101.2: Loading State Component
/// A styled loading state widget

import 'package:flutter/material.dart';
import '../../design/design_system.dart';

/// Loading State - Full screen or inline loading indicator
class LoadingState extends StatelessWidget {
  /// Loading message
  final String? message;

  /// Whether to show as full screen overlay
  final bool fullScreen;

  /// Loading color
  final Color? color;

  const LoadingState({
    super.key,
    this.message,
    this.fullScreen = false,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    final content = Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        CircularProgressIndicator(
          valueColor: AlwaysStoppedAnimation<Color>(
            color ?? AppColors.primaryGreen,
          ),
        ),
        if (message != null) ...[
          SizedBox(height: AppSpacing.md),
          Text(
            message!,
            style: AppTextStyles.bodyMedium,
            textAlign: TextAlign.center,
          ),
        ],
      ],
    );

    if (fullScreen) {
      return Scaffold(
        backgroundColor: AppColors.backgroundLight,
        body: Center(child: content),
      );
    }

    return Center(child: content);
  }
}

