/// Phase 3.4.0: Sync Queue Provider
/// Riverpod provider for sync queue management

import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/services/sync_queue_service.dart';
import '../models/sync_queue_model.dart';

final syncQueueServiceProvider = Provider<SyncQueueService>((ref) {
  final service = SyncQueueService();
  service.initialize();
  return service;
});

final syncQueueStatusProvider = StreamProvider<SyncQueueStatus>((ref) {
  final service = ref.watch(syncQueueServiceProvider);
  return service.statusStream;
});

final syncQueuePendingItemsProvider = FutureProvider<List<SyncQueueItem>>((ref) async {
  final service = ref.watch(syncQueueServiceProvider);
  return service.getPendingItems();
});

final syncQueueConflictsProvider = FutureProvider<List<SyncQueueItem>>((ref) async {
  final service = ref.watch(syncQueueServiceProvider);
  return service.getConflicts();
});

class SyncQueueNotifier extends StateNotifier<AsyncValue<SyncQueueStatus>> {
  final SyncQueueService _service;

  SyncQueueNotifier(this._service) : super(const AsyncValue.loading()) {
    _loadStatus();
    _service.statusStream.listen((status) {
      if (mounted) {
        state = AsyncValue.data(status);
      }
    });
  }

  Future<void> _loadStatus() async {
    try {
      final status = await _service.getQueueStatus();
      state = AsyncValue.data(status);
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }

  Future<void> processQueue({int batchSize = 10}) async {
    try {
      state = const AsyncValue.loading();
      await _service.processQueue(batchSize: batchSize);
      final status = await _service.getQueueStatus();
      state = AsyncValue.data(status);
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }

  Future<bool> resolveConflict({
    required String itemId,
    required String resolution,
    Map<String, dynamic>? resolvedData,
  }) async {
    try {
      final success = await _service.resolveConflict(
        itemId: itemId,
        resolution: resolution,
        resolvedData: resolvedData,
      );
      if (success) {
        await _loadStatus();
      }
      return success;
    } catch (e) {
      return false;
    }
  }

  Future<void> refresh() async {
    await _loadStatus();
  }
}

final syncQueueNotifierProvider = StateNotifierProvider<SyncQueueNotifier, AsyncValue<SyncQueueStatus>>((ref) {
  final service = ref.watch(syncQueueServiceProvider);
  return SyncQueueNotifier(service);
});

