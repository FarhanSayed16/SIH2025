/// Phase 101.2: Drawer Menu Component
/// A styled navigation drawer menu

import 'package:flutter/material.dart';
import '../../design/design_system.dart';

/// Drawer menu item
class DrawerMenuItem {
  final String title;
  final IconData icon;
  final VoidCallback? onTap;
  final bool isDivider;
  final Color? iconColor;

  const DrawerMenuItem({
    required this.title,
    required this.icon,
    this.onTap,
    this.isDivider = false,
    this.iconColor,
  });

  const DrawerMenuItem.divider()
      : title = '',
        icon = Icons.remove,
        onTap = null,
        isDivider = true,
        iconColor = null;
}

/// Drawer Menu - Navigation drawer with consistent styling
class DrawerMenu extends StatelessWidget {
  /// User profile section widget
  final Widget? profileSection;

  /// Menu items
  final List<DrawerMenuItem> items;

  /// Footer widget
  final Widget? footer;

  /// Background color
  final Color? backgroundColor;

  const DrawerMenu({
    super.key,
    this.profileSection,
    required this.items,
    this.footer,
    this.backgroundColor,
  });

  @override
  Widget build(BuildContext context) {
    return Drawer(
      backgroundColor: backgroundColor ?? AppColors.backgroundWhite,
      child: SafeArea(
        child: Column(
          children: [
            if (profileSection != null) profileSection!,
            Expanded(
              child: ListView.builder(
                padding: EdgeInsets.zero,
                itemCount: items.length,
                itemBuilder: (context, index) {
                  final item = items[index];
                  if (item.isDivider) {
                    return const Divider(height: 1);
                  }
                  return ListTile(
                    leading: Icon(
                      item.icon,
                      color: item.iconColor ?? AppColors.textPrimary,
                      size: 24,
                    ),
                    title: Text(
                      item.title,
                      style: AppTextStyles.bodyMedium,
                    ),
                    onTap: item.onTap,
                  );
                },
              ),
            ),
            if (footer != null) footer!,
          ],
        ),
      ),
    );
  }
}

/// Drawer Profile Section - Pre-built profile section for drawer
class DrawerProfileSection extends StatelessWidget {
  /// User name
  final String name;

  /// User email/role
  final String? subtitle;

  /// Profile image URL or widget
  final Widget? avatar;

  /// Callback when profile is tapped
  final VoidCallback? onTap;

  const DrawerProfileSection({
    super.key,
    required this.name,
    this.subtitle,
    this.avatar,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: AppSpacing.card,
        color: AppColors.primaryGreen,
        child: Row(
          children: [
            avatar ??
                CircleAvatar(
                  radius: 28,
                  backgroundColor: AppColors.backgroundWhite,
                  child: Text(
                    name.isNotEmpty ? name[0].toUpperCase() : 'U',
                    style: AppTextStyles.h4.copyWith(
                      color: AppColors.primaryGreen,
                    ),
                  ),
                ),
            SizedBox(width: AppSpacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    name,
                    style: AppTextStyles.h5.copyWith(
                      color: AppColors.textWhite,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (subtitle != null) ...[
                    SizedBox(height: AppSpacing.xs),
                    Text(
                      subtitle!,
                      style: AppTextStyles.bodySmall.copyWith(
                        color: AppColors.textLight,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

