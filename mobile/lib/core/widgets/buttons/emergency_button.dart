/// Phase 101.2: Emergency Button Component
/// A prominent button for emergency actions (red, high visibility)

import 'package:flutter/material.dart';
import '../../design/design_system.dart';
import 'primary_button.dart'; // For ButtonSize enum

/// Emergency Button - High visibility button for emergency actions
class EmergencyButton extends StatelessWidget {
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

  /// Full width button
  final bool fullWidth;

  /// Whether to pulse animation
  final bool pulse;

  const EmergencyButton({
    super.key,
    required this.label,
    this.onPressed,
    this.isLoading = false,
    this.isDisabled = false,
    this.icon,
    this.trailingIcon,
    this.size = ButtonSize.large, // Default to large for visibility
    this.width,
    this.height,
    this.fullWidth = true, // Default to full width for emergency
    this.pulse = false,
  });

  @override
  Widget build(BuildContext context) {
    final isEnabled = !isDisabled && !isLoading && onPressed != null;

    Widget button = SizedBox(
      width: fullWidth ? double.infinity : width,
      height: height ?? _getHeight(),
      child: ElevatedButton(
        onPressed: isEnabled ? onPressed : null,
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primaryRed,
          foregroundColor: AppColors.textWhite,
          disabledBackgroundColor: AppColors.errorLight,
          disabledForegroundColor: AppColors.textDisabled,
          padding: _getPadding(),
          minimumSize: Size(width ?? 0, height ?? _getHeight()),
          shape: RoundedRectangleBorder(
            borderRadius: AppBorders.borderRadiusSm,
          ),
          elevation: pulse ? 4 : 2,
        ),
        child: isLoading
            ? SizedBox(
                width: _getIconSize(),
                height: _getIconSize(),
                child: const CircularProgressIndicator(
                  strokeWidth: 2,
                  valueColor: AlwaysStoppedAnimation<Color>(AppColors.textWhite),
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
                      label.toUpperCase(),
                      style: _getTextStyle().copyWith(
                        color: AppColors.textWhite,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 1.2,
                      ),
                      textAlign: TextAlign.center,
                      maxLines: 2,
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

    if (pulse && isEnabled) {
      return _PulsingButton(child: button);
    }

    return button;
  }

  double _getHeight() {
    switch (size) {
      case ButtonSize.small:
        return 48;
      case ButtonSize.medium:
        return 56;
      case ButtonSize.large:
        return 64;
    }
  }

  EdgeInsets _getPadding() {
    switch (size) {
      case ButtonSize.small:
        return AppSpacing.button;
      case ButtonSize.medium:
        return const EdgeInsets.symmetric(
          horizontal: AppSpacing.xl,
          vertical: AppSpacing.md,
        );
      case ButtonSize.large:
        return const EdgeInsets.symmetric(
          horizontal: AppSpacing.xxl,
          vertical: AppSpacing.lg,
        );
    }
  }

  TextStyle _getTextStyle() {
    switch (size) {
      case ButtonSize.small:
        return AppTextStyles.buttonMedium;
      case ButtonSize.medium:
        return AppTextStyles.buttonLarge;
      case ButtonSize.large:
        return AppTextStyles.buttonLarge.copyWith(fontSize: 18);
    }
  }

  double _getIconSize() {
    switch (size) {
      case ButtonSize.small:
        return 20;
      case ButtonSize.medium:
        return 24;
      case ButtonSize.large:
        return 28;
    }
  }
}

/// Pulsing animation wrapper for emergency button
class _PulsingButton extends StatefulWidget {
  final Widget child;

  const _PulsingButton({required this.child});

  @override
  State<_PulsingButton> createState() => _PulsingButtonState();
}

class _PulsingButtonState extends State<_PulsingButton>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 1000),
      vsync: this,
    )..repeat(reverse: true);
    _animation = Tween<double>(begin: 1.0, end: 1.05).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ScaleTransition(
      scale: _animation,
      child: widget.child,
    );
  }
}

