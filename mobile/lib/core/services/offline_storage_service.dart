import 'package:connectivity_plus/connectivity_plus.dart';
import '../constants/app_constants.dart';
import 'storage_service.dart';
import 'api_service.dart';
import '../constants/api_endpoints.dart';

/// Offline Storage Service (Phase 3.1.2)
/// Handles offline storage, download, and cache management for modules and quizzes
class OfflineStorageService {
  final StorageService _storageService;
  final ApiService _apiService;
  final Connectivity _connectivity = Connectivity();

  // Cache size limits (in MB)
  static const int maxCacheSizeMB = 500; // 500 MB max cache
  static const int maxModuleCacheSizeMB = 400; // 400 MB for modules
  static const int maxQuizCacheSizeMB = 50; // 50 MB for quiz results
  static const int maxDrillLogCacheSizeMB = 20; // 20 MB for drill logs (Phase 3.5.2)

  OfflineStorageService({
    StorageService? storageService,
    ApiService? apiService,
  })  : _storageService = storageService ?? StorageService(),
        _apiService = apiService ?? ApiService();

  /// Check if device is online
  Future<bool> isOnline() async {
    try {
      final connectivityResult = await _connectivity.checkConnectivity();
      return connectivityResult != ConnectivityResult.none;
    } catch (e) {
      return false;
    }
  }

  /// Get network connectivity stream
  Stream<ConnectivityResult> get connectivityStream => _connectivity.onConnectivityChanged;

  /// Download module for offline use
  Future<bool> downloadModule(String moduleId) async {
    try {
      // Check if already downloaded
      final box = await _storageService.openBox(AppConstants.modulesBox);
      final downloadedModules = box.get('downloadedModules', defaultValue: <String>[]) as List<dynamic>;
      
      if (downloadedModules.contains(moduleId)) {
        return true; // Already downloaded
      }

      // Check cache size before downloading
      if (!await _checkCacheSize()) {
        print('⚠️ Cache size limit reached. Cannot download module.');
        return false;
      }

      // Fetch module from API
      final response = await _apiService.get('${ApiEndpoints.module(moduleId)}');
      final module = response.data['data']?['module'] ?? response.data['module'];

      if (module != null) {
        // Store module
        await box.put('module_$moduleId', module);
        
        // Update downloaded modules list
        final updatedList = List<String>.from(downloadedModules.map((e) => e.toString()));
        updatedList.add(moduleId);
        await box.put('downloadedModules', updatedList);
        
        // Store download timestamp
        await box.put('module_${moduleId}_downloadedAt', DateTime.now().toIso8601String());
        
        print('✅ Module $moduleId downloaded successfully');
        return true;
      }

      return false;
    } catch (e) {
      print('❌ Failed to download module $moduleId: $e');
      return false;
    }
  }

  /// Get downloaded module
  Future<Map<String, dynamic>?> getDownloadedModule(String moduleId) async {
    try {
      final box = await _storageService.openBox(AppConstants.modulesBox);
      final module = box.get('module_$moduleId');
      
      if (module != null) {
        return Map<String, dynamic>.from(module as Map);
      }
      
      return null;
    } catch (e) {
      print('❌ Failed to get downloaded module $moduleId: $e');
      return null;
    }
  }

  /// Get all downloaded module IDs
  Future<List<String>> getDownloadedModuleIds() async {
    try {
      final box = await _storageService.openBox(AppConstants.modulesBox);
      final downloadedModules = box.get('downloadedModules', defaultValue: <String>[]) as List<dynamic>;
      return downloadedModules.map((e) => e.toString()).toList();
    } catch (e) {
      return [];
    }
  }

  /// Check if module is downloaded
  Future<bool> isModuleDownloaded(String moduleId) async {
    final downloadedIds = await getDownloadedModuleIds();
    return downloadedIds.contains(moduleId);
  }

  /// Store quiz result offline
  Future<bool> storeQuizResultOffline(Map<String, dynamic> quizResult) async {
    try {
      final box = await _storageService.openBox(AppConstants.quizResultsBox);
      final quizId = quizResult['_id'] ?? 
                     quizResult['id'] ?? 
                     '${quizResult['moduleId']}_${DateTime.now().millisecondsSinceEpoch}';
      
      await box.put(quizId, {
        ...quizResult,
        'synced': false,
        'storedAt': DateTime.now().toIso8601String(),
      });
      
      print('✅ Quiz result stored offline: $quizId');
      return true;
    } catch (e) {
      print('❌ Failed to store quiz result offline: $e');
      return false;
    }
  }

