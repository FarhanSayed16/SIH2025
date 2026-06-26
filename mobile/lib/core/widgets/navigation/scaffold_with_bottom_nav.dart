import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../l10n/app_localizations.dart';
import 'bottom_nav_bar_custom.dart';
import '../../../../features/dashboard/screens/dashboard_screen.dart';

/// Scaffold wrapper that includes bottom navigation bar
/// Use this to wrap screens that should maintain the bottom nav bar
class ScaffoldWithBottomNav extends ConsumerStatefulWidget {
  final Widget body;
  final String? title;
  final PreferredSizeWidget? appBar;
  final int initialIndex;
  final bool showBottomNav;

  const ScaffoldWithBottomNav({
    super.key,
    required this.body,
    this.title,
    this.appBar,
    this.initialIndex = 0,
    this.showBottomNav = true,
  });

  @override
  ConsumerState<ScaffoldWithBottomNav> createState() => _ScaffoldWithBottomNavState();
}

class _ScaffoldWithBottomNavState extends ConsumerState<ScaffoldWithBottomNav> {
  late int _currentIndex;

  @override
  void initState() {
    super.initState();
    _currentIndex = widget.initialIndex;
  }

  void _onTabTapped(int index) {
    if (index == _currentIndex) return; // Already on this tab

    // Navigate back to DashboardScreen with the selected tab index
    if (Navigator.of(context).canPop()) {
      // Pop back to DashboardScreen
      Navigator.of(context).popUntil((route) {
        // Stop when we reach the first route (DashboardScreen)
        return route.isFirst;
      });
      
      // Replace DashboardScreen with new one showing the selected tab
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (context.mounted) {
          Navigator.of(context).pushReplacement(
            MaterialPageRoute<DashboardScreen>(
              builder: (context) => DashboardScreen(initialTabIndex: index),
            ),
          );
        }
      });
    } else {
      // If we can't pop, navigate to DashboardScreen with the selected tab
      Navigator.of(context).pushReplacement(
        MaterialPageRoute<DashboardScreen>(
          builder: (context) => DashboardScreen(initialTabIndex: index),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);

    return Scaffold(
      appBar: widget.appBar ??
          (widget.title != null
              ? AppBar(
                  title: Text(widget.title!),
                  automaticallyImplyLeading: true,
                )
              : null),
      body: widget.body,
      bottomNavigationBar: widget.showBottomNav
          ? BottomNavBarCustom(
              items: [
                BottomNavItem(
                  label: l10n.home,
                  icon: Icons.home_outlined,
                  selectedIcon: Icons.home,
                ),
                BottomNavItem(
                  label: l10n.learn,
                  icon: Icons.school_outlined,
                  selectedIcon: Icons.school,
                ),
                BottomNavItem(
                  label: l10n.games,
                  icon: Icons.games_outlined,
                  selectedIcon: Icons.games,
                ),
                BottomNavItem(
                  label: l10n.profile,
                  icon: Icons.person_outline,
                  selectedIcon: Icons.person,
                ),
                BottomNavItem(
                  label: l10n.ask,
                  icon: Icons.chat_bubble_outline_rounded,
                  selectedIcon: Icons.chat_bubble_rounded,
                ),
              ],
              selectedIndex: _currentIndex,
              onTap: _onTabTapped,
            )
          : null,
    );
  }
}

