import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart';

/// Accessibility Wrapper - Adds accessibility features to widgets
/// Phase 3.5.3: Enhanced with more accessibility features
class AccessibilityWrapper extends StatelessWidget {
  final Widget child;
  final String? label;
  final String? hint;
  final String? value;
  final bool? isButton;
  final bool? isHeader;
  final bool? isImage;
  final bool? isTextField;
  final bool? isSlider;
  final bool? isChecked;
  final bool? isSelected;
  final bool? isEnabled;
  final bool? isFocusable;
  final bool? isLiveRegion;
  final String? tooltip;
  final VoidCallback? onTap;
  final VoidCallback? onLongPress;

  const AccessibilityWrapper({
    super.key,
    required this.child,
    this.label,
    this.hint,
    this.value,
    this.isButton,
    this.isHeader,
    this.isImage,
    this.isTextField,
    this.isSlider,
    this.isChecked,
    this.isSelected,
    this.isEnabled,
    this.isFocusable,
    this.isLiveRegion,
    this.tooltip,
    this.onTap,
    this.onLongPress,
  });

  @override
  Widget build(BuildContext context) {
    Widget widget = Semantics(
      label: label,
      hint: hint,
      value: value,
      tooltip: tooltip,
      button: isButton ?? false,
      header: isHeader ?? false,
      image: isImage ?? false,
      textField: isTextField ?? false,
      slider: isSlider ?? false,
      checked: isChecked,
      selected: isSelected,
      enabled: isEnabled ?? true,
      focusable: isFocusable ?? true,
      liveRegion: isLiveRegion ?? false,
      onTap: onTap,
      onLongPress: onLongPress,
      child: child,
    );

    // Phase 3.5.3: Add tooltip if provided
    if (tooltip != null) {
      widget = Tooltip(
        message: tooltip!,
        child: widget,
      );
    }

    return widget;
  }
}

/// High Contrast Widget - Applies high contrast styling
class HighContrastWidget extends StatelessWidget {
  final Widget child;
  final bool enabled;

  const HighContrastWidget({
    super.key,
    required this.child,
    this.enabled = false,
  });

  @override
  Widget build(BuildContext context) {
    if (!enabled) return child;

    return Theme(
      data: Theme.of(context).copyWith(
        colorScheme: Theme.of(context).colorScheme.copyWith(
              primary: Colors.white,
              onPrimary: Colors.black,
              secondary: Colors.black,
              onSecondary: Colors.white,
              surface: Colors.black,
              onSurface: Colors.white,
            ),
        textTheme: Theme.of(context).textTheme.apply(
              bodyColor: Colors.white,
              displayColor: Colors.white,
            ),
      ),
      child: child,
    );
  }
}

/// Scalable Text Widget - Text that scales with system font size
/// Phase 3.5.3: Enhanced with accessibility features
class ScalableText extends StatelessWidget {
  final String text;
  final TextStyle? style;
  final TextAlign? textAlign;
  final int? maxLines;
  final TextOverflow? overflow;
  final String? semanticsLabel;
  final bool excludeSemantics;

  const ScalableText(
    this.text, {
    super.key,
    this.style,
    this.textAlign,
    this.maxLines,
    this.overflow,
    this.semanticsLabel,
    this.excludeSemantics = false,
  });

  @override
  Widget build(BuildContext context) {
    final textScaleFactor = MediaQuery.of(context).textScaleFactor.clamp(0.8, 2.0);
    
    Widget textWidget = Text(
      text,
      style: style,
      textAlign: textAlign,
      maxLines: maxLines,
      overflow: overflow,
      textScaleFactor: textScaleFactor,
    );

    // Phase 3.5.3: Add semantics label if provided
    if (semanticsLabel != null && !excludeSemantics) {
      textWidget = Semantics(
        label: semanticsLabel,
        excludeSemantics: excludeSemantics,
        child: textWidget,
      );
    }

    return textWidget;
  }
}

/// Phase 3.5.3: Accessible Button Widget
/// Button with built-in accessibility support
class AccessibleButton extends StatelessWidget {
  final String label;
  final String? hint;
  final VoidCallback? onPressed;
  final Widget? icon;
  final Color? backgroundColor;
  final Color? foregroundColor;
  final EdgeInsetsGeometry? padding;

  const AccessibleButton({
    super.key,
    required this.label,
    this.hint,
    this.onPressed,
    this.icon,
    this.backgroundColor,
    this.foregroundColor,
    this.padding,
  });

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: label,
      hint: hint,
      button: true,
      enabled: onPressed != null,
      child: ElevatedButton.icon(
        onPressed: onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: backgroundColor,
          foregroundColor: foregroundColor,
          padding: padding,
        ),
        icon: icon ?? const SizedBox.shrink(),
        label: Text(label),
      ),
    );
  }
}

/// Phase 3.5.3: Accessible Icon Button
/// Icon button with accessibility label
class AccessibleIconButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final String? hint;
  final VoidCallback? onPressed;
  final Color? color;
  final double? iconSize;

  const AccessibleIconButton({
    super.key,
    required this.icon,
    required this.label,
    this.hint,
    this.onPressed,
    this.color,
    this.iconSize,
  });

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: label,
      hint: hint,
      button: true,
      enabled: onPressed != null,
      child: IconButton(
        icon: Icon(icon, size: iconSize, color: color),
        onPressed: onPressed,
        tooltip: label, // Tooltip for better UX
      ),
    );
  }
}

/// Phase 3.5.3: Keyboard Navigation Support
/// Wrapper that enables keyboard navigation
class KeyboardNavigable extends StatelessWidget {
  final Widget child;
  final FocusNode? focusNode;
  final bool autofocus;
  final VoidCallback? onFocusChanged;

  const KeyboardNavigable({
    super.key,
    required this.child,
    this.focusNode,
    this.autofocus = false,
    this.onFocusChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Focus(
      focusNode: focusNode,
      autofocus: autofocus,
      onFocusChange: (hasFocus) {
        onFocusChanged?.call();
      },
      child: Semantics(
        focusable: true,
        child: child,
      ),
    );
  }
}

