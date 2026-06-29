/// Phase 3.3.3: Badge Detail Screen
/// Shows detailed information about a specific badge

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/badge_provider.dart';
import '../models/badge_model.dart' as badge_models;
import '../services/badge_service.dart';
import '../../../core/providers/api_service_provider.dart';

class BadgeDetailScreen extends ConsumerStatefulWidget {
  final String badgeId;

  const BadgeDetailScreen({
    super.key,
    required this.badgeId,
  });

  @override
  ConsumerState<BadgeDetailScreen> createState() => _BadgeDetailScreenState();
}

class _BadgeDetailScreenState extends ConsumerState<BadgeDetailScreen> {
  badge_models.Badge? _badge;
  bool _isLoading = true;
  String? _error;
  bool? _isEarned;

  @override
  void initState() {
    super.initState();
    _loadBadge();
    _checkIfEarned();
  }

  Future<void> _loadBadge() async {
    try {
      final service = BadgeService(
        apiService: ref.read(apiServiceProvider),
      );
      final badge = await service.getBadgeById(widget.badgeId);
      if (mounted) {
        setState(() {
          _badge = badge;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _checkIfEarned() async {
    try {
      final myBadges = await ref
          .read(badgeServiceProvider)
          .getMyBadges();
      if (mounted) {
        setState(() {
          _isEarned = myBadges.any((b) => b.id == widget.badgeId);
        });
      }
    } catch (e) {
      // Ignore error, badge might not be earned
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Badge Details')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    if (_error != null || _badge == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Badge Details')),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.error_outline, size: 64, color: Colors.red[300]),
              const SizedBox(height: 16),
              Text(
                _error ?? 'Badge not found',
                style: TextStyle(color: Colors.red[700]),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () {
                  setState(() {
                    _isLoading = true;
                    _error = null;
                  });
                  _loadBadge();
                },
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Badge Details'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            const SizedBox(height: 24),
            // Badge Icon
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: (_isEarned ?? false)
                    ? Theme.of(context).colorScheme.primary.withOpacity(0.1)
                    : Colors.grey[200],
                border: Border.all(
                  color: (_isEarned ?? false)
                      ? Theme.of(context).colorScheme.primary
                      : Colors.grey[300]!,
                  width: 4,
                ),
              ),
              child: Text(
                _badge!.icon,
                style: TextStyle(
                  fontSize: 80,
                  color: (_isEarned ?? false) ? null : Colors.grey[400],
                ),
              ),
            ),
            const SizedBox(height: 24),
            // Badge Name
            Text(
              _badge!.name,
              style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: (_isEarned ?? false) ? null : Colors.grey[600],
                  ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            // Earned Status
            if (_isEarned ?? false)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: Colors.green[100],
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.check_circle, color: Colors.green[700], size: 20),
                    const SizedBox(width: 8),
                    Text(
                      'EARNED',
                      style: TextStyle(
                        color: Colors.green[700],
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              )
            else
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: Colors.grey[200],
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.lock_outline, color: Colors.grey[600], size: 20),
                    const SizedBox(width: 8),
                    Text(
                      'NOT EARNED',
                      style: TextStyle(
                        color: Colors.grey[600],
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
            const SizedBox(height: 24),
            // Description
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Description',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      _badge!.description,
                      style: Theme.of(context).textTheme.bodyLarge,
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            // Badge Info Grid
            Row(
              children: [
                Expanded(
                  child: _buildInfoCard(
                    'Category',
                    _badge!.category.toUpperCase(),
                    Icons.category,
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _buildInfoCard(
                    'XP Reward',
                    '${_badge!.xpReward} XP',
                    Icons.star,
                  ),
                ),
              ],
            ),
            if (_badge!.isRare) ...[
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.amber[50],
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.amber[300]!),
                ),
                child: Row(
                  children: [
                    Icon(Icons.diamond, color: Colors.amber[700]),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'Rare Badge',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: Colors.amber[900],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildInfoCard(String label, String value, IconData icon) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          children: [
            Icon(icon, size: 24, color: Theme.of(context).colorScheme.primary),
            const SizedBox(height: 8),
            Text(
              label,
              style: Theme.of(context).textTheme.bodySmall,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 4),
            Text(
              value,
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

