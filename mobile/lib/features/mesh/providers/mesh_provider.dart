/// Phase 5.1-5.2: Mesh Service Provider
/// Provides MeshService instance and manages mesh state
/// Phase 5.2: Enhanced with Bridge Node and Battery Awareness

import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/mesh_service.dart';
import '../services/bridge_node_service.dart';
import '../services/battery_aware_mesh_manager.dart';
import '../services/mesh_security_service.dart';
import '../services/mesh_offline_queue.dart';
import '../services/mesh_sync_service.dart';
import '../services/message_deduplicator.dart';
import '../services/mesh_relay_service.dart';
import '../services/ble_mesh_service.dart'; // Phase 5.9
import '../services/lora_mesh_service.dart'; // Phase 5.9
import '../services/mesh_gateway_service.dart'; // Phase 5.9
import '../../../core/services/battery_optimization_service.dart';
import '../../../core/providers/api_service_provider.dart';
import '../../../core/services/connectivity_service.dart'; // Phase 5.9
import '../../auth/providers/auth_provider.dart';
import '../../socket/providers/socket_provider.dart'; // Import socket provider (includes connectivityServiceProvider)
import 'package:flutter/widgets.dart';

/// Battery optimization service provider
final batteryOptimizationServiceProvider = Provider<BatteryOptimizationService>((ref) {
  final service = BatteryOptimizationService();
  ref.onDispose(() => service.dispose());
  return service;
});

/// Mesh Security Service provider - Phase 5.3
final meshSecurityServiceProvider = Provider<MeshSecurityService>((ref) {
  final apiService = ref.watch(apiServiceProvider);
  final service = MeshSecurityService(apiService: apiService);
  return service;
});

/// Mesh Offline Queue provider - Phase 5.3
final meshOfflineQueueProvider = Provider<MeshOfflineQueue>((ref) {
  final queue = MeshOfflineQueue();
  return queue;
});

/// Mesh Sync Service provider - Phase 5.3
final meshSyncServiceProvider = Provider<MeshSyncService>((ref) {
  final apiService = ref.watch(apiServiceProvider);
  final connectivityService = ref.watch(connectivityServiceProvider);
  final offlineQueue = ref.watch(meshOfflineQueueProvider);
  
  final syncService = MeshSyncService(
    apiService: apiService,
    connectivityService: connectivityService,
    offlineQueue: offlineQueue,
  );
  
  // Initialize sync service
  syncService.initialize();
  
  ref.onDispose(() {
    // Cleanup if needed
  });
  
  return syncService;
});

/// Message Deduplicator provider - Phase 5.4
final messageDeduplicatorProvider = Provider<MessageDeduplicator>((ref) {
  final deduplicator = MessageDeduplicator();
  deduplicator.initialize();
  return deduplicator;
});

/// Phase 5.9: BLE Mesh Service Provider
final bleMeshServiceProvider = Provider<BLEMeshService>((ref) {
  final service = BLEMeshServiceImpl();
  service.initialize();
  ref.onDispose(() => service.dispose());
  return service;
});

/// Phase 5.9: LoRa Mesh Service Provider
final loraMeshServiceProvider = Provider<LoRaMeshService>((ref) {
  final service = LoRaMeshServiceImpl();
  ref.onDispose(() => service.dispose());
  return service;
});

/// Phase 5.9: Mesh Gateway Service Provider
final meshGatewayServiceProvider = Provider<MeshGatewayService>((ref) {
  final apiService = ref.watch(apiServiceProvider);
  final connectivityService = ConnectivityService();
  connectivityService.initialize();
  final service = MeshGatewayService(
    apiService: apiService,
    connectivityService: connectivityService,
  );
  ref.onDispose(() {
    service.dispose();
    connectivityService.dispose();
  });
  return service;
});

/// Mesh Relay Service provider - Phase 5.4
/// Created separately to avoid circular dependency with meshServiceProvider
final meshRelayServiceProvider = Provider<MeshRelayService>((ref) {
  final deduplicator = ref.watch<MessageDeduplicator>(messageDeduplicatorProvider);
  final securityService = ref.watch<MeshSecurityService>(meshSecurityServiceProvider);
  
  // Create relay service without MeshService dependency
  // Send message callback will be set after MeshService is created
  return MeshRelayService(
    sendMessageCallback: null, // Will be set after MeshService is created
    deduplicator: deduplicator,
    securityService: securityService,
    crisisAlertService: null, // Will be integrated when needed
  );
});

