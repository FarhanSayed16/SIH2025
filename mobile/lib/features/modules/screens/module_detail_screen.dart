/// Phase 3.1.1: Module Detail Screen
/// Phase 101.5.2: Redesigned with new component library
/// Displays module content with structured lessons and quiz

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/module_model.dart';
import '../providers/module_provider.dart';
import '../widgets/content_viewer.dart';
import 'quiz_screen.dart';
import '../../quiz/services/quiz_service.dart'; // Phase 3.1.4
import 'ai_quiz_dialog.dart'; // Phase 3.1.4
import '../../../core/widgets/widgets.dart';
import '../../../core/constants/api_endpoints.dart';
import '../../../core/services/api_service.dart';

class ModuleDetailScreen extends ConsumerStatefulWidget {
  final String moduleId;

  const ModuleDetailScreen({
    super.key,
    required this.moduleId,
  });

  @override
  ConsumerState<ModuleDetailScreen> createState() => _ModuleDetailScreenState();
}

class _ModuleDetailScreenState extends ConsumerState<ModuleDetailScreen> {
  int _currentLessonIndex = 0;
  // G2: Simple version for description
  String? _simplifiedDescription;
  bool _simplifyLoading = false;
  final ApiService _api = ApiService();

  @override
  Widget build(BuildContext context) {
    final moduleAsync = ref.watch(moduleProvider(widget.moduleId));

    return Scaffold(
      body: moduleAsync.when(
        data: (module) => _buildModuleContent(module),
        loading: () => const LoadingState(message: 'Loading module...', fullScreen: true),
        error: (error, stack) => ErrorState(
          message: error.toString(),
          title: 'Error loading module',
          onRetry: () {
            ref.invalidate(moduleProvider(widget.moduleId));
          },
          fullScreen: true,
        ),
      ),
    );
  }

