/// Student Home — B4: one honest score, compact actions, tip/connectivity honesty.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:camera/camera.dart';
import '../../../core/widgets/widgets.dart';
import '../../../core/design/design_system.dart';
import '../../../core/providers/access_level_provider.dart';
import '../../../l10n/app_localizations.dart';
import '../../auth/providers/auth_provider.dart';
import '../../emergency/screens/manual_emergency_screen.dart';
import '../../score/providers/preparedness_score_provider.dart';
import '../../score/screens/score_breakdown_screen.dart';
import '../../score/screens/score_history_screen.dart';
import '../../adaptive_scoring/screens/per_student_scores_screen.dart';
import '../../adaptive_scoring/screens/shared_xp_distribution_screen.dart';
import '../../auth/models/user_model.dart';
import '../../maps/screens/blueprint_map_screen.dart';
import '../../../screens/language_selection_screen.dart';
import '../../../hazard_lens.dart';
import 'evacuation_check_screen.dart';
import 'damage_scan_screen.dart';
import '../../drills/screens/drill_list_screen.dart';
import '../../../core/constants/api_endpoints.dart';
import '../../../core/services/api_service.dart';
import '../widgets/connectivity_indicator.dart';
import '../widgets/sync_indicator.dart';

class HomeScreen extends ConsumerStatefulWidget {
  /// Dashboard tab switch — Learn=1, Games=2, Profile=3.
  final ValueChanged<int>? onSelectTab;

  const HomeScreen({super.key, this.onSelectTab});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  String? _todaysTip;
  String? _todaysTipDate;
  String _tipContentLang = 'en';
  String _tipSelectedLang = 'en';
  bool _tipLoading = false;
  bool _tipUnavailable = false;
  int _tipRequestId = 0;

  final ApiService _api = ApiService();

