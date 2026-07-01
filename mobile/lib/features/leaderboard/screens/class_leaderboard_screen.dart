import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/leaderboard_provider.dart';
import '../models/leaderboard_model.dart';

class ClassLeaderboardScreen extends ConsumerStatefulWidget {
  const ClassLeaderboardScreen({super.key});

  @override
  ConsumerState<ClassLeaderboardScreen> createState() =>
      _ClassLeaderboardScreenState();
}

class _ClassLeaderboardScreenState
    extends ConsumerState<ClassLeaderboardScreen> {
  String? _selectedClassId;
  LeaderboardResponse? _classLeaderboard;
  bool _isLoading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadClassLeaderboard();
  }

  Future<void> _loadClassLeaderboard() async {
    // Try to get classId from user if not set
    if (_selectedClassId == null) {
      final authState = ref.read(authProvider);
      _selectedClassId = authState.user?.classId;
    }

    // If still no classId, show message
    if (_selectedClassId == null) {
      setState(() {
        _isLoading = false;
        _error = 'No class assigned. Please contact your teacher.';
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final service = ref.read(leaderboardServiceProvider);
      final leaderboard = await service.getClassLeaderboard(
        classId: _selectedClassId!,
        limit: 50,
      );
      setState(() {
        _classLeaderboard = leaderboard;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Class Leaderboard'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadClassLeaderboard,
          ),
        ],
      ),
      body: _buildContent(),
    );
  }

  Widget _buildContent() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 64, color: Colors.red[300]),
            const SizedBox(height: 16),
            Text(
              'Error loading class leaderboard',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            Text(
              _error!,
              style: Theme.of(context).textTheme.bodyMedium,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loadClassLeaderboard,
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    if (_classLeaderboard == null || _classLeaderboard!.leaderboard.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.group_outlined, size: 64, color: Colors.grey[400]),
            const SizedBox(height: 16),
            Text(
              'No class leaderboard data yet',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            const Text(
              'Complete activities with your class to see rankings!',
              textAlign: TextAlign.center,
            ),
          ],
        ),
      );
    }

    final authState = ref.watch(authProvider);
    final currentUserId = authState.user?.id;

    return RefreshIndicator(
      onRefresh: _loadClassLeaderboard,
      child: ListView.builder(
        padding: const EdgeInsets.all(8),
        itemCount: _classLeaderboard!.leaderboard.length,
        itemBuilder: (context, index) {
          final entry = _classLeaderboard!.leaderboard[index];
          final isCurrentUser = entry.userId == currentUserId;
          return _buildLeaderboardEntry(entry, index + 1, isCurrentUser);
        },
      ),
    );
  }

  Widget _buildLeaderboardEntry(
    LeaderboardEntry entry,
    int rank,
    bool isCurrentUser,
  ) {
    final medalColor = _getMedalColor(rank);

    return Card(
      margin: const EdgeInsets.symmetric(vertical: 4, horizontal: 8),
      color: isCurrentUser
          ? Theme.of(context).colorScheme.primaryContainer.withValues(alpha: 0.5)
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
                  fontWeight: isCurrentUser ? FontWeight.bold : FontWeight.normal,
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
        trailing: Text(
          entry.score.toStringAsFixed(0),
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
                color: Theme.of(context).colorScheme.primary,
              ),
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

