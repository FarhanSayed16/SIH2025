/// Phase 101.2: Dialog Widget Component
/// A styled dialog widget

import 'package:flutter/material.dart';
import '../../design/design_system.dart';
import '../buttons/primary_button.dart';
import '../buttons/text_button.dart';

/// Dialog Widget - Styled dialog helper
class DialogWidget {
  /// Show alert dialog
  static Future<bool?> showAlert(
    BuildContext context, {
    required String title,
    required String message,
    String confirmLabel = 'OK',
    VoidCallback? onConfirm,
    bool barrierDismissible = true,
  }) {
    return showDialog<bool>(
      context: context,
      barrierDismissible: barrierDismissible,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: AppBorders.borderRadiusLg,
        ),
        title: Text(title, style: AppTextStyles.h4),
        content: Text(message, style: AppTextStyles.bodyMedium),
        actions: [
          PrimaryButton(
            label: confirmLabel,
            onPressed: () {
              Navigator.of(context).pop(true);
              onConfirm?.call();
            },
            fullWidth: false,
            size: ButtonSize.medium,
          ),
        ],
      ),
    );
  }

  /// Show confirmation dialog
  static Future<bool?> showConfirm(
    BuildContext context, {
    required String title,
    required String message,
    String confirmLabel = 'Confirm',
    String cancelLabel = 'Cancel',
    VoidCallback? onConfirm,
    VoidCallback? onCancel,
    bool barrierDismissible = true,
  }) {
    return showDialog<bool>(
      context: context,
      barrierDismissible: barrierDismissible,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: AppBorders.borderRadiusLg,
        ),
        title: Text(title, style: AppTextStyles.h4),
        content: Text(message, style: AppTextStyles.bodyMedium),
        actions: [
          TextButtonCustom(
            label: cancelLabel,
            onPressed: () {
              Navigator.of(context).pop(false);
              onCancel?.call();
            },
          ),
          PrimaryButton(
            label: confirmLabel,
            onPressed: () {
              Navigator.of(context).pop(true);
              onConfirm?.call();
            },
            fullWidth: false,
            size: ButtonSize.medium,
          ),
        ],
      ),
    );
  }

  /// Show custom dialog
  static Future<T?> showCustom<T>(
    BuildContext context, {
    required Widget child,
    bool barrierDismissible = true,
    Color? barrierColor,
  }) {
    return showDialog<T>(
      context: context,
      barrierDismissible: barrierDismissible,
      barrierColor: barrierColor ?? AppColors.overlayMedium,
      builder: (context) => Dialog(
        shape: RoundedRectangleBorder(
          borderRadius: AppBorders.borderRadiusLg,
        ),
        child: child,
      ),
    );
  }
}

