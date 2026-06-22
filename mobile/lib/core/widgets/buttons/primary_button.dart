/// Phase 101.2: Primary Button Component
/// A prominent, filled button for primary actions
/// 
/// Features:
/// - Consistent sizing
/// - Loading states
/// - Disabled states
/// - Icon support
/// - Customizable styles

import 'package:flutter/material.dart';
import '../../design/design_system.dart';

/// Primary Button - Main action button with filled background
class PrimaryButton extends StatelessWidget {
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

  /// Custom background color (overrides default)
  final Color? backgroundColor;

  /// Custom text color (overrides default)
  final Color? textColor;

  /// Full width button
  final bool fullWidth;

  const PrimaryButton({
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
    this.backgroundColor,
    this.textColor,
    this.fullWidth = false,
  });

  @override
  Widget build(BuildContext context) {
    final isEnabled = !isDisabled && !isLoading && onPressed != null;
    final bgColor = backgroundColor ?? AppColors.primaryGreen;
    final txtColor = textColor ?? AppColors.textOnPrimary;

    return SizedBox(
      width: fullWidth ? double.infinity : width,
      height: height ?? _getHeight(),
      child: ElevatedButton(
        onPressed: isEnabled ? onPressed : null,
        style: ElevatedButton.styleFrom(
          backgroundColor: bgColor,
          foregroundColor: txtColor,
          disabledBackgroundColor: AppColors.textDisabled,
          disabledForegroundColor: AppColors.textSecondary,
          padding: _getPadding(),
          minimumSize: Size(width ?? 0, height ?? _getHeight()),
          shape: RoundedRectangleBorder(
            borderRadius: AppBorders.borderRadiusSm,
          ),
          elevation: 2,
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
                      style: _getTextStyle(),
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

  /// Get button height based on size
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

  /// Get button padding based on size
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

  /// Get text style based on size
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

  /// Get icon size based on button size
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

/// Button size enum
enum ButtonSize {
  small,
  medium,
  large,
}

