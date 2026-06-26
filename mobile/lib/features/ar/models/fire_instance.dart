/// Phase 5.6: Fire Instance Model
/// Represents a virtual fire in AR space
import 'package:geolocator/geolocator.dart';

class FireInstance {
  final String id;
  final String drillId;
  final Position position; // GPS position where fire was placed
  final DateTime spawnTime;
  final DateTime? extinguishTime;
  final String? extinguishedBy; // User ID who extinguished it
  final int? score; // Points earned for extinguishing
  final FireState state;
  
  // AR-specific properties (for when AR plugin is available)
  final Map<String, dynamic>? arAnchor; // AR anchor data
  final String? arModelId; // AR model ID if placed in AR

  FireInstance({
    required this.id,
    required this.drillId,
    required this.position,
    required this.spawnTime,
    this.extinguishTime,
    this.extinguishedBy,
    this.score,
    this.state = FireState.burning,
    this.arAnchor,
    this.arModelId,
  });

  /// Create from JSON
  factory FireInstance.fromJson(Map<String, dynamic> json) {
    return FireInstance(
      id: json['id'] as String,
      drillId: json['drillId'] as String,
      position: Position(
        latitude: (json['latitude'] as num).toDouble(),
        longitude: (json['longitude'] as num).toDouble(),
        timestamp: json['timestamp'] != null
            ? DateTime.fromMillisecondsSinceEpoch(json['timestamp'] as int)
            : DateTime.now(),
        accuracy: (json['accuracy'] as num?)?.toDouble() ?? 0.0,
        altitude: (json['altitude'] as num?)?.toDouble() ?? 0.0,
        heading: (json['heading'] as num?)?.toDouble() ?? 0.0,
        speed: (json['speed'] as num?)?.toDouble() ?? 0.0,
        speedAccuracy: (json['speedAccuracy'] as num?)?.toDouble() ?? 0.0,
        altitudeAccuracy: (json['altitudeAccuracy'] as num?)?.toDouble() ?? 0.0,
        headingAccuracy: (json['headingAccuracy'] as num?)?.toDouble() ?? 0.0,
      ),
      spawnTime: DateTime.fromMillisecondsSinceEpoch(json['spawnTime'] as int),
      extinguishTime: json['extinguishTime'] != null
          ? DateTime.fromMillisecondsSinceEpoch(json['extinguishTime'] as int)
          : null,
      extinguishedBy: json['extinguishedBy'] as String?,
      score: json['score'] as int?,
      state: FireState.values.firstWhere(
        (e) => e.toString().split('.').last == json['state'],
        orElse: () => FireState.burning,
      ),
      arAnchor: json['arAnchor'] as Map<String, dynamic>?,
      arModelId: json['arModelId'] as String?,
    );
  }

  /// Convert to JSON
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'drillId': drillId,
      'latitude': position.latitude,
      'longitude': position.longitude,
      'timestamp': position.timestamp.millisecondsSinceEpoch,
      'accuracy': position.accuracy,
      'altitude': position.altitude,
      'heading': position.heading,
      'speed': position.speed,
      'speedAccuracy': position.speedAccuracy,
      'altitudeAccuracy': position.altitudeAccuracy,
      'headingAccuracy': position.headingAccuracy,
      'spawnTime': spawnTime.millisecondsSinceEpoch,
      'extinguishTime': extinguishTime?.millisecondsSinceEpoch,
      'extinguishedBy': extinguishedBy,
      'score': score,
      'state': state.toString().split('.').last,
      'arAnchor': arAnchor,
      'arModelId': arModelId,
    };
  }

  /// Calculate distance to another position
  double distanceTo(Position other) {
    return Geolocator.distanceBetween(
      position.latitude,
      position.longitude,
      other.latitude,
      other.longitude,
    );
  }

  /// Check if fire is extinguished
  bool get isExtinguished => state == FireState.extinguished;

  /// Check if fire is burning
  bool get isBurning => state == FireState.burning;

  /// Calculate time since spawn
  Duration get timeSinceSpawn => DateTime.now().difference(spawnTime);

  /// Calculate time to extinguish (if extinguished)
  Duration? get timeToExtinguish {
    if (extinguishTime == null) return null;
    return extinguishTime!.difference(spawnTime);
  }

  /// Create a copy with updated fields
  FireInstance copyWith({
    String? id,
    String? drillId,
    Position? position,
    DateTime? spawnTime,
    DateTime? extinguishTime,
    String? extinguishedBy,
    int? score,
    FireState? state,
    Map<String, dynamic>? arAnchor,
    String? arModelId,
  }) {
    return FireInstance(
      id: id ?? this.id,
      drillId: drillId ?? this.drillId,
      position: position ?? this.position,
      spawnTime: spawnTime ?? this.spawnTime,
      extinguishTime: extinguishTime ?? this.extinguishTime,
      extinguishedBy: extinguishedBy ?? this.extinguishedBy,
      score: score ?? this.score,
      state: state ?? this.state,
      arAnchor: arAnchor ?? this.arAnchor,
      arModelId: arModelId ?? this.arModelId,
    );
  }
}

/// Fire state enum
enum FireState {
  burning,      // Fire is active
  extinguishing, // Fire is being extinguished
  extinguished,  // Fire is extinguished
}

/// Fire Simulation Result
class FireSimulationResult {
  final String fireId;
  final String drillId;
  final String? userId;
  final int score;
  final Duration timeToExtinguish;
  final DateTime completedAt;

  FireSimulationResult({
    required this.fireId,
    required this.drillId,
    this.userId,
    required this.score,
    required this.timeToExtinguish,
    required this.completedAt,
  });

  factory FireSimulationResult.fromJson(Map<String, dynamic> json) {
    return FireSimulationResult(
      fireId: json['fireId'] as String,
      drillId: json['drillId'] as String,
      userId: json['userId'] as String?,
      score: json['score'] as int,
      timeToExtinguish: Duration(
        seconds: json['timeToExtinguish'] as int,
      ),
      completedAt: DateTime.fromMillisecondsSinceEpoch(
        json['completedAt'] as int,
      ),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'fireId': fireId,
      'drillId': drillId,
      'userId': userId,
      'score': score,
      'timeToExtinguish': timeToExtinguish.inSeconds,
      'completedAt': completedAt.millisecondsSinceEpoch,
    };
  }
}

