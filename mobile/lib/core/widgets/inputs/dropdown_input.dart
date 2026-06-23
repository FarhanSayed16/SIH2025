/// Phase 101.2: Dropdown Input Component
/// A styled dropdown/select input field

import 'package:flutter/material.dart';
import '../../design/design_system.dart';

/// Dropdown Input - Dropdown/select field
class DropdownInputCustom<T> extends StatelessWidget {
  /// Label text
  final String? label;

  /// Hint text
  final String? hint;

  /// Selected value
  final T? value;

  /// Available options
  final List<DropdownMenuItem<T>> items;

  /// Callback when value changes
  final ValueChanged<T?>? onChanged;

  /// Error message
  final String? errorText;

  /// Helper text
  final String? helperText;

  /// Whether field is enabled
  final bool enabled;

  /// Whether field is required
  final bool required;

  /// Leading icon
  final IconData? leadingIcon;

  const DropdownInputCustom({
    super.key,
    this.label,
    this.hint,
    this.value,
    required this.items,
    this.onChanged,
    this.errorText,
    this.helperText,
    this.enabled = true,
    this.required = false,
    this.leadingIcon,
  });

  @override
  Widget build(BuildContext context) {
    return InputDecorator(
      decoration: InputDecoration(
        labelText: label != null ? (required ? '$label *' : label) : null,
        hintText: hint,
        errorText: errorText,
        helperText: helperText,
        prefixIcon: leadingIcon != null ? Icon(leadingIcon, size: 24) : null,
        contentPadding: AppSpacing.input,
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<T>(
          value: value,
          items: items,
          onChanged: enabled ? onChanged : null,
          isExpanded: true,
          hint: hint != null ? Text(hint!, style: AppTextStyles.bodyMedium) : null,
          style: AppTextStyles.bodyLarge,
          icon: Icon(Icons.arrow_drop_down, color: AppColors.textSecondary),
        ),
      ),
    );
  }
}

