/// Phase 3.4.0: Enhanced Sync Status Screen
/// Detailed sync queue status and management

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/sync_queue_model.dart';
import '../providers/sync_queue_provider.dart';
import 'conflict_resolution_screen.dart';

class EnhancedSyncStatusScreen extends ConsumerStatefulWidget {
  const EnhancedSyncStatusScreen({super.key});

  @override
  ConsumerState<EnhancedSyncStatusScreen> createState() => _EnhancedSyncStatusScreenState();
}

class _EnhancedSyncStatusScreenState extends ConsumerState<EnhancedSyncStatusScreen> {
  @override
  void initState() {
    super.initState();
    // Refresh status when screen loads
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(syncQueueNotifierProvider.notifier).refresh().ignore();
    });
  }

  @override
  Widget build(BuildContext context) {
    final queueStatusAsync = ref.watch(syncQueueNotifierProvider);
    final pendingItemsAsync = ref.watch(syncQueuePendingItemsProvider);
    final conflictsAsync = ref.watch(syncQueueConflictsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Sync Status'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              ref.read(syncQueueNotifierProvider.notifier).refresh();
              ref.invalidate(syncQueuePendingItemsProvider);
              ref.invalidate(syncQueueConflictsProvider);
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          await ref.read(syncQueueNotifierProvider.notifier).refresh();
          ref.invalidate(syncQueuePendingItemsProvider);
          ref.invalidate(syncQueueConflictsProvider);
        },
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Queue Status Summary
              queueStatusAsync.when(
                data: (status) => _buildStatusSummary(context, status),
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (e, _) => Card(
                  color: Colors.red.shade50,
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      children: [
                        const Icon(Icons.error, color: Colors.red),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text('Error loading status: $e'),
                        ),
                      ],
                    ),
                  ),
                ),
              ),

              const SizedBox(height: 24),

              // Conflicts Section
              conflictsAsync.when(
                data: (conflicts) {
                  if (conflicts.isEmpty) {
                    return const SizedBox.shrink();
                  }
                  return _buildConflictsSection(context, conflicts);
                },
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (e, _) => const SizedBox.shrink(),
              ),

              const SizedBox(height: 24),

              // Pending Items Section
              pendingItemsAsync.when(
                data: (items) => _buildPendingItemsSection(context, items),
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (e, _) => Card(
                  color: Colors.red.shade50,
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Text('Error loading pending items: $e'),
                  ),
                ),
              ),

              const SizedBox(height: 24),

              // Actions
              _buildActionButtons(context),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatusSummary(BuildContext context, SyncQueueStatus status) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  status.hasPending || status.hasConflicts
                      ? Icons.sync_problem
                      : Icons.sync,
                  color: status.hasPending || status.hasConflicts
                      ? Colors.orange
                      : Colors.green,
                  size: 32,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        status.hasPending || status.hasConflicts
                            ? 'Sync Required'
                            : 'All Synced',
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                      ),
                      Text(
                        '${status.total} total items in queue',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            // Status Breakdown
            Row(
              children: [
                Expanded(
                  child: _buildStatusChip(
                    context,
                    'Pending',
                    status.pending,
                    Colors.orange,
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _buildStatusChip(
                    context,
                    'Processing',
                    status.processing,
                    Colors.blue,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: _buildStatusChip(
                    context,
                    'Synced',
                    status.synced,
                    Colors.green,
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _buildStatusChip(
                    context,
                    'Failed',
                    status.failed,
                    Colors.red,
                  ),
                ),
              ],
            ),
            if (status.conflict > 0) ...[
              const SizedBox(height: 8),
              _buildStatusChip(
                context,
                'Conflicts',
                status.conflict,
                Colors.purple,
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildStatusChip(BuildContext context, String label, int count, Color color) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Column(
        children: [
          Text(
            count.toString(),
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  color: color,
                  fontWeight: FontWeight.bold,
                ),
          ),
          Text(
            label,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: color,
                ),
          ),
        ],
      ),
    );
  }

  Widget _buildConflictsSection(BuildContext context, List<SyncQueueItem> conflicts) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(Icons.warning_amber_rounded, color: Colors.orange.shade700),
            const SizedBox(width: 8),
            Text(
              'Conflicts (${conflicts.length})',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: Colors.orange.shade700,
                  ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        ...conflicts.map((conflict) => Card(
              margin: const EdgeInsets.only(bottom: 8),
              color: Colors.orange.shade50,
              child: ListTile(
                leading: Icon(Icons.warning, color: Colors.orange.shade700),
                title: Text(
                  '${conflict.dataType.toUpperCase()} Conflict',
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
                subtitle: Text(
                  conflict.error ?? 'Data conflict detected',
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                trailing: const Icon(Icons.chevron_right),
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute<dynamic>(
                      builder: (context) => ConflictResolutionScreen(
                        conflictItem: conflict,
                      ),
                    ),
                  ).then((resolved) async {
                    if (resolved == true) {
                      await ref.read(syncQueueNotifierProvider.notifier).refresh();
                      ref.invalidate(syncQueueConflictsProvider);
                    }
                  });
                },
              ),
            )),
      ],
    );
  }

  Widget _buildPendingItemsSection(BuildContext context, List<SyncQueueItem> items) {
    if (items.isEmpty) {
      return Card(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Center(
            child: Column(
              children: [
                Icon(Icons.check_circle, size: 48, color: Colors.green.shade300),
                const SizedBox(height: 16),
                Text(
                  'No Pending Items',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: Colors.grey,
                      ),
                ),
                const SizedBox(height: 8),
                Text(
                  'All items are synced or processing',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Colors.grey,
                      ),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Pending Items (${items.length})',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
        ),
        const SizedBox(height: 12),
        ...items.take(10).map((item) => Card(
              margin: const EdgeInsets.only(bottom: 8),
              child: ListTile(
                leading: _getDataTypeIcon(item.dataType),
                title: Text(
                  item.dataType.toUpperCase(),
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
                subtitle: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Priority: ${item.priority}'),
                    Text('Retries: ${item.retryCount}/${item.maxRetries}'),
                    Text(
                      'Created: ${_formatDateTime(item.createdAt)}',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ),
                trailing: _getPriorityBadge(item.priority),
              ),
            )),
        if (items.length > 10)
          Padding(
            padding: const EdgeInsets.all(8.0),
            child: Center(
              child: Text(
                '... and ${items.length - 10} more items',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Colors.grey,
                    ),
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildActionButtons(BuildContext context) {
    final queueStatusAsync = ref.watch(syncQueueNotifierProvider);

    return queueStatusAsync.when(
      data: (status) {
        if (!status.hasPending) {
          return const SizedBox.shrink();
        }
        return Column(
          children: [
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () async {
                  final notifier = ref.read(syncQueueNotifierProvider.notifier);
                  await notifier.processQueue(batchSize: 10);
                  await notifier.refresh();
                  ref.invalidate(syncQueuePendingItemsProvider);
                  ref.invalidate(syncQueueConflictsProvider);
                },
                icon: const Icon(Icons.sync),
                label: const Text('Process Queue Now'),
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
              ),
            ),
          ],
        );
      },
      loading: () => const SizedBox.shrink(),
      error: (_, __) => const SizedBox.shrink(),
    );
  }

  Icon _getDataTypeIcon(String dataType) {
    switch (dataType) {
      case 'quiz':
        return const Icon(Icons.quiz, color: Colors.blue);
      case 'drill':
        return const Icon(Icons.run_circle, color: Colors.green);
      case 'game':
        return const Icon(Icons.sports_esports, color: Colors.purple);
      case 'module':
        return const Icon(Icons.book, color: Colors.orange);
      default:
        return const Icon(Icons.file_upload, color: Colors.grey);
    }
  }

  Widget _getPriorityBadge(int priority) {
    Color color;
    if (priority <= 2) {
      color = Colors.red;
    } else if (priority <= 5) {
      color = Colors.orange;
    } else {
      color = Colors.grey;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color),
      ),
      child: Text(
        'P$priority',
        style: TextStyle(
          color: color,
          fontSize: 10,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  String _formatDateTime(DateTime dateTime) {
    return '${dateTime.year}-${dateTime.month.toString().padLeft(2, '0')}-${dateTime.day.toString().padLeft(2, '0')} '
        '${dateTime.hour.toString().padLeft(2, '0')}:${dateTime.minute.toString().padLeft(2, '0')}';
  }
}

