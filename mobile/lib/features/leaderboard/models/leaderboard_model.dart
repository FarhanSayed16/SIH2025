/// Leaderboard entry model
class LeaderboardEntry {
  final int rank;
  final String userId;
  final String name;
  final String? email;
  final double score;
  final Map<String, dynamic>? additionalData; // For game-specific data, badges, etc.

  LeaderboardEntry({
    required this.rank,
    required this.userId,
    required this.name,
    this.email,
    required this.score,
    this.additionalData,
  });

  factory LeaderboardEntry.fromJson(Map<String, dynamic> json) {
    return LeaderboardEntry(
      rank: (json['rank'] ?? 0) is int
          ? json['rank'] as int
          : int.tryParse(json['rank'].toString()) ?? 0,
      userId: (json['userId'] ?? json['_id'] ?? '').toString(),
      name: (json['name'] ?? 'Unknown').toString(),
      email: json['email']?.toString(),
      score: (json['score'] ?? 0) is num
          ? (json['score'] as num).toDouble()
          : double.tryParse(json['score'].toString()) ?? 0.0,
      additionalData: json['additionalData'] != null
          ? Map<String, dynamic>.from(json['additionalData'] as Map)
          : null,
    );
  }
}

/// Leaderboard response model
class LeaderboardResponse {
  final List<LeaderboardEntry> leaderboard;
  final String type;
  final String? institutionId;
  final int count;
  final Map<String, dynamic>? metadata;

  LeaderboardResponse({
    required this.leaderboard,
    required this.type,
    this.institutionId,
    required this.count,
    this.metadata,
  });

  factory LeaderboardResponse.fromJson(Map<String, dynamic> json) {
    final data = json['data'] ?? json;
    final leaderboardList = data['leaderboard'] as List<dynamic>? ?? [];
    
    return LeaderboardResponse(
      leaderboard: leaderboardList
          .map((entry) => LeaderboardEntry.fromJson(entry as Map<String, dynamic>))
          .toList(),
      type: (data['type'] ?? 'overall').toString(),
      institutionId: data['institutionId']?.toString(),
      count: (data['count'] ?? leaderboardList.length) is int
          ? data['count'] as int
          : int.tryParse(data['count'].toString()) ?? leaderboardList.length,
      metadata: data['metadata'] != null
          ? Map<String, dynamic>.from(data['metadata'] as Map)
          : null,
    );
  }
}

/// Squad Wars entry model
class SquadWarsEntry {
  final int rank;
  final String squadId;
  final String squadName;
  final String classCode;
  final String grade;
  final String section;
  final int memberCount;
  final double averageScore;
  final int squadPoints;

  SquadWarsEntry({
    required this.rank,
    required this.squadId,
    required this.squadName,
    required this.classCode,
    required this.grade,
    required this.section,
    required this.memberCount,
    required this.averageScore,
    required this.squadPoints,
  });

  factory SquadWarsEntry.fromJson(Map<String, dynamic> json) {
    return SquadWarsEntry(
      rank: (json['rank'] ?? 0) is int
          ? json['rank'] as int
          : int.tryParse(json['rank'].toString()) ?? 0,
      squadId: (json['squadId'] ?? json['classId'] ?? '').toString(),
      squadName: (json['squadName'] ?? 'Unknown Squad').toString(),
      classCode: (json['classCode'] ?? '').toString(),
      grade: (json['grade'] ?? '').toString(),
      section: (json['section'] ?? '').toString(),
      memberCount: (json['memberCount'] ?? json['studentCount'] ?? 0) is int
          ? (json['memberCount'] ?? json['studentCount'] ?? 0) as int
          : int.tryParse((json['memberCount'] ?? json['studentCount'] ?? 0).toString()) ?? 0,
      averageScore: (json['averageScore'] ?? 0) is num
          ? (json['averageScore'] as num).toDouble()
          : double.tryParse(json['averageScore'].toString()) ?? 0.0,
      squadPoints: (json['squadPoints'] ?? 0) is int
          ? json['squadPoints'] as int
          : int.tryParse(json['squadPoints'].toString()) ?? 0,
    );
  }
}

