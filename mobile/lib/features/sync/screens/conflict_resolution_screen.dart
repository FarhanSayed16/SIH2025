/// Phase 3.4.0: Conflict Resolution Screen
/// UI for resolving sync conflicts

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/sync_queue_model.dart';
import '../providers/sync_queue_provider.dart';

class ConflictResolutionScreen extends ConsumerStatefulWidget {
  final SyncQueueItem conflictItem;

  const ConflictResolutionScreen({
    super.key,
    required this.conflictItem,
  });

  @override
  ConsumerState<ConflictResolutionScreen> createState() => _ConflictResolutionScreenState();
}

class _ConflictResolutionScreenState extends ConsumerState<ConflictResolutionScreen> {
  String? _selectedResolution;
  bool _isResolving = false;

  @override
  Widget build(BuildContext context) {
    final conflict = widget.conflictItem;
    final serverData = conflict.conflictData?.serverData;
    final localData = conflict.conflictData?.localData;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Resolve Conflict'),
        actions: [
          if (_isResolving)
            const Padding(
              padding: EdgeInsets.all(16.0),
              child: SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(strokeWidth: 2),
              ),
            ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Conflict Info Card
            Card(
              color: Colors.orange.shade50,
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.warning_amber_rounded, color: Colors.orange.shade700),
                        const SizedBox(width: 8),
                        Text(
                          'Conflict Detected',
                          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                color: Colors.orange.shade700,
                                fontWeight: FontWeight.bold,
                              ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text(
                      'This ${conflict.dataType} has conflicting data between local and server versions.',
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Created: ${_formatDateTime(conflict.createdAt)}',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 24),

            // Data Comparison
            Text(
              'Data Comparison',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: 12),

            // Server Data
            if (serverData != null) ...[
              _buildDataCard(
                context,
                'Server Version',
                serverData,
                Colors.blue.shade50,
                Icons.cloud,
              ),
              const SizedBox(height: 12),
            ],

            // Local Data
            if (localData != null) ...[
              _buildDataCard(
                context,
                'Local Version',
                localData,
                Colors.green.shade50,
                Icons.phone_android,
              ),
              const SizedBox(height: 24),
            ],

            // Resolution Options
            Text(
              'Choose Resolution',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: 12),

            // Server Wins Option
            _buildResolutionOption(
              context,
              'server-wins',
              'Use Server Version',
              'Keep the server version and discard local changes.',
              Icons.cloud_done,
              Colors.blue,
            ),
            const SizedBox(height: 12),

            // Client Wins Option
            _buildResolutionOption(
              context,
              'client-wins',
              'Use Local Version',
              'Keep the local version and overwrite server data.',
              Icons.phone_android,
              Colors.green,
            ),
            const SizedBox(height: 12),

            // Merge Option (if applicable)
            if (_canMerge(serverData, localData)) ...[
              _buildResolutionOption(
                context,
                'merge',
                'Merge Data',
                'Combine data from both versions (if possible).',
                Icons.merge_type,
                Colors.purple,
              ),
              const SizedBox(height: 12),
            ],

            const SizedBox(height: 24),

            // Resolve Button
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _selectedResolution == null || _isResolving
                    ? null
                    : _handleResolve,
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  backgroundColor: Theme.of(context).primaryColor,
                ),
                child: _isResolving
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                        ),
                      )
                    : const Text(
                        'Resolve Conflict',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
              ),
            ),

            const SizedBox(height: 16),

            // Error Message
            if (conflict.error != null) ...[
              Card(
                color: Colors.red.shade50,
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Row(
                    children: [
                      Icon(Icons.error_outline, color: Colors.red.shade700, size: 20),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          conflict.error!,
                          style: TextStyle(
                            color: Colors.red.shade700,
                            fontSize: 12,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildDataCard(
    BuildContext context,
    String title,
    Map<String, dynamic> data,
    Color color,
    IconData icon,
  ) {
    return Card(
      color: color,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, size: 20, color: color == Colors.blue.shade50 ? Colors.blue : Colors.green),
                const SizedBox(width: 8),
                Text(
                  title,
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            ...data.entries.map((entry) => Padding(
                  padding: const EdgeInsets.only(bottom: 4),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      SizedBox(
                        width: 100,
                        child: Text(
                          '${entry.key}:',
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                fontWeight: FontWeight.w500,
                              ),
                        ),
                      ),
                      Expanded(
                        child: Text(
                          entry.value.toString(),
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                      ),
                    ],
                  ),
                )),
          ],
        ),
      ),
    );
  }

  Widget _buildResolutionOption(
    BuildContext context,
    String value,
    String title,
    String description,
    IconData icon,
    Color color,
  ) {
    final isSelected = _selectedResolution == value;

    return InkWell(
      onTap: () {
        setState(() {
          _selectedResolution = value;
        });
      },
      child: Card(
        color: isSelected ? color.withOpacity(0.1) : null,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: BorderSide(
            color: isSelected ? color : Colors.grey.shade300,
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Radio<String>(
                value: value,
                groupValue: _selectedResolution,
                onChanged: (v) {
                  setState(() {
                    _selectedResolution = v;
                  });
                },
                activeColor: color,
              ),
              Icon(icon, color: isSelected ? color : Colors.grey),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                            fontWeight: FontWeight.bold,
                            color: isSelected ? color : null,
                          ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      description,
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  bool _canMerge(Map<String, dynamic>? serverData, Map<String, dynamic>? localData) {
    // Simple check: can merge if both have compatible structures
    if (serverData == null || localData == null) return false;
    // For now, allow merge for quiz and drill types
    final dataType = widget.conflictItem.dataType;
    return dataType == 'quiz' || dataType == 'drill';
  }

  Future<void> _handleResolve() async {
    if (_selectedResolution == null) return;

    setState(() {
      _isResolving = true;
    });

    try {
      final notifier = ref.read(syncQueueNotifierProvider.notifier);
      final success = await notifier.resolveConflict(
        itemId: widget.conflictItem.id,
        resolution: _selectedResolution!,
      );

      if (mounted) {
        if (success) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Conflict resolved successfully'),
              backgroundColor: Colors.green,
            ),
          );
          Navigator.of(context).pop(true);
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Failed to resolve conflict. Please try again.'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isResolving = false;
        });
      }
    }
  }

  String _formatDateTime(DateTime dateTime) {
    return '${dateTime.year}-${dateTime.month.toString().padLeft(2, '0')}-${dateTime.day.toString().padLeft(2, '0')} '
        '${dateTime.hour.toString().padLeft(2, '0')}:${dateTime.minute.toString().padLeft(2, '0')}';
  }
}

