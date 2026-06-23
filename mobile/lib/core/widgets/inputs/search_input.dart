/// Phase 101.2: Search Input Component
/// A styled search input field

import 'package:flutter/material.dart';
import '../../design/design_system.dart';
import 'text_input.dart';

/// Search Input - Search field with search icon
class SearchInputCustom extends StatelessWidget {
  /// Hint text
  final String? hint;

  /// Current value
  final String? value;

  /// Callback when value changes
  final ValueChanged<String>? onChanged;

  /// Callback when search is submitted
  final ValueChanged<String>? onSubmitted;

  /// Callback when clear button is pressed
  final VoidCallback? onClear;

  /// Text controller
  final TextEditingController? controller;

  /// Focus node
  final FocusNode? focusNode;

  /// Autofocus
  final bool autofocus;

  const SearchInputCustom({
    super.key,
    this.hint,
    this.value,
    this.onChanged,
    this.onSubmitted,
    this.onClear,
    this.controller,
    this.focusNode,
    this.autofocus = false,
  });

  @override
  Widget build(BuildContext context) {
    return TextInputCustom(
      hint: hint ?? 'Search...',
      value: value,
      onChanged: onChanged,
      onSubmitted: onSubmitted,
      controller: controller,
      focusNode: focusNode,
      autofocus: autofocus,
      keyboardType: TextInputType.text,
      leadingIcon: Icons.search,
      trailingIcon: value != null && value!.isNotEmpty ? Icons.clear : null,
      onTrailingIconPressed: value != null && value!.isNotEmpty ? onClear : null,
    );
  }
}

