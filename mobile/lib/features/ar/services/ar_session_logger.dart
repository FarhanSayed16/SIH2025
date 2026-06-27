/// Phase 5.7: AR Session Logger
/// Logs AR session metadata for analytics and synchronization

import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';
import '../../../core/services/api_service.dart';
import '../../../core/services/sync_queue_service.dart';
import '../../../core/services/connectivity_service.dart';
import '../../../core/constants/api_endpoints.dart';
import '../models/waypoint.dart';

/// AR Session Logger
/// Logs AR session events and metadata for analytics
class ARSessionLogger {
  final ApiService _apiService;
  final SyncQueueService _syncQueueService;
  final ConnectivityService _connectivityService;

  ARSessionLogger({
    ApiService? apiService,
    SyncQueueService? syncQueueService,
    ConnectivityService? connectivityService,
  })  : _apiService = apiService ?? ApiService(),
        _syncQueueService = syncQueueService ?? SyncQueueService(),
        _connectivityService = connectivityService ?? ConnectivityService();

  /// Initialize session logger
  Future<void> initialize() async {
    await _syncQueueService.initialize();
  }

  /// Log AR path placement
  Future<void> logPathPlacement({
    required String sessionId,
    required List<Waypoint> waypoints,
    required String userId,
    String? schoolId,
    String? alertId,
    String? drillId,
    Position? location,
  }) async {
    try {
      final currentLocation = location ?? await _getCurrentLocation();
      
      final metadata = {
        'sessionId': sessionId,
        'type': 'path_placement',
        'waypoints': waypoints.map((w) => w.toJson()).toList(),
        'userId': userId,
        'schoolId': schoolId,
        'alertId': alertId,
        'drillId': drillId,
        'timestamp': DateTime.now().toIso8601String(),
        'location': currentLocation != null
            ? {
                'latitude': currentLocation.latitude,
                'longitude': currentLocation.longitude,
                'accuracy': currentLocation.accuracy,
                'altitude': currentLocation.altitude,
              }
            : null,
      };

      // Try to sync immediately if online
      if (await _connectivityService.checkOnline()) {
        try {
          await _apiService.post(
            ApiEndpoints.arSession,
            data: metadata,
          );
          
          if (kDebugMode) {
            print('✅ AR Session Logger: Path placement logged to server');
          }
          return;
        } catch (e) {
          if (kDebugMode) {
            print('⚠️ AR Session Logger: Failed to log to server, queueing: $e');
          }
          // Fall through to queue
        }
      }

      // Queue for offline sync
      await _syncQueueService.addToQueue(
        dataType: 'ar_session',
        payload: metadata,
        priority: 5, // Medium priority
      );

      if (kDebugMode) {
        print('✅ AR Session Logger: Path placement queued for sync');
      }
    } catch (e) {
      if (kDebugMode) {
        print('⚠️ AR Session Logger: Error logging path placement: $e');
      }
    }
  }

  /// Log AR fire simulation event
  Future<void> logFireSimulationEvent({
    required String sessionId,
    required String userId,
    required String drillId,
    required String eventType, // 'fire_placed', 'fire_extinguished', 'session_start', 'session_end'
    Map<String, dynamic>? eventData,
    String? schoolId,
    Position? location,
  }) async {
    try {
      final currentLocation = location ?? await _getCurrentLocation();
      
      final metadata = {
        'sessionId': sessionId,
        'type': 'fire_simulation',
        'eventType': eventType,
        'userId': userId,
        'drillId': drillId,
        'schoolId': schoolId,
        'timestamp': DateTime.now().toIso8601String(),
        'eventData': eventData,
        'location': currentLocation != null
            ? {
                'latitude': currentLocation.latitude,
                'longitude': currentLocation.longitude,
                'accuracy': currentLocation.accuracy,
              }
            : null,
      };

      // Try to sync immediately if online
      if (await _connectivityService.checkOnline()) {
        try {
          await _apiService.post(
            ApiEndpoints.arSession,
            data: metadata,
          );
          
          if (kDebugMode) {
            print('✅ AR Session Logger: Fire simulation event logged to server');
          }
          return;
        } catch (e) {
          if (kDebugMode) {
            print('⚠️ AR Session Logger: Failed to log to server, queueing: $e');
          }
        }
      }

      // Queue for offline sync
      await _syncQueueService.addToQueue(
        dataType: 'ar_session',
        payload: metadata,
        priority: 5,
      );

      if (kDebugMode) {
        print('✅ AR Session Logger: Fire simulation event queued for sync');
      }
    } catch (e) {
      if (kDebugMode) {
        print('⚠️ AR Session Logger: Error logging fire simulation event: $e');
      }
    }
  }

  /// Log AR session start
  Future<void> logSessionStart({
    required String sessionId,
    required String userId,
    required String sessionType, // 'evacuation', 'fire_simulation'
    String? schoolId,
    String? alertId,
    String? drillId,
    Position? location,
  }) async {
    await logFireSimulationEvent(
      sessionId: sessionId,
      userId: userId,
      drillId: drillId ?? '',
      eventType: 'session_start',
      eventData: {
        'sessionType': sessionType,
        'alertId': alertId,
      },
      schoolId: schoolId,
      location: location,
    );
  }

  /// Log AR session end
  Future<void> logSessionEnd({
    required String sessionId,
    required String userId,
    String? schoolId,
    String? drillId,
    Map<String, dynamic>? sessionData,
    Position? location,
  }) async {
    await logFireSimulationEvent(
      sessionId: sessionId,
      userId: userId,
      drillId: drillId ?? '',
      eventType: 'session_end',
      eventData: sessionData,
      schoolId: schoolId,
      location: location,
    );
  }

  /// Get current location
  Future<Position?> _getCurrentLocation() async {
    try {
      return await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.medium,
      );
    } catch (e) {
      if (kDebugMode) {
        print('⚠️ AR Session Logger: Error getting location: $e');
      }
      return null;
    }
  }
}

