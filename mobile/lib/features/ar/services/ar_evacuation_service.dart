/// Phase 5.5: AR Evacuation Service
/// Handles AR evacuation path visualization with compass fallback
/// Integrates plane detection, path calculation, and compass mode

import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';
import '../models/waypoint.dart';
import 'compass_fallback_service.dart';
import '../../ar_navigation/services/ar_navigation_service.dart';

/// AR Evacuation Mode
enum AREvacuationMode {
  ar,           // AR mode with plane detection
  compass,      // Compass fallback mode
  unavailable,  // Both unavailable
}

/// AR Plane Detection Status
enum ARPlaneDetectionStatus {
  detecting,    // Currently detecting planes
  detected,     // Planes detected successfully
  failed,       // Plane detection failed
  unavailable,  // AR not available on device
}

/// Phase 5.5: AR Evacuation Service
class AREvacuationService {
  final ARNavigationService _navigationService;
  final CompassFallbackService _compassService;
  
  AREvacuationMode _currentMode = AREvacuationMode.unavailable;
  ARPlaneDetectionStatus _planeDetectionStatus = ARPlaneDetectionStatus.unavailable;
  
  // Path data
  ARPath? _currentPath;
  Position? _currentPosition;
  Waypoint? _nextWaypoint;
  
  // Callbacks
  void Function(AREvacuationMode mode)? onModeChanged;
  void Function(ARPlaneDetectionStatus status)? onPlaneDetectionStatusChanged;
  void Function(ARPath? path)? onPathChanged;
  
  // Timer for plane detection timeout
  Timer? _planeDetectionTimer;
  
  // Plane detection timeout (5 seconds as per spec)
  static const Duration _planeDetectionTimeout = Duration(seconds: 5);
  
  AREvacuationService({
    ARNavigationService? navigationService,
    CompassFallbackService? compassService,
  })  : _navigationService = navigationService ?? ARNavigationService(),
        _compassService = compassService ?? CompassFallbackService();
  
  /// Initialize AR evacuation service
  Future<void> initialize() async {
    try {
      // Initialize compass service (always available)
      await _compassService.initialize();
      
      // Try to initialize AR plane detection
      await _initializeARPlaneDetection();
      
      if (kDebugMode) {
        print('✅ AR Evacuation Service: Initialized - Mode: $_currentMode');
      }
    } catch (e) {
      if (kDebugMode) {
        print('⚠️ AR Evacuation Service: Error initializing: $e');
      }
      
      // Fallback to compass mode if AR fails
      await _switchToCompassMode();
    }
  }
  
  /// Initialize AR plane detection
  Future<void> _initializeARPlaneDetection() async {
    try {
      // Set status to detecting
      _planeDetectionStatus = ARPlaneDetectionStatus.detecting;
      onPlaneDetectionStatusChanged?.call(_planeDetectionStatus);
      
      if (kDebugMode) {
        print('🔍 AR Evacuation Service: Starting plane detection...');
      }
      
      // Start plane detection
      // Note: This would integrate with actual AR plugin when available
      // For now, simulate detection with timeout
      _planeDetectionTimer = Timer(_planeDetectionTimeout, () {
        // Check if planes were detected
        _checkPlaneDetection();
      });
      
      // TODO: Integrate with actual AR plugin plane detection API
      // Example: await arController.startPlaneDetection();
      
    } catch (e) {
      if (kDebugMode) {
        print('⚠️ AR Evacuation Service: AR plane detection not available: $e');
      }
      _planeDetectionStatus = ARPlaneDetectionStatus.unavailable;
      await _switchToCompassMode();
    }
  }
  
  /// Check plane detection status (called after timeout)
  Future<void> _checkPlaneDetection() async {
    // TODO: Check with AR plugin if planes were detected
    // For now, assume AR is not available (will use compass fallback)
    
    const planesDetected = 0; // Would come from AR plugin
    
    if (planesDetected > 0) {
      _planeDetectionStatus = ARPlaneDetectionStatus.detected;
      _currentMode = AREvacuationMode.ar;
      
      if (kDebugMode) {
        print('✅ AR Evacuation Service: Planes detected - Using AR mode');
      }
    } else {
      _planeDetectionStatus = ARPlaneDetectionStatus.failed;
      
      if (kDebugMode) {
        print('⚠️ AR Evacuation Service: No planes detected - Switching to compass mode');
      }
      
      await _switchToCompassMode();
    }
    
    onPlaneDetectionStatusChanged?.call(_planeDetectionStatus);
    onModeChanged?.call(_currentMode);
  }
  
