/// Video Progress Model
/// Tracks individual video completion for NDMA modules
/// Phase: NDMA Module Video Progress Persistence

class VideoProgress {
  final String moduleId;
  final String videoTitle; // Use title as identifier (or URL if unique)
  final String videoUrl;
  final bool isCompleted;
  final DateTime? completedAt;
  final int? watchTimeSeconds; // Optional: track watch time
  final double? lastPosition; // Optional: resume position (0.0 to 1.0)

  VideoProgress({
    required this.moduleId,
    required this.videoTitle,
    required this.videoUrl,
    this.isCompleted = false,
    this.completedAt,
    this.watchTimeSeconds,
    this.lastPosition,
  });

  Map<String, dynamic> toJson() {
    return {
      'moduleId': moduleId,
      'videoTitle': videoTitle,
      'videoUrl': videoUrl,
      'isCompleted': isCompleted,
      'completedAt': completedAt?.toIso8601String(),
      'watchTimeSeconds': watchTimeSeconds,
      'lastPosition': lastPosition,
    };
  }

  factory VideoProgress.fromJson(Map<String, dynamic> json) {
    return VideoProgress(
      moduleId: json['moduleId'] as String,
      videoTitle: json['videoTitle'] as String,
      videoUrl: json['videoUrl'] as String,
      isCompleted: json['isCompleted'] as bool? ?? false,
      completedAt: json['completedAt'] != null
          ? DateTime.parse(json['completedAt'] as String)
          : null,
      watchTimeSeconds: json['watchTimeSeconds'] as int?,
      lastPosition: json['lastPosition'] as double?,
    );
  }

  VideoProgress copyWith({
    String? moduleId,
    String? videoTitle,
    String? videoUrl,
    bool? isCompleted,
    DateTime? completedAt,
    int? watchTimeSeconds,
    double? lastPosition,
  }) {
    return VideoProgress(
      moduleId: moduleId ?? this.moduleId,
      videoTitle: videoTitle ?? this.videoTitle,
      videoUrl: videoUrl ?? this.videoUrl,
      isCompleted: isCompleted ?? this.isCompleted,
      completedAt: completedAt ?? this.completedAt,
      watchTimeSeconds: watchTimeSeconds ?? this.watchTimeSeconds,
      lastPosition: lastPosition ?? this.lastPosition,
    );
  }
}

/// Module Video Progress
/// Tracks all video progress for a single module
class ModuleVideoProgress {
  final String moduleId;
  final List<VideoProgress> videos;
  final DateTime lastUpdated;

  ModuleVideoProgress({
    required this.moduleId,
    required this.videos,
    DateTime? lastUpdated,
  }) : lastUpdated = lastUpdated ?? DateTime.now();

  int get completedCount => videos.where((v) => v.isCompleted).length;
  
  double get progressPercentage {
    if (videos.isEmpty) return 0.0;
    return completedCount / videos.length;
  }

  bool isVideoCompleted(String videoTitle) {
    return videos.any((v) => v.videoTitle == videoTitle && v.isCompleted);
  }

  VideoProgress? getVideoProgress(String videoTitle) {
    try {
      return videos.firstWhere(
        (v) => v.videoTitle == videoTitle,
      );
    } catch (e) {
      return null;
    }
  }

  Map<String, dynamic> toJson() {
    return {
      'moduleId': moduleId,
      'videos': videos.map((v) => v.toJson()).toList(),
      'lastUpdated': lastUpdated.toIso8601String(),
    };
  }

  factory ModuleVideoProgress.fromJson(Map<String, dynamic> json) {
    return ModuleVideoProgress(
      moduleId: json['moduleId'] as String,
      videos: (json['videos'] as List?)
          ?.map((v) => VideoProgress.fromJson(v as Map<String, dynamic>))
          .toList() ?? [],
      lastUpdated: json['lastUpdated'] != null
          ? DateTime.parse(json['lastUpdated'] as String)
          : DateTime.now(),
    );
  }

  ModuleVideoProgress copyWith({
    String? moduleId,
    List<VideoProgress>? videos,
    DateTime? lastUpdated,
  }) {
    return ModuleVideoProgress(
      moduleId: moduleId ?? this.moduleId,
      videos: videos ?? this.videos,
      lastUpdated: lastUpdated ?? this.lastUpdated,
    );
  }
}

