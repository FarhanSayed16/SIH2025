import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../emergency/screens/crisis_mode_screen.dart'; // Phase 4.1: Enhanced crisis mode
import '../../emergency/screens/red_alert_screen.dart'; // Legacy fallback

/// FCM Message Handler - Handles FCM messages and navigates accordingly
class FcmMessageHandler {
  final BuildContext context;
  final WidgetRef ref;

  FcmMessageHandler(this.context, this.ref);

  /// Handle FCM message
  void handleMessage(RemoteMessage message) {
    final data = message.data;
    final notification = message.notification;

    // Check message type
    final messageType = data['type'] ?? data['event'] ?? '';

    switch (messageType) {
      case 'CRISIS_ALERT':
      case 'crisis_alert':
        _handleCrisisAlert(data, notification);
        break;

      case 'DEVICE_ALERT':
      case 'device_alert':
      case 'iot_alert':
        // Phase 201: Handle IoT device alerts
        _handleDeviceAlert(data, notification);
        break;

      case 'DRILL_SCHEDULED':
      case 'drill_scheduled':
        _handleDrillScheduled(data, notification);
        break;

      case 'drill_start':
      case 'DRILL_START':
        // Phase 2: Handle drill start notification
        _handleDrillStart(data, notification);
        break;

      case 'drill_end':
      case 'DRILL_END':
        // Phase 2: Handle drill end notification
        _handleDrillEnd(data, notification);
        break;

      case 'ALERT_RESOLVED':
      case 'alert_resolved':
        _handleAlertResolved(data, notification);
        break;

      case 'BROADCAST':
      case 'broadcast':
        // Phase 3.4.3: Handle broadcast messages
        _handleBroadcast(data, notification);
        break;

      default:
        // Generic notification
        _handleGenericNotification(notification);
    }
  }

