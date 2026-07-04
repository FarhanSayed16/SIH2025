/// Phase 5.1: Mesh Service
/// Handles peer-to-peer mesh networking using Nearby Connections API (Android)

import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';
import 'package:nearby_connections/nearby_connections.dart';
import 'package:device_info_plus/device_info_plus.dart';
import '../models/mesh_message.dart';
import '../models/mesh_peer.dart';
import 'mesh_security_service.dart';
import 'mesh_offline_queue.dart';
import 'mesh_sync_service.dart';
import 'message_deduplicator.dart';
import 'mesh_relay_service.dart';
import 'package:flutter/foundation.dart';

/// Mesh Service - Phase 5.1 Prototype
/// Phase 5.3: Enhanced with security and offline queue
class MeshService {
  final Nearby _nearby = Nearby();
  
  // State
  bool _isAdvertising = false;
  bool _isDiscovering = false;
  final Map<String, MeshPeer> _connectedPeers = {};
  final Map<String, MeshPeer> _discoveredPeers = {};
  
  // Phase 5.2: Connection quality metrics
  final Map<String, DateTime> _messageTimestamps = <String, DateTime>{}; // For latency calculation
  final Map<String, int> _messageCounts = <String, int>{}; // Messages sent/received per peer
  final Map<String, List<Duration>> _latencies = <String, List<Duration>>{}; // Store latency samples
  
  // Event controllers
  final StreamController<MeshMessage> _messageController =
      StreamController<MeshMessage>.broadcast();
  final StreamController<MeshPeer> _peerFoundController =
      StreamController<MeshPeer>.broadcast();
  final StreamController<String> _peerLostController =
      StreamController<String>.broadcast();
  final StreamController<String> _errorController =
      StreamController<String>.broadcast();
  
  // Service ID (unique identifier for mesh network)
  static const String _serviceId = 'com.kavach.mesh';
  
  // Device info
  String? _deviceName;
  
  // Phase 5.3: Security and offline queue
  final MeshSecurityService? _securityService;
  final MeshOfflineQueue? _offlineQueue;
  final MeshSyncService? _syncService;
  String? _schoolId; // Current school ID for signing messages
  
  // Phase 5.4: Enhanced deduplication with LRU cache
  final MessageDeduplicator? _deduplicator;
  
  // Phase 5.4: Relay service for automatic message relay
  MeshRelayService? _relayService;
  
  // Getters
  bool get isAdvertising => _isAdvertising;
  bool get isDiscovering => _isDiscovering;
  List<MeshPeer> get connectedPeers => _connectedPeers.values.toList();
  List<MeshPeer> get discoveredPeers => _discoveredPeers.values.toList();
  int get connectedPeerCount => _connectedPeers.length;
  
  // Phase 5.2: Connection quality getters
  Map<String, double> get averageLatencies {
    final Map<String, double> averages = {};
    _latencies.forEach((peerId, latencies) {
      if (latencies.isNotEmpty) {
        final sum = latencies.fold<int>(
          0,
          (sum, duration) => sum + duration.inMilliseconds,
        );
        averages[peerId] = sum / latencies.length;
      }
    });
    return averages;
  }
  
  Map<String, int> get messageCounts => Map<String, int>.from(_messageCounts);
  
  /// Get connection quality metrics for a peer
  Map<String, dynamic>? getPeerQuality(String peerId) {
    if (!_connectedPeers.containsKey(peerId)) return null;
    
    final peer = _connectedPeers[peerId]!;
    final avgLatency = averageLatencies[peerId];
    final msgCount = _messageCounts[peerId] ?? 0;
    
    return {
      'peerId': peerId,
      'signalStrength': peer.signalStrength,
      'averageLatency': avgLatency,
      'messageCount': msgCount,
      'connectionDuration': peer.connectionDuration.inSeconds,
    };
  }
  
  /// Get overall mesh network quality
  Map<String, dynamic> getNetworkQuality() {
    final peers = _connectedPeers.values.toList();
    final avgLatencies = this.averageLatencies.values.toList();
    final avgLatency = avgLatencies.isEmpty
        ? 0.0
        : avgLatencies.reduce((a, b) => a + b) / avgLatencies.length;
    
    return {
      'peerCount': peers.length,
      'averageLatency': avgLatency,
      'totalMessages': _messageCounts.values.fold<int>(0, (sum, count) => sum + count),
      'hasStrongSignal': peers.any((p) => p.signalStrength != null && p.signalStrength! > -70),
    };
  }
  
