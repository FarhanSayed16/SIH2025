import 'package:flutter/material.dart';

class VideoLesson {
  final String title;
  final String url;
  final String size;
  bool isCompleted;

  VideoLesson({
    required this.title,
    required this.url,
    required this.size,
    this.isCompleted = false,
  });
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
    int completed = videos.where((v) => v.isCompleted).length;
    return completed / videos.length;
  }
}