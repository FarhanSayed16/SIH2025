/// Phase 5.5-5.7: AR Providers
/// Riverpod providers for AR evacuation, fire simulation, and backend integration services

import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/ar_evacuation_service.dart';
import '../services/compass_fallback_service.dart';
import '../services/ar_fire_simulation_service.dart';
import '../services/ar_asset_manager.dart'; // Phase 5.7
import '../services/ar_session_logger.dart'; // Phase 5.7
import '../services/ar_trigger_handler.dart'; // Phase 5.7
import '../../ar_navigation/services/ar_navigation_service.dart';
import '../../../core/services/sync_queue_service.dart';
import '../../../core/services/connectivity_service.dart';
import '../../../core/providers/api_service_provider.dart';

/// AR Evacuation Service Provider
final arEvacuationServiceProvider = Provider<AREvacuationService>((ref) {
  final service = AREvacuationService();
  service.initialize();
  ref.onDispose(() => service.dispose());
  return service;
});

/// Compass Fallback Service Provider
final compassFallbackServiceProvider = Provider<CompassFallbackService>((ref) {
  final service = CompassFallbackService();
  service.initialize();
  ref.onDispose(() => service.dispose());
  return service;
});

/// AR Navigation Service Provider (shared with existing service)
final arNavigationServiceProvider = Provider<ARNavigationService>((ref) {
  return ARNavigationService();
});

/// AR Fire Simulation Service Provider
final arFireSimulationServiceProvider = Provider<ARFireSimulationService>((ref) {
  final service = ARFireSimulationService();
  ref.onDispose(() => service.dispose());
  return service;
});

/// Phase 5.7: AR Asset Manager Provider
final arAssetManagerProvider = Provider<ARAssetManager>((ref) {
  final service = ARAssetManager();
  service.initialize();
  return service;
});

/// Phase 5.7: AR Session Logger Provider
final arSessionLoggerProvider = Provider<ARSessionLogger>((ref) {
  final apiService = ref.watch(apiServiceProvider);
  final syncQueueService = SyncQueueService(apiService: apiService);
  final connectivityService = ConnectivityService();
  connectivityService.initialize();
  final service = ARSessionLogger(
    apiService: apiService,
    syncQueueService: syncQueueService,
    connectivityService: connectivityService,
  );
  service.initialize();
  return service;
});

/// Phase 5.7: AR Trigger Handler Provider
final arTriggerHandlerProvider = Provider<ARTriggerHandler>((ref) {
  final service = ARTriggerHandler();
  return service;
});
