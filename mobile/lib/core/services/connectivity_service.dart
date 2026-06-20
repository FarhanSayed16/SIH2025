import 'package:connectivity_plus/connectivity_plus.dart';
import 'dart:async';

/// Connectivity Service - Monitors network connectivity
class ConnectivityService {
  final Connectivity _connectivity = Connectivity();
  StreamSubscription<ConnectivityResult>? _connectivitySubscription;
  bool _isConnected = false;
  ConnectivityResult? _currentResult;

  // Callbacks
  void Function(bool)? onConnectivityChanged;
  void Function(bool)? onOnline;
  void Function(bool)? onOffline;

  bool get isConnected => _isConnected;
  ConnectivityResult? get currentResult => _currentResult;

  /// Initialize connectivity monitoring
  void initialize() {
    _checkConnectivity();
    _connectivitySubscription = _connectivity.onConnectivityChanged.listen(
      (ConnectivityResult result) {
        _updateConnectionStatus(result);
      },
    );
  }

  /// Check current connectivity
  Future<void> _checkConnectivity() async {
    final result = await _connectivity.checkConnectivity();
    _updateConnectionStatus(result);
  }

  /// Update connection status
  void _updateConnectionStatus(ConnectivityResult result) {
    final wasConnected = _isConnected;
    _currentResult = result;
    
    _isConnected = result != ConnectivityResult.none;

    // Trigger callbacks
    onConnectivityChanged?.call(_isConnected);
    
    if (!wasConnected && _isConnected) {
      onOnline?.call(true);
    } else if (wasConnected && !_isConnected) {
      onOffline?.call(true);
    }
  }

  /// Check if currently online
  Future<bool> checkOnline() async {
    final result = await _connectivity.checkConnectivity();
    return result != ConnectivityResult.none;
  }

  /// Dispose
  void dispose() {
    _connectivitySubscription?.cancel();
    _connectivitySubscription = null;
  }
}
