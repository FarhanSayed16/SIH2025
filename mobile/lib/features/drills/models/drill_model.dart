/// Phase 4.2: Drill Model
/// Represents a drill with lifecycle stages and participant tracking

class DrillModel {
  final String id;
  final String institutionId;
  final String type; // fire, earthquake, flood, etc.
  final DateTime scheduledAt;
  final DateTime? actualStart;
  final int duration; // in minutes
  final String status; // scheduled, in_progress, completed, cancelled
  final String? triggeredBy;
  final DateTime? triggeredAt;
  final DateTime? completedAt;
  final ParticipantSelection? participantSelection;
  final List<DrillParticipant> participants;
  final DrillResults results;
  final String? notes;

  DrillModel({
    required this.id,
    required this.institutionId,
    required this.type,
    required this.scheduledAt,
    this.actualStart,
    this.duration = 10,
    required this.status,
    this.triggeredBy,
    this.triggeredAt,
    this.completedAt,
    this.participantSelection,
    this.participants = const [],
    this.results = const DrillResults(),
    this.notes,
  });

  factory DrillModel.fromJson(Map<String, dynamic> json) {
    return DrillModel(
      id: json['_id']?.toString() ?? json['id']?.toString() ?? '',
      institutionId: json['institutionId']?.toString() ?? '',
      type: json['type']?.toString() ?? '',
      scheduledAt: json['scheduledAt'] != null
          ? DateTime.parse(json['scheduledAt'].toString())
          : DateTime.now(),
      actualStart: json['actualStart'] != null
          ? DateTime.parse(json['actualStart'].toString())
          : null,
      duration: (json['duration'] as int?) ?? 10,
      status: json['status']?.toString() ?? 'scheduled',
      triggeredBy: json['triggeredBy']?.toString(),
      triggeredAt: json['triggeredAt'] != null
          ? DateTime.parse(json['triggeredAt'].toString())
          : null,
      completedAt: json['completedAt'] != null
          ? DateTime.parse(json['completedAt'].toString())
          : null,
      participantSelection: json['participantSelection'] != null
          ? ParticipantSelection.fromJson(
              json['participantSelection'] as Map<String, dynamic>)
          : null,
      participants: json['participants'] != null
          ? (json['participants'] as List)
              .map((p) => DrillParticipant.fromJson(p as Map<String, dynamic>))
              .toList()
          : [],
      results: json['results'] != null
          ? DrillResults.fromJson(json['results'] as Map<String, dynamic>)
          : const DrillResults(),
      notes: json['notes']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'institutionId': institutionId,
      'type': type,
      'scheduledAt': scheduledAt.toIso8601String(),
      'actualStart': actualStart?.toIso8601String(),
      'duration': duration,
      'status': status,
      'triggeredBy': triggeredBy,
      'triggeredAt': triggeredAt?.toIso8601String(),
      'completedAt': completedAt?.toIso8601String(),
      'participantSelection': participantSelection?.toJson(),
      'participants': participants.map((p) => p.toJson()).toList(),
      'results': results.toJson(),
      'notes': notes,
    };
  }

  bool get isScheduled => status == 'scheduled';
  bool get isInProgress => status == 'in_progress';
  bool get isCompleted => status == 'completed';
  bool get isCancelled => status == 'cancelled';

  bool get canAcknowledge => isInProgress;
  bool get canEnd => isInProgress;

  Duration? get remainingTime {
    if (!isInProgress || actualStart == null) return null;
    final endTime = actualStart!.add(Duration(minutes: duration));
    final now = DateTime.now();
    if (now.isAfter(endTime)) return Duration.zero;
    return endTime.difference(now);
  }
}

class ParticipantSelection {
  final String type; // all, class, grade, specific
  final List<String>? classIds;
  final List<String>? grades;
  final List<String>? userIds;

  ParticipantSelection({
    required this.type,
    this.classIds,
    this.grades,
    this.userIds,
  });

  factory ParticipantSelection.fromJson(Map<String, dynamic> json) {
    return ParticipantSelection(
      type: json['type']?.toString() ?? 'all',
      classIds: json['classIds'] != null
          ? (json['classIds'] as List).map((e) => e.toString()).toList()
          : null,
      grades: json['grades'] != null
          ? (json['grades'] as List).map((e) => e.toString()).toList()
          : null,
      userIds: json['userIds'] != null
          ? (json['userIds'] as List).map((e) => e.toString()).toList()
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'type': type,
      'classIds': classIds,
      'grades': grades,
      'userIds': userIds,
    };
  }
}

class DrillParticipant {
  final String userId;
  final String? role;
  final DateTime? joinedAt;
  final DateTime? completedAt;
  final DateTime? acknowledgedAt;
  final int? evacuationTime; // in seconds
  final String? route;
  final int? score;
  final bool acknowledged;
  final int? responseTime; // in seconds

  DrillParticipant({
    required this.userId,
    this.role,
    this.joinedAt,
    this.completedAt,
    this.acknowledgedAt,
    this.evacuationTime,
    this.route,
    this.score,
    this.acknowledged = false,
    this.responseTime,
  });

  factory DrillParticipant.fromJson(Map<String, dynamic> json) {
    return DrillParticipant(
      userId: json['userId']?.toString() ?? json['_id']?.toString() ?? '',
      role: json['role']?.toString(),
      joinedAt: json['joinedAt'] != null
          ? DateTime.parse(json['joinedAt'].toString())
          : null,
      completedAt: json['completedAt'] != null
          ? DateTime.parse(json['completedAt'].toString())
          : null,
      acknowledgedAt: json['acknowledgedAt'] != null
          ? DateTime.parse(json['acknowledgedAt'].toString())
          : null,
      evacuationTime: json['evacuationTime'] as int?,
      route: json['route']?.toString(),
      score: json['score'] as int?,
      acknowledged: (json['acknowledged'] as bool?) ?? false,
      responseTime: json['responseTime'] as int?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'userId': userId,
      'role': role,
      'joinedAt': joinedAt?.toIso8601String(),
      'completedAt': completedAt?.toIso8601String(),
      'acknowledgedAt': acknowledgedAt?.toIso8601String(),
      'evacuationTime': evacuationTime,
      'route': route,
      'score': score,
      'acknowledged': acknowledged,
      'responseTime': responseTime,
    };
  }
}

class DrillResults {
  final int totalParticipants;
  final int completedParticipants;
  final int? avgEvacuationTime; // in seconds
  final int participationRate; // percentage
  final int routeEfficiency; // percentage

  const DrillResults({
    this.totalParticipants = 0,
    this.completedParticipants = 0,
    this.avgEvacuationTime,
    this.participationRate = 0,
    this.routeEfficiency = 0,
  });

  factory DrillResults.fromJson(Map<String, dynamic> json) {
    return DrillResults(
      totalParticipants: (json['totalParticipants'] as int?) ?? 0,
      completedParticipants: (json['completedParticipants'] as int?) ?? 0,
      avgEvacuationTime: json['avgEvacuationTime'] as int?,
      participationRate: (json['participationRate'] as int?) ?? 0,
      routeEfficiency: (json['routeEfficiency'] as int?) ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'totalParticipants': totalParticipants,
      'completedParticipants': completedParticipants,
      'avgEvacuationTime': avgEvacuationTime,
      'participationRate': participationRate,
      'routeEfficiency': routeEfficiency,
    };
  }
}

