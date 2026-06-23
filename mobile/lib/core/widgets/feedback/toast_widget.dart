/// Phase 101.2: Toast Widget Component
/// A styled toast notification widget

import 'package:flutter/material.dart';
import '../../design/design_system.dart';

/// Toast type
enum ToastType {
  info,
  success,
  warning,
  error,
}

/// Toast Widget - Toast notification display
class ToastWidget extends StatelessWidget {
  /// Toast message
  final String message;

  /// Toast type
  final ToastType type;

  /// Duration to show
  final Duration duration;

  const ToastWidget({
    super.key,
    required this.message,
    this.type = ToastType.info,
    this.duration = const Duration(seconds: 3),
  });

  /// Show toast
  static void show(
    BuildContext context, {
    required String message,
    ToastType type = ToastType.info,
    Duration duration = const Duration(seconds: 3),
  }) {
    final overlay = Overlay.of(context);
    final overlayEntry = OverlayEntry(
      builder: (context) => _ToastOverlay(
        message: message,
        type: type,
        duration: duration,
      ),
    );

    overlay.insert(overlayEntry);

    Future.delayed(duration, () {
      overlayEntry.remove();
    });
  }

  @override
  Widget build(BuildContext context) {
    final colors = _getColorsForType(type);
    final icon = _getIconForType(type);

    return Container(
      padding: AppSpacing.card,
      margin: AppSpacing.screenHorizontal,
      decoration: BoxDecoration(
        color: colors['background'],
        borderRadius: AppBorders.borderRadiusMd,
        boxShadow: AppShadows.elevation4,
        border: Border.all(
          color: colors['border']!,
          width: AppBorders.borderWidthThin,
        ),
      ),
      child: Row(
        children: [
          Icon(icon, color: colors['icon'], size: 24),
          SizedBox(width: AppSpacing.md),
          Expanded(
            child: Text(
              message,
              style: AppTextStyles.bodyMedium.copyWith(
                color: colors['text'],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Map<String, Color> _getColorsForType(ToastType type) {
    switch (type) {
      case ToastType.info:
        return {
          'background': AppColors.infoBackground,
          'border': AppColors.info,
          'icon': AppColors.info,
          'text': AppColors.textPrimary,
        };
      case ToastType.success:
        return {
          'background': AppColors.successBackground,
          'border': AppColors.success,
          'icon': AppColors.success,
          'text': AppColors.textPrimary,
        };
      case ToastType.warning:
        return {
          'background': AppColors.warningBackground,
          'border': AppColors.warning,
          'icon': AppColors.warning,
          'text': AppColors.textPrimary,
        };
      case ToastType.error:
        return {
          'background': AppColors.errorBackground,
          'border': AppColors.error,
          'icon': AppColors.error,
          'text': AppColors.textPrimary,
        };
    }
  }

  IconData _getIconForType(ToastType type) {
    switch (type) {
      case ToastType.info:
        return Icons.info_outline;
      case ToastType.success:
        return Icons.check_circle_outline;
      case ToastType.warning:
        return Icons.warning_amber_rounded;
      case ToastType.error:
        return Icons.error_outline;
    }
  }
}

/// Toast overlay widget
class _ToastOverlay extends StatelessWidget {
  final String message;
  final ToastType type;
  final Duration duration;

  const _ToastOverlay({
    required this.message,
    required this.type,
    required this.duration,
  });

  @override
  Widget build(BuildContext context) {
    return Positioned(
      top: MediaQuery.of(context).padding.top + AppSpacing.md,
      left: 0,
      right: 0,
      child: Material(
        color: Colors.transparent,
        child: ToastWidget(
          message: message,
          type: type,
          duration: duration,
        ),
      ),
    );
  }
}

