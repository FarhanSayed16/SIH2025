/// Phase 3.3.3: Badge Model
/// Represents a badge/achievement in the system

class Badge {
  final String id;
  final String name;
  final String description;
  final String icon; // Emoji or icon identifier
  final String category; // module, game, drill, streak, achievement, special
  final BadgeCriteria criteria;
  final int xpReward;
  final List<String> gradeLevel;
  final bool isActive;
  final bool isRare;
  final int order;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  Badge({
    required this.id,
    required this.name,
    required this.description,
    this.icon = '🏅',
    required this.category,
    required this.criteria,
    this.xpReward = 50,
    this.gradeLevel = const ['all'],
    this.isActive = true,
    this.isRare = false,
    this.order = 0,
    this.createdAt,
    this.updatedAt,
  });

  factory Badge.fromJson(Map<String, dynamic> json) {
    return Badge(
      id: json['id'] as String? ?? json['_id'] as String,
      name: json['name'] as String,
      description: json['description'] as String,
      icon: json['icon'] as String? ?? '🏅',
      category: json['category'] as String? ?? 'achievement',
      criteria: BadgeCriteria.fromJson(
        json['criteria'] as Map<String, dynamic>,
      ),
      xpReward: (json['xpReward'] as num?)?.toInt() ?? 50,
      gradeLevel: (json['gradeLevel'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          ['all'],
      isActive: json['isActive'] as bool? ?? true,
      isRare: json['isRare'] as bool? ?? false,
      order: (json['order'] as num?)?.toInt() ?? 0,
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
      'id': id,
      'name': name,
      'description': description,
      'icon': icon,
      'category': category,
      'criteria': criteria.toJson(),
      'xpReward': xpReward,
      'gradeLevel': gradeLevel,
      'isActive': isActive,
      'isRare': isRare,
      'order': order,
      if (createdAt != null) 'createdAt': createdAt!.toIso8601String(),
      if (updatedAt != null) 'updatedAt': updatedAt!.toIso8601String(),
    };
  }
}

/// Badge criteria for earning the badge
class BadgeCriteria {
  final String type; // module_complete, module_all, game_wins, etc.
  final dynamic value; // Can be number, string, or object
  final String? moduleCategory;
  final String? gameType;

  BadgeCriteria({
    required this.type,
    required this.value,
    this.moduleCategory,
    this.gameType,
  });

  factory BadgeCriteria.fromJson(Map<String, dynamic> json) {
    return BadgeCriteria(
      type: json['type'] as String,
      value: json['value'],
      moduleCategory: json['moduleCategory'] as String?,
      gameType: json['gameType'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'type': type,
      'value': value,
      if (moduleCategory != null) 'moduleCategory': moduleCategory,
      if (gameType != null) 'gameType': gameType,
    };
  }
}

/// Badge history entry (when badge was awarded)
class BadgeHistory {
  final String id;
  final String userId;
  final String badgeId;
  final DateTime awardedAt;
  final int xpEarned;
  final String triggerType; // module, game, drill, streak, score, manual
  final Map<String, dynamic>? triggerData;
  final Badge? badge; // Populated badge details

  BadgeHistory({
    required this.id,
    required this.userId,
    required this.badgeId,
    required this.awardedAt,
    this.xpEarned = 0,
    this.triggerType = 'manual',
    this.triggerData,
    this.badge,
  });

  factory BadgeHistory.fromJson(Map<String, dynamic> json) {
    return BadgeHistory(
      id: json['_id'] as String? ?? json['id'] as String,
      userId: json['userId'] as String,
      badgeId: json['badgeId'] as String,
      awardedAt: DateTime.parse(json['awardedAt'] as String),
      xpEarned: (json['xpEarned'] as num?)?.toInt() ?? 0,
      triggerType: json['triggerType'] as String? ?? 'manual',
      triggerData: json['triggerData'] as Map<String, dynamic>?,
      badge: json['badge'] != null
          ? Badge.fromJson(json['badge'] as Map<String, dynamic>)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'badgeId': badgeId,
      'awardedAt': awardedAt.toIso8601String(),
      'xpEarned': xpEarned,
      'triggerType': triggerType,
      if (triggerData != null) 'triggerData': triggerData,
      if (badge != null) 'badge': badge!.toJson(),
    };
  }
}

