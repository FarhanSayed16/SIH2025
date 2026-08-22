/// Phase 3.1.1: Quiz Screen
/// Phase 3.1.3: Enhanced with non-reader support (audio, picture quizzes)
/// Displays quiz questions and handles quiz submission

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/module_model.dart';
import '../providers/module_provider.dart';
import '../../quiz/widgets/picture_quiz_widget.dart';
import '../../quiz/widgets/audio_quiz_widget.dart';
import '../widgets/tap_to_listen_widget.dart';
import '../../../core/services/tts_service.dart';
import '../../../features/score/providers/preparedness_score_provider.dart';

class QuizScreen extends ConsumerStatefulWidget {
  final String moduleId;
  final ModuleQuiz quiz;

  const QuizScreen({
    super.key,
    required this.moduleId,
    required this.quiz,
  });

  @override
  ConsumerState<QuizScreen> createState() => _QuizScreenState();
}

class _QuizScreenState extends ConsumerState<QuizScreen> {
  int _currentQuestionIndex = 0;
  final Map<int, int> _answers = {};
  bool _isSubmitting = false;
  final TtsService _ttsService = TtsService();

  @override
  void initState() {
    super.initState();
    _ttsService.initialize();
  }

  @override
  void dispose() {
    _ttsService.stop();
    _ttsService.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final currentQuestion = widget.quiz.questions[_currentQuestionIndex];
    final isLastQuestion =
        _currentQuestionIndex == widget.quiz.questions.length - 1;

    return Scaffold(
      appBar: AppBar(
        title: Text(
            'Question ${_currentQuestionIndex + 1} of ${widget.quiz.questions.length}'),
        actions: [
          if (widget.quiz.timeLimit != null)
            Padding(
              padding: const EdgeInsets.all(16),
              child: Center(
                child: Text(
                  '${widget.quiz.timeLimit!}s',
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
              ),
            ),
        ],
      ),
      body: Column(
        children: [
          // Progress indicator
          LinearProgressIndicator(
            value: (_currentQuestionIndex + 1) / widget.quiz.questions.length,
            backgroundColor: Colors.grey[200],
          ),

          // Question
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Phase 3.1.3: Use specialized widgets for picture and audio quizzes
                  if (currentQuestion.questionType == 'image-to-image')
                    PictureQuizWidget(
                      question: currentQuestion,
                      selectedAnswer: _answers[_currentQuestionIndex],
                      onAnswerSelected: (index) {
                        setState(() {
                          _answers[_currentQuestionIndex] = index;
                        });
                      },
                    )
                  else if (currentQuestion.questionType == 'audio')
                    AudioQuizWidget(
                      question: currentQuestion,
                      selectedAnswer: _answers[_currentQuestionIndex],
                      onAnswerSelected: (index) {
                        setState(() {
                          _answers[_currentQuestionIndex] = index;
                        });
                      },
                    )
                  else
                    // Standard text/image quiz
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Question text with tap-to-listen
                        TapToListenWidget(
                          text: currentQuestion.question,
                          child: Text(
                            currentQuestion.question,
                            style: Theme.of(context)
                                .textTheme
                                .headlineSmall
                                ?.copyWith(
                                  fontWeight: FontWeight.bold,
                                ),
                          ),
                        ),

                        const SizedBox(height: 24),

                        // Question image (if image-based question)
                        if (currentQuestion.questionType == 'image' &&
                            currentQuestion.questionImage != null)
                          Padding(
                            padding: const EdgeInsets.only(bottom: 16),
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(12),
                              child: Image.network(
                                currentQuestion.questionImage!,
                                height: 200,
                                fit: BoxFit.cover,
                                errorBuilder: (context, error, stackTrace) =>
                                    Container(
                                  height: 200,
                                  color: Colors.grey[300],
                                  child: const Icon(Icons.error_outline),
                                ),
                              ),
                            ),
                          ),

                        // Options
                        ...currentQuestion.options.asMap().entries.map((entry) {
                          final index = entry.key;
                          final option = entry.value;
                          final isSelected =
                              _answers[_currentQuestionIndex] == index;

                          return Padding(
                            padding: const EdgeInsets.only(bottom: 12),
                            child: InkWell(
                              onTap: () {
                                setState(() {
                                  _answers[_currentQuestionIndex] = index;
                                });
                              },
                              borderRadius: BorderRadius.circular(12),
                              child: Container(
                                padding: const EdgeInsets.all(16),
                                decoration: BoxDecoration(
                                  border: Border.all(
                                    color: isSelected
                                        ? Colors.blue
                                        : Colors.grey[300]!,
                                    width: isSelected ? 2 : 1,
                                  ),
                                  borderRadius: BorderRadius.circular(12),
                                  color: isSelected
                                      ? Colors.blue[50]
                                      : Colors.white,
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        Container(
                                          width: 24,
                                          height: 24,
                                          decoration: BoxDecoration(
                                            shape: BoxShape.circle,
                                            border: Border.all(
                                              color: isSelected
                                                  ? Colors.blue
                                                  : Colors.grey,
                                              width: 2,
                                            ),
                                            color: isSelected
                                                ? Colors.blue
                                                : Colors.transparent,
                                          ),
                                          child: isSelected
                                              ? const Icon(
                                                  Icons.check,
                                                  size: 16,
                                                  color: Colors.white,
                                                )
                                              : null,
                                        ),
                                        const SizedBox(width: 12),
                                        Expanded(
                                          child: Text(
                                            option.text,
                                            style: Theme.of(context)
                                                .textTheme
                                                .bodyLarge,
                                          ),
                                        ),
                                      ],
                                    ),
                                    // Option image (if available)
                                    if (option.imageUrl != null &&
                                        option.imageUrl!.isNotEmpty) ...[
                                      const SizedBox(height: 12),
                                      ClipRRect(
                                        borderRadius: BorderRadius.circular(8),
                                        child: Image.network(
                                          option.imageUrl!,
                                          height: 120,
                                          width: double.infinity,
                                          fit: BoxFit.cover,
                                          errorBuilder:
                                              (context, error, stackTrace) =>
                                                  Container(
                                            height: 120,
                                            color: Colors.grey[300],
                                            child:
                                                const Icon(Icons.error_outline),
                                          ),
                                        ),
                                      ),
                                    ],
                                  ],
                                ),
                              ),
                            ),
                          );
                        }),
                      ],
                    ),
                ],
              ),
            ),
          ),

          // Navigation buttons
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: Colors.grey.withOpacity(0.2),
                  blurRadius: 4,
                  offset: const Offset(0, -2),
                ),
              ],
            ),
            child: Row(
              children: [
                if (_currentQuestionIndex > 0)
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () {
                        setState(() {
                          _currentQuestionIndex--;
                        });
                      },
                      child: const Text('Previous'),
                    ),
                  ),
                if (_currentQuestionIndex > 0) const SizedBox(width: 16),
                Expanded(
                  flex: 2,
                  child: ElevatedButton(
                    onPressed: _answers[_currentQuestionIndex] != null
                        ? () {
                            if (isLastQuestion) {
                              _submitQuiz();
                            } else {
                              setState(() {
                                _currentQuestionIndex++;
                              });
                            }
                          }
                        : null,
                    child: Text(isLastQuestion ? 'Submit Quiz' : 'Next'),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _submitQuiz() async {
    if (_isSubmitting) return;

    // Check if all questions are answered
    if (_answers.length != widget.quiz.questions.length) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please answer all questions'),
        ),
      );
      return;
    }

    setState(() {
      _isSubmitting = true;
    });

    try {
      final moduleService = ref.read(moduleServiceProvider);
      final answers = widget.quiz.questions.asMap().entries.map((entry) {
        final questionIndex = entry.key;
        final selectedAnswer = _answers[questionIndex] ?? 0;
        return {
          'questionIndex': questionIndex,
          'selectedAnswer': selectedAnswer,
        };
      }).toList();

      final result = await moduleService.completeModule(
        widget.moduleId,
        answers,
      );

      // Phase 3.3.1: Refresh preparedness score after quiz completion
      if (mounted) {
        ref
            .read(preparednessScoreProvider.notifier)
            .loadScore(forceRefresh: true);
      }

      if (mounted) {
        Navigator.pop(context);
        _showQuizResult(result);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error submitting quiz: $e'),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isSubmitting = false;
        });
      }
    }
  }

  void _showQuizResult(Map<String, dynamic> result) {
    final score = (result['score'] ?? 0) as int;
    final passed = (result['passed'] ?? false) as bool;
    final message = (result['message'] ?? '') as String;

    showDialog<void>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(passed ? 'Congratulations!' : 'Try Again'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('Your score: $score%'),
            const SizedBox(height: 8),
            Text(message),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(context);
            },
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }
}
