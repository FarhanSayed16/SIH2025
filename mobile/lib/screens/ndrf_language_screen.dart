/// NDRF content-language selection (B5 §11.3).

import 'package:flutter/material.dart';
import '../core/design/design_system.dart';
import '../data/ndrf_data.dart';
import 'ndrf_module_detail_screen.dart';

class NdrfLanguageScreen extends StatefulWidget {
  const NdrfLanguageScreen({super.key});

  @override
  State<NdrfLanguageScreen> createState() => _NdrfLanguageScreenState();
}

class _NdrfLanguageScreenState extends State<NdrfLanguageScreen> {
  String _query = '';
  final _controller = TextEditingController();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final languages = NdrfRepository.getNdrfModules().keys.toList()..sort();
    final filtered = _query.trim().isEmpty
        ? languages
        : languages
            .where((l) => l.toLowerCase().contains(_query.trim().toLowerCase()))
            .toList();

    return Scaffold(
      backgroundColor: theme.colorScheme.surface,
      appBar: AppBar(
        title: const Text('NDRF training videos'),
        backgroundColor: theme.colorScheme.primary,
        foregroundColor: theme.colorScheme.onPrimary,
      ),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
            child: Text(
              'Choose a content language. Labels use native script where available. Videos play on YouTube and require internet. Not every language group includes the same accessibility formats.',
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: TextField(
              controller: _controller,
              onChanged: (v) => setState(() => _query = v),
              decoration: InputDecoration(
                hintText: 'Search languages',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: _query.isEmpty
                    ? null
                    : IconButton(
                        icon: const Icon(Icons.clear),
                        onPressed: () {
                          _controller.clear();
                          setState(() => _query = '');
                        },
                      ),
                border: OutlineInputBorder(
                  borderRadius: AppBorders.borderRadiusMd,
                ),
              ),
            ),
          ),
          Expanded(
            child: filtered.isEmpty
                ? Center(
                    child: Text(
                      'No languages match your search',
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                  )
                : ListView.separated(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
                    itemCount: filtered.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 8),
                    itemBuilder: (context, index) {
                      final lang = filtered[index];
                      return Material(
                        color: theme.colorScheme.surface,
                        borderRadius: AppBorders.borderRadiusMd,
                        child: InkWell(
                          borderRadius: AppBorders.borderRadiusMd,
                          onTap: () {
                            Navigator.push<void>(
                              context,
                              MaterialPageRoute<void>(
                                builder: (context) =>
                                    NdrfModuleDetailScreen(language: lang),
                              ),
                            );
                          },
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 16,
                              vertical: 14,
                            ),
                            decoration: BoxDecoration(
                              borderRadius: AppBorders.borderRadiusMd,
                              border: Border.all(color: AppColors.borderLight),
                            ),
                            child: Row(
                              children: [
                                CircleAvatar(
                                  backgroundColor:
                                      AppColors.info.withValues(alpha: 0.12),
                                  child: Text(
                                    lang.isNotEmpty ? lang[0] : '?',
                                    style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                      color: AppColors.info,
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 14),
                                Expanded(
                                  child: Text(
                                    lang,
                                    style: theme.textTheme.titleSmall?.copyWith(
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ),
                                Icon(
                                  Icons.chevron_right,
                                  color: theme.colorScheme.onSurfaceVariant,
                                ),
                              ],
                            ),
                          ),
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}
