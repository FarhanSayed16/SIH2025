/// Phase 4.1: Enhanced Socket Event Handler
/// Handles all Socket.io events including Phase 4.0 events

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/constants/socket_events.dart'; // Phase 4.0
import '../../emergency/screens/crisis_mode_screen.dart';
import '../../socket/providers/socket_provider.dart';
import '../../emergency/services/crisis_alert_service.dart';
import '../../drills/screens/drill_detail_screen.dart'; // Phase 4.2
import '../../mesh/providers/mesh_provider.dart'; // Phase 5.2: Battery duty cycle
import '../../iot/widgets/iot_alert_dialog.dart'; // Phase 201
import '../../iot/services/alert_sound_service.dart'; // Phase 201
import '../../auth/providers/auth_provider.dart';

/// Socket Event Handler - Handles all socket events
class SocketEventHandler {
  final BuildContext context;
  final WidgetRef ref;

  SocketEventHandler(this.context, this.ref);

  /// Setup all event handlers
  void setupHandlers() {
    final socketNotifier = ref.read(socketProvider.notifier);

    // Phase 4.0: DRILL_SCHEDULED event
    socketNotifier.on(SocketEvents.drillScheduled, (data) {
      _handleDrillScheduled(data);
    });

    // Phase 4.0: CRISIS_ALERT event (enhanced with drillFlag)
    socketNotifier.on(SocketEvents.crisisAlert, (data) {
      _handleCrisisAlert(data);
    });

    // Phase 4.0: DRILL_START event
    socketNotifier.on(SocketEvents.drillStart, (data) {
      _handleDrillStart(data);
    });

    // Phase 4.0: DRILL_END event
    socketNotifier.on(SocketEvents.drillEnd, (data) {
      _handleDrillEnd(data);
    });

    // DRILL_SUMMARY event
    socketNotifier.on(SocketEvents.drillSummary, (data) {
      _handleDrillSummary(data);
    });

    // Phase 201: IoT Device Events
    socketNotifier.on(SocketEvents.telemetryUpdate, (data) {
      if (data is Map<String, dynamic>) {
        _handleTelemetryUpdate(data);
      }
    });

    socketNotifier.on(SocketEvents.deviceAlert, (data) {
      if (data is Map<String, dynamic>) {
        _handleDeviceAlert(data);
      }
    });

    // Phase 2: DRILL_PARTICIPATION_UPDATE event
    socketNotifier.on('DRILL_PARTICIPATION_UPDATE', (data) {
      _handleDrillParticipationUpdate(data);
    });

    // Phase 4.0: USER_STATUS_UPDATE event (enhanced)
    socketNotifier.on(SocketEvents.userStatusUpdate, (data) {
      _handleUserStatusUpdate(data);
    });

    // Legacy: STUDENT_STATUS_UPDATE event (backward compatibility)
    socketNotifier.on(SocketEvents.studentStatusUpdate, (data) {
      _handleUserStatusUpdate(data);
    });

    // Phase 4.0: ALERT_CANCEL event
    socketNotifier.on(SocketEvents.alertCancel, (data) {
      _handleAlertCancel(data);
    });

    // ALERT_RESOLVED event
    socketNotifier.on(SocketEvents.alertResolved, (data) {
      _handleAlertResolved(data);
    });

    // Phase 4.0: SERVER_HEARTBEAT
    socketNotifier.on(SocketEvents.serverHeartbeat, (data) {
      // Heartbeat received - connection is alive
      // No UI action needed
    });

    // Phase 5.7: AR_PATH_TRIGGER event
    socketNotifier.on(SocketEvents.arPathTrigger, (data) {
      _handleARPathTrigger(data);
    });

    // Phase 3: Student Activity Events
    socketNotifier.on(SocketEvents.studentActivityUpdate, (data) {
      _handleStudentActivityUpdate(data);
    });

    socketNotifier.on(SocketEvents.studentProgressUpdate, (data) {
      _handleStudentProgressUpdate(data);
    });

    socketNotifier.on(SocketEvents.classActivityUpdate, (data) {
      _handleClassActivityUpdate(data);
    });

    // Phase 6: Parent Notifications
    socketNotifier.on(SocketEvents.parentNotification, (data) {
      _handleParentNotification(data);
    });

    socketNotifier.on(SocketEvents.qrCodeScanned, (data) {
      _handleQRCodeScanned(data);
    });

    // Phase 7: Teacher Notifications
    socketNotifier.on(SocketEvents.teacherNotification, (data) {
      _handleTeacherNotification(data);
    });

    socketNotifier.on(SocketEvents.parentVerificationRequest, (data) {
      _handleParentVerificationRequest(data);
    });

    // SOS events
    socketNotifier.on(SocketEvents.sosAlert, (data) {
      _handleSosAlert(data);
    });

    socketNotifier.on(SocketEvents.sosSafe, (data) {
      _handleSosSafe(data);
    });
  }

