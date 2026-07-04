/// Phase 3.1.1: Enhanced Module List Screen
/// Phase 101.5: Redesigned with new component library
/// Displays modules with filtering, search, and sorting

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/module_model.dart';
import '../providers/module_provider.dart';
import '../services/local_completion_service.dart';
import 'module_detail_screen.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/constants/api_endpoints.dart';
import '../../../core/providers/api_service_provider.dart';
import '../../../core/widgets/widgets.dart';
import '../../../core/design/design_system.dart';

class ModuleListScreen extends ConsumerStatefulWidget {
  const ModuleListScreen({super.key});

  @override
  ConsumerState<ModuleListScreen> createState() => _ModuleListScreenState();
}

class _ModuleListScreenState extends ConsumerState<ModuleListScreen> {
  final TextEditingController _searchController = TextEditingController();
  final LocalCompletionService _completionService = LocalCompletionService();
  String? _selectedType;
  String? _selectedCategory;
  String? _selectedDifficulty;
  String? _selectedGradeLevel; // Phase 3.1.5: Grade level filter
  String? _selectedSortBy = 'order';
  String? _selectedSortOrder = 'asc';
  // E1: AI next best module
  String? _recommendedTitle;
  String? _recommendReason;
  bool _recommendLoading = false;
  bool _recommendFetched = false;

