/// Parent Notifications Screen
/// Displays all notifications for the parent
/// Parent Monitoring System - Phase 3

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/widgets/widgets.dart';
import '../providers/parent_provider.dart';
import '../models/parent_models.dart';
import 'child_detail_screen.dart';

class NotificationsScreen extends ConsumerStatefulWidget {
  final bool embedded;
  final ValueChanged<int>? onSelectTab;

  const NotificationsScreen({
    super.key,
    this.embedded = false,
    this.onSelectTab,
  });

  @override
  ConsumerState<NotificationsScreen> createState() =>
      _NotificationsScreenState();
}

class _NotificationsScreenState extends ConsumerState<NotificationsScreen> {
  String _filter = 'all';

  @override
  Widget build(BuildContext context) {
    final notificationsAsync = ref.watch(notificationsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Alerts'),
        automaticallyImplyLeading: !widget.embedded,
        actions: [
          IconButton(
            tooltip: 'Mark all as read',
            icon: const Icon(Icons.done_all),
            onPressed: () async {
              final service = ref.read(parentServiceProvider);
              try {
                await service.markAllNotificationsRead();
                ref.invalidate(notificationsProvider);
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('All notifications marked as read'),
                    ),
                  );
                }
              } catch (e) {
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Could not mark all read: $e')),
                  );
                }
              }
            },
          ),
        ],
      ),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: Row(
              children: [
                for (final entry in [
                  ('all', 'All'),
                  ('unread', 'Unread'),
                  ('drill', 'Drills'),
                  ('achievement', 'Achievements'),
                  ('attendance', 'Attendance'),
                  ('emergency', 'Emergency'),
                ])
                  Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: FilterChip(
                      label: Text(entry.$2),
                      selected: _filter == entry.$1,
                      onSelected: (_) => setState(() => _filter = entry.$1),
                    ),
                  ),
              ],
            ),
          ),
          Expanded(
            child: notificationsAsync.when(
              data: (notifications) {
                final filteredNotifications = _filter == 'all'
                    ? notifications
                    : _filter == 'unread'
                        ? notifications.where((n) => !n.read).toList()
                        : notifications
                            .where((n) => n.type == _filter)
                            .toList();

                if (notifications.isEmpty) {
                  return const EmptyState(
                    message: 'You\'ll see school and safety updates here.',
                    title: 'No alerts yet',
                    icon: Icons.notifications_none,
                  );
                }

                if (filteredNotifications.isEmpty) {
                  return EmptyState(
                    message: 'Nothing in this filter. Try All or another type.',
                    title: 'No matching alerts',
                    icon: Icons.filter_list_off,
                  );
                }

                return RefreshIndicator(
                  onRefresh: () async {
                    ref.invalidate(notificationsProvider);
                  },
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: filteredNotifications.length,
                    itemBuilder: (context, index) {
                      final notification = filteredNotifications[index];
                      return _buildNotificationCard(notification);
                    },
                  ),
                );
              },
              loading: () => const LoadingState(),
              error: (error, stack) => ErrorState(
                message: error.toString(),
                onRetry: () {
                  ref.invalidate(notificationsProvider);
                },
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNotificationCard(ParentNotification notification) {
    IconData icon;
    Color color;

    switch (notification.type) {
      case 'drill':
        icon = Icons.flash_on;
        color = Colors.yellow;
        break;
      case 'achievement':
        icon = Icons.emoji_events;
        color = Colors.purple;
        break;
      case 'attendance':
        icon = Icons.calendar_today;
        color = Colors.blue;
        break;
      case 'emergency':
        icon = Icons.warning;
        color = Colors.red;
        break;
      default:
        icon = Icons.notifications;
        color = Colors.grey;
    }

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      color: notification.read ? null : Colors.blue.shade50,
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: color,
          child: Icon(icon, color: Colors.white),
        ),
        title: Text(
          notification.title,
          style: TextStyle(
            fontWeight: notification.read ? FontWeight.normal : FontWeight.bold,
          ),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(notification.message),
            const SizedBox(height: 4),
            Text(
              notification.createdAt.toLocal().toString().split('.')[0],
              style: const TextStyle(fontSize: 12, color: Colors.grey),
            ),
          ],
        ),
        trailing: notification.read
            ? null
            : IconButton(
                icon: const Icon(Icons.check_circle_outline),
                onPressed: () async {
                  final service = ref.read(parentServiceProvider);
                  try {
                    await service.markNotificationRead(notification.id);
                    ref.invalidate(notificationsProvider);
                  } catch (e) {
                    if (mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('Error: $e')),
                      );
                    }
                  }
                },
              ),
        onTap: () {
          if (notification.data?['studentId'] != null) {
            Navigator.push(
              context,
              MaterialPageRoute<dynamic>(
                builder: (context) => ChildDetailScreen(
                  studentId: notification.data!['studentId'].toString(),
                ),
              ),
            );
          }
        },
      ),
    );
  }
}
