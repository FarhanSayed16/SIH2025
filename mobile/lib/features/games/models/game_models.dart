/// Phase 3.2: Game Models

class GameItem {
  final String id;
  final String name;
  final String category;
  final bool isCorrect;
  final String? description;
  final String? imageUrl;
  final int points;
  final String? feedbackMessage;

  GameItem({
    required this.id,
    required this.name,
    required this.category,
    required this.isCorrect,
    this.description,
    this.imageUrl,
    this.points = 10,
    this.feedbackMessage,
  });

  factory GameItem.fromJson(Map<String, dynamic> json) {
    return GameItem(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      name: (json['name'] ?? '').toString(),
      category: (json['category'] ?? '').toString(),
      isCorrect: json['isCorrect'] == true || json['isCorrect'] == 'true',
      description: json['description']?.toString(),
      imageUrl: json['imageUrl']?.toString(),
      points: (json['points'] ?? 10) is int ? json['points'] as int : int.tryParse(json['points'].toString()) ?? 10,
      feedbackMessage: json['feedbackMessage']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'category': category,
      'isCorrect': isCorrect,
      'description': description,
      'imageUrl': imageUrl,
      'points': points,
      'feedbackMessage': feedbackMessage,
    };
  }
}

class GameScore {
  final String? id;
  final String? userId;
  final String gameType;
  final int score;
  final int maxScore;
  final int level;
  final String difficulty;
  final bool isGroupMode;
  final String? groupActivityId;
  final int itemsCorrect;
  final int itemsIncorrect;
  final int? timeTaken;
  final int xpEarned;
  final DateTime completedAt;

  GameScore({
    this.id,
    this.userId,
    required this.gameType,
    required this.score,
    this.maxScore = 0,
    this.level = 1,
    this.difficulty = 'easy',
    this.isGroupMode = false,
    this.groupActivityId,
    this.itemsCorrect = 0,
    this.itemsIncorrect = 0,
    this.timeTaken,
    this.xpEarned = 0,
    required this.completedAt,
  });

  factory GameScore.fromJson(Map<String, dynamic> json) {
    return GameScore(
      id: json['_id']?.toString() ?? json['id']?.toString(),
      userId: json['userId'] is Map ? (json['userId']['_id'] ?? json['userId']['id'])?.toString() : json['userId']?.toString(),
      gameType: (json['gameType'] ?? '').toString(),
      score: (json['score'] ?? 0) is int ? json['score'] as int : int.tryParse((json['score'] ?? 0).toString()) ?? 0,
      maxScore: (json['maxScore'] ?? 0) is int ? json['maxScore'] as int : int.tryParse((json['maxScore'] ?? 0).toString()) ?? 0,
      level: (json['level'] ?? 1) is int ? json['level'] as int : int.tryParse((json['level'] ?? 1).toString()) ?? 1,
      difficulty: (json['difficulty'] ?? 'easy').toString(),
      isGroupMode: json['isGroupMode'] == true || json['isGroupMode'] == 'true',
      groupActivityId: json['groupActivityId']?.toString(),
      itemsCorrect: (json['itemsCorrect'] ?? 0) is int ? json['itemsCorrect'] as int : int.tryParse((json['itemsCorrect'] ?? 0).toString()) ?? 0,
      itemsIncorrect: (json['itemsIncorrect'] ?? 0) is int ? json['itemsIncorrect'] as int : int.tryParse((json['itemsIncorrect'] ?? 0).toString()) ?? 0,
      timeTaken: json['timeTaken'] != null ? (json['timeTaken'] is int ? json['timeTaken'] as int : int.tryParse(json['timeTaken'].toString())) : null,
      xpEarned: (json['xpEarned'] ?? 0) is int 
          ? json['xpEarned'] as int 
          : (json['xpEarned'] != null 
              ? int.tryParse(json['xpEarned'].toString()) ?? 0 
              : 0),
      completedAt: json['completedAt'] != null
          ? DateTime.parse(json['completedAt'].toString())
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (userId != null) 'userId': userId,
      'gameType': gameType,
      'score': score,
      'maxScore': maxScore,
      'level': level,
      'difficulty': difficulty,
      'isGroupMode': isGroupMode,
      if (groupActivityId != null) 'groupActivityId': groupActivityId,
      'itemsCorrect': itemsCorrect,
      'itemsIncorrect': itemsIncorrect,
      if (timeTaken != null) 'timeTaken': timeTaken,
    };
  }
}

