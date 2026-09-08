import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/services/sync_service.dart';
import '../../../../core/services/content_sync_service.dart';
import '../../../../core/services/api_service.dart';
import '../../../../core/services/storage_service.dart';

/// Sync state
class SyncState {
  final bool isSyncing;
  final String? error;
  final DateTime? lastSyncTime;
  final int pendingCount;

  SyncState({
    this.isSyncing = false,
    this.error,
    this.lastSyncTime,
    this.pendingCount = 0,
  });

  SyncState copyWith({
    bool? isSyncing,
    String? error,
    DateTime? lastSyncTime,
    int? pendingCount,
  }) {
    return SyncState(
      isSyncing: isSyncing ?? this.isSyncing,
      error: error,
      lastSyncTime: lastSyncTime ?? this.lastSyncTime,
      pendingCount: pendingCount ?? this.pendingCount,
    );
  }
}

/// Sync notifier
class SyncNotifier extends StateNotifier<SyncState> {
  final SyncService _syncService;
  final ContentSyncService _contentSyncService;

  SyncNotifier(this._syncService, this._contentSyncService) : super(SyncState()) {
    _checkPendingSync();
  }

  /// Check pending sync data
  Future<void> _checkPendingSync() async {
    try {
      final pending = await _syncService.getPendingSyncData();
      state = state.copyWith(pendingCount: (pending['total'] as int?) ?? 0);
    } catch (e) {
      // Ignore errors
    }
  }

  /// Sync offline data
  Future<void> syncOfflineData() async {
    state = state.copyWith(isSyncing: true, error: null);

    try {
      // Get pending data
      final pending = await _syncService.getPendingSyncData();
      final quizzes = pending['quizzes'] as List<Map<String, dynamic>>?;
      final drillLogs = pending['drillLogs'] as List<Map<String, dynamic>>?;

      if ((quizzes == null || quizzes.isEmpty) &&
          (drillLogs == null || drillLogs.isEmpty)) {
        state = state.copyWith(
          isSyncing: false,
          lastSyncTime: DateTime.now(),
          pendingCount: 0,
        );
        return;
      }

      // Sync to backend
      final result = await _syncService.syncOfflineData(
        quizzes: quizzes,
        drillLogs: drillLogs,
      );

      if (result['success'] == true) {
        state = state.copyWith(
          isSyncing: false,
          lastSyncTime: DateTime.now(),
          pendingCount: 0,
        );
      } else {
        state = state.copyWith(
          isSyncing: false,
          error: result['error'] as String?,
        );
      }
    } catch (e) {
      state = state.copyWith(
        isSyncing: false,
        error: e.toString(),
      );
    }
  }

  /// Sync modules
  Future<void> syncModules({bool forceRefresh = false}) async {
    state = state.copyWith(isSyncing: true, error: null);

    try {
      final success = await _contentSyncService.syncModules(forceRefresh: forceRefresh);
      if (success) {
        state = state.copyWith(
          isSyncing: false,
          lastSyncTime: DateTime.now(),
        );
      } else {
        state = state.copyWith(
          isSyncing: false,
          error: 'Failed to sync modules',
        );
      }
    } catch (e) {
      state = state.copyWith(
        isSyncing: false,
        error: e.toString(),
      );
    }
  }

  /// Get pending sync count
  Future<void> refreshPendingCount() async {
    await _checkPendingSync();
  }
}

/// Sync service provider
final syncServiceProvider = Provider<SyncService>((ref) {
  final apiService = ApiService();
  final storageService = StorageService();
  return SyncService(
    apiService: apiService,
    storageService: storageService,
  );
});

/// Content sync service provider
final contentSyncServiceProvider = Provider<ContentSyncService>((ref) {
  final apiService = ApiService();
  final storageService = StorageService();
  return ContentSyncService(
    apiService: apiService,
    storageService: storageService,
  );
});

/// Sync state provider
final syncProvider = StateNotifierProvider<SyncNotifier, SyncState>((ref) {
  final syncService = ref.watch(syncServiceProvider);
  final contentSyncService = ref.watch(contentSyncServiceProvider);
  return SyncNotifier(syncService, contentSyncService);
});

