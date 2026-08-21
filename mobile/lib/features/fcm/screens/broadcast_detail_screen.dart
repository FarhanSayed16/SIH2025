import 'package:flutter/material.dart';

/// Shown when a school broadcast push is opened.
class BroadcastDetailScreen extends StatelessWidget {
  final String title;
  final String message;
  final String priority;

  const BroadcastDetailScreen({
    super.key,
    required this.title,
    required this.message,
    this.priority = 'medium',
  });

  Color get _bannerColor {
    switch (priority.toLowerCase()) {
      case 'urgent':
        return Colors.red.shade700;
      case 'high':
        return Colors.orange.shade700;
      default:
        return Colors.blue.shade700;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Broadcast'),
        backgroundColor: _bannerColor,
        foregroundColor: Colors.white,
      ),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: 8),
            Chip(
              label: Text(priority.toUpperCase()),
              backgroundColor: _bannerColor.withValues(alpha: 0.15),
            ),
            const SizedBox(height: 16),
            Text(
              message,
              style: Theme.of(context).textTheme.bodyLarge,
            ),
          ],
        ),
      ),
    );
  }
}
