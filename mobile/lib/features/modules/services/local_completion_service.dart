/// Phase 1: Local Completion Service
/// Handles local persistence of module completion state using Hive
/// Provides optimistic updates and offline support

import '../../../core/services/storage_service.dart';
import '../../../core/constants/app_constants.dart';

/// Model for completed module entry
class CompletedModuleEntry {
  final String moduleId;
  final DateTime completedAt;
  final int? score;
  final bool synced;
  final DateTime? syncedAt;

  CompletedModuleEntry({
    required this.moduleId,
    required this.completedAt,
    this.score,
    this.synced = false,
    this.syncedAt,
  });

  Map<String, dynamic> toJson() {
    return {
      'moduleId': moduleId,
      'completedAt': completedAt.toIso8601String(),
      'score': score,
      'synced': synced,
      'syncedAt': syncedAt?.toIso8601String(),
    };
  }

  factory CompletedModuleEntry.fromJson(Map<String, dynamic> json) {
    return CompletedModuleEntry(
      moduleId: json['moduleId'] as String,
      completedAt: DateTime.parse(json['completedAt'] as String),
      score: json['score'] as int?,
      synced: json['synced'] as bool? ?? false,
      syncedAt: json['syncedAt'] != null
          ? DateTime.parse(json['syncedAt'] as String)
          : null,
    );
  }
}

/// Local Completion Service
/// Manages module completion state in Hive for offline support and optimistic updates
class LocalCompletionService {
  final StorageService _storageService;

  LocalCompletionService({StorageService? storageService})
      : _storageService = storageService ?? StorageService();

  /// Mark a module as completed (optimistic - saves to Hive immediately)
  /// [moduleId] - The module ID to mark as completed
  /// [score] - Optional quiz score
  /// [synced] - Whether this completion has been synced with backend (default: false)
  Future<void> markModuleCompleted(
    String moduleId, {
    int? score,
    bool synced = false,
  }) async {
    try {
      final box = await _storageService.openBox(AppConstants.completedModulesBox);
      final now = DateTime.now();

      final entry = CompletedModuleEntry(
        moduleId: moduleId,
        completedAt: now,
        score: score,
        synced: synced,
        syncedAt: synced ? now : null,
      );

      // Store by moduleId as key for easy lookup
      await box.put(moduleId, entry.toJson());

      // Also maintain a list of all completed module IDs for quick access
      final completedList = box.get('completedList', defaultValue: <String>[]) as List<dynamic>;
      if (!completedList.contains(moduleId)) {
        completedList.add(moduleId);
        await box.put('completedList', completedList);
      }

      print('✅ Module completion saved locally: $moduleId (synced: $synced)');
    } catch (e) {
      print('❌ Error saving module completion locally: $e');
      rethrow;
    }
  }

  /// Check if a module is completed
  /// [moduleId] - The module ID to check
  /// Returns true if module is completed locally
  Future<bool> isModuleCompleted(String moduleId) async {
    try {
      final box = await _storageService.openBox(AppConstants.completedModulesBox);
      return box.containsKey(moduleId);
    } catch (e) {
      print('Error checking module completion: $e');
      return false;
    }
  }

  /// Get completed module entry
  /// [moduleId] - The module ID
  /// Returns the completion entry or null if not found
  Future<CompletedModuleEntry?> getCompletedModule(String moduleId) async {
    try {
      final box = await _storageService.openBox(AppConstants.completedModulesBox);
      final data = box.get(moduleId);

      if (data == null) return null;

      if (data is Map) {
        return CompletedModuleEntry.fromJson(Map<String, dynamic>.from(data));
      }

      return null;
    } catch (e) {
      print('Error getting completed module: $e');
      return null;
    }
  }

  /// Get all completed module IDs
  /// Returns list of all completed module IDs
  Future<List<String>> getCompletedModules() async {
    try {
      final box = await _storageService.openBox(AppConstants.completedModulesBox);
      final completedList = box.get('completedList', defaultValue: <String>[]) as List<dynamic>;
      return completedList.map((e) => e.toString()).toList();
    } catch (e) {
      print('Error getting completed modules: $e');
      return [];
    }
  }

