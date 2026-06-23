/// Phase 101.2: Date Input Component
/// A styled date picker input field

import 'package:flutter/material.dart';
import '../../design/design_system.dart';

/// Date Input - Date picker field
class DateInputCustom extends StatelessWidget {
  /// Label text
  final String? label;

  /// Selected date
  final DateTime? value;

  /// Callback when date is selected
  final ValueChanged<DateTime>? onChanged;

  /// First selectable date
  final DateTime? firstDate;

  /// Last selectable date
  final DateTime? lastDate;

  /// Initial date
  final DateTime? initialDate;

  /// Error message
  final String? errorText;

  /// Helper text
  final String? helperText;

  /// Whether field is enabled
  final bool enabled;

  /// Whether field is required
  final bool required;

  const DateInputCustom({
    super.key,
    this.label,
    this.value,
    this.onChanged,
    this.firstDate,
    this.lastDate,
    this.initialDate,
    this.errorText,
    this.helperText,
    this.enabled = true,
    this.required = false,
  });

  Future<void> _selectDate(BuildContext context) async {
    if (!enabled || onChanged == null) return;

    final picked = await showDatePicker(
      context: context,
      initialDate: value ?? initialDate ?? DateTime.now(),
      firstDate: firstDate ?? DateTime(1900),
      lastDate: lastDate ?? DateTime(2100),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: ColorScheme.light(
              primary: AppColors.primaryGreen,
              onPrimary: AppColors.textWhite,
            ),
          ),
          child: child!,
        );
      },
    );

    if (picked != null && picked != value) {
      onChanged!(picked);
    }
  }

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: enabled ? () => _selectDate(context) : null,
      child: InputDecorator(
        decoration: InputDecoration(
          labelText: label != null ? (required ? '$label *' : label) : null,
          hintText: 'Select date',
          errorText: errorText,
          helperText: helperText,
          prefixIcon: const Icon(Icons.calendar_today, size: 24),
          contentPadding: AppSpacing.input,
          suffixIcon: enabled
              ? const Icon(Icons.arrow_drop_down, color: AppColors.textSecondary)
              : null,
        ),
        child: Text(
          value != null
              ? '${value!.day}/${value!.month}/${value!.year}'
              : 'Select date',
          style: AppTextStyles.bodyLarge.copyWith(
            color: value != null
                ? AppColors.textPrimary
                : AppColors.textSecondary,
          ),
        ),
      ),
    );
  }
}

