/// Parent feature models
/// Parent Monitoring System - Phase 3

class ParentChild {
  final String id;
  final String name;
  final String? email;
  final String? grade;
  final String? section;
  final String? classCode;
  final String? institutionName;
  final String? profilePicture;
  final String? relationship;
  final bool? isPrimary;
  final String? relationshipId;
  final Map<String, dynamic>? classId;
  final Map<String, dynamic>? institutionId;
  final String? qrCode;
  final String? qrBadgeId;
  final Map<String, dynamic>? stats;
  final String? safetyStatus;
  final String? lastSeen;

  ParentChild({
    required this.id,
    required this.name,
    this.email,
    this.grade,
    this.section,
    this.classCode,
    this.institutionName,
    this.profilePicture,
    this.relationship,
    this.isPrimary,
    this.relationshipId,
    this.classId,
    this.institutionId,
    this.qrCode,
    this.qrBadgeId,
    this.stats,
    this.safetyStatus,
    this.lastSeen,
  });

  factory ParentChild.fromJson(Map<String, dynamic> json) {
    return ParentChild(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      name: (json['name'] ?? '').toString(),
      email: json['email']?.toString(),
      grade: json['grade']?.toString(),
      section: json['section']?.toString(),
      classCode:
          (json['classCode'] ?? json['classId']?['classCode'])?.toString(),
      institutionName:
          (json['institutionName'] ?? json['institutionId']?['name'])
              ?.toString(),
      profilePicture: json['profilePicture']?.toString(),
      relationship: json['relationship']?.toString(),
      isPrimary: json['isPrimary'] as bool?,
      relationshipId: json['relationshipId']?.toString(),
      classId: json['classId'] is Map
          ? Map<String, dynamic>.from(json['classId'] as Map)
          : null,
      institutionId: json['institutionId'] is Map
          ? Map<String, dynamic>.from(json['institutionId'] as Map)
          : null,
      qrCode: json['qrCode']?.toString(),
      qrBadgeId: json['qrBadgeId']?.toString(),
      stats: json['stats'] is Map
          ? Map<String, dynamic>.from(json['stats'] as Map)
          : null,
      safetyStatus: json['safetyStatus']?.toString(),
      lastSeen: json['lastSeen']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
      'grade': grade,
      'section': section,
      'classCode': classCode,
      'institutionName': institutionName,
      'relationship': relationship,
      'isPrimary': isPrimary,
    };
  }
}

class ChildProgress {
  final ParentChild student;
  final Map<String, dynamic> modules;
  final Map<String, dynamic> quiz;
  final Map<String, dynamic> games;
  final Map<String, dynamic> progress;
  final String? lastActivity;

  ChildProgress({
    required this.student,
    required this.modules,
    required this.quiz,
    required this.games,
    required this.progress,
    this.lastActivity,
  });

  factory ChildProgress.fromJson(Map<String, dynamic> json) {
    return ChildProgress(
      student: ParentChild.fromJson(
          (json['student'] as Map<String, dynamic>?) ?? <String, dynamic>{}),
      modules:
          (json['modules'] as Map<String, dynamic>?) ?? <String, dynamic>{},
      quiz: (json['quiz'] as Map<String, dynamic>?) ?? <String, dynamic>{},
      games: (json['games'] as Map<String, dynamic>?) ?? <String, dynamic>{},
      progress:
          (json['progress'] as Map<String, dynamic>?) ?? <String, dynamic>{},
      lastActivity: json['lastActivity']?.toString(),
    );
  }
}

class ChildLocation {
  final double? latitude;
  final double? longitude;
  final double? accuracy;
  final DateTime? timestamp;
  final String status; // 'safe', 'in_drill', 'emergency', 'unknown', 'unavailable'
  final DateTime? lastSeen;
  final Map<String, dynamic>? activeDrill;

  ChildLocation({
    this.latitude,
    this.longitude,
    this.accuracy,
    this.timestamp,
    required this.status,
    this.lastSeen,
    this.activeDrill,
  });

  factory ChildLocation.fromJson(Map<String, dynamic> json) {
    return ChildLocation(
      latitude: (json['latitude'] is num)
          ? (json['latitude'] as num).toDouble()
          : null,
      longitude: (json['longitude'] is num)
          ? (json['longitude'] as num).toDouble()
          : null,
      accuracy: (json['accuracy'] is num)
          ? (json['accuracy'] as num).toDouble()
          : null,
      timestamp: json['timestamp'] != null
          ? DateTime.tryParse(json['timestamp'].toString())
          : null,
      status: (json['status'] ?? 'unknown').toString(),
      // Do not invent "just now" when the API omits lastSeen.
      lastSeen: json['lastSeen'] != null
          ? DateTime.tryParse(json['lastSeen'].toString())
          : null,
      activeDrill: json['activeDrill'] is Map
          ? Map<String, dynamic>.from(
              json['activeDrill'] as Map<dynamic, dynamic>)
          : null,
    );
  }
}