/// Phase 3.2.2: Hazard Item Model for Hazard Hunter
class HazardItem {
  final String id;
  final String name;
  final String type; // fire, electrical, structural, exit, chemical, other
  final String? description;
  final String imageUrl;
  final HazardLocation location;
  final int level;
  final String difficulty; // easy, medium, hard
  final int points;
  final int penaltyPoints;
  final List<String> gradeLevel;

  HazardItem({
    required this.id,
    required this.name,
    required this.type,
    this.description,
    required this.imageUrl,
    required this.location,
    this.level = 1,
    this.difficulty = 'easy',
    this.points = 10,
    this.penaltyPoints = 5,
    this.gradeLevel = const ['all'],
  });

  factory HazardItem.fromJson(Map<String, dynamic> json) {
    return HazardItem(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      name: (json['name'] ?? '').toString(),
      type: (json['type'] ?? 'other').toString(),
      description: json['description']?.toString(),
      imageUrl: (json['imageUrl'] ?? '').toString(),
      location: HazardLocation.fromJson(
        (json['location'] ?? <String, dynamic>{}) as Map<String, dynamic>,
      ),
      level: (json['level'] ?? 1) is int 
          ? json['level'] as int 
          : int.tryParse((json['level'] ?? 1).toString()) ?? 1,
      difficulty: (json['difficulty'] ?? 'easy').toString(),
      points: (json['points'] ?? 10) is int 
          ? json['points'] as int 
          : int.tryParse((json['points'] ?? 10).toString()) ?? 10,
      penaltyPoints: (json['penaltyPoints'] ?? 5) is int 
          ? json['penaltyPoints'] as int 
          : int.tryParse((json['penaltyPoints'] ?? 5).toString()) ?? 5,
      gradeLevel: json['gradeLevel'] != null
          ? List<String>.from(json['gradeLevel'] as List)
          : ['all'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'type': type,
      'description': description,
      'imageUrl': imageUrl,
      'location': location.toJson(),
      'level': level,
      'difficulty': difficulty,
      'points': points,
      'penaltyPoints': penaltyPoints,
      'gradeLevel': gradeLevel,
    };
  }
}

/// Hazard Location in image
class HazardLocation {
  final double x; // Percentage from left (0-100)
  final double y; // Percentage from top (0-100)
  final double width; // Percentage width
  final double height; // Percentage height

  HazardLocation({
    required this.x,
    required this.y,
    this.width = 10,
    this.height = 10,
  });

  factory HazardLocation.fromJson(Map<String, dynamic> json) {
    return HazardLocation(
      x: (json['x'] ?? 0) is double 
          ? json['x'] as double 
          : (json['x'] is int ? (json['x'] as int).toDouble() : 0.0),
      y: (json['y'] ?? 0) is double 
          ? json['y'] as double 
          : (json['y'] is int ? (json['y'] as int).toDouble() : 0.0),
      width: (json['width'] ?? 10) is double 
          ? json['width'] as double 
          : (json['width'] is int ? (json['width'] as int).toDouble() : 10.0),
      height: (json['height'] ?? 10) is double 
          ? json['height'] as double 
          : (json['height'] is int ? (json['height'] as int).toDouble() : 10.0),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'x': x,
      'y': y,
      'width': width,
      'height': height,
    };
  }
}

/// Game Response Model for AI-generated game content (Punjab Safety Game, School Safety Quiz)
/// Used for parsing responses from Gemini AI for interactive safety games
class GameResponse {
  final String type;
  final String? scenarioTitle;
  final String? scenarioDescription;
  final String? question;
  final List<String>? options;
  final String? evaluation;
  final int? score;
  final String? explanation;
  final String? sourceSummary;
  
