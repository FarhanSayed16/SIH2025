/// Phase 4.7: AR Navigation Service
/// Handles AR route calculation and navigation data

import '../../../core/services/api_service.dart';
import '../../../core/constants/api_endpoints.dart';
import '../../maps/services/map_data_service.dart';
import '../../maps/models/map_models.dart';

/// AR Route Model
class ARRoute {
  final String routeId;
  final LocationPoint startLocation;
  final LocationPoint endLocation;
  final List<LocationPoint> waypoints;
  final List<RouteInstruction> instructions;
  final double totalDistance; // meters
  final String totalDistanceFormatted;
  final int estimatedTime; // seconds
  final String estimatedTimeFormatted;
  final String alertType;
  final String schoolId;

  ARRoute({
    required this.routeId,
    required this.startLocation,
    required this.endLocation,
    required this.waypoints,
    required this.instructions,
    required this.totalDistance,
    required this.totalDistanceFormatted,
    required this.estimatedTime,
    required this.estimatedTimeFormatted,
    required this.alertType,
    required this.schoolId,
  });

  factory ARRoute.fromJson(Map<String, dynamic> json) {
    return ARRoute(
      routeId: (json['routeId'] as String?) ?? '',
      startLocation: LocationPoint.fromJson(
        (json['startLocation'] as Map<String, dynamic>?) ?? {},
      ),
      endLocation: LocationPoint.fromJson(
        (json['endLocation'] as Map<String, dynamic>?) ?? {},
      ),
      waypoints: (json['waypoints'] as List<dynamic>? ?? [])
          .map((w) => LocationPoint.fromJson(w as Map<String, dynamic>))
          .toList(),
      instructions: (json['instructions'] as List<dynamic>? ?? [])
          .map((i) => RouteInstruction.fromJson(i as Map<String, dynamic>))
          .toList(),
      totalDistance: (json['totalDistance'] as num?)?.toDouble() ?? 0.0,
      totalDistanceFormatted:
          (json['totalDistanceFormatted'] as String?) ?? '0m',
      estimatedTime: (json['estimatedTime'] as int?) ?? 0,
      estimatedTimeFormatted:
          (json['estimatedTimeFormatted'] as String?) ?? '0 min',
      alertType: (json['alertType'] as String?) ?? 'other',
      schoolId: (json['schoolId'] as String?) ?? '',
    );
  }
}

/// Location Point
class LocationPoint {
  final double lat;
  final double lng;
  final String? type; // start, waypoint, end
  final String? name;

  LocationPoint({
    required this.lat,
    required this.lng,
    this.type,
    this.name,
  });