  // Event streams
  Stream<MeshMessage> get onMessage => _messageController.stream;
  Stream<MeshPeer> get onPeerFound => _peerFoundController.stream;
  Stream<String> get onPeerLost => _peerLostController.stream;
  Stream<String> get onError => _errorController.stream;
  
  MeshService({
    MeshSecurityService? securityService,
    MeshOfflineQueue? offlineQueue,
    MeshSyncService? syncService,
    MessageDeduplicator? deduplicator,
    MeshRelayService? relayService,
  })  : _securityService = securityService,
        _offlineQueue = offlineQueue,
        _syncService = syncService,
        _deduplicator = deduplicator,
        _relayService = relayService {
    _initializeDeviceInfo();
    _initializeServicesAsync();
  }
  
  /// Initialize device information
  Future<void> _initializeDeviceInfo() async {
    try {
      final deviceInfo = DeviceInfoPlugin();
      final androidInfo = await deviceInfo.androidInfo;
      _deviceName = androidInfo.model;
    } catch (e) {
      _deviceName = 'Unknown Device';
    }
  }
  
  /// Initialize security and queue services asynchronously
  void _initializeServicesAsync() {
    // Initialize services asynchronously (fire and forget)
    Future.microtask(() async {
      try {
        if (_offlineQueue != null) {
          await _offlineQueue!.initialize();
        }
        if (_syncService != null) {
          await _syncService!.initialize();
        }
        if (_deduplicator != null) {
          await _deduplicator!.initialize();
        }
        
        if (kDebugMode) {
          print('✅ Mesh Service: Security, offline queue, and deduplicator initialized');
        }
      } catch (e) {
        if (kDebugMode) {
          print('⚠️ Mesh Service: Error initializing services: $e');
        }
      }
    });
  }
  
  /// Set school ID for message signing
  void setSchoolId(String schoolId) {
    _schoolId = schoolId;
  }
  
  /// Start advertising (make this device discoverable)
  Future<bool> startAdvertising({
    String? serviceName,
  }) async {
    if (_isAdvertising) {
      return true; // Already advertising
    }
    
    try {
      final name = serviceName ?? _deviceName ?? 'EduSafe Device';
      
      // Start advertising using P2P_STAR strategy
      final bool started = await _nearby.startAdvertising(
        name,
        Strategy.P2P_STAR,
        onConnectionInitiated: _onConnectionInitiated,
        onConnectionResult: _onConnectionResult,
        onDisconnected: _onDisconnected,
        serviceId: _serviceId,
      );
      
      if (started) {
        _isAdvertising = true;
        return true;
      } else {
        _errorController.add('Failed to start advertising');
        return false;
      }
    } catch (e) {
      _errorController.add('Error starting advertising: $e');
      return false;
    }
  }
  
  /// Stop advertising
  Future<void> stopAdvertising() async {
    if (!_isAdvertising) {
      return;
    }
    
    try {
      await _nearby.stopAdvertising();
      _isAdvertising = false;
    } catch (e) {
      _errorController.add('Error stopping advertising: $e');
    }
  }
  
  /// Start discovery (find nearby peers)
  Future<bool> startDiscovery() async {
    if (_isDiscovering) {
      return true; // Already discovering
    }
    
    try {
      // Start discovery using P2P_STAR strategy
      final bool started = await _nearby.startDiscovery(
        'EduSafe Discovery',
        Strategy.P2P_STAR,
        onEndpointFound: _onEndpointFound,
        onEndpointLost: _onEndpointLost,
        serviceId: _serviceId,
      );
      
      if (started) {
        _isDiscovering = true;
        return true;
      } else {
        _errorController.add('Failed to start discovery');
        return false;
      }
    } catch (e) {
      _errorController.add('Error starting discovery: $e');
      return false;
    }
  }
  
  /// Stop discovery
  Future<void> stopDiscovery() async {
    if (!_isDiscovering) {
      return;
    }
    
    try {
      await _nearby.stopDiscovery();
      _isDiscovering = false;
    } catch (e) {
      _errorController.add('Error stopping discovery: $e');
    }
  }
  
  /// Connect to a peer
  Future<bool> connect(String peerId) async {
    if (_connectedPeers.containsKey(peerId)) {
      return true; // Already connected
    }
    
    try {
      await _nearby.requestConnection(
        _deviceName ?? 'EduSafe Device',
        peerId,
        onConnectionInitiated: _onConnectionInitiated,
        onConnectionResult: _onConnectionResult,
        onDisconnected: _onDisconnected,
      );
      return true;
    } catch (e) {
      _errorController.add('Error connecting to peer: $e');
      return false;
    }
  }
  
