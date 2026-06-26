/// Phase 101.2: Success State Component
/// A styled success state widget

import 'package:flutter/material.dart';
import '../../design/design_system.dart';
import '../buttons/primary_button.dart';

/// Success State - Success display
class SuccessState extends StatelessWidget {
  /// Success message
  final String message;

  /// Success title (optional)
  final String? title;

  /// Action button label
  final String? actionLabel;

  /// Action callback
  final VoidCallback? onAction;

  /// Icon to display
  final IconData? icon;

  /// Whether to show as full screen
  final bool fullScreen;

  /// Auto dismiss duration (null = no auto dismiss)
  final Duration? autoDismiss;

  const SuccessState({
    super.key,
    required this.message,
    this.title,
    this.actionLabel,
    this.onAction,
    this.icon,
    this.fullScreen = false,
    this.autoDismiss,
  });

  @override
  Widget build(BuildContext context) {
    if (autoDismiss != null && onAction != null) {
      Future.delayed(autoDismiss!, () {
        if (context.mounted) onAction?.call();
      });
    }

    final content = Padding(
      padding: AppSpacing.screenEdge,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.all(AppSpacing.lg),
            decoration: BoxDecoration(
              color: AppColors.successBackground,
              shape: BoxShape.circle,
            ),
            child: Icon(
              icon ?? Icons.check_circle_outline,
              size: 64,
              color: AppColors.success,
            ),
          ),
          SizedBox(height: AppSpacing.xl),
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
          if (actionLabel != null && onAction != null) ...[
            SizedBox(height: AppSpacing.xl),
            PrimaryButton(
              label: actionLabel!,
              onPressed: onAction,
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

