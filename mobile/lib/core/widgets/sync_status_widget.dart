import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import '../services/enhanced_sync_service.dart';
import '../services/offline_storage_service.dart';
import '../../features/sync/screens/enhanced_sync_status_screen.dart';

/// Sync Status Widget (Phase 3.1.2)
/// Displays sync status and provides manual sync button
class SyncStatusWidget extends ConsumerStatefulWidget {
  final EnhancedSyncService syncService;
  final OfflineStorageService offlineStorage;

  const SyncStatusWidget({
    super.key,
    required this.syncService,
    required this.offlineStorage,
  });

  @override
  ConsumerState<SyncStatusWidget> createState() => _SyncStatusWidgetState();
}

class _SyncStatusWidgetState extends ConsumerState<SyncStatusWidget> {
  SyncStatus _currentStatus = SyncStatus.idle;
  bool _isOnline = true;
  Map<String, dynamic>? _cacheStats;

  @override
  void initState() {
    super.initState();
    _loadInitialState();
    _listenToSyncStatus();
    _listenToConnectivity();
  }

  Future<void> _loadInitialState() async {
    final isOnline = await widget.offlineStorage.isOnline();
    final cacheStats = await widget.offlineStorage.getCacheStats();
    
    setState(() {
      _isOnline = isOnline;
      _cacheStats = cacheStats;
    });
  }

  void _listenToSyncStatus() {
    widget.syncService.syncStatusStream.listen((status) {
      if (mounted) {
        setState(() {
          _currentStatus = status;
        });
      }
    });
  }

  void _listenToConnectivity() {
    widget.offlineStorage.connectivityStream.listen((result) {
      if (mounted) {
        setState(() {
          _isOnline = result != ConnectivityResult.none;
        });
      }
    });
  }

  Future<void> _handleManualSync() async {
    final result = await widget.syncService.sync(force: true);
    
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(result.message),
          backgroundColor: result.success ? Colors.green : Colors.red,
          duration: const Duration(seconds: 2),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.all(8),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                _buildStatusIcon(),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _getStatusText(),
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      if (_cacheStats != null) ...[
                        const SizedBox(height: 4),
                        Text(
                          '${_cacheStats!['downloadedModules']} modules • ${_cacheStats!['unsyncedQuizzes']} pending',
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                      ],
                    ],
                  ),
                ),
                if (_isOnline && _currentStatus != SyncStatus.syncing) ...[
                  IconButton(
                    icon: const Icon(Icons.info_outline),
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => const EnhancedSyncStatusScreen(),
                        ),
                      );
                    },
                    tooltip: 'View sync details',
                  ),
                  IconButton(
                    icon: const Icon(Icons.sync),
                    onPressed: _handleManualSync,
                    tooltip: 'Sync now',
                  ),
                ],
              ],
            ),
            if (_currentStatus == SyncStatus.syncing) ...[
              const SizedBox(height: 8),
              const LinearProgressIndicator(),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildStatusIcon() {
    IconData icon;
    Color color;

    switch (_currentStatus) {
      case SyncStatus.syncing:
        icon = Icons.sync;
        color = Colors.blue;
        break;
      case SyncStatus.synced:
        icon = Icons.check_circle;
        color = Colors.green;
        break;
      case SyncStatus.failed:
        icon = Icons.error;
        color = Colors.red;
        break;
      case SyncStatus.offline:
        icon = Icons.cloud_off;
        color = Colors.orange;
        break;
      default:
        icon = Icons.cloud_done;
        color = Colors.grey;
    }

    return Icon(icon, color: color, size: 24);
  }

  String _getStatusText() {
    if (!_isOnline) {
      return 'Offline Mode';
    }

    switch (_currentStatus) {
      case SyncStatus.syncing:
        return 'Syncing...';
      case SyncStatus.synced:
        return 'All synced';
      case SyncStatus.failed:
        return 'Sync failed';
      case SyncStatus.offline:
        return 'Offline';
      default:
        return 'Ready to sync';
    }
  }
}

