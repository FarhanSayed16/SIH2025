/// Phase 101.2: Text Input Component
/// A styled text input field with validation

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../design/design_system.dart';

/// Text Input - Styled text input field
class TextInputCustom extends StatefulWidget {
  /// Label text
  final String? label;

  /// Hint text
  final String? hint;

  /// Initial value
  final String? initialValue;

  /// Current value
  final String? value;

  /// Callback when value changes
  final ValueChanged<String>? onChanged;

  /// Callback when field is submitted
  final ValueChanged<String>? onSubmitted;

  /// Callback when field loses focus
  final VoidCallback? onEditingComplete;

  /// Error message
  final String? errorText;

  /// Helper text
  final String? helperText;

  /// Leading icon
  final IconData? leadingIcon;

  /// Trailing icon
  final IconData? trailingIcon;

  /// Callback when trailing icon is pressed
  final VoidCallback? onTrailingIconPressed;

  /// Whether field is enabled
  final bool enabled;

  /// Whether field is read-only
  final bool readOnly;

  /// Whether field is required
  final bool required;

  /// Maximum lines (null = single line)
  final int? maxLines;

  /// Maximum characters
  final int? maxLength;

  /// Text input type
  final TextInputType? keyboardType;

  /// Text input formatters
  final List<TextInputFormatter>? inputFormatters;

  /// Text controller
  final TextEditingController? controller;

  /// Focus node
  final FocusNode? focusNode;

  /// Autofocus
  final bool autofocus;

  /// Validator function
  final String? Function(String?)? validator;

  const TextInputCustom({
    super.key,
    this.label,
    this.hint,
    this.initialValue,
    this.value,
    this.onChanged,
    this.onSubmitted,
    this.onEditingComplete,
    this.errorText,
    this.helperText,
    this.leadingIcon,
    this.trailingIcon,
    this.onTrailingIconPressed,
    this.enabled = true,
    this.readOnly = false,
    this.required = false,
    this.maxLines = 1,
    this.maxLength,
    this.keyboardType,
    this.inputFormatters,
    this.controller,
    this.focusNode,
    this.autofocus = false,
    this.validator,
  });

  @override
  State<TextInputCustom> createState() => _TextInputCustomState();
}

class _TextInputCustomState extends State<TextInputCustom> {
  late TextEditingController _controller;
  late bool _isControllerProvided;

  @override
  void initState() {
    super.initState();
    _isControllerProvided = widget.controller != null;
    _controller = widget.controller ??
        TextEditingController(text: widget.initialValue ?? widget.value);
  }

  @override
  void didUpdateWidget(TextInputCustom oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.value != oldWidget.value && widget.value != null) {
      _controller.text = widget.value!;
    }
  }

  @override
  void dispose() {
    if (!_isControllerProvided) {
      _controller.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: _controller,
      focusNode: widget.focusNode,
      autofocus: widget.autofocus,
      enabled: widget.enabled,
      readOnly: widget.readOnly,
      maxLines: widget.maxLines,
      maxLength: widget.maxLength,
      keyboardType: widget.keyboardType,
      inputFormatters: widget.inputFormatters,
      style: AppTextStyles.bodyLarge,
      decoration: InputDecoration(
        labelText: widget.label != null
            ? (widget.required ? '${widget.label} *' : widget.label)
            : null,
        hintText: widget.hint,
        errorText: widget.errorText,
        helperText: widget.helperText,
        prefixIcon: widget.leadingIcon != null
            ? Icon(widget.leadingIcon, size: 24)
            : null,
        suffixIcon: widget.trailingIcon != null
            ? IconButton(
                icon: Icon(widget.trailingIcon, size: 24),
                onPressed: widget.onTrailingIconPressed,
              )
            : null,
        contentPadding: AppSpacing.input,
      ),
      onChanged: widget.onChanged,
      onFieldSubmitted: widget.onSubmitted,
      onEditingComplete: widget.onEditingComplete,
      validator: widget.validator,
    );
  }
}

