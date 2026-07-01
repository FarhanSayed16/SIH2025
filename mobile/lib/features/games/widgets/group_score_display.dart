/// Phase 3.2.4: Group Score Display Widget
/// Shows aggregated scores for group game session

import 'package:flutter/material.dart';

class GroupScoreDisplay extends StatelessWidget {
  final Map<String, dynamic> groupScores;
  final List<Map<String, dynamic>> participants;

  const GroupScoreDisplay({
    super.key,
    required this.groupScores,
    required this.participants,
  });

  @override
  Widget build(BuildContext context) {
    final totalScore = groupScores['totalScore'] as int? ?? 0;
    final averageScore = groupScores['averageScore'] as int? ?? 0;
    final totalTurns = groupScores['totalTurns'] as int? ?? 0;
    final completedCount = groupScores['completedCount'] as int? ?? 0;
    final completionRate = groupScores['completionRate'] as int? ?? 0;

    return Card(
      elevation: 3,
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.group, color: Colors.blue, size: 28),
                const SizedBox(width: 8),
                Text(
                  'Group Game Results',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            // Summary stats
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildStatCard(
                  context,
                  'Total Score',
                  totalScore.toString(),
                  Icons.star,
                  Colors.amber,
                ),
                _buildStatCard(
                  context,
                  'Average',
                  averageScore.toString(),
                  Icons.trending_up,
                  Colors.green,
                ),
                _buildStatCard(
                  context,
                  'Turns',
                  '$completedCount/$totalTurns',
                  Icons.people,
                  Colors.blue,
                ),
              ],
            ),
            const SizedBox(height: 16),
            // Completion rate
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Completion Rate',
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                      const SizedBox(height: 4),
                      LinearProgressIndicator(
                        value: completionRate / 100,
                        backgroundColor: Colors.grey[300],
                        valueColor: AlwaysStoppedAnimation<Color>(
                          completionRate >= 80
                              ? Colors.green
                              : completionRate >= 50
                                  ? Colors.orange
                                  : Colors.red,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '$completionRate%',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            // Participants list
            if (participants.isNotEmpty) ...[
              const Divider(),
              const SizedBox(height: 8),
              Text(
                'Participants',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
              const SizedBox(height: 8),
              ...participants.map((participant) {
                final name = participant['studentId']?['name']?.toString() ??
                    participant['name']?.toString() ??
                    'Unknown';
                final score = participant['score'] as int? ?? 0;
                final completed = participant['completed'] as bool? ?? false;

                return ListTile(
                  dense: true,
                  leading: CircleAvatar(
                    radius: 16,
                    backgroundColor: completed ? Colors.green[100] : Colors.grey[300],
                    child: Icon(
                      completed ? Icons.check : Icons.person,
                      size: 16,
                      color: completed ? Colors.green[700] : Colors.grey[700],
                    ),
                  ),
                  title: Text(name),
                  trailing: Text(
                    '$score pts',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      color: completed ? Colors.green[700] : Colors.grey[600],
                    ),
                  ),
                );
              }),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildStatCard(
    BuildContext context,
    String label,
    String value,
    IconData icon,
    Color color,
  ) {
    return Column(
      children: [
        Icon(icon, color: color, size: 24),
        const SizedBox(height: 4),
        Text(
          value,
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
                color: color,
              ),
        ),
        Text(
          label,
          style: Theme.of(context).textTheme.bodySmall,
        ),
      ],
    );
  }
}