  /// Accept connection request
  Future<void> acceptConnection(String peerId) async {
    try {
      await _nearby.acceptConnection(
        peerId,
        onPayLoadRecieved: _onPayloadReceived,
        onPayloadTransferUpdate: _onPayloadTransferUpdate,
      );
    } catch (e) {
      _errorController.add('Error accepting connection: $e');
    }
  }
  
  /// Reject connection request
  Future<void> rejectConnection(String peerId) async {
    try {
      await _nearby.rejectConnection(peerId);
    } catch (e) {
      _errorController.add('Error rejecting connection: $e');
    }
  }
  
  /// Disconnect from a peer
  Future<void> disconnect(String peerId) async {
    if (!_connectedPeers.containsKey(peerId)) {
      return;
    }
    
    try {
      await _nearby.disconnectFromEndpoint(peerId);
      _connectedPeers.remove(peerId);
      _peerLostController.add(peerId);
    } catch (e) {
      _errorController.add('Error disconnecting from peer: $e');
    }
  }
  
  /// Send message to connected peers
  /// Phase 5.3: Automatically signs message and queues if offline
  Future<bool> sendMessage(MeshMessage message) async {
    // Phase 5.3: Sign message if security service is available
    MeshMessage secureMessage = message;
    if (_securityService != null && message.schoolId.isNotEmpty) {
      try {
        // Ensure message is signed
        if (message.signature == null || message.signature!.isEmpty) {
          final signature = await _securityService!.signMessageAsync(message);
          secureMessage = message.copyWith(signature: signature);
        }
      } catch (e) {
        if (kDebugMode) {
          print('⚠️ Mesh Service: Error signing message: $e');
        }
        // Continue without signature if signing fails
      }
    }
    
    // Phase 5.3: Add to offline queue for sync
    if (_offlineQueue != null) {
      try {
        await _offlineQueue!.addMessage(secureMessage);
      } catch (e) {
        if (kDebugMode) {
          print('⚠️ Mesh Service: Error queueing message: $e');
        }
      }
    }
    
    if (_connectedPeers.isEmpty) {
      // Phase 5.3: Even if no peers, message is queued for sync
      return false;
    }
    
    // Check message size (limit to 2-4KB)
    if (secureMessage.sizeInBytes > 4096) {
      _errorController.add('Message too large: ${secureMessage.sizeInBytes} bytes');
      return false;
    }
    
    bool allSent = true;
    final messageJson = secureMessage.encode();
    final bytes = Uint8List.fromList(utf8.encode(messageJson));
    
    // Phase 5.2: Track message send time for latency calculation
    final sendTime = DateTime.now();
    _messageTimestamps[secureMessage.msgId] = sendTime;
    
    // Send to all connected peers
    for (final peer in _connectedPeers.values) {
      try {
        final peerSendStart = DateTime.now();
        await _nearby.sendBytesPayload(peer.peerId, bytes);
        
        // Update message count
        _messageCounts[peer.peerId] = (_messageCounts[peer.peerId] ?? 0) + 1;
        
        // Track send latency (approximate)
        final sendLatency = DateTime.now().difference(peerSendStart);
        _latencies.putIfAbsent(peer.peerId, () => []);
        final peerLatencies = _latencies[peer.peerId]!;
        peerLatencies.add(sendLatency);
        
        // Keep only last 10 latency samples
        if (peerLatencies.length > 10) {
          peerLatencies.removeAt(0);
        }
      } catch (e) {
        _errorController.add('Error sending message to ${peer.peerId}: $e');
        allSent = false;
      }
    }
    
    return allSent;
  }
  
