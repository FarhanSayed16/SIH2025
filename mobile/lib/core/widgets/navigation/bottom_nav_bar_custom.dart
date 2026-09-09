/// Phase 101.2: Enhanced Bottom Navigation Bar
/// A styled bottom navigation bar with badges support

import 'package:flutter/material.dart';
import '../../design/design_system.dart';

/// Bottom nav item
class BottomNavItem {
  final String label;
  final IconData icon;
  final IconData? selectedIcon;
  final Widget? badge;
  final int badgeCount;

  const BottomNavItem({
    required this.label,
    required this.icon,
    this.selectedIcon,
    this.badge,
    this.badgeCount = 0,
  });
}

/// Enhanced Bottom Navigation Bar
class BottomNavBarCustom extends StatelessWidget {
  /// Navigation items
  final List<BottomNavItem> items;

  /// Selected index
  final int selectedIndex;

  /// Callback when item is selected
  final ValueChanged<int> onTap;

  /// Background color
  final Color? backgroundColor;

  /// Selected item color
  final Color? selectedItemColor;

  /// Unselected item color
  final Color? unselectedItemColor;

  const BottomNavBarCustom({
    super.key,
    required this.items,
    required this.selectedIndex,
    required this.onTap,
    this.backgroundColor,
    this.selectedItemColor,
    this.unselectedItemColor,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return NavigationBar(
      selectedIndex: selectedIndex.clamp(0, items.length - 1),
      onDestinationSelected: onTap,
      backgroundColor: backgroundColor ?? colorScheme.surface,
      indicatorColor: colorScheme.primaryContainer,
      labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
      destinations: items.map((item) {
        return NavigationDestination(
          icon: item.badgeCount > 0
              ? Badge(
                  label: Text('${item.badgeCount}'),
                  child: Icon(item.icon),
                )
              : (item.badge ?? Icon(item.icon)),
          selectedIcon: item.badgeCount > 0
              ? Badge(
                  label: Text('${item.badgeCount}'),
                  child: Icon(item.selectedIcon ?? item.icon),
                )
              : (item.badge != null ? item.badge! : Icon(item.selectedIcon ?? item.icon)),
          label: item.label,
        );
      }).toList(),
    );
  }
}
