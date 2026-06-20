import 'api_service.dart';
import 'storage_service.dart';
import '../constants/app_constants.dart';
import '../constants/api_endpoints.dart';

/// Sync Service - Handles offline data synchronization
class SyncService {
  final ApiService _apiService;
  final StorageService _storageService;

  SyncService({
    ApiService? apiService,
    StorageService? storageService,
  })  : _apiService = apiService ?? ApiService(),
        _storageService = storageService ?? StorageService();

  /// Sync offline data to backend
  Future<Map<String, dynamic>> syncOfflineData({
    List<Map<String, dynamic>>? quizzes,
    List<Map<String, dynamic>>? drillLogs,
  }) async {
    try {
      final response = await _apiService.post(
        ApiEndpoints.sync,
        data: {
          if (quizzes != null && quizzes.isNotEmpty) 'quizzes': quizzes,
          if (drillLogs != null && drillLogs.isNotEmpty) 'drillLogs': drillLogs,
        },
      );

      // Clear synced data from local storage
      if (quizzes != null && quizzes.isNotEmpty) {
        await _clearSyncedQuizzes(quizzes);
      }
      if (drillLogs != null && drillLogs.isNotEmpty) {
        await _clearSyncedDrillLogs(drillLogs);
      }

      return {
        'success': true,
        'syncedQuizzes': quizzes?.length ?? 0,
        'syncedDrillLogs': drillLogs?.length ?? 0,
        'data': response.data,
      };
    } catch (e) {
      return {
        'success': false,
        'error': e.toString(),
      };
    }
  }

  /// Get pending sync data
  Future<Map<String, dynamic>> getPendingSyncData() async {
    try {
      final quizBox = await _storageService.openBox(AppConstants.quizResultsBox);
      final drillLogBox = await _storageService.openBox(AppConstants.drillLogsBox);

      final pendingQuizzes = <Map<String, dynamic>>[];
      final pendingDrillLogs = <Map<String, dynamic>>[];

      // Get unsynced quizzes
      for (var key in quizBox.keys) {
        final quiz = quizBox.get(key);
        if (quiz is Map && (quiz['synced'] != true)) {
          pendingQuizzes.add(Map<String, dynamic>.from(quiz));
        }
      }

      // Get unsynced drill logs
      for (var key in drillLogBox.keys) {
        final log = drillLogBox.get(key);
        if (log is Map && (log['synced'] != true)) {
          pendingDrillLogs.add(Map<String, dynamic>.from(log));
        }
      }

      return {
        'quizzes': pendingQuizzes,
        'drillLogs': pendingDrillLogs,
        'total': pendingQuizzes.length + pendingDrillLogs.length,
      };
    } catch (e) {
      return {
        'quizzes': [],
        'drillLogs': [],
        'total': 0,
        'error': e.toString(),
      };
    }
  }

  /// Clear synced quizzes
  Future<void> _clearSyncedQuizzes(List<Map<String, dynamic>> quizzes) async {
    final box = await _storageService.openBox(AppConstants.quizResultsBox);
    for (var quiz in quizzes) {
      final id = quiz['id'] ?? quiz['_id'];
      if (id != null) {
        await box.delete(id);
      }
    }
  }

  /// Clear synced drill logs
  Future<void> _clearSyncedDrillLogs(List<Map<String, dynamic>> drillLogs) async {
    final box = await _storageService.openBox(AppConstants.drillLogsBox);
    for (var log in drillLogs) {
      final id = log['id'] ?? log['_id'];
      if (id != null) {
        await box.delete(id);
      }
    }
  }

  /// Mark data as synced
  Future<void> markAsSynced(String boxName, String key) async {
    final box = await _storageService.openBox(boxName);
    final data = box.get(key);
    if (data is Map) {
      data['synced'] = true;
      await box.put(key, data);
    }
  }
}