  /// Broadcast message (send to all connected peers)
  /// Phase 5.3: Automatically signs and uses schoolId if set
  Future<bool> broadcast(Map<String, dynamic> payload, {bool encryptPayload = false}) async {
    // Use schoolId from service if not provided
    final schoolId = payload['schoolId'] as String? ?? _schoolId ?? '';
    if (schoolId.isEmpty) {
      _errorController.add('School ID is required for broadcast');
      return false;
    }
    
    // Phase 5.3: Create secure message using security service
    MeshMessage message;
    if (_securityService != null) {
      try {
        message = await _securityService!.createSecureMessage(
          msgId: payload['msgId'] as String? ?? 
                 '${DateTime.now().millisecondsSinceEpoch}_${_generateRandomString(8)}',
          type: payload['type'] as String? ?? MeshMessageType.crisisAlert,
          schoolId: schoolId,
          source: payload['source'] as String? ?? MeshMessageSource.mesh,
          payload: payload,
          encryptPayload: encryptPayload,
        );
      } catch (e) {
        if (kDebugMode) {
          print('⚠️ Mesh Service: Error creating secure message: $e');
        }
        // Fallback to basic message
        message = MeshMessage(
          msgId: DateTime.now().millisecondsSinceEpoch.toString(),
          type: payload['type'] as String? ?? MeshMessageType.crisisAlert,
          schoolId: schoolId,
          source: payload['source'] as String? ?? MeshMessageSource.mesh,
          payload: payload,
          timestamp: DateTime.now().millisecondsSinceEpoch,
          ttl: payload['ttl'] as int? ?? 3,
        );
      }
    } else {
      // Basic message without security
      message = MeshMessage(
        msgId: DateTime.now().millisecondsSinceEpoch.toString(),
        type: payload['type'] as String? ?? MeshMessageType.crisisAlert,
        schoolId: schoolId,
        source: payload['source'] as String? ?? MeshMessageSource.mesh,
        payload: payload,
        timestamp: DateTime.now().millisecondsSinceEpoch,
        ttl: payload['ttl'] as int? ?? 3,
      );
    }
    
    return sendMessage(message);
  }
  
  /// Generate random string for message IDs
  String _generateRandomString(int length) {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    return List.generate(length, (_) => chars[DateTime.now().microsecondsSinceEpoch % chars.length]).join();
  }
  
  /// Connection initiated callback
  void _onConnectionInitiated(String endpointId, ConnectionInfo info) {
    // Auto-accept connections for mesh network
    acceptConnection(endpointId);
  }
  
  /// Connection result callback
  void _onConnectionResult(String endpointId, Status status) {
    if (status == Status.CONNECTED) {
      final peer = MeshPeer(
        peerId: endpointId,
        name: _discoveredPeers[endpointId]?.name,
        deviceId: _discoveredPeers[endpointId]?.deviceId,
        status: MeshPeerStatus.connected,
      );
      
      _connectedPeers[endpointId] = peer;
      _peerFoundController.add(peer);
      
      // Setup payload receiver for this peer if not already done
      // Note: acceptConnection should have already set this up
    } else {
      _errorController.add('Connection failed: $status');
      // Remove from discovered peers if connection failed
      _discoveredPeers.remove(endpointId);
    }
  }
  
  /// Disconnected callback
  void _onDisconnected(String endpointId) {
    if (_connectedPeers.containsKey(endpointId)) {
      _connectedPeers.remove(endpointId);
      _peerLostController.add(endpointId);
      
      // Phase 5.2: Clean up metrics for disconnected peer
      _latencies.remove(endpointId);
      _messageCounts.remove(endpointId);
    }
    _discoveredPeers.remove(endpointId);
  }
  
  /// Endpoint found callback
  void _onEndpointFound(String endpointId, String endpointName, String serviceId) {
    final peer = MeshPeer(
      peerId: endpointId,
      name: endpointName,
      status: MeshPeerStatus.connecting,
    );
    
    _discoveredPeers[endpointId] = peer;
    _peerFoundController.add(peer);
    
    // Auto-connect to discovered peers
    connect(endpointId);
  }
  
  /// Endpoint lost callback
  void _onEndpointLost(String? endpointId) {
    if (endpointId == null) return;
    
    _discoveredPeers.remove(endpointId);
    if (_connectedPeers.containsKey(endpointId)) {
      _connectedPeers.remove(endpointId);
      _peerLostController.add(endpointId);
    }
  }
  
  /// Payload received callback
  /// Phase 5.3: Verify signature and decrypt if needed
  void _onPayloadReceived(String endpointId, Payload payload) {
    if (payload.type == PayloadType.BYTES && payload.bytes != null) {
      try {
        final bytes = payload.bytes!;
        final jsonString = utf8.decode(bytes);
        final message = MeshMessage.decode(jsonString);
        
        // Phase 5.4: Use deduplicator if available for early duplicate check
        if (_deduplicator != null && _deduplicator!.hasSeen(message.msgId)) {
          if (kDebugMode) {
            print('⚠️ Mesh Service: Duplicate message ${message.msgId}, dropping');
          }
          return; // Drop duplicate
        }
        
        // Phase 5.3/5.4: Process message asynchronously (verify signature, decrypt, queue, relay)
        _processReceivedMessage(message, endpointId);
      } catch (e) {
        _errorController.add('Error parsing received message: $e');
      }
    }
  }
  
