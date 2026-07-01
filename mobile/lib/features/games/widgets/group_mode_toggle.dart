/// Phase 3.2.4: Group Mode Toggle Widget
/// Allows switching between individual and group game modes

import 'package:flutter/material.dart';

class GroupModeToggle extends StatelessWidget {
  final bool isGroupMode;
  final ValueChanged<bool> onChanged;
  final bool enabled;

  const GroupModeToggle({
    super.key,
    required this.isGroupMode,
    required this.onChanged,
    this.enabled = true,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(12.0),
        child: Row(
          children: [
            Icon(
              isGroupMode ? Icons.group : Icons.person,
              color: isGroupMode ? Colors.blue : Colors.grey,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    isGroupMode ? 'Group Mode' : 'Individual Mode',
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  Text(
                    isGroupMode
                        ? 'Multiple students can play'
                        : 'Single player mode',
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ],
              ),
            ),
            Switch(
              value: isGroupMode,
              onChanged: enabled ? onChanged : null,
            ),
          ],
        ),
      ),
    );
  }
}