  /// Switch to compass fallback mode
  Future<void> _switchToCompassMode() async {
    _currentMode = AREvacuationMode.compass;
    onModeChanged?.call(_currentMode);
    
    if (kDebugMode) {
      print('🧭 AR Evacuation Service: Switched to compass fallback mode');
    }
  }
  
  /// Load evacuation path for school
  Future<ARPath?> loadEvacuationPath({
    required String schoolId,
    Position? startPosition,
    String? alertType,
  }) async {
    try {
      // Get current position if not provided
      Position position = startPosition ?? await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );
      
      _currentPosition = position;
      
      // Get nearest safe zone and calculate route
      final safeZone = await _navigationService.findNearestSafeZone(
        schoolId: schoolId,
        lat: position.latitude,
        lng: position.longitude,
        alertType: alertType,
      );
      
      if (safeZone == null) {
        if (kDebugMode) {
          print('⚠️ AR Evacuation Service: No safe zone found for school');
        }
        return null;
      }
      
      // Calculate route to safe zone
      final route = await _navigationService.calculateRoute(
        schoolId: schoolId,
        startLat: position.latitude,
        startLng: position.longitude,
        endLat: safeZone.location.lat,
        endLng: safeZone.location.lng,
        alertType: alertType,
      );
      
      // Convert route to ARPath with waypoints
      final waypoints = route.waypoints.map((wp) {
        return Waypoint(
          id: wp.name ?? wp.type ?? 'waypoint_${route.waypoints.indexOf(wp)}',
          name: wp.name ?? 'Waypoint ${route.waypoints.indexOf(wp) + 1}',
          position: Position(
            latitude: wp.lat,
            longitude: wp.lng,
            timestamp: DateTime.now(),
            accuracy: 0.0,
            altitude: 0.0,
            altitudeAccuracy: 0.0,
            heading: 0.0,
            headingAccuracy: 0.0,
            speed: 0.0,
            speedAccuracy: 0.0,
          ),
          order: route.waypoints.indexOf(wp),
        );
      }).toList();
      
      // Add safe zone as final waypoint
      final safeZoneWaypoint = Waypoint(
        id: safeZone.zoneId,
        name: safeZone.name,
        position: Position(
          latitude: safeZone.location.lat,
          longitude: safeZone.location.lng,
          timestamp: DateTime.now(),
          accuracy: 0.0,
          altitude: 0.0,
          altitudeAccuracy: 0.0,
          heading: 0.0,
          headingAccuracy: 0.0,
          speed: 0.0,
          speedAccuracy: 0.0,
        ),
        order: waypoints.length,
        description: safeZone.description,
        isSafeZone: true,
      );
      
      // Create AR path
      final path = ARPath(
        id: route.routeId,
        name: 'Evacuation Path to ${safeZone.name}',
        waypoints: waypoints,
        safeZone: safeZoneWaypoint,
        schoolId: schoolId,
      );
      
      _currentPath = path;
      _nextWaypoint = waypoints.isNotEmpty
          ? (waypoints.length > 1 ? waypoints[1] : safeZoneWaypoint)
          : safeZoneWaypoint;
      
      onPathChanged?.call(path);
      
      if (kDebugMode) {
        print('✅ AR Evacuation Service: Path loaded - ${waypoints.length} waypoints, ${path.totalDistance.toInt()}m');
      }
      
      return path;
    } catch (e) {
      if (kDebugMode) {
        print('⚠️ AR Evacuation Service: Error loading path: $e');
      }
      return null;
    }
  }
  
  /// Update current position and recalculate navigation
  Future<void> updatePosition(Position position) async {
    _currentPosition = position;
    
    // Update current/next waypoint based on proximity
    if (_currentPath != null && _currentPosition != null) {
      _updateWaypoints();
    }
  }
  
  /// Update current and next waypoints based on position
  void _updateWaypoints() {
    if (_currentPath == null || _currentPosition == null) return;
    
    // Find closest waypoint
    double minDistance = double.infinity;
    Waypoint? closestWaypoint;
    int closestIndex = -1;
    
    for (int i = 0; i < _currentPath!.waypoints.length; i++) {
      final waypoint = _currentPath!.waypoints[i];
      final distance = Geolocator.distanceBetween(
        _currentPosition!.latitude,
        _currentPosition!.longitude,
        waypoint.position.latitude,
        waypoint.position.longitude,
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        closestWaypoint = waypoint;
        closestIndex = i;
      }
    }
    
    // Check if we're close enough to a waypoint (within 10 meters)
    if (minDistance < 10 && closestWaypoint != null) {
      // Move to next waypoint
      if (closestIndex < _currentPath!.waypoints.length - 1) {
        _nextWaypoint = _currentPath!.waypoints[closestIndex + 1];
      } else {
        // Reached last waypoint, head to safe zone
        _nextWaypoint = _currentPath!.safeZone;
      }
    }
    // If not close to any waypoint, keep current nextWaypoint
  }
  
  /// Get navigation data for compass mode
  Future<CompassNavigationData?> getCompassNavigationData() async {
    if (_currentPosition == null || _nextWaypoint == null) {
      return null;
    }
    
    try {
      final targetBearing = await _compassService.calculateBearingToWaypoint(
        target: _nextWaypoint!,
        currentPosition: _currentPosition!,
      );
      
      final currentHeading = await _compassService.getTrueHeading();
      final relativeBearing = _compassService.calculateRelativeBearing(
        targetBearing,
        currentHeading,
      );
      
      final distance = _compassService.calculateDistanceToWaypoint(
        target: _nextWaypoint!,
        currentPosition: _currentPosition!,
      );
      
      return CompassNavigationData(
        targetBearing: targetBearing,
        currentHeading: currentHeading,
        relativeBearing: relativeBearing,
        distance: distance,
        cardinalDirection: _compassService.getCardinalDirection(targetBearing),
        waypoint: _nextWaypoint!,
      );
    } catch (e) {
      if (kDebugMode) {
        print('⚠️ AR Evacuation Service: Error getting compass data: $e');
      }
      return null;
    }
  }
  
  /// Get current mode
  AREvacuationMode get currentMode => _currentMode;
  
  /// Get plane detection status
  ARPlaneDetectionStatus get planeDetectionStatus => _planeDetectionStatus;
  
  /// Get current path
  ARPath? get currentPath => _currentPath;
  
  /// Get current position
  Position? get currentPosition => _currentPosition;
  
  /// Get next waypoint
  Waypoint? get nextWaypoint => _nextWaypoint;
  
  /// Dispose resources
  void dispose() {
    _planeDetectionTimer?.cancel();
    _compassService.dispose();
  }
}

