/// Child Analytics Screen
/// Comprehensive analytics and performance tracking for a child
/// Parent Monitoring System - Phase 3 Enhancement

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/widgets/widgets.dart';
import '../../../core/design/design_system.dart';
import '../providers/parent_provider.dart';

class ChildAnalyticsScreen extends ConsumerWidget {
  final String studentId;

  const ChildAnalyticsScreen({
    super.key,
    required this.studentId,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final childDetailsAsync = ref.watch(childDetailsProvider(studentId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Child Analytics'),
        elevation: 0,
      ),
      body: childDetailsAsync.when(
        data: (childDetails) {
          final student = childDetails.student;
          final modules = childDetails.modules;
          final quiz = childDetails.quiz;
          final games = childDetails.games;

          // Calculate metrics
          final totalModules = (modules['total'] as num?)?.toInt() ?? 0;
          final completedModules = (modules['completed'] as num?)?.toInt() ?? 0;
          final moduleProgress = totalModules > 0
              ? (completedModules / totalModules * 100).round()
              : 0;

          final avgQuizScore = (quiz['avgScore'] as num?)?.toDouble() ?? 0.0;
          final totalQuizzes = (quiz['total'] as num?)?.toInt() ?? 0;
          final gamesPlayed = (games['played'] as num?)?.toInt() ?? 0;
          final gamesWon = (games['won'] as num?)?.toInt() ?? 0;

          return RefreshIndicator(
            onRefresh: () async {
              ref.invalidate(childDetailsProvider(studentId));
            },
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                // Header
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        AppColors.accentBlue.withOpacity(0.1),
                        AppColors.accentBlue.withOpacity(0.05),
                      ],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: AppBorders.borderRadiusLg,
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        student.name,
                        style: AppTextStyles.h3.copyWith(
                          color: AppColors.accentBlue,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      if (student.grade != null && student.section != null)
                        Text(
                          'Grade ${student.grade} - Section ${student.section}',
                          style: AppTextStyles.bodyMedium.copyWith(
                            color: AppColors.textSecondary,
                          ),
                        ),
                    ],
                  ),
                ),

                const SizedBox(height: 24),

                // Key Metrics
                Text(
                  'Key Metrics',
                  style: AppTextStyles.h4,
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: StatCard(
                        label: 'Progress',
                        value: '$moduleProgress%',
                        icon: Icons.trending_up,
                        iconColor: AppColors.success,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: StatCard(
                        label: 'Avg Score',
                        value: avgQuizScore > 0
                            ? '${avgQuizScore.toStringAsFixed(1)}%'
                            : 'N/A',
                        icon: Icons.quiz,
                        iconColor: AppColors.accentBlue,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: StatCard(
                        label: 'Modules',
                        value: '$completedModules/$totalModules',
                        icon: Icons.book,
                        iconColor: AppColors.primaryGreen,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: StatCard(
                        label: 'Games',
                        value: '$gamesPlayed',
                        icon: Icons.sports_esports,
                        iconColor: AppColors.warning,
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 24),

                // Module Completion
                Text(
                  'Module Completion',
                  style: AppTextStyles.h4,
                ),
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppColors.backgroundWhite,
                    borderRadius: AppBorders.borderRadiusLg,
                  ),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Completed',
                            style: AppTextStyles.bodyMedium,
                          ),
                          Text(
                            '$completedModules of $totalModules',
                            style: AppTextStyles.bodyMedium.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      ClipRRect(
                        borderRadius: AppBorders.borderRadiusMd,
                        child: LinearProgressIndicator(
                          value: totalModules > 0
                              ? completedModules / totalModules
                              : 0,
                          minHeight: 12,
                          backgroundColor: AppColors.backgroundMedium,
                          valueColor: AlwaysStoppedAnimation<Color>(
                            AppColors.success,
                          ),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        '$moduleProgress% Complete',
                        style: AppTextStyles.caption.copyWith(
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 24),

                // Quiz Performance
                if (totalQuizzes > 0) ...[
                  Text(
                    'Quiz Performance',
                    style: AppTextStyles.h4,
                  ),
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppColors.backgroundWhite,
                      borderRadius: AppBorders.borderRadiusLg,
                    ),
                    child: Column(
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceAround,
                          children: [
                            _buildMetricItem(
                              'Total Quizzes',
                              '$totalQuizzes',
                              Icons.quiz,
                              AppColors.accentBlue,
                            ),
                            _buildMetricItem(
                              'Avg Score',
                              '${avgQuizScore.toStringAsFixed(1)}%',
                              Icons.trending_up,
                              AppColors.success,
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),
                ],

                // Game Performance
                if (gamesPlayed > 0) ...[
                  Text(
                    'Game Performance',
                    style: AppTextStyles.h4,
                  ),
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppColors.backgroundWhite,
                      borderRadius: AppBorders.borderRadiusLg,
                    ),
                    child: Column(
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceAround,
                          children: [
                            _buildMetricItem(
                              'Games Played',
                              '$gamesPlayed',
                              Icons.sports_esports,
                              AppColors.warning,
                            ),
                            _buildMetricItem(
                              'Games Won',
                              '$gamesWon',
                              Icons.emoji_events,
                              AppColors.success,
                            ),
                          ],
                        ),
                        if (gamesPlayed > 0) ...[
                          const SizedBox(height: 12),
                          ClipRRect(
                            borderRadius: AppBorders.borderRadiusMd,
                            child: LinearProgressIndicator(
                              value: gamesWon / gamesPlayed,
                              minHeight: 8,
                              backgroundColor: AppColors.backgroundMedium,
                              valueColor: AlwaysStoppedAnimation<Color>(
                                AppColors.warning,
                              ),
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Win Rate: ${((gamesWon / gamesPlayed) * 100).toStringAsFixed(1)}%',
                            style: AppTextStyles.caption.copyWith(
                              color: AppColors.textSecondary,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),
                ],

                // Performance Summary
                Text(
                  'Performance Summary',
                  style: AppTextStyles.h4,
                ),
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppColors.backgroundWhite,
                    borderRadius: AppBorders.borderRadiusLg,
                  ),
                  child: Column(
                    children: [
                      _buildSummaryRow(
                        'Overall Progress',
                        '$moduleProgress%',
                        moduleProgress / 100,
                        AppColors.success,
                      ),
                      const SizedBox(height: 12),
                      if (totalQuizzes > 0)
                        _buildSummaryRow(
                          'Quiz Average',
                          '${avgQuizScore.toStringAsFixed(1)}%',
                          avgQuizScore / 100,
                          AppColors.accentBlue,
                        ),
                      if (totalQuizzes > 0) const SizedBox(height: 12),
                      if (gamesPlayed > 0)
                        _buildSummaryRow(
                          'Game Win Rate',
                          '${((gamesWon / gamesPlayed) * 100).toStringAsFixed(1)}%',
                          gamesWon / gamesPlayed,
                          AppColors.warning,
                        ),
                    ],
                  ),
                ),

                const SizedBox(height: 24),
              ],
            ),
          );
        },
        loading: () => const LoadingState(),
        error: (error, stack) => ErrorState(
          message: error.toString(),
          onRetry: () {
            ref.invalidate(childDetailsProvider(studentId));
          },
        ),
      ),
    );
  }

  Widget _buildMetricItem(
    String label,
    String value,
    IconData icon,
    Color color,
  ) {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: color.withOpacity(0.1),
            borderRadius: AppBorders.borderRadiusMd,
          ),
          child: Icon(icon, color: color, size: 32),
        ),
        const SizedBox(height: 8),
        Text(
          value,
          style: AppTextStyles.h5.copyWith(
            color: color,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: AppTextStyles.caption.copyWith(
            color: AppColors.textSecondary,
          ),
        ),
      ],
    );
  }

  Widget _buildSummaryRow(
    String label,
    String value,
    double progress,
    Color color,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              label,
              style: AppTextStyles.bodyMedium,
            ),
            Text(
              value,
              style: AppTextStyles.bodyMedium.copyWith(
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        ClipRRect(
          borderRadius: AppBorders.borderRadiusSm,
          child: LinearProgressIndicator(
            value: progress.clamp(0.0, 1.0),
            minHeight: 8,
            backgroundColor: AppColors.backgroundMedium,
            valueColor: AlwaysStoppedAnimation<Color>(color),
          ),
        ),
      ],
    );
  }
}
