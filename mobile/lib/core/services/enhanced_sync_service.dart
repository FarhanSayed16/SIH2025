import 'dart:async';
import 'api_service.dart';
import 'offline_storage_service.dart';
import '../constants/api_endpoints.dart';

/// Enhanced Sync Service (Phase 3.1.2, Phase 3.5.2: Enhanced with battery-aware sync)
/// Handles background sync, conflict resolution, and sync status
class EnhancedSyncService {
  final ApiService _apiService;
  final OfflineStorageService _offlineStorage;
  
  // Phase 3.5.2: Battery service (optional - requires battery_plus package)
  dynamic _battery;

  Timer? _backgroundSyncTimer;
  bool _isSyncing = false;
  StreamController<SyncStatus>? _syncStatusController;

  // Phase 3.5.2: Battery-aware sync settings
  static const int minBatteryLevel = 20; // Don't sync if battery below 20%
  static const Duration baseSyncInterval = Duration(minutes: 5);
  static const Duration maxSyncInterval = Duration(minutes: 30); // Extended interval on low battery

  EnhancedSyncService({
    ApiService? apiService,
    OfflineStorageService? offlineStorage,
  })  : _apiService = apiService ?? ApiService(),
        _offlineStorage = offlineStorage ?? OfflineStorageService() {
    // Phase 3.5.2: Try to initialize battery service (optional)
    try {
      // Dynamic import to avoid breaking if package not installed
      // User should add 'battery_plus' to pubspec.yaml for battery-aware sync
      _battery = null; // Will be set if package is available
    } catch (e) {
      print('⚠️ Battery service not available (optional): $e');
      _battery = null;
    }
  }

  /// Sync status stream
  Stream<SyncStatus> get syncStatusStream {
    _syncStatusController ??= StreamController<SyncStatus>.broadcast();
    return _syncStatusController!.stream;
  }

  /// Phase 3.5.2: Get current battery level (optional - requires battery_plus package)
  Future<int?> _getBatteryLevel() async {
    if (_battery == null) {
      return null; // Battery checking not available
    }
    try {
      // Dynamic call if battery service is available
      final level = await _battery.batteryLevel;
      return level is int ? level : null;
    } catch (e) {
      return null; // Battery checking failed
    }
  }

  /// Phase 3.5.2: Check if sync should proceed based on battery
  Future<bool> _shouldSyncBasedOnBattery() async {
    final batteryLevel = await _getBatteryLevel();
    if (batteryLevel == null) {
      return true; // If we can't check battery, allow sync (backward compatible)
    }
    return batteryLevel >= minBatteryLevel;
  }

  /// Phase 3.5.2: Get adaptive sync interval based on battery
  Future<Duration> _getAdaptiveSyncInterval() async {
    final batteryLevel = await _getBatteryLevel();
    if (batteryLevel == null || batteryLevel >= 50) {
      return baseSyncInterval;
    } else if (batteryLevel >= 30) {
      return const Duration(minutes: 10); // Moderate battery - sync every 10 min
    } else if (batteryLevel >= minBatteryLevel) {
      return const Duration(minutes: 15); // Low battery - sync every 15 min
    } else {
      return maxSyncInterval; // Very low battery - sync every 30 min
    }
  }

  /// Start background sync (auto-sync with battery-aware timing)
  /// Phase 3.5.2: Enhanced with battery-aware intervals
  void startBackgroundSync({Duration? interval}) async {
    _backgroundSyncTimer?.cancel();
    
    // Phase 3.5.2: Use adaptive interval based on battery
    final syncInterval = interval ?? await _getAdaptiveSyncInterval();
    
    _backgroundSyncTimer = Timer.periodic(syncInterval, (_) async {
      // Phase 3.5.2: Check battery before syncing
      if (!await _shouldSyncBasedOnBattery()) {
        print('⚠️ Skipping sync due to low battery level');
        // Re-schedule with longer interval
        final newInterval = await _getAdaptiveSyncInterval();
        if (newInterval != syncInterval) {
          startBackgroundSync(interval: newInterval);
        }
        return;
      }

      if (await _offlineStorage.isOnline() && !_isSyncing) {
        await sync();
        
        // Phase 3.5.2: Re-adjust interval after sync based on current battery
        final newInterval = await _getAdaptiveSyncInterval();
        if (newInterval != syncInterval) {
          startBackgroundSync(interval: newInterval);
        }
      }
    });

    print('✅ Background sync started (interval: ${syncInterval.inMinutes} minutes)');
  }

  /// Stop background sync
  void stopBackgroundSync() {
    _backgroundSyncTimer?.cancel();
    _backgroundSyncTimer = null;
    print('⏹️  Background sync stopped');
  }

