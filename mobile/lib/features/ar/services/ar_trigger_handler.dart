/// Phase 5.7: AR Trigger Handler
/// Handles remote AR triggers from admin dashboard via Socket.io

import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/constants/socket_events.dart';
import '../../socket/providers/socket_provider.dart';
import '../../../core/services/storage_service.dart';
import '../models/waypoint.dart';
import '../screens/ar_evacuation_screen.dart';

/// AR Trigger Handler
/// Listens for remote AR triggers and handles them
class ARTriggerHandler {
  final StorageService _storageService;
  StreamSubscription? _triggerSubscription;
  
  // Callback for when AR path is triggered
  void Function(Map<String, dynamic> pathData)? onPathTriggered;
  
  ARTriggerHandler({StorageService? storageService})
      : _storageService = storageService ?? StorageService();

  /// Setup Socket.io listener for AR path triggers
  void setupSocketListener(WidgetRef ref) {
    final socketNotifier = ref.read(socketProvider.notifier);
    
    // Listen for AR_PATH_TRIGGER events
    socketNotifier.on(SocketEvents.arPathTrigger, (data) {
      _handleARPathTrigger(data);
    });
    
    if (kDebugMode) {
      print('✅ AR Trigger Handler: Socket listener setup complete');
    }
  }

  /// Handle AR path trigger event
  Future<void> _handleARPathTrigger(dynamic eventData) async {
    try {
      final data = eventData as Map<String, dynamic>;
      
      if (kDebugMode) {
        print('🔔 AR Trigger Handler: Received AR path trigger: $data');
      }

      // Extract path data
      final sessionId = data['sessionId'] as String? ?? '';
      final assetUrl = data['assetUrl'] as String?;
      final waypointsData = data['waypoints'] as List<dynamic>?;
      final safeZoneData = data['safeZone'] as Map<String, dynamic>?;
      final schoolId = data['schoolId'] as String?;
      final alertType = data['alertType'] as String?;
      final alertId = data['alertId'] as String?;

      // Convert waypoints
      final waypoints = <Waypoint>[];
      if (waypointsData != null) {
        for (final wp in waypointsData) {
          try {
            final waypoint = Waypoint.fromJson(wp as Map<String, dynamic>);
            waypoints.add(waypoint);
          } catch (e) {
            if (kDebugMode) {
              print('⚠️ AR Trigger Handler: Error parsing waypoint: $e');
            }
          }
        }
      }

      // Convert safe zone
      Waypoint? safeZone;
      if (safeZoneData != null) {
        try {
          safeZone = Waypoint.fromJson(safeZoneData);
        } catch (e) {
          if (kDebugMode) {
            print('⚠️ AR Trigger Handler: Error parsing safe zone: $e');
          }
        }
      }

      // Store path data for later use
      final pathData = {
        'sessionId': sessionId,
        'assetUrl': assetUrl,
        'waypoints': waypoints.map((w) => w.toJson()).toList(),
        'safeZone': safeZone?.toJson(),
        'schoolId': schoolId,
        'alertType': alertType,
        'alertId': alertId,
        'triggeredAt': DateTime.now().toIso8601String(),
      };

      // Store in local storage
      await _storageService.storeInBox(
        'arPathStorage',
        'latestPath_$sessionId',
        pathData,
      );

      // Trigger callback
      onPathTriggered?.call(pathData);

      if (kDebugMode) {
        print('✅ AR Trigger Handler: Path data stored and callback triggered');
      }
    } catch (e) {
      if (kDebugMode) {
        print('⚠️ AR Trigger Handler: Error handling AR path trigger: $e');
      }
    }
  }

  /// Get stored path data
  Future<Map<String, dynamic>?> getStoredPathData(String sessionId) async {
    try {
      final data = await _storageService.getFromBox(
        'arPathStorage',
        'latestPath_$sessionId',
      );
      return data as Map<String, dynamic>?;
    } catch (e) {
      if (kDebugMode) {
        print('⚠️ AR Trigger Handler: Error getting stored path data: $e');
      }
      return null;
    }
  }

  /// Dispose resources
  void dispose() {
    _triggerSubscription?.cancel();
  }
}

