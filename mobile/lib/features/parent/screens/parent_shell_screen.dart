/// Parent shell — persistent tabs without route-stack growth (B7 §13.4).

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../widgets/parent_bottom_nav.dart';
import 'parent_dashboard_screen.dart';
import 'children_management_screen.dart';
import 'qr_verification_screen.dart';
import 'notifications_screen.dart';
import 'parent_profile_screen.dart';

class ParentShellScreen extends ConsumerStatefulWidget {
  final int initialTabIndex;

  const ParentShellScreen({super.key, this.initialTabIndex = 0});

  @override
  ConsumerState<ParentShellScreen> createState() => _ParentShellScreenState();
}

class _ParentShellScreenState extends ConsumerState<ParentShellScreen> {
  late int _currentIndex;

  @override
  void initState() {
    super.initState();
    _currentIndex = widget.initialTabIndex.clamp(0, 4);
  }

  void _onTabTapped(int index) {
    setState(() => _currentIndex = index.clamp(0, 4));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // KeepAlive-style: Offstage preserves state; TickerMode pauses animations
          Offstage(
            offstage: _currentIndex != 0,
            child: TickerMode(
              enabled: _currentIndex == 0,
              child: ParentDashboardScreen(
                embedded: true,
                onSelectTab: _onTabTapped,
              ),
            ),
          ),
          Offstage(
            offstage: _currentIndex != 1,
            child: TickerMode(
              enabled: _currentIndex == 1,
              child: ChildrenManagementScreen(
                embedded: true,
                onSelectTab: _onTabTapped,
              ),
            ),
          ),
          // QR only while selected — camera not retained offstage
          if (_currentIndex == 2)
            const QRVerificationScreen(embedded: true),
          Offstage(
            offstage: _currentIndex != 3,
            child: TickerMode(
              enabled: _currentIndex == 3,
              child: NotificationsScreen(
                embedded: true,
                onSelectTab: _onTabTapped,
              ),
            ),
          ),
          Offstage(
            offstage: _currentIndex != 4,
            child: TickerMode(
              enabled: _currentIndex == 4,
              child: ParentProfileScreen(
                embedded: true,
                onSelectTab: _onTabTapped,
              ),
            ),
          ),
        ],
      ),
      bottomNavigationBar: ParentBottomNav(
        currentIndex: _currentIndex,
        onTap: _onTabTapped,
      ),
    );
  }
}
