/// Phase 101.2: Icon Button Component
/// A button with only an icon

import 'package:flutter/material.dart';
import '../../design/design_system.dart';
import 'primary_button.dart'; // For ButtonSize enum

/// Icon Button - Button with icon only
class IconButtonCustom extends StatelessWidget {
  /// Icon to display
  final IconData icon;

  /// Callback when button is pressed
  final VoidCallback? onPressed;

  /// Whether button is loading
  final bool isLoading;

  /// Whether button is disabled
  final bool isDisabled;

  /// Button size
  final ButtonSize size;

  /// Icon color
  final Color? iconColor;

  /// Background color (for filled variant)
  final Color? backgroundColor;

  /// Whether to show background
  final bool filled;

  /// Tooltip text
  final String? tooltip;

  const IconButtonCustom({
    super.key,
    required this.icon,
    this.onPressed,
    this.isLoading = false,
    this.isDisabled = false,
    this.size = ButtonSize.medium,
    this.iconColor,
    this.backgroundColor,
    this.filled = false,
    this.tooltip,
  });

  @override
  Widget build(BuildContext context) {
    final isEnabled = !isDisabled && !isLoading && onPressed != null;
    final iconClr = iconColor ?? AppColors.primaryGreen;
    final bgColor = backgroundColor ?? AppColors.backgroundWhite;
    final iconSize = _getIconSize();
    final buttonSize = _getButtonSize();

    Widget button = Container(
      width: buttonSize,
      height: buttonSize,
      decoration: filled
          ? BoxDecoration(
              color: isEnabled ? bgColor : AppColors.backgroundMedium,
              borderRadius: AppBorders.borderRadiusSm,
              boxShadow: AppShadows.buttonShadow,
            )
          : null,
      child: IconButton(
        onPressed: isEnabled ? onPressed : null,
        icon: isLoading
            ? SizedBox(
                width: iconSize * 0.6,
                height: iconSize * 0.6,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  valueColor: AlwaysStoppedAnimation<Color>(iconClr),
                ),
              )
            : Icon(
                icon,
                size: iconSize,
                color: isEnabled ? iconClr : AppColors.textDisabled,
              ),
        padding: EdgeInsets.zero,
        constraints: BoxConstraints(
          minWidth: buttonSize,
          minHeight: buttonSize,
        ),
      ),
    );

    if (tooltip != null) {
      return Tooltip(
        message: tooltip!,
        child: button,
      );
    }

    return button;
  }

  double _getIconSize() {
    switch (size) {
      case ButtonSize.small:
        return 18;
      case ButtonSize.medium:
        return 24;
      case ButtonSize.large:
        return 28;
    }
  }

  double _getButtonSize() {
    switch (size) {
      case ButtonSize.small:
        return 40;
      case ButtonSize.medium:
        return 48;
      case ButtonSize.large:
        return 56;
    }
  }
}