  @override
  void initState() {
    super.initState();
    _loadTodaysTip(null);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref
          .read(preparednessScoreProvider.notifier)
          .loadScore(forceRefresh: false);
    });
  }

  Future<void> _loadTodaysTip(String? lang) async {
    final requestId = ++_tipRequestId;
    final requestedLang = lang ?? _tipSelectedLang;

    if (mounted) {
      setState(() {
        if (lang != null) _tipSelectedLang = lang;
        _tipLoading = true;
        _tipUnavailable = false;
      });
    }

    try {
      final path = lang != null
          ? '${ApiEndpoints.aiTipToday}?lang=$lang'
          : ApiEndpoints.aiTipToday;
      final res = await _api.get(path);
      if (requestId != _tipRequestId || !mounted) return;

      final data = res.data;
      if (data is Map && data['data'] != null) {
        final d = data['data'] as Map<String, dynamic>;
        final tip = d['tip']?.toString();
        final date = d['date']?.toString();
        setState(() {
          if (tip != null && tip.isNotEmpty) {
            _todaysTip = tip;
            _todaysTipDate = date;
            _tipContentLang = requestedLang;
            _tipUnavailable = false;
          } else if (_todaysTip == null) {
            _tipUnavailable = true;
          }
          _tipLoading = false;
        });
      } else if (mounted) {
        setState(() {
          _tipLoading = false;
          if (_todaysTip == null) _tipUnavailable = true;
          // Revert chip to content language if request failed to deliver new text
          _tipSelectedLang = _tipContentLang;
        });
      }
    } catch (_) {
      if (requestId != _tipRequestId || !mounted) return;
      setState(() {
        _tipLoading = false;
        if (_todaysTip == null) {
          _tipUnavailable = true;
        } else {
          // Keep old tip; restore selection to its language
          _tipSelectedLang = _tipContentLang;
        }
      });
    }
  }

  bool _tipDateIsToday(String? dateStr) {
    if (dateStr == null || dateStr.isEmpty) return false;
    final parsed = DateTime.tryParse(dateStr);
    if (parsed == null) return false;
    final now = DateTime.now();
    return parsed.year == now.year &&
        parsed.month == now.month &&
        parsed.day == now.day;
  }

  String _formatTipDate(String? dateStr) {
    if (dateStr == null || dateStr.isEmpty) return '';
    final parsed = DateTime.tryParse(dateStr);
    if (parsed == null) return dateStr;
    return '${parsed.year}-'
        '${parsed.month.toString().padLeft(2, '0')}-'
        '${parsed.day.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final user = authState.user;
    final l10n = AppLocalizations.of(context);
    final scoreState = ref.watch(preparednessScoreProvider);

    return ScreenLayout(
      padding: AppSpacing.screenEdge,
      excludeBottomSafeArea: true,
      child: RefreshIndicator(
        onRefresh: () async {
          await ref
              .read(preparednessScoreProvider.notifier)
              .loadScore(forceRefresh: true);
          await _loadTodaysTip(_tipSelectedLang);
        },
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildWelcomeSection(context, user)
                  .animate()
                  .fadeIn(duration: 350.ms)
                  .slideY(begin: -0.05, end: 0, duration: 400.ms),
              SizedBox(height: AppSpacing.sm),
              _buildStatusRow(),
              SizedBox(height: AppSpacing.lg),
              _buildScoreCard(context, l10n, scoreState)
                  .animate()
                  .fadeIn(duration: 350.ms, delay: 40.ms),
              SizedBox(height: AppSpacing.lg),
              _buildTipSection(context)
                  .animate()
                  .fadeIn(duration: 350.ms, delay: 60.ms),
              SizedBox(height: AppSpacing.lg),
              if (user?.role == 'teacher' || user?.role == 'admin') ...[
                _buildTeacherSection(context, user),
                SizedBox(height: AppSpacing.lg),
              ],
              Text(
                l10n.quickActions,
                style: AppTextStyles.h3.copyWith(fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 4),
              Text(
                'Drills, learning, games, and safety tools',
                style: AppTextStyles.bodySmall.copyWith(
                  color: AppColors.textSecondary,
                ),
              ),
              SizedBox(height: AppSpacing.md),
              _buildQuickActions(context, l10n, user)
                  .animate()
                  .fadeIn(duration: 350.ms, delay: 80.ms),
              SizedBox(height: AppSpacing.xl),
              _buildEmergencyArea(context, l10n, user),
              SizedBox(height: AppSpacing.lg),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildWelcomeSection(BuildContext context, UserModel? user) {
    final hour = DateTime.now().hour;
    final greeting = hour < 12
        ? 'Good morning'
        : hour < 17
            ? 'Good afternoon'
            : 'Good evening';
    final displayName = (user?.name != null && user!.name.trim().isNotEmpty)
        ? user.name.trim()
        : 'there';

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '$greeting, $displayName',
                style: AppTextStyles.h2.copyWith(
                  fontWeight: FontWeight.w700,
                  fontSize: 22,
                ),
              ),
              if (user != null) ...[
                const SizedBox(height: 4),
                Text(
                  user.role,
                  style: AppTextStyles.bodySmall.copyWith(
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ],
          ),
        ),
        IconButton(
          tooltip: 'Profile',
          onPressed: () => widget.onSelectTab?.call(3),
          icon: const Icon(Icons.person_outline),
        ),
      ],
    );
  }

  Widget _buildStatusRow() {
    return const Wrap(
      spacing: 12,
      runSpacing: 8,
      children: [
        ConnectivityIndicator(),
        SyncIndicator(),
      ],
    );
  }

  Widget _buildScoreCard(
    BuildContext context,
    AppLocalizations l10n,
    PreparednessScoreState scoreState,
  ) {
    final theme = Theme.of(context);

    if (scoreState.isLoading && !scoreState.hasScore) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(AppSpacing.lg),
        decoration: BoxDecoration(
          color: theme.colorScheme.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.borderLight),
        ),
        child: Row(
          children: [
            SizedBox(
              width: 22,
              height: 22,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                color: theme.colorScheme.primary,
              ),
            ),
            const SizedBox(width: 12),
            Text(
              'Loading preparedness…',
              style: theme.textTheme.bodyMedium,
            ),
          ],
        ),
      );
    }

    if (!scoreState.hasScore) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(AppSpacing.lg),
        decoration: BoxDecoration(
          color: theme.colorScheme.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.borderLight),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Preparedness',
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              scoreState.error != null
                  ? 'Score unavailable'
                  : 'No score available yet',
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              children: [
                TextButton(
                  onPressed: () => widget.onSelectTab?.call(1),
                  child: const Text('Browse learning'),
                ),
                if (scoreState.error != null)
                  TextButton(
                    onPressed: () {
                      ref
                          .read(preparednessScoreProvider.notifier)
                          .loadScore(forceRefresh: true);
                    },
                    child: const Text('Retry'),
                  ),
              ],
            ),
          ],
        ),
      );
    }

    final score = scoreState.score!;
    final value = score.score.clamp(0, 100);
    // Zero is not a danger signal; only mild emphasis for mid-range.
    final Color accent = value == 0
        ? theme.colorScheme.primary
        : value >= 80
            ? AppColors.success
            : value >= 40
                ? AppColors.warning
                : theme.colorScheme.primary;

    final sourceLabel = scoreState.source == ScoreSource.server
        ? (score.lastUpdated != null
            ? 'Updated ${_formatTipDate(score.lastUpdated!.toIso8601String())}'
            : 'From your learning record')
        : 'Estimated on this device';

    final explanation = value == 0
        ? 'A starting point — browse learning or try a drill to build preparedness.'
        : 'Learning preparedness only — not your current physical safety.';

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.borderLight),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  'Preparedness',
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              TextButton(
                onPressed: () {
                  Navigator.push<void>(
                    context,
                    MaterialPageRoute<void>(
                      builder: (context) => const ScoreBreakdownScreen(),
                    ),
                  );
                },
                child: const Text('View breakdown'),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '$value',
                style: theme.textTheme.displaySmall?.copyWith(
                  color: accent,
                  fontWeight: FontWeight.w700,
                  height: 1,
                ),
              ),
              Padding(
                padding: const EdgeInsets.only(bottom: 6, left: 4),
                child: Text(
                  '/100',
                  style: theme.textTheme.titleMedium?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
              ),
              if (scoreState.isLoading) ...[
                const SizedBox(width: 12),
                const SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(strokeWidth: 2),
                ),
              ],
            ],
          ),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: LinearProgressIndicator(
              value: value / 100,
              minHeight: 12,
              backgroundColor: AppColors.primaryGreenSubtle,
              valueColor: AlwaysStoppedAnimation<Color>(accent),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            sourceLabel,
            style: theme.textTheme.labelMedium?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            explanation,
            style: theme.textTheme.bodySmall?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
          if (scoreState.error != null) ...[
            const SizedBox(height: 8),
            Text(
              'Could not refresh. Showing saved score.',
              style: theme.textTheme.bodySmall?.copyWith(
                color: AppColors.warning,
              ),
            ),
          ],
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 4,
            children: [
              TextButton.icon(
                onPressed: () => widget.onSelectTab?.call(1),
                icon: const Icon(Icons.school_outlined, size: 18),
                label: Text(
                  value == 0 || scoreState.source == ScoreSource.none
                      ? 'Browse learning'
                      : 'Continue learning',
                ),
              ),
              TextButton(
                onPressed: () {
                  Navigator.push<void>(
                    context,
                    MaterialPageRoute<void>(
                      builder: (context) => const ScoreHistoryScreen(),
                    ),
                  );
                },
                child: const Text('History'),
              ),
              if (scoreState.error != null)
                TextButton(
                  onPressed: () {
                    ref
                        .read(preparednessScoreProvider.notifier)
                        .loadScore(forceRefresh: true);
                  },
                  child: const Text('Retry'),
                ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildTipSection(BuildContext context) {
    final theme = Theme.of(context);
    final isToday = _tipDateIsToday(_todaysTipDate);
    final title = isToday ? "Today's safety tip" : 'Safety tip';

    if (_todaysTip == null && !_tipUnavailable && !_tipLoading) {
      return const SizedBox.shrink();
    }

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: AppColors.warningBackground.withValues(alpha: 0.55),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: AppColors.accentOrange.withValues(alpha: 0.3),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.lightbulb_outline, color: AppColors.accentOrange),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  title,
                  style: theme.textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              if (_tipLoading)
                const SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(strokeWidth: 2),
                ),
            ],
          ),
          if (_todaysTip != null) ...[
            const SizedBox(height: 8),
            Text(
              _todaysTip!,
              style: theme.textTheme.bodyMedium?.copyWith(height: 1.35),
            ),
            if (_todaysTipDate != null && _todaysTipDate!.isNotEmpty) ...[
              const SizedBox(height: 6),
              Text(
                _formatTipDate(_todaysTipDate),
                style: theme.textTheme.labelSmall?.copyWith(
                  color: AppColors.textTertiary,
                ),
              ),
            ],
            if (_tipLoading && _tipSelectedLang != _tipContentLang)
              Padding(
                padding: const EdgeInsets.only(top: 6),
                child: Text(
                  'Showing previous language while loading…',
                  style: theme.textTheme.labelSmall?.copyWith(
                    color: AppColors.textSecondary,
                  ),
                ),
              ),
          ] else if (_tipUnavailable) ...[
            const SizedBox(height: 8),
            Text(
              'Safety tip unavailable',
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
            TextButton(
              onPressed: () => _loadTodaysTip(_tipSelectedLang),
              child: const Text('Retry'),
            ),
          ],
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            children: [
              _tipChip('English', 'en'),
              _tipChip('हिन्दी', 'hi'),
              _tipChip('मराठी', 'mr'),
            ],
          ),
        ],
      ),
    );
  }

  Widget _tipChip(String label, String lang) {
    final selected = _tipSelectedLang == lang;
    return FilterChip(
      label: Text(
        label,
        style: TextStyle(
          fontSize: 12,
          color: selected ? Colors.white : AppColors.textSecondary,
        ),
      ),
      selected: selected,
      onSelected: _tipLoading ? null : (_) => _loadTodaysTip(lang),
      selectedColor: AppColors.accentOrange,
      checkmarkColor: Colors.white,
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
    );
  }

  Widget _buildTeacherSection(BuildContext context, UserModel? user) {
    final classId = user?.classId;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Class Management', style: AppTextStyles.h3),
        SizedBox(height: AppSpacing.md),
        if (classId != null) ...[
          ActionCard(
            title: 'Student Scores',
            subtitle: 'View individual student performance',
            leadingIcon: Icons.people,
            onTap: () {
              Navigator.push<void>(
                context,
                MaterialPageRoute<void>(
                  builder: (context) => PerStudentScoresScreen(
                    classId: classId,
                    className: 'Student Scores',
                  ),
                ),
              );
            },
          ),
          SizedBox(height: AppSpacing.sm),
          ActionCard(
            title: 'Shared XP Distribution',
            subtitle: 'View XP distribution history',
            leadingIcon: Icons.share,
            onTap: () {
              Navigator.push<void>(
                context,
                MaterialPageRoute<void>(
                  builder: (context) => SharedXPDistributionScreen(
                    classId: classId,
                    className: 'Shared XP',
                  ),
                ),
              );
            },
          ),
        ] else
          InfoCard(
            title: 'No Class Assigned',
            leadingIcon: Icons.info_outline,
            content: Text(
              'Please select a class to view student scores.',
              style: AppTextStyles.bodyMedium,
            ),
          ),
      ],
    );
  }

  Widget _buildQuickActions(
    BuildContext context,
    AppLocalizations l10n,
    UserModel? user,
  ) {
    final canAccessDrills = user == null ||
        user.role != 'student' ||
        AccessLevelProvider.canAccessFeature(user, 'drills') ||
        AccessLevelProvider.canAccessFeature(user, 'basic_drills');
    final canAccessModules = user == null ||
        user.role != 'student' ||
        AccessLevelProvider.canAccessFeature(user, 'modules');
    final canAccessGames = user == null ||
        user.role != 'student' ||
        AccessLevelProvider.canAccessFeature(user, 'games');
    final canAccessQuizzes = user == null ||
        user.role != 'student' ||
        AccessLevelProvider.canAccessFeature(user, 'quizzes');
    final hasInstitution = user?.institutionId != null;

    final primary = <Widget>[];
    final secondary = <Widget>[];

    if (canAccessDrills) {
      primary.add(
        FeatureCard(
          title: 'View drills',
          description: 'Scheduled, active, and past drills',
          icon: Icons.fire_extinguisher_rounded,
          iconColor: AppColors.warning,
          clickable: true,
          onTap: () {
            Navigator.push<void>(
              context,
              MaterialPageRoute<void>(
                builder: (context) => const DrillListScreen(),
              ),
            );
          },
        ),
      );
    }

    if (canAccessModules) {
      primary.add(
        FeatureCard(
          title: 'Browse learning',
          description: 'Safety lessons and training videos',
          icon: Icons.school_rounded,
          iconColor: AppColors.info,
          clickable: true,
          onTap: () => widget.onSelectTab?.call(1),
        ),
      );
    }

    if (canAccessGames) {
      primary.add(
        FeatureCard(
          title: 'Play games',
          description: 'Practise with safety games',
          icon: Icons.sports_esports_rounded,
          iconColor: AppColors.accentBlue,
          clickable: true,
          onTap: () => widget.onSelectTab?.call(2),
        ),
      );
    }

    if (canAccessQuizzes) {
      primary.add(
        FeatureCard(
          title: l10n.takeQuiz,
          description: 'Check what you remember',
          icon: Icons.quiz_rounded,
          iconColor: AppColors.infoDark,
          clickable: true,
          onTap: () {
            Navigator.push<void>(
              context,
              MaterialPageRoute<void>(
                builder: (context) =>
                    const LanguageSelectionScreen(gameType: 'quiz'),
              ),
            );
          },
        ),
      );
    }

    if (hasInstitution) {
      secondary.add(
        FeatureCard(
          title: 'School map',
          description: 'Exits, equipment, and rooms',
          icon: Icons.map_rounded,
          iconColor: AppColors.info,
          clickable: true,
          onTap: () {
            Navigator.push<void>(
              context,
              MaterialPageRoute<void>(
                builder: (context) => BlueprintMapScreen(
                  schoolId: user!.institutionId!,
                  floor: 0,
                  title: 'School Map',
                ),
              ),
            );
          },
        ),
      );
    }

    secondary.addAll([
      FeatureCard(
        title: 'Check a photo for hazards',
        description: 'Photo review is advisory — not a safety confirmation',
        icon: Icons.dangerous_rounded,
        iconColor: AppColors.error,
        clickable: true,
        onTap: () async {
          try {
            final cameras = await availableCameras();
            if (cameras.isEmpty) {
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('No camera available')),
                );
              }
              return;
            }
            final camera = cameras.firstWhere(
              (c) => c.lensDirection == CameraLensDirection.back,
              orElse: () => cameras.first,
            );
            if (context.mounted) {
              Navigator.push<void>(
                context,
                MaterialPageRoute<void>(
                  builder: (context) => ScannerScreen(camera: camera),
                ),
              );
            }
          } catch (e) {
            if (context.mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('Camera unavailable')),
              );
            }
          }
        },
      ),
      FeatureCard(
        title: 'Check an exit photo',
        description: 'Photo review cannot confirm a safe route',
        icon: Icons.exit_to_app_rounded,
        iconColor: AppColors.primaryGreen,
        clickable: true,
        onTap: () {
          Navigator.push<void>(
            context,
            MaterialPageRoute<void>(
              builder: (context) => const EvacuationCheckScreen(),
            ),
          );
        },
      ),
      FeatureCard(
        title: 'Scan damage',
        description: 'After a drill or incident',
        icon: Icons.build_circle_rounded,
        iconColor: AppColors.accentOrange,
        clickable: true,
        onTap: () {
          Navigator.push<void>(
            context,
            MaterialPageRoute<void>(
              builder: (context) => const DamageScanScreen(),
            ),
          );
        },
      ),
    ]);

    if (primary.isEmpty && secondary.isEmpty) {
      return const EmptyState(
        title: 'No Actions Available',
        message: 'No quick actions available for your access level',
        icon: Icons.lock_outline,
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (primary.isNotEmpty)
          LayoutBuilder(
            builder: (context, constraints) {
              final wide = constraints.maxWidth >= 520;
              if (wide) {
                return Wrap(
                  spacing: AppSpacing.md,
                  runSpacing: AppSpacing.md,
                  children: primary
                      .map(
                        (w) => SizedBox(
                          width: (constraints.maxWidth - AppSpacing.md) / 2,
                          child: w,
                        ),
                      )
                      .toList(),
                );
              }
              return Column(
                children: [
                  for (var i = 0; i < primary.length; i++) ...[
                    if (i > 0) SizedBox(height: AppSpacing.sm),
                    primary[i],
                  ],
                ],
              );
            },
          ),
        if (secondary.isNotEmpty) ...[
          SizedBox(height: AppSpacing.lg),
          Text(
            'More safety tools',
            style: AppTextStyles.labelLarge.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Photo checks and authorized maps. Results are advisory.',
            style: AppTextStyles.bodySmall.copyWith(
              color: AppColors.textSecondary,
            ),
          ),
          SizedBox(height: AppSpacing.sm),
          ...secondary.map(
            (w) => Padding(
              padding: const EdgeInsets.only(bottom: AppSpacing.sm),
              child: w,
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildEmergencyArea(
    BuildContext context,
    AppLocalizations l10n,
    UserModel? user,
  ) {
    final canAccessCrisis = user == null ||
        user.role != 'student' ||
        AccessLevelProvider.canAccessFeature(user, 'crisis_mode');

    if (!canAccessCrisis) return const SizedBox.shrink();

    return SizedBox(
      width: double.infinity,
      child: FilledButton.icon(
        style: FilledButton.styleFrom(
          backgroundColor: AppColors.primaryRed,
          foregroundColor: Colors.white,
          minimumSize: const Size.fromHeight(52),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
        ),
        onPressed: () {
          Navigator.of(context).push<void>(
            MaterialPageRoute<void>(
              builder: (context) => const ManualEmergencyScreen(),
            ),
          );
        },
        icon: const Icon(Icons.warning_amber_rounded),
        label: Text(l10n.emergency),
      ),
    );
  }
}