  /// Handle DRILL_SCHEDULED event
  void _handleDrillScheduled(dynamic data) {
    final dataMap = data as Map<String, dynamic>;
    final drillId = dataMap['drillId'] ?? dataMap['_id'];
    final drillType = (dataMap['type'] as String?) ?? 'drill';

    // Show banner notification
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Drill scheduled: ${_formatDrillType(drillType)}'),
          action: SnackBarAction(
            label: 'View',
            onPressed: () {
              // Phase 4.2: Navigate to drill details
              if (context.mounted && drillId != null) {
                Navigator.of(context).push<void>(
                  MaterialPageRoute<void>(
                    builder: (context) => DrillDetailScreen(
                      drillId: drillId.toString(),
                    ),
                  ),
                );
              }
            },
          ),
          duration: const Duration(seconds: 5),
        ),
      );
    }
  }

  /// Phase 4.1: Handle CRISIS_ALERT event with Phase 4.0 enhancements
  void _handleCrisisAlert(dynamic data) {
    final dataMap = data as Map<String, dynamic>;
    final alertId = dataMap['alertId'] ?? dataMap['_id'] ?? '';
    final alertType = (dataMap['type'] as String?) ?? 'emergency';
    final message = dataMap['title'] ?? dataMap['message'] ?? 'Emergency alert';
    final description = dataMap['description'] as String?;
    final location = dataMap['location'];
    final severity = (dataMap['severity'] as String?) ?? 'high';
    final source =
        dataMap['source'] as String?; // IoT, Admin, Teacher, AI, NDMA
    final drillFlag =
        dataMap['drillFlag'] as bool? ?? false; // Phase 4.1: Drill vs Real
    final drillId = dataMap['drillId'] as String?;
    final locationDetails = dataMap['locationDetails'] as Map<String, dynamic>?;

    // Phase 5.2: Notify battery-aware mesh manager about active alert (high duty cycle)
    try {
      ref.read(meshConnectivityProvider.notifier).setActiveAlert(true);
    } catch (e) {
      // Mesh provider might not be initialized - that's okay
    }

    // Cache alert for offline access
    _cacheAlert(dataMap);

    // Navigate to Enhanced Crisis Mode Screen
    if (context.mounted) {
      Navigator.of(context).pushReplacement<void, void>(
        MaterialPageRoute<void>(
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

  /// Phase 4.0: Handle DRILL_START event
  /// Phase 4.2: Enhanced to navigate to Crisis Mode in Drill Mode
  /// Phase 2: Enhanced with proper navigation
  void _handleDrillStart(dynamic data) {
    final dataMap = data as Map<String, dynamic>;
    final drillId = dataMap['drillId'] ?? dataMap['_id'];
    final drillType = (dataMap['type'] as String?) ?? 'drill';
    final startTime = dataMap['startTime'];
    final duration = dataMap['duration'] ?? 10;

    // Show a full-screen drill popup first (unmissable)
    if (context.mounted) {
      IoTAlertDialog.show(
        context,
        alertType: drillType.toString().toUpperCase(),
        deviceId: drillId?.toString() ?? 'DRILL',
        deviceName: 'DRILL',
        deviceType: 'DRILL',
        room: '',
        sensorData: <String, dynamic>{
          'status': 'PRACTICE DRILL — This is not a real emergency',
          if (startTime != null) 'startTime': startTime.toString(),
          'durationMinutes': duration is int ? duration : 10,
        },
        severity: 'DRILL',
        timestamp: DateTime.now(),
      );
    }

    // Navigate to Crisis Mode in Drill Mode (single navigation)
    if (context.mounted && drillId != null) {
      Navigator.of(context).pushReplacement<void, void>(
        MaterialPageRoute<void>(
          builder: (context) => CrisisModeScreen(
            alertId: drillId.toString(),
            alertType: drillType.toString().toLowerCase(),
            message: 'PRACTICE DRILL — This is not a real emergency',
            isDrill: true,
            drillId: drillId.toString(),
            drillType: drillType.toString(),
            drillDuration: duration is int ? duration : 10,
          ),
        ),
      );
    }

    // Show drill start notification
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Drill started: ${_formatDrillType(drillType)}'),
          backgroundColor: Colors.orange,
          duration: const Duration(seconds: 5),
        ),
      );
    }
  }

  /// Phase 4.0: Handle DRILL_END event
  void _handleDrillEnd(dynamic data) {
    // Show drill end notification
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('✓ Drill ended'),
          backgroundColor: Colors.green,
          duration: Duration(seconds: 3),
        ),
      );
    }
  }

  /// Handle DRILL_SUMMARY event
  void _handleDrillSummary(dynamic data) {
    // final drillId = data['drillId'] ?? data['_id'];
    final ackCount = data['ackCount'] ?? data['acknowledgedCount'] ?? 0;
    final total = data['total'] ?? data['totalParticipants'] ?? 0;
    final summary =
        data['summary'] as Map<String, dynamic>? ?? <String, dynamic>{};

    // Show summary modal
    if (context.mounted) {
      showDialog<void>(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text('Drill Summary'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Acknowledged: $ackCount / $total'),
              if (summary['averageTime'] != null)
                Text('Average Time: ${summary['averageTime']}s'),
              if (summary['completionRate'] != null)
                Text('Completion Rate: ${summary['completionRate']}%'),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Close'),
            ),
          ],
        ),
      );
    }
  }

  /// Phase 2: Handle DRILL_PARTICIPATION_UPDATE event
  void _handleDrillParticipationUpdate(dynamic data) {
    final dataMap = data as Map<String, dynamic>;
    final acknowledgedCount = dataMap['acknowledgedCount'] ?? 0;
    final totalParticipants = dataMap['totalParticipants'] ?? 0;
    final participationRate = dataMap['participationRate'] ?? 0;

    // Log participation update (for debugging)
    print(
        '📊 Drill participation update: $acknowledgedCount/$totalParticipants acknowledged ($participationRate%)');

    // Phase 2: This will be used by drill screens to update their UI
    // For now, just log it - drill screens will poll or listen to this
    if (context.mounted) {
      // Future: Could emit a Riverpod state update here for drill screens to listen to
    }
  }

  /// Phase 4.0: Handle USER_STATUS_UPDATE event (enhanced)
  void _handleUserStatusUpdate(dynamic data) {
    final status = data['status'] ?? data['safetyStatus'];
    final userName = data['userName'];

    // TODO: Update UI with user status (Phase 4.6: Admin Command Center)
    // This will be used in admin/teacher views to show real-time status
    print('User status update: $userName - $status');
  }

  /// Phase 4.0: Handle ALERT_CANCEL event
  void _handleAlertCancel(dynamic data) {
    final reason = data['reason'] as String? ?? 'Alert cancelled';

    // Phase 5.2: Clear active alert status (return to peace mode duty cycle)
    try {
      ref.read(meshConnectivityProvider.notifier).setActiveAlert(false);
    } catch (e) {
      // Mesh provider might not be initialized - that's okay
    }

    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Alert cancelled: $reason'),
          backgroundColor: Colors.grey,
          duration: const Duration(seconds: 5),
        ),
      );

      // Pop crisis mode screen if currently showing
      Navigator.of(context).popUntil((route) {
        return route.settings.name != '/crisis-mode' &&
            !(route.settings.arguments is Map &&
                (route.settings.arguments as Map)['isCrisis'] == true);
      });
    }
  }

  /// Handle ALERT_RESOLVED event
  void _handleAlertResolved(dynamic data) {
    // Phase 5.2: Clear active alert status (return to peace mode duty cycle)
    try {
      ref.read(meshConnectivityProvider.notifier).setActiveAlert(false);
    } catch (e) {
      // Mesh provider might not be initialized - that's okay
    }

    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('✓ Alert has been resolved'),
          backgroundColor: Colors.green,
          duration: Duration(seconds: 5),
        ),
      );
    }
  }

  /// Cache alert for offline access
  void _cacheAlert(Map<String, dynamic> alertData) {
    try {
      final crisisService = ref.read(crisisAlertServiceProvider);
      crisisService.cacheAlert(alertData);
    } catch (e) {
      print('Error caching alert: $e');
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

  /// Phase 3: Handle STUDENT_ACTIVITY_UPDATE event
  void _handleStudentActivityUpdate(dynamic data) {
    final dataMap = data as Map<String, dynamic>;
    final activityType = dataMap['activityType'] as String?;
    final activityData = dataMap['activityData'] as Map<String, dynamic>?;

    // Show notification for important activities
    if (context.mounted && activityType != null) {
      String message = 'Activity update';
      switch (activityType) {
        case 'module_complete':
          message =
              'Module completed: ${activityData?['moduleName'] ?? 'Module'}';
          break;
        case 'quiz_complete':
          message = 'Quiz completed!';
          break;
        case 'badge_earned':
          message = 'Badge earned: ${activityData?['badgeName'] ?? 'Badge'}';
          break;
        default:
          message = 'New activity update';
      }

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(message),
          duration: const Duration(seconds: 3),
        ),
      );
    }
  }

  /// Phase 3: Handle STUDENT_PROGRESS_UPDATE event
  void _handleStudentProgressUpdate(dynamic data) {
    final dataMap = data as Map<String, dynamic>;
    final progress = dataMap['progress'] as Map<String, dynamic>?;

    if (context.mounted && progress != null) {
      // Update progress indicators if needed
      // This could trigger a UI refresh in progress screens
      print('📊 Progress update received: ${progress['preparednessScore']}%');
    }
  }

  /// Phase 3: Handle CLASS_ACTIVITY_UPDATE event
  void _handleClassActivityUpdate(dynamic data) {
    final dataMap = data as Map<String, dynamic>;
    final activityType = dataMap['activityType'] as String?;

    if (context.mounted && activityType != null) {
      // Show class-wide activity updates
      print('📚 Class activity update: $activityType');
    }
  }

  /// Phase 6: Handle PARENT_NOTIFICATION event
  void _handleParentNotification(dynamic data) {
    final dataMap = data as Map<String, dynamic>;
    final activityType = dataMap['activityType'] as String?;

    if (context.mounted && activityType != null) {
      String message = 'Your child has a new activity update';
      switch (activityType) {
        case 'module_complete':
          message = 'Your child completed a module!';
          break;
        case 'quiz_complete':
          message = 'Your child completed a quiz!';
          break;
        case 'badge_earned':
          message = 'Your child earned a badge!';
          break;
        case 'safety_status_change':
          message = 'Your child\'s safety status changed';
          break;
        case 'drill_participation':
          message = 'Your child is participating in a drill';
          break;
      }

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(message),
          duration: const Duration(seconds: 5),
          action: SnackBarAction(
            label: 'View',
            onPressed: () {
              // Navigate to child activity screen if studentId is available
              // This would require passing studentId through navigation
            },
          ),
        ),
      );
    }
  }

  /// Phase 6: Handle QR_CODE_SCANNED event
  void _handleQRCodeScanned(dynamic data) {
    final dataMap = data as Map<String, dynamic>;
    final verified = dataMap['verified'] as bool? ?? false;

    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            verified
                ? 'Your QR code was scanned and verified'
                : 'QR code scan failed',
          ),
          backgroundColor: verified ? Colors.green : Colors.red,
          duration: const Duration(seconds: 5),
        ),
      );
    }
  }

  /// Phase 7: Handle TEACHER_NOTIFICATION event
  void _handleTeacherNotification(dynamic data) {
    final dataMap = data as Map<String, dynamic>;
    final message = dataMap['message'] as String? ?? 'New notification';

    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(message),
          duration: const Duration(seconds: 5),
          action: SnackBarAction(
            label: 'View',
            onPressed: () {
              // Navigate to relevant screen based on notification type
              // This would require passing context or using a navigation service
            },
          ),
        ),
      );
    }
  }

  /// Phase 7: Handle PARENT_VERIFICATION_REQUEST event
  void _handleParentVerificationRequest(dynamic data) {
    // Show minimal notice
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Parent verification requested'),
          duration: Duration(seconds: 5),
        ),
      );
    }
  }

  // SOS handlers
  void _handleSosAlert(dynamic data) {
    if (!context.mounted) return;
    final map = data is Map<String, dynamic>
        ? Map<String, dynamic>.from(data)
        : <String, dynamic>{};

    // Only surface student SOS to teachers/parents/admin
    final currentUser = ref.read(authProvider).user;
    final currentRole = currentUser?.role.toLowerCase();
    final senderRole = (map['role'] as String?)?.toLowerCase();
    final isStudentSos = senderRole == 'student';
    final canSee = currentRole == 'teacher' ||
        currentRole == 'parent' ||
        currentRole == 'admin' ||
        !isStudentSos; // non-student senders show to all
    if (!canSee) return;

    final from = map['userName'] ?? map['name'] ?? senderRole ?? 'User';
    final loc = map['location'];
    final locText = (loc is Map && loc['lat'] != null && loc['lng'] != null)
        ? '(${loc['lat']}, ${loc['lng']})'
        : '';

    final msg = isStudentSos
        ? '$from needs help${locText.isNotEmpty ? ' at $locText' : ''}'
        : 'SOS: $from${locText.isNotEmpty ? ' at $locText' : ''}';

    // Unmissable popup for privileged roles
    if (canSee) {
      IoTAlertDialog.show(
        context,
        alertType: 'SOS',
        deviceId: 'SOS',
        deviceName: from.toString(),
        deviceType: senderRole ?? 'user',
        room: '',
        sensorData: <String, dynamic>{
          'status': msg,
          if (loc is Map<String, dynamic>) ...loc,
        },
        severity: 'CRITICAL',
        timestamp: DateTime.now(),
      );
    }

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg),
        backgroundColor: Colors.red,
        duration: const Duration(seconds: 5),
      ),
    );
  }

  void _handleSosSafe(dynamic data) {
    if (!context.mounted) return;
    final map = data is Map<String, dynamic>
        ? Map<String, dynamic>.from(data)
        : <String, dynamic>{};
    final from = map['userName'] ?? map['role'] ?? 'User';
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Safe: $from marked safe'),
        backgroundColor: Colors.green,
        duration: const Duration(seconds: 3),
      ),
    );
  }

  /// Phase 5.7: Handle AR_PATH_TRIGGER event
  void _handleARPathTrigger(dynamic data) {
    // Show notification
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content:
              const Text('AR Path Available - Tap to view evacuation path'),
          action: SnackBarAction(
            label: 'View',
            onPressed: () {
              // Navigate to AR Evacuation Screen
              // TODO: Import AR Evacuation Screen when available
              // Navigator.of(context).push<void>(
              //   MaterialPageRoute<void>(
              //     builder: (context) => AREvacuationScreen(
              //       pathData: dataMap,
              //       schoolId: schoolId,
              //     ),
              //   ),
              // );
            },
          ),
          duration: const Duration(seconds: 10),
        ),
      );
    }
  }

  /// Phase 201: Handle IoT Telemetry Updates
  void _handleTelemetryUpdate(Map<String, dynamic> data) {
    debugPrint('Telemetry Update: $data');
    // This will be handled by the device detail screen listeners
    // No global action needed, just log for debugging
  }

  /// Phase 201: Handle IoT Device Alerts
  void _handleDeviceAlert(Map<String, dynamic> data) {
    debugPrint('Device Alert: $data');

    if (!context.mounted) return;

    final alertType = data['alertType'] ?? 'Unknown';
    final deviceId = data['deviceId'] ?? 'Unknown Device';
    final severity = data['severity'] ?? 'high';
    final deviceName = data['deviceName'] ?? deviceId;
    final room = data['room'] ?? '';
    final readings =
        data['readings'] ?? data['sensorData'] ?? <String, dynamic>{};

    // Play alert sound/vibration mapped by alert type
    try {
      AlertSoundService().playAlertSound(alertType.toString());
    } catch (e) {
      debugPrint('⚠️ Alert sound failed: $e');
    }

    // Show full-screen IoT alert dialog (cannot be missed)
    if (context.mounted) {
      IoTAlertDialog.show(
        context,
        alertType: alertType.toString().toUpperCase(),
        deviceId: deviceId.toString(),
        deviceName: deviceName.toString(),
        deviceType: data['deviceType']?.toString(),
        room: room.toString(),
        sensorData: readings is Map<String, dynamic>
            ? Map<String, dynamic>.from(readings)
            : <String, dynamic>{},
        severity: severity.toString().toUpperCase(),
        timestamp: DateTime.now(),
      );
    }

    // Keep a brief snackbar for context
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('IoT Alert: $alertType from $deviceName'),
        backgroundColor: severity == 'critical' ? Colors.red : Colors.orange,
        duration: const Duration(seconds: 5),
      ),
    );
  }
}
