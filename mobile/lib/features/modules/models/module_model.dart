/// Phase 3.1.1: Enhanced Module Model
/// Represents a learning module with structured content

class ModuleModel {
  final String id;
  final String title;
  final String? description;
  final String type; // fire, earthquake, flood, etc.
  final String? category; // safety, preparedness, response, recovery, prevention
  final String difficulty; // beginner, intermediate, advanced
  final List<String> gradeLevel; // KG, 1, 2, ..., 12, all
  final List<String> tags;
  final String version;
  final ModuleContent content;
  final ModuleQuiz? quiz;
  final List<String> badges;
  final int points;
  final int estimatedTime; // in minutes
  final int order;
  final bool isActive;
  final ModuleStats? stats;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  ModuleModel({
    required this.id,
    required this.title,
    this.description,
    required this.type,
    this.category,
    required this.difficulty,
    this.gradeLevel = const ['all'],
    this.tags = const [],
    this.version = '1.0.0',
    required this.content,
    this.quiz,
    this.badges = const [],
    this.points = 100,
    this.estimatedTime = 15,
    this.order = 0,
    this.isActive = true,
    this.stats,
    this.createdAt,
    this.updatedAt,
  });

  factory ModuleModel.fromJson(Map<String, dynamic> json) {
    return ModuleModel(
      id: (json['_id']?.toString() ?? json['id']?.toString() ?? ''),
      title: (json['title'] ?? '') as String,
      description: json['description'] as String?,
      type: (json['type'] ?? 'general') as String,
      category: json['category'] as String?,
      difficulty: (json['difficulty'] ?? 'beginner') as String,
      gradeLevel: json['gradeLevel'] != null
          ? List<String>.from(json['gradeLevel'] as List)
          : ['all'],
      tags: json['tags'] != null 
          ? List<String>.from(json['tags'] as List) 
          : [],
      version: (json['version'] ?? '1.0.0') as String,
      content: ModuleContent.fromJson(
        (json['content'] ?? <String, dynamic>{}) as Map<String, dynamic>,
      ),
      quiz: json['quiz'] != null 
          ? ModuleQuiz.fromJson(json['quiz'] as Map<String, dynamic>) 
          : null,
      badges: json['badges'] != null 
          ? List<String>.from(json['badges'] as List) 
          : [],
      points: (json['points'] ?? 100) as int,
      estimatedTime: (json['estimatedTime'] ?? 15) as int,
      order: (json['order'] ?? 0) as int,
      isActive: (json['isActive'] ?? true) as bool,
      stats: json['stats'] != null 
          ? ModuleStats.fromJson(json['stats'] as Map<String, dynamic>) 
          : null,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'] as String)
          : null,
      updatedAt: json['updatedAt'] != null
          ? DateTime.parse(json['updatedAt'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'title': title,
      'description': description,
      'type': type,
      'category': category,
      'difficulty': difficulty,
      'gradeLevel': gradeLevel,
      'tags': tags,
      'version': version,
      'content': content.toJson(),
      'quiz': quiz?.toJson(),
      'badges': badges,
      'points': points,
      'estimatedTime': estimatedTime,
      'order': order,
      'isActive': isActive,
      'stats': stats?.toJson(),
      'createdAt': createdAt?.toIso8601String(),
      'updatedAt': updatedAt?.toIso8601String(),
    };
  }

  bool get isCompleted => false; // Will be set from user progress
  String get duration => '$estimatedTime min';
}

/// Phase 3.1.1: Structured Module Content
class ModuleContent {
  final List<ModuleLesson>? lessons; // Phase 3.1.1: Structured lessons
  final List<ModuleVideo>? videos; // Legacy support
  final List<ModuleImage>? images; // Legacy support
  final String? text; // Legacy support
  final List<Map<String, dynamic>>? arScenarios;

  ModuleContent({
    this.lessons,
    this.videos,
    this.images,
    this.text,
    this.arScenarios,
  });

  factory ModuleContent.fromJson(Map<String, dynamic> json) {
    return ModuleContent(
      lessons: json['lessons'] != null
          ? (json['lessons'] as List)
              .map((l) => ModuleLesson.fromJson(l as Map<String, dynamic>))
              .toList()
          : null,
      videos: json['videos'] != null
          ? (json['videos'] as List)
              .map((v) => ModuleVideo.fromJson(v as Map<String, dynamic>))
              .toList()
          : null,
      images: json['images'] != null
          ? (json['images'] as List)
              .map((i) => ModuleImage.fromJson(i as Map<String, dynamic>))
              .toList()
          : null,
      text: json['text'] as String?,
      arScenarios: json['arScenarios'] != null
          ? List<Map<String, dynamic>>.from(json['arScenarios'] as List)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'lessons': lessons?.map((l) => l.toJson()).toList(),
      'videos': videos?.map((v) => v.toJson()).toList(),
      'images': images?.map((i) => i.toJson()).toList(),
      'text': text,
      'arScenarios': arScenarios,
    };
  }
}

/// Phase 3.1.1: Module Lesson with Sections
class ModuleLesson {
  final String title;
  final int order;
  final List<ModuleSection> sections;

  ModuleLesson({
    required this.title,
    this.order = 0,
    required this.sections,
  });

  factory ModuleLesson.fromJson(Map<String, dynamic> json) {
    return ModuleLesson(
      title: (json['title'] ?? '') as String,
      order: (json['order'] ?? 0) as int,
      sections: json['sections'] != null
          ? (json['sections'] as List)
              .map((s) => ModuleSection.fromJson(s as Map<String, dynamic>))
              .toList()
          : [],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'title': title,
      'order': order,
      'sections': sections.map((s) => s.toJson()).toList(),
    };
  }
}

/// Phase 3.1.1: Module Section (text, image, video, audio, animation, interactive)
class ModuleSection {
  final String type; // text, image, video, audio, animation, interactive
  final int order;
  final dynamic content; // Flexible content based on type
  final ModuleSectionMetadata? metadata;

  ModuleSection({
    required this.type,
    this.order = 0,
    this.content,
    this.metadata,
  });

  factory ModuleSection.fromJson(Map<String, dynamic> json) {
    return ModuleSection(
      type: (json['type'] ?? 'text') as String,
      order: (json['order'] ?? 0) as int,
      content: json['content'],
      metadata: json['metadata'] != null
          ? ModuleSectionMetadata.fromJson(
              json['metadata'] as Map<String, dynamic>,
            )
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'type': type,
      'order': order,
      'content': content,
      'metadata': metadata?.toJson(),
    };
  }
}

class ModuleSectionMetadata {
  final int? duration; // for video/audio
  final String? caption; // for images
  final String? url; // for media
  final String? lottieUrl; // for animations

  ModuleSectionMetadata({
    this.duration,
    this.caption,
    this.url,
    this.lottieUrl,
  });

  factory ModuleSectionMetadata.fromJson(Map<String, dynamic> json) {
    return ModuleSectionMetadata(
      duration: json['duration'] as int?,
      caption: json['caption'] as String?,
      url: json['url'] as String?,
      lottieUrl: json['lottieUrl'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'duration': duration,
      'caption': caption,
      'url': url,
      'lottieUrl': lottieUrl,
    };
  }
}

class ModuleVideo {
  final String url;
  final String? title;
  final int? duration; // in seconds

  ModuleVideo({
    required this.url,
    this.title,
    this.duration,
  });

  factory ModuleVideo.fromJson(Map<String, dynamic> json) {
    return ModuleVideo(
      url: (json['url'] ?? '') as String,
      title: json['title'] as String?,
      duration: json['duration'] as int?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'url': url,
      'title': title,
      'duration': duration,
    };
  }
}

class ModuleImage {
  final String url;
  final String? caption;

  ModuleImage({
    required this.url,
    this.caption,
  });

  factory ModuleImage.fromJson(Map<String, dynamic> json) {
    return ModuleImage(
      url: (json['url'] ?? '') as String,
      caption: json['caption'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'url': url,
      'caption': caption,
    };
  }
}

/// Phase 3.1.1: Enhanced Module Quiz
class ModuleQuiz {
  final List<QuizQuestion> questions;
  final int passingScore;
  final int? timeLimit; // in seconds

  ModuleQuiz({
    required this.questions,
    this.passingScore = 70,
    this.timeLimit,
  });

  factory ModuleQuiz.fromJson(Map<String, dynamic> json) {
    return ModuleQuiz(
      questions: json['questions'] != null
          ? (json['questions'] as List)
              .map((q) => QuizQuestion.fromJson(q as Map<String, dynamic>))
              .toList()
          : [],
      passingScore: (json['passingScore'] ?? 70) as int,
      timeLimit: json['timeLimit'] as int?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'questions': questions.map((q) => q.toJson()).toList(),
      'passingScore': passingScore,
      'timeLimit': timeLimit,
    };
  }
}

/// Phase 3.1.1: Quiz Option (supports text, imageUrl, audioUrl)
class QuizOption {
  final String text;
  final String? imageUrl;
  final String? audioUrl;

  QuizOption({
    required this.text,
    this.imageUrl,
    this.audioUrl,
  });

  factory QuizOption.fromJson(Map<String, dynamic> json) {
    return QuizOption(
      text: (json['text'] ?? '') as String,
      imageUrl: json['imageUrl'] as String?,
      audioUrl: json['audioUrl'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'text': text,
      if (imageUrl != null) 'imageUrl': imageUrl,
      if (audioUrl != null) 'audioUrl': audioUrl,
    };
  }
}

/// Phase 3.1.1: Enhanced Quiz Question (text, image, audio, image-to-image)
class QuizQuestion {
  final String question;
  final String questionType; // text, image, audio, image-to-image
  final String? questionImage; // for image questions
  final String? questionAudio; // for audio questions
  final List<QuizOption> options; // Enhanced: supports text, imageUrl, audioUrl
  final int correctAnswer; // index of correct answer
  final int points;
  final String? explanation;
  final String? explanationImage; // for visual explanations

  QuizQuestion({
    required this.question,
    this.questionType = 'text',
    this.questionImage,
    this.questionAudio,
    required this.options,
    required this.correctAnswer,
    this.points = 10,
    this.explanation,
    this.explanationImage,
  });

  factory QuizQuestion.fromJson(Map<String, dynamic> json) {
    // Handle options - can be List<String> or List<Map> with text/imageUrl/audioUrl
    List<QuizOption> options = [];
    if (json['options'] != null) {
      final optionsData = json['options'] as List;
      options = optionsData.map((opt) {
        if (opt is String) {
          return QuizOption(text: opt);
        } else if (opt is Map<String, dynamic>) {
          return QuizOption.fromJson(opt);
        }
        return QuizOption(text: opt.toString());
      }).toList();
    }

    return QuizQuestion(
      question: (json['question'] ?? '') as String,
      questionType: (json['questionType'] ?? 'text') as String,
      questionImage: json['questionImage'] as String?,
      questionAudio: json['questionAudio'] as String?,
      options: options,
      correctAnswer: (json['correctAnswer'] ?? 0) as int,
      points: (json['points'] ?? 10) as int,
      explanation: json['explanation'] as String?,
      explanationImage: json['explanationImage'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'question': question,
      'questionType': questionType,
      'questionImage': questionImage,
      'questionAudio': questionAudio,
      'options': options.map((opt) => opt.toJson()).toList(),
      'correctAnswer': correctAnswer,
      'points': points,
      'explanation': explanation,
      'explanationImage': explanationImage,
    };
  }
}

/// Phase 3.1.1: Module Statistics
class ModuleStats {
  final int totalViews;
  final int totalCompletions;
  final int averageScore;

  ModuleStats({
    this.totalViews = 0,
    this.totalCompletions = 0,
    this.averageScore = 0,
  });

  factory ModuleStats.fromJson(Map<String, dynamic> json) {
    return ModuleStats(
      totalViews: (json['totalViews'] ?? 0) as int,
      totalCompletions: (json['totalCompletions'] ?? 0) as int,
      averageScore: (json['averageScore'] ?? 0) as int,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'totalViews': totalViews,
      'totalCompletions': totalCompletions,
      'averageScore': averageScore,
    };
  }
}

