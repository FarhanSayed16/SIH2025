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
  final String? performance; // New field for Quiz

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
}