  /// Phase 4.1: Handle crisis alert with enhanced Crisis Mode Screen
  void _handleCrisisAlert(
      Map<String, dynamic> data, RemoteNotification? notification) {
    final alertId = data['alertId'] ?? data['_id'] ?? '';
    final alertType = (data['alertType'] as String?) ??
        (data['type'] as String?) ??
        'emergency';
    final message = notification?.body ??
        data['title'] ??
        (data['message'] as String?) ??
        'Emergency alert';
    final description = data['description'] as String?;
    final location = data['location'];
    final severity = (data['severity'] as String?) ?? 'high';
    final source = data['source'] as String?; // IoT, Admin, Teacher, AI, NDMA
    final drillFlag =
        data['drillFlag'] as bool? ?? false; // Phase 4.1: Drill vs Real
    final drillId = data['drillId'] as String?;
    final locationDetails = data['locationDetails'] as Map<String, dynamic>?;

    if (context.mounted) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (context) => CrisisModeScreen(
            alertId: alertId.toString(),
            alertType: alertType.toString().toLowerCase(),
            message: description ?? message.toString(),
            location: location?.toString(),
            severity: severity.toString(),
            source: source?.toString(),
            isDrill: drillFlag,
            drillId: drillId?.toString(),
            locationDetails: locationDetails,
          ),
        ),
      );
    }
  }

  /// Handle drill scheduled
  void _handleDrillScheduled(
      Map<String, dynamic> data, RemoteNotification? notification) {
    final drillType =
        (data['drillType'] as String?) ?? (data['type'] as String?) ?? 'drill';

    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Drill scheduled: ${_formatDrillType(drillType)}'),
          action: SnackBarAction(
            label: 'View',
            onPressed: () {
              // TODO: Navigate to drill details (Phase 3)
            },
          ),
          duration: const Duration(seconds: 5),
        ),
      );
    }
  }

  /// Phase 3.4.2: Handle IoT device alert
  void _handleDeviceAlert(
      Map<String, dynamic> data, RemoteNotification? notification) {
    final deviceType = (data['deviceType'] as String?) ?? 'sensor';
    final message = notification?.body ??
        (data['description'] as String?) ??
        'IoT device alert detected';
    final severity = (data['severity'] as String?) ?? 'high';

    if (context.mounted) {
      // Show notification and navigate to alert screen if critical
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Device Alert: ${_formatDeviceType(deviceType)}'),
          backgroundColor: severity == 'critical' ? Colors.red : Colors.orange,
          duration: const Duration(seconds: 5),
          action: SnackBarAction(
            label: 'View',
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (context) => RedAlertScreen(
                    alertType: 'device_alert',
                    message: message,
                    severity: severity,
                  ),
                ),
              );
            },
          ),
        ),
      );

      // Navigate directly if critical
      if (severity == 'critical') {
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (context) => RedAlertScreen(
              alertType: 'device_alert',
              message: message,
              severity: severity,
            ),
          ),
        );
      }
    }
  }

  /// Format device type for display
  String _formatDeviceType(String type) {
    switch (type.toLowerCase()) {
      case 'fire-sensor':
      case 'smoke-sensor':
        return 'Fire Sensor';
      case 'flood-sensor':
        return 'Flood Sensor';
      case 'motion-sensor':
        return 'Motion Sensor';
      case 'temperature-sensor':
        return 'Temperature Sensor';
      case 'panic-button':
        return 'Panic Button';
      default:
        return 'IoT Device';
    }
  }

  /// Handle alert resolved
  void _handleAlertResolved(
      Map<String, dynamic> data, RemoteNotification? notification) {
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Alert has been resolved'),
          backgroundColor: Colors.green,
        ),
      );
    }
  }

  /// Phase 3.4.3: Handle broadcast messages
  void _handleBroadcast(
      Map<String, dynamic> data, RemoteNotification? notification) {
    final priority = (data['priority'] as String?) ?? 'medium';
    final message = notification?.body ??
        (data['message'] as String?) ??
        'New broadcast message';
    final title =
        notification?.title ?? (data['title'] as String?) ?? 'Broadcast';

    if (context.mounted) {
      // Show notification with appropriate styling based on priority
      Color backgroundColor;
      Duration duration;

      switch (priority.toLowerCase()) {
        case 'urgent':
          backgroundColor = Colors.red;
          duration = const Duration(seconds: 10);
          break;
        case 'high':
          backgroundColor = Colors.orange;
          duration = const Duration(seconds: 7);
          break;
        default:
          backgroundColor = Colors.blue;
          duration = const Duration(seconds: 5);
      }

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                title,
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
              Text(message),
            ],
          ),
          backgroundColor: backgroundColor,
          duration: duration,
          action: SnackBarAction(
            label: 'View',
            textColor: Colors.white,
            onPressed: () {
              // TODO: Navigate to broadcast details screen (Phase 3.4.3)
              // For now, just show a dialog
              showDialog(
                context: context,
                builder: (context) => AlertDialog(
                  title: Text(title),
                  content: Text(message),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.of(context).pop(),
                      child: const Text('Close'),
                    ),
                  ],
                ),
              );
            },
          ),
        ),
      );

      // For urgent broadcasts, also show dialog immediately
      if (priority.toLowerCase() == 'urgent') {
        showDialog(
          context: context,
          barrierDismissible: false,
          builder: (context) => AlertDialog(
            title: Row(
              children: [
                const Icon(Icons.warning, color: Colors.red),
                const SizedBox(width: 8),
                Expanded(child: Text(title)),
              ],
            ),
            content: Text(message),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(context).pop(),
                child: const Text('Acknowledge'),
              ),
            ],
          ),
        );
      }
    }
  }

  /// Handle generic notification
  void _handleGenericNotification(RemoteNotification? notification) {
    if (context.mounted && notification != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(notification.body ?? 'New notification'),
          duration: const Duration(seconds: 3),
        ),
      );
    }
  }

  /// Phase 2: Handle drill start notification
  void _handleDrillStart(
      Map<String, dynamic> data, RemoteNotification? notification) {
    final drillId = data['drillId']?.toString() ?? '';
    final drillType = (data['drillType'] as String?) ?? 'drill';
    final duration = int.tryParse(data['duration']?.toString() ?? '10') ?? 10;

    if (drillId.isEmpty) {
      print('⚠️ Drill start notification missing drillId');
      return;
    }

    if (context.mounted) {
      // Navigate to CrisisModeScreen in drill mode (existing screen handles drills)
      Navigator.of(context).pushReplacement<void, void>(
        MaterialPageRoute<void>(
          builder: (context) => CrisisModeScreen(
            alertId: drillId,
            alertType: drillType.toLowerCase(),
            message: 'PRACTICE DRILL — Please acknowledge your participation',
            isDrill: true,
            drillId: drillId,
            drillType: drillType,
            drillDuration: duration,
          ),
        ),
      );
    }
  }

  /// Phase 2: Handle drill end notification
  void _handleDrillEnd(
      Map<String, dynamic> data, RemoteNotification? notification) {
    final participationRate =
        int.tryParse(data['participationRate']?.toString() ?? '0') ?? 0;

    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Drill completed. Participation: $participationRate%'),
          backgroundColor: Colors.green,
          duration: const Duration(seconds: 5),
          action: SnackBarAction(
            label: 'View Summary',
            textColor: Colors.white,
            onPressed: () {
              // TODO: Navigate to drill summary (Phase 4)
            },
          ),
        ),
      );
    }
  }

  /// Format drill type for display
  String _formatDrillType(String type) {
    switch (type.toLowerCase()) {
      case 'fire':
        return 'Fire Drill';
      case 'earthquake':
        return 'Earthquake Drill';
      case 'flood':
        return 'Flood Drill';
      case 'cyclone':
        return 'Cyclone Drill';
      default:
        return 'Safety Drill';
    }
  }
}
