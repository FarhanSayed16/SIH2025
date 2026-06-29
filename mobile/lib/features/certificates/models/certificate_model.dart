/// Phase 3.3.4: Certificate Models

/// Certificate type enum
enum CertificateType {
  moduleCompletion('module_completion'),
  scoreMilestone('score_milestone'),
  badgeAchievement('badge_achievement'),
  allModulesCompleted('all_modules_completed');

  final String value;
  const CertificateType(this.value);

  static CertificateType fromString(String value) {
    return CertificateType.values.firstWhere(
      (e) => e.value == value,
      orElse: () => CertificateType.moduleCompletion,
    );
  }
}

/// Certificate model
class Certificate {
  final String id;
  final String userId;
  final CertificateType certificateType;
  final String achievement;
  final Map<String, dynamic> metadata;
  final String? pdfUrl;
  final DateTime issuedAt;
  final DateTime? sharedAt;
  final bool isActive;

  Certificate({
    required this.id,
    required this.userId,
    required this.certificateType,
    required this.achievement,
    required this.metadata,
    this.pdfUrl,
    required this.issuedAt,
    this.sharedAt,
    this.isActive = true,
  });

  factory Certificate.fromJson(Map<String, dynamic> json) {
    return Certificate(
      id: json['_id'] as String? ?? json['id'] as String,
      userId: (json['userId'] is Map
              ? json['userId']['_id'] ?? json['userId']['id']
              : json['userId']) as String,
      certificateType: CertificateType.fromString(
        json['certificateType'] as String? ?? 'module_completion',
      ),
      achievement: json['achievement'] as String,
      metadata: Map<String, dynamic>.from(
        json['metadata'] as Map? ?? <String, dynamic>{},
      ),
      pdfUrl: json['pdfUrl'] as String?,
      issuedAt: DateTime.parse(json['issuedAt'] as String),
      sharedAt: json['sharedAt'] != null
          ? DateTime.parse(json['sharedAt'] as String)
          : null,
      isActive: json['isActive'] as bool? ?? true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'userId': userId,
      'certificateType': certificateType.value,
      'achievement': achievement,
      'metadata': metadata,
      'pdfUrl': pdfUrl,
      'issuedAt': issuedAt.toIso8601String(),
      'sharedAt': sharedAt?.toIso8601String(),
      'isActive': isActive,
    };
  }

  String get displayTitle {
    switch (certificateType) {
      case CertificateType.allModulesCompleted:
        return 'All Modules Completed';
      case CertificateType.scoreMilestone:
        final milestone = metadata['milestone'] as int?;
        if (milestone == 80) return 'Safety Champion';
        if (milestone == 95) return 'Safety Expert';
        return 'Score Milestone';
      case CertificateType.badgeAchievement:
        return 'Badge Achievement';
      default:
        return 'Certificate of Completion';
    }
  }
}

