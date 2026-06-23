/// Phase 101.2: Number Input Component
/// A styled number input field

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../design/design_system.dart';
import 'text_input.dart';

/// Number Input - Number input field
class NumberInputCustom extends StatelessWidget {
  /// Label text
  final String? label;

  /// Hint text
  final String? hint;

  /// Current value
  final num? value;

  /// Callback when value changes
  final ValueChanged<String>? onChanged;

  /// Callback when field is submitted
  final ValueChanged<String>? onSubmitted;

  /// Error message
  final String? errorText;

  /// Helper text
  final String? helperText;

  /// Minimum value
  final num? min;

  /// Maximum value
  final num? max;

  /// Whether to allow decimals
  final bool allowDecimal;

  /// Whether field is enabled
  final bool enabled;

  /// Whether field is required
  final bool required;

  /// Text controller
  final TextEditingController? controller;

  /// Focus node
  final FocusNode? focusNode;

  const NumberInputCustom({
    super.key,
    this.label,
    this.hint,
    this.value,
    this.onChanged,
    this.onSubmitted,
    this.errorText,
    this.helperText,
    this.min,
    this.max,
    this.allowDecimal = true,
    this.enabled = true,
    this.required = false,
    this.controller,
    this.focusNode,
  });

  @override
  Widget build(BuildContext context) {
    return TextInputCustom(
      label: label,
      hint: hint,
      value: value?.toString(),
      onChanged: onChanged,
      onSubmitted: onSubmitted,
      errorText: errorText,
      helperText: helperText,
      enabled: enabled,
      required: required,
      controller: controller,
      focusNode: focusNode,
      keyboardType: allowDecimal
          ? const TextInputType.numberWithOptions(decimal: true)
          : TextInputType.number,
      inputFormatters: [
        FilteringTextInputFormatter.allow(
          allowDecimal ? RegExp(r'^\d+\.?\d*') : RegExp(r'^\d+'),
        ),
        if (min != null || max != null)
          _NumberRangeFormatter(min: min, max: max, allowDecimal: allowDecimal),
      ],
      leadingIcon: Icons.numbers,
    );
  }
}

/// Text input formatter for number range validation
class _NumberRangeFormatter extends TextInputFormatter {
  final num? min;
  final num? max;
  final bool allowDecimal;

  _NumberRangeFormatter({
    this.min,
    this.max,
    this.allowDecimal = true,
  });

  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    if (newValue.text.isEmpty) {
      return newValue;
    }

    final num? number = allowDecimal
        ? double.tryParse(newValue.text)
        : int.tryParse(newValue.text);

    if (number == null) {
      return oldValue;
    }

    if (min != null && number < min!) {
      return oldValue;
    }

    if (max != null && number > max!) {
      return oldValue;
    }

    return newValue;
  }
}

