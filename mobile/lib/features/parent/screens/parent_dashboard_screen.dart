/// Parent Dashboard Screen
/// Main dashboard for parents to monitor their children
/// Parent Monitoring System - Phase 3
/// Enhanced with statistics, activity feed, and better child cards

import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/widgets/widgets.dart';
import '../../../core/design/design_system.dart';
import '../providers/parent_provider.dart';
import '../models/parent_models.dart';
import 'child_detail_screen.dart';
import 'qr_verification_screen.dart';
import 'notifications_screen.dart';
import 'children_management_screen.dart';
import 'parent_profile_screen.dart';
import '../../auth/providers/auth_provider.dart';
import '../widgets/parent_bottom_nav.dart';
import '../services/parent_service.dart';
import '../../../core/providers/api_service_provider.dart';

class ParentDashboardScreen extends ConsumerStatefulWidget {
  const ParentDashboardScreen({super.key});

  @override
  ConsumerState<ParentDashboardScreen> createState() =>
      _ParentDashboardScreenState();
}

class _ParentDashboardScreenState extends ConsumerState<ParentDashboardScreen> {
  Map<String, Map<String, dynamic>> _childStatuses = {};
  Map<String, dynamic>? _dashboardSummary;
  bool _isRefreshingStatus = false;
  Timer? _refreshTimer;

