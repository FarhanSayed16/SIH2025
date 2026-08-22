/// Phase 5.2: Bridge Node Service
/// Connects offline mesh network to online infrastructure
/// When device has internet, it acts as a bridge between mesh and server

import 'dart:async';
import '../../../core/services/connectivity_service.dart';
import '../../../core/services/socket_service.dart';
import '../../../core/services/api_service.dart';
import '../../../core/constants/api_endpoints.dart';
import '../models/mesh_message.dart';
import '../services/mesh_service.dart';
import 'package:flutter/foundation.dart';

/// Bridge Node Service - Phase 5.2
/// Automatically bridges offline mesh messages to online server and vice versa
class BridgeNodeService {
  final ConnectivityService _connectivityService;
  final SocketService? _socketService;
  final ApiService _apiService;
  final MeshService _meshService;

  StreamSubscription<MeshMessage>? _meshMessageSubscription;
  StreamSubscription<bool>? _connectivitySubscription;
  Timer? _connectivityCheckTimer;
  
  bool _isBridgeMode = false;
  bool _hasInternet = false;
  final List<MeshMessage> _pendingUploads = [];
  bool _isUploading = false;

  // Event controller for bridge status
  final StreamController<bool> _bridgeStatusController =
      StreamController<bool>.broadcast();

  // Getters
  bool get isBridgeMode => _isBridgeMode;
  Stream<bool> get onBridgeStatusChanged => _bridgeStatusController.stream;

  BridgeNodeService({
    required ConnectivityService connectivityService,
    required MeshService meshService,
    SocketService? socketService,
    ApiService? apiService,
  })  : _connectivityService = connectivityService,
        _meshService = meshService,
        _socketService = socketService,
        _apiService = apiService ?? ApiService() {
    _initialize();
  }

  /// Initialize bridge node service
  void _initialize() {
    // Check connectivity every 10 seconds
    _connectivityCheckTimer = Timer.periodic(
      const Duration(seconds: 10),
      (_) => _checkConnectivity(),
    );

    // Initial connectivity check
    _checkConnectivity();

    // Listen to mesh messages
    _meshMessageSubscription = _meshService.onMessage.listen(_handleMeshMessage);

    // Listen to connectivity changes
    _connectivityService.onConnectivityChanged = (isConnected) {
      _hasInternet = isConnected;
      _updateBridgeMode();
    };
  }

  /// Check current connectivity status
  Future<void> _checkConnectivity() async {
    try {
      final isOnline = await _connectivityService.checkOnline();
      if (_hasInternet != isOnline) {
        _hasInternet = isOnline;
        _updateBridgeMode();
      }
    } catch (e) {
      if (kDebugMode) {
        print('⚠️ Bridge Node: Error checking connectivity: $e');
      }
    }
  }

  /// Update bridge mode based on connectivity
  void _updateBridgeMode() {
    final shouldBeBridge = _hasInternet;

    if (shouldBeBridge && !_isBridgeMode) {
      _startBridgeMode();
    } else if (!shouldBeBridge && _isBridgeMode) {
      _stopBridgeMode();
    }
  }

  /// Start bridge mode
  void _startBridgeMode() {
    if (_isBridgeMode) return;

    _isBridgeMode = true;
    _bridgeStatusController.add(true);

    if (kDebugMode) {
      print('🌉 Bridge Mode: ACTIVATED - Connecting mesh to server');
    }

    // Listen to server socket events and broadcast to mesh
    if (_socketService != null) {
      _setupSocketBridge();
    }

    // Upload any pending mesh messages
    _uploadPendingMessages();

    // Start listening to new mesh messages for upload
    _meshMessageSubscription?.resume();
  }

  /// Stop bridge mode
  void _stopBridgeMode() {
    if (!_isBridgeMode) return;

    _isBridgeMode = false;
    _bridgeStatusController.add(false);

    if (kDebugMode) {
      print('🌉 Bridge Mode: DEACTIVATED - Device is offline');
    }

    // Pause mesh message subscription (we'll resume when bridge mode starts)
    _meshMessageSubscription?.pause();
  }

  /// Setup socket bridge - broadcast server alerts to mesh
  void _setupSocketBridge() {
    if (_socketService == null) return;

    // Listen to crisis alerts from server
    _socketService!.onEventCallback = (event, data) {
      if (!_isBridgeMode) return;

      // Broadcast critical events to mesh
      final criticalEvents = [
        'CRISIS_ALERT',
        'DRILL_SCHEDULED',
        'DRILL_START',
        'USER_STATUS_UPDATE',
        'ALERT_CANCEL',
        'ALERT_RESOLVED',
      ];

      if (criticalEvents.contains(event)) {
        _broadcastToMesh(event, data);
      }
    };
  }

