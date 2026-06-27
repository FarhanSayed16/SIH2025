/// Phase 5.6: AR Fire Simulation Service
/// Manages virtual fire placement, extinguishing, and scoring

import 'dart:async';
import 'dart:math';
import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';
import '../models/fire_instance.dart';
import '../../drills/services/drill_service.dart';
import '../../drills/models/drill_model.dart';

/// Phase 5.6: AR Fire Simulation Service
class ARFireSimulationService {
  final DrillService _drillService;
  
  // Active fires
  final Map<String, FireInstance> _activeFires = {};
  
  // Simulation results
  final List<FireSimulationResult> _results = [];
  
  // Current drill
  DrillModel? _currentDrill;
  
  // Position tracking
  Position? _currentPosition;
  Timer? _positionUpdateTimer;
  
  // Callbacks
  void Function(List<FireInstance> fires)? onFiresChanged;
  void Function(FireInstance fire)? onFireExtinguished;
  void Function(FireSimulationResult result)? onResultRecorded;
  
  ARFireSimulationService({
    DrillService? drillService,
  })  : _drillService = drillService ?? DrillService();

  /// Initialize fire simulation for a drill
  Future<void> initializeDrill(String drillId) async {
    try {
      _currentDrill = await _drillService.getDrillById(drillId);
      if (_currentDrill == null) {
        throw Exception('Drill not found: $drillId');
      }
      
      if (kDebugMode) {
        print('✅ AR Fire Simulation: Initialized for drill ${_currentDrill!.id}');
      }
      
      // Start position updates
      _startPositionUpdates();
    } catch (e) {
      if (kDebugMode) {
        print('⚠️ AR Fire Simulation: Error initializing drill: $e');
      }
      rethrow;
    }
  }

  /// Start position tracking
  void _startPositionUpdates() {
    _positionUpdateTimer?.cancel();
    _positionUpdateTimer = Timer.periodic(
      const Duration(seconds: 2),
      (timer) async {
        try {
          final position = await Geolocator.getCurrentPosition(
            desiredAccuracy: LocationAccuracy.high,
          );
          _currentPosition = position;
        } catch (e) {
          if (kDebugMode) {
            print('⚠️ AR Fire Simulation: Error updating position: $e');
          }
        }
      },
    );
  }

  /// Place a virtual fire at current position (Teacher Mode)
  Future<FireInstance?> placeFire({
    String? fireId,
    Position? position,
    Map<String, dynamic>? arAnchor,
  }) async {
    if (_currentDrill == null) {
      throw Exception('No drill initialized. Call initializeDrill first.');
    }
    
    try {
      final firePosition = position ?? _currentPosition;
      if (firePosition == null) {
        throw Exception('No position available. Wait for GPS fix.');
      }
      
      final fire = FireInstance(
        id: fireId ?? _generateFireId(),
        drillId: _currentDrill!.id,
        position: firePosition,
        spawnTime: DateTime.now(),
        state: FireState.burning,
        arAnchor: arAnchor,
      );
      
      _activeFires[fire.id] = fire;
      
      // Notify listeners
      onFiresChanged?.call(_activeFires.values.toList());
      
      if (kDebugMode) {
        print('🔥 AR Fire Simulation: Fire placed at ${firePosition.latitude}, ${firePosition.longitude}');
      }
      
      return fire;
    } catch (e) {
      if (kDebugMode) {
        print('⚠️ AR Fire Simulation: Error placing fire: $e');
      }
      return null;
    }
  }

  /// Place multiple fires (Teacher Mode)
  Future<List<FireInstance>> placeMultipleFires({
    required List<Position> positions,
    List<Map<String, dynamic>>? arAnchors,
  }) async {
    final fires = <FireInstance>[];
    
    for (int i = 0; i < positions.length; i++) {
      final fire = await placeFire(
        position: positions[i],
        arAnchor: arAnchors != null && i < arAnchors.length ? arAnchors[i] : null,
      );
      if (fire != null) {
        fires.add(fire);
      }
    }
    
    return fires;
  }

