/// Phase 3.5.2: Offline Drill Service
/// Handles offline drill data caching, participation, and sync

import '../../../core/services/storage_service.dart';
import '../../../core/services/offline_storage_service.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/services/api_service.dart';
import '../../../core/constants/api_endpoints.dart';

class OfflineDrillService {
  final StorageService _storageService;
  final OfflineStorageService _offlineStorage;
  final ApiService _apiService;

  OfflineDrillService({
    StorageService? storageService,
    OfflineStorageService? offlineStorage,
    ApiService? apiService,
  })  : _storageService = storageService ?? StorageService(),
        _offlineStorage = offlineStorage ?? OfflineStorageService(),
        _apiService = apiService ?? ApiService();

  /// Cache drill data for offline access
  Future<bool> cacheDrillData(Map<String, dynamic> drillData) async {
    try {
      final box = await _storageService.openBox(AppConstants.cacheBox);
      final drillId = drillData['_id']?.toString() ?? drillData['id']?.toString() ?? '';
      
      if (drillId.isEmpty) {
        return false;
      }

      await box.put('drill_$drillId', {
        ...drillData,
        'cachedAt': DateTime.now().toIso8601String(),
      });

      // Add to cached drills list
      final cachedDrills = box.get('cachedDrills', defaultValue: <String>[]) as List<dynamic>;
      final updatedList = List<String>.from(cachedDrills.map((e) => e.toString()));
      if (!updatedList.contains(drillId)) {
        updatedList.add(drillId);
        await box.put('cachedDrills', updatedList);
      }

      print('✅ Drill data cached offline: $drillId');
      return true;
    } catch (e) {
      print('❌ Failed to cache drill data: $e');
      return false;
    }
  }

  /// Get cached drill data
  Future<Map<String, dynamic>?> getCachedDrill(String drillId) async {
    try {
      final box = await _storageService.openBox(AppConstants.cacheBox);
      final drill = box.get('drill_$drillId');
      
      if (drill != null && drill is Map) {
        return Map<String, dynamic>.from(drill);
      }
      
      return null;
    } catch (e) {
      print('❌ Failed to get cached drill: $e');
      return null;
    }
  }

  /// Check if drill is cached
  Future<bool> isDrillCached(String drillId) async {
    try {
      final box = await _storageService.openBox(AppConstants.cacheBox);
      return box.get('drill_$drillId') != null;
    } catch (e) {
      return false;
    }
  }

  /// Participate in drill offline
  /// This stores the drill log locally for later sync
  Future<bool> participateInDrillOffline({
    required String drillId,
    required String userId,
    required String institutionId,
    required int evacuationTime,
    String? route,
    Map<String, dynamic>? startLocation,
    Map<String, dynamic>? endLocation,
    int? score,
    Map<String, dynamic>? metadata,
  }) async {
    try {
      // Create drill log entry
      final drillLog = {
        'drillId': drillId,
        'userId': userId,
        'institutionId': institutionId,
        'evacuationTime': evacuationTime,
        'route': route,
        'startLocation': startLocation,
        'endLocation': endLocation,
        'score': score,
        'completedAt': DateTime.now().toIso8601String(),
        'participatedAt': DateTime.now().toIso8601String(),
        'metadata': metadata ?? {},
      };

      // Store offline using offline storage service
      final success = await _offlineStorage.storeDrillLogOffline(drillLog);

      if (success) {
        print('✅ Drill participation logged offline for drill: $drillId');
      }

      return success;
    } catch (e) {
      print('❌ Failed to participate in drill offline: $e');
      return false;
    }
  }

  /// Complete drill participation (combine online/offline)
  Future<bool> completeDrillParticipation({
    required String drillId,
    required String userId,
    required String institutionId,
    required int evacuationTime,
    String? route,
    Map<String, dynamic>? startLocation,
    Map<String, dynamic>? endLocation,
    int? score,
    Map<String, dynamic>? metadata,
  }) async {
    try {
      // Try to sync online first
      if (await _offlineStorage.isOnline()) {
        try {
          // Attempt online sync via drill complete endpoint
          final response = await _apiService.post(
            ApiEndpoints.completeDrill(drillId),
            data: {
              'evacuationTime': evacuationTime,
              'route': route,
              'score': score,
            },
          );

          if (response.statusCode == 200 || response.statusCode == 201) {
            print('✅ Drill participation synced online: $drillId');
            return true;
          }
        } catch (e) {
          print('⚠️ Online sync failed, storing offline: $e');
        }
      }

      // Fallback to offline storage
      return await participateInDrillOffline(
        drillId: drillId,
        userId: userId,
        institutionId: institutionId,
        evacuationTime: evacuationTime,
        route: route,
        startLocation: startLocation,
        endLocation: endLocation,
        score: score,
        metadata: metadata,
      );
    } catch (e) {
      print('❌ Failed to complete drill participation: $e');
      return false;
    }
  }

  /// Get user's drill participation history (offline + synced)
  Future<List<Map<String, dynamic>>> getUserDrillHistory(String userId) async {
    try {
      // Get all drill logs for this user from offline storage
      final box = await _storageService.openBox(AppConstants.drillLogsBox);
      final allKeys = box.keys.toList();
      final userLogs = <Map<String, dynamic>>[];

      for (var key in allKeys) {
        final log = box.get(key);
        if (log is Map) {
          final logMap = Map<String, dynamic>.from(log);
          final logUserId = logMap['userId']?.toString() ?? logMap['user_id']?.toString();
          if (logUserId == userId) {
            userLogs.add(logMap);
          }
        }
      }

      // Sort by completedAt (most recent first)
      userLogs.sort((a, b) {
        final aTime = (a['completedAt'] ?? a['participatedAt'] ?? '').toString();
        final bTime = (b['completedAt'] ?? b['participatedAt'] ?? '').toString();
        return bTime.compareTo(aTime);
      });

      return userLogs;
    } catch (e) {
      print('❌ Failed to get user drill history: $e');
      return [];
    }
  }

  /// Get all cached drill IDs
  Future<List<String>> getCachedDrillIds() async {
    try {
      final box = await _storageService.openBox(AppConstants.cacheBox);
      final cachedDrills = box.get('cachedDrills', defaultValue: <String>[]) as List<dynamic>;
      return cachedDrills.map((e) => e.toString()).toList();
    } catch (e) {
      return [];
    }
  }

  /// Clear old cached drills
  Future<void> clearOldCachedDrills({int keepRecentDays = 30}) async {
    try {
      final cutoffDate = DateTime.now().subtract(Duration(days: keepRecentDays));
      final box = await _storageService.openBox(AppConstants.cacheBox);
      final cachedDrillIds = await getCachedDrillIds();
      
      int cleared = 0;
      for (var drillId in cachedDrillIds) {
        final drill = box.get('drill_$drillId');
        if (drill is Map) {
          final drillMap = Map<String, dynamic>.from(drill);
          final cachedAtStr = drillMap['cachedAt'];
          if (cachedAtStr != null) {
            try {
              final cachedAt = DateTime.parse(cachedAtStr.toString());
              if (cachedAt.isBefore(cutoffDate)) {
                await box.delete('drill_$drillId');
                cleared++;
              }
            } catch (e) {
              // Invalid date, skip
            }
          }
        }
      }
      
      if (cleared > 0) {
        // Update cached drills list
        final updatedList = cachedDrillIds.where((id) {
          return box.get('drill_$id') != null;
        }).toList();
        await box.put('cachedDrills', updatedList);
        print('✅ Cleared $cleared old cached drills');
      }
    } catch (e) {
      print('❌ Failed to clear old cached drills: $e');
    }
  }
}

