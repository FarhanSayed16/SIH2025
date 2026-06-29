/// Phase 3.3.3: Badge Collection Screen
/// Displays all available badges and user's earned badges

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/badge_provider.dart';
import '../models/badge_model.dart' as badge_models;
import 'badge_detail_screen.dart';

class BadgeCollectionScreen extends ConsumerStatefulWidget {
  const BadgeCollectionScreen({super.key});

  @override
  ConsumerState<BadgeCollectionScreen> createState() =>
      _BadgeCollectionScreenState();
}

class _BadgeCollectionScreenState extends ConsumerState<BadgeCollectionScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  String? _selectedCategory;
  final List<String> _categories = [
    'all',
    'module',
    'game',
    'drill',
    'streak',
    'achievement',
    'special'
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    
    // Load badges on init
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(allBadgesProvider.notifier).loadBadges();
      ref.read(myBadgesProvider.notifier).loadMyBadges();
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final allBadgesState = ref.watch(allBadgesProvider);
    final myBadgesState = ref.watch(myBadgesProvider);

    // Get earned badge IDs
    final earnedBadgeIds = myBadgesState.badges.map((b) => b.id.toString()).toSet();

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Badges'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'All Badges', icon: Icon(Icons.star_outline)),
            Tab(text: 'Earned', icon: Icon(Icons.check_circle_outline)),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.filter_list),
            onPressed: _showCategoryFilter,
            tooltip: 'Filter by Category',
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              ref.read(allBadgesProvider.notifier).loadBadges(
                    category: _selectedCategory,
                    forceRefresh: true,
                  );
              ref.read(myBadgesProvider.notifier).loadMyBadges(forceRefresh: true);
            },
            tooltip: 'Refresh',
          ),
        ],
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          // All Badges Tab
          _buildAllBadgesTab(allBadgesState, earnedBadgeIds),
          // Earned Badges Tab
          _buildEarnedBadgesTab(myBadgesState),
        ],
      ),
    );
  }

  Widget _buildAllBadgesTab(
    AllBadgesState state,
    Set<String> earnedBadgeIds,
  ) {
    if (state.isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (state.error != null) {
      return _buildErrorWidget(state.error!);
    }

    if (state.badges.isEmpty) {
      return _buildEmptyWidget('No badges available');
    }

    // Filter by category if selected
    final filteredBadges = _selectedCategory == null || _selectedCategory == 'all'
        ? state.badges
        : state.badges
            .where((b) => b.category == _selectedCategory)
            .toList();

    return RefreshIndicator(
      onRefresh: () async {
        await ref.read(allBadgesProvider.notifier).loadBadges(
              category: _selectedCategory,
              forceRefresh: true,
            );
      },
      child: GridView.builder(
        padding: const EdgeInsets.all(16),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          crossAxisSpacing: 16,
          mainAxisSpacing: 16,
          childAspectRatio: 0.85,
        ),
        itemCount: filteredBadges.length,
        itemBuilder: (context, index) {
          final badge = filteredBadges[index];
          final isEarned = earnedBadgeIds.contains(badge.id.toString());
          return _buildBadgeCard(badge, isEarned);
        },
      ),
    );
  }

  Widget _buildEarnedBadgesTab(MyBadgesState state) {
    if (state.isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (state.error != null) {
      return _buildErrorWidget(state.error!);
    }

    if (state.badges.isEmpty) {
      return _buildEmptyWidget('No badges earned yet. Keep learning!');
    }

    return RefreshIndicator(
      onRefresh: () async {
        await ref.read(myBadgesProvider.notifier).loadMyBadges(forceRefresh: true);
      },
      child: GridView.builder(
        padding: const EdgeInsets.all(16),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          crossAxisSpacing: 16,
          mainAxisSpacing: 16,
          childAspectRatio: 0.85,
        ),
        itemCount: state.badges.length,
        itemBuilder: (context, index) {
          final badge = state.badges[index];
          return _buildBadgeCard(badge, true);
        },
      ),
    );
  }

  Widget _buildBadgeCard(badge_models.Badge badge, bool isEarned) {
    return InkWell(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => BadgeDetailScreen(badgeId: badge.id.toString()),
          ),
        );
      },
      borderRadius: BorderRadius.circular(16),
      child: Card(
        elevation: isEarned ? 4 : 1,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: isEarned
              ? BorderSide(color: Theme.of(context).colorScheme.primary, width: 2)
              : BorderSide.none,
        ),
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            gradient: isEarned
                ? LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      Theme.of(context).colorScheme.primary.withOpacity(0.1),
                      Colors.transparent,
                    ],
                  )
                : null,
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Badge Icon
              Text(
                badge.icon,
                style: TextStyle(
                  fontSize: 56,
                  color: isEarned ? null : Colors.grey[400],
                ),
              ),
              const SizedBox(height: 8),
              // Badge Name
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 8),
                child: Text(
                  badge.name,
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: isEarned ? null : Colors.grey[600],
                  ),
                  textAlign: TextAlign.center,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(height: 4),
              // Badge Category
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: isEarned
                      ? Theme.of(context).colorScheme.primary.withOpacity(0.2)
                      : Colors.grey[300],
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  badge.category.toUpperCase(),
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                    color: isEarned
                        ? Theme.of(context).colorScheme.primary
                        : Colors.grey[600],
                  ),
                ),
              ),
              if (!isEarned) ...[
                const SizedBox(height: 4),
                Icon(
                  Icons.lock_outline,
                  size: 16,
                  color: Colors.grey[400],
                ),
              ],
            ],
          ),
        ),
      ),
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
              ref.read(allBadgesProvider.notifier).loadBadges(
                    category: _selectedCategory,
                    forceRefresh: true,
                  );
            },
            child: const Text('Retry'),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyWidget(String message) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.star_outline, size: 64, color: Colors.grey[400]),
          const SizedBox(height: 16),
          Text(
            message,
            style: TextStyle(color: Colors.grey[600], fontSize: 16),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  void _showCategoryFilter() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Filter by Category'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: _categories.map((category) {
              // final isSelected = _selectedCategory == category; // Not used
            return RadioListTile<String>(
              title: Text(category.toUpperCase()),
              value: category,
              groupValue: _selectedCategory ?? 'all',
              onChanged: (value) {
                setState(() {
                  _selectedCategory = value == 'all' ? null : value;
                });
                Navigator.pop(context);
                ref.read(allBadgesProvider.notifier).loadBadges(
                      category: _selectedCategory,
                      forceRefresh: true,
                    );
              },
            );
          }).toList(),
        ),
        actions: [
          TextButton(
            onPressed: () {
              setState(() {
                _selectedCategory = null;
              });
              Navigator.pop(context);
              ref.read(allBadgesProvider.notifier).loadBadges(forceRefresh: true);
            },
            child: const Text('Clear Filter'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }
}

