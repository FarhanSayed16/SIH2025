/// Module Adapter
/// Converts between LearningModule (legacy) and ModuleModel (current)
/// This allows gradual migration from old module structure to new one

import 'package:flutter/material.dart';
import 'module_model.dart';
import '../../../models/module_models.dart' as legacy;

class ModuleAdapter {
  /// Convert legacy LearningModule to current ModuleModel
  static ModuleModel fromLearningModule(legacy.LearningModule learningModule) {
    // Convert VideoLesson list to ModuleLesson with sections
    final lessons = learningModule.videos.map((video) {
      return ModuleLesson(
        title: video.title,
        order: learningModule.videos.indexOf(video),
        sections: [
          ModuleSection(
            type: 'video',
            order: 0,
            content: null,
            metadata: ModuleSectionMetadata(
              url: video.url,
              duration: 300, // Default 5 minutes
            ),
          ),
        ],
      );
    }).toList();

    // Convert videos to ModuleVideo list
    final moduleVideos = learningModule.videos.map((v) {
      return ModuleVideo(
        url: v.url,
        title: v.title,
        duration: 300, // Default 5 minutes
      );
    }).toList();

    final content = ModuleContent(
      lessons: lessons,
      videos: moduleVideos,
      images: [],
      text: learningModule.description,
    );

    // Map difficulty/level
    String difficulty = 'beginner';
    if (learningModule.level.toLowerCase().contains('intermediate')) {
      difficulty = 'intermediate';
    } else if (learningModule.level.toLowerCase().contains('advanced') ||
               learningModule.level.toLowerCase().contains('expert')) {
      difficulty = 'advanced';
    }

    return ModuleModel(
      id: learningModule.id,
      title: learningModule.title,
      description: learningModule.description,
      type: learningModule.id, // Use id as type for now
      category: 'safety', // Default category
      difficulty: difficulty,
      gradeLevel: ['all'], // Default to all grades
      tags: learningModule.tags,
      version: '1.0.0',
      content: content,
      quiz: learningModule.quizJsonPath.isNotEmpty
          ? ModuleQuiz(
              questions: [], // Will be loaded from JSON
            )
          : null,
      badges: learningModule.isQuizPassed ? [learningModule.id] : [],
      points: learningModule.points,
      estimatedTime: _parseDuration(learningModule.duration),
      order: 0,
      isActive: true,
      stats: null,
      createdAt: null,
      updatedAt: null,
    );
  }

  /// Convert current ModuleModel to legacy LearningModule (if needed)
  static legacy.LearningModule toLearningModule(ModuleModel moduleModel) {
    // Convert ModuleLesson list to VideoLesson list
    // First try to get from lessons, then from videos
    List<legacy.VideoLesson> videos = [];
    
    if (moduleModel.content.lessons != null && moduleModel.content.lessons!.isNotEmpty) {
      videos = moduleModel.content.lessons!.map((lesson) {
        // Find video section
        final videoSection = lesson.sections.firstWhere(
          (s) => s.type == 'video' && s.metadata?.url != null,
          orElse: () => lesson.sections.first,
        );
        return legacy.VideoLesson(
          title: lesson.title,
          url: videoSection.metadata?.url ?? '',
          size: '0 MB', // Size not available in ModuleModel
          isCompleted: false, // Not tracked in ModuleModel
        );
      }).toList();
    } else if (moduleModel.content.videos != null && moduleModel.content.videos!.isNotEmpty) {
      videos = moduleModel.content.videos!.map((v) {
        return legacy.VideoLesson(
          title: v.title ?? 'Video',
          url: v.url,
          size: '0 MB',
          isCompleted: false,
        );
      }).toList();
    }

    // Map difficulty to level
    String level = 'Beginner';
    if (moduleModel.difficulty == 'intermediate') {
      level = 'Intermediate';
    } else if (moduleModel.difficulty == 'advanced') {
      level = 'Advanced';
    }

    // Get quiz path - not available in ModuleQuiz, use empty
    String quizPath = '';

    return legacy.LearningModule(
      id: moduleModel.id,
      title: moduleModel.title,
      description: moduleModel.description ?? '',
      level: level,
      duration: '${moduleModel.estimatedTime} min',
      points: moduleModel.points,
      iconData: Icons.school, // Default icon
      color: Colors.orangeAccent, // Default color
      videos: videos,
      quizJsonPath: quizPath,
      isQuizPassed: moduleModel.badges.isNotEmpty,
      tags: moduleModel.tags,
      geographicRelevance: [], // Not available in ModuleModel
    );
  }

  /// Parse duration string like "15 min" to minutes
  static int _parseDuration(String duration) {
    try {
      final match = RegExp(r'(\d+)').firstMatch(duration);
      if (match != null) {
        return int.parse(match.group(1)!);
      }
    } catch (e) {
      // Ignore parse errors
    }
    return 15; // Default 15 minutes
  }
}