  /// Get all unsynced quiz results
  Future<List<Map<String, dynamic>>> getUnsyncedQuizResults() async {
    try {
      final box = await _storageService.openBox(AppConstants.quizResultsBox);
      final allKeys = box.keys.toList();
      final unsynced = <Map<String, dynamic>>[];

      for (var key in allKeys) {
        final quiz = box.get(key);
        if (quiz is Map) {
          final quizMap = Map<String, dynamic>.from(quiz);
          if (quizMap['synced'] != true) {
            unsynced.add(quizMap);
          }
        }
      }

      return unsynced;
    } catch (e) {
      print('❌ Failed to get unsynced quiz results: $e');
      return [];
    }
  }

  /// Mark quiz result as synced
  Future<void> markQuizResultSynced(String quizId) async {
    try {
      final box = await _storageService.openBox(AppConstants.quizResultsBox);
      final quiz = box.get(quizId);
      
      if (quiz != null) {
        final quizMap = Map<String, dynamic>.from(quiz as Map);
        quizMap['synced'] = true;
        quizMap['syncedAt'] = DateTime.now().toIso8601String();
        await box.put(quizId, quizMap);
      }
    } catch (e) {
      print('❌ Failed to mark quiz result as synced: $e');
    }
  }

  /// Get cache size (approximate, in bytes)
  /// Phase 3.5.2: Enhanced to include drill logs
  Future<int> getCacheSize() async {
    try {
      int totalSize = 0;
      
      // Modules box size
      final modulesBox = await _storageService.openBox(AppConstants.modulesBox);
      for (var key in modulesBox.keys) {
        final value = modulesBox.get(key);
        if (value != null) {
          // Approximate size (rough estimate)
          totalSize += value.toString().length * 2; // 2 bytes per char (UTF-16)
        }
      }
      
      // Quiz results box size
      final quizBox = await _storageService.openBox(AppConstants.quizResultsBox);
      for (var key in quizBox.keys) {
        final value = quizBox.get(key);
        if (value != null) {
          totalSize += value.toString().length * 2;
        }
      }
      
      // Drill logs box size (Phase 3.5.2)
      final drillLogBox = await _storageService.openBox(AppConstants.drillLogsBox);
      for (var key in drillLogBox.keys) {
        final value = drillLogBox.get(key);
        if (value != null) {
          totalSize += value.toString().length * 2;
        }
      }
      
      return totalSize;
    } catch (e) {
      return 0;
    }
  }

  /// Check if cache size is within limits
  Future<bool> _checkCacheSize() async {
    try {
      final sizeBytes = await getCacheSize();
      final sizeMB = sizeBytes / (1024 * 1024);
      return sizeMB < maxCacheSizeMB;
    } catch (e) {
      return true; // Allow if check fails
    }
  }

  /// Clear old cache (LRU - Least Recently Used)
  Future<void> clearOldCache({int keepRecentDays = 30}) async {
    try {
      final cutoffDate = DateTime.now().subtract(Duration(days: keepRecentDays));
      final modulesBox = await _storageService.openBox(AppConstants.modulesBox);
      final downloadedModules = await getDownloadedModuleIds();
      
      int cleared = 0;
      for (var moduleId in downloadedModules) {
        final downloadedAtStr = modulesBox.get('module_${moduleId}_downloadedAt');
        if (downloadedAtStr != null) {
          try {
            final downloadedAt = DateTime.parse(downloadedAtStr.toString());
            if (downloadedAt.isBefore(cutoffDate)) {
              await modulesBox.delete('module_$moduleId');
              await modulesBox.delete('module_${moduleId}_downloadedAt');
              cleared++;
            }
          } catch (e) {
            // Invalid date, skip
          }
        }
      }
      
      if (cleared > 0) {
        // Update downloaded modules list
        final updatedList = downloadedModules.where((id) {
          return modulesBox.get('module_$id') != null;
        }).toList();
        await modulesBox.put('downloadedModules', updatedList);
        print('✅ Cleared $cleared old modules from cache');
      }
    } catch (e) {
      print('❌ Failed to clear old cache: $e');
    }
  }

  /// Clear all cache
  Future<void> clearAllCache() async {
    try {
      final modulesBox = await _storageService.openBox(AppConstants.modulesBox);
      final quizBox = await _storageService.openBox(AppConstants.quizResultsBox);
      
      await modulesBox.clear();
      await quizBox.clear();
      
      print('✅ All cache cleared');
    } catch (e) {
      print('❌ Failed to clear cache: $e');
    }
  }

