// import 'package:hive_flutter/hive_flutter.dart'; // Unused import removed
import 'dart:convert';
import 'package:flutter/services.dart';
import 'api_service.dart';
import 'storage_service.dart';
import '../constants/app_constants.dart';
import '../constants/api_endpoints.dart';

/// Content Sync Service - Handles module and content synchronization
class ContentSyncService {
  final ApiService _apiService;
  final StorageService _storageService;

  ContentSyncService({
    ApiService? apiService,
    StorageService? storageService,
  })  : _apiService = apiService ?? ApiService(),
        _storageService = storageService ?? StorageService();

  /// Sync modules from backend
  Future<bool> syncModules({bool forceRefresh = false}) async {
    try {
      // Check if we need to refresh
      if (!forceRefresh) {
        final lastSync = await _getLastSyncTime('modules');
        if (lastSync != null) {
          final now = DateTime.now();
          final difference = now.difference(lastSync);
          if (difference < AppConstants.moduleCacheExpiry) {
            // Cache is still valid
            return true;
          }
        }
      }

      // Fetch modules from backend
      final response = await _apiService.get(ApiEndpoints.modules);
      final modules = response.data['data'] ?? response.data;

      if (modules is List) {
        // Store modules in Hive
        final box = await _storageService.openBox(AppConstants.modulesBox);
        await box.put('modules', modules);
        await box.put('lastSync', DateTime.now().toIso8601String());

        return true;
      }

      return false;
    } catch (e) {
      // If offline, try to load from cache
      return await _loadModulesFromCache();
    }
  }

  /// Get modules from cache
  Future<List<Map<String, dynamic>>> getModulesFromCache() async {
    try {
      final box = await _storageService.openBox(AppConstants.modulesBox);
      final modules = box.get('modules');

      if (modules is List) {
        return modules.map((m) => Map<String, dynamic>.from(m as Map)).toList();
      }

      return [];
    } catch (e) {
      return [];
    }
  }

  /// Load modules from cache (fallback)
  Future<bool> _loadModulesFromCache() async {
    final modules = await getModulesFromCache();
    return modules.isNotEmpty;
  }

  /// Get last sync time
  Future<DateTime?> _getLastSyncTime(String type) async {
    try {
      final box = await _storageService.openBox(AppConstants.cacheBox);
      final lastSync = box.get('${type}_lastSync');
      if (lastSync is String) {
        return DateTime.parse(lastSync);
      }
    } catch (e) {
      // Ignore
    }
    return null;
  }

  /// Inject mock data (Add-on 3)
  Future<void> injectMockData() async {
    try {
      // Check if already injected
      final box = await _storageService.openBox(AppConstants.cacheBox);
      if (box.get('mockDataInjected') == true) {
        return; // Already injected
      }

      // Load mock data from assets
      final jsonString = await rootBundle.loadString('assets/mock_data.json');
      final mockData = json.decode(jsonString) as Map<String, dynamic>;

      // Inject drill logs
      if (mockData['drillLogs'] != null) {
        final drillLogBox =
            await _storageService.openBox(AppConstants.drillLogsBox);
        final drillLogs = mockData['drillLogs'] as List;
        for (var log in drillLogs) {
          final logMap = log as Map<String, dynamic>;
          final id = (logMap['id'] as String?) ??
              DateTime.now().millisecondsSinceEpoch.toString();
          await drillLogBox.put(id, {
            ...logMap,
            'synced': false,
            'createdAt': DateTime.now().toIso8601String(),
          });
        }
      }

      // Inject badges (store in cache box)
      if (mockData['badges'] != null) {
        await box.put('badges', mockData['badges']);
      }

      // Inject leaderboard data
      if (mockData['leaderboard'] != null) {
        await box.put('leaderboard', mockData['leaderboard']);
      }

      // Mark as injected
      await box.put('mockDataInjected', true);
    } catch (e) {
      print('Failed to inject mock data: $e');
    }
  }

  /// Check if mock data should be injected
  Future<bool> shouldInjectMockData() async {
    try {
      final drillLogBox =
          await _storageService.openBox(AppConstants.drillLogsBox);
      final cacheBox = await _storageService.openBox(AppConstants.cacheBox);

      // Check if drill logs box is empty and mock data not injected
      return drillLogBox.isEmpty && cacheBox.get('mockDataInjected') != true;
    } catch (e) {
      return false;
    }
  }

  /// Get cached modules last update time
  Future<DateTime?> getModulesLastUpdate() async {
    try {
      final box = await _storageService.openBox(AppConstants.modulesBox);
      final lastSync = box.get('lastSync');
      if (lastSync is String) {
        return DateTime.parse(lastSync);
      }
    } catch (e) {
      // Ignore
    }
    return null;
  }

  /// Clear all cached content
  Future<void> clearCache() async {
    try {
      final modulesBox = await _storageService.openBox(AppConstants.modulesBox);
      final cacheBox = await _storageService.openBox(AppConstants.cacheBox);

      await modulesBox.clear();
      await cacheBox.clear();
    } catch (e) {
      print('Failed to clear cache: $e');
    }
  }
}
