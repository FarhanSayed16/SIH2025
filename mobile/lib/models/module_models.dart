import 'package:flutter/material.dart';

class VideoLesson {
  final String title;
  final String url;
  final String size;
  bool isCompleted;
  /// Fraction 0.0–1.0 for NDMA network resume (B9 / D06). Null = never started.
  double? lastPosition;

  VideoLesson({
    required this.title,
    required this.url,
    required this.size,
    this.isCompleted = false,
    this.lastPosition,
  });

  bool get hasResumePosition =>
      !isCompleted &&
      lastPosition != null &&
      lastPosition! >= 0.02 &&
      lastPosition! < 0.95;
}

class LearningModule {
  final String id;
  final String title;
  final String description; // New: For the card subtitle
  final String level;       // New: e.g., "Beginner"
  final String duration;    // New: e.g., "15 min"
  final int points;         // New: e.g., 100
  final IconData iconData;  // New: Specific icon for the module
  final Color color;        // New: Theme color for the icon background
  final List<VideoLesson> videos;
  final String quizJsonPath;
  bool isQuizPassed;
  final List<String> tags;      // New: For relevance scoring
  final List<String> geographicRelevance; // New: List of states/regions

  LearningModule({
    required this.id,
    required this.title,
    this.description = 'Learn the fundamentals of safety and response procedures.',
    this.level = 'Beginner',
    this.duration = '15 min',
    this.points = 100,
    this.iconData = Icons.school,
    this.color = Colors.orangeAccent,
    required this.videos,
    required this.quizJsonPath,
    this.isQuizPassed = false,
    this.tags = const [],
    this.geographicRelevance = const [],
  });

  bool get isComingSoon => videos.isEmpty;

  double get progress {
    if (videos.isEmpty) return 0.0;
    final completed = videos.where((v) => v.isCompleted).length;
    return completed / videos.length;
  }

  /// Concise two-line catalogue summary (not full safety instructions).
  String get catalogueSummary {
    final cleaned = description
        .replaceAll(RegExp(r'[•\t]+'), ' ')
        .replaceAll(RegExp(r'\s*\n\s*'), ' ')
        .replaceAll(RegExp(r'\s{2,}'), ' ')
        .trim();
    if (cleaned.isEmpty) {
      return 'Topic-based safety guidance from NDMA source materials.';
    }
    if (cleaned.length <= 140) return cleaned;
    return '${cleaned.substring(0, 137).trimRight()}…';
  }

  String get levelSentenceCase {
    if (level.isEmpty) return level;
    return '${level[0].toUpperCase()}${level.substring(1).toLowerCase()}';
  }

  String get progressStatusLabel {
    if (isComingSoon) return 'Unavailable';
    if (progress <= 0) return 'Not started';
    if (progress >= 1) return 'Videos completed';
    return 'In progress';
  }

  String get primaryActionLabel {
    if (isComingSoon) return 'Unavailable';
    if (progress <= 0) return 'Start learning';
    if (progress >= 1) return 'Review';
    return 'Continue';
  }
}