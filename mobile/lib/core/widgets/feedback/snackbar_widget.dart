/// Phase 101.2: Snackbar Widget Component
/// A styled snackbar notification widget

import 'package:flutter/material.dart';
import '../../design/design_system.dart';

/// Snackbar type
enum SnackbarType {
  info,
  success,
  warning,
  error,
}

/// Snackbar Widget - Snackbar notification helper
class SnackbarWidget {
  /// Show snackbar
  static void show(
    BuildContext context, {
    required String message,
    SnackbarType type = SnackbarType.info,
    Duration duration = const Duration(seconds: 3),
    String? actionLabel,
    VoidCallback? onAction,
  }) {
    final colors = _getColorsForType(type);
    final icon = _getIconForType(type);

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            Icon(icon, color: AppColors.textWhite, size: 24),
            SizedBox(width: AppSpacing.md),
            Expanded(
              child: Text(
                message,
                style: AppTextStyles.bodyMedium.copyWith(
                  color: AppColors.textWhite,
                ),
              ),
            ),
          ],
        ),
        backgroundColor: colors['background'],
        duration: duration,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: AppBorders.borderRadiusMd,
        ),
        action: actionLabel != null && onAction != null
            ? SnackBarAction(
                label: actionLabel,
                textColor: AppColors.textWhite,
                onPressed: onAction,
              )
            : null,
      ),
    );
  }

  static Map<String, Color> _getColorsForType(SnackbarType type) {
    switch (type) {
      case SnackbarType.info:
        return {'background': AppColors.info};
      case SnackbarType.success:
        return {'background': AppColors.success};
      case SnackbarType.warning:
        return {'background': AppColors.warning};
      case SnackbarType.error:
        return {'background': AppColors.error};
    }
  }

  static IconData _getIconForType(SnackbarType type) {
    switch (type) {
      case SnackbarType.info:
        return Icons.info_outline;
      case SnackbarType.success:
        return Icons.check_circle_outline;
      case SnackbarType.warning:
        return Icons.warning_amber_rounded;
      case SnackbarType.error:
        return Icons.error_outline;
    }
  }
}

