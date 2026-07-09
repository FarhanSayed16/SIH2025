/// Module Completion Service
/// Unified service to track module completion across all types (NDMA, NDRF, Hearing Impaired)

import '../../../core/services/api_service.dart';
import '../../../core/constants/api_endpoints.dart';
import '../models/module_progress_model.dart';

class ModuleCompletionService {
  final ApiService _apiService;

  ModuleCompletionService({ApiService? apiService})
      : _apiService = apiService ?? ApiService();

  /// Mark a video as completed
  /// [moduleId] - Module identifier (e.g., 'ndrf', 'hearing_impaired', or specific NDMA module ID)
  /// [moduleType] - Type of module: 'ndma', 'ndrf', or 'hearing_impaired'
  /// [videoId] - Video identifier (title or ID)
  /// [language] - Optional language for NDRF modules
  /// [totalVideos] - Total number of videos in the module (for completion check)
  Future<ModuleProgressResult> markVideoCompleted({
    required String moduleId,
    required String moduleType,
    required String videoId,
    String? language,
    int? totalVideos,
  }) async {
    try {
      final response = await _apiService.post(
        ApiEndpoints.moduleProgress,
        data: {
          'moduleId': moduleId,
          'moduleType': moduleType,
          'action': 'video_complete',
          'videoId': videoId,
          if (language != null) 'language': language,
          if (totalVideos != null) 'totalVideos': totalVideos,
        },
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = response.data as Map<String, dynamic>;
        final responseData = data['data'] ?? data;
        final moduleProgressData = responseData['moduleProgress'] ?? responseData;

        return ModuleProgressResult(
          success: true,
          moduleProgress: ModuleProgress.fromJson(
              moduleProgressData as Map<String, dynamic>),
          pointsEarned: (responseData['pointsEarned'] ?? 0) is int
              ? responseData['pointsEarned'] as int
              : int.tryParse((responseData['pointsEarned'] ?? 0).toString()) ?? 0,
          xpEarned: (responseData['xpEarned'] ?? 0) is int
              ? responseData['xpEarned'] as int
              : int.tryParse((responseData['xpEarned'] ?? 0).toString()) ?? 0,
        );
      }

      throw Exception('Failed to mark video as completed');
    } catch (e) {
      print('Error marking video as completed: $e');
      rethrow;
    }
  }

  /// Mark a module as completed
  /// Used when all videos are watched or module is completed via quiz
  Future<ModuleProgressResult> markModuleCompleted({
    required String moduleId,
    required String moduleType,
    String? language,
  }) async {
    try {
      final response = await _apiService.post(
        ApiEndpoints.moduleProgress,
        data: {
          'moduleId': moduleId,
          'moduleType': moduleType,
          'action': 'module_complete',
          if (language != null) 'language': language,
        },
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = response.data as Map<String, dynamic>;
        final responseData = data['data'] ?? data;
        final moduleProgressData = responseData['moduleProgress'] ?? responseData;

        return ModuleProgressResult(
          success: true,
          moduleProgress: ModuleProgress.fromJson(
              moduleProgressData as Map<String, dynamic>),
          pointsEarned: (responseData['pointsEarned'] ?? 0) is int
              ? responseData['pointsEarned'] as int
              : int.tryParse((responseData['pointsEarned'] ?? 0).toString()) ?? 0,
          xpEarned: (responseData['xpEarned'] ?? 0) is int
              ? responseData['xpEarned'] as int
              : int.tryParse((responseData['xpEarned'] ?? 0).toString()) ?? 0,
        );
      }

      throw Exception('Failed to mark module as completed');
    } catch (e) {
      print('Error marking module as completed: $e');
      rethrow;
    }
  }

  /// Get module progress
  Future<ModuleProgress?> getModuleProgress({
    required String moduleId,
    required String moduleType,
    String? language,
  }) async {
    try {
      final queryParams = <String, dynamic>{
        'moduleType': moduleType,
      };
      if (language != null) {
        queryParams['language'] = language;
      }

      final response = await _apiService.get(
        ApiEndpoints.moduleProgressById(moduleId),
        queryParameters: queryParams,
      );

      if (response.statusCode == 200) {
        final data = response.data as Map<String, dynamic>;
        final responseData = data['data'] ?? data;
        final moduleProgressData = responseData['moduleProgress'];

        if (moduleProgressData == null) {
          return null; // No progress found
        }

        return ModuleProgress.fromJson(
            moduleProgressData as Map<String, dynamic>);
      }

      return null;
    } catch (e) {
      print('Error getting module progress: $e');
      return null; // Return null on error (offline or not found)
    }
  }

  /// Get user's overall progress
  Future<UserProgressSummary?> getUserProgress({String? userId}) async {
    try {
      // If userId is not provided, get current user's ID from auth
      // For now, we'll need to pass it or get it from auth provider
      if (userId == null) {
        throw Exception('User ID is required');
      }

      final response = await _apiService.get(
        ApiEndpoints.userProgress(userId),
      );

      if (response.statusCode == 200) {
        final data = response.data as Map<String, dynamic>;
        final responseData = (data['data'] ?? data) as Map<String, dynamic>;
        return UserProgressSummary.fromJson(responseData);
      }

      return null;
    } catch (e) {
      print('Error getting user progress: $e');
      return null;
    }
  }
}

/// Result of module progress operation
class ModuleProgressResult {
  final bool success;
  final ModuleProgress moduleProgress;
  final int pointsEarned;
  final int xpEarned;

  ModuleProgressResult({
    required this.success,
    required this.moduleProgress,
    required this.pointsEarned,
    required this.xpEarned,
  });
}

