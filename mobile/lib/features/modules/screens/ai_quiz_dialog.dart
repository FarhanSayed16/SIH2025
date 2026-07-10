/// Phase 3.1.4: AI Quiz Generation Dialog
/// E2: AI-suggested difficulty (grade + last quiz score)
/// Allows users to generate AI-powered quizzes

import 'package:flutter/material.dart';
import '../../quiz/services/quiz_service.dart';
import '../services/local_completion_service.dart';
import 'quiz_screen.dart';
import '../../../core/constants/api_endpoints.dart';
import '../../../core/providers/api_service_provider.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class AIGenerateQuizDialog extends ConsumerStatefulWidget {
  final String moduleId;
  final String moduleDifficulty;
  final String gradeLevel;
  final QuizService quizService;

  const AIGenerateQuizDialog({
    super.key,
    required this.moduleId,
    required this.moduleDifficulty,
    required this.gradeLevel,
    required this.quizService,
  });

  @override
  ConsumerState<AIGenerateQuizDialog> createState() => _AIGenerateQuizDialogState();
}

class _AIGenerateQuizDialogState extends ConsumerState<AIGenerateQuizDialog> {
  int _numQuestions = 5;
  String _difficulty = 'beginner';
  bool _isGenerating = false;
  bool _isSuggesting = false;
  String? _errorMessage;
  final LocalCompletionService _completionService = LocalCompletionService();

  @override
  void initState() {
    super.initState();
    _difficulty = widget.moduleDifficulty;
  }

  /// E2: Fetch AI-suggested difficulty (grade + last quiz score)
  Future<void> _suggestDifficulty() async {
    setState(() {
      _isSuggesting = true;
      _errorMessage = null;
    });
    try {
      int? lastScore;
      final entries = await _completionService.getCompletedModuleEntries();
      if (entries.isNotEmpty) {
        entries.sort((a, b) => b.completedAt.compareTo(a.completedAt));
        lastScore = entries.first.score;
      }
      final api = ref.read(apiServiceProvider);
      final res = await api.post(ApiEndpoints.aiQuizSuggestDifficulty, data: {
        'gradeLevel': widget.gradeLevel,
        if (lastScore != null) 'lastQuizScore': lastScore,
      });
      final data = res.data is Map && res.data['data'] != null ? res.data['data'] as Map : res.data as Map;
      final suggested = data['difficulty']?.toString();
      if (mounted && suggested != null && ['beginner', 'intermediate', 'advanced'].contains(suggested)) {
        setState(() {
          _difficulty = suggested;
          _isSuggesting = false;
        });
      } else {
        if (mounted) setState(() => _isSuggesting = false);
      }
    } catch (_) {
      if (mounted) setState(() => _isSuggesting = false);
    }
  }

  Future<void> _generateQuiz() async {
    setState(() {
      _isGenerating = true;
      _errorMessage = null;
    });

    try {
      final quiz = await widget.quizService.generateQuiz(
        moduleId: widget.moduleId,
        numQuestions: _numQuestions,
        difficulty: _difficulty,
        gradeLevel: widget.gradeLevel,
        useCache: true,
      );

      if (mounted) {
        Navigator.pop(context); // Close dialog
        Navigator.push<void>(
          context,
          MaterialPageRoute<void>(
            builder: (context) => QuizScreen(
              moduleId: widget.moduleId,
              quiz: quiz,
            ),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = e.toString().replaceAll('Exception: ', '');
          _isGenerating = false;
        });
      }
    }
  }


  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Row(
        children: [
          Icon(Icons.auto_awesome, color: Colors.purple),
          SizedBox(width: 8),
          Text('Generate AI Quiz'),
        ],
      ),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Number of Questions
            Text(
              'Number of Questions',
              style: Theme.of(context).textTheme.titleSmall,
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: Slider(
                    value: _numQuestions.toDouble(),
                    min: 3,
                    max: 10,
                    divisions: 7,
                    label: '$_numQuestions questions',
                    onChanged: (value) {
                      setState(() {
                        _numQuestions = value.toInt();
                      });
                    },
                  ),
                ),
                SizedBox(
                  width: 60,
                  child: Text(
                    '$_numQuestions',
                    style: Theme.of(context).textTheme.titleMedium,
                    textAlign: TextAlign.center,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Difficulty (E2: AI suggest)
            Row(
              children: [
                Text(
                  'Difficulty Level',
                  style: Theme.of(context).textTheme.titleSmall,
                ),
                const Spacer(),
                TextButton.icon(
                  onPressed: _isSuggesting ? null : _suggestDifficulty,
                  icon: _isSuggesting
                      ? const SizedBox(
                          width: 14,
                          height: 14,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(Icons.auto_awesome, size: 18),
                  label: Text(_isSuggesting ? 'Suggesting...' : 'Suggest for me'),
                ),
              ],
            ),
            const SizedBox(height: 8),
            SegmentedButton<String>(
              segments: const [
                ButtonSegment(value: 'beginner', label: Text('Easy')),
                ButtonSegment(value: 'intermediate', label: Text('Medium')),
                ButtonSegment(value: 'advanced', label: Text('Hard')),
              ],
              selected: {_difficulty},
              onSelectionChanged: (Set<String> selection) {
                setState(() {
                  _difficulty = selection.first;
                });
              },
            ),

            // Error message
            if (_errorMessage != null) ...[
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.red[50],
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.red[200]!),
                ),
                child: Row(
                  children: [
                    Icon(Icons.error_outline, color: Colors.red[700], size: 20),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        _errorMessage!,
                        style: TextStyle(color: Colors.red[700], fontSize: 12),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: _isGenerating ? null : () => Navigator.pop(context),
          child: const Text('Cancel'),
        ),
        ElevatedButton.icon(
          onPressed: _isGenerating ? null : _generateQuiz,
          icon: _isGenerating
              ? const SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : const Icon(Icons.auto_awesome),
          label: Text(_isGenerating ? 'Generating...' : 'Generate'),
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.purple[700],
            foregroundColor: Colors.white,
          ),
        ),
      ],
    );
  }
}

