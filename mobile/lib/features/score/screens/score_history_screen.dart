/// Phase 3.3.1: Score History Screen
/// Shows historical preparedness score data

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/constants/app_constants.dart';
import '../providers/preparedness_score_provider.dart';
import '../models/preparedness_score_model.dart';

class ScoreHistoryScreen extends ConsumerStatefulWidget {
  const ScoreHistoryScreen({super.key});

  @override
  ConsumerState<ScoreHistoryScreen> createState() => _ScoreHistoryScreenState();
}

class _ScoreHistoryScreenState extends ConsumerState<ScoreHistoryScreen> {
  int _selectedLimit = 30;

  @override
  void initState() {
    super.initState();
    // Load history when screen initializes
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(scoreHistoryProvider.notifier).loadHistory(limit: _selectedLimit);
    });
  }

  @override
  Widget build(BuildContext context) {
    final historyState = ref.watch(scoreHistoryProvider);
    final entries = historyState.entries;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Score History'),
        actions: [
          PopupMenuButton<int>(
            icon: const Icon(Icons.more_vert),
            onSelected: (limit) {
              setState(() {
                _selectedLimit = limit;
              });
              ref.read(scoreHistoryProvider.notifier).loadHistory(limit: limit);
            },
            itemBuilder: (context) => [
              const PopupMenuItem(value: 7, child: Text('Last 7 days')),
              const PopupMenuItem(value: 30, child: Text('Last 30 days')),
              const PopupMenuItem(value: 90, child: Text('Last 90 days')),
            ],
          ),
        ],
      ),
      body: historyState.isLoading
          ? const Center(child: CircularProgressIndicator())
          : historyState.error != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.error_outline,
                          size: 64, color: Colors.red[300]),
                      const SizedBox(height: 16),
                      Text(
                        historyState.error!,
                        style: TextStyle(color: Colors.red[700]),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: () {
                          ref
                              .read(scoreHistoryProvider.notifier)
                              .loadHistory(limit: _selectedLimit);
                        },
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                )
              : entries.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.history,
                              size: 64, color: Colors.grey[400]),
                          const SizedBox(height: 16),
                          Text(
                            'No score history available',
                            style: TextStyle(color: Colors.grey[600]),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Complete activities to see your score history',
                            style: TextStyle(
                              color: Colors.grey[500],
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    )
                  : SingleChildScrollView(
                      padding: const EdgeInsets.all(AppConstants.defaultPadding),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Summary Stats
                          if (entries.length > 0) ...[
                            Card(
                              child: Padding(
                                padding: const EdgeInsets.all(16.0),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                                  children: [
                                    _StatCard(
                                      label: 'Current',
                                      value: '${entries.first.score}%',
                                      color: Colors.blue,
                                    ),
                                    _StatCard(
                                      label: 'Average',
                                      value: '${_calculateAverage(entries)}%',
                                      color: Colors.green,
                                    ),
                                    _StatCard(
                                      label: 'Highest',
                                      value: '${_calculateHighest(entries)}%',
                                      color: Colors.orange,
                                    ),
                                  ],
                                ),
                              ),
                            ),
                            const SizedBox(height: 24),
                          ],

                          // History List
                          Text(
                            'History',
                            style: Theme.of(context).textTheme.titleLarge,
                          ),
                          const SizedBox(height: 16),

                          ListView.builder(
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            itemCount: entries.length,
                            itemBuilder: (context, index) {
                              final entry = entries[index];
                              final isLatest = index == 0;

                              return Card(
                                margin: const EdgeInsets.only(bottom: 12),
                                color: isLatest ? Colors.blue[50] : null,
                                child: ListTile(
                                  leading: CircleAvatar(
                                    backgroundColor: isLatest
                                        ? Colors.blue
                                        : Colors.grey[300],
                                    child: Icon(
                                      isLatest ? Icons.trending_up : Icons.history,
                                      color: isLatest ? Colors.white : Colors.grey[700],
                                    ),
                                  ),
                                  title: Text(
                                    '${entry.score}%',
                                    style: Theme.of(context)
                                        .textTheme
                                        .titleMedium
                                        ?.copyWith(
                                          fontWeight: FontWeight.bold,
                                          color: isLatest ? Colors.blue[700] : null,
                                        ),
                                  ),
                                  subtitle: Text(_formatDate(entry.date)),
                                  trailing: isLatest
                                      ? Chip(
                                          label: const Text('Latest'),
                                          backgroundColor: Colors.blue[100],
                                          labelStyle: TextStyle(
                                            color: Colors.blue[900],
                                            fontSize: 10,
                                          ),
                                        )
                                      : null,
                                ),
                              );
                            },
                          ),
                        ],
                      ),
                    ),
    );
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final difference = now.difference(date);

    if (difference.inDays == 0) {
      return 'Today ${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
    } else if (difference.inDays == 1) {
      return 'Yesterday';
    } else if (difference.inDays < 7) {
      return '${difference.inDays} days ago';
    } else {
      return '${date.day}/${date.month}/${date.year}';
    }
  }

  int _calculateAverage(List<ScoreHistoryEntry> entries) {
    if (entries.isEmpty) return 0;
    final total = entries.fold<int>(0, (sum, entry) => sum + entry.score);
    return (total / entries.length).round();
  }

  int _calculateHighest(List<ScoreHistoryEntry> entries) {
    if (entries.isEmpty) return 0;
    return entries.map((e) => e.score).reduce((a, b) => a > b ? a : b);
  }
}

class _StatCard extends StatelessWidget {
  final String label;
  final String value;
  final Color color;

  const _StatCard({
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(
          value,
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
                color: color,
              ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Colors.grey[600],
              ),
        ),
      ],
    );
  }
}

