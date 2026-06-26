/// Phase 101.2: Breadcrumb Component
/// A navigation breadcrumb widget

import 'package:flutter/material.dart';
import '../../design/design_system.dart';

/// Breadcrumb item
class BreadcrumbItem {
  final String label;
  final VoidCallback? onTap;
  final bool isActive;

  const BreadcrumbItem({
    required this.label,
    this.onTap,
    this.isActive = false,
  });
}

/// Breadcrumb - Navigation breadcrumb widget
class Breadcrumb extends StatelessWidget {
  /// Breadcrumb items
  final List<BreadcrumbItem> items;

  /// Separator icon
  final IconData separatorIcon;

  /// Separator color
  final Color? separatorColor;

  const Breadcrumb({
    super.key,
    required this.items,
    this.separatorIcon = Icons.chevron_right,
    this.separatorColor,
  });

  @override
  Widget build(BuildContext context) {
    if (items.isEmpty) return const SizedBox.shrink();

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: items.asMap().entries.map((entry) {
          final index = entry.key;
          final item = entry.value;
          final isLast = index == items.length - 1;

          return Row(
            children: [
              GestureDetector(
                onTap: item.isActive ? null : item.onTap,
                child: Text(
                  item.label,
                  style: item.isActive
                      ? AppTextStyles.bodyMedium.bold
                      : AppTextStyles.bodyMedium,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              if (!isLast) ...[
                SizedBox(width: AppSpacing.xs),
                Icon(
                  separatorIcon,
                  size: 16,
                  color: separatorColor ?? AppColors.textSecondary,
                ),
                SizedBox(width: AppSpacing.xs),
              ],
            ],
          );
        }).toList(),
      ),
    );
  }
}

