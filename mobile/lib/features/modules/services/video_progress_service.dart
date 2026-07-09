/// Video Progress Service
/// Manages video completion status persistence for NDMA modules
/// Phase: NDMA Module Video Progress Persistence

import '../../../core/services/storage_service.dart';
import '../../../core/constants/app_constants.dart';
import '../models/video_progress_model.dart';

class VideoProgressService {
  final StorageService _storageService;

  VideoProgressService({StorageService? storageService})
      : _storageService = storageService ?? StorageService();

  /// Mark a video as completed
  /// [moduleId] - Module identifier (e.g., 'flood', 'cyclone')
  /// [videoTitle] - Video title (used as identifier)
  /// [videoUrl] - Video URL
  /// [watchTimeSeconds] - Optional watch time in seconds
  Future<void> markVideoCompleted({
    required String moduleId,
    required String videoTitle,
    required String videoUrl,
    int? watchTimeSeconds,
  }) async {
    try {
      final box = await _storageService.openBox(AppConstants.videoProgressBox);
      
      // Get existing progress or create new
      final progressKey = 'module_$moduleId';
      final existingData = box.get(progressKey);
      
      ModuleVideoProgress progress;
      if (existingData != null && existingData is Map) {
        try {
          // Fix: Properly convert Hive Map<dynamic, dynamic> to Map<String, dynamic>
          final dataMap = Map<String, dynamic>.from(existingData);
          progress = ModuleVideoProgress.fromJson(dataMap);
        } catch (parseError) {
          print('⚠️ [VIDEO PROGRESS] Error parsing existing progress, creating new: $parseError');
          progress = ModuleVideoProgress(moduleId: moduleId, videos: []);
        }
      } else {
        progress = ModuleVideoProgress(moduleId: moduleId, videos: []);
      }

      // Update or add video progress
      final existingVideoIndex = progress.videos.indexWhere(
        (v) => v.videoTitle == videoTitle || v.videoUrl == videoUrl,
      );

      if (existingVideoIndex >= 0) {
        // Update existing
        progress.videos[existingVideoIndex] = VideoProgress(
          moduleId: moduleId,
          videoTitle: videoTitle,
          videoUrl: videoUrl,
          isCompleted: true,
          completedAt: DateTime.now(),
          watchTimeSeconds: watchTimeSeconds,
        );
      } else {
        // Add new
        progress.videos.add(VideoProgress(
          moduleId: moduleId,
          videoTitle: videoTitle,
          videoUrl: videoUrl,
          isCompleted: true,
          completedAt: DateTime.now(),
          watchTimeSeconds: watchTimeSeconds,
        ));
      }

      // Update lastUpdated timestamp
      progress = progress.copyWith(lastUpdated: DateTime.now());

      // Save to Hive
      await box.put(progressKey, progress.toJson());
      print('💾 [VIDEO PROGRESS] Saved video completion: $moduleId - $videoTitle');
    } catch (e) {
      print('❌ [VIDEO PROGRESS] Error saving video completion: $e');
      rethrow;
    }
  }

  /// Get video progress for a module
  /// [moduleId] - Module identifier
  /// Returns ModuleVideoProgress or null if not found
  /// Phase: Fix type casting errors - Properly handle Hive Map<dynamic, dynamic>
  Future<ModuleVideoProgress?> getModuleVideoProgress(String moduleId) async {
    try {
      final box = await _storageService.openBox(AppConstants.videoProgressBox);
      final progressKey = 'module_$moduleId';
      final data = box.get(progressKey);

      if (data == null) {
        print('📂 [VIDEO PROGRESS] No progress found for module: $moduleId');
        return null;
      }

      // Fix: Properly convert Hive Map<dynamic, dynamic> to Map<String, dynamic>
      if (data is! Map) {
        print('⚠️ [VIDEO PROGRESS] Invalid data type for module $moduleId: ${data.runtimeType}');
        return null;
      }

      try {
        // Convert Map<dynamic, dynamic> to Map<String, dynamic>
        final dataMap = Map<String, dynamic>.from(data);
        final progress = ModuleVideoProgress.fromJson(dataMap);
        print('📂 [VIDEO PROGRESS] Loaded progress for $moduleId: ${progress.completedCount}/${progress.videos.length} videos');
        return progress;
      } catch (parseError) {
        print('❌ [VIDEO PROGRESS] Error parsing progress for $moduleId: $parseError');
        return null;
      }
    } catch (e) {
      print('❌ [VIDEO PROGRESS] Error loading video progress: $e');
      return null;
    }
  }

  /// Check if a specific video is completed
  /// [moduleId] - Module identifier
  /// [videoTitle] - Video title
  /// Returns true if video is completed
  Future<bool> isVideoCompleted({
    required String moduleId,
    required String videoTitle,
  }) async {
    try {
      final progress = await getModuleVideoProgress(moduleId);
      if (progress == null) return false;
      return progress.isVideoCompleted(videoTitle);
    } catch (e) {
      print('❌ [VIDEO PROGRESS] Error checking video completion: $e');
      return false;
    }
  }

  /// Get all completed videos for a module
  /// [moduleId] - Module identifier
  /// Returns list of completed video titles
  Future<List<String>> getCompletedVideos(String moduleId) async {
    try {
      final progress = await getModuleVideoProgress(moduleId);
      if (progress == null) return [];
      return progress.videos
          .where((v) => v.isCompleted)
          .map((v) => v.videoTitle)
          .toList();
    } catch (e) {
      print('❌ [VIDEO PROGRESS] Error getting completed videos: $e');
      return [];
    }
  }

  /// Initialize video progress for a module (if not exists)
  /// This ensures all videos are tracked even if not yet watched
  /// [moduleId] - Module identifier
  /// [videoTitles] - List of all video titles in the module
  /// [videoUrls] - List of all video URLs (must match titles order)
  Future<void> initializeModuleProgress({
    required String moduleId,
    required List<String> videoTitles,
    required List<String> videoUrls,
  }) async {
    try {
      final existing = await getModuleVideoProgress(moduleId);
      if (existing != null) {
        // Progress already exists, don't overwrite
        return;
      }

      // Create initial progress with all videos marked as not completed
      final videos = <VideoProgress>[];
      for (int i = 0; i < videoTitles.length && i < videoUrls.length; i++) {
        videos.add(VideoProgress(
          moduleId: moduleId,
          videoTitle: videoTitles[i],
          videoUrl: videoUrls[i],
          isCompleted: false,
        ));
      }

      final progress = ModuleVideoProgress(
        moduleId: moduleId,
        videos: videos,
      );

      final box = await _storageService.openBox(AppConstants.videoProgressBox);
      final progressKey = 'module_$moduleId';
      await box.put(progressKey, progress.toJson());
      print('💾 [VIDEO PROGRESS] Initialized progress for module: $moduleId (${videos.length} videos)');
    } catch (e) {
      print('❌ [VIDEO PROGRESS] Error initializing module progress: $e');
    }
  }

  /// Clear all video progress for a module (for testing/debugging)
  Future<void> clearModuleProgress(String moduleId) async {
    try {
      final box = await _storageService.openBox(AppConstants.videoProgressBox);
      final progressKey = 'module_$moduleId';
      await box.delete(progressKey);
      print('✅ [VIDEO PROGRESS] Cleared progress for module: $moduleId');
    } catch (e) {
      print('❌ [VIDEO PROGRESS] Error clearing progress: $e');
    }
  }
}

