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
import 'notifications_screen.dart';
import 'children_management_screen.dart';
import 'parent_shell_screen.dart';
import '../../auth/providers/auth_provider.dart';
import '../widgets/parent_bottom_nav.dart';
import '../services/parent_service.dart';
import '../../../core/providers/api_service_provider.dart';

class ParentDashboardScreen extends ConsumerStatefulWidget {
  /// When true, owned by [ParentShellScreen] (no own bottom nav).
  final bool embedded;
  final ValueChanged<int>? onSelectTab;

  const ParentDashboardScreen({
    super.key,
    this.embedded = false,
    this.onSelectTab,
  });

  @override
  ConsumerState<ParentDashboardScreen> createState() =>
      _ParentDashboardScreenState();
}

class _ParentDashboardScreenState extends ConsumerState<ParentDashboardScreen> {
  Map<String, Map<String, dynamic>> _childStatuses = {};
  final Set<String> _statusRefreshFailed = {};
  bool _isRefreshingStatus = false;
  Timer? _refreshTimer;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _fetchStatuses();
      // Set up periodic refresh every 30 seconds for status
      _refreshTimer = Timer.periodic(const Duration(seconds: 30), (_) {
        if (mounted) {
          _fetchStatuses();
        }
      });
    });
  }

  @override
  void dispose() {
    _refreshTimer?.cancel();
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
      final merged = Map<String, Map<String, dynamic>>.from(_childStatuses);
      final failed = Set<String>.from(_statusRefreshFailed);

      for (final child in children) {
        try {
          final status = await parentService.getChildStatus(child.id);
          merged[child.id] = status;
          failed.remove(child.id);
        } catch (e) {
          failed.add(child.id);
        }
      }

      if (mounted) {
        setState(() {
          _childStatuses = merged;
          _statusRefreshFailed
            ..clear()
            ..addAll(failed);
          _isRefreshingStatus = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isRefreshingStatus = false;
        });
      }
    }
  }

  String _getChildStatus(ParentChild child) {
    // Prefer live status poll (`status`), then stats, then persisted field.
    // Never invent "safe" when no explicit report exists.
    final live = _childStatuses[child.id];
    final liveStatus = live?['status'] ?? live?['safetyStatus'];
    final raw = liveStatus?.toString() ??
        child.stats?['status']?.toString() ??
        child.safetyStatus;
    if (raw == null || raw.trim().isEmpty || raw == 'unknown') {
      return 'unavailable';
    }
    return raw.trim().toLowerCase();
  }

  String _statusLabel(String status) {
    switch (status) {
      case 'safe':
        return 'Reported safe';
      case 'in_drill':
        return 'In drill';
      case 'missing':
        return 'Reported missing';
      case 'at_risk':
        return 'At risk';
      case 'evacuating':
        return 'Evacuating';
      case 'emergency':
        return 'Emergency';
      case 'unavailable':
      default:
        return 'Status unavailable';
    }
  }

  Color _statusAccent(String status) {
    switch (status) {
      case 'safe':
        return AppColors.success;
      case 'in_drill':
        return AppColors.warning;
      case 'missing':
      case 'at_risk':
      case 'evacuating':
      case 'emergency':
        return AppColors.error;
      default:
        return AppColors.textSecondary;
    }
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
        title: widget.embedded ? 'Dashboard' : 'Parent Dashboard',
        automaticallyImplyLeading: !widget.embedded,
        actions: [
          IconButton(
            tooltip: 'Refresh',
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
            },
          ),
          IconButton(
            tooltip: 'Alerts',
            icon: Stack(
              children: [
                const Icon(Icons.notifications_outlined),
                if ((unreadCount ?? 0) > 0)
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
                        unreadCount! > 9 ? '9+' : '$unreadCount',
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
              if (widget.onSelectTab != null) {
                widget.onSelectTab!(3);
              } else {
                Navigator.push<void>(
                  context,
                  MaterialPageRoute<void>(
                    builder: (context) => const NotificationsScreen(),
                  ),
                );
              }
            },
          ),
        ],
      ),
      bottomNavigationBar: widget.embedded
          ? null
          : ParentBottomNav(
              currentIndex: 0,
              onTap: (index) {
                if (index == 0) return;
                // Standalone fallback: open shell at selected tab
                Navigator.pushReplacement<void, void>(
                  context,
                  MaterialPageRoute<void>(
                    builder: (context) => ParentShellScreen(initialTabIndex: index),
                  ),
                );
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
                          'Hello, $parentName',
                          style: AppTextStyles.h3.copyWith(
                            color: AppColors.accentBlue,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Linked children and their latest reports',
                          style: AppTextStyles.bodyMedium.copyWith(
                            color: AppColors.textSecondary,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

                // Compact summary
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
                    child: Wrap(
                      spacing: 12,
                      runSpacing: 8,
                      children: [
                        _summaryChip(
                          Icons.people_outline,
                          '${children.length} linked',
                        ),
                        _summaryChip(
                          Icons.notifications_outlined,
                          unreadCount == null
                              ? 'Alerts…'
                              : '${unreadCount} unread',
                        ),
                        if (_statusRefreshFailed.isNotEmpty)
                          _summaryChip(
                            Icons.sync_problem,
                            'Could not refresh ${_statusRefreshFailed.length}',
                            accent: AppColors.warning,
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
                                  'Recent activity',
                                  style: AppTextStyles.h4,
                                ),
                                TextButton(
                                  onPressed: () {
                                    if (widget.onSelectTab != null) {
                                      widget.onSelectTab!(3);
                                    } else {
                                      Navigator.push<void>(
                                        context,
                                        MaterialPageRoute<void>(
                                          builder: (context) =>
                                              const NotificationsScreen(),
                                        ),
                                      );
                                    }
                                  },
                                  child: const Text('View all'),
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
                    child: Row(
                      children: [
                        Expanded(
                          child: Text(
                            'My children',
                            style: AppTextStyles.h4,
                          ),
                        ),
                        TextButton(
                          onPressed: () {
                            if (widget.onSelectTab != null) {
                              widget.onSelectTab!(1);
                            } else {
                              Navigator.push<void>(
                                context,
                                MaterialPageRoute<void>(
                                  builder: (context) =>
                                      const ChildrenManagementScreen(),
                                ),
                              );
                            }
                          },
                          child: const Text('Manage'),
                        ),
                      ],
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

                const SliverToBoxAdapter(
                  child: SizedBox(height: 24),
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
                          child.name.trim().isNotEmpty
                              ? child.name.trim()[0].toUpperCase()
                              : '?',
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
                            child.name.trim().isNotEmpty
                                ? child.name
                                : 'Unnamed child',
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
                    // Status Indicator — driven by explicit report only
                    Builder(
                      builder: (context) {
                        final status = _getChildStatus(child);
                        final accent = _statusAccent(status);
                        return Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: accent.withOpacity(0.1),
                            borderRadius: AppBorders.borderRadiusSm,
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Container(
                                width: 8,
                                height: 8,
                                decoration: BoxDecoration(
                                  color: accent,
                                  shape: BoxShape.circle,
                                ),
                              ),
                              const SizedBox(width: 4),
                              Text(
                                _statusLabel(status),
                                style: AppTextStyles.caption.copyWith(
                                  color: accent,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                        );
                      },
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                // School once + preparedness secondary
                Text(
                  [
                    if (child.institutionName != null &&
                        child.institutionName!.trim().isNotEmpty)
                      child.institutionName!.trim(),
                    if (child.grade != null && child.grade!.trim().isNotEmpty)
                      child.section != null && child.section!.trim().isNotEmpty
                          ? 'Grade ${child.grade} · Section ${child.section}'
                          : 'Grade ${child.grade}',
                  ].join(' · '),
                  style: AppTextStyles.bodySmall.copyWith(
                    color: AppColors.textSecondary,
                  ),
                ),
                if (_statusRefreshFailed.contains(child.id)) ...[
                  const SizedBox(height: 6),
                  Text(
                    'Could not refresh · showing last known status',
                    style: AppTextStyles.caption.copyWith(
                      color: AppColors.warning,
                    ),
                  ),
                ],
                const SizedBox(height: 8),
                Row(
                  children: [
                    Text(
                      () {
                        final score = child.stats?['preparednessScore'];
                        if (score == null) return 'Preparedness unavailable';
                        return 'Preparedness $score/100';
                      }(),
                      style: AppTextStyles.caption.copyWith(
                        color: AppColors.textSecondary,
                      ),
                    ),
                    const Spacer(),
                    Text(
                      'Open details',
                      style: AppTextStyles.caption.copyWith(
                        color: AppColors.accentBlue,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const Icon(Icons.chevron_right, size: 18),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _summaryChip(IconData icon, String label, {Color? accent}) {
    final color = accent ?? AppColors.accentBlue;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withValues(alpha: 0.25)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: color),
          const SizedBox(width: 6),
          Text(
            label,
            style: AppTextStyles.caption.copyWith(
              color: color,
              fontWeight: FontWeight.w600,
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