  factory LocationPoint.fromJson(Map<String, dynamic> json) {
    // Handle both {lat, lng} and {coordinates: [lng, lat]} formats
    double lat = 0.0;
    double lng = 0.0;

    if (json.containsKey('lat') && json.containsKey('lng')) {
      lat = (json['lat'] as num?)?.toDouble() ?? 0.0;
      lng = (json['lng'] as num?)?.toDouble() ?? 0.0;
    } else if (json.containsKey('coordinates')) {
      final coords = json['coordinates'] as List<dynamic>?;
      if (coords != null && coords.length >= 2) {
        // GeoJSON format: [longitude, latitude]
        lng = (coords[0] as num).toDouble();
        lat = (coords[1] as num).toDouble();
      }
    }

    return LocationPoint(
      lat: lat,
      lng: lng,
      type: json['type'] as String?,
      name: json['name'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
        'lat': lat,
        'lng': lng,
        if (type != null) 'type': type,
        if (name != null) 'name': name,
      };
}

/// Route Instruction
class RouteInstruction {
  final int step;
  final String instruction;
  final double distance; // meters
  final String? distanceFormatted;
  final String direction;
  final double? bearing;
  final double lat;
  final double lng;

  RouteInstruction({
    required this.step,
    required this.instruction,
    required this.distance,
    this.distanceFormatted,
    required this.direction,
    this.bearing,
    required this.lat,
    required this.lng,
  });

  factory RouteInstruction.fromJson(Map<String, dynamic> json) {
    return RouteInstruction(
      step: (json['step'] as int?) ?? 0,
      instruction: (json['instruction'] as String?) ?? '',
      distance: (json['distance'] as num?)?.toDouble() ?? 0.0,
      distanceFormatted: json['distanceFormatted'] as String?,
      direction: (json['direction'] as String?) ?? '',
      bearing: (json['bearing'] as num?)?.toDouble(),
      lat: (json['lat'] as num?)?.toDouble() ?? 0.0,
      lng: (json['lng'] as num?)?.toDouble() ?? 0.0,
    );
  }
}

/// Safe Zone Model
class SafeZone {
  final String zoneId;
  final String name;
  final LocationPoint location;
  final int capacity;
  final String? description;
  final String schoolId;
  final String? building;
  final double? distance; // meters
  final String? distanceFormatted;

  SafeZone({
    required this.zoneId,
    required this.name,
    required this.location,
    required this.capacity,
    this.description,
    required this.schoolId,
    this.building,
    this.distance,
    this.distanceFormatted,
  });

  factory SafeZone.fromJson(Map<String, dynamic> json) {
    final locJson = json['location'] as Map<String, dynamic>? ?? {};
    return SafeZone(
      zoneId: (json['zoneId'] as String?) ?? '',
      name: (json['name'] as String?) ?? '',
      location: LocationPoint.fromJson(locJson),
      capacity: (json['capacity'] as int?) ?? 0,
      description: json['description'] as String?,
      schoolId: (json['schoolId'] as String?) ?? '',
      building: json['building'] as String?,
      distance: (json['distance'] as num?)?.toDouble(),
      distanceFormatted: json['distanceFormatted'] as String?,
    );
  }
}

/// AR Marker Model
class ARMarker {
  final String markerId;
  final String type; // safe_zone, exit, hazard
  final LocationPoint location;
  final String label;
  final String icon;
  final String schoolId;
  final Map<String, dynamic>? metadata;

  ARMarker({
    required this.markerId,
    required this.type,
    required this.location,
    required this.label,
    required this.icon,
    required this.schoolId,
    this.metadata,
  });

  factory ARMarker.fromJson(Map<String, dynamic> json) {
    final locJson = json['location'] as Map<String, dynamic>? ?? {};
    return ARMarker(
      markerId: (json['markerId'] as String?) ?? '',
      type: (json['type'] as String?) ?? '',
      location: LocationPoint.fromJson(locJson),
      label: (json['label'] as String?) ?? '',
      icon: (json['icon'] as String?) ?? '',
      schoolId: (json['schoolId'] as String?) ?? '',
      metadata: json['metadata'] as Map<String, dynamic>?,
    );
  }
}

/// AR Navigation Service
class ARNavigationService {
  final ApiService _apiService;
  final MapDataService _mapDataService;

  ARNavigationService({ApiService? apiService, MapDataService? mapDataService})
      : _apiService = apiService ?? ApiService(),
        _mapDataService = mapDataService ?? MapDataService();

  /// Calculate AR route from current location to safe zone
  Future<ARRoute> calculateRoute({
    required String schoolId,
    required double startLat,
    required double startLng,
    double? endLat,
    double? endLng,
    String? alertType,
  }) async {
    try {
      final response = await _apiService.post(
        ApiEndpoints.arNavigationRoute,
        data: {
          'schoolId': schoolId,
          'startLat': startLat,
          'startLng': startLng,
          if (endLat != null) 'endLat': endLat,
          if (endLng != null) 'endLng': endLng,
          if (alertType != null) 'alertType': alertType,
        },
      );

      final data = response.data as Map<String, dynamic>;
      final routeData = data['data']?['route'] ?? data['route'] ?? data;

      return ARRoute.fromJson(routeData as Map<String, dynamic>);
    } catch (e) {
      print('❌ Calculate AR route error: $e');
      rethrow;
    }
  }

  /// Get AR markers for a school
  Future<List<ARMarker>> getMarkers({
    required String schoolId,
    String? alertType,
  }) async {
    try {
      final queryParams = <String, dynamic>{};
      if (alertType != null) queryParams['alertType'] = alertType;

      final response = await _apiService.get(
        ApiEndpoints.arNavigationMarkers(schoolId),
        queryParameters: queryParams.isEmpty ? null : queryParams,
      );

      final data = response.data as Map<String, dynamic>;
      final List<dynamic> markersList = (data['data']?['markers'] ??
          data['markers'] ??
          <dynamic>[]) as List<dynamic>;

      return markersList
          .map<ARMarker>((m) => ARMarker.fromJson(m as Map<String, dynamic>))
          .toList();
    } catch (e) {
      print('❌ Get AR markers error: $e');
      rethrow;
    }
  }

  /// Get all safe zones for a school
  Future<List<SafeZone>> getSafeZones({
    required String schoolId,
    String? alertType,
  }) async {
    try {
      final queryParams = <String, dynamic>{};
      if (alertType != null) queryParams['alertType'] = alertType;

      final response = await _apiService.get(
        ApiEndpoints.safeZones(schoolId),
        queryParameters: queryParams.isEmpty ? null : queryParams,
      );

      final data = response.data as Map<String, dynamic>;
      final List<dynamic> zonesList = (data['data']?['safeZones'] ??
          data['safeZones'] ??
          <dynamic>[]) as List<dynamic>;

      return zonesList
          .map<SafeZone>((z) => SafeZone.fromJson(z as Map<String, dynamic>))
          .toList();
    } catch (e) {
      print('❌ Get safe zones error: $e');
      rethrow;
    }
  }

  /// Find nearest safe zone
  Future<SafeZone?> findNearestSafeZone({
    required String schoolId,
    required double lat,
    required double lng,
    String? alertType,
  }) async {
    try {
      final queryParams = <String, dynamic>{
        'schoolId': schoolId,
        'lat': lat.toString(),
        'lng': lng.toString(),
      };
      if (alertType != null) queryParams['alertType'] = alertType;

      final response = await _apiService.get(
        ApiEndpoints.safeZonesNearest,
        queryParameters: queryParams,
      );

      final data = response.data as Map<String, dynamic>;
      final safeZoneData = data['data']?['safeZone'];

      if (safeZoneData == null) return null;

      return SafeZone.fromJson(safeZoneData as Map<String, dynamic>);
    } catch (e) {
      print('❌ Find nearest safe zone error: $e');
      // Return null if no safe zone found (404 is expected)
      if (e.toString().contains('404') ||
          e.toString().contains('No safe zone')) {
        return null;
      }
      rethrow;
    }
  }

  /// Blueprint-based route (indoor) using floor-plan navigation endpoint
  Future<NavigationRouteModel> getBlueprintRoute({
    required String schoolId,
    required double fromX,
    required double fromY,
    required double toX,
    required double toY,
    int? floor,
  }) async {
    return _mapDataService.getNavigationRoute(
      schoolId: schoolId,
      fromX: fromX,
      fromY: fromY,
      toX: toX,
      toY: toY,
      floor: floor,
    );
  }
}
