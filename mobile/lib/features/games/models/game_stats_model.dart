/// Game Stats Model
/// Represents aggregated game statistics for a user

class GameStatsData {
  final int totalGamesPlayed;
  final int highScore;
  final int lifetimeScore;
  final int runnerHighScore;
  final int floodHighScore;
  final int maxLevelUnlocked;
  final DateTime? lastUpdated;

  GameStatsData({
    required this.totalGamesPlayed,
    required this.highScore,
    required this.lifetimeScore,
    this.runnerHighScore = 0,
    this.floodHighScore = 0,
    this.maxLevelUnlocked = 1,
    this.lastUpdated,
  });

  Map<String, dynamic> toJson() {
    return {
      'totalGamesPlayed': totalGamesPlayed,
      'highScore': highScore,
      'lifetimeScore': lifetimeScore,
      'runnerHighScore': runnerHighScore,
      'floodHighScore': floodHighScore,
      'maxLevelUnlocked': maxLevelUnlocked,
      'lastUpdated': lastUpdated?.toIso8601String(),
    };
  }

  factory GameStatsData.fromJson(Map<String, dynamic> json) {
    return GameStatsData(
      totalGamesPlayed: (json['totalGamesPlayed'] ?? 0) is int
          ? json['totalGamesPlayed'] as int
          : int.tryParse((json['totalGamesPlayed'] ?? 0).toString()) ?? 0,
      highScore: (json['highScore'] ?? 0) is int
          ? json['highScore'] as int
          : int.tryParse((json['highScore'] ?? 0).toString()) ?? 0,
      lifetimeScore: (json['lifetimeScore'] ?? 0) is int
          ? json['lifetimeScore'] as int
          : int.tryParse((json['lifetimeScore'] ?? 0).toString()) ?? 0,
      runnerHighScore: (json['runnerHighScore'] ?? 0) is int
          ? json['runnerHighScore'] as int
          : int.tryParse((json['runnerHighScore'] ?? 0).toString()) ?? 0,
      floodHighScore: (json['floodHighScore'] ?? 0) is int
          ? json['floodHighScore'] as int
          : int.tryParse((json['floodHighScore'] ?? 0).toString()) ?? 0,
      maxLevelUnlocked: (json['maxLevelUnlocked'] ?? 1) is int
          ? json['maxLevelUnlocked'] as int
          : int.tryParse((json['maxLevelUnlocked'] ?? 1).toString()) ?? 1,
      lastUpdated: json['lastUpdated'] != null
          ? DateTime.parse(json['lastUpdated'] as String)
          : null,
    );
  }

  GameStatsData copyWith({
    int? totalGamesPlayed,
    int? highScore,
    int? lifetimeScore,
    int? runnerHighScore,
    int? floodHighScore,
    int? maxLevelUnlocked,
    DateTime? lastUpdated,
  }) {
    return GameStatsData(
      totalGamesPlayed: totalGamesPlayed ?? this.totalGamesPlayed,
      highScore: highScore ?? this.highScore,
      lifetimeScore: lifetimeScore ?? this.lifetimeScore,
      runnerHighScore: runnerHighScore ?? this.runnerHighScore,
      floodHighScore: floodHighScore ?? this.floodHighScore,
      maxLevelUnlocked: maxLevelUnlocked ?? this.maxLevelUnlocked,
      lastUpdated: lastUpdated ?? this.lastUpdated,
    );
  }
}

