/// Phase 101.2: Password Input Component
/// A styled password input field with show/hide toggle

import 'package:flutter/material.dart';
import '../../design/design_system.dart';

/// Password Input - Password field with visibility toggle
class PasswordInputCustom extends StatefulWidget {
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

  /// Whether field is enabled
  final bool enabled;

  /// Whether field is required
  final bool required;

  /// Text controller
  final TextEditingController? controller;

  /// Focus node
  final FocusNode? focusNode;

  /// Autofocus
  final bool autofocus;

  /// Validator function
  final String? Function(String?)? validator;

  const PasswordInputCustom({
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
    this.enabled = true,
    this.required = false,
    this.controller,
    this.focusNode,
    this.autofocus = false,
    this.validator,
  });

  @override
  State<PasswordInputCustom> createState() => _PasswordInputCustomState();
}

class _PasswordInputCustomState extends State<PasswordInputCustom> {
  bool _obscureText = true;
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
  void didUpdateWidget(PasswordInputCustom oldWidget) {
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

  void _toggleVisibility() {
    setState(() {
      _obscureText = !_obscureText;
    });
  }

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: _controller,
      focusNode: widget.focusNode,
      autofocus: widget.autofocus,
      enabled: widget.enabled,
      obscureText: _obscureText,
      keyboardType: TextInputType.visiblePassword,
      style: AppTextStyles.bodyLarge,
      decoration: InputDecoration(
        labelText: widget.label != null
            ? (widget.required ? '${widget.label} *' : widget.label)
            : null,
        hintText: widget.hint ?? 'Enter password',
        errorText: widget.errorText,
        helperText: widget.helperText,
        prefixIcon: const Icon(Icons.lock_outline, size: 24),
        suffixIcon: IconButton(
          icon: Icon(
            _obscureText ? Icons.visibility_outlined : Icons.visibility_off_outlined,
            size: 24,
          ),
          onPressed: _toggleVisibility,
        ),
        contentPadding: AppSpacing.input,
      ),
      onChanged: widget.onChanged,
      onFieldSubmitted: widget.onSubmitted,
      onEditingComplete: widget.onEditingComplete,
      validator: widget.validator,
    );
  }
}

