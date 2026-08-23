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
  const ChildrenManagementScreen({super.key});

  @override
  ConsumerState<ChildrenManagementScreen> createState() =>
      _ChildrenManagementScreenState();
}

class _ChildrenManagementScreenState
    extends ConsumerState<ChildrenManagementScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';
  String? _editingRelationshipId;
  String _newRelationship = 'other';

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
            'Are you sure you want to unlink $childName? This action cannot be undone.'),
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

  Future<void> _handleUpdateRelationship(
      String childId, String relationship) async {
    try {
      final apiService = ref.read(apiServiceProvider);
      final parentService = ParentService(apiService);
      await parentService.updateRelationship(childId, relationship);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('Relationship updated successfully'),
            backgroundColor: AppColors.success,
          ),
        );
        setState(() {
          _editingRelationshipId = null;
        });
        ref.invalidate(childrenProvider);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to update relationship: ${e.toString()}'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  String _getStatusColor(String? status) {
    switch (status) {
      case 'safe':
        return 'green';
      case 'in_drill':
        return 'yellow';
      case 'emergency':
        return 'red';
      default:
        return 'gray';
    }
  }

  String _getChildStatus(ParentChild child) {
    return child.stats?['status']?.toString() ?? child.safetyStatus ?? 'safe';
  }

  @override
  Widget build(BuildContext context) {
    final childrenAsync = ref.watch(childrenProvider);

    return Scaffold(
      appBar: AppBarCustom(
        title: 'Manage Children',
        actions: [
          IconButton(
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
                  final query = _searchQuery.toLowerCase();
                  return child.name.toLowerCase().contains(query) ||
                      (child.email != null &&
                          child.email!.toLowerCase().contains(query)) ||
                      (child.grade != null &&
                          child.grade!.toLowerCase().contains(query)) ||
                      (child.section != null &&
                          child.section!.toLowerCase().contains(query));
                }).toList();

          if (filteredChildren.isEmpty) {
            return EmptyState(
              message: _searchQuery.isEmpty
                  ? 'No children linked. Add your first child to get started.'
                  : 'No children found matching your search.',
              title: _searchQuery.isEmpty ? 'No Children' : 'No Results',
              icon: Icons.people_outline,
            );
          }

          return Column(
            children: [
              // Search Bar
              Padding(
                padding: const EdgeInsets.all(16.0),
                child: TextInputCustom(
                  controller: _searchController,
                  hint: 'Search by name, email, grade...',
                  leadingIcon: Icons.search,
                  onChanged: (value) {
                    setState(() {
                      _searchQuery = value;
                    });
                  },
                ),
              ),

              // Children List
              Expanded(
                child: RefreshIndicator(
                  onRefresh: () async {
                    ref.invalidate(childrenProvider);
                  },
                  child: ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 16.0),
                    itemCount: filteredChildren.length,
                    itemBuilder: (context, index) {
                      final child = filteredChildren[index];
                      final status = _getChildStatus(child);
                      final _ = _editingRelationshipId == child.id;

                      return Card(
                        margin: const EdgeInsets.only(bottom: 12),
                        child: ListTile(
                          contentPadding: const EdgeInsets.all(16),
                          leading: CircleAvatar(
                            backgroundColor: AppColors.accentBlue,
                            child: Text(
                              child.name[0].toUpperCase(),
                              style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                          title: Text(
                            child.name,
                            style: AppTextStyles.h5,
                          ),
                          subtitle: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              if (child.grade != null && child.section != null)
                                Text(
                                  'Grade ${child.grade} - Section ${child.section}',
                                  style: AppTextStyles.bodySmall,
                                ),
                              if (child.email != null)
                                Text(
                                  child.email!,
                                  style: AppTextStyles.bodySmall.copyWith(
                                    color: AppColors.textSecondary,
                                  ),
                                ),
                              const SizedBox(height: 8),
                              Row(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 8,
                                      vertical: 4,
                                    ),
                                    decoration: BoxDecoration(
                                      color: _getStatusColor(status) == 'green'
                                          ? AppColors.success.withOpacity(0.1)
                                          : _getStatusColor(status) == 'yellow'
                                              ? Colors.orange.withOpacity(0.1)
                                              : _getStatusColor(status) == 'red'
                                                  ? AppColors.error
                                                      .withOpacity(0.1)
                                                  : Colors.grey
                                                      .withOpacity(0.1),
                                      borderRadius: AppBorders.borderRadiusSm,
                                    ),
                                    child: Text(
                                      status.replaceAll('_', ' ').toUpperCase(),
                                      style: AppTextStyles.caption.copyWith(
                                        color:
                                            _getStatusColor(status) == 'green'
                                                ? AppColors.success
                                                : _getStatusColor(status) ==
                                                        'yellow'
                                                    ? Colors.orange
                                                    : _getStatusColor(status) ==
                                                            'red'
                                                        ? AppColors.error
                                                        : Colors.grey,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                  if (child.stats != null) ...[
                                    const SizedBox(width: 8),
                                    Text(
                                      'Score: ${child.stats!['preparednessScore'] ?? 0}%',
                                      style: AppTextStyles.caption.copyWith(
                                        color: AppColors.accentBlue,
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                            ],
                          ),
                          trailing: PopupMenuButton<String>(
                            onSelected: (value) {
                              switch (value) {
                                case 'view':
                                  Navigator.push<void>(
                                    context,
                                    MaterialPageRoute<void>(
                                      builder: (context) => ChildDetailScreen(
                                        studentId: child.id,
                                      ),
                                    ),
                                  );
                                  break;
                                case 'edit_relationship':
                                  setState(() {
                                    _editingRelationshipId = child.id;
                                    _newRelationship =
                                        child.relationship ?? 'other';
                                  });
                                  break;
                                case 'unlink':
                                  _handleUnlink(child.id, child.name);
                                  break;
                              }
                            },
                            itemBuilder: (context) => [
                              const PopupMenuItem(
                                value: 'view',
                                child: Row(
                                  children: [
                                    Icon(Icons.visibility, size: 20),
                                    SizedBox(width: 8),
                                    Text('View Details'),
                                  ],
                                ),
                              ),
                              const PopupMenuItem(
                                value: 'edit_relationship',
                                child: Row(
                                  children: [
                                    Icon(Icons.edit, size: 20),
                                    SizedBox(width: 8),
                                    Text('Edit Relationship'),
                                  ],
                                ),
                              ),
                              const PopupMenuItem(
                                value: 'unlink',
                                child: Row(
                                  children: [
                                    Icon(Icons.link_off,
                                        size: 20, color: Colors.red),
                                    SizedBox(width: 8),
                                    Text('Unlink',
                                        style: TextStyle(color: Colors.red)),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ),

              // Edit Relationship Bottom Sheet
              if (_editingRelationshipId != null)
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppColors.backgroundWhite,
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.1),
                        blurRadius: 10,
                        offset: const Offset(0, -2),
                      ),
                    ],
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        'Edit Relationship',
                        style: AppTextStyles.h5,
                      ),
                      const SizedBox(height: 16),
                      DropdownButtonFormField<String>(
                        value: _newRelationship,
                        decoration: InputDecoration(
                          labelText: 'Relationship Type',
                          border: OutlineInputBorder(
                            borderRadius: AppBorders.borderRadiusMd,
                          ),
                        ),
                        items: const [
                          DropdownMenuItem(
                              value: 'father', child: Text('Father')),
                          DropdownMenuItem(
                              value: 'mother', child: Text('Mother')),
                          DropdownMenuItem(
                              value: 'guardian', child: Text('Guardian')),
                          DropdownMenuItem(
                              value: 'other', child: Text('Other')),
                        ],
                        onChanged: (value) {
                          if (value != null) {
                            setState(() {
                              _newRelationship = value;
                            });
                          }
                        },
                      ),
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          Expanded(
                            child: OutlinedButtonCustom(
                              label: 'Cancel',
                              onPressed: () {
                                setState(() {
                                  _editingRelationshipId = null;
                                });
                              },
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: PrimaryButton(
                              label: 'Save',
                              onPressed: () {
                                if (_editingRelationshipId != null) {
                                  _handleUpdateRelationship(
                                      _editingRelationshipId!,
                                      _newRelationship);
                                }
                              },
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
            ],
          );
        },
        loading: () => const LoadingState(),
        error: (error, stack) => ErrorState(
          message: error.toString(),
          onRetry: () {
            ref.invalidate(childrenProvider);
          },
        ),
      ),
    );
  }
}
