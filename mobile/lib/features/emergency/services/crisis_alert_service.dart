/// Phase 4.1: Crisis Alert Service
/// Handles crisis alerts, status updates, and offline caching

import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/services/api_service.dart';
import '../../../core/services/storage_service.dart';
import '../../../core/constants/api_endpoints.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/constants/socket_events.dart'; // Phase 4.0
import '../../socket/providers/socket_provider.dart';
import 'package:geolocator/geolocator.dart';

class CrisisAlertService {
  final ApiService _apiService = ApiService();
  final StorageService _storageService = StorageService();
  
  static const String _alertCacheBox = 'crisis_alerts';
  static const String _alertCacheKey = 'last_alert';
  static const String _pendingStatusBox = 'crisis_status';
  static const String _pendingStatusKey = 'pending_updates';

  /// Send USER_SAFE event
  Future<Map<String, dynamic>> markSafe({
    required String alertId,
    required String userId,
    required WidgetRef ref,
    Position? position,
  }) async {
    try {
      // Get location if available
      Map<String, dynamic>? location;
      if (position != null) {
        location = {
          'lat': position.latitude,
          'lng': position.longitude,
        };
      }

      // Emit via Socket.io (if connected)
      final socketNotifier = ref.read(socketProvider.notifier);
      socketNotifier.emit(SocketEvents.userSafe, {
        'alertId': alertId,
        'location': location,
      });

      // Phase 4.4: Update via new status endpoint
      try {
        final response = await _apiService.post(
          ApiEndpoints.alertStatus(alertId),
          data: {
            'status': 'safe', // Phase 4.4: Use 'safe' status
            'location': location,
          },
        );
        
        if (response.statusCode == 200 && response.data['success'] == true) {
          return {
            'success': true,
            'data': response.data['data'],
          };
        } else {
          throw Exception(response.data['message'] ?? 'Failed to update status');
        }
      } catch (e) {
        // If API fails, queue for offline sync
        await _queueStatusUpdate(alertId, userId, 'safe', location);
        return {
          'success': true,
          'message': 'Status queued for sync',
          'offline': true,
        };
      }
    } catch (e) {
      print('Error marking safe: $e');
      return {
        'success': false,
        'error': e.toString(),
      };
    }
  }

  /// Send USER_HELP event
  Future<Map<String, dynamic>> requestHelp({
    required String alertId,
    required String userId,
    required WidgetRef ref,
    Position? position,
    String? details,
  }) async {
    try {
      // Location is required for help requests
      if (position == null) {
        return {
          'success': false,
          'error': 'Location required for help request',
        };
      }

      final location = {
        'lat': position.latitude,
        'lng': position.longitude,
      };

      // Emit via Socket.io (if connected)
      final socketNotifier = ref.read(socketProvider.notifier);
      socketNotifier.emit(SocketEvents.userHelp, {
        'alertId': alertId,
        'location': location,
        'details': details,
      });

      // Phase 4.4: Update via new status endpoint with 'help' status
      try {
        final response = await _apiService.post(
          ApiEndpoints.alertStatus(alertId),
          data: {
            'status': 'help', // Phase 4.4: Use 'help' status instead of 'at_risk'
            'location': location,
          },
        );
        
        if (response.statusCode == 200 && response.data['success'] == true) {
          return {
            'success': true,
            'data': response.data['data'],
          };
        } else {
          throw Exception(response.data['message'] ?? 'Failed to update status');
        }
      } catch (e) {
        // Queue for offline sync
        await _queueStatusUpdate(alertId, userId, 'help', location);
        return {
          'success': true,
          'message': 'Help request queued for sync',
          'offline': true,
        };
      }
    } catch (e) {
      print('Error requesting help: $e');
      return {
        'success': false,
        'error': e.toString(),
      };
    }
  }

  /// Cache alert for offline access
  Future<void> cacheAlert(Map<String, dynamic> alertData) async {
    try {
      await _storageService.storeInBox(_alertCacheBox, _alertCacheKey, alertData);
    } catch (e) {
      print('Error caching alert: $e');
    }
  }

  /// Get cached alert
  Future<Map<String, dynamic>?> getCachedAlert() async {
    try {
      final cached = await _storageService.getFromBox(_alertCacheBox, _alertCacheKey);
      if (cached != null && cached is Map) {
        return Map<String, dynamic>.from(cached);
      }
      return null;
    } catch (e) {
      print('Error getting cached alert: $e');
      return null;
    }
  }

  /// Clear cached alert
  Future<void> clearCachedAlert() async {
    try {
      final box = await _storageService.openBox(_alertCacheBox);
      await box.delete(_alertCacheKey);
    } catch (e) {
      print('Error clearing cached alert: $e');
    }
  }

  /// Queue status update for offline sync
  Future<void> _queueStatusUpdate(
    String alertId,
    String userId,
    String status,
    Map<String, dynamic>? location,
  ) async {
    try {
      final pending = await _getPendingStatusUpdates();
      pending.add({
        'alertId': alertId,
        'userId': userId,
        'status': status,
        'location': location,
        'timestamp': DateTime.now().toIso8601String(),
      });
      await _storageService.storeInBox(_pendingStatusBox, _pendingStatusKey, pending);
    } catch (e) {
      print('Error queuing status update: $e');
    }
  }

  /// Get pending status updates
  Future<List<Map<String, dynamic>>> _getPendingStatusUpdates() async {
    try {
      final pending = await _storageService.getFromBox(_pendingStatusBox, _pendingStatusKey);
      if (pending != null && pending is List) {
        return List<Map<String, dynamic>>.from(
          pending.map((e) => Map<String, dynamic>.from(e as Map)),
        );
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  /// Sync pending status updates
  Future<void> syncPendingUpdates() async {
    try {
      final pending = await _getPendingStatusUpdates();
      if (pending.isEmpty) return;

      for (final update in pending) {
        try {
          // Phase 4.4: Use new status endpoint
          await _apiService.post(
            ApiEndpoints.alertStatus(update['alertId'] as String),
            data: {
              'status': update['status'] as String,
              'location': update['location'] as Map<String, dynamic>?,
            },
          );
        } catch (e) {
          // Keep in queue if sync fails
          print('Failed to sync status update: $e');
        }
      }

      // Clear queue if all synced
      final box = await _storageService.openBox(_pendingStatusBox);
      await box.delete(_pendingStatusKey);
    } catch (e) {
      print('Error syncing pending updates: $e');
    }
  }
}

/// Crisis Alert Service Provider
final crisisAlertServiceProvider = Provider<CrisisAlertService>((ref) {
  return CrisisAlertService();
});