  /// Get all completed module entries
  /// Returns list of all completion entries
  Future<List<CompletedModuleEntry>> getCompletedModuleEntries() async {
    try {
      final box = await _storageService.openBox(AppConstants.completedModulesBox);
      final completedList = box.get('completedList', defaultValue: <String>[]) as List<dynamic>;
      final entries = <CompletedModuleEntry>[];

      for (final moduleId in completedList) {
        final entry = await getCompletedModule(moduleId.toString());
        if (entry != null) {
          entries.add(entry);
        }
      }

      return entries;
    } catch (e) {
      print('Error getting completed module entries: $e');
      return [];
    }
  }

  /// Mark a module completion as synced with backend
  /// [moduleId] - The module ID
  Future<void> markAsSynced(String moduleId) async {
    try {
      final entry = await getCompletedModule(moduleId);
      if (entry != null) {
        final box = await _storageService.openBox(AppConstants.completedModulesBox);
        final updatedEntry = CompletedModuleEntry(
          moduleId: entry.moduleId,
          completedAt: entry.completedAt,
          score: entry.score,
          synced: true,
          syncedAt: DateTime.now(),
        );
        await box.put(moduleId, updatedEntry.toJson());
        print('✅ Module completion marked as synced: $moduleId');
      }
    } catch (e) {
      print('Error marking module as synced: $e');
    }
  }

  /// Get unsynced completions (for offline sync)
  /// Returns list of module IDs that haven't been synced
  Future<List<String>> getUnsyncedCompletions() async {
    try {
      final entries = await getCompletedModuleEntries();
      return entries
          .where((entry) => !entry.synced)
          .map((entry) => entry.moduleId)
          .toList();
    } catch (e) {
      print('Error getting unsynced completions: $e');
      return [];
    }
  }

  /// Sync completed modules from backend
  /// [completedModuleIds] - List of module IDs from backend
  /// This is called on app start to sync local state with backend
  Future<void> syncFromBackend(List<String> completedModuleIds) async {
    try {
      final box = await _storageService.openBox(AppConstants.completedModulesBox);
      final now = DateTime.now();

      // Mark all backend completions as synced
      for (final moduleId in completedModuleIds) {
        final existing = await getCompletedModule(moduleId);
        if (existing != null) {
          // Update existing entry to mark as synced
          await markAsSynced(moduleId);
        } else {
          // Create new entry from backend data
          final entry = CompletedModuleEntry(
            moduleId: moduleId,
            completedAt: now, // Use current time as we don't have backend timestamp
            synced: true,
            syncedAt: now,
          );
          await box.put(moduleId, entry.toJson());
        }
      }

      // Update completed list
      await box.put('completedList', completedModuleIds);

      print('✅ Synced ${completedModuleIds.length} completed modules from backend');
    } catch (e) {
      print('Error syncing from backend: $e');
    }
  }

  /// Clear all local completion data (for testing/debugging)
  Future<void> clearAll() async {
    try {
      final box = await _storageService.openBox(AppConstants.completedModulesBox);
      await box.clear();
      print('✅ Cleared all local completion data');
    } catch (e) {
      print('Error clearing completion data: $e');
    }
  }

  /// Remove a module from completed list (if user retakes quiz)
  Future<void> removeCompletedModule(String moduleId) async {
    try {
      final box = await _storageService.openBox(AppConstants.completedModulesBox);
      await box.delete(moduleId);

      // Update completed list
      final completedList = box.get('completedList', defaultValue: <String>[]) as List<dynamic>;
      completedList.remove(moduleId);
      await box.put('completedList', completedList);

      print('✅ Removed module from completed list: $moduleId');
    } catch (e) {
      print('Error removing completed module: $e');
    }
  }
}

