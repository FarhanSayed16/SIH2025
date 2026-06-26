/// Phase 3.3.2: Adaptive Scoring Models
/// Models for per-student tracking and shared XP distribution

class StudentScore {
  final String studentId;
  final String name;
  final String? email;
  final String? grade;
  final StudentScoreStats stats;
  final List<Map<String, dynamic>> recentGames;
  final List<Map<String, dynamic>> recentQuizzes;

  StudentScore({
    required this.studentId,
    required this.name,
    this.email,
    this.grade,
    required this.stats,
    required this.recentGames,
    required this.recentQuizzes,
  });

  factory StudentScore.fromJson(Map<String, dynamic> json) {
    return StudentScore(
      studentId: json['studentId']?.toString() ?? '',
      name: json['name']?.toString() ?? 'Unknown',
      email: json['email']?.toString(),
      grade: json['grade']?.toString(),
      stats: StudentScoreStats.fromJson(
        json['stats'] as Map<String, dynamic>? ?? {},
      ),
      recentGames: (json['recentGames'] as List<dynamic>?)
              ?.map((e) => e as Map<String, dynamic>)
              .toList() ??
          [],
      recentQuizzes: (json['recentQuizzes'] as List<dynamic>?)
              ?.map((e) => e as Map<String, dynamic>)
              .toList() ??
          [],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'studentId': studentId,
      'name': name,
      if (email != null) 'email': email,
      if (grade != null) 'grade': grade,
      'stats': stats.toJson(),
      'recentGames': recentGames,
      'recentQuizzes': recentQuizzes,
    };
  }
}

class StudentScoreStats {
  final int totalGames;
  final int totalGameScore;
  final int totalGameXP;
  final int averageQuizScore;
  final int totalQuizzes;

  StudentScoreStats({
    required this.totalGames,
    required this.totalGameScore,
    required this.totalGameXP,
    required this.averageQuizScore,
    required this.totalQuizzes,
  });

  factory StudentScoreStats.fromJson(Map<String, dynamic> json) {
    return StudentScoreStats(
      totalGames: (json['totalGames'] as num?)?.toInt() ?? 0,
      totalGameScore: (json['totalGameScore'] as num?)?.toInt() ?? 0,
      totalGameXP: (json['totalGameXP'] as num?)?.toInt() ?? 0,
      averageQuizScore: (json['averageQuizScore'] as num?)?.toInt() ?? 0,
      totalQuizzes: (json['totalQuizzes'] as num?)?.toInt() ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'totalGames': totalGames,
      'totalGameScore': totalGameScore,
      'totalGameXP': totalGameXP,
      'averageQuizScore': averageQuizScore,
      'totalQuizzes': totalQuizzes,
    };
  }
}

class SharedXPDistribution {
  final String activityId;
  final String activityType;
  final String activityName;
  final List<XPParticipant> participants;
  final int totalParticipants;
  final double averageScore;
  final DateTime distributedAt;
  final String status;

  SharedXPDistribution({
    required this.activityId,
    required this.activityType,
    required this.activityName,
    required this.participants,
    required this.totalParticipants,
    required this.averageScore,
    required this.distributedAt,
    required this.status,
  });

  factory SharedXPDistribution.fromJson(Map<String, dynamic> json) {
    return SharedXPDistribution(
      activityId: json['activityId']?.toString() ?? '',
      activityType: json['activityType']?.toString() ?? 'module',
      activityName: json['activityName']?.toString() ?? 'Unknown',
      participants: (json['participants'] as List<dynamic>?)
              ?.map((e) => XPParticipant.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      totalParticipants: (json['totalParticipants'] as num?)?.toInt() ?? 0,
      averageScore: (json['averageScore'] as num?)?.toDouble() ?? 0.0,
      distributedAt: json['distributedAt'] != null
          ? DateTime.parse(json['distributedAt'].toString())
          : DateTime.now(),
      status: json['status']?.toString() ?? 'completed',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'activityId': activityId,
      'activityType': activityType,
      'activityName': activityName,
      'participants': participants.map((p) => p.toJson()).toList(),
      'totalParticipants': totalParticipants,
      'averageScore': averageScore,
      'distributedAt': distributedAt.toIso8601String(),
      'status': status,
    };
  }
}

class XPParticipant {
  final String studentId;
  final String name;
  final double score;
  final bool completed;

  XPParticipant({
    required this.studentId,
    required this.name,
    required this.score,
    required this.completed,
  });

