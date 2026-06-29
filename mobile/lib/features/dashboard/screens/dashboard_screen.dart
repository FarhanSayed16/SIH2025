import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/widgets/navigation/bottom_nav_bar_custom.dart';
import '../../../core/widgets/widgets.dart';
import '../../../l10n/app_localizations.dart';
import 'home_screen.dart';
import 'learn_screen.dart';
import 'games_screen.dart';
import '../../profile/screens/profile_screen.dart';
import 'ask_kavach_screen.dart';
import '../../auth/providers/auth_provider.dart';
import '../../../core/providers/access_level_provider.dart';

/// Dashboard Screen with Bottom Navigation
/// Phase 3.4.6.4: Feature gating based on access level
class DashboardScreen extends ConsumerStatefulWidget {
  final int? initialTabIndex;

  const DashboardScreen({super.key, this.initialTabIndex});

  @override
  ConsumerState<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends ConsumerState<DashboardScreen> {
  late int _currentIndex;

  @override
  void initState() {
    super.initState();
    _currentIndex = widget.initialTabIndex ?? 0;
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final user = authState.user;

    // Get available features based on access level
    final availableFeatures = user != null && user.role == 'student'
        ? AccessLevelProvider.getAvailableFeatures(user)
        : null; // null means all features available (for admin/teacher)

    // Build screens list: Home, Learn, Games, Profile, Ask (chatbot)
    const List<Widget> screens = [
      HomeScreen(),
      LearnScreen(),
      GamesScreen(),
      ProfileScreen(),
      AskKavachScreen(),
    ];

    // Validate current index is within bounds
    final safeIndex = _currentIndex.clamp(0, screens.length - 1);

    void _onTabTapped(int index) {
      // Check if user can access this tab
      if (user != null && user.role == 'student' && availableFeatures != null) {
        // Check access for specific tabs
        if (index == 1 && !availableFeatures.contains('modules')) {
          // Learn tab - check modules access
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content:
                  Text('This feature is not available for your access level'),
              backgroundColor: Colors.orange,
            ),
          );
          return;
        }
        if (index == 2 && !availableFeatures.contains('games')) {
          // Games tab - check games access
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content:
                  Text('This feature is not available for your access level'),
              backgroundColor: Colors.orange,
            ),
          );
          return;
        }
      }

      setState(() {
        _currentIndex = index.clamp(0, screens.length - 1);
      });
    }

    return Scaffold(
      body: IndexedStack(
        index: safeIndex,
        children: screens,
      ),
      bottomNavigationBar: BottomNavBarCustom(
        items: [
          BottomNavItem(
            label: AppLocalizations.of(context).home,
            icon: Icons.home_outlined,
            selectedIcon: Icons.home,
          ),
          BottomNavItem(
            label: AppLocalizations.of(context).learn,
            icon: Icons.school_outlined,
            selectedIcon: Icons.school,
          ),
          BottomNavItem(
            label: AppLocalizations.of(context).games,
            icon: Icons.games_outlined,
            selectedIcon: Icons.games,
          ),
          BottomNavItem(
            label: AppLocalizations.of(context).profile,
            icon: Icons.person_outline,
            selectedIcon: Icons.person,
          ),
          BottomNavItem(
            label: AppLocalizations.of(context).ask,
            icon: Icons.chat_bubble_outline_rounded,
            selectedIcon: Icons.chat_bubble_rounded,
          ),
        ],
        selectedIndex: safeIndex,
        onTap: _onTabTapped,
      ),
    );
  }
}