class DrillParticipation {
  final String drillId;
  final String drillType;
  final DateTime startTime;
  final DateTime? endTime;
  final String status; // 'pending', 'in_progress', 'completed', 'missed'
  final int? completionTime;
  final Map<String, double>? location;

  DrillParticipation({
    required this.drillId,
    required this.drillType,
    required this.startTime,
    this.endTime,
    required this.status,
    this.completionTime,
    this.location,
  });

  factory DrillParticipation.fromJson(Map<String, dynamic> json) {
    final locationData = json['location'];
    Map<String, double>? locationMap;
    if (locationData is Map) {
      final lat = locationData['latitude'];
      final lng = locationData['longitude'];
      locationMap = {
        'latitude': (lat is num) ? lat.toDouble() : 0.0,
        'longitude': (lng is num) ? lng.toDouble() : 0.0,
      };
    }

    return DrillParticipation(
      drillId: (json['drillId'] ?? '').toString(),
      drillType: (json['drillType'] ?? '').toString(),
      startTime: json['startTime'] != null
          ? DateTime.parse(json['startTime'].toString())
          : DateTime.now(),
      endTime: json['endTime'] != null
          ? DateTime.parse(json['endTime'].toString())
          : null,
      status: (json['status'] ?? 'pending').toString(),
      completionTime:
          json['completionTime'] is int ? json['completionTime'] as int : null,
      location: locationMap,
    );
  }
}

class AttendanceRecord {
  final String id;
  final DateTime date;
  final String status; // 'present', 'absent', 'late', 'excused'
  final String? notes;

  AttendanceRecord({
    required this.id,
    required this.date,
    required this.status,
    this.notes,
  });

  factory AttendanceRecord.fromJson(Map<String, dynamic> json) {
    return AttendanceRecord(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      date: json['date'] != null
          ? DateTime.parse(json['date'].toString())
          : DateTime.now(),
      status: (json['status'] ?? 'absent').toString(),
      notes: json['notes']?.toString(),
    );
  }
}

class AttendanceData {
  final List<AttendanceRecord> records;
  final Map<String, dynamic> statistics;

  AttendanceData({
    required this.records,
    required this.statistics,
  });

  factory AttendanceData.fromJson(Map<String, dynamic> json) {
    return AttendanceData(
      records: (json['records'] as List<dynamic>?)
              ?.map((e) => AttendanceRecord.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      statistics: (json['statistics'] ?? <String, dynamic>{}) as Map<String, dynamic>,
    );
  }
}

class QRVerificationResult {
  final bool verified;
  final ParentChild? student;
  final Map<String, dynamic>? relationship;
  final String? message;

  QRVerificationResult({
    required this.verified,
    this.student,
    this.relationship,
    this.message,
  });

  factory QRVerificationResult.fromJson(Map<String, dynamic> json) {
    return QRVerificationResult(
      // Link endpoints return `autoVerified`; verify returns `verified`.
      verified: json['verified'] == true || json['autoVerified'] == true,
      student: json['student'] != null
          ? ParentChild.fromJson(json['student'] as Map<String, dynamic>)
          : null,
      relationship: json['relationship'] is Map
          ? Map<String, dynamic>.from(
              json['relationship'] as Map<dynamic, dynamic>)
          : null,
      message: json['message']?.toString(),
    );
  }
}

class ParentNotification {
  final String id;
  final String
      type; // 'drill', 'achievement', 'attendance', 'emergency', 'system'
  final String title;
  final String message;
  final Map<String, dynamic>? data;
  final bool read;
  final DateTime createdAt;
  final DateTime updatedAt;

  ParentNotification({
    required this.id,
    required this.type,
    required this.title,
    required this.message,
    this.data,
    required this.read,
    required this.createdAt,
    required this.updatedAt,
  });

  factory ParentNotification.fromJson(Map<String, dynamic> json) {
    return ParentNotification(
      id: (json['id'] ?? json['_id'] ?? '').toString(),
      type: (json['type'] ?? 'system').toString(),
      title: (json['title'] ?? '').toString(),
      message: (json['message'] ?? '').toString(),
      data: json['data'] is Map
          ? Map<String, dynamic>.from(json['data'] as Map)
          : null,
      read: json['read'] == true,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'].toString())
          : DateTime.now(),
      updatedAt: json['updatedAt'] != null
          ? DateTime.parse(json['updatedAt'].toString())
          : DateTime.now(),
    );
  }
}
