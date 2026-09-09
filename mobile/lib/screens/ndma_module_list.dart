/// NDMA catalogue — search, honest zero progress, Start/Continue/Review (B5 §10).

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/design/design_system.dart';
import '../data/module_data.dart';
import '../features/auth/providers/auth_provider.dart';
import '../models/module_models.dart';
import 'module_detail_screen.dart';

class NdmaModulesList extends ConsumerStatefulWidget {
  const NdmaModulesList({Key? key}) : super(key: key);

  @override
  ConsumerState<NdmaModulesList> createState() => _NdmaModulesListState();
}

class _NdmaModulesListState extends ConsumerState<NdmaModulesList> {
  List<LearningModule> modules = [];
  String searchQuery = '';
  bool _loading = true;
  String? _loadError;
  final _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadModules();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadModules() async {
    setState(() {
      _loading = true;
      _loadError = null;
    });
    try {
      final userId = ref.read(authProvider).user?.id;
      await ModuleRepository().initialize(userId: userId);
      if (!mounted) return;
      setState(() {
        modules = ModuleRepository().getModules();
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _loadError = 'Could not load NDMA guides. Try again.';
      });
    }
  }

  List<LearningModule> get _filtered {
    final q = searchQuery.trim().toLowerCase();
    if (q.isEmpty) return modules;
    return modules.where((m) {
      if (m.title.toLowerCase().contains(q)) return true;
      if (m.catalogueSummary.toLowerCase().contains(q)) return true;
      if (m.tags.any((t) => t.toLowerCase().contains(q))) return true;
      return false;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final filtered = _filtered;

    return Scaffold(
      backgroundColor: theme.colorScheme.surface,
      appBar: AppBar(
        backgroundColor: theme.colorScheme.primary,
        foregroundColor: theme.colorScheme.onPrimary,
        elevation: 0,
        title: const Text('NDMA safety guides'),
        centerTitle: true,
      ),
      body: Column(
        children: [
          Container(
            color: theme.colorScheme.primary,
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
            child: TextField(
              controller: _searchController,
              onChanged: (val) => setState(() => searchQuery = val),
              decoration: InputDecoration(
                hintText: 'Search title, summary, or topic',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: searchQuery.isEmpty
                    ? null
                    : IconButton(
                        tooltip: 'Clear search',
                        icon: const Icon(Icons.clear),
                        onPressed: () {
                          _searchController.clear();
                          setState(() => searchQuery = '');
                        },
                      ),
                filled: true,
                fillColor: theme.colorScheme.surface,
                contentPadding: const EdgeInsets.symmetric(vertical: 0),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(28),
                  borderSide: BorderSide.none,
                ),
              ),
            ),
          ),
          if (!_loading && _loadError == null)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
              child: Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  searchQuery.isEmpty
                      ? '${filtered.length} guides'
                      : '${filtered.length} result${filtered.length == 1 ? '' : 's'}',
                  style: theme.textTheme.labelLarge?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
              ),
            ),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _loadError != null
                    ? Center(
                        child: Padding(
                          padding: const EdgeInsets.all(24),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(_loadError!, textAlign: TextAlign.center),
                              const SizedBox(height: 12),
                              TextButton(
                                onPressed: _loadModules,
                                child: const Text('Retry'),
                              ),
                            ],
                          ),
                        ),
                      )
                    : filtered.isEmpty
                        ? ListView(
                            padding: const EdgeInsets.all(24),
                            children: [
                              const SizedBox(height: 48),
                              Icon(
                                Icons.search_off,
                                size: 48,
                                color: theme.colorScheme.onSurfaceVariant,
                              ),
                              const SizedBox(height: 12),
                              Text(
                                'No guides match your search',
                                textAlign: TextAlign.center,
                                style: theme.textTheme.titleMedium,
                              ),
                              const SizedBox(height: 8),
                              Text(
                                'Try another title or topic. Your search text stays editable above.',
                                textAlign: TextAlign.center,
                                style: theme.textTheme.bodyMedium?.copyWith(
                                  color: theme.colorScheme.onSurfaceVariant,
                                ),
                              ),
                            ],
                          )
                        : ListView.builder(
                            padding: const EdgeInsets.all(16),
                            itemCount: filtered.length,
                            itemBuilder: (context, index) {
                              return _buildModuleCard(filtered[index]);
                            },
                          ),
          ),
        ],
      ),
    );
  }

  Widget _buildModuleCard(LearningModule module) {
    final theme = Theme.of(context);
    final isComingSoon = module.isComingSoon;
    final progress = module.progress;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: AppBorders.borderRadiusLg,
        border: Border.all(color: AppColors.borderLight),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: AppBorders.borderRadiusLg,
          onTap: isComingSoon
              ? null
              : () async {
                  await Navigator.push<void>(
                    context,
                    MaterialPageRoute<void>(
                      builder: (context) => ModuleDetailScreen(
                        module: module,
                        onModuleUpdated: () => setState(() {}),
                      ),
                    ),
                  );
                  setState(() {});
                },
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 48,
                      height: 48,
                      decoration: BoxDecoration(
                        color: module.color.withValues(alpha: 0.25),
                        borderRadius: AppBorders.borderRadiusMd,
                      ),
                      child: Icon(module.iconData, color: AppColors.primaryGreen, size: 26),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            module.title,
                            style: theme.textTheme.titleSmall?.copyWith(
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            module.catalogueSummary,
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: theme.colorScheme.onSurfaceVariant,
                              height: 1.35,
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Wrap(
                  spacing: 8,
                  runSpacing: 6,
                  children: [
                    _metaChip(module.progressStatusLabel),
                    _metaChip(module.levelSentenceCase),
                    _metaChip('Est. ${module.duration}'),
                    if (!isComingSoon)
                      _metaChip(
                        '${(progress * 100).round()}% videos',
                      ),
                  ],
                ),
                if (!isComingSoon) ...[
                  const SizedBox(height: 10),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: LinearProgressIndicator(
                      value: progress,
                      backgroundColor: AppColors.backgroundMedium,
                      color: theme.colorScheme.primary,
                      minHeight: 6,
                    ),
                  ),
                ],
                const SizedBox(height: 12),
                Align(
                  alignment: Alignment.centerRight,
                  child: isComingSoon
                      ? Text(
                          'Content not available yet',
                          style: theme.textTheme.labelMedium?.copyWith(
                            color: theme.colorScheme.onSurfaceVariant,
                          ),
                        )
                      : Text(
                          module.primaryActionLabel,
                          style: theme.textTheme.labelLarge?.copyWith(
                            color: theme.colorScheme.primary,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _metaChip(String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: AppColors.backgroundMedium,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        text,
        style: const TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w600,
          color: AppColors.textSecondary,
        ),
      ),
    );
  }
}
