/// NDMA lesson detail — persist video completion under current user (B5 §10.3).

import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/design/design_system.dart';
import '../core/providers/api_service_provider.dart';
import '../data/module_data.dart';
import '../features/auth/providers/auth_provider.dart';
import '../features/modules/services/module_completion_service.dart';
import '../features/modules/services/video_progress_service.dart';
import '../models/module_models.dart';
import 'quiz_screen.dart';
import 'video_player_view.dart';

class ModuleDetailScreen extends ConsumerStatefulWidget {
  final LearningModule module;
  final VoidCallback onModuleUpdated;

  const ModuleDetailScreen({
    Key? key,
    required this.module,
    required this.onModuleUpdated,
  }) : super(key: key);

  @override
  ConsumerState<ModuleDetailScreen> createState() => _ModuleDetailScreenState();
}

class _ModuleDetailScreenState extends ConsumerState<ModuleDetailScreen> {
  final VideoProgressService _videoProgress = VideoProgressService();
  bool _persisting = false;

  Future<void> _onVideoCompleted(VideoLesson video) async {
    if (video.isCompleted || _persisting) return;

    setState(() {
      video.isCompleted = true;
      video.lastPosition = null;
      _persisting = true;
    });
    widget.onModuleUpdated();

    final userId = ref.read(authProvider).user?.id;
    ModuleRepository().updateVideoProgress(
      widget.module.id,
      video.title,
      true,
    );

    try {
      await _videoProgress.markVideoCompleted(
        moduleId: widget.module.id,
        videoTitle: video.title,
        videoUrl: video.url,
        userId: userId,
      );
    } catch (_) {
      // Local memory + cache already updated; Hive failure is non-fatal for UI
    }

    try {
      final api = ref.read(apiServiceProvider);
      await ModuleCompletionService(apiService: api).markVideoCompleted(
        moduleId: widget.module.id,
        moduleType: 'ndma',
        videoId: video.title,
        totalVideos: widget.module.videos.length,
      );
    } catch (_) {
      // Offline / server failure — local progress remains; sync can retry later
    }

    if (mounted) setState(() => _persisting = false);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final videos = widget.module.videos;
    final canTakeQuiz =
        videos.isNotEmpty && videos.every((v) => v.isCompleted);
    final completedCount = videos.where((v) => v.isCompleted).length;

    return Scaffold(
      backgroundColor: theme.colorScheme.surface,
      appBar: AppBar(
        title: Text(widget.module.title),
        backgroundColor: theme.colorScheme.primary,
        foregroundColor: theme.colorScheme.onPrimary,
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(
            'Source: NDMA materials · Format: video · Requires internet',
            style: theme.textTheme.labelMedium?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            widget.module.description,
            style: theme.textTheme.bodyMedium?.copyWith(height: 1.45),
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              _tag(Icons.trending_up, widget.module.levelSentenceCase),
              _tag(Icons.schedule, 'Est. ${widget.module.duration}'),
              _tag(
                Icons.ondemand_video,
                'Videos $completedCount / ${videos.length}',
              ),
              if (widget.module.isQuizPassed)
                _tag(Icons.emoji_events_outlined, 'Quiz passed'),
            ],
          ),
          const SizedBox(height: 20),
          Text(
            'Lesson videos',
            style: theme.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Playback needs a network connection. Completing a video does not mean the quiz is passed.',
            style: theme.textTheme.bodySmall?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 12),
          ...videos.asMap().entries.map((entry) {
            final idx = entry.key;
            final video = entry.value;
            final status = video.isCompleted
                ? 'Completed'
                : video.hasResumePosition
                    ? 'Resume'
                    : 'Not started';
            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Material(
                color: theme.colorScheme.surface,
                borderRadius: AppBorders.borderRadiusMd,
                child: InkWell(
                  borderRadius: AppBorders.borderRadiusMd,
                  onTap: () {
                    Navigator.push<void>(
                      context,
                      MaterialPageRoute<void>(
                        builder: (context) => VideoPlayerView(
                          title: video.title,
                          videoUrl: video.url,
                          autoPlay: false,
                          initialPosition: video.hasResumePosition
                              ? video.lastPosition
                              : null,
                          onPositionSave: (position, seconds) {
                            video.lastPosition = position;
                            final userId = ref.read(authProvider).user?.id;
                            unawaited(_videoProgress.saveVideoPosition(
                              moduleId: widget.module.id,
                              videoTitle: video.title,
                              videoUrl: video.url,
                              position: position,
                              watchTimeSeconds: seconds,
                              userId: userId,
                            ));
                          },
                          onVideoCompleted: () => _onVideoCompleted(video),
                        ),
                      ),
                    ).then((_) {
                      if (mounted) setState(() {});
                    });
                  },
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      borderRadius: AppBorders.borderRadiusMd,
                      border: Border.all(
                        color: theme.colorScheme.outlineVariant,
                      ),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          video.isCompleted
                              ? Icons.check_circle
                              : video.hasResumePosition
                                  ? Icons.replay_circle_filled
                                  : Icons.play_circle_outline,
                          color: video.isCompleted
                              ? AppColors.success
                              : theme.colorScheme.primary,
                          size: 36,
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                '${idx + 1}. ${video.title}',
                                style: theme.textTheme.titleSmall?.copyWith(
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                status,
                                style: theme.textTheme.bodySmall?.copyWith(
                                  color: theme.colorScheme.onSurfaceVariant,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            );
          }),
          const SizedBox(height: 8),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.warningBackground.withValues(alpha: 0.7),
              borderRadius: AppBorders.borderRadiusLg,
              border: Border.all(color: AppColors.accentOrange.withValues(alpha: 0.35)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Module quiz',
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  canTakeQuiz
                      ? 'All lesson videos are completed. Video completion and quiz completion are tracked separately.'
                      : 'Unlocks after all lesson videos in this module are completed ($completedCount / ${videos.length}).',
                  style: theme.textTheme.bodySmall,
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton.icon(
                    onPressed: canTakeQuiz
                        ? () {
                            Navigator.push<void>(
                              context,
                              MaterialPageRoute<void>(
                                builder: (context) => QuizScreen(
                                  moduleTitle: widget.module.title,
                                  quizPath: widget.module.quizJsonPath,
                                  onQuizFinished: (passed) {
                                    if (passed) {
                                      setState(() {
                                        widget.module.isQuizPassed = true;
                                      });
                                      widget.onModuleUpdated();
                                    }
                                  },
                                ),
                              ),
                            );
                          }
                        : null,
                    icon: const Icon(Icons.quiz_outlined),
                    label: Text(
                      canTakeQuiz ? 'Start module quiz' : 'Quiz locked',
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.backgroundMedium,
              borderRadius: AppBorders.borderRadiusLg,
              border: Border.all(color: AppColors.borderLight),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'AI-generated quiz',
                  style: theme.textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  'This option is not available in the app yet.',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Unavailable',
                  style: theme.textTheme.labelLarge?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _tag(IconData icon, String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        border: Border.all(color: AppColors.borderLight),
        borderRadius: AppBorders.borderRadiusSm,
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: AppColors.primaryGreen),
          const SizedBox(width: 4),
          Text(label, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }
}
