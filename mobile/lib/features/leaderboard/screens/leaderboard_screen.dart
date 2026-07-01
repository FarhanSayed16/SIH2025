import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/leaderboard_provider.dart';
import '../models/leaderboard_model.dart';
import 'class_leaderboard_screen.dart';
import 'squad_wars_screen.dart';

class LeaderboardScreen extends ConsumerStatefulWidget {
  const LeaderboardScreen({super.key});

  @override
  ConsumerState<LeaderboardScreen> createState() => _LeaderboardScreenState();
}

class _LeaderboardScreenState extends ConsumerState<LeaderboardScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  void _loadInitialLeaderboard() {
    final authState = ref.read(authProvider);
    final schoolId = authState.user?.institutionId;

    ref.read(leaderboardProvider.notifier).loadLeaderboard(
          schoolId: schoolId,
          type: 'overall',
          forceRefresh: false,
        );
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  void _onTabChanged() {
    // Only load when tab change is complete (not during animation)
    if (!_tabController.indexIsChanging) {
      final authState = ref.read(authProvider);
      final schoolId = authState.user?.institutionId;
      final type = _getTypeForIndex(_tabController.index);
      final gameType =
          type == 'games' ? 'bag-packer' : null; // Default game type

      // Check if we already have data for this type to avoid unnecessary loads
      final currentState = ref.read(leaderboardProvider);
      final cacheKey = type == 'games' ? '$type-$gameType' : type;
      final currentCacheKey = currentState.currentType == 'games'
          ? '${currentState.currentType}-${currentState.currentGameType}'
          : currentState.currentType;

      // Only load if we don't have this type cached or if it's stale
      if (cacheKey != currentCacheKey || currentState.leaderboard == null) {
        ref.read(leaderboardProvider.notifier).loadLeaderboard(
              schoolId: schoolId,
              type: type,
              gameType: gameType,
              forceRefresh: false,
            );
      }
    }
  }

