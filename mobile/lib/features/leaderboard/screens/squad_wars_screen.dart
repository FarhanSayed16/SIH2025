import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/leaderboard_provider.dart';
import '../models/leaderboard_model.dart';

class SquadWarsScreen extends ConsumerStatefulWidget {
  const SquadWarsScreen({super.key});

  @override
  ConsumerState<SquadWarsScreen> createState() => _SquadWarsScreenState();
}

class _SquadWarsScreenState extends ConsumerState<SquadWarsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadSquadWars();
    });
  }

  void _loadSquadWars() {
    final authState = ref.read(authProvider);
    final schoolId = authState.user?.institutionId;
    ref.read(squadWarsProvider.notifier).loadSquadWars(
          schoolId: schoolId,
          forceRefresh: false,
        );
  }

  @override
  Widget build(BuildContext context) {
    final squadWarsState = ref.watch(squadWarsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Squad Wars'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              final authState = ref.read(authProvider);
              final schoolId = authState.user?.institutionId;
              ref.read(squadWarsProvider.notifier).loadSquadWars(
                    schoolId: schoolId,
                    forceRefresh: true,
                  );
            },
          ),
        ],
      ),
      body: _buildContent(squadWarsState),
    );
  }

  Widget _buildContent(SquadWarsState state) {
    if (state.isLoading && state.leaderboard.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }

    if (state.error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 64, color: Colors.red[300]),
            const SizedBox(height: 16),
            Text(
              'Error loading Squad Wars',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            Text(
              state.error!,
              style: Theme.of(context).textTheme.bodyMedium,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () {
                final authState = ref.read(authProvider);
                final schoolId = authState.user?.institutionId;
                ref.read(squadWarsProvider.notifier).loadSquadWars(
                      schoolId: schoolId,
                      forceRefresh: true,
                    );
              },
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    if (state.leaderboard.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.emoji_events_outlined, size: 64, color: Colors.grey[400]),
            const SizedBox(height: 16),
            Text(
              'No Squad Wars data yet',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            const Text(
              'Compete with other squads to see rankings!',
              textAlign: TextAlign.center,
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () async {
        final authState = ref.read(authProvider);
        final schoolId = authState.user?.institutionId;
        await ref.read(squadWarsProvider.notifier).loadSquadWars(
              schoolId: schoolId,
              forceRefresh: true,
            );
      },
      child: ListView.builder(
        padding: const EdgeInsets.all(8),
        itemCount: state.leaderboard.length,
        itemBuilder: (context, index) {
          final entry = state.leaderboard[index];
          return _buildSquadEntry(entry, index + 1);
        },
      ),
    );
  }

  Widget _buildSquadEntry(SquadWarsEntry entry, int rank) {
    final medalColor = _getMedalColor(rank);

    return Card(
      margin: const EdgeInsets.symmetric(vertical: 4, horizontal: 8),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Row(
          children: [
            // Rank Badge
            Container(
              width: 60,
              height: 60,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: medalColor,
              ),
              child: Center(
                child: Text(
                  rank.toString(),
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 24,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 16),
            // Squad Info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    entry.squadName,
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${entry.grade} - ${entry.section}',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: Colors.grey[600],
                        ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Icon(Icons.people, size: 16, color: Colors.grey[600]),
                      const SizedBox(width: 4),
                      Text(
                        '${entry.memberCount} members',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ],
                  ),
                ],
              ),
            ),
            // Scores
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: Theme.of(context).colorScheme.primary,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Text(
                    '${entry.squadPoints}',
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 18,
                    ),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Avg: ${entry.averageScore.toStringAsFixed(1)}',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Colors.grey[600],
                      ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Color _getMedalColor(int rank) {
    switch (rank) {
      case 1:
        return Colors.amber.shade700;
      case 2:
        return Colors.grey.shade400;
      case 3:
        return Colors.brown.shade400;
      default:
        return Theme.of(context).colorScheme.primary;
    }
  }
}

