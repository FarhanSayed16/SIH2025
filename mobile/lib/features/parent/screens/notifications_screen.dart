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
  const NotificationsScreen({super.key});

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
        title: const Text('Notifications'),
        actions: [
          PopupMenuButton<String>(
            onSelected: (value) {
              setState(() {
                _filter = value;
              });
              // TODO: Implement filtering
            },
            itemBuilder: (context) => [
              const PopupMenuItem(value: 'all', child: Text('All')),
              const PopupMenuItem(value: 'unread', child: Text('Unread')),
              const PopupMenuItem(value: 'drill', child: Text('Drills')),
              const PopupMenuItem(
                  value: 'achievement', child: Text('Achievements')),
              const PopupMenuItem(
                  value: 'attendance', child: Text('Attendance')),
              const PopupMenuItem(value: 'emergency', child: Text('Emergency')),
            ],
          ),
        ],
      ),
      body: notificationsAsync.when(
        data: (notifications) {
          final filteredNotifications = _filter == 'all'
              ? notifications
              : _filter == 'unread'
                  ? notifications.where((n) => !n.read).toList()
                  : notifications.where((n) => n.type == _filter).toList();

          if (filteredNotifications.isEmpty) {
            return const EmptyState(
              message: 'You\'re all caught up!',
              title: 'No Notifications',
              icon: Icons.notifications_none,
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
      floatingActionButton: FloatingActionButton(
        onPressed: () async {
          final service = ref.read(parentServiceProvider);
          try {
            await service.markAllNotificationsRead();
            ref.invalidate(notificationsProvider);
            if (mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                    content: Text('All notifications marked as read')),
              );
            }
          } catch (e) {
            if (mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('Error: $e')),
              );
            }
          }
        },
        child: const Icon(Icons.done_all),
        tooltip: 'Mark all as read',
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