/// Mesh service provider
/// Phase 5.3: Enhanced with security and offline queue
/// Phase 5.4: Enhanced with deduplicator and relay service
final meshServiceProvider = Provider<MeshService>((ref) {
  final securityService = ref.watch<MeshSecurityService>(meshSecurityServiceProvider);
  final offlineQueue = ref.watch<MeshOfflineQueue>(meshOfflineQueueProvider);
  final syncService = ref.watch<MeshSyncService>(meshSyncServiceProvider);
  final deduplicator = ref.watch<MessageDeduplicator>(messageDeduplicatorProvider);
  
  // Use late initialization to avoid circular dependency
  // Relay service will be set after meshService is created
  final service = MeshService(
    securityService: securityService,
    offlineQueue: offlineQueue,
    syncService: syncService,
    deduplicator: deduplicator,
    relayService: null, // Will be set after creation
  );
  
  // Set relay service and callback after service is created (break circular dependency)
  WidgetsBinding.instance.addPostFrameCallback((_) {
    try {
      final relayService = ref.read<MeshRelayService>(meshRelayServiceProvider);
      service.setRelayService(relayService);
      // Also set the send message callback in relay service
      relayService.setSendMessageCallback((message) => service.sendMessage(message));
    } catch (e) {
      // Relay service not available yet - mesh will still work
    }
    
    // Phase 5.3: Set schoolId from auth state when available
    try {
      final authState = ref.read(authProvider);
      if (authState.user?.institutionId != null) {
        service.setSchoolId(authState.user!.institutionId!);
      }
    } catch (e) {
      // Auth not available yet
    }
  });
  
  // Dispose when provider is disposed
  ref.onDispose(() {
    service.dispose();
  });
  
  return service;
});

/// Battery-Aware Mesh Manager provider - Phase 5.2
final batteryAwareMeshManagerProvider = Provider<BatteryAwareMeshManager>((ref) {
  final meshService = ref.watch<MeshService>(meshServiceProvider);
  final batteryService = ref.watch<BatteryOptimizationService>(batteryOptimizationServiceProvider);
  
  final manager = BatteryAwareMeshManager(
    meshService: meshService,
    batteryService: batteryService,
  );
  
  ref.onDispose(() => manager.dispose());
  return manager;
});

/// Bridge Node Service provider - Phase 5.2
final bridgeNodeServiceProvider = Provider<BridgeNodeService?>((ref) {
  final meshService = ref.watch<MeshService>(meshServiceProvider);
  final connectivityService = ref.read(connectivityServiceProvider);
  
  // Try to get socket service
  final socketService = ref.read(socketServiceProvider);
  
  final bridgeService = BridgeNodeService(
    connectivityService: connectivityService,
    meshService: meshService,
    socketService: socketService,
  );
  
  ref.onDispose(() => bridgeService.dispose());
  return bridgeService;
});

/// Mesh connectivity integration provider
/// Auto-starts mesh when offline
final meshConnectivityProvider = StateNotifierProvider<MeshConnectivityNotifier, bool>((ref) {
  final meshService = ref.watch<MeshService>(meshServiceProvider);
  final batteryManager = ref.watch<BatteryAwareMeshManager>(batteryAwareMeshManagerProvider);
  return MeshConnectivityNotifier(meshService, batteryManager);
});

class MeshConnectivityNotifier extends StateNotifier<bool> {
  final MeshService _meshService;
  final BatteryAwareMeshManager _batteryManager;
  bool _isOffline = false;

  MeshConnectivityNotifier(
    this._meshService,
    this._batteryManager,
  ) : super(false) {
    _checkConnectivity();
  }

  Future<void> _checkConnectivity() async {
    // This will be called when connectivity changes
    // Integration happens in connectivity service
  }

  /// Called when connectivity goes offline
  Future<void> onOffline() async {
    if (!_isOffline) {
      _isOffline = true;
      state = true;
      
      // Phase 5.2: Start battery-aware mesh with duty cycle
      await _batteryManager.start();
    }
  }

  /// Called when connectivity comes online
  Future<void> onOnline() async {
    if (_isOffline) {
      _isOffline = false;
      state = false;
      
      // Phase 5.2: Stop battery-aware mesh manager
      await _batteryManager.stop();
      
      // Stop mesh networking
      await _meshService.stopAll();
    }
  }
  
  /// Set active alert status (for duty cycle management)
  Future<void> setActiveAlert(bool hasActiveAlert) async {
    await _batteryManager.setActiveAlert(hasActiveAlert);
  }
}

