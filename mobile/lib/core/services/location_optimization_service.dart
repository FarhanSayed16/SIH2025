/// Phase 3.5.3: Location Optimization Service
/// Optimizes location tracking for battery efficiency

import 'dart:async';
import 'package:geolocator/geolocator.dart';
import 'battery_optimization_service.dart';

class LocationOptimizationService {
  final BatteryOptimizationService _batteryService;
  
  StreamSubscription<Position>? _positionSubscription;
  Position? _lastKnownPosition;
  DateTime? _lastUpdateTime;
  Timer? _locationUpdateTimer;
  
  // Location update intervals based on battery
  static const Duration defaultInterval = Duration(minutes: 5);
  static const Duration lowBatteryInterval = Duration(minutes: 15);
  static const Duration criticalBatteryInterval = Duration(minutes: 30);
  
  // Distance threshold (in meters) - only update if moved significantly
  static const int distanceThreshold = 50; // 50 meters

  LocationOptimizationService({
    BatteryOptimizationService? batteryService,
  }) : _batteryService = batteryService ?? BatteryOptimizationService();

  /// Get last known position
  Position? get lastKnownPosition => _lastKnownPosition;

  /// Start optimized location tracking
  /// Phase 3.5.3: Battery-aware location updates
  Future<void> startLocationTracking({
    required void Function(Position) onLocationUpdate,
    Duration? interval,
  }) async {
    // Check if location permissions are granted
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      throw Exception('Location services are disabled');
    }

    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        throw Exception('Location permissions are denied');
      }
    }

    if (permission == LocationPermission.deniedForever) {
      throw Exception('Location permissions are permanently denied');
    }

    // Phase 3.5.3: Get recommended interval based on battery
    final recommendedInterval = interval ?? await _batteryService.getRecommendedLocationInterval();

    // Get recommended accuracy based on battery
    final accuracy = await _getRecommendedAccuracy();
    
    // Start location stream with optimized settings
    _positionSubscription = Geolocator.getPositionStream(
      locationSettings: LocationSettings(
        accuracy: accuracy,
        distanceFilter: distanceThreshold, // Only update if moved 50m
        timeLimit: recommendedInterval,
      ),
    ).listen(
      (Position position) {
        // Phase 3.5.3: Check if position changed significantly
        if (_shouldUpdateLocation(position)) {
          _lastKnownPosition = position;
          _lastUpdateTime = DateTime.now();
          onLocationUpdate(position);
        }
      },
      onError: (Object error) {
        print('Location tracking error: $error');
      },
    );
  }

  /// Stop location tracking
  void stopLocationTracking() {
    _positionSubscription?.cancel();
    _positionSubscription = null;
    _locationUpdateTimer?.cancel();
    _locationUpdateTimer = null;
  }

  /// Get recommended accuracy based on battery
  Future<LocationAccuracy> _getRecommendedAccuracy() async {
    final batteryLow = await _batteryService.isBatteryLow();
    if (batteryLow) {
      return LocationAccuracy.low; // Lower accuracy when battery is low
    }
    return LocationAccuracy.medium; // Medium accuracy for balance
  }

  /// Check if location should be updated
  bool _shouldUpdateLocation(Position newPosition) {
    if (_lastKnownPosition == null) {
      return true; // First update
    }

    // Calculate distance from last known position
    final distance = Geolocator.distanceBetween(
      _lastKnownPosition!.latitude,
      _lastKnownPosition!.longitude,
      newPosition.latitude,
      newPosition.longitude,
    );

    // Only update if moved more than threshold
    return distance >= distanceThreshold;
  }

  /// Get current position (one-time)
  /// Phase 3.5.3: Optimized for battery
  Future<Position?> getCurrentPosition() async {
    try {
      // Check if should perform battery-intensive operation
      if (!await _batteryService.shouldPerformBatteryIntensiveOperation()) {
        // Return cached position if available
        if (_lastKnownPosition != null) {
          final age = DateTime.now().difference(_lastUpdateTime ?? DateTime.now());
          if (age.inMinutes < 15) {
            // Cached position is recent enough
            return _lastKnownPosition;
          }
        }
        return null; // Battery too low, skip update
      }

      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        return _lastKnownPosition; // Return cached
      }

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied ||
          permission == LocationPermission.deniedForever) {
        return _lastKnownPosition; // Return cached
      }

      // Get position with optimized accuracy
      final accuracy = await _getRecommendedAccuracy();
      final position = await Geolocator.getCurrentPosition(
        desiredAccuracy: accuracy,
      );

      _lastKnownPosition = position;
      _lastUpdateTime = DateTime.now();
      return position;
    } catch (e) {
      print('Error getting current position: $e');
      return _lastKnownPosition; // Return cached on error
    }
  }

  /// Check if location services are available
  Future<bool> isLocationServiceEnabled() async {
    return await Geolocator.isLocationServiceEnabled();
  }

  /// Dispose resources
  void dispose() {
    stopLocationTracking();
    _batteryService.dispose();
  }
}

