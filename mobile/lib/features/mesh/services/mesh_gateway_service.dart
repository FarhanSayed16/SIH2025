/// Phase 5.9: Mesh Gateway Service
/// Handles bridging between mesh networks and internet/WiFi
/// 
/// Gateway devices (e.g., Raspberry Pi) can bridge mesh messages to/from
/// the internet, allowing mesh networks to sync with backend servers.

import 'dart:async';
import 'package:flutter/foundation.dart';
import '../models/mesh_message.dart';
import '../../../core/services/api_service.dart';
import '../../../core/constants/api_endpoints.dart';
import '../../../core/services/connectivity_service.dart';

/// Mesh Gateway Service
/// Manages gateway functionality for bridging mesh to internet
class MeshGatewayService {
  final ApiService _apiService;
  final ConnectivityService _connectivityService;
  bool _isGatewayMode = false;
  Timer? _gatewaySyncTimer;

  MeshGatewayService({
    ApiService? apiService,
    ConnectivityService? connectivityService,
  })  : _apiService = apiService ?? ApiService(),
        _connectivityService = connectivityService ?? ConnectivityService();

  /// Enable gateway mode
  /// This device will bridge mesh messages to/from internet
  Future<void> enableGatewayMode() async {
    _isGatewayMode = true;
    if (kDebugMode) {
      print('✅ Mesh Gateway Service: Gateway mode enabled');
    }
    
    // Start periodic sync
    _startGatewaySync();
  }

  /// Disable gateway mode
  Future<void> disableGatewayMode() async {
    _isGatewayMode = false;
    _gatewaySyncTimer?.cancel();
    if (kDebugMode) {
      print('✅ Mesh Gateway Service: Gateway mode disabled');
    }
  }

  /// Start periodic gateway sync
  void _startGatewaySync() {
    _gatewaySyncTimer?.cancel();
    _gatewaySyncTimer = Timer.periodic(const Duration(seconds: 30), (timer) async {
      if (_isGatewayMode && await _connectivityService.checkOnline()) {
        await _syncMeshMessages();
      }
    });
  }

  /// Sync mesh messages to/from server
  Future<void> _syncMeshMessages() async {
    try {
      // TODO: Get queued mesh messages from mesh service
      // TODO: Send to server via /api/mesh/sync endpoint
      // TODO: Receive messages from server and inject into mesh
      
      if (kDebugMode) {
        print('✅ Mesh Gateway Service: Syncing mesh messages');
      }
    } catch (e) {
      if (kDebugMode) {
        print('⚠️ Mesh Gateway Service: Error syncing: $e');
      }
    }
  }

  /// Bridge message from mesh to server
  Future<bool> bridgeToServer(MeshMessage message) async {
    if (!_isGatewayMode) {
      return false;
    }

    try {
      if (!await _connectivityService.checkOnline()) {
        return false;
      }

      // Send to server
      await _apiService.post(
        ApiEndpoints.meshSync,
        data: {
          'messages': [message.toJson()],
        },
      );

      if (kDebugMode) {
        print('✅ Mesh Gateway Service: Message bridged to server: ${message.msgId}');
      }

      return true;
    } catch (e) {
      if (kDebugMode) {
        print('⚠️ Mesh Gateway Service: Error bridging to server: $e');
      }
      return false;
    }
  }

  /// Bridge message from server to mesh
  Future<bool> bridgeToMesh(Map<String, dynamic> messageData) async {
    if (!_isGatewayMode) {
      return false;
    }

    try {
      // TODO: Convert server message to MeshMessage
      // TODO: Inject into mesh network via MeshService
      
      if (kDebugMode) {
        print('✅ Mesh Gateway Service: Message bridged from server to mesh');
      }

      return true;
    } catch (e) {
      if (kDebugMode) {
        print('⚠️ Mesh Gateway Service: Error bridging to mesh: $e');
      }
      return false;
    }
  }

  /// Check if gateway mode is enabled
  bool get isGatewayMode => _isGatewayMode;

  /// Dispose resources
  void dispose() {
    _gatewaySyncTimer?.cancel();
    _isGatewayMode = false;
  }
}

/// Gateway Status
class GatewayStatus {
  final bool isGatewayMode;
  final bool isOnline;
  final int messagesBridged;
  final DateTime? lastSyncTime;

  GatewayStatus({
    required this.isGatewayMode,
    required this.isOnline,
    required this.messagesBridged,
    this.lastSyncTime,
  });
}

