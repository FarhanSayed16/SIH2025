/// Phase 5.2: Battery-Aware Mesh Manager
/// Manages mesh networking duty cycles based on battery level and alert status
/// Implements the Battery Preservation Protocol

import 'dart:async';
import '../../../core/services/battery_optimization_service.dart';
import '../services/mesh_service.dart';
import 'package:flutter/foundation.dart';

/// Duty cycle modes for mesh networking
enum DutyCycleMode {
  highAlert,    // 100% duty cycle - continuous scan/advertise
  lowAlert,     // 2% duty cycle - scan 5 seconds every 5 minutes
  batterySaver, // 0% advertising - only listen (stop advertising)
}

/// Battery-Aware Mesh Manager - Phase 5.2
/// Implements smart duty cycling to preserve battery while maintaining connectivity
class BatteryAwareMeshManager {
  final MeshService _meshService;
  final BatteryOptimizationService _batteryService;

  DutyCycleMode _currentMode = DutyCycleMode.lowAlert;
  Timer? _dutyCycleTimer;
  Timer? _lowAlertScanTimer;
  bool _hasActiveAlert = false;
  bool _isMonitoring = false;

  // Event controller for mode changes
  final StreamController<DutyCycleMode> _modeController =
      StreamController<DutyCycleMode>.broadcast();

  // Getters
  DutyCycleMode get currentMode => _currentMode;
  Stream<DutyCycleMode> get onModeChanged => _modeController.stream;

  BatteryAwareMeshManager({
    required MeshService meshService,
    BatteryOptimizationService? batteryService,
  })  : _meshService = meshService,
        _batteryService = batteryService ?? BatteryOptimizationService();

  /// Start monitoring and apply duty cycle
  Future<void> start() async {
    if (_isMonitoring) return;

    _isMonitoring = true;

    // Initial duty cycle application
    await _applyDutyCycle();

    // Check every 30 seconds for mode changes
    _dutyCycleTimer = Timer.periodic(
      const Duration(seconds: 30),
      (_) => _updateDutyCycle(),
    );
  }

  /// Stop monitoring
  Future<void> stop() async {
    _isMonitoring = false;
    _dutyCycleTimer?.cancel();
    _lowAlertScanTimer?.cancel();
    
    // Stop all mesh activities
    await _meshService.stopAll();
  }

  /// Set active alert status (called when crisis alert is received/cleared)
  Future<void> setActiveAlert(bool hasActiveAlert) async {
    if (_hasActiveAlert != hasActiveAlert) {
      _hasActiveAlert = hasActiveAlert;
      await _updateDutyCycle();
    }
  }

  /// Update duty cycle based on current conditions
  Future<void> _updateDutyCycle() async {
    final newMode = await _determineMode();
    
    if (newMode != _currentMode) {
      _currentMode = newMode;
      _modeController.add(_currentMode);
      await _applyDutyCycle();
      
      if (kDebugMode) {
        print('🔋 Mesh Duty Cycle: Changed to ${_currentMode.toString().split('.').last}');
      }
    }
  }

  /// Determine current duty cycle mode
  Future<DutyCycleMode> _determineMode() async {
    // Check for active alert first (highest priority)
    if (_hasActiveAlert) {
      return DutyCycleMode.highAlert;
    }

    // Check battery level
    final batteryLevel = await _batteryService.getBatteryLevel();
    
    if (batteryLevel != null && batteryLevel < 15) {
      return DutyCycleMode.batterySaver;
    }

    // Default to low alert mode (peace time)
    return DutyCycleMode.lowAlert;
  }

  /// Apply duty cycle based on current mode
  Future<void> _applyDutyCycle() async {
    // Cancel any existing low alert timer
    _lowAlertScanTimer?.cancel();

    switch (_currentMode) {
      case DutyCycleMode.highAlert:
        // 100% duty cycle - continuous advertising and discovery
        await _meshService.startAdvertising();
        await _meshService.startDiscovery();
        
        if (kDebugMode) {
          print('🔋 Mesh: High Alert Mode - Continuous operation');
        }
        break;

      case DutyCycleMode.lowAlert:
        // 2% duty cycle - scan for 5 seconds every 5 minutes
        // Keep advertising running, but discovery only periodic
        await _meshService.startAdvertising();
        
        // Start periodic discovery
        _lowAlertScanTimer = Timer.periodic(
          const Duration(minutes: 5),
          (_) => _performLowAlertScan(),
        );
        
        // Initial scan
        _performLowAlertScan();
        
        if (kDebugMode) {
          print('🔋 Mesh: Low Alert Mode - Periodic scanning (2% duty cycle)');
        }
        break;

      case DutyCycleMode.batterySaver:
        // Stop advertising, keep discovery minimal
        await _meshService.stopAdvertising();
        
        // Very minimal discovery - scan for 3 seconds every 10 minutes
        _lowAlertScanTimer = Timer.periodic(
          const Duration(minutes: 10),
          (_) => _performBatterySaverScan(),
        );
        
        // Initial scan
        _performBatterySaverScan();
        
        if (kDebugMode) {
          print('🔋 Mesh: Battery Saver Mode - Listen only (minimal scan)');
        }
        break;
    }
  }

  /// Perform low alert scan (5 seconds every 5 minutes)
  Future<void> _performLowAlertScan() async {
    try {
      await _meshService.startDiscovery();
      
      // Stop after 5 seconds
      Future.delayed(const Duration(seconds: 5), () {
        _meshService.stopDiscovery();
      });
    } catch (e) {
      if (kDebugMode) {
        print('⚠️ Mesh: Error in low alert scan: $e');
      }
    }
  }

  /// Perform battery saver scan (3 seconds every 10 minutes)
  Future<void> _performBatterySaverScan() async {
    try {
      await _meshService.startDiscovery();
      
      // Stop after 3 seconds
      Future.delayed(const Duration(seconds: 3), () {
        _meshService.stopDiscovery();
      });
    } catch (e) {
      if (kDebugMode) {
        print('⚠️ Mesh: Error in battery saver scan: $e');
      }
    }
  }

  /// Get current mode description
  String getModeDescription() {
    switch (_currentMode) {
      case DutyCycleMode.highAlert:
        return 'High Alert - Continuous (100% duty cycle)';
      case DutyCycleMode.lowAlert:
        return 'Peace Mode - Periodic (2% duty cycle)';
      case DutyCycleMode.batterySaver:
        return 'Battery Saver - Listen Only';
    }
  }

  /// Dispose resources
  void dispose() {
    stop();
    _modeController.close();
  }
}

