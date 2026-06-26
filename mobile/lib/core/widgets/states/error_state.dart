/// Phase 101.2: Error State Component
/// Phase 101.9.4: Enhanced with user-friendly error messages
/// A styled error state widget

import 'package:flutter/material.dart';
import '../../design/design_system.dart';
import '../../utils/error_handler_utils.dart';
import '../buttons/primary_button.dart';

/// Error State - Error display with retry option
class ErrorState extends StatelessWidget {
  /// Error message
  final String message;

  /// Error title (optional)
  final String? title;

  /// Retry callback
  final VoidCallback? onRetry;

  /// Retry button label
  final String retryLabel;

  /// Error icon
  final IconData? icon;

  /// Whether to show as full screen
  final bool fullScreen;

  const ErrorState({
    super.key,
    required this.message,
    this.title,
    this.onRetry,
    this.retryLabel = 'Retry',
    this.icon,
    this.fullScreen = false,
  });

  @override
  Widget build(BuildContext context) {
    final content = Padding(
      padding: AppSpacing.screenEdge,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            icon ?? Icons.error_outline,
            size: 64,
            color: AppColors.error,
          ),
          SizedBox(height: AppSpacing.lg),
          if (title != null) ...[
            Text(
              title!,
              style: AppTextStyles.h3.copyWith(color: AppColors.textPrimary),
              textAlign: TextAlign.center,
            ),
            SizedBox(height: AppSpacing.sm),
          ],
          Text(
            message,
            style: AppTextStyles.bodyMedium.copyWith(
              color: AppColors.textSecondary,
            ),
            textAlign: TextAlign.center,
          ),
          if (onRetry != null) ...[
            SizedBox(height: AppSpacing.xl),
            PrimaryButton(
              label: retryLabel,
              onPressed: onRetry,
              fullWidth: false,
            ),
          ],
        ],
      ),
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

