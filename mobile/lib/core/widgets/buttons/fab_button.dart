/// Phase 101.2: Floating Action Button Component
/// A floating action button for quick access to primary actions

import 'package:flutter/material.dart';
import '../../design/design_system.dart';

/// FAB Button - Floating action button
class FABButton extends StatelessWidget {
  /// Icon to display
  final IconData icon;

  /// Callback when button is pressed
  final VoidCallback? onPressed;

  /// Whether button is loading
  final bool isLoading;

  /// Whether button is disabled
  final bool isDisabled;

  /// Button tooltip
  final String? tooltip;

  /// Background color
  final Color? backgroundColor;

  /// Icon color
  final Color? iconColor;

  /// Extended FAB with label
  final String? label;

  /// FAB size
  final FABSize size;

  const FABButton({
    super.key,
    required this.icon,
    this.onPressed,
    this.isLoading = false,
    this.isDisabled = false,
    this.tooltip,
    this.backgroundColor,
    this.iconColor,
    this.label,
    this.size = FABSize.medium,
  });

  @override
  Widget build(BuildContext context) {
    final isEnabled = !isDisabled && !isLoading && onPressed != null;
    final bgColor = backgroundColor ?? AppColors.primaryGreen;
    final iconClr = iconColor ?? AppColors.textWhite;

    if (label != null) {
      // Extended FAB
      return FloatingActionButton.extended(
        onPressed: isEnabled ? onPressed : null,
        backgroundColor: bgColor,
        foregroundColor: iconClr,
        disabledElevation: 0,
        tooltip: tooltip,
        icon: isLoading
            ? SizedBox(
                width: _getIconSize(),
                height: _getIconSize(),
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  valueColor: AlwaysStoppedAnimation<Color>(iconClr),
                ),
              )
            : Icon(icon, size: _getIconSize()),
        label: Text(
          label!,
          style: AppTextStyles.buttonMedium.withColor(iconClr),
        ),
      );
    }

    // Regular FAB
    return FloatingActionButton(
      onPressed: isEnabled ? onPressed : null,
      backgroundColor: bgColor,
      foregroundColor: iconClr,
      disabledElevation: 0,
      tooltip: tooltip,
      child: isLoading
          ? SizedBox(
              width: _getIconSize(),
              height: _getIconSize(),
              child: CircularProgressIndicator(
                strokeWidth: 2,
                valueColor: AlwaysStoppedAnimation<Color>(iconClr),
              ),
            )
          : Icon(icon, size: _getIconSize()),
    );
  }

  double _getIconSize() {
    switch (size) {
      case FABSize.small:
        return 20;
      case FABSize.medium:
        return 24;
      case FABSize.large:
        return 28;
    }
  }
}

/// FAB size enum
enum FABSize {
  small,
  medium,
  large,
}

