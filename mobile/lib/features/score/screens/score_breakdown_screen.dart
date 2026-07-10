/// Phase 3.3.1: Score Breakdown Screen
/// Shows detailed breakdown of preparedness score components

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/constants/app_constants.dart';
import '../providers/preparedness_score_provider.dart';
import '../models/preparedness_score_model.dart';

class ScoreBreakdownScreen extends ConsumerWidget {
  const ScoreBreakdownScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final scoreState = ref.watch(preparednessScoreProvider);
    final score = scoreState.score;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Score Breakdown'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              ref.read(preparednessScoreProvider.notifier).recalculateScore();
            },
            tooltip: 'Recalculate',
          ),
        ],
      ),
      body: scoreState.isLoading
          ? const Center(child: CircularProgressIndicator())
          : scoreState.error != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.error_outline,
                          size: 64, color: Colors.red[300]),
                      const SizedBox(height: 16),
                      Text(
                        scoreState.error!,
                        style: TextStyle(color: Colors.red[700]),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: () {
                          ref
                              .read(preparednessScoreProvider.notifier)
                              .loadScore(forceRefresh: true);
                        },
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                )
              : score == null
                  ? const Center(child: Text('No score data available'))
                  : SingleChildScrollView(
                      padding: const EdgeInsets.all(AppConstants.defaultPadding),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Total Score Card
                          Card(
                            child: Padding(
                              padding: const EdgeInsets.all(24.0),
                              child: Column(
                                children: [
                                  Text(
                                    'Total Preparedness Score',
                                    style: Theme.of(context).textTheme.titleLarge,
                                  ),
                                  const SizedBox(height: 16),
                                  SizedBox(
                                    width: 120,
                                    height: 120,
                                    child: Stack(
                                      alignment: Alignment.center,
                                      children: [
                                        CircularProgressIndicator(
                                          value: score.score / 100,
                                          strokeWidth: 10,
                                          backgroundColor: Colors.grey[300],
                                          valueColor: AlwaysStoppedAnimation<Color>(
                                            score.score >= 80
                                                ? Colors.green
                                                : score.score >= 60
                                                    ? Colors.orange
                                                    : Colors.red,
                                          ),
                                        ),
                                        Column(
                                          mainAxisAlignment:
                                              MainAxisAlignment.center,
                                          children: [
                                            Text(
                                              '${score.score}%',
                                              style: Theme.of(context)
                                                  .textTheme
                                                  .headlineMedium
                                                  ?.copyWith(
                                                    fontWeight: FontWeight.bold,
                                                  ),
                                            ),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ),
                                  if (score.lastUpdated != null) ...[
                                    const SizedBox(height: 8),
                                    Text(
                                      'Last updated: ${_formatDate(score.lastUpdated!)}',
                                      style: Theme.of(context).textTheme.bodySmall,
                                    ),
                                  ],
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(height: 24),

                          // Score Components
                          Text(
                            'Score Components',
                            style: Theme.of(context).textTheme.titleLarge,
                          ),
                          const SizedBox(height: 16),

                          _ScoreComponentCard(
                            title: 'Module Completion',
                            icon: Icons.school,
                            color: Colors.blue,
                            component: score.breakdown.module,
                            description: 'Based on completed learning modules',
                          ),
                          const SizedBox(height: 12),
                          _ScoreComponentCard(
                            title: 'Game Performance',
                            icon: Icons.games,
                            color: Colors.purple,
                            component: score.breakdown.game,
                            description: 'Based on game scores and performance',
                          ),
                          const SizedBox(height: 12),
                          _ScoreComponentCard(
                            title: 'Quiz Accuracy',
                            icon: Icons.quiz,
                            color: Colors.teal,
                            component: score.breakdown.quiz,
                            description: 'Based on quiz scores and accuracy',
                          ),
                          const SizedBox(height: 12),
                          _ScoreComponentCard(
                            title: 'Drill Participation',
                            icon: Icons.fire_extinguisher,
                            color: Colors.orange,
                            component: score.breakdown.drill,
                            description: 'Based on drill participation and response time',
                          ),
                          const SizedBox(height: 12),
                          _ScoreComponentCard(
                            title: 'Login Streak',
                            icon: Icons.local_fire_department,
                            color: Colors.red,
                            component: score.breakdown.streak,
                            description: 'Based on daily login streaks',
                          ),

                          const SizedBox(height: 24),

                          // Formula Info
                          Card(
                            color: Colors.blue[50],
                            child: Padding(
                              padding: const EdgeInsets.all(16.0),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Icon(Icons.info_outline,
                                          color: Colors.blue[700]),
                                      const SizedBox(width: 8),
                                      Text(
                                        'How Your Score is Calculated',
                                        style: Theme.of(context)
                                            .textTheme
                                            .titleMedium
                                            ?.copyWith(
                                              fontWeight: FontWeight.bold,
                                            ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 12),
                                  Text(
                                    'Total Score = (Module × 40%) + (Game × 25%) + (Quiz × 20%) + (Drill × 10%) + (Streak × 5%)',
                                    style: Theme.of(context).textTheme.bodyMedium,
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
    );
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final difference = now.difference(date);

    if (difference.inMinutes < 1) {
      return 'Just now';
    } else if (difference.inMinutes < 60) {
      return '${difference.inMinutes}m ago';
    } else if (difference.inHours < 24) {
      return '${difference.inHours}h ago';
    } else if (difference.inDays < 7) {
      return '${difference.inDays}d ago';
    } else {
      return '${date.day}/${date.month}/${date.year}';
    }
  }
}

class _ScoreComponentCard extends StatelessWidget {
  final String title;
  final IconData icon;
  final Color color;
  final ScoreComponent component;
  final String description;

  const _ScoreComponentCard({
    required this.title,
    required this.icon,
    required this.color,
    required this.component,
    required this.description,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, color: color, size: 24),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                      ),
                      Text(
                        description,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: Colors.grey[600],
                            ),
                      ),
                    ],
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      '${component.score}%',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.bold,
                            color: color,
                          ),
                    ),
                    Text(
                      'Weight: ${component.weight}%',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: Colors.grey[600],
                          ),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 12),
            // Progress bar
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: component.score / 100,
                minHeight: 8,
                backgroundColor: Colors.grey[200],
                valueColor: AlwaysStoppedAnimation<Color>(color),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