/// Compass Navigation Data
class CompassNavigationData {
  final double targetBearing;      // Bearing to target (0-360)
  final double currentHeading;     // Current device heading (0-360)
  final double relativeBearing;    // Relative bearing (-180 to 180)
  final double distance;           // Distance to target in meters
  final String cardinalDirection;  // Cardinal direction (N, NE, E, etc.)
  final Waypoint waypoint;         // Target waypoint
  
  CompassNavigationData({
    required this.targetBearing,
    required this.currentHeading,
    required this.relativeBearing,
    required this.distance,
    required this.cardinalDirection,
    required this.waypoint,
  });
  
  /// Get turn direction description
  String get turnDirection {
    if (relativeBearing.abs() < 10) {
      return 'Straight';
    } else if (relativeBearing > 0) {
      return 'Turn Right';
    } else {
      return 'Turn Left';
    }
  }
  
  /// Get formatted distance
  String get formattedDistance {
    if (distance < 1000) {
      return '${distance.toInt()}m';
    }
    return '${(distance / 1000).toStringAsFixed(1)}km';
  }
  
  /// Get estimated time (walking at 5 km/h)
  String get estimatedTime {
    final hours = distance / 5000.0; // 5 km/h = 5000 m/h
    final minutes = (hours * 60).round();
    if (minutes < 1) {
      return '< 1 min';
    }
    return '$minutes min';
  }
}

