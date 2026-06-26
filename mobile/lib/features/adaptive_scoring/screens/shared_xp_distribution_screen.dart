/// Phase 3.3.2: Shared XP Distribution Screen
/// Shows shared XP distribution history for a class

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/constants/app_constants.dart';
import '../providers/adaptive_scoring_provider.dart';
import '../models/adaptive_scoring_models.dart';

class SharedXPDistributionScreen extends ConsumerStatefulWidget {
  final String classId;
  final String? className;

  const SharedXPDistributionScreen({
    super.key,
    required this.classId,
    this.className,
  });

  @override
  ConsumerState<SharedXPDistributionScreen> createState() =>
      _SharedXPDistributionScreenState();
}

class _SharedXPDistributionScreenState
    extends ConsumerState<SharedXPDistributionScreen> {
  String? _selectedActivityType;
  DateTime? _startDate;
  DateTime? _endDate;

  @override
  void initState() {
    super.initState();
    // Load distributions on init
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref
          .read(sharedXPDistributionProvider(widget.classId).notifier)
          .loadDistributions(classId: widget.classId);
    });
  }

  @override
  Widget build(BuildContext context) {
    final distributionState =
        ref.watch(sharedXPDistributionProvider(widget.classId));

    return Scaffold(
      appBar: AppBar(
        title: Text(widget.className ?? 'Shared XP'),
        actions: [
          IconButton(
            icon: const Icon(Icons.filter_list),
            onPressed: _showFilterDialog,
            tooltip: 'Filter',
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              ref
                  .read(sharedXPDistributionProvider(widget.classId).notifier)
                  .loadDistributions(
                    classId: widget.classId,
                    activityType: _selectedActivityType,
                    startDate: _startDate,
                    endDate: _endDate,
                    forceRefresh: true,
                  );
            },
            tooltip: 'Refresh',
          ),
        ],
      ),
      body: distributionState.isLoading
          ? const Center(child: CircularProgressIndicator())
          : distributionState.error != null
              ? _buildErrorWidget(distributionState.error!)
              : distributionState.distributions.isEmpty
                  ? _buildEmptyWidget()
                  : _buildDistributionsList(distributionState.distributions),
    );
  }

  Widget _buildErrorWidget(String error) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.error_outline, size: 64, color: Colors.red[300]),
          const SizedBox(height: 16),
          Text(
            error,
            style: TextStyle(color: Colors.red[700]),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: () {
              ref
                  .read(sharedXPDistributionProvider(widget.classId).notifier)
                  .loadDistributions(
                    classId: widget.classId,
                    activityType: _selectedActivityType,
                    startDate: _startDate,
                    endDate: _endDate,
                    forceRefresh: true,
                  );
            },
            child: const Text('Retry'),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyWidget() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.share_outlined, size: 64, color: Colors.grey[400]),
          const SizedBox(height: 16),
          Text(
            'No shared XP distributions found',
            style: TextStyle(color: Colors.grey[600]),
          ),
          const SizedBox(height: 8),
          Text(
            'Shared XP is distributed when modules are completed in class mode',
            style: TextStyle(
              color: Colors.grey[500],
              fontSize: 12,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildDistributionsList(List<SharedXPDistribution> distributions) {
    return RefreshIndicator(
      onRefresh: () async {
        await ref
            .read(sharedXPDistributionProvider(widget.classId).notifier)
            .loadDistributions(
              classId: widget.classId,
              activityType: _selectedActivityType,
              startDate: _startDate,
              endDate: _endDate,
              forceRefresh: true,
            );
      },
      child: ListView.builder(
        padding: const EdgeInsets.all(AppConstants.defaultPadding),
        itemCount: distributions.length,
        itemBuilder: (context, index) {
          final distribution = distributions[index];
          return _DistributionCard(distribution: distribution);
        },
      ),
    );
  }

  void _showFilterDialog() {
    showDialog<void>(
      context: context,
      builder: (context) => _FilterDialog(
        selectedActivityType: _selectedActivityType,
        startDate: _startDate,
        endDate: _endDate,
        onApply: (activityType, startDate, endDate) {
          setState(() {
            _selectedActivityType = activityType;
            _startDate = startDate;
            _endDate = endDate;
          });
          ref
              .read(sharedXPDistributionProvider(widget.classId).notifier)
              .loadDistributions(
                classId: widget.classId,
                activityType: _selectedActivityType,
                startDate: _startDate,
                endDate: _endDate,
                forceRefresh: true,
              );
          Navigator.pop(context);
        },
        onClear: () {
          setState(() {
            _selectedActivityType = null;
            _startDate = null;
            _endDate = null;
          });
          ref
              .read(sharedXPDistributionProvider(widget.classId).notifier)
              .loadDistributions(
                classId: widget.classId,
                forceRefresh: true,
              );
          Navigator.pop(context);
        },
      ),
    );
  }
}

class _DistributionCard extends StatelessWidget {
  final SharedXPDistribution distribution;

  const _DistributionCard({required this.distribution});

  @override
  Widget build(BuildContext context) {
    final dateFormat = DateFormat('MMM dd, yyyy • HH:mm');
    final icon = _getActivityIcon(distribution.activityType);
    final color = _getActivityColor(distribution.activityType);

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ExpansionTile(
        leading: CircleAvatar(
          backgroundColor: color.withOpacity(0.2),
          child: Icon(icon, color: color),
        ),
        title: Text(
          distribution.activityName,
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              _capitalizeFirst(distribution.activityType),
              style: TextStyle(color: Colors.grey[600], fontSize: 12),
            ),
            const SizedBox(height: 4),
            Text(
              dateFormat.format(distribution.distributedAt),
              style: TextStyle(color: Colors.grey[500], fontSize: 11),
            ),
          ],
        ),
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.people, size: 16, color: Colors.grey[600]),
                const SizedBox(width: 4),
                Text(
                  '${distribution.totalParticipants}',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: Colors.grey[700],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 4),
            if (distribution.averageScore > 0)
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.star, size: 14, color: Colors.amber),
                  const SizedBox(width: 2),
                  Text(
                    '${distribution.averageScore.toStringAsFixed(1)}%',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey[600],
                    ),
                  ),
                ],
              ),
          ],
        ),
        children: [
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Divider(),
                const SizedBox(height: 8),
                Text(
                  'Participants (${distribution.participants.length})',
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
                const SizedBox(height: 8),
                ...distribution.participants.take(5).map((participant) {
                  return ListTile(
                    dense: true,
                    leading: CircleAvatar(
                      radius: 16,
                      child: Text(
                        participant.name.isNotEmpty
                            ? participant.name[0].toUpperCase()
                            : '?',
                        style: const TextStyle(fontSize: 12),
                      ),
                    ),
                    title: Text(participant.name),
                    trailing: participant.completed
                        ? Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.check_circle,
                                  size: 16, color: Colors.green),
                              const SizedBox(width: 4),
                              Text(
                                '${participant.score.toStringAsFixed(0)}%',
                                style: const TextStyle(fontSize: 12),
                              ),
                            ],
                          )
                        : Icon(Icons.cancel, size: 16, color: Colors.grey),
                  );
                }).toList(),
                if (distribution.participants.length > 5)
                  Padding(
                    padding: const EdgeInsets.only(top: 8.0),
                    child: Text(
                      '...and ${distribution.participants.length - 5} more',
                      style: TextStyle(
                        color: Colors.grey[600],
                        fontSize: 12,
                        fontStyle: FontStyle.italic,
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  IconData _getActivityIcon(String activityType) {
    switch (activityType) {
      case 'module':
        return Icons.school;
      case 'quiz':
        return Icons.quiz;
      case 'game':
        return Icons.games;
      case 'drill':
        return Icons.fire_extinguisher;
      default:
        return Icons.star;
    }
  }

  Color _getActivityColor(String activityType) {
    switch (activityType) {
      case 'module':
        return Colors.blue;
      case 'quiz':
        return Colors.purple;
      case 'game':
        return Colors.orange;
      case 'drill':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  String _capitalizeFirst(String text) {
    if (text.isEmpty) return text;
    return text[0].toUpperCase() + text.substring(1);
  }
}

class _FilterDialog extends StatefulWidget {
  final String? selectedActivityType;
  final DateTime? startDate;
  final DateTime? endDate;
  final void Function(String?, DateTime?, DateTime?) onApply;
  final VoidCallback onClear;

  const _FilterDialog({
    required this.selectedActivityType,
    required this.startDate,
    required this.endDate,
    required this.onApply,
    required this.onClear,
  });

  @override
  State<_FilterDialog> createState() => _FilterDialogState();
}

class _FilterDialogState extends State<_FilterDialog> {
  late String? _selectedActivityType;
  late DateTime? _startDate;
  late DateTime? _endDate;

  @override
  void initState() {
    super.initState();
    _selectedActivityType = widget.selectedActivityType;
    _startDate = widget.startDate;
    _endDate = widget.endDate;
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Filter Distributions'),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            DropdownButtonFormField<String>(
              value: _selectedActivityType,
              decoration: const InputDecoration(
                labelText: 'Activity Type',
                border: OutlineInputBorder(),
              ),
              items: [
                const DropdownMenuItem(value: null, child: Text('All Activities')),
                const DropdownMenuItem(value: 'module', child: Text('Module')),
                const DropdownMenuItem(value: 'quiz', child: Text('Quiz')),
                const DropdownMenuItem(value: 'game', child: Text('Game')),
                const DropdownMenuItem(value: 'drill', child: Text('Drill')),
              ],
              onChanged: (value) {
                setState(() {
                  _selectedActivityType = value;
                });
              },
            ),
            const SizedBox(height: 16),
            ListTile(
              title: Text(_startDate == null
                  ? 'Start Date (Optional)'
                  : 'Start: ${_formatDate(_startDate!)}'),
              trailing: const Icon(Icons.calendar_today),
              onTap: () async {
                final date = await showDatePicker(
                  context: context,
                  initialDate: _startDate ?? DateTime.now(),
                  firstDate: DateTime(2020),
                  lastDate: DateTime.now(),
                );
                if (date != null) {
                  setState(() {
                    _startDate = date;
                  });
                }
              },
            ),
            ListTile(
              title: Text(_endDate == null
                  ? 'End Date (Optional)'
                  : 'End: ${_formatDate(_endDate!)}'),
              trailing: const Icon(Icons.calendar_today),
              onTap: () async {
                final date = await showDatePicker(
                  context: context,
                  initialDate: _endDate ?? DateTime.now(),
                  firstDate: _startDate ?? DateTime(2020),
                  lastDate: DateTime.now(),
                );
                if (date != null) {
                  setState(() {
                    _endDate = date;
                  });
                }
              },
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: widget.onClear,
          child: const Text('Clear'),
        ),
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Cancel'),
        ),
        ElevatedButton(
          onPressed: () {
            widget.onApply(_selectedActivityType, _startDate, _endDate);
          },
          child: const Text('Apply'),
        ),
      ],
    );
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }
}

