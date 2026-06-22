/// Phase 101.2: Outlined Button Component
/// A button with outline border for secondary actions

import 'package:flutter/material.dart';
import '../../design/design_system.dart';
import 'primary_button.dart'; // For ButtonSize enum

/// Outlined Button - Button with border outline
class OutlinedButtonCustom extends StatelessWidget {
  /// Button text/label
  final String label;

  /// Callback when button is pressed
  final VoidCallback? onPressed;

  /// Whether button is loading
  final bool isLoading;

  /// Whether button is disabled
  final bool isDisabled;

  /// Icon to display before label
  final IconData? icon;

  /// Icon to display after label
  final IconData? trailingIcon;

  /// Button size
  final ButtonSize size;

  /// Custom width (null = auto)
  final double? width;

  /// Custom height (null = auto)
  final double? height;

  /// Custom border color
  final Color? borderColor;

  /// Custom text color
  final Color? textColor;

  /// Full width button
  final bool fullWidth;

  const OutlinedButtonCustom({
    super.key,
    required this.label,
    this.onPressed,
    this.isLoading = false,
    this.isDisabled = false,
    this.icon,
    this.trailingIcon,
    this.size = ButtonSize.medium,
    this.width,
    this.height,
    this.borderColor,
    this.textColor,
    this.fullWidth = false,
  });

  @override
  Widget build(BuildContext context) {
    final isEnabled = !isDisabled && !isLoading && onPressed != null;
    final borderClr = borderColor ?? AppColors.primaryGreen;
    final txtColor = textColor ?? AppColors.primaryGreen;

    return SizedBox(
      width: fullWidth ? double.infinity : width,
      height: height ?? _getHeight(),
      child: OutlinedButton(
        onPressed: isEnabled ? onPressed : null,
        style: OutlinedButton.styleFrom(
          foregroundColor: txtColor,
          disabledForegroundColor: AppColors.textDisabled,
          side: BorderSide(
            color: isEnabled ? borderClr : AppColors.borderLight,
            width: AppBorders.borderWidthMedium,
          ),
          padding: _getPadding(),
          minimumSize: Size(width ?? 0, height ?? _getHeight()),
          shape: RoundedRectangleBorder(
            borderRadius: AppBorders.borderRadiusSm,
          ),
        ),
        child: isLoading
            ? SizedBox(
                width: _getIconSize(),
                height: _getIconSize(),
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  valueColor: AlwaysStoppedAnimation<Color>(txtColor),
                ),
              )
            : Row(
                mainAxisSize: MainAxisSize.min,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  if (icon != null) ...[
                    Icon(icon, size: _getIconSize()),
                    SizedBox(width: AppSpacing.sm),
                  ],
                  Flexible(
                    child: Text(
                      label,
                      style: _getTextStyle().withColor(txtColor),
                      textAlign: TextAlign.center,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  if (trailingIcon != null) ...[
                    SizedBox(width: AppSpacing.sm),
                    Icon(trailingIcon, size: _getIconSize()),
                  ],
                ],
              ),
      ),
    );
  }

  double _getHeight() {
    switch (size) {
      case ButtonSize.small:
        return 40;
      case ButtonSize.medium:
        return 48;
      case ButtonSize.large:
        return 56;
    }
  }

  EdgeInsets _getPadding() {
    switch (size) {
      case ButtonSize.small:
        return AppSpacing.buttonSmall;
      case ButtonSize.medium:
        return AppSpacing.button;
      case ButtonSize.large:
        return const EdgeInsets.symmetric(
          horizontal: AppSpacing.xl,
          vertical: AppSpacing.md,
        );
    }
  }

  TextStyle _getTextStyle() {
    switch (size) {
      case ButtonSize.small:
        return AppTextStyles.buttonSmall;
      case ButtonSize.medium:
        return AppTextStyles.buttonMedium;
      case ButtonSize.large:
        return AppTextStyles.buttonLarge;
    }
  }

  double _getIconSize() {
    switch (size) {
      case ButtonSize.small:
        return 18;
      case ButtonSize.medium:
        return 20;
      case ButtonSize.large:
        return 24;
    }
  }
}