  /// Process received message (async verification, decryption, queueing, relay)
  /// Phase 5.3/5.4: Verify signature, decrypt, queue, and optionally relay
  Future<void> _processReceivedMessage(MeshMessage message, String endpointId) async {
    try {
      MeshMessage verifiedMessage = message;
      
      // Phase 5.3: Verify signature if security service is available
      if (_securityService != null && message.signature != null && message.signature!.isNotEmpty) {
        final isValid = await _securityService!.verifySignature(message, message.signature!);
        if (!isValid) {
          if (kDebugMode) {
            print('⚠️ Mesh Service: Invalid signature for message ${message.msgId}, dropping');
          }
          _errorController.add('Invalid signature for message ${message.msgId}');
          return; // Drop message with invalid signature
        }
        
        // Phase 5.3: Decrypt payload if encrypted
        if (message.encrypted) {
          final decryptedMessage = await _securityService!.verifyAndDecryptMessage(message);
          if (decryptedMessage == null) {
            if (kDebugMode) {
              print('⚠️ Mesh Service: Failed to decrypt message ${message.msgId}');
            }
            _errorController.add('Failed to decrypt message ${message.msgId}');
            return; // Drop message that can't be decrypted
          }
          verifiedMessage = decryptedMessage;
        }
      }
      
      // Phase 5.4: Use relay service for complete processing (deduplication + relay)
      if (_relayService != null) {
        // Relay service handles: deduplication, message type handling, and relay
        await _relayService!.processMessage(verifiedMessage);
      } else {
        // Fallback: Use basic deduplication (Phase 5.3)
        // Phase 5.4: Check deduplicator if available
        if (_deduplicator != null) {
          if (_deduplicator!.hasSeen(verifiedMessage.msgId)) {
            if (kDebugMode) {
              print('⚠️ Mesh Service: Duplicate message ${verifiedMessage.msgId}, dropping');
            }
            return; // Drop duplicate
          }
          await _deduplicator!.markSeen(verifiedMessage.msgId);
        }
      }
      
      // Phase 5.2: Track message receive and calculate latency if applicable
      final receiveTime = DateTime.now();
      if (_messageTimestamps.containsKey(verifiedMessage.msgId)) {
        final sendTime = _messageTimestamps[verifiedMessage.msgId]!;
        final latency = receiveTime.difference(sendTime);
        
        _latencies.putIfAbsent(endpointId, () => []);
        final peerLatencies = _latencies[endpointId]!;
        peerLatencies.add(latency);
        
        // Keep only last 10 latency samples
        if (peerLatencies.length > 10) {
          peerLatencies.removeAt(0);
        }
        
        // Remove timestamp after processing
        _messageTimestamps.remove(verifiedMessage.msgId);
      }
      
      // Update message count
      _messageCounts[endpointId] = (_messageCounts[endpointId] ?? 0) + 1;
      
      // Add to offline queue for sync
      if (_offlineQueue != null) {
        await _offlineQueue!.addMessage(verifiedMessage);
      }
      
      // Emit message to listeners (this triggers UI updates)
      _messageController.add(verifiedMessage);
    } catch (e) {
      if (kDebugMode) {
        print('⚠️ Mesh Service: Error processing message: $e');
      }
      _errorController.add('Error processing message: $e');
    }
  }
  
  /// Get seen messages count (for debugging)
  /// Phase 5.4: Uses deduplicator if available
  int get seenMessagesCount => _deduplicator?.count ?? 0;
  
  /// Set relay service (used to break circular dependency)
  void setRelayService(MeshRelayService? relayService) {
    _relayService = relayService;
  }
  
  /// Payload transfer update callback
  void _onPayloadTransferUpdate(String endpointId, PayloadTransferUpdate update) {
    // Can be used for progress tracking if needed
  }
  
  /// Stop all mesh networking activities
  Future<void> stopAll() async {
    await Future.wait([
      stopAdvertising(),
      stopDiscovery(),
    ]);
    
    // Disconnect from all peers
    final peerIds = _connectedPeers.keys.toList();
    for (final peerId in peerIds) {
      await disconnect(peerId);
    }
    
    _connectedPeers.clear();
    _discoveredPeers.clear();
  }
  
  /// Dispose resources
  void dispose() {
    stopAll();
    _messageController.close();
    _peerFoundController.close();
    _peerLostController.close();
    _errorController.close();
  }
}
