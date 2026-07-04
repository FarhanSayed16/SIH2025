/// Module Progress Model
/// Tracks user progress for all module types: NDMA Interactive, NDRF, Hearing Impaired

class ModuleProgress {
  final String? id;
  final String moduleId;
  final String moduleType; // 'ndma', 'ndrf', 'hearing_impaired'
  final String? language; // For NDRF modules
  final List<String> completedVideos;
  final bool isCompleted;
  final int pointsEarned;
  final int xpEarned;
  final DateTime? completedAt;
  final DateTime? lastUpdated;

  ModuleProgress({
    this.id,
    required this.moduleId,
    required this.moduleType,
    this.language,
    this.completedVideos = const [],
    this.isCompleted = false,
    this.pointsEarned = 0,
    this.xpEarned = 0,
    this.completedAt,
    this.lastUpdated,
  });

  /// Calculate progress percentage
  double calculateProgress(int totalVideos) {
    if (totalVideos == 0) return 0.0;
    return (completedVideos.length / totalVideos) * 100;
  }

  /// Check if a specific video is completed
  bool isVideoCompleted(String videoId) {
    return completedVideos.contains(videoId);
  }

  factory ModuleProgress.fromJson(Map<String, dynamic> json) {
    return ModuleProgress(
      id: json['_id']?.toString() ?? json['id']?.toString(),
      moduleId: json['moduleId'] as String,
      moduleType: json['moduleType'] as String,
      language: json['language'] as String?,
      completedVideos: json['completedVideos'] != null
          ? List<String>.from(json['completedVideos'] as List)
          : [],
      isCompleted: json['isCompleted'] as bool? ?? false,
      pointsEarned: (json['pointsEarned'] ?? 0) is int
          ? json['pointsEarned'] as int
          : int.tryParse((json['pointsEarned'] ?? 0).toString()) ?? 0,
      xpEarned: (json['xpEarned'] ?? 0) is int
          ? json['xpEarned'] as int
          : int.tryParse((json['xpEarned'] ?? 0).toString()) ?? 0,
      completedAt: json['completedAt'] != null
          ? DateTime.parse(json['completedAt'] as String)
          : null,
      lastUpdated: json['lastUpdated'] != null
          ? DateTime.parse(json['lastUpdated'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'moduleId': moduleId,
      'moduleType': moduleType,
      if (language != null) 'language': language,
      'completedVideos': completedVideos,
      'isCompleted': isCompleted,
      'pointsEarned': pointsEarned,
      'xpEarned': xpEarned,
      if (completedAt != null) 'completedAt': completedAt!.toIso8601String(),
      if (lastUpdated != null) 'lastUpdated': lastUpdated!.toIso8601String(),
    };
  }

  ModuleProgress copyWith({
    String? id,
    String? moduleId,
    String? moduleType,
    String? language,
    List<String>? completedVideos,
    bool? isCompleted,
    int? pointsEarned,
    int? xpEarned,
    DateTime? completedAt,
    DateTime? lastUpdated,
  }) {
    return ModuleProgress(
      id: id ?? this.id,
      moduleId: moduleId ?? this.moduleId,
      moduleType: moduleType ?? this.moduleType,
      language: language ?? this.language,
      completedVideos: completedVideos ?? this.completedVideos,
      isCompleted: isCompleted ?? this.isCompleted,
      pointsEarned: pointsEarned ?? this.pointsEarned,
      xpEarned: xpEarned ?? this.xpEarned,
      completedAt: completedAt ?? this.completedAt,
      lastUpdated: lastUpdated ?? this.lastUpdated,
    );
  }
}

/// User Progress Summary
class UserProgressSummary {
  final Map<String, ModuleTypeProgress> modules;
  final OverallProgress overall;
  final UserStats user;

  UserProgressSummary({
    required this.modules,
    required this.overall,
    required this.user,
  });

  factory UserProgressSummary.fromJson(Map<String, dynamic> json) {
    final progress = json['progress'] as Map<String, dynamic>;
    final user = json['user'] as Map<String, dynamic>;

    return UserProgressSummary(
      modules: {
        'ndma': ModuleTypeProgress.fromJson(progress['ndma'] as Map<String, dynamic>),
        'ndrf': ModuleTypeProgress.fromJson(progress['ndrf'] as Map<String, dynamic>),
        'hearing_impaired': ModuleTypeProgress.fromJson(
            progress['hearing_impaired'] as Map<String, dynamic>),
      },
      overall: OverallProgress.fromJson(progress['overall'] as Map<String, dynamic>),
      user: UserStats.fromJson(user),
    );
  }
}

class ModuleTypeProgress {
  final int completed;
  final int total;
  final int percentage;

  ModuleTypeProgress({
    required this.completed,
    required this.total,
    required this.percentage,
  });

  factory ModuleTypeProgress.fromJson(Map<String, dynamic> json) {
    return ModuleTypeProgress(
      completed: (json['completed'] ?? 0) is int
          ? json['completed'] as int
          : int.tryParse((json['completed'] ?? 0).toString()) ?? 0,
      total: (json['total'] ?? 0) is int
          ? json['total'] as int
          : int.tryParse((json['total'] ?? 0).toString()) ?? 0,
      percentage: (json['percentage'] ?? 0) is int
          ? json['percentage'] as int
          : int.tryParse((json['percentage'] ?? 0).toString()) ?? 0,
    );
  }
}

class OverallProgress {
  final int completed;
  final int total;
  final int percentage;

  OverallProgress({
    required this.completed,
    required this.total,
    required this.percentage,
  });

  factory OverallProgress.fromJson(Map<String, dynamic> json) {
    return OverallProgress(
      completed: (json['completed'] ?? 0) is int
          ? json['completed'] as int
          : int.tryParse((json['completed'] ?? 0).toString()) ?? 0,
      total: (json['total'] ?? 0) is int
          ? json['total'] as int
          : int.tryParse((json['total'] ?? 0).toString()) ?? 0,
      percentage: (json['percentage'] ?? 0) is int
          ? json['percentage'] as int
          : int.tryParse((json['percentage'] ?? 0).toString()) ?? 0,
    );
  }
}

class UserStats {
  final int points;
  final int xp;
  final int totalXP;
  final int level;

  UserStats({
    required this.points,
    required this.xp,
    required this.totalXP,
    required this.level,
  });

  factory UserStats.fromJson(Map<String, dynamic> json) {
    return UserStats(
      points: (json['points'] ?? 0) is int
          ? json['points'] as int
          : int.tryParse((json['points'] ?? 0).toString()) ?? 0,
      xp: (json['xp'] ?? 0) is int
          ? json['xp'] as int
          : int.tryParse((json['xp'] ?? 0).toString()) ?? 0,
      totalXP: (json['totalXP'] ?? 0) is int
          ? json['totalXP'] as int
          : int.tryParse((json['totalXP'] ?? 0).toString()) ?? 0,
      level: (json['level'] ?? 1) is int
          ? json['level'] as int
          : int.tryParse((json['level'] ?? 1).toString()) ?? 1,
    );
  }
}

