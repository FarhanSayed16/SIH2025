/// Phase 3.1.1: Module Service
/// Handles API calls for modules with enhanced filtering and search
/// Phase 1: Added local persistence support

import 'package:dio/dio.dart';
import '../../../core/services/api_service.dart';
import '../../../core/constants/api_endpoints.dart';
import '../models/module_model.dart';
import 'local_completion_service.dart';
import '../../student/utils/activity_tracker_helper.dart';

class ModuleService {
  final ApiService _apiService;
  final LocalCompletionService _localCompletionService;

  ModuleService({
    ApiService? apiService,
    LocalCompletionService? localCompletionService,
  })  : _apiService = apiService ?? ApiService(),
        _localCompletionService = localCompletionService ?? LocalCompletionService();

  /// Get list of modules with optional filters
  /// Phase 3.1.1: Enhanced with filtering, search, and sorting
  Future<List<ModuleModel>> getModules({
    int page = 1,
    int limit = 10,
    String? type,
    String? category,
    String? difficulty,
    String? gradeLevel,
    List<String>? tags,
    String? search,
    String? sortBy,
    String? sortOrder,
  }) async {
    try {
      final queryParams = <String, dynamic>{
        'page': page,
        'limit': limit,
      };

      if (type != null) queryParams['type'] = type;
      if (category != null) queryParams['category'] = category;
      if (difficulty != null) queryParams['difficulty'] = difficulty;
      if (gradeLevel != null) queryParams['gradeLevel'] = gradeLevel;
      if (tags != null && tags.isNotEmpty) {
        queryParams['tags'] = tags.join(',');
      }
      if (search != null && search.isNotEmpty) {
        queryParams['search'] = search;
      }
      if (sortBy != null) queryParams['sortBy'] = sortBy;
      if (sortOrder != null) queryParams['sortOrder'] = sortOrder;

      final response = await _apiService.get(
        ApiEndpoints.modules,
        queryParameters: queryParams,
      );

      final data = response.data as Map<String, dynamic>;
      final modulesData = data['data'] ?? data;

      if (modulesData is List) {
        return modulesData
            .map((json) => ModuleModel.fromJson(json as Map<String, dynamic>))
            .toList();
      }

      return [];
    } catch (e) {
      print('Error fetching modules: $e');
      rethrow;
    }
  }

  /// Get module by ID
  /// Phase 3.1.1: Enhanced with version support
  Future<ModuleModel> getModuleById(String id, {String? version}) async {
    try {
      final queryParams = <String, dynamic>{};
      if (version != null) {
        queryParams['version'] = version;
      }

      final response = await _apiService.get(
        ApiEndpoints.module(id),
        queryParameters: queryParams.isNotEmpty ? queryParams : null,
      );

      final data = response.data as Map<String, dynamic>;
      final moduleData = (data['data']?['module'] ?? 
                         data['module'] ?? 
                         data) as Map<String, dynamic>;

      return ModuleModel.fromJson(moduleData);
    } catch (e) {
      print('Error fetching module: $e');
      rethrow;
    }
  }

  /// Check if module is legacy (local-only, not in backend)
  /// Legacy NDMA modules use string IDs like 'flood', 'cyclone', etc.
  /// They don't exist in backend database
  bool _isLegacyModule(String moduleId) {
    final legacyIds = [
      'flood',
      'cyclone',
      'earthquake',
      'fire',
      'stampede',
      'heatwave',
      'covid',
      'urban_flood',
      'landslide',
      'tsunami',
      'drought',
      'coldwave',
    ];
    return legacyIds.contains(moduleId.toLowerCase());
  }