  /// Extinguish a fire (Student Mode)
  Future<FireSimulationResult?> extinguishFire({
    required String fireId,
    String? userId,
  }) async {
    if (_currentDrill == null) {
      throw Exception('No drill initialized.');
    }
    
    final fire = _activeFires[fireId];
    if (fire == null) {
      if (kDebugMode) {
        print('⚠️ AR Fire Simulation: Fire not found: $fireId');
      }
      return null;
    }
    
    if (fire.isExtinguished) {
      if (kDebugMode) {
        print('ℹ️ AR Fire Simulation: Fire already extinguished: $fireId');
      }
      return null;
    }
    
    try {
      // Update fire state to extinguishing
      final extinguishingFire = fire.copyWith(
        state: FireState.extinguishing,
      );
      _activeFires[fireId] = extinguishingFire;
      onFiresChanged?.call(_activeFires.values.toList());
      
      // Simulate extinguishing animation (3 seconds)
      await Future<void>.delayed(const Duration(seconds: 3));
      
      // Calculate score
      final extinguishTime = DateTime.now();
      final timeToExtinguish = extinguishTime.difference(fire.spawnTime);
      final score = _calculateScore(timeToExtinguish);
      
      // Update fire to extinguished
      final extinguishedFire = fire.copyWith(
        state: FireState.extinguished,
        extinguishTime: extinguishTime,
        extinguishedBy: userId,
        score: score,
      );
      _activeFires[fireId] = extinguishedFire;
      
      // Create result
      final result = FireSimulationResult(
        fireId: fireId,
        drillId: _currentDrill!.id,
        userId: userId,
        score: score,
        timeToExtinguish: timeToExtinguish,
        completedAt: extinguishTime,
      );
      
      _results.add(result);
      
      // Notify listeners
      onFireExtinguished?.call(extinguishedFire);
      onFiresChanged?.call(_activeFires.values.toList());
      onResultRecorded?.call(result);
      
      if (kDebugMode) {
        print('✅ AR Fire Simulation: Fire extinguished - Score: $score, Time: ${timeToExtinguish.inSeconds}s');
      }
      
      // Sync result to backend (queue if offline)
      await _syncResult(result);
      
      return result;
    } catch (e) {
      if (kDebugMode) {
        print('⚠️ AR Fire Simulation: Error extinguishing fire: $e');
      }
      return null;
    }
  }

  /// Calculate score based on time to extinguish
  /// Faster = more points (max 1000 points)
  int _calculateScore(Duration timeToExtinguish) {
    // Base score: 1000 points
    // Deduct 10 points per second
    // Minimum: 100 points
    final seconds = timeToExtinguish.inSeconds;
    final score = max(100, 1000 - (seconds * 10));
    return score;
  }

  /// Sync result to backend
  Future<void> _syncResult(FireSimulationResult result) async {
    try {
      // TODO: Implement offline queue if needed
      // For now, try to sync immediately
      if (_currentDrill != null) {
        // Update drill completion with score
        await _drillService.completeDrill(
          drillId: _currentDrill!.id,
          evacuationTime: result.timeToExtinguish.inSeconds,
          score: result.score,
        );
      }
    } catch (e) {
      if (kDebugMode) {
        print('⚠️ AR Fire Simulation: Error syncing result: $e');
      }
      // TODO: Queue for offline sync
    }
  }

  /// Get active fires
  List<FireInstance> getActiveFires() {
    return _activeFires.values.where((f) => f.isBurning).toList();
  }

  /// Get all fires (including extinguished)
  List<FireInstance> getAllFires() {
    return _activeFires.values.toList();
  }

  /// Get nearest fire to current position
  FireInstance? getNearestFire() {
    if (_currentPosition == null || _activeFires.isEmpty) {
      return null;
    }
    
    double minDistance = double.infinity;
    FireInstance? nearestFire;
    
    for (final fire in _activeFires.values.where((f) => f.isBurning)) {
      final distance = fire.distanceTo(_currentPosition!);
      if (distance < minDistance) {
        minDistance = distance;
        nearestFire = fire;
      }
    }
    
    return nearestFire;
  }

  /// Get simulation statistics
  Map<String, dynamic> getStatistics() {
    final activeCount = _activeFires.values.where((f) => f.isBurning).length;
    final extinguishedCount = _activeFires.values.where((f) => f.isExtinguished).length;
    final totalScore = _results.fold<int>(0, (sum, r) => sum + r.score);
    final avgScore = _results.isEmpty ? 0 : (totalScore / _results.length).round();
    
    return {
      'activeFires': activeCount,
      'extinguishedFires': extinguishedCount,
      'totalFires': _activeFires.length,
      'totalResults': _results.length,
      'totalScore': totalScore,
      'averageScore': avgScore,
    };
  }

  /// Clear all fires
  void clearAllFires() {
    _activeFires.clear();
    onFiresChanged?.call([]);
  }

  /// Generate unique fire ID
  String _generateFireId() {
    return 'fire_${DateTime.now().millisecondsSinceEpoch}_${Random().nextInt(10000)}';
  }

  /// Dispose resources
  void dispose() {
    _positionUpdateTimer?.cancel();
    _activeFires.clear();
    _results.clear();
  }
}