  // Next Turn Fields
  final String? nextQuestion;
  final List<String>? nextOptions;
  
  final int? round;
  final int? finalScore;
  final String? preparednessSummary;
  final String? recommendedActions;
  final List<String>? finalSources;
  final String? performance; // For Quiz games

  GameResponse({
    required this.type,
    this.scenarioTitle,
    this.scenarioDescription,
    this.question,
    this.options,
    this.evaluation,
    this.score,
    this.explanation,
    this.sourceSummary,
    this.nextQuestion,
    this.nextOptions,
    this.round,
    this.finalScore,
    this.preparednessSummary,
    this.recommendedActions,
    this.finalSources,
    this.performance,
  });

  factory GameResponse.fromJson(Map<String, dynamic> json) {
    
    // Helper to parse options which might be a List or a Map in different prompts
    List<String>? parseOptions(dynamic data) {
      if (data == null) return null;
      if (data is List) return List<String>.from(data);
      if (data is Map) return data.values.map((e) => e.toString()).toList();
      return null;
    }

    // LOGIC TO HANDLE NESTED "next_question" OBJECT FROM QUIZ PROMPT
    String? parsedNextQuestion = json['next_question'] is String ? json['next_question'] as String : null;
    List<String>? parsedNextOptions = parseOptions(json['next_options']);

    // If next_question is an object (Quiz style), flatten it
    if (json['next_question'] is Map) {
      final nextObj = json['next_question'];
      parsedNextQuestion = nextObj['question_text'] as String?;
      // Sometimes quiz prompt puts context in region_context, we can prepend it if needed
      if (nextObj['region_context'] != null) {
        parsedNextQuestion = "${nextObj['region_context']}\n\n$parsedNextQuestion";
      }
      parsedNextOptions = parseOptions(nextObj['options']);
    }

    return GameResponse(
      type: (json['type'] ?? 'unknown') as String,
      scenarioTitle: (json['scenario_title'] ?? json['region_context']) as String?, // Fallback for quiz
      scenarioDescription: (json['scenario_description'] ?? json['question_text']) as String?, // Fallback
      question: (json['question'] ?? json['question_text']) as String?,
      options: parseOptions(json['options']),
      evaluation: json['evaluation'] as String?,
      score: json['score'] as int?,
      explanation: json['explanation'] as String?,
      sourceSummary: json['source_summary'] as String?,
      
      // Normalized Next fields
      nextQuestion: parsedNextQuestion,
      nextOptions: parsedNextOptions,
      
      round: (json['round'] ?? (json['next_question'] is Map ? json['next_question']['question_number'] : null)) as int?,
      finalScore: json['final_score'] as int?,
      preparednessSummary: (json['preparedness_summary'] ?? json['summary']) as String?,
      recommendedActions: json['recommended_actions'] as String?,
      finalSources: json['final_sources'] != null
          ? List<String>.from(json['final_sources'] as List)
          : null,
      performance: json['performance'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'type': type,
      if (scenarioTitle != null) 'scenario_title': scenarioTitle,
      if (scenarioDescription != null) 'scenario_description': scenarioDescription,
      if (question != null) 'question': question,
      if (options != null) 'options': options,
      if (evaluation != null) 'evaluation': evaluation,
      if (score != null) 'score': score,
      if (explanation != null) 'explanation': explanation,
      if (sourceSummary != null) 'source_summary': sourceSummary,
      if (nextQuestion != null) 'next_question': nextQuestion,
      if (nextOptions != null) 'next_options': nextOptions,
      if (round != null) 'round': round,
      if (finalScore != null) 'final_score': finalScore,
      if (preparednessSummary != null) 'preparedness_summary': preparednessSummary,
      if (recommendedActions != null) 'recommended_actions': recommendedActions,
      if (finalSources != null) 'final_sources': finalSources,
      if (performance != null) 'performance': performance,
    };
  }
}

