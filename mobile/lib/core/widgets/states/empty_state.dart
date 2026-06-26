/// Phase 101.2: Empty State Component
/// A styled empty state widget

import 'package:flutter/material.dart';
import '../../design/design_system.dart';
import '../buttons/primary_button.dart';

/// Empty State - Empty state display
class EmptyState extends StatelessWidget {
  /// Empty state message
  final String message;

  /// Empty state title
  final String? title;

  /// Icon to display
  final IconData icon;

  /// Icon color
  final Color? iconColor;

  /// Action button label
  final String? actionLabel;

  /// Action callback
  final VoidCallback? onAction;

  /// Whether to show as full screen
  final bool fullScreen;

  const EmptyState({
    super.key,
    required this.message,
    this.title,
    this.icon = Icons.inbox_outlined,
    this.iconColor,
    this.actionLabel,
    this.onAction,
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
            icon,
            size: 64,
            color: iconColor ?? AppColors.textSecondary,
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