  /// Submit quiz answers
  /// Phase 3.3.2: Added class mode support for shared XP distribution
  /// Phase 1: Added local persistence - saves to Hive immediately (optimistic) and syncs with backend
  /// Phase: NDMA Module Video Progress Persistence - Added legacy module handling
  /// Complete a module and track activity
  /// Phase 5: Parent-Teacher-Student Linkage
  Future<Map<String, dynamic>> completeModule(
    String moduleId,
    List<Map<String, dynamic>> answers, {
    int? timeTaken,
    bool isClassMode = false,
    String? classId,
  }) async {
    // Extract score from answers if available (for local persistence)
    int? calculatedScore;
    if (answers.isNotEmpty) {
      // Try to calculate score from answers
      // This is a simple calculation - backend will provide accurate score
      final correctAnswers = answers.where((a) => a['isCorrect'] == true).length;
      final totalAnswers = answers.length;
      if (totalAnswers > 0) {
        calculatedScore = ((correctAnswers / totalAnswers) * 100).round();
      }
    }

    // Phase 1: Save to Hive FIRST (optimistic update)
    // This ensures progress is never lost, even if API call fails
    try {
      await _localCompletionService.markModuleCompleted(
        moduleId,
        score: calculatedScore,
        synced: false, // Will be marked as synced after successful API call
      );
      print('✅ Module completion saved locally (optimistic): $moduleId');
    } catch (localError) {
      print('⚠️ Failed to save module completion locally: $localError');
      // Continue with API call even if local save fails
    }

    // Check if legacy module (local-only, no backend)
    if (_isLegacyModule(moduleId)) {
      print('📂 [MODULE SERVICE] Legacy module detected: $moduleId - skipping backend sync');
      // Mark as synced locally (no backend to sync with)
      try {
        await _localCompletionService.markAsSynced(moduleId);
        print('✅ [MODULE SERVICE] Legacy module completion saved locally (no backend sync needed)');
      } catch (e) {
        print('⚠️ [MODULE SERVICE] Error marking legacy module as synced: $e');
      }
      
      // Return success response for legacy modules
      return {
        'success': true,
        'message': 'Module completed (local-only)',
        'score': calculatedScore ?? 0,
        'data': {
          'score': calculatedScore ?? 0,
          'moduleId': moduleId,
          'isLegacy': true,
        },
      };
    }

    // For non-legacy modules, sync with backend
    try {
      // CRITICAL: Explicit logging before API call
      print('📤 [MODULE SERVICE] Sending module completion to backend:');
      print('📤 [MODULE SERVICE] Endpoint: ${ApiEndpoints.completeModule(moduleId)}');
      print('📤 [MODULE SERVICE] Module ID: $moduleId');
      print('📤 [MODULE SERVICE] Answers count: ${answers.length}');
      print('📤 [MODULE SERVICE] Data: {answers: ${answers.length} items, timeTaken: $timeTaken, isClassMode: $isClassMode}');
      
      final response = await _apiService.post(
        ApiEndpoints.completeModule(moduleId),
        data: {
          'answers': answers,
          if (timeTaken != null) 'timeTaken': timeTaken,
          if (isClassMode) 'isClassMode': true,
          if (classId != null) 'classId': classId,
        },
      );
      
      print('✅ [MODULE SERVICE] API Response received: ${response.statusCode}');
      print('✅ [MODULE SERVICE] Response data: ${response.data}');

      final data = response.data as Map<String, dynamic>;
      final result = (data['data'] ?? data) as Map<String, dynamic>;
      
      print('✅ [MODULE SERVICE] Module completion successfully saved to backend');

      // Phase 1: Mark as synced after successful API call
      try {
        await _localCompletionService.markAsSynced(moduleId);
        
        // Update score if provided in response
        final responseScore = result['score'] as int?;
        if (responseScore != null) {
          // Update the local entry with accurate score from backend
          await _localCompletionService.markModuleCompleted(
            moduleId,
            score: responseScore,
            synced: true,
          );
        }
        
        print('✅ Module completion synced with backend: $moduleId');
      } catch (syncError) {
        print('⚠️ Failed to mark module as synced: $syncError');
        // Don't fail the request if local update fails
      }

      // Phase 5: Track activity for parent-teacher linkage
      try {
        final moduleName = result['module']?['title'] ?? 
                          result['title'] ?? 
                          'Module';
        final responseScore = result['score'] as int?;
        final xpEarned = result['xpEarned'] ?? 
                        result['xp'] ?? 
                        responseScore;
        final finalScore = result['score'] ?? responseScore ?? calculatedScore;
        
        await ActivityTrackerHelper.trackModuleComplete(
          moduleId: moduleId,
          moduleName: moduleName.toString(),
          xpEarned: xpEarned is int ? xpEarned : null,
          score: finalScore is num ? finalScore.toDouble() : null,
        );
      } catch (e) {
        print('⚠️ [MODULE SERVICE] Failed to track activity: $e');
        // Don't fail the module completion if activity tracking fails
      }

      return result;
    } catch (e) {
      print('❌ [MODULE SERVICE] Module completion API call FAILED:');
      print('❌ [MODULE SERVICE] Error type: ${e.runtimeType}');
      print('❌ [MODULE SERVICE] Error message: $e');
      if (e is DioException) {
        print('❌ [MODULE SERVICE] DioException details:');
        print('❌ [MODULE SERVICE]   - Type: ${e.type}');
        print('❌ [MODULE SERVICE]   - Status: ${e.response?.statusCode}');
        print('❌ [MODULE SERVICE]   - Message: ${e.message}');
        print('❌ [MODULE SERVICE]   - Response: ${e.response?.data}');
      }
      // Module is already saved locally, so we can return a success response
      // The sync will happen later when network is available
      print('📴 [MODULE SERVICE] Module completion saved locally, will sync when online');
      
      // Return a local success response
      return {
        'moduleId': moduleId,
        'score': calculatedScore ?? 0,
        'passed': calculatedScore != null && calculatedScore >= 60, // Assume 60% passing
        'synced': false,
        'message': 'Module completed locally. Will sync when online.',
      };
    }
  }

  /// Check if a module is completed (local check)
  /// Phase 1: Added local completion check
  Future<bool> isModuleCompleted(String moduleId) async {
    return await _localCompletionService.isModuleCompleted(moduleId);
  }

  /// Get all completed modules (local)
  /// Phase 1: Added local completion retrieval
  Future<List<String>> getCompletedModules() async {
    return await _localCompletionService.getCompletedModules();
  }
}