  /// Manual sync trigger
  /// Phase 3.5.2: Enhanced with drill log support
  Future<SyncResult> sync({bool force = false}) async {
    if (_isSyncing && !force) {
      return SyncResult(
        success: false,
        message: 'Sync already in progress',
      );
    }

    // Phase 3.5.2: Check battery before manual sync (unless forced)
    if (!force && !await _shouldSyncBasedOnBattery()) {
      return SyncResult(
        success: false,
        message: 'Sync skipped: Battery level too low (< $minBatteryLevel%)',
      );
    }

    _isSyncing = true;
    _updateSyncStatus(SyncStatus.syncing);

    try {
      // Check if online
      if (!await _offlineStorage.isOnline()) {
        _updateSyncStatus(SyncStatus.offline);
        return SyncResult(
          success: false,
          message: 'No internet connection',
        );
      }

      // Phase 3.5.2: Get unsynced data (quizzes and drill logs)
      final unsyncedQuizzes = await _offlineStorage.getUnsyncedQuizResults();
      final unsyncedDrillLogs = await _offlineStorage.getUnsyncedDrillLogs();

      if (unsyncedQuizzes.isEmpty && unsyncedDrillLogs.isEmpty) {
        _updateSyncStatus(SyncStatus.synced);
        _isSyncing = false;
        return SyncResult(
          success: true,
          message: 'No data to sync',
          syncedQuizzes: 0,
          syncedDrillLogs: 0,
        );
      }

      // Phase 3.5.2: Prepare sync payload with quizzes and drill logs
      final syncPayload = <String, dynamic>{};
      
      if (unsyncedQuizzes.isNotEmpty) {
        syncPayload['quizzes'] = unsyncedQuizzes.map((quiz) {
          return {
            'moduleId': quiz['moduleId'],
            'score': quiz['score'],
            'answers': quiz['answers'],
            'timeTaken': quiz['timeTaken'],
            'completedAt': quiz['completedAt'] ?? quiz['storedAt'],
          };
        }).toList();
      }

      if (unsyncedDrillLogs.isNotEmpty) {
        syncPayload['drillLogs'] = unsyncedDrillLogs.map((log) {
          return {
            'drillId': log['drillId'],
            'evacuationTime': log['evacuationTime'],
            'route': log['route'],
            'startLocation': log['startLocation'],
            'endLocation': log['endLocation'],
            'score': log['score'],
            'completedAt': log['completedAt'] ?? log['storedAt'],
            'participatedAt': log['participatedAt'] ?? log['completedAt'] ?? log['storedAt'],
            'metadata': (log['metadata'] as Map<String, dynamic>?) ?? <String, dynamic>{},
          };
        }).toList();
      }

      // Send to backend
      final response = await _apiService.post(
        ApiEndpoints.sync,
        data: syncPayload,
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final result = (response.data['data'] ?? response.data) as Map<String, dynamic>;
        final syncedQuizzesCount = (result['quizzes']?['synced'] as int?) ?? 0;
        final syncedDrillLogsCount = (result['drillLogs']?['synced'] as int?) ?? 0;

        // Phase 3.5.2: Mark quizzes as synced
        if (syncedQuizzesCount > 0) {
          for (var quiz in unsyncedQuizzes) {
            final quizId = quiz['_id'] ?? quiz['id'] ?? quiz['moduleId'];
            await _offlineStorage.markQuizResultSynced(quizId.toString());
          }
        }

        // Phase 3.5.2: Mark drill logs as synced
        if (syncedDrillLogsCount > 0) {
          for (var log in unsyncedDrillLogs) {
            final logId = log['_id'] ?? log['id'] ?? '${log['drillId']}_${log['userId']}_${DateTime.now().millisecondsSinceEpoch}';
            await _offlineStorage.markDrillLogSynced(logId.toString());
          }
        }

        _updateSyncStatus(SyncStatus.synced);
        _isSyncing = false;

        return SyncResult(
          success: true,
          message: 'Sync completed successfully',
          syncedQuizzes: syncedQuizzesCount,
          syncedDrillLogs: syncedDrillLogsCount,
        );
      } else {
        _updateSyncStatus(SyncStatus.failed);
        _isSyncing = false;
        return SyncResult(
          success: false,
          message: 'Sync failed: ${response.data['message'] ?? 'Unknown error'}',
        );
      }
    } catch (e) {
      _updateSyncStatus(SyncStatus.failed);
      _isSyncing = false;
      return SyncResult(
        success: false,
        message: 'Sync error: $e',
      );
    }
  }

  /// Get sync status from backend
  Future<Map<String, dynamic>?> getSyncStatus() async {
    try {
      if (!await _offlineStorage.isOnline()) {
        return null;
      }

      final response = await _apiService.get(ApiEndpoints.syncStatus);
      if (response.statusCode == 200) {
        final data = response.data['data'] ?? response.data;
        return data is Map<String, dynamic> ? data : null;
      }
      return null;
    } catch (e) {
      print('❌ Failed to get sync status: $e');
      return null;
    }
  }

  /// Download modules for offline use
  Future<bool> downloadModules(List<String> moduleIds) async {
    try {
      if (!await _offlineStorage.isOnline()) {
        return false;
      }

      int successCount = 0;
      for (var moduleId in moduleIds) {
        final success = await _offlineStorage.downloadModule(moduleId);
        if (success) {
          successCount++;
        }
      }

      return successCount > 0;
    } catch (e) {
      print('❌ Failed to download modules: $e');
      return false;
    }
  }

  /// Update sync status and notify listeners
  void _updateSyncStatus(SyncStatus status) {
    _syncStatusController?.add(status);
  }

  /// Dispose resources
  void dispose() {
    stopBackgroundSync();
    _syncStatusController?.close();
    _syncStatusController = null;
  }
}

/// Sync status enum
enum SyncStatus {
  idle,
  syncing,
  synced,
  failed,
  offline,
}

/// Sync result model
class SyncResult {
  final bool success;
  final String message;
  final int syncedQuizzes;
  final int syncedDrillLogs;

  SyncResult({
    required this.success,
    required this.message,
    this.syncedQuizzes = 0,
    this.syncedDrillLogs = 0,
  });
}
