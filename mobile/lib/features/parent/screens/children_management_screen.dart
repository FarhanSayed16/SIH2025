/// Children Management Screen
/// Manage all linked children - view, unlink, edit relationships
/// Parent Monitoring System - Phase 1 Mobile

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/widgets/widgets.dart';
import '../../../core/design/design_system.dart';
import '../providers/parent_provider.dart';
import '../models/parent_models.dart';
import '../services/parent_service.dart';
import '../../../core/providers/api_service_provider.dart';
import 'child_detail_screen.dart';
import 'add_child_screen.dart';

class ChildrenManagementScreen extends ConsumerStatefulWidget {
  final bool embedded;
  final ValueChanged<int>? onSelectTab;

  const ChildrenManagementScreen({
    super.key,
    this.embedded = false,
    this.onSelectTab,
  });

  @override
  ConsumerState<ChildrenManagementScreen> createState() =>
      _ChildrenManagementScreenState();
}

class _ChildrenManagementScreenState
    extends ConsumerState<ChildrenManagementScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _handleUnlink(String childId, String childName) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Unlink Child'),
        content: Text(
          'Unlink $childName from your parent account?\n\n'
          'This removes your association only. It does not delete the child\'s account.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: AppColors.error),
            child: const Text('Unlink'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    try {
      final apiService = ref.read(apiServiceProvider);
      final parentService = ParentService(apiService);
      await parentService.unlinkChild(childId);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('Child unlinked successfully'),
            backgroundColor: AppColors.success,
          ),
        );
        ref.invalidate(childrenProvider);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to unlink child: ${e.toString()}'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  String _getChildStatus(ParentChild child) {
    final raw =
        child.stats?['status']?.toString() ?? child.safetyStatus;
    if (raw == null || raw.trim().isEmpty || raw == 'unknown') {
      return 'unavailable';
    }
    return raw.trim().toLowerCase();
  }

  String _statusLabel(String status) {
    switch (status) {
      case 'safe':
        return 'Reported safe';
      case 'in_drill':
        return 'In drill';
      case 'missing':
        return 'Reported missing';
      case 'at_risk':
        return 'At risk';
      case 'evacuating':
        return 'Evacuating';
      case 'emergency':
        return 'Emergency';
      case 'unavailable':
      default:
        return 'Status unavailable';
    }
  }

  @override
  Widget build(BuildContext context) {
    final childrenAsync = ref.watch(childrenProvider);

    return Scaffold(
      appBar: AppBarCustom(
        title: 'Children',
        automaticallyImplyLeading: !widget.embedded,
        actions: [
          IconButton(
            tooltip: 'Add child',
            icon: const Icon(Icons.add),
            onPressed: () {
              Navigator.push<void>(
                context,
                MaterialPageRoute<void>(
                  builder: (context) => const AddChildScreen(),
                ),
              );
            },
          ),
        ],
      ),
      body: childrenAsync.when(
        data: (children) {
          final filteredChildren = _searchQuery.isEmpty
              ? children
              : children.where((child) {
                  final query = _searchQuery.toLowerCase().trim();
                  return child.name.toLowerCase().contains(query) ||
                      (child.email != null &&
                          child.email!.toLowerCase().contains(query)) ||
                      (child.grade != null &&
                          child.grade!.toLowerCase().contains(query)) ||
                      (child.section != null &&
                          child.section!.toLowerCase().contains(query));
                }).toList();

          return Column(
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                child: TextInputCustom(
                  controller: _searchController,
                  hint: 'Search by name, email, or grade',
                  leadingIcon: Icons.search,
                  onChanged: (value) {
                    setState(() => _searchQuery = value);
                  },
                ),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Align(
                  alignment: Alignment.centerLeft,
                  child: Text(
                    children.isEmpty
                        ? 'No children linked yet'
                        : _searchQuery.isEmpty
                            ? '${children.length} children'
                            : '${filteredChildren.length} of ${children.length} match',
                    style: AppTextStyles.caption.copyWith(
                      color: AppColors.textSecondary,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 8),
              Expanded(
                child: children.isEmpty
                    ? EmptyState(
                        message:
                            'Link a child with Scan QR or Add child. Contact the school if you need a code.',
                        title: 'No children linked yet',
                        icon: Icons.people_outline,
                      )
                    : filteredChildren.isEmpty
                        ? ListView(
                            padding: const EdgeInsets.all(24),
                            children: [
                              const SizedBox(height: 40),
                              Icon(
                                Icons.search_off,
                                size: 48,
                                color: AppColors.textSecondary,
                              ),
                              const SizedBox(height: 12),
                              Text(
                                'No children match this search',
                                textAlign: TextAlign.center,
                                style: AppTextStyles.h5,
                              ),
                              const SizedBox(height: 8),
                              Text(
                                'Your search stays editable above.',
                                textAlign: TextAlign.center,
                                style: AppTextStyles.bodySmall.copyWith(
                                  color: AppColors.textSecondary,
                                ),
                              ),
                              const SizedBox(height: 16),
                              TextButton(
                                onPressed: () {
                                  _searchController.clear();
                                  setState(() => _searchQuery = '');
                                },
                                child: const Text('Clear search'),
                              ),
                            ],
                          )
                        : RefreshIndicator(
                            onRefresh: () async {
                              ref.invalidate(childrenProvider);
                            },
                            child: ListView.builder(
                              padding:
                                  const EdgeInsets.symmetric(horizontal: 16.0),
                              itemCount: filteredChildren.length,
                              itemBuilder: (context, index) {
                                final child = filteredChildren[index];
                                final status = _getChildStatus(child);

                                return Card(
                                  margin: const EdgeInsets.only(bottom: 12),
                                  child: ListTile(
                                    onTap: () {
                                      Navigator.push<void>(
                                        context,
                                        MaterialPageRoute<void>(
                                          builder: (context) =>
                                              ChildDetailScreen(
                                            studentId: child.id,
                                          ),
                                        ),
                                      );
                                    },
                                    contentPadding: const EdgeInsets.all(16),
                                    leading: CircleAvatar(
                                      backgroundColor: AppColors.accentBlue,
                                      child: Text(
                                        child.name.trim().isNotEmpty
                                            ? child.name.trim()[0].toUpperCase()
                                            : '?',
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ),
                                    title: Text(
                                      child.name.trim().isNotEmpty
                                          ? child.name
                                          : 'Unnamed child',
                                      style: AppTextStyles.h5,
                                    ),
                                    subtitle: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        if (child.grade != null)
                                          Text(
                                            child.section != null
                                                ? 'Grade ${child.grade} · Section ${child.section}'
                                                : 'Grade ${child.grade}',
                                            style: AppTextStyles.bodySmall,
                                          ),
                                        const SizedBox(height: 4),
                                        Text(
                                          _statusLabel(status),
                                          style: AppTextStyles.caption.copyWith(
                                            color: status == 'safe'
                                                ? AppColors.success
                                                : status == 'in_drill'
                                                    ? Colors.orange
                                                    : (status == 'unavailable'
                                                        ? AppColors.textSecondary
                                                        : AppColors.error),
                                            fontWeight: FontWeight.w600,
                                          ),
                                        ),
                                      ],
                                    ),
                                    trailing: PopupMenuButton<String>(
                                      onSelected: (value) async {
                                        if (value == 'details') {
                                          Navigator.push<void>(
                                            context,
                                            MaterialPageRoute<void>(
                                              builder: (context) =>
                                                  ChildDetailScreen(
                                                studentId: child.id,
                                              ),
                                            ),
                                          );
                                        } else if (value == 'unlink') {
                                          await _handleUnlink(
                                            child.id,
                                            child.name.trim().isNotEmpty
                                                ? child.name
                                                : 'this child',
                                          );
                                        }
                                      },
                                      itemBuilder: (context) => const [
                                        PopupMenuItem(
                                          value: 'details',
                                          child: Text('Open details'),
                                        ),
                                        PopupMenuItem(
                                          value: 'unlink',
                                          child: Text('Remove link'),
                                        ),
                                      ],
                                    ),
                                  ),
                                );
                              },
                            ),
                          ),
              ),
            ],
          );
        },
        loading: () => const LoadingState(),
        error: (error, stack) => ErrorState(
          message: error.toString(),
          onRetry: () => ref.invalidate(childrenProvider),
        ),
      ),
    );
  }
}
