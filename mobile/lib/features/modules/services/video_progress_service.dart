/// Video Progress Service — user-scoped Hive persistence (B5).

import '../../../core/services/storage_service.dart';
import '../../../core/constants/app_constants.dart';
import '../models/video_progress_model.dart';

class VideoProgressService {
  final StorageService _storageService;

  VideoProgressService({StorageService? storageService})
      : _storageService = storageService ?? StorageService();

  /// User-scoped key. Legacy `module_$id` keys stay unassigned (never credited
  /// to the current learner on shared devices).
  String _progressKey(String moduleId, String? userId) {
    if (userId != null && userId.isNotEmpty) {
      return 'user_${userId}_module_$moduleId';
    }
    return 'module_$moduleId';
  }

  Future<void> markVideoCompleted({
    required String moduleId,
    required String videoTitle,
    required String videoUrl,
    String? userId,
    int? watchTimeSeconds,
  }) async {
    try {
      final box = await _storageService.openBox(AppConstants.videoProgressBox);
      final progressKey = _progressKey(moduleId, userId);
      final existingData = box.get(progressKey);

      ModuleVideoProgress progress;
      if (existingData != null && existingData is Map) {
        try {
          final dataMap = Map<String, dynamic>.from(existingData);
          progress = ModuleVideoProgress.fromJson(dataMap);
        } catch (_) {
          progress = ModuleVideoProgress(moduleId: moduleId, videos: []);
        }
      } else {
        progress = ModuleVideoProgress(moduleId: moduleId, videos: []);
      }

      final existingVideoIndex = progress.videos.indexWhere(
        (v) => v.videoTitle == videoTitle || v.videoUrl == videoUrl,
      );

      // Idempotent: already completed — refresh timestamp only if needed
      if (existingVideoIndex >= 0 &&
          progress.videos[existingVideoIndex].isCompleted) {
        return;
      }

      final entry = VideoProgress(
        moduleId: moduleId,
        videoTitle: videoTitle,
        videoUrl: videoUrl,
        isCompleted: true,
        completedAt: DateTime.now(),
        watchTimeSeconds: watchTimeSeconds,
      );

      if (existingVideoIndex >= 0) {
        progress.videos[existingVideoIndex] = entry;
      } else {
        progress.videos.add(entry);
      }

      progress = progress.copyWith(lastUpdated: DateTime.now());
      await box.put(progressKey, progress.toJson());
    } catch (e) {
      rethrow;
    }
  }

  Future<ModuleVideoProgress?> getModuleVideoProgress(
    String moduleId, {
    String? userId,
  }) async {
    try {
      final box = await _storageService.openBox(AppConstants.videoProgressBox);
      final progressKey = _progressKey(moduleId, userId);
      final data = box.get(progressKey);

      if (data == null || data is! Map) return null;

      try {
        return ModuleVideoProgress.fromJson(Map<String, dynamic>.from(data));
      } catch (_) {
        return null;
      }
    } catch (_) {
      return null;
    }
  }

  Future<bool> isVideoCompleted({
    required String moduleId,
    required String videoTitle,
    String? userId,
  }) async {
    final progress =
        await getModuleVideoProgress(moduleId, userId: userId);
    if (progress == null) return false;
    return progress.isVideoCompleted(videoTitle);
  }

  Future<List<String>> getCompletedVideos(
    String moduleId, {
    String? userId,
  }) async {
    final progress =
        await getModuleVideoProgress(moduleId, userId: userId);
    if (progress == null) return [];
    return progress.videos
        .where((v) => v.isCompleted)
        .map((v) => v.videoTitle)
        .toList();
  }

  Future<void> initializeModuleProgress({
    required String moduleId,
    required List<String> videoTitles,
    required List<String> videoUrls,
    String? userId,
  }) async {
    final existing =
        await getModuleVideoProgress(moduleId, userId: userId);
    if (existing != null) return;

    final videos = <VideoProgress>[];
    for (var i = 0; i < videoTitles.length && i < videoUrls.length; i++) {
      videos.add(VideoProgress(
        moduleId: moduleId,
        videoTitle: videoTitles[i],
        videoUrl: videoUrls[i],
        isCompleted: false,
      ));
    }

    final progress = ModuleVideoProgress(moduleId: moduleId, videos: videos);
    final box = await _storageService.openBox(AppConstants.videoProgressBox);
    await box.put(_progressKey(moduleId, userId), progress.toJson());
  }

  Future<void> clearModuleProgress(String moduleId, {String? userId}) async {
    final box = await _storageService.openBox(AppConstants.videoProgressBox);
    await box.delete(_progressKey(moduleId, userId));
  }

  /// Persist playback position for incomplete NDMA videos (B9 / D06).
  /// [position] is a fraction of duration in 0.0–1.0.
  Future<void> saveVideoPosition({
    required String moduleId,
    required String videoTitle,
    required String videoUrl,
    required double position,
    String? userId,
    int? watchTimeSeconds,
  }) async {
    if (position.isNaN || position.isInfinite) return;
    final clamped = position.clamp(0.0, 1.0);

    try {
      final box = await _storageService.openBox(AppConstants.videoProgressBox);
      final progressKey = _progressKey(moduleId, userId);
      final existingData = box.get(progressKey);

      ModuleVideoProgress progress;
      if (existingData != null && existingData is Map) {
        try {
          progress = ModuleVideoProgress.fromJson(
            Map<String, dynamic>.from(existingData),
          );
        } catch (_) {
          progress = ModuleVideoProgress(moduleId: moduleId, videos: []);
        }
      } else {
        progress = ModuleVideoProgress(moduleId: moduleId, videos: []);
      }

      final existingVideoIndex = progress.videos.indexWhere(
        (v) => v.videoTitle == videoTitle || v.videoUrl == videoUrl,
      );

      // Do not overwrite a completed video with a mid-stream position.
      if (existingVideoIndex >= 0 &&
          progress.videos[existingVideoIndex].isCompleted) {
        return;
      }

      final entry = VideoProgress(
        moduleId: moduleId,
        videoTitle: videoTitle,
        videoUrl: videoUrl,
        isCompleted: false,
        watchTimeSeconds: watchTimeSeconds,
        lastPosition: clamped,
      );

      if (existingVideoIndex >= 0) {
        progress.videos[existingVideoIndex] = entry;
      } else {
        progress.videos.add(entry);
      }

      progress = progress.copyWith(lastUpdated: DateTime.now());
      await box.put(progressKey, progress.toJson());
    } catch (_) {
      // Position save is best-effort; playback continues.
    }
  }

  Future<double?> getVideoPosition({
    required String moduleId,
    required String videoTitle,
    String? userId,
  }) async {
    final progress =
        await getModuleVideoProgress(moduleId, userId: userId);
    final video = progress?.getVideoProgress(videoTitle);
    if (video == null || video.isCompleted) return null;
    return video.lastPosition;
  }
}
