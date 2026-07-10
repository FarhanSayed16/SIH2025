/// Phase 3.3.1: Preparedness Score Models

/// Score breakdown component
class ScoreComponent {
  final int score; // 0-100
  final int weight; // Percentage weight (40, 25, 20, 10, 5)
  final int max; // Maximum score (always 100)

  ScoreComponent({
    required this.score,
    required this.weight,
    this.max = 100,
  });

  factory ScoreComponent.fromJson(Map<String, dynamic> json) {
    return ScoreComponent(
      score: (json['score'] ?? 0) is int
          ? json['score'] as int
          : int.tryParse((json['score'] ?? 0).toString()) ?? 0,
      weight: (json['weight'] ?? 0) is int
          ? json['weight'] as int
          : int.tryParse((json['weight'] ?? 0).toString()) ?? 0,
      max: (json['max'] ?? 100) is int
          ? json['max'] as int
          : int.tryParse((json['max'] ?? 100).toString()) ?? 100,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'score': score,
      'weight': weight,
      'max': max,
    };
  }
}

/// Preparedness Score with breakdown
class PreparednessScore {
  final String? userId;
  final int score; // Total score (0-100)
  final ScoreBreakdown breakdown;
  final DateTime? lastUpdated;

  PreparednessScore({
    this.userId,
    required this.score,
    required this.breakdown,
    this.lastUpdated,
  });

  factory PreparednessScore.fromJson(Map<String, dynamic> json) {
    return PreparednessScore(
      userId: json['userId']?.toString(),
      score: (json['score'] ?? 0) is int
          ? json['score'] as int
          : int.tryParse((json['score'] ?? 0).toString()) ?? 0,
      breakdown: ScoreBreakdown.fromJson(
        (json['breakdown'] ?? <String, dynamic>{}) as Map<String, dynamic>,
      ),
      lastUpdated: json['lastUpdated'] != null
          ? DateTime.parse(json['lastUpdated'].toString())
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (userId != null) 'userId': userId,
      'score': score,
      'breakdown': breakdown.toJson(),
      if (lastUpdated != null) 'lastUpdated': lastUpdated!.toIso8601String(),
    };
  }
}

/// Score breakdown by component
class ScoreBreakdown {
  final ScoreComponent module; // 40% weight
  final ScoreComponent game; // 25% weight
  final ScoreComponent quiz; // 20% weight
  final ScoreComponent drill; // 10% weight
  final ScoreComponent streak; // 5% weight

  ScoreBreakdown({
    required this.module,
    required this.game,
    required this.quiz,
    required this.drill,
    required this.streak,
  });

  factory ScoreBreakdown.fromJson(Map<String, dynamic> json) {
    return ScoreBreakdown(
      module: ScoreComponent.fromJson(
        (json['module'] ?? <String, dynamic>{}) as Map<String, dynamic>,
      ),
      game: ScoreComponent.fromJson(
        (json['game'] ?? <String, dynamic>{}) as Map<String, dynamic>,
      ),
      quiz: ScoreComponent.fromJson(
        (json['quiz'] ?? <String, dynamic>{}) as Map<String, dynamic>,
      ),
      drill: ScoreComponent.fromJson(
        (json['drill'] ?? <String, dynamic>{}) as Map<String, dynamic>,
      ),
      streak: ScoreComponent.fromJson(
        (json['streak'] ?? <String, dynamic>{}) as Map<String, dynamic>,
      ),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'module': module.toJson(),
      'game': game.toJson(),
      'quiz': quiz.toJson(),
      'drill': drill.toJson(),
      'streak': streak.toJson(),
    };
  }
}

/// Score history entry
class ScoreHistoryEntry {
  final int score;
  final DateTime date;

  ScoreHistoryEntry({
    required this.score,
    required this.date,
  });

  factory ScoreHistoryEntry.fromJson(Map<String, dynamic> json) {
    return ScoreHistoryEntry(
      score: (json['score'] ?? 0) is int
          ? json['score'] as int
          : int.tryParse((json['score'] ?? 0).toString()) ?? 0,
      date: json['date'] != null
          ? DateTime.parse(json['date'].toString())
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'score': score,
      'date': date.toIso8601String(),
    };
  }
}

/// Score history response
class ScoreHistory {
  final String? userId;
  final List<ScoreHistoryEntry> entries;
  final int count;

  ScoreHistory({
    this.userId,
    required this.entries,
    required this.count,
  });

  factory ScoreHistory.fromJson(Map<String, dynamic> json) {
    final historyList = json['history'] as List<dynamic>? ?? [];
    return ScoreHistory(
      userId: json['userId']?.toString(),
      entries: historyList
          .map((entry) => ScoreHistoryEntry.fromJson(entry as Map<String, dynamic>))
          .toList(),
      count: (json['count'] ?? 0) is int
          ? json['count'] as int
          : int.tryParse((json['count'] ?? 0).toString()) ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (userId != null) 'userId': userId,
      'history': entries.map((e) => e.toJson()).toList(),
      'count': count,
    };
  }
}

