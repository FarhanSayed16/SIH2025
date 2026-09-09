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
    final navTheme = theme.bottomNavigationBarTheme;

    return BottomNavigationBar(
      currentIndex: selectedIndex.clamp(0, items.length - 1),
      onTap: onTap,
      type: BottomNavigationBarType.fixed,
      backgroundColor: backgroundColor ??
          navTheme.backgroundColor ??
          colorScheme.surface,
      selectedItemColor: selectedItemColor ??
          navTheme.selectedItemColor ??
          colorScheme.primary,
      unselectedItemColor: unselectedItemColor ??
          navTheme.unselectedItemColor ??
          colorScheme.onSurfaceVariant,
      selectedLabelStyle: navTheme.selectedLabelStyle ?? AppTextStyles.labelSmall,
      unselectedLabelStyle:
          navTheme.unselectedLabelStyle ?? AppTextStyles.labelSmall,
      elevation: navTheme.elevation ?? 8,
      items: items.asMap().entries.map((entry) {
        final index = entry.key;
        final item = entry.value;
        final isSelected = index == selectedIndex;

        return BottomNavigationBarItem(
          icon: Semantics(
            selected: isSelected,
            label: item.label,
            child: Stack(
              clipBehavior: Clip.none,
              children: [
                SizedBox(
                  width: 48,
                  height: 32,
                  child: Center(
                    child: Icon(
                      isSelected && item.selectedIcon != null
                          ? item.selectedIcon!
                          : item.icon,
                    ),
                  ),
                ),
                if (item.badgeCount > 0)
                  Positioned(
                    right: 0,
                    top: 0,
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: BoxDecoration(
                        color: colorScheme.error,
                        shape: BoxShape.circle,
                      ),
                      constraints: const BoxConstraints(
                        minWidth: 16,
                        minHeight: 16,
                      ),
                      child: Text(
                        item.badgeCount > 9 ? '9+' : '${item.badgeCount}',
                        style: AppTextStyles.caption.copyWith(
                          color: colorScheme.onError,
                          fontSize: 10,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  )
                else if (item.badge != null)
                  Positioned(
                    right: 4,
                    top: 0,
                    child: item.badge!,
                  ),
              ],
            ),
          ),
          label: item.label,
        );
      }).toList(),
    );
  }
}
