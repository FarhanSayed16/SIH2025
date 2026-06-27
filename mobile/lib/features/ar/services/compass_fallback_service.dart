/// Phase 5.5: Compass Fallback Service
/// Provides compass-based navigation when AR plane detection fails
/// Add-On 2: Anchor-less AR Fallback (Compass Mode)

import 'dart:async';
import 'dart:math' as math;
import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';
import 'package:sensors_plus/sensors_plus.dart';
import '../models/waypoint.dart';

/// Compass Fallback Mode
enum CompassMode {
  ar,      // AR mode active (plane detection working)
  compass, // Compass mode (fallback when AR fails)
  unavailable, // Both AR and compass unavailable
}

/// Compass Fallback Service
class CompassFallbackService {
  StreamSubscription<MagnetometerEvent>? _magnetometerSubscription;
  StreamSubscription<AccelerometerEvent>? _accelerometerSubscription;
  
  double _magneticHeading = 0.0; // Device heading in degrees (0-360)
  double _trueHeading = 0.0; // True north heading
  bool _isInitialized = false;
  
  // Callback when heading changes
  void Function(double heading)? onHeadingChanged;
  
  /// Initialize compass service
  Future<void> initialize() async {
    if (_isInitialized) return;
    
    try {
      // Check if magnetometer is available
      await _startCompass();
      _isInitialized = true;
      
      if (kDebugMode) {
        print('✅ Compass Fallback Service: Initialized successfully');
      }
    } catch (e) {
      if (kDebugMode) {
        print('⚠️ Compass Fallback Service: Error initializing: $e');
      }
      _isInitialized = false;
    }
  }
  
  /// Start compass tracking
  Future<void> _startCompass() async {
    // Listen to magnetometer for heading calculation
    _magnetometerSubscription = magnetometerEventStream().listen((event) {
      // Calculate heading from magnetometer data
      _updateHeading(event.x, event.y);
    }, onError: (Object e) {
      if (kDebugMode) {
        print('⚠️ Compass: Magnetometer error: $e');
      }
    });
    
    // Also listen to accelerometer for tilt correction
    _accelerometerSubscription = accelerometerEventStream().listen((event) {
      // Can be used for tilt compensation (advanced)
    }, onError: (Object e) {
      if (kDebugMode) {
        print('⚠️ Compass: Accelerometer error: $e');
      }
    });
  }
  
  /// Update heading from magnetometer data
  void _updateHeading(double magX, double magY) {
    // Calculate heading in radians
    double headingRad = math.atan2(magY, magX);
    
    // Convert to degrees (0-360)
    double headingDeg = headingRad * (180 / 3.141592653589793);
    headingDeg = (headingDeg + 360) % 360; // Normalize to 0-360
    
    _magneticHeading = headingDeg;
    
    // Notify listeners
    onHeadingChanged?.call(_magneticHeading);
  }
  
  /// Get current heading in degrees (0-360)
  double get heading => _magneticHeading;
  
  /// Get true heading (with magnetic declination correction)
  /// Note: Magnetic declination calculation would require external service
  /// For now, return magnetic heading as approximation
  Future<double> getTrueHeading() async {
    try {
      // TODO: Calculate magnetic declination if needed
      // For now, magnetic heading is sufficient for navigation
      _trueHeading = _magneticHeading;
      return _trueHeading;
    } catch (e) {
      if (kDebugMode) {
        print('⚠️ Compass: Error getting true heading: $e');
      }
      return _magneticHeading; // Fallback to magnetic heading
    }
  }
  
  /// Calculate bearing to target waypoint
  Future<double> calculateBearingToWaypoint({
    required Waypoint target,
    required Position currentPosition,
  }) async {
    final bearing = Geolocator.bearingBetween(
      currentPosition.latitude,
      currentPosition.longitude,
      target.position.latitude,
      target.position.longitude,
    );
    
    // Normalize to 0-360
    return (bearing + 360) % 360;
  }
  
  /// Calculate relative bearing (direction to turn)
  /// Returns positive for clockwise, negative for counter-clockwise
  double calculateRelativeBearing(double targetBearing, double currentHeading) {
    double relative = targetBearing - currentHeading;
    
    // Normalize to -180 to 180
    if (relative > 180) {
      relative -= 360;
    } else if (relative < -180) {
      relative += 360;
    }
    
    return relative;
  }
  
  /// Get cardinal direction (N, NE, E, SE, S, SW, W, NW)
  String getCardinalDirection(double heading) {
    final directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    final index = ((heading + 22.5) / 45).floor() % 8;
    return directions[index];
  }
  
  /// Calculate distance to waypoint in meters
  double calculateDistanceToWaypoint({
    required Waypoint target,
    required Position currentPosition,
  }) {
    return Geolocator.distanceBetween(
      currentPosition.latitude,
      currentPosition.longitude,
      target.position.latitude,
      target.position.longitude,
    );
  }
  
  /// Dispose resources
  void dispose() {
    _magnetometerSubscription?.cancel();
    _accelerometerSubscription?.cancel();
    _isInitialized = false;
    
    if (kDebugMode) {
      print('🔄 Compass Fallback Service: Disposed');
    }
  }
  
  /// Check if compass is available
  bool get isAvailable => _isInitialized;
}