  Timer? _progressRefreshTimer;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _fetchStatuses();
      _fetchDashboardSummary();
      // Set up periodic refresh every 30 seconds for status
      _refreshTimer = Timer.periodic(const Duration(seconds: 30), (_) {
        if (mounted) {
          _fetchStatuses();
          _fetchDashboardSummary();
        }
      });
      // Set up periodic refresh every 30 seconds for progress data
      _progressRefreshTimer = Timer.periodic(const Duration(seconds: 30), (_) {
        if (mounted) {
          // Invalidate children provider to refresh progress data
          ref.invalidate(childrenProvider);
        }
      });
    });
  }

  @override
  void dispose() {
    _refreshTimer?.cancel();
    _progressRefreshTimer?.cancel();
    super.dispose();
  }

  Future<void> _fetchStatuses() async {
    final childrenAsync = ref.read(childrenProvider);
    final children = await childrenAsync.when(
      data: (children) => children,
      loading: () => <ParentChild>[],
      error: (_, __) => <ParentChild>[],
    );

    if (children.isEmpty) return;

    setState(() {
      _isRefreshingStatus = true;
    });

    try {
      final apiService = ref.read(apiServiceProvider);
      final parentService = ParentService(apiService);
      final statusMap = <String, Map<String, dynamic>>{};

      for (final child in children) {
        try {
          final status = await parentService.getChildStatus(child.id);
          statusMap[child.id] = status;
        } catch (e) {
          print('Error fetching status for ${child.id}: $e');
        }
      }

      if (mounted) {
        setState(() {
          _childStatuses = statusMap;
          _isRefreshingStatus = false;
        });
      }
    } catch (e) {
      print('Error fetching statuses: $e');
      if (mounted) {
        setState(() {
          _isRefreshingStatus = false;
        });
      }
    }
  }

  Future<void> _fetchDashboardSummary() async {
    try {
      final apiService = ref.read(apiServiceProvider);
      final parentService = ParentService(apiService);
      final summary = await parentService.getDashboardSummary();
      if (mounted) {
        setState(() {
          _dashboardSummary = summary;
        });
      }
    } catch (e) {
      print('Error fetching dashboard summary: $e');
    }
  }

  String _getChildStatus(ParentChild child) {
    if (_childStatuses[child.id]?['safetyStatus'] != null) {
      return _childStatuses[child.id]!['safetyStatus'].toString();
    }
    return child.stats?['status']?.toString() ?? child.safetyStatus ?? 'safe';
  }

  @override
  Widget build(BuildContext context) {
    final childrenAsync = ref.watch(childrenProvider);
    final notificationsAsync = ref.watch(notificationsProvider);
    final unreadCount = ref.watch(unreadNotificationsCountProvider);
    final authState = ref.watch(authProvider);
    final parentName = authState.user?.name ?? 'Parent';

    return Scaffold(
      appBar: AppBarCustom(
        title: 'Parent Dashboard',
        actions: [
          IconButton(
            icon: _isRefreshingStatus
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.refresh),
            onPressed: () async {
              ref.invalidate(childrenProvider);
              ref.invalidate(notificationsProvider);
              await _fetchStatuses();
              await _fetchDashboardSummary();
            },
          ),
          IconButton(
            icon: Stack(
              children: [
                const Icon(Icons.notifications_outlined),
                if (unreadCount > 0)
                  Positioned(
                    right: 0,
                    top: 0,
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: const BoxDecoration(
                        color: Colors.red,
                        shape: BoxShape.circle,
                      ),
                      constraints: const BoxConstraints(
                        minWidth: 16,
                        minHeight: 16,
                      ),
                      child: Text(
                        unreadCount > 9 ? '9+' : '$unreadCount',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  ),
              ],
            ),
            onPressed: () {
              Navigator.push<void>(
                context,
                MaterialPageRoute<void>(
                  builder: (context) => const NotificationsScreen(),
                ),
              );
            },
          ),
        ],
      ),
      bottomNavigationBar: ParentBottomNav(
        currentIndex: 0,
        onTap: (index) {
          switch (index) {
            case 0:
              // Already on dashboard
              break;
            case 1:
              Navigator.push<void>(
                context,
                MaterialPageRoute<void>(
                  builder: (context) => const ChildrenManagementScreen(),
                ),
              );
              break;
            case 2:
              Navigator.push<void>(
                context,
                MaterialPageRoute<void>(
                  builder: (context) => const QRVerificationScreen(),
                ),
              );
              break;
            case 3:
              Navigator.push<void>(
                context,
                MaterialPageRoute<void>(
                  builder: (context) => const NotificationsScreen(),
                ),
              );
              break;
            case 4:
              Navigator.push<void>(
                context,
                MaterialPageRoute<void>(
                  builder: (context) => const ParentProfileScreen(),
                ),
              );
              break;
          }
        },
      ),
      body: childrenAsync.when(
        data: (children) {
          if (children.isEmpty) {
            return EmptyState(
              message:
                  'Your children will appear here once they are linked to your account. Use the QR scanner or contact your school administrator.',
              title: 'No Children Linked',
              icon: Icons.people_outline,
            );
          }

          return RefreshIndicator(
            onRefresh: () async {
              ref.invalidate(childrenProvider);
              ref.invalidate(notificationsProvider);
              await _fetchStatuses();
              await _fetchDashboardSummary();
            },
            child: CustomScrollView(
              slivers: [
                // Welcome Header
                SliverToBoxAdapter(
                  child: Container(
                    padding: const EdgeInsets.all(16.0),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          AppColors.accentBlue.withOpacity(0.1),
                          AppColors.accentBlue.withOpacity(0.05),
                        ],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Welcome, $parentName!',
                          style: AppTextStyles.h3.copyWith(
                            color: AppColors.accentBlue,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Monitor your ${children.length} child${children.length > 1 ? 'ren' : ''} progress and safety',
                          style: AppTextStyles.bodyMedium.copyWith(
                            color: AppColors.textSecondary,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

                // Quick Stats
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Row(
                      children: [
                        Expanded(
                          child: StatCard(
                            label: 'Children',
                            value: '${children.length}',
                            icon: Icons.people,
                            iconColor: AppColors.accentBlue,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: StatCard(
                            label: 'Safe',
                            value:
                                '${_dashboardSummary?['safeChildren'] ?? children.where((c) => _getChildStatus(c) == 'safe').length}',
                            icon: Icons.check_circle,
                            iconColor: AppColors.success,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: StatCard(
                            label: 'Alerts',
                            value: '$unreadCount',
                            icon: Icons.notifications,
                            iconColor: unreadCount > 0
                                ? AppColors.error
                                : AppColors.success,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

                // Recent Activity Feed
                notificationsAsync.when(
                  data: (notifications) {
                    if (notifications.isEmpty) {
                      return const SliverToBoxAdapter(child: SizedBox.shrink());
                    }
                    final recentNotifications = notifications.take(5).toList();
                    return SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  'Recent Activity',
                                  style: AppTextStyles.h4,
                                ),
                                TextButton(
                                  onPressed: () {
                                    Navigator.push(
                                      context,
                                      MaterialPageRoute<dynamic>(
                                        builder: (context) =>
                                            const NotificationsScreen(),
                                      ),
                                    );
                                  },
                                  child: const Text('View All'),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            ...recentNotifications.map((notification) {
                              return _buildActivityItem(context, notification);
                            }),
                          ],
                        ),
                      ),
                    );
                  },
                  loading: () =>
                      const SliverToBoxAdapter(child: SizedBox.shrink()),
                  error: (_, __) =>
                      const SliverToBoxAdapter(child: SizedBox.shrink()),
                ),

                // Children List Header
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16.0, 24.0, 16.0, 8.0),
                    child: Text(
                      'My Children',
                      style: AppTextStyles.h4,
                    ),
                  ),
                ),

                // Enhanced Children List
                SliverPadding(
                  padding: const EdgeInsets.symmetric(horizontal: 16.0),
                  sliver: SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, index) {
                        final child = children[index];
                        return _buildEnhancedChildCard(context, ref, child);
                      },
                      childCount: children.length,
                    ),
                  ),
                ),

                // Quick Actions
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Quick Actions',
                          style: AppTextStyles.h4,
                        ),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Expanded(
                              child: PrimaryButton(
                                label: 'Scan QR Code',
                                icon: Icons.qr_code_scanner,
                                onPressed: () {
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute<dynamic>(
                                      builder: (context) =>
                                          const QRVerificationScreen(),
                                    ),
                                  );
                                },
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: SecondaryButton(
                                label: 'Notifications',
                                icon: Icons.notifications,
                                onPressed: () {
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute<dynamic>(
                                      builder: (context) =>
                                          const NotificationsScreen(),
                                    ),
                                  );
                                },
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),

                const SliverToBoxAdapter(
                  child: SizedBox(height: 80), // Space for FAB
                ),
              ],
            ),
          );
        },
        loading: () => const LoadingState(),
        error: (error, stack) => ErrorState(
          message: error.toString(),
          onRetry: () {
            ref.invalidate(childrenProvider);
          },
        ),
      ),
    );
  }

  Widget _buildActivityItem(
      BuildContext context, ParentNotification notification) {
    IconData icon;
    Color iconColor;

    switch (notification.type) {
      case 'drill':
        icon = Icons.flash_on;
        iconColor = AppColors.warning;
        break;
      case 'attendance':
        icon = Icons.calendar_today;
        iconColor = AppColors.info;
        break;
      case 'alert':
        icon = Icons.warning;
        iconColor = AppColors.error;
        break;
      case 'progress':
        icon = Icons.trending_up;
        iconColor = AppColors.success;
        break;
      default:
        icon = Icons.info;
        iconColor = AppColors.textSecondary;
    }

    final timeAgo = _getTimeAgo(notification.createdAt);

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.backgroundWhite,
        borderRadius: AppBorders.borderRadiusMd,
        border: Border.all(
          color: notification.read
              ? Colors.transparent
              : AppColors.accentBlue.withOpacity(0.3),
          width: notification.read ? 0 : 2,
        ),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: iconColor.withOpacity(0.1),
              borderRadius: AppBorders.borderRadiusSm,
            ),
            child: Icon(icon, color: iconColor, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  notification.title,
                  style: AppTextStyles.bodyMedium.copyWith(
                    fontWeight:
                        notification.read ? FontWeight.normal : FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  notification.message,
                  style: AppTextStyles.bodySmall.copyWith(
                    color: AppColors.textSecondary,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Text(
                  timeAgo,
                  style: AppTextStyles.caption.copyWith(
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
          if (!notification.read)
            Container(
              width: 8,
              height: 8,
              decoration: const BoxDecoration(
                color: AppColors.accentBlue,
                shape: BoxShape.circle,
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildEnhancedChildCard(
    BuildContext context,
    WidgetRef ref,
    ParentChild child,
  ) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: AppColors.backgroundWhite,
        borderRadius: AppBorders.borderRadiusLg,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute<dynamic>(
                builder: (context) => ChildDetailScreen(studentId: child.id),
              ),
            );
          },
          borderRadius: AppBorders.borderRadiusLg,
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    // Avatar
                    Container(
                      width: 56,
                      height: 56,
                      decoration: BoxDecoration(
                        color: AppColors.accentBlue.withOpacity(0.1),
                        borderRadius: AppBorders.borderRadiusMd,
                      ),
                      child: Center(
                        child: Text(
                          child.name[0].toUpperCase(),
                          style: AppTextStyles.h4.copyWith(
                            color: AppColors.accentBlue,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    // Name and Info
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            child.name,
                            style: AppTextStyles.h5.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 4),
                          if (child.grade != null && child.section != null)
                            Text(
                              'Grade ${child.grade} - Section ${child.section}',
                              style: AppTextStyles.bodySmall.copyWith(
                                color: AppColors.textSecondary,
                              ),
                            )
                          else if (child.institutionName != null)
                            Text(
                              child.institutionName!,
                              style: AppTextStyles.bodySmall.copyWith(
                                color: AppColors.textSecondary,
                              ),
                            ),
                        ],
                      ),
                    ),
                    // Status Indicator
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.success.withOpacity(0.1),
                        borderRadius: AppBorders.borderRadiusSm,
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            width: 8,
                            height: 8,
                            decoration: const BoxDecoration(
                              color: AppColors.success,
                              shape: BoxShape.circle,
                            ),
                          ),
                          const SizedBox(width: 4),
                          Text(
                            'Safe',
                            style: AppTextStyles.caption.copyWith(
                              color: AppColors.success,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                // Quick Stats Row
                Row(
                  children: [
                    Expanded(
                      child: _buildChildStat(
                        Icons.school,
                        'School',
                        child.institutionName ?? 'N/A',
                        AppColors.accentBlue,
                      ),
                    ),
                    if (child.grade != null)
                      Expanded(
                        child: _buildChildStat(
                          Icons.grade,
                          'Grade',
                          child.grade!,
                          AppColors.primaryGreen,
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 12),
                // View Details Button
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton(
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute<dynamic>(
                          builder: (context) =>
                              ChildDetailScreen(studentId: child.id),
                        ),
                      );
                    },
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Text('View Details'),
                        const SizedBox(width: 8),
                        const Icon(Icons.arrow_forward, size: 18),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildChildStat(
    IconData icon,
    String label,
    String value,
    Color color,
  ) {
    return Container(
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: AppBorders.borderRadiusSm,
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: color),
          const SizedBox(width: 6),
          Flexible(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  label,
                  style: AppTextStyles.caption.copyWith(
                    color: AppColors.textSecondary,
                  ),
                ),
                Text(
                  value,
                  style: AppTextStyles.bodySmall.copyWith(
                    color: color,
                    fontWeight: FontWeight.bold,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _getTimeAgo(DateTime dateTime) {
    final now = DateTime.now();
    final difference = now.difference(dateTime);

    if (difference.inDays > 7) {
      return DateFormat('MMM d, y').format(dateTime);
    } else if (difference.inDays > 0) {
      return '${difference.inDays} day${difference.inDays > 1 ? 's' : ''} ago';
    } else if (difference.inHours > 0) {
      return '${difference.inHours} hour${difference.inHours > 1 ? 's' : ''} ago';
    } else if (difference.inMinutes > 0) {
      return '${difference.inMinutes} minute${difference.inMinutes > 1 ? 's' : ''} ago';
    } else {
      return 'Just now';
    }
  }
}
