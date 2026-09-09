/// Learn hub — compact source rows (B5 §9).

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/design/design_system.dart';
import '../core/widgets/widgets.dart';
import '../data/module_data.dart';
import '../features/auth/providers/auth_provider.dart';
import '../models/module_models.dart';
import '../screens/ndma_module_list.dart';
import 'ndrf_language_screen.dart';
import 'hearing_impaired_list.dart';
import 'module_detail_screen.dart';

class ModuleScreenFile extends ConsumerStatefulWidget {
  const ModuleScreenFile({super.key});

  @override
  ConsumerState<ModuleScreenFile> createState() => _ModuleScreenFileState();
}

class _ModuleScreenFileState extends ConsumerState<ModuleScreenFile> {
  LearningModule? _continueModule;
  bool _loadingContinue = true;

  @override
  void initState() {
    super.initState();
    _loadContinueTarget();
  }

  Future<void> _loadContinueTarget() async {
    final userId = ref.read(authProvider).user?.id;
    try {
      await ModuleRepository().initialize(userId: userId);
      if (!ModuleRepository().isInitialized) {
        if (mounted) setState(() => _loadingContinue = false);
        return;
      }
      final modules = ModuleRepository().getModules();
      LearningModule? inProgress;
      for (final m in modules) {
        if (!m.isComingSoon && m.progress > 0 && m.progress < 1) {
          inProgress = m;
          break;
        }
      }
      if (mounted) {
        setState(() {
          _continueModule = inProgress;
          _loadingContinue = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loadingContinue = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Scaffold(
      backgroundColor: colorScheme.surface,
      appBar: AppBar(
        title: const Text('Learn'),
        backgroundColor: colorScheme.primary,
        foregroundColor: colorScheme.onPrimary,
        centerTitle: true,
      ),
      body: ListView(
        padding: ScreenLayout.pagePaddingOf(context),
        children: [
          Text(
            'Safety lessons, videos and accessible formats',
            style: theme.textTheme.bodyMedium?.copyWith(
              color: colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: AppSpacing.lg),
          if (!_loadingContinue && _continueModule != null) ...[
            Text(
              'Continue learning',
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: AppSpacing.sm),
            _SourceRow(
              title: _continueModule!.title,
              subtitle:
                  'Pick up where you left off · ${_continueModule!.progressStatusLabel}',
              icon: Icons.play_circle_outline,
              accent: colorScheme.primary,
              onTap: () async {
                await Navigator.push<void>(
                  context,
                  MaterialPageRoute<void>(
                    builder: (context) => ModuleDetailScreen(
                      module: _continueModule!,
                      onModuleUpdated: () => _loadContinueTarget(),
                    ),
                  ),
                );
                _loadContinueTarget();
              },
            ),
            const SizedBox(height: AppSpacing.xl),
          ],
          Text(
            'Browse resources',
            style: theme.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Source labels show provenance of materials, not a guarantee that every item is official, current, or locally applicable.',
            style: theme.textTheme.bodySmall?.copyWith(
              color: colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          _SourceRow(
            title: 'NDMA safety guides',
            subtitle:
                'Topic-based guidance and lesson videos from NDMA source materials',
            icon: Icons.menu_book_outlined,
            accent: AppColors.warning,
            onTap: () async {
              await Navigator.push<void>(
                context,
                MaterialPageRoute<void>(
                  builder: (context) => const NdmaModulesList(),
                ),
              );
              _loadContinueTarget();
            },
          ),
          const SizedBox(height: AppSpacing.sm),
          _SourceRow(
            title: 'NDRF training videos',
            subtitle:
                'Training videos grouped by content language (YouTube playback)',
            icon: Icons.groups_outlined,
            accent: AppColors.info,
            onTap: () {
              Navigator.push<void>(
                context,
                MaterialPageRoute<void>(
                  builder: (context) => const NdrfLanguageScreen(),
                ),
              );
            },
          ),
          const SizedBox(height: AppSpacing.sm),
          _SourceRow(
            title: 'Sign-language safety videos',
            subtitle:
                'Visual format available to everyone · network video playback',
            icon: Icons.sign_language,
            accent: AppColors.accentSignLanguage,
            onTap: () {
              Navigator.push<void>(
                context,
                MaterialPageRoute<void>(
                  builder: (context) => const HearingImpairedList(),
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}

class _SourceRow extends StatelessWidget {
  final String title;
  final String subtitle;
  final IconData icon;
  final Color accent;
  final VoidCallback onTap;

  const _SourceRow({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.accent,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Material(
      color: theme.colorScheme.surface,
      borderRadius: AppBorders.borderRadiusLg,
      child: InkWell(
        onTap: onTap,
        borderRadius: AppBorders.borderRadiusLg,
        child: Container(
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.md,
            vertical: AppSpacing.md,
          ),
          decoration: BoxDecoration(
            borderRadius: AppBorders.borderRadiusLg,
            border: Border.all(color: AppColors.borderLight),
          ),
          child: Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: accent.withValues(alpha: 0.12),
                  borderRadius: AppBorders.borderRadiusMd,
                ),
                child: Icon(icon, color: accent, size: 24),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: theme.textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      subtitle,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                        height: 1.3,
                      ),
                    ),
                  ],
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
  }
}
