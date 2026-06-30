import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:camera/camera.dart';
import '../../../core/widgets/widgets.dart';
import '../../../core/design/design_system.dart';
import '../../../core/providers/access_level_provider.dart';
import '../../../l10n/app_localizations.dart';
import '../../auth/providers/auth_provider.dart';
import '../../emergency/screens/red_alert_screen.dart';
import '../../score/providers/preparedness_score_provider.dart';
import '../../score/screens/score_breakdown_screen.dart';
import '../../score/screens/score_history_screen.dart';
import '../../adaptive_scoring/screens/per_student_scores_screen.dart';
import '../../adaptive_scoring/screens/shared_xp_distribution_screen.dart';
import '../../auth/models/user_model.dart';
import '../../maps/screens/blueprint_map_screen.dart';
// Redirect to ModuleScreenFile for drills/modules
import '../../../screens/module_screen_file.dart';
// Redirect to MainMenuScreen for games
import '../../../screens/main_menu_screen.dart';
// Redirect to LanguageSelectionScreen for quiz
import '../../../screens/language_selection_screen.dart';
// Redirect to ScannerScreen for HazardScreenAI
import '../../../Hazardlens.dart';
import 'evacuation_check_screen.dart';
import 'damage_scan_screen.dart';
import '../../drills/screens/drill_list_screen.dart';
import '../../../core/constants/api_endpoints.dart';
import '../../../core/services/api_service.dart';
import '../widgets/connectivity_indicator.dart';
import '../widgets/sync_indicator.dart';