  Widget _buildModuleContent(ModuleModel module) {
    final lessons = module.content.lessons ?? [];
    final hasLessons = lessons.isNotEmpty;
    final currentLesson = hasLessons && _currentLessonIndex < lessons.length
        ? lessons[_currentLessonIndex]
        : null;

    return CustomScrollView(
      slivers: [
        // App Bar
        SliverAppBar(
          expandedHeight: 200,
          pinned: true,
          flexibleSpace: FlexibleSpaceBar(
            title: Text(
              module.title,
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
              ),
            ),
            background: _buildHeaderImage(module),
          ),
        ),

        // Module Info
        SliverToBoxAdapter(
          child: _buildModuleInfo(module),
        ),

        // Lessons Navigation (if multiple lessons)
        if (hasLessons && lessons.length > 1)
          SliverToBoxAdapter(
            child: _buildLessonNavigation(lessons),
          ),

        // Current Lesson Content
        if (hasLessons)
          SliverToBoxAdapter(
            child: _buildLessonContent(currentLesson),
          )
        else
          // Legacy content (videos, images, text)
          SliverToBoxAdapter(
            child: _buildLegacyContent(module.content),
          ),

        // Quiz Section
        SliverToBoxAdapter(
          child: _buildQuizSection(module),
        ),

        // Bottom padding
        const SliverToBoxAdapter(
          child: SizedBox(height: 100),
        ),
      ],
    );
  }

  Widget _buildHeaderImage(ModuleModel module) {
    // Try to get first image from content
    String? imageUrl;
    if (module.content.lessons != null && module.content.lessons!.isNotEmpty) {
      for (final lesson in module.content.lessons!) {
        for (final section in lesson.sections) {
          if (section.type == 'image' && section.metadata?.url != null) {
            imageUrl = section.metadata!.url;
            break;
          }
        }
        if (imageUrl != null) break;
      }
    }

    if (imageUrl == null && module.content.images != null && module.content.images!.isNotEmpty) {
      imageUrl = module.content.images!.first.url;
    }

    if (imageUrl != null) {
      return Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              Colors.black.withOpacity(0.7),
              Colors.black.withOpacity(0.3),
            ],
          ),
        ),
        child: Image.network(
          imageUrl,
          fit: BoxFit.cover,
          errorBuilder: (context, error, stackTrace) => _buildDefaultHeader(),
        ),
      );
    }

    return _buildDefaultHeader();
  }

  Widget _buildDefaultHeader() {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Colors.blue[400]!,
            Colors.blue[600]!,
          ],
        ),
      ),
      child: const Center(
        child: Icon(
          Icons.school,
          size: 80,
          color: Colors.white70,
        ),
      ),
    );
  }

  Widget _buildModuleInfo(ModuleModel module) {
    final hasDescription = module.description != null && module.description!.isNotEmpty;
    final showSimplified = _simplifiedDescription != null && _simplifiedDescription!.isNotEmpty;
    final descriptionText = showSimplified ? _simplifiedDescription! : (module.description ?? '');

    return Container(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Description (G2: optional simple version)
          if (hasDescription) ...[
            Text(
              descriptionText,
              style: Theme.of(context).textTheme.bodyLarge,
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                if (_simplifyLoading)
                  const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                else if (!showSimplified)
                  TextButton.icon(
                    onPressed: () => _fetchSimplifiedDescription(module.description!),
                    icon: const Icon(Icons.auto_awesome, size: 18),
                    label: const Text('Simple version'),
                  )
                else
                  TextButton.icon(
                    onPressed: () => setState(() => _simplifiedDescription = null),
                    icon: const Icon(Icons.description, size: 18),
                    label: const Text('Original'),
                  ),
              ],
            ),
          ],

          const SizedBox(height: 16),

          // Metadata chips
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              if (module.category != null)
                Chip(
                  label: Text(module.category!),
                  avatar: const Icon(Icons.category, size: 18),
                ),
              Chip(
                label: Text(module.difficulty),
                avatar: Icon(
                  Icons.trending_up,
                  size: 18,
                  color: _getDifficultyColor(module.difficulty),
                ),
              ),
              Chip(
                label: Text(module.duration),
                avatar: const Icon(Icons.access_time, size: 18),
              ),
              Chip(
                label: Text('${module.points} pts'),
                avatar: const Icon(Icons.star, size: 18, color: Colors.amber),
              ),
            ],
          ),

          // Stats
          if (module.stats != null && module.stats!.totalViews > 0) ...[
            const SizedBox(height: 16),
            Row(
              children: [
                Icon(Icons.visibility, size: 16, color: Colors.grey[600]),
                const SizedBox(width: 4),
                Text(
                  '${module.stats!.totalViews} views',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
                if (module.stats!.totalCompletions > 0) ...[
                  const SizedBox(width: 16),
                  Icon(Icons.check_circle, size: 16, color: Colors.grey[600]),
                  const SizedBox(width: 4),
                  Text(
                    '${module.stats!.totalCompletions} completed',
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ],
              ],
            ),
          ],
        ],
      ),
    );
  }

  Future<void> _fetchSimplifiedDescription(String text) async {
    if (_simplifyLoading || !mounted) return;
    setState(() => _simplifyLoading = true);
    try {
      final res = await _api.post(
        ApiEndpoints.aiSimplify,
        data: {'text': text, 'ageOrGrade': 10},
      );
      final data = res.data;
      String? simplified;
      if (data is Map) {
        if (data['data'] != null && data['data'] is Map) {
          simplified = (data['data'] as Map)['simplified']?.toString();
        } else {
          simplified = data['simplified']?.toString();
        }
      }
      if (mounted && simplified != null && simplified.isNotEmpty) {
        setState(() {
          _simplifiedDescription = simplified;
          _simplifyLoading = false;
        });
      } else if (mounted) {
        setState(() => _simplifyLoading = false);
      }
    } catch (_) {
      if (mounted) setState(() => _simplifyLoading = false);
    }
  }

  Widget _buildLessonNavigation(List<ModuleLesson> lessons) {
    return Container(
      height: 60,
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: lessons.length,
        itemBuilder: (context, index) {
          final lesson = lessons[index];
          final isSelected = index == _currentLessonIndex;

          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: ChoiceChip(
              label: Text(lesson.title),
              selected: isSelected,
              onSelected: (selected) {
                if (selected) {
                  setState(() {
                    _currentLessonIndex = index;
                  });
                }
              },
            ),
          );
        },
      ),
    );
  }

  Widget _buildLessonContent(ModuleLesson? lesson) {
    if (lesson == null) {
      return const SizedBox.shrink();
    }

    return Container(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            lesson.title,
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
          ),
          const SizedBox(height: 16),
          // Sections
          ...lesson.sections.map((section) => ContentViewer(section: section)),
        ],
      ),
    );
  }

  Widget _buildLegacyContent(ModuleContent content) {
    return Container(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Text content
          if (content.text != null && content.text!.isNotEmpty)
            ContentViewer(
              section: ModuleSection(
                type: 'text',
                content: content.text,
              ),
            ),

          // Images
          if (content.images != null)
            ...content.images!.map((image) => ContentViewer(
                  section: ModuleSection(
                    type: 'image',
                    content: image.caption,
                    metadata: ModuleSectionMetadata(
                      url: image.url,
                      caption: image.caption,
                    ),
                  ),
                )),

          // Videos
          if (content.videos != null)
            ...content.videos!.map((video) => ContentViewer(
                  section: ModuleSection(
                    type: 'video',
                    content: video.title,
                    metadata: ModuleSectionMetadata(
                      url: video.url,
                      duration: video.duration,
                    ),
                  ),
                )),
        ],
      ),
    );
  }

  Widget _buildQuizSection(ModuleModel module) {
    // Phase 3.1.4: Enhanced quiz section with AI quiz generation
    final hasRegularQuiz = module.quiz != null && module.quiz!.questions.isNotEmpty;

    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.amber[50],
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.amber[200]!),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.quiz, color: Colors.amber[700]),
              const SizedBox(width: 8),
              Text(
                'Quiz',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          
          // Regular Quiz (if available)
          if (hasRegularQuiz) ...[
            Text(
              'Module Quiz - ${module.quiz!.questions.length} questions',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            if (module.quiz!.timeLimit != null)
              Text(
                'Time limit: ${_formatDuration(module.quiz!.timeLimit!)}',
                style: Theme.of(context).textTheme.bodySmall,
              ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () {
                  Navigator.push<void>(
                    context,
                    MaterialPageRoute<void>(
                      builder: (context) => QuizScreen(
                        moduleId: module.id,
                        quiz: module.quiz!,
                      ),
                    ),
                  );
                },
                icon: const Icon(Icons.play_arrow),
                label: const Text('Start Module Quiz'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.amber[700],
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
              ),
            ),
            const SizedBox(height: 16),
            const Divider(),
            const SizedBox(height: 16),
          ],

          // AI Quiz Generation (Phase 3.1.4)
          Row(
            children: [
              Icon(Icons.auto_awesome, color: Colors.purple[700]),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  'AI-Generated Quiz',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            'Generate unlimited quiz questions using AI',
            style: Theme.of(context).textTheme.bodySmall,
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: () {
                _showAIGenerateQuizDialog(module);
              },
              icon: const Icon(Icons.auto_awesome),
              label: const Text('Generate AI Quiz'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.purple[700],
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // Phase 3.1.4: Show AI quiz generation dialog
  void _showAIGenerateQuizDialog(ModuleModel module) {
    final quizService = QuizService();
    showDialog<void>(
      context: context,
      builder: (context) => AIGenerateQuizDialog(
        moduleId: module.id,
        moduleDifficulty: module.difficulty,
        gradeLevel: module.gradeLevel.isNotEmpty ? module.gradeLevel[0] : 'all',
        quizService: quizService,
      ),
    );
  }

  // ignore: unused_element
  Widget _buildErrorState(Object error) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.error_outline, size: 64, color: Colors.red),
          const SizedBox(height: 16),
          Text(
            'Error loading module',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 8),
          Text(
            error.toString(),
            style: Theme.of(context).textTheme.bodyMedium,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: () {
              ref.invalidate(moduleProvider(widget.moduleId));
            },
            child: const Text('Retry'),
          ),
        ],
      ),
    );
  }

  Color _getDifficultyColor(String difficulty) {
    switch (difficulty.toLowerCase()) {
      case 'beginner':
        return Colors.green;
      case 'intermediate':
        return Colors.orange;
      case 'advanced':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  String _formatDuration(int seconds) {
    final minutes = seconds ~/ 60;
    final secs = seconds % 60;
    if (minutes > 0) {
      return '${minutes}m ${secs}s';
    }
    return '${secs}s';
  }
}