  factory XPParticipant.fromJson(Map<String, dynamic> json) {
    return XPParticipant(
      studentId: json['studentId']?.toString() ?? '',
      name: json['name']?.toString() ?? 'Unknown',
      score: (json['score'] as num?)?.toDouble() ?? 0.0,
      completed: json['completed'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'studentId': studentId,
      'name': name,
      'score': score,
      'completed': completed,
    };
  }
}

class AggregatedStudentScores {
  final String studentId;
  final String studentName;
  final IndividualActivities individualActivities;
  final GroupActivities groupActivities;
  final ScoreTotals totals;

  AggregatedStudentScores({
    required this.studentId,
    required this.studentName,
    required this.individualActivities,
    required this.groupActivities,
    required this.totals,
  });

  factory AggregatedStudentScores.fromJson(Map<String, dynamic> json) {
    return AggregatedStudentScores(
      studentId: json['studentId']?.toString() ?? '',
      studentName: json['studentName']?.toString() ?? 'Unknown',
      individualActivities: IndividualActivities.fromJson(
        json['individualActivities'] as Map<String, dynamic>? ?? {},
      ),
      groupActivities: GroupActivities.fromJson(
        json['groupActivities'] as Map<String, dynamic>? ?? {},
      ),
      totals: ScoreTotals.fromJson(
        json['totals'] as Map<String, dynamic>? ?? {},
      ),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'studentId': studentId,
      'studentName': studentName,
      'individualActivities': individualActivities.toJson(),
      'groupActivities': groupActivities.toJson(),
      'totals': totals.toJson(),
    };
  }
}

class IndividualActivities {
  final ActivityStats games;
  final QuizStats quizzes;

  IndividualActivities({
    required this.games,
    required this.quizzes,
  });

  factory IndividualActivities.fromJson(Map<String, dynamic> json) {
    return IndividualActivities(
      games: ActivityStats.fromJson(
        json['games'] as Map<String, dynamic>? ?? {},
      ),
      quizzes: QuizStats.fromJson(
        json['quizzes'] as Map<String, dynamic>? ?? {},
      ),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'games': games.toJson(),
      'quizzes': quizzes.toJson(),
    };
  }
}

class GroupActivities {
  final ActivityStats games;

  GroupActivities({
    required this.games,
  });

  factory GroupActivities.fromJson(Map<String, dynamic> json) {
    return GroupActivities(
      games: ActivityStats.fromJson(
        json['games'] as Map<String, dynamic>? ?? {},
      ),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'games': games.toJson(),
    };
  }
}

class ActivityStats {
  final int total;
  final int totalScore;
  final int totalXP;
  final double averageScore;

  ActivityStats({
    required this.total,
    required this.totalScore,
    required this.totalXP,
    required this.averageScore,
  });

  factory ActivityStats.fromJson(Map<String, dynamic> json) {
    return ActivityStats(
      total: (json['total'] as num?)?.toInt() ?? 0,
      totalScore: (json['totalScore'] as num?)?.toInt() ?? 0,
      totalXP: (json['totalXP'] as num?)?.toInt() ?? 0,
      averageScore: (json['averageScore'] as num?)?.toDouble() ?? 0.0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'total': total,
      'totalScore': totalScore,
      'totalXP': totalXP,
      'averageScore': averageScore,
    };
  }
}

class QuizStats {
  final int total;
  final double averageScore;
  final int passedCount;

  QuizStats({
    required this.total,
    required this.averageScore,
    required this.passedCount,
  });

  factory QuizStats.fromJson(Map<String, dynamic> json) {
    return QuizStats(
      total: (json['total'] as num?)?.toInt() ?? 0,
      averageScore: (json['averageScore'] as num?)?.toDouble() ?? 0.0,
      passedCount: (json['passedCount'] as num?)?.toInt() ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'total': total,
      'averageScore': averageScore,
      'passedCount': passedCount,
    };
  }
}

class ScoreTotals {
  final int totalXP;
  final int totalGames;
  final int totalQuizzes;
  final double overallAverage;

  ScoreTotals({
    required this.totalXP,
    required this.totalGames,
    required this.totalQuizzes,
    required this.overallAverage,
  });

  factory ScoreTotals.fromJson(Map<String, dynamic> json) {
    return ScoreTotals(
      totalXP: (json['totalXP'] as num?)?.toInt() ?? 0,
      totalGames: (json['totalGames'] as num?)?.toInt() ?? 0,
      totalQuizzes: (json['totalQuizzes'] as num?)?.toInt() ?? 0,
      overallAverage: (json['overallAverage'] as num?)?.toDouble() ?? 0.0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'totalXP': totalXP,
      'totalGames': totalGames,
      'totalQuizzes': totalQuizzes,
      'overallAverage': overallAverage,
    };
  }
}