  /// Store drill log offline
  /// Phase 3.5.2: Enhanced offline storage for drill logs
  Future<bool> storeDrillLogOffline(Map<String, dynamic> drillLog) async {
    try {
      final box = await _storageService.openBox(AppConstants.drillLogsBox);
      // Create unique ID for drill log
      final drillLogId = drillLog['_id'] ?? 
                        drillLog['id'] ?? 
                        '${drillLog['drillId']}_${drillLog['userId']}_${DateTime.now().millisecondsSinceEpoch}';
      
      await box.put(drillLogId, {
        ...drillLog,
        'synced': false,
        'storedAt': DateTime.now().toIso8601String(),
      });
      
      print('✅ Drill log stored offline: $drillLogId');
      return true;
    } catch (e) {
      print('❌ Failed to store drill log offline: $e');
      return false;
    }
  }

  /// Get all unsynced drill logs
  /// Phase 3.5.2: Get drill logs ready for sync
  Future<List<Map<String, dynamic>>> getUnsyncedDrillLogs() async {
    try {
      final box = await _storageService.openBox(AppConstants.drillLogsBox);
      final allKeys = box.keys.toList();
      final unsynced = <Map<String, dynamic>>[];

      for (var key in allKeys) {
        final log = box.get(key);
        if (log is Map) {
          final logMap = Map<String, dynamic>.from(log);
          if (logMap['synced'] != true) {
            unsynced.add(logMap);
          }
        }
      }

      return unsynced;
    } catch (e) {
      print('❌ Failed to get unsynced drill logs: $e');
      return [];
    }
  }

  /// Mark drill log as synced
  /// Phase 3.5.2: Update sync status after successful sync
  Future<void> markDrillLogSynced(String drillLogId) async {
    try {
      final box = await _storageService.openBox(AppConstants.drillLogsBox);
      final log = box.get(drillLogId);
      
      if (log != null) {
        final logMap = Map<String, dynamic>.from(log as Map);
        logMap['synced'] = true;
        logMap['syncedAt'] = DateTime.now().toIso8601String();
        await box.put(drillLogId, logMap);
      }
    } catch (e) {
      print('❌ Failed to mark drill log as synced: $e');
    }
  }

  /// Get drill log by ID (offline)
  /// Phase 3.5.2: Retrieve cached drill log
  Future<Map<String, dynamic>?> getDrillLog(String drillLogId) async {
    try {
      final box = await _storageService.openBox(AppConstants.drillLogsBox);
      final log = box.get(drillLogId);
      
      if (log != null && log is Map) {
        return Map<String, dynamic>.from(log);
      }
      
      return null;
    } catch (e) {
      print('❌ Failed to get drill log: $e');
      return null;
    }
  }

  /// Get all drill logs for a specific drill
  /// Phase 3.5.2: Get drill participation history
  Future<List<Map<String, dynamic>>> getDrillLogsForDrill(String drillId) async {
    try {
      final box = await _storageService.openBox(AppConstants.drillLogsBox);
      final allKeys = box.keys.toList();
      final logs = <Map<String, dynamic>>[];

      for (var key in allKeys) {
        final log = box.get(key);
        if (log is Map) {
          final logMap = Map<String, dynamic>.from(log);
          final logDrillId = logMap['drillId']?.toString() ?? logMap['drill_id']?.toString();
          if (logDrillId == drillId) {
            logs.add(logMap);
          }
        }
      }

      return logs;
    } catch (e) {
      print('❌ Failed to get drill logs for drill: $e');
      return [];
    }
  }

  /// Get cache statistics
  Future<Map<String, dynamic>> getCacheStats() async {
    try {
      final downloadedModules = await getDownloadedModuleIds();
      final unsyncedQuizzes = await getUnsyncedQuizResults();
      final unsyncedDrillLogs = await getUnsyncedDrillLogs();
      final cacheSize = await getCacheSize();
      
      return {
        'downloadedModules': downloadedModules.length,
        'unsyncedQuizzes': unsyncedQuizzes.length,
        'unsyncedDrillLogs': unsyncedDrillLogs.length, // Phase 3.5.2
        'cacheSizeMB': (cacheSize / (1024 * 1024)).toStringAsFixed(2),
        'maxCacheSizeMB': maxCacheSizeMB,
      };
    } catch (e) {
      return {
        'downloadedModules': 0,
        'unsyncedQuizzes': 0,
        'unsyncedDrillLogs': 0,
        'cacheSizeMB': '0.00',
        'maxCacheSizeMB': maxCacheSizeMB,
      };
    }
  }
}

