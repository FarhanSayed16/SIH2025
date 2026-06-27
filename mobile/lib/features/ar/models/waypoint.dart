/// Phase 5.5: Waypoint Model for AR Evacuation Path
/// Represents a point in the evacuation route

import 'package:geolocator/geolocator.dart';

class Waypoint {
  final String id;
  final String name;
  final Position position; // GPS coordinates
  final int order; // Order in the path sequence
  final String? description;
  final bool isSafeZone; // True if this is the final safe zone

  Waypoint({
    required this.id,
    required this.name,
    required this.position,
    required this.order,
    this.description,
    this.isSafeZone = false,
  });

  /// Create from JSON
  factory Waypoint.fromJson(Map<String, dynamic> json) {
    return Waypoint(
      id: json['id'] as String,
      name: json['name'] as String,
      position: Position(
        latitude: (json['latitude'] as num).toDouble(),
        longitude: (json['longitude'] as num).toDouble(),
        timestamp: json['timestamp'] != null
            ? DateTime.fromMillisecondsSinceEpoch(json['timestamp'] as int)
            : DateTime.now(),
        accuracy: (json['accuracy'] as num?)?.toDouble() ?? 0.0,
        altitude: (json['altitude'] as num?)?.toDouble() ?? 0.0,
        altitudeAccuracy: (json['altitudeAccuracy'] as num?)?.toDouble() ?? 0.0,
        heading: (json['heading'] as num?)?.toDouble() ?? 0.0,
        headingAccuracy: (json['headingAccuracy'] as num?)?.toDouble() ?? 0.0,
        speed: (json['speed'] as num?)?.toDouble() ?? 0.0,
        speedAccuracy: (json['speedAccuracy'] as num?)?.toDouble() ?? 0.0,
      ),
      order: json['order'] as int,
      description: json['description'] as String?,
      isSafeZone: json['isSafeZone'] as bool? ?? false,
    );
  }

  /// Convert to JSON
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'latitude': position.latitude,
      'longitude': position.longitude,
      'timestamp': position.timestamp.millisecondsSinceEpoch,
      'accuracy': position.accuracy,
      'altitude': position.altitude,
      'heading': position.heading,
      'speed': position.speed,
      'speedAccuracy': position.speedAccuracy,
      'order': order,
      'description': description,
      'isSafeZone': isSafeZone,
    };
  }

  /// Calculate distance to another waypoint in meters
  double distanceTo(Waypoint other) {
    return Geolocator.distanceBetween(
      position.latitude,
      position.longitude,
      other.position.latitude,
      other.position.longitude,
    );
  }

  /// Calculate bearing to another waypoint in degrees (0-360)
  double bearingTo(Waypoint other) {
    return Geolocator.bearingBetween(
      position.latitude,
      position.longitude,
      other.position.latitude,
      other.position.longitude,
    );
  }
}

/// AR Path - Collection of waypoints forming an evacuation route
class ARPath {
  final String id;
  final String name;
  final List<Waypoint> waypoints;
  final Waypoint? safeZone; // Final destination
  final String? schoolId;
  final DateTime createdAt;

  ARPath({
    required this.id,
    required this.name,
    required this.waypoints,
    this.safeZone,
    this.schoolId,
    DateTime? createdAt,
  }) : createdAt = createdAt ?? DateTime.now();

  /// Get total path distance in meters
  double get totalDistance {
    if (waypoints.length < 2) return 0.0;
    
    double total = 0.0;
    for (int i = 0; i < waypoints.length - 1; i++) {
      total += waypoints[i].distanceTo(waypoints[i + 1]);
    }
    
    // Add distance to safe zone if present
    if (safeZone != null && waypoints.isNotEmpty) {
      total += waypoints.last.distanceTo(safeZone!);
    }
    
    return total;
  }

  /// Get estimated walking time in minutes (assuming 5 km/h average speed)
  double get estimatedTimeMinutes {
    final distanceKm = totalDistance / 1000.0;
    const walkingSpeedKmh = 5.0; // 5 km/h average walking speed
    return (distanceKm / walkingSpeedKmh) * 60.0; // Convert to minutes
  }

  /// Get next waypoint from current position
  Waypoint? getNextWaypoint(Waypoint currentWaypoint) {
    final currentIndex = waypoints.indexWhere((w) => w.id == currentWaypoint.id);
    if (currentIndex == -1 || currentIndex >= waypoints.length - 1) {
      return safeZone;
    }
    return waypoints[currentIndex + 1];
  }

  /// Create from JSON
  factory ARPath.fromJson(Map<String, dynamic> json) {
    final waypointsList = (json['waypoints'] as List<dynamic>)
        .map((w) => Waypoint.fromJson(w as Map<String, dynamic>))
        .toList();

    return ARPath(
      id: json['id'] as String,
      name: json['name'] as String,
      waypoints: waypointsList,
      safeZone: json['safeZone'] != null
          ? Waypoint.fromJson(json['safeZone'] as Map<String, dynamic>)
          : null,
      schoolId: json['schoolId'] as String?,
      createdAt: json['createdAt'] != null
          ? DateTime.fromMillisecondsSinceEpoch(json['createdAt'] as int)
          : null,
    );
  }

  /// Convert to JSON
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'waypoints': waypoints.map((w) => w.toJson()).toList(),
      'safeZone': safeZone?.toJson(),
      'schoolId': schoolId,
      'createdAt': createdAt.millisecondsSinceEpoch,
    };
  }
}