  @override
  void initState() {
    super.initState();
    // Load modules on init
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(moduleListProvider.notifier).loadModules(refresh: true);
    });
  }

  /// E1: Fetch AI "next best module" recommendation
  Future<void> _fetchRecommendation(List<ModuleModel> modules) async {
    if (_recommendLoading || _recommendFetched || modules.isEmpty) return;
    final completedEntries = await _completionService.getCompletedModuleEntries();
    final completedIds = completedEntries.map((e) => e.moduleId).toSet();
    final idToTitle = {for (final m in modules) m.id: m.title};
    final completedTitles = <String>[];
    final completedGrades = <int?>[];
    for (final e in completedEntries) {
      final title = idToTitle[e.moduleId];
      if (title != null) {
        completedTitles.add(title);
        completedGrades.add(e.score);
      }
    }
    final availableTitles = modules.where((m) => !completedIds.contains(m.id)).map((m) => m.title).toList();
    if (availableTitles.isEmpty) return;
    setState(() => _recommendLoading = true);
    try {
      final api = ref.read(apiServiceProvider);
      final res = await api.post(ApiEndpoints.aiRecommendNextModule, data: {
        'completedTitles': completedTitles,
        'completedGrades': completedGrades,
        'availableTitles': availableTitles,
      });
      final data = res.data is Map && res.data['data'] != null ? res.data['data'] as Map : res.data as Map;
      final title = data['recommendedTitle']?.toString();
      final reason = data['reason']?.toString();
      if (mounted) setState(() {
        _recommendedTitle = title;
        _recommendReason = reason;
        _recommendLoading = false;
        _recommendFetched = true;
      });
    } catch (_) {
      if (mounted) setState(() {
        _recommendLoading = false;
        _recommendFetched = true;
      });
    }
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Widget _buildRecommendationCard(List<ModuleModel> modules) {
    if (_recommendLoading) {
      return Padding(
        padding: EdgeInsets.only(bottom: AppSpacing.md),
        child: Card(
          child: ListTile(
            leading: const SizedBox(
              width: 24,
              height: 24,
              child: CircularProgressIndicator(strokeWidth: 2),
            ),
            title: Text('Recommended for you', style: Theme.of(context).textTheme.titleSmall),
          ),
        ),
      );
    }
    if (_recommendedTitle == null || _recommendReason == null) {
      return const SizedBox.shrink();
    }
    ModuleModel? recommendedModule;
    for (final m in modules) {
      if (m.title == _recommendedTitle) {
        recommendedModule = m;
        break;
      }
    }
    if (recommendedModule == null) return const SizedBox.shrink();
    final module = recommendedModule;
    return Padding(
      padding: EdgeInsets.only(bottom: AppSpacing.md),
      child: Card(
        elevation: 0,
        color: AppColors.primaryGreen.withOpacity(0.08),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: BorderSide(color: AppColors.primaryGreen.withOpacity(0.3)),
        ),
        child: InkWell(
          onTap: () {
            Navigator.push<void>(
              context,
              MaterialPageRoute<void>(
                builder: (context) => ModuleDetailScreen(moduleId: module.id),
              ),
            );
          },
          borderRadius: BorderRadius.circular(12),
          child: Padding(
            padding: AppSpacing.card,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(Icons.auto_awesome, color: AppColors.primaryGreen, size: 20),
                    const SizedBox(width: 8),
                    Text(
                      'Recommended for you',
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                            color: AppColors.primaryGreen,
                            fontWeight: FontWeight.w600,
                          ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  module.title,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 4),
                Text(
                  _recommendReason!,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.textSecondary),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _applyFilters() {
    setState(() => _recommendFetched = false);
    final filters = <String, dynamic>{};
    if (_selectedType != null) filters['type'] = _selectedType;
    if (_selectedCategory != null) filters['category'] = _selectedCategory;
    if (_selectedDifficulty != null)
      filters['difficulty'] = _selectedDifficulty;
    if (_selectedGradeLevel != null)
      filters['gradeLevel'] = _selectedGradeLevel; // Phase 3.1.5
    if (_searchController.text.isNotEmpty) {
      filters['search'] = _searchController.text;
    }
    filters['sortBy'] = _selectedSortBy;
    filters['sortOrder'] = _selectedSortOrder;

    ref.read(moduleListProvider.notifier).applyFilters(filters);
  }

  void _showFilterDialog() {
    showModalBottomSheet<void>(
      context: context,
      builder: (context) => _FilterBottomSheet(
        selectedType: _selectedType,
        selectedCategory: _selectedCategory,
        selectedDifficulty: _selectedDifficulty,
        selectedGradeLevel: _selectedGradeLevel, // Phase 3.1.5
        selectedSortBy: _selectedSortBy,
        selectedSortOrder: _selectedSortOrder,
        onApply: (type, category, difficulty, gradeLevel, sortBy, sortOrder) {
          setState(() {
            _selectedType = type;
            _selectedCategory = category;
            _selectedDifficulty = difficulty;
            _selectedGradeLevel = gradeLevel; // Phase 3.1.5
            _selectedSortBy = sortBy;
            _selectedSortOrder = sortOrder;
          });
          _applyFilters();
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final moduleState = ref.watch(moduleListProvider);

    return Scaffold(
      appBar: AppBarCustom(
        title: 'Learn',
        actions: [
          IconButton(
            icon: const Icon(Icons.filter_list),
            onPressed: _showFilterDialog,
            tooltip: 'Filters',
          ),
        ],
      ),
      body: Column(
        children: [
          // Search bar
          Padding(
            padding: AppSpacing.card,
            child: SearchInputCustom(
              controller: _searchController,
              hint: 'Search modules...',
              onChanged: (_) {
                setState(() {});
                _applyFilters();
              },
              onSubmitted: (_) => _applyFilters(),
              onClear: () {
                _searchController.clear();
                setState(() {});
                _applyFilters();
              },
            ),
          ),

          // Active filters chips
          if (_selectedType != null ||
              _selectedCategory != null ||
              _selectedDifficulty != null ||
              _selectedGradeLevel != null)
            SizedBox(
              height: 40,
              child: ListView(
                scrollDirection: Axis.horizontal,
                padding: EdgeInsets.symmetric(horizontal: AppSpacing.md),
                children: [
                  if (_selectedType != null)
                    ChipWidget(
                      label: _selectedType!,
                      onDeleted: () {
                        setState(() {
                          _selectedType = null;
                        });
                        _applyFilters();
                      },
                    ),
                  if (_selectedCategory != null) ...[
                    SizedBox(width: AppSpacing.sm),
                    ChipWidget(
                      label: _selectedCategory!,
                      onDeleted: () {
                        setState(() {
                          _selectedCategory = null;
                        });
                        _applyFilters();
                      },
                    ),
                  ],
                  if (_selectedDifficulty != null) ...[
                    SizedBox(width: AppSpacing.sm),
                    ChipWidget(
                      label: _selectedDifficulty!,
                      onDeleted: () {
                        setState(() {
                          _selectedDifficulty = null;
                        });
                        _applyFilters();
                      },
                    ),
                  ],
                  if (_selectedGradeLevel != null) ...[
                    SizedBox(width: AppSpacing.sm),
                    ChipWidget(
                      label: 'Grade ${_selectedGradeLevel!}',
                      onDeleted: () {
                        setState(() {
                          _selectedGradeLevel = null;
                        });
                        _applyFilters();
                      },
                    ),
                  ],
                ],
              ),
            ),

          // Modules list
          Expanded(
            child: _buildModulesList(moduleState),
          ),
        ],
      ),
    );
  }

  Widget _buildModulesList(ModuleListState state) {
    if (state.isLoading && state.modules.isEmpty) {
      return const LoadingState(message: 'Loading modules...');
    }

    if (state.error != null && state.modules.isEmpty) {
      return ErrorState(
        message: state.error!,
        onRetry: () {
          ref.read(moduleListProvider.notifier).loadModules(refresh: true);
        },
      );
    }

    // E1: Trigger recommendation fetch when we have modules (once)
    if (state.modules.isNotEmpty && !_recommendLoading && !_recommendFetched) {
      WidgetsBinding.instance.addPostFrameCallback((_) => _fetchRecommendation(state.modules));
    }

    if (state.modules.isEmpty) {
      return EmptyState(
        title: 'No modules available',
        message: 'Try adjusting your filters or check back later',
        icon: Icons.school_outlined,
        actionLabel: 'Clear Filters',
        onAction: () {
          setState(() {
            _selectedType = null;
            _selectedCategory = null;
            _selectedDifficulty = null;
            _selectedGradeLevel = null;
          });
          _applyFilters();
        },
      );
    }

    return RefreshIndicator(
      onRefresh: () async {
        setState(() => _recommendFetched = false);
        await ref.read(moduleListProvider.notifier).loadModules(refresh: true);
      },
      child: ListView.builder(
        padding: AppSpacing.card,
        itemCount: 1 + state.modules.length + (state.hasMore ? 1 : 0),
        itemBuilder: (context, index) {
          // E1: Recommended for you card at top
          if (index == 0) {
            return _buildRecommendationCard(state.modules);
          }
          final moduleIndex = index - 1;
          if (moduleIndex == state.modules.length) {
            // Load more indicator
            if (state.hasMore && !state.isLoading) {
              WidgetsBinding.instance.addPostFrameCallback((_) {
                ref.read(moduleListProvider.notifier).loadMore();
              });
            }
            return state.isLoading
                ? Padding(
                    padding: AppSpacing.card,
                    child: const LoadingState(),
                  )
                : const SizedBox.shrink();
          }

          final module = state.modules[moduleIndex];
          
          // Convert ModuleModel to ModuleCard format
          IconData icon;
          Color iconColor;
          switch (module.type) {
            case 'fire':
              icon = Icons.local_fire_department;
              iconColor = Colors.orange;
              break;
            case 'earthquake':
              icon = Icons.terrain;
              iconColor = Colors.brown;
              break;
            case 'flood':
              icon = Icons.water_drop;
              iconColor = Colors.blue;
              break;
            case 'cyclone':
              icon = Icons.air;
              iconColor = Colors.grey;
              break;
            default:
              icon = Icons.school;
              iconColor = Colors.grey;
          }
          
          // Calculate progress if available
          double? progress;
          if (module.stats != null && module.stats!.totalViews > 0) {
            progress = (module.stats!.totalCompletions / module.stats!.totalViews).clamp(0.0, 1.0);
          }
          
          // Parse duration to minutes
          int? durationMinutes;
          final durationMatch = RegExp(r'(\d+)').firstMatch(module.duration);
          if (durationMatch != null) {
            durationMinutes = int.tryParse(durationMatch.group(1)!);
          }
          
          return Padding(
            padding: EdgeInsets.only(bottom: AppSpacing.md),
            child: ModuleCard(
              title: module.title,
              description: module.description,
              icon: icon,
              iconColor: iconColor,
              progress: progress,
              difficulty: module.difficulty,
              durationMinutes: durationMinutes,
              isLocked: false,
              onTap: () {
                Navigator.push<void>(
                  context,
                  MaterialPageRoute<void>(
                    builder: (context) => ModuleDetailScreen(moduleId: module.id),
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }
}

/// Filter Bottom Sheet
class _FilterBottomSheet extends StatefulWidget {
  final String? selectedType;
  final String? selectedCategory;
  final String? selectedDifficulty;
  final String? selectedGradeLevel; // Phase 3.1.5
  final String? selectedSortBy;
  final String? selectedSortOrder;
  final void Function(String?, String?, String?, String?, String, String)
      onApply;

  const _FilterBottomSheet({
    required this.selectedType,
    required this.selectedCategory,
    required this.selectedDifficulty,
    this.selectedGradeLevel, // Phase 3.1.5
    required this.selectedSortBy,
    required this.selectedSortOrder,
    required this.onApply,
  });

  @override
  State<_FilterBottomSheet> createState() => _FilterBottomSheetState();
}

class _FilterBottomSheetState extends State<_FilterBottomSheet> {
  late String? _type;
  late String? _category;
  late String? _difficulty;
  late String? _gradeLevel; // Phase 3.1.5
  late String _sortBy;
  late String _sortOrder;

  @override
  void initState() {
    super.initState();
    _type = widget.selectedType;
    _category = widget.selectedCategory;
    _difficulty = widget.selectedDifficulty;
    _gradeLevel = widget.selectedGradeLevel; // Phase 3.1.5
    _sortBy = widget.selectedSortBy ?? 'order';
    _sortOrder = widget.selectedSortOrder ?? 'asc';
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Filters & Sort',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
              ),
              IconButton(
                icon: const Icon(Icons.close),
                onPressed: () => Navigator.pop(context),
              ),
            ],
          ),
          const Divider(),
          const SizedBox(height: 16),
          // Type filter
          const Text('Type', style: TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            children: [
              _buildFilterChip('fire', 'Fire', _type),
              _buildFilterChip('earthquake', 'Earthquake', _type),
              _buildFilterChip('flood', 'Flood', _type),
              _buildFilterChip('cyclone', 'Cyclone', _type),
              _buildFilterChip('stampede', 'Stampede', _type),
              _buildFilterChip('heatwave', 'Heatwave', _type),
            ],
          ),
          const SizedBox(height: 16),
          // Category filter
          const Text('Category', style: TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            children: [
              _buildFilterChip('safety', 'Safety', _category),
              _buildFilterChip('preparedness', 'Preparedness', _category),
              _buildFilterChip('response', 'Response', _category),
              _buildFilterChip('recovery', 'Recovery', _category),
              _buildFilterChip('prevention', 'Prevention', _category),
            ],
          ),
          const SizedBox(height: 16),
          // Difficulty filter
          const Text('Difficulty',
              style: TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            children: [
              _buildFilterChip('beginner', 'Beginner', _difficulty),
              _buildFilterChip('intermediate', 'Intermediate', _difficulty),
              _buildFilterChip('advanced', 'Advanced', _difficulty),
            ],
          ),
          const SizedBox(height: 16),
          // Phase 3.1.5: Grade Level filter
          const Text('Grade Level',
              style: TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              _buildFilterChip('KG', 'KG', _gradeLevel),
              _buildFilterChip('1', 'Grade 1', _gradeLevel),
              _buildFilterChip('2', 'Grade 2', _gradeLevel),
              _buildFilterChip('3', 'Grade 3', _gradeLevel),
              _buildFilterChip('4', 'Grade 4', _gradeLevel),
              _buildFilterChip('5', 'Grade 5', _gradeLevel),
              _buildFilterChip('6', 'Grade 6', _gradeLevel),
              _buildFilterChip('7', 'Grade 7', _gradeLevel),
              _buildFilterChip('8', 'Grade 8', _gradeLevel),
              _buildFilterChip('9', 'Grade 9', _gradeLevel),
              _buildFilterChip('10', 'Grade 10', _gradeLevel),
              _buildFilterChip('11', 'Grade 11', _gradeLevel),
              _buildFilterChip('12', 'Grade 12', _gradeLevel),
            ],
          ),
          const SizedBox(height: 16),
          // Sort options
          const Text('Sort By', style: TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          DropdownButtonFormField<String>(
            value: _sortBy,
            decoration: const InputDecoration(
              border: OutlineInputBorder(),
              contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            ),
            items: const [
              DropdownMenuItem(value: 'order', child: Text('Order')),
              DropdownMenuItem(value: 'popularity', child: Text('Popularity')),
              DropdownMenuItem(
                  value: 'completions', child: Text('Completions')),
              DropdownMenuItem(value: 'title', child: Text('Title')),
            ],
            onChanged: (value) {
              setState(() {
                _sortBy = value!;
              });
            },
          ),
          const SizedBox(height: 8),
          DropdownButtonFormField<String>(
            value: _sortOrder,
            decoration: const InputDecoration(
              border: OutlineInputBorder(),
              contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            ),
            items: const [
              DropdownMenuItem(value: 'asc', child: Text('Ascending')),
              DropdownMenuItem(value: 'desc', child: Text('Descending')),
            ],
            onChanged: (value) {
              setState(() {
                _sortOrder = value!;
              });
            },
          ),
          const SizedBox(height: 24),
          // Apply button
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () {
                widget.onApply(_type, _category, _difficulty, _gradeLevel,
                    _sortBy, _sortOrder); // Phase 3.1.5
                Navigator.pop(context);
              },
              child: const Text('Apply Filters'),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String value, String label, String? selected) {
    final isSelected = selected == value;
    return FilterChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (selected) {
        setState(() {
          if (selected) {
            if (value == 'fire' ||
                value == 'earthquake' ||
                value == 'flood' ||
                value == 'cyclone' ||
                value == 'stampede' ||
                value == 'heatwave') {
              _type = value;
            } else if (value == 'safety' ||
                value == 'preparedness' ||
                value == 'response' ||
                value == 'recovery' ||
                value == 'prevention') {
              _category = value;
            } else if (value == 'beginner' ||
                value == 'intermediate' ||
                value == 'advanced') {
              _difficulty = value;
            } else if (value == 'KG' ||
                (value.isNotEmpty &&
                    int.tryParse(value) != null &&
                    int.parse(value) >= 1 &&
                    int.parse(value) <= 12)) {
              // Phase 3.1.5: Grade level filter
              _gradeLevel = value;
            }
          } else {
            if (value == _type) _type = null;
            if (value == _category) _category = null;
            if (value == _difficulty) _difficulty = null;
            if (value == _gradeLevel) _gradeLevel = null; // Phase 3.1.5
          }
        });
      },
    );
  }
}