  /// Broadcast server event to mesh network
  Future<void> _broadcastToMesh(String eventType, dynamic data) async {
    if (!_isBridgeMode) return;

    try {
      // Create mesh message from server event
      final meshPayload = {
        'type': eventType,
        'source': 'server',
        'payload': data is Map<String, dynamic> ? data : {'data': data},
        'timestamp': DateTime.now().millisecondsSinceEpoch,
        'ttl': 3, // 3 hops default
      };

      await _meshService.broadcast(meshPayload);

      if (kDebugMode) {
        print('🌉 Bridge: Broadcasted $eventType to mesh network');
      }
    } catch (e) {
      if (kDebugMode) {
        print('⚠️ Bridge: Error broadcasting to mesh: $e');
      }
    }
  }

  /// Handle mesh message - upload to server if in bridge mode
  void _handleMeshMessage(MeshMessage message) {
    if (!_isBridgeMode) {
      // Queue for later upload when bridge mode activates
      _pendingUploads.add(message);
      return;
    }

    // Upload immediately if bridge mode is active
    _uploadMeshMessage(message);
  }

  /// Upload mesh message to server
  Future<void> _uploadMeshMessage(MeshMessage message) async {
    try {
      // Skip messages that originated from server (prevent loops)
      // Messages with source='mesh' might have been relayed from server already
      if (message.source == MeshMessageSource.mesh && 
          message.payload['_bridgeSource'] == 'server') {
        return;
      }

      // Upload to server sync endpoint
      await _apiService.post(
        ApiEndpoints.sync,
        data: {
          'messages': [
            {
              'msgId': message.msgId,
              'type': message.type,
              'schoolId': message.schoolId,
              'source': message.source,
              'payload': message.payload,
              'timestamp': message.timestamp,
              'ttl': message.ttl,
              'hops': message.hops,
              'meshMessage': true, // Flag to indicate this came from mesh
            }
          ],
          'deviceId': await _getDeviceId(),
          'timestamp': DateTime.now().millisecondsSinceEpoch,
        },
      );

      if (kDebugMode) {
        print('🌉 Bridge: Uploaded mesh message ${message.msgId} to server');
      }
    } catch (e) {
      if (kDebugMode) {
        print('⚠️ Bridge: Error uploading mesh message: $e');
      }
      // Add to pending uploads for retry
      if (!_pendingUploads.contains(message)) {
        _pendingUploads.add(message);
      }
    }
  }

  /// Upload pending mesh messages
  Future<void> _uploadPendingMessages() async {
    if (_isUploading || _pendingUploads.isEmpty) return;

    _isUploading = true;

    // Copy pending uploads before clearing
    final List<MeshMessage> batch = List<MeshMessage>.from(_pendingUploads);
    _pendingUploads.clear();

    try {
      final messagesData = batch.map((msg) => {
            'msgId': msg.msgId,
            'type': msg.type,
            'schoolId': msg.schoolId,
            'source': msg.source,
            'payload': msg.payload,
            'timestamp': msg.timestamp,
            'ttl': msg.ttl,
            'hops': msg.hops,
            'meshMessage': true,
          }).toList();

      await _apiService.post(
        ApiEndpoints.sync,
        data: {
          'messages': messagesData,
          'deviceId': await _getDeviceId(),
          'timestamp': DateTime.now().millisecondsSinceEpoch,
        },
      );

      if (kDebugMode) {
        print('🌉 Bridge: Uploaded ${batch.length} pending mesh messages');
      }
    } catch (e) {
      if (kDebugMode) {
        print('⚠️ Bridge: Error uploading pending messages: $e');
      }
      // Re-add to pending if upload failed
      _pendingUploads.addAll(batch);
    } finally {
      _isUploading = false;
    }
  }

  /// Get device ID (placeholder - should use actual device ID service)
  Future<String> _getDeviceId() async {
    // TODO: Get actual device ID from DeviceService
    return 'device_${DateTime.now().millisecondsSinceEpoch}';
  }

  /// Manually trigger bridge mode check
  Future<void> checkAndActivateBridge() async {
    await _checkConnectivity();
    _updateBridgeMode();
  }

  /// Dispose resources
  void dispose() {
    _connectivityCheckTimer?.cancel();
    _meshMessageSubscription?.cancel();
    _connectivitySubscription?.cancel();
    _stopBridgeMode();
    _bridgeStatusController.close();
  }
}