  String _getTypeForIndex(int index) {
    switch (index) {
      case 0:
        return 'overall';
      case 1:
        return 'preparedness';
      case 2:
        return 'quizzes';
      case 3:
        return 'games';
      case 4:
        return 'badges';
      default:
        return 'overall';
    }
  }

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 5, vsync: this);
    _tabController.addListener(_onTabChanged);
    // Load initial leaderboard
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadInitialLeaderboard();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Leaderboard'),
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          tabs: const [
            Tab(text: 'Overall'),
            Tab(text: 'Preparedness'),
            Tab(text: 'Quizzes'),
            Tab(text: 'Games'),
            Tab(text: 'Badges'),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              final authState = ref.read(authProvider);
              final schoolId = authState.user?.institutionId;
              final type = _getTypeForIndex(_tabController.index);
              final gameType = type == 'games' ? 'bag-packer' : null;
              ref.read(leaderboardProvider.notifier).loadLeaderboard(
                    schoolId: schoolId,
                    type: type,
                    gameType: gameType,
                    forceRefresh: true,
                  );
            },
          ),
          IconButton(
            icon: const Icon(Icons.group),
            onPressed: () {
              Navigator.push<void>(
                context,
                MaterialPageRoute<void>(
                  builder: (context) => const ClassLeaderboardScreen(),
                ),
              );
            },
            tooltip: 'Class Leaderboard',
          ),
          IconButton(
            icon: const Icon(Icons.emoji_events),
            onPressed: () {
              Navigator.push<void>(
                context,
                MaterialPageRoute<void>(
                  builder: (context) => const SquadWarsScreen(),
                ),
              );
            },
            tooltip: 'Squad Wars',
          ),
        ],
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildLeaderboardContent('overall'),
          _buildLeaderboardContent('preparedness'),
          _buildLeaderboardContent('quizzes'),
          _buildLeaderboardContent('games'),
          _buildLeaderboardContent('badges'),
        ],
      ),
    );
  }

  Widget _buildLeaderboardContent(String type) {
    final leaderboardState = ref.watch(leaderboardProvider);
    final authState = ref.watch(authProvider);
    final currentUserId = authState.user?.id;
    // Note: gameType is only used for display/refresh, not for fetching in build()
    // Data loading is handled only in:
    // 1. initState() - initial load
    // 2. _onTabChanged() - when user switches tabs
    // 3. Refresh button/RefreshIndicator - manual refresh

    if (leaderboardState.isLoading && leaderboardState.leaderboard == null) {
      return const Center(child: CircularProgressIndicator());
    }

    if (leaderboardState.error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.error_outline,
              size: 64,
              color: Colors.red[300],
            ),
            const SizedBox(height: 16),
            Text(
              'Error loading leaderboard',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            Text(
              leaderboardState.error!,
              style: Theme.of(context).textTheme.bodyMedium,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () {
                final schoolId = authState.user?.institutionId;
                final gameType = type == 'games' ? 'bag-packer' : null;
                ref.read(leaderboardProvider.notifier).loadLeaderboard(
                      schoolId: schoolId,
                      type: type,
                      gameType: gameType,
                      forceRefresh: true,
                    );
              },
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    final leaderboard = leaderboardState.leaderboard;
    if (leaderboard == null || leaderboard.leaderboard.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.emoji_events_outlined,
              size: 64,
              color: Colors.grey[400],
            ),
            const SizedBox(height: 16),
            Text(
              'No leaderboard data yet',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            Text(
              'Complete activities to see your ranking!',
              style: Theme.of(context).textTheme.bodyMedium,
              textAlign: TextAlign.center,
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () async {
        final schoolId = authState.user?.institutionId;
        final gameType = type == 'games' ? 'bag-packer' : null;
        await ref.read(leaderboardProvider.notifier).loadLeaderboard(
              schoolId: schoolId,
              type: type,
              gameType: gameType,
              forceRefresh: true,
            );
      },
      child: ListView.builder(
        padding: const EdgeInsets.all(8),
        itemCount: leaderboard.leaderboard.length,
        itemBuilder: (context, index) {
          final entry = leaderboard.leaderboard[index];
          final isCurrentUser = entry.userId == currentUserId;
          return _buildLeaderboardEntry(entry, index, isCurrentUser);
        },
      ),
    );
  }

  Widget _buildLeaderboardEntry(
    LeaderboardEntry entry,
    int index,
    bool isCurrentUser,
  ) {
    final rank = index + 1;
    final medalColor = _getMedalColor(rank);

    return Card(
      margin: const EdgeInsets.symmetric(vertical: 4, horizontal: 8),
      color: isCurrentUser
          ? Theme.of(context)
              .colorScheme
              .primaryContainer
              .withValues(alpha: 0.5)
          : null,
      child: ListTile(
        leading: Container(
          width: 50,
          height: 50,
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
                fontSize: 18,
              ),
            ),
          ),
        ),
        title: Row(
          children: [
            Expanded(
              child: Text(
                entry.name,
                style: TextStyle(
                  fontWeight:
                      isCurrentUser ? FontWeight.bold : FontWeight.normal,
                ),
              ),
            ),
            if (isCurrentUser)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.primary,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Text(
                  'You',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
          ],
        ),
        subtitle: entry.email != null ? Text(entry.email!) : null,
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(
              entry.score.toStringAsFixed(0),
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: Theme.of(context).colorScheme.primary,
                  ),
            ),
            if (entry.additionalData != null &&
                entry.additionalData!['badgeCount'] != null)
              Text(
                '${entry.additionalData!['badgeCount']} badges',
                style: Theme.of(context).textTheme.bodySmall,
              ),
          ],
        ),
        isThreeLine: entry.email != null,
      ),
    );
  }

  Color _getMedalColor(int rank) {
    switch (rank) {
      case 1:
        return Colors.amber.shade700; // Gold
      case 2:
        return Colors.grey.shade400; // Silver
      case 3:
        return Colors.brown.shade400; // Bronze
      default:
        return Theme.of(context).colorScheme.primary;
    }
  }
}