/// Home Screen with Preparedness Score and Quick Actions
/// Phase 101.4: Fully redesigned with new design system
class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  String? _todaysTip;
  String? _todaysTipDate;
  String _tipLang = 'en'; // G1: language for today's tip (en, hi, mr)
  final ApiService _api = ApiService();

  @override
  void initState() {
    super.initState();
    _loadTodaysTip(null);
    // Load score when screen initializes
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref
          .read(preparednessScoreProvider.notifier)
          .loadScore(forceRefresh: false);
    });
  }

  Future<void> _loadTodaysTip(String? lang) async {
    if (lang != null && mounted) setState(() => _tipLang = lang);
    try {
      final path = lang != null ? '${ApiEndpoints.aiTipToday}?lang=$lang' : ApiEndpoints.aiTipToday;
      final res = await _api.get(path);
      final data = res.data;
      if (data is Map && data['data'] != null) {
        final d = data['data'] as Map<String, dynamic>;
        if (mounted) {
          setState(() {
            _todaysTip = d['tip']?.toString();
            _todaysTipDate = d['date']?.toString();
          });
        }
      }
    } catch (_) {}
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    // Reload score when screen becomes visible again
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref
          .read(preparednessScoreProvider.notifier)
          .loadScore(forceRefresh: true);
    });
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final user = authState.user;
    final l10n = AppLocalizations.of(context);

    // Get real preparedness score from provider
    final scoreState = ref.watch(preparednessScoreProvider);
    final preparednessScore =
        scoreState.score != null ? scoreState.score!.score : 0;
    final isLoading = scoreState.isLoading;

    return ScreenLayout(
      padding: AppSpacing.screenEdge,
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Enhanced Welcome Section with Circular Score
            _buildWelcomeSection(
                    context, l10n, user, preparednessScore, isLoading)
                .animate()
                .fadeIn(duration: 400.ms, curve: Curves.easeOut)
                .slideY(
                    begin: -0.1,
                    end: 0,
                    duration: 500.ms,
                    curve: Curves.easeOut),
            SizedBox(height: AppSpacing.md),
            // Status Indicators Row
            _buildStatusRow()
                .animate()
                .fadeIn(duration: 400.ms, delay: 50.ms, curve: Curves.easeOut)
                .slideY(
                    begin: 0.05,
                    end: 0,
                    duration: 500.ms,
                    delay: 50.ms,
                    curve: Curves.easeOut),
            SizedBox(height: AppSpacing.lg),

            // Preparedness Score Card using new components
            _buildScoreCard(
                    context, l10n, scoreState, preparednessScore, isLoading)
                .animate()
                .fadeIn(duration: 400.ms, delay: 100.ms, curve: Curves.easeOut)
                .slideY(
                    begin: 0.1,
                    end: 0,
                    duration: 500.ms,
                    delay: 100.ms,
                    curve: Curves.easeOut),
            SizedBox(height: AppSpacing.xl),

            // B2: Today's safety tip
            if (_todaysTip != null && _todaysTip!.isNotEmpty)
              _buildTodaysTipCard(context)
                  .animate()
                  .fadeIn(duration: 400.ms, delay: 150.ms, curve: Curves.easeOut)
                  .slideY(begin: 0.08, end: 0, duration: 450.ms, delay: 150.ms, curve: Curves.easeOut),
            if (_todaysTip != null && _todaysTip!.isNotEmpty) SizedBox(height: AppSpacing.lg),

            // Teacher-only adaptive scoring section
            if (user?.role == 'teacher' || user?.role == 'admin') ...[
              _buildTeacherSection(context, user)
                  .animate()
                  .fadeIn(
                      duration: 400.ms, delay: 200.ms, curve: Curves.easeOut)
                  .slideY(
                      begin: 0.1,
                      end: 0,
                      duration: 500.ms,
                      delay: 200.ms,
                      curve: Curves.easeOut),
              SizedBox(height: AppSpacing.xl),
            ],

            // Quick Actions Section
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AppColors.primaryGreen.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(
                    Icons.flash_on_rounded,
                    size: 22,
                    color: AppColors.primaryGreen,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        l10n.quickActions,
                        style: AppTextStyles.h3.copyWith(
                          fontWeight: FontWeight.w700,
                          letterSpacing: -0.3,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'Shortcuts to drills, learning, and safety tools',
                        style: AppTextStyles.bodySmall.copyWith(
                          color: AppColors.textSecondary,
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            )
                .animate()
                .fadeIn(duration: 400.ms, delay: 300.ms, curve: Curves.easeOut)
                .slideX(
                    begin: -0.1,
                    end: 0,
                    duration: 500.ms,
                    delay: 300.ms,
                    curve: Curves.easeOut),
            SizedBox(height: AppSpacing.lg),
            _buildQuickActions(context, l10n, user)
                .animate()
                .fadeIn(duration: 400.ms, delay: 400.ms, curve: Curves.easeOut)
                .slideY(
                    begin: 0.1,
                    end: 0,
                    duration: 500.ms,
                    delay: 400.ms,
                    curve: Curves.easeOut),
          ],
        ),
      ),
      floatingActionButton: _buildEmergencyFAB(context, l10n, user),
    );
  }

  /// Build enhanced welcome section with greeting and circular score indicator
  Widget _buildWelcomeSection(
    BuildContext context,
    AppLocalizations l10n,
    UserModel? user,
    int preparednessScore,
    bool isLoading,
  ) {
    // Get greeting based on time of day
    final hour = DateTime.now().hour;
    String greeting;
    String emoji;
    if (hour < 12) {
      greeting = 'Good Morning';
      emoji = '🌅';
    } else if (hour < 17) {
      greeting = 'Good Afternoon';
      emoji = '☀️';
    } else {
      greeting = 'Good Evening';
      emoji = '🌙';
    }

    // Determine score color
    Color scoreColor = AppColors.primaryGreen;
    if (preparednessScore >= 80) {
      scoreColor = AppColors.success;
    } else if (preparednessScore >= 60) {
      scoreColor = AppColors.warning;
    } else {
      scoreColor = AppColors.error;
    }

    return Container(
      padding: EdgeInsets.all(AppSpacing.xl),
      decoration: BoxDecoration(
        color: AppColors.backgroundWhite,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: AppColors.shadow.withOpacity(0.08),
            blurRadius: 20,
            offset: const Offset(0, 4),
            spreadRadius: 0,
          ),
        ],
      ),
      child: Row(
        children: [
          // Greeting Text Section
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '$greeting,',
                  style: AppTextStyles.bodyMedium.copyWith(
                    color: AppColors.textSecondary,
                    fontSize: 14,
                  ),
                ),
                SizedBox(height: AppSpacing.xs),
                Text(
                  user?.name ?? 'User',
                  style: AppTextStyles.h2.copyWith(
                    fontWeight: FontWeight.bold,
                    fontSize: 24,
                  ),
                ),
                SizedBox(height: AppSpacing.sm),
                Row(
                  children: [
                    BadgeWidget(
                      text: (user?.role ?? 'UNKNOWN').toUpperCase(),
                      type: BadgeType.primary,
                    ),
                    SizedBox(width: AppSpacing.sm),
                    Text(
                      emoji,
                      style: const TextStyle(fontSize: 20),
                    ),
                  ],
                ),
              ],
            ),
          ),
          SizedBox(width: AppSpacing.lg),
          // Circular Progress Indicator for Score
          GestureDetector(
            onTap: () {
              Navigator.push<void>(
                context,
                MaterialPageRoute<void>(
                  builder: (context) => const ScoreBreakdownScreen(),
                ),
              );
            },
            child: Container(
              width: 100,
              height: 100,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: scoreColor.withOpacity(0.2),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                    spreadRadius: 2,
                  ),
                ],
              ),
              child: Stack(
                alignment: Alignment.center,
                children: [
                  // Background circle
                  SizedBox(
                    width: 100,
                    height: 100,
                    child: CircularProgressIndicator(
                      value: isLoading ? 0 : preparednessScore / 100,
                      strokeWidth: 8,
                      backgroundColor: AppColors.backgroundMedium,
                      valueColor: AlwaysStoppedAnimation<Color>(scoreColor),
                    ),
                  ),
                  // Score text
                  Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        isLoading ? '--' : '$preparednessScore',
                        style: AppTextStyles.h3.copyWith(
                          color: scoreColor,
                          fontWeight: FontWeight.bold,
                          fontSize: 24,
                        ),
                      ),
                      Text(
                        '%',
                        style: AppTextStyles.bodySmall.copyWith(
                          color: AppColors.textSecondary,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  /// Build status indicators row (Connection & Sync status)
  Widget _buildStatusRow() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.start,
      children: const [
        ConnectivityIndicator(),
        SizedBox(width: 12),
        SyncIndicator(),
      ],
    );
  }

  Widget _buildScoreCard(
    BuildContext context,
    AppLocalizations l10n,
    dynamic scoreState,
    int preparednessScore,
    bool isLoading,
  ) {
    if (isLoading) {
      return const LoadingState(message: 'Loading score...');
    }

    if (scoreState.error != null) {
      return ErrorState(
        title: 'Error Loading Score',
        message: scoreState.error.toString(),
        onRetry: () {
          ref
              .read(preparednessScoreProvider.notifier)
              .loadScore(forceRefresh: true);
        },
      );
    }

    // Determine score color
    Color scoreColor = AppColors.primaryGreen;
    if (preparednessScore >= 80) {
      scoreColor = AppColors.success;
    } else if (preparednessScore >= 60) {
      scoreColor = AppColors.warning;
    } else {
      scoreColor = AppColors.error;
    }

    return Container(
      padding: EdgeInsets.all(AppSpacing.xl),
      decoration: BoxDecoration(
        color: AppColors.backgroundWhite,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: AppColors.shadow.withOpacity(0.08),
            blurRadius: 20,
            offset: const Offset(0, 4),
            spreadRadius: 0,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header with title and icon
          Row(
            children: [
              Container(
                padding: EdgeInsets.all(AppSpacing.sm),
                decoration: BoxDecoration(
                  color: scoreColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  Icons.star_rounded,
                  color: scoreColor,
                  size: 24,
                ),
              ),
              SizedBox(width: AppSpacing.md),
              Expanded(
                child: Text(
                  l10n.preparednessScore,
                  style: AppTextStyles.h3.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
          SizedBox(height: AppSpacing.lg),
          // Progress bar with label
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Overall Progress',
                style: AppTextStyles.bodyMedium.copyWith(
                  color: AppColors.textSecondary,
                ),
              ),
              Text(
                '$preparednessScore%',
                style: AppTextStyles.bodyMedium.copyWith(
                  color: scoreColor,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          SizedBox(height: AppSpacing.sm),
          // Enhanced progress bar
          ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: LinearProgressIndicator(
              value: preparednessScore / 100,
              backgroundColor: AppColors.backgroundMedium,
              valueColor: AlwaysStoppedAnimation<Color>(scoreColor),
              minHeight: 12,
            ),
          ),
          SizedBox(height: AppSpacing.lg),
          // Action buttons row with better styling
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              Expanded(
                child: _buildActionButton(
                  icon: Icons.refresh_rounded,
                  label: 'Refresh',
                  onPressed: () {
                    ref
                        .read(preparednessScoreProvider.notifier)
                        .recalculateScore();
                  },
                  color: AppColors.accentBlue,
                ),
              ),
              SizedBox(width: AppSpacing.md),
              Expanded(
                child: _buildActionButton(
                  icon: Icons.history_rounded,
                  label: 'History',
                  onPressed: () {
                    Navigator.push<void>(
                      context,
                      MaterialPageRoute<void>(
                        builder: (context) => const ScoreHistoryScreen(),
                      ),
                    );
                  },
                  color: AppColors.accentBlue,
                ),
              ),
              SizedBox(width: AppSpacing.md),
              Expanded(
                child: _buildActionButton(
                  icon: Icons.analytics_rounded,
                  label: 'Details',
                  onPressed: () {
                    Navigator.push<void>(
                      context,
                      MaterialPageRoute<void>(
                        builder: (context) => const ScoreBreakdownScreen(),
                      ),
                    );
                  },
                  color: scoreColor,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  /// B2: Today's safety tip card (G1: language selector for Hindi/Marathi)
  Widget _buildTodaysTipCard(BuildContext context) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppBorders.radiusLg),
        side: BorderSide(color: AppColors.accentOrange.withOpacity(0.3)),
      ),
      color: AppColors.warningBackground.withOpacity(0.6),
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AppColors.accentOrange.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(Icons.lightbulb_outline_rounded, color: AppColors.accentOrange, size: 22),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        "Today's safety tip",
                        style: AppTextStyles.labelLarge?.copyWith(
                          fontWeight: FontWeight.w600,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        _todaysTip ?? '',
                        style: AppTextStyles.bodySmall.copyWith(color: AppColors.textSecondary, height: 1.35),
                      ),
                      if (_todaysTipDate != null && _todaysTipDate!.isNotEmpty)
                        Padding(
                          padding: const EdgeInsets.only(top: 4),
                          child: Text(
                            _todaysTipDate!,
                            style: AppTextStyles.bodySmall.copyWith(
                              color: AppColors.textTertiary,
                              fontSize: 11,
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Wrap(
              spacing: 8,
              children: [
                _tipChip('English', 'en'),
                _tipChip('हिंदी', 'hi'),
                _tipChip('मराठी', 'mr'),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _tipChip(String label, String lang) {
    final selected = _tipLang == lang;
    return FilterChip(
      label: Text(label, style: TextStyle(fontSize: 12, color: selected ? Colors.white : AppColors.textSecondary)),
      selected: selected,
      onSelected: (_) => _loadTodaysTip(lang),
      selectedColor: AppColors.accentOrange,
      checkmarkColor: Colors.white,
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
    );
  }

  /// Build action button for score card
  Widget _buildActionButton({
    required IconData icon,
    required String label,
    required VoidCallback onPressed,
    required Color color,
  }) {
    return InkWell(
      onTap: onPressed,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: EdgeInsets.symmetric(
            vertical: AppSpacing.md, horizontal: AppSpacing.sm),
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: color.withOpacity(0.2),
            width: 1,
          ),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              color: color,
              size: 20,
            ),
            SizedBox(height: AppSpacing.xs),
            Text(
              label,
              style: AppTextStyles.bodySmall.copyWith(
                color: color,
                fontWeight: FontWeight.w600,
                fontSize: 11,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTeacherSection(BuildContext context, UserModel? user) {
    final classId = user?.classId;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Class Management',
          style: AppTextStyles.h3,
        ),
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
      BuildContext context, AppLocalizations l10n, UserModel? user) {
    // Check access levels
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

    final List<Widget> actionCards = [];

    // Start Drill - Show drills list (scheduled/active/completed)
    if (canAccessDrills) {
      actionCards.add(
        FeatureCard(
          title: l10n.startDrill,
          description: 'View scheduled, active, and past drills',
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

    // View Modules - Redirect to ModuleScreenFile
    if (canAccessModules) {
      actionCards.add(
        FeatureCard(
          title: l10n.viewModules,
          description: 'Browse learning modules',
          icon: Icons.school_rounded,
          iconColor: AppColors.info,
          clickable: true,
          onTap: () {
            Navigator.push<void>(
              context,
              MaterialPageRoute<void>(
                builder: (context) => const ModuleScreenFile(),
              ),
            );
          },
        ),
      );
    }

    // Play Game - Redirect to MainMenuScreen
    if (canAccessGames) {
      actionCards.add(
        FeatureCard(
          title: l10n.playGame,
          description: 'Play safety games',
          icon: Icons.sports_esports_rounded,
          iconColor: AppColors.accentBlue,
          clickable: true,
          onTap: () {
            Navigator.push<void>(
              context,
              MaterialPageRoute<void>(
                builder: (context) => const MainMenuScreen(),
              ),
            );
          },
        ),
      );
    }

    // Take Quiz - Redirect to LanguageSelectionScreen(game: 'quiz')
    if (canAccessQuizzes) {
      actionCards.add(
        FeatureCard(
          title: l10n.takeQuiz,
          description: 'Test your knowledge',
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

    // Blueprint / Floor Plan Viewer
    if (hasInstitution) {
      actionCards.add(
        FeatureCard(
          title: 'School Map',
          description: 'View exits, equipment, rooms',
          icon: Icons.map_rounded,
          iconColor: AppColors.info,
          clickable: true,
          onTap: () {
            final schoolId = user!.institutionId!;
            Navigator.push<void>(
              context,
              MaterialPageRoute<void>(
                builder: (context) => BlueprintMapScreen(
                  schoolId: schoolId,
                  floor: 0,
                  title: 'School Map',
                ),
              ),
            );
          },
        ),
      );
    }

    // HazardScreenAI - Redirect to ScannerScreen
    actionCards.add(
      FeatureCard(
        title: 'Hazard Screen AI',
        description: 'AI-powered hazard detection',
        icon: Icons.dangerous_rounded,
        iconColor: AppColors.error,
        clickable: true,
        onTap: () async {
          // Initialize camera and navigate to ScannerScreen
          try {
            final cameras = await availableCameras();
            if (cameras.isEmpty) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('No camera available')),
              );
              return;
            }
            // Use back camera by default
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
                SnackBar(content: Text('Camera error: $e')),
              );
            }
          }
        },
      ),
    );

    // Category A1: Check exit (evacuation route)
    actionCards.add(
      FeatureCard(
        title: 'Check exit',
        description: 'Is the evacuation route clear?',
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
    );

    // Category A3: Scan damage (post-drill/incident)
    actionCards.add(
      FeatureCard(
        title: 'Scan damage',
        description: 'Check for damage after a drill or incident',
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
    );

    // Ask Kavach is now the 5th tab in the bottom nav (Ask).

    if (actionCards.isEmpty) {
      return EmptyState(
        title: 'No Actions Available',
        message: 'No quick actions available for your access level',
        icon: Icons.lock_outline,
      );
    }

    return ResponsiveGrid(
      children: actionCards
          .asMap()
          .entries
          .map((entry) => entry.value
              .animate()
              .fadeIn(
                duration: 400.ms,
                delay: (500 + entry.key * 100).ms,
                curve: Curves.easeOut,
              )
              .slideY(
                begin: 0.1,
                end: 0,
                duration: 500.ms,
                delay: (500 + entry.key * 100).ms,
                curve: Curves.easeOut,
              ))
          .toList(),
      spacing: AppSpacing.lg,
      childAspectRatio: 0.88,
    );
  }

  Widget? _buildEmergencyFAB(
      BuildContext context, AppLocalizations l10n, UserModel? user) {
    final canAccessCrisis = user == null ||
        user.role != 'student' ||
        AccessLevelProvider.canAccessFeature(user, 'crisis_mode');

    if (!canAccessCrisis) return null;

    return FABButton(
      icon: Icons.warning,
      label: l10n.emergency,
      backgroundColor: AppColors.primaryRed,
      onPressed: () {
        Navigator.of(context).push<void>(
          MaterialPageRoute<void>(
            builder: (context) => const RedAlertScreen(
              alertType: 'emergency',
              message: 'Emergency Alert - Test',
            ),
          ),
        );
      },
    );
  }
}
