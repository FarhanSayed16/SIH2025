/// Phase 101.2: Custom Tab Bar Component
/// A styled horizontal scrollable tab bar

import 'package:flutter/material.dart';
import '../../design/design_system.dart';

/// Tab item
class TabItem {
  final String label;
  final IconData? icon;
  final Widget? badge;

  const TabItem({
    required this.label,
    this.icon,
    this.badge,
  });
}

/// Custom Tab Bar - Horizontal scrollable tabs
class TabBarCustom extends StatelessWidget implements PreferredSizeWidget {
  /// Tab items
  final List<TabItem> tabs;

  /// Selected index
  final int selectedIndex;

  /// Callback when tab is selected
  final ValueChanged<int>? onTap;

  /// Whether tabs are scrollable
  final bool isScrollable;

  /// Label color
  final Color? labelColor;

  /// Unselected label color
  final Color? unselectedLabelColor;

  /// Indicator color
  final Color? indicatorColor;

  const TabBarCustom({
    super.key,
    required this.tabs,
    required this.selectedIndex,
    this.onTap,
    this.isScrollable = true,
    this.labelColor,
    this.unselectedLabelColor,
    this.indicatorColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.backgroundWhite,
      child: TabBar(
        tabs: tabs.asMap().entries.map((entry) {
          final index = entry.key;
          final tab = entry.value;
          return Tab(
            icon: tab.icon != null
                ? Stack(
                    clipBehavior: Clip.none,
                    children: [
                      Icon(tab.icon, size: 20),
                      if (tab.badge != null)
                        Positioned(
                          right: -8,
                          top: -8,
                          child: tab.badge!,
                        ),
                    ],
                  )
                : null,
            text: tab.icon == null ? tab.label : null,
            child: tab.icon != null
                ? Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(tab.icon, size: 20),
                      SizedBox(width: AppSpacing.xs),
                      Text(tab.label),
                      if (tab.badge != null) ...[
                        SizedBox(width: AppSpacing.xs),
                        tab.badge!,
                      ],
                    ],
                  )
                : null,
          );
        }).toList(),
        onTap: onTap,
        isScrollable: isScrollable,
        labelColor: labelColor ?? AppColors.primaryGreen,
        unselectedLabelColor: unselectedLabelColor ?? AppColors.textSecondary,
        indicatorColor: indicatorColor ?? AppColors.primaryGreen,
        indicatorWeight: 3,
        labelStyle: AppTextStyles.buttonSmall,
        unselectedLabelStyle: AppTextStyles.bodySmall,
      ),
    );
  }

  @override
  Size get preferredSize => const Size.fromHeight(48);
}

