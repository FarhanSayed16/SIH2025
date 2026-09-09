import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../core/design/design_system.dart';

class QuizScreen extends StatefulWidget {
  final String quizPath;
  final String moduleTitle;
  final void Function(bool passed) onQuizFinished;

  const QuizScreen({
    Key? key,
    required this.quizPath,
    required this.moduleTitle,
    required this.onQuizFinished,
  }) : super(key: key);

  @override
  State<QuizScreen> createState() => _QuizScreenState();
}

class _QuizScreenState extends State<QuizScreen> {
  List<dynamic> questions = [];
  Map<int, int> userAnswers = {}; // QuestionIndex -> SelectedOptionIndex
  bool isLoading = true;
  bool isSubmitted = false;
  String? error;

  @override
  void initState() {
    super.initState();
    loadQuiz();
  }

  Future<void> loadQuiz() async {
    try {
      debugPrint('Attempting to load quiz: ${widget.quizPath}');

      final String response = await rootBundle.loadString(widget.quizPath);
      final dynamic data = json.decode(response);

      if (mounted) {
        setState(() {
          // FIX: Your JSON is a List [], not a Map with "questions" key
          if (data is List) {
            questions = data;
          } else if (data is Map && data.containsKey('questions')) {
            final questionsData = data['questions'];
            questions = (questionsData is List)
                ? questionsData
                : <dynamic>[];
          } else {
            error = 'Invalid JSON format.';
            questions = <dynamic>[];
          }
          isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('Error loading quiz: $e');
      if (mounted) {
        setState(() {
          error =
              'Could not load quiz.\nEnsure ${widget.quizPath} contains valid JSON.';
          isLoading = false;
        });
      }
    }
  }

  void calculateScore() {
    int score = 0;
    for (int i = 0; i < questions.length; i++) {
      if (userAnswers.containsKey(i)) {
        int selectedIndex = userAnswers[i]!;
        final question = questions[i] as Map<String, dynamic>;
        final options = question['options'] as List<dynamic>;
        String selectedOption = (options[selectedIndex] is String)
            ? options[selectedIndex] as String
            : options[selectedIndex].toString();
        String correctAnswer = (question['answer'] is String)
            ? question['answer'] as String
            : question['answer'].toString();

        // FIX: Compare the option text with the answer text
        if (selectedOption == correctAnswer) {
          score++;
        }
      }
    }

    // Pass if score >= 50%
    bool passed = questions.isEmpty ? false : score >= (questions.length / 2);

    setState(() {
      isSubmitted = true;
    });

    showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        title: Text(passed ? 'Congratulations!' : 'Keep Learning'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              passed ? Icons.emoji_events : Icons.sentiment_dissatisfied,
              size: 50,
              color: passed ? Colors.amber : Colors.grey,
            ),
            const SizedBox(height: 10),
            Text(
              'You scored $score out of ${questions.length}.\n' +
                  (passed
                      ? 'You have earned the badge!'
                      : 'Review the explanations to improve.'),
              textAlign: TextAlign.center,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(ctx); // Close dialog
              Navigator.pop(context); // Close quiz screen
              if (passed) {
                widget.onQuizFinished(true);
              }
            },
            child: const Text('Finish'),
          )
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    if (error != null) {
      return Scaffold(
          appBar: AppBar(title: const Text('Error')),
          body: Center(
              child: Padding(
            padding: const EdgeInsets.all(20.0),
            child: Text(error!, textAlign: TextAlign.center),
          )));
    }

    return Scaffold(
      backgroundColor: Colors.grey[100],
      appBar: AppBar(title: Text('Quiz: ${widget.moduleTitle}')),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: questions.length,
              itemBuilder: (context, index) {
                final q = questions[index];

                // Helper to check if specific option is correct
                final questionMap = q as Map<String, dynamic>;
                final optionsList = (questionMap['options'] is List)
                    ? questionMap['options'] as List<dynamic>
                    : <dynamic>[];
                final answer = questionMap['answer'];

                bool isOptionCorrect(int optIndex) {
                  if (optIndex >= optionsList.length) return false;
                  final option = optionsList[optIndex];
                  return option.toString() == answer.toString();
                }

                return Card(
                  margin: const EdgeInsets.only(bottom: 16),
                  elevation: 2,
                  shape: RoundedRectangleBorder(
                      borderRadius: AppBorders.borderRadiusMd),
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          "${index + 1}. ${questionMap['question']}",
                          style: const TextStyle(
                              fontWeight: FontWeight.bold, fontSize: 16),
                        ),
                        const SizedBox(height: 10),
                        ...List.generate(optionsList.length, (optIndex) {
                          Color? tileColor;
                          Color? borderColor;

                          if (isSubmitted) {
                            if (isOptionCorrect(optIndex)) {
                              // Always show correct answer in green
                              tileColor = Colors.green.shade50;
                              borderColor = Colors.green;
                            } else if (userAnswers[index] == optIndex) {
                              // Show wrong selection in red
                              tileColor = Colors.red.shade50;
                              borderColor = Colors.red;
                            }
                          } else if (userAnswers[index] == optIndex) {
                            // Highlight selection before submit
                            tileColor = Colors.blue.shade50;
                            borderColor = Colors.blue;
                          }

                          return Container(
                            margin: const EdgeInsets.only(bottom: 8),
                            decoration: BoxDecoration(
                              color: tileColor ?? Colors.white,
                              borderRadius: AppBorders.borderRadiusSm,
                              border: Border.all(
                                  color: borderColor ?? Colors.grey.shade300),
                            ),
                            child: RadioListTile<int>(
                              title: Text(
                                (optionsList[optIndex] is String)
                                    ? optionsList[optIndex] as String
                                    : optionsList[optIndex].toString(),
                                style: const TextStyle(fontSize: 14),
                              ),
                              value: optIndex,
                              groupValue: userAnswers[index],
                              activeColor: isSubmitted
                                  ? (isOptionCorrect(optIndex)
                                      ? Colors.green
                                      : Colors.red)
                                  : Colors.blue,
                              onChanged: isSubmitted
                                  ? null
                                  : (val) {
                                      setState(() {
                                        userAnswers[index] = val!;
                                      });
                                    },
                            ),
                          );
                        }),

                        // Show Explanation if submitted
                        if (isSubmitted && q.containsKey('explanation'))
                          Container(
                            margin: const EdgeInsets.only(top: 10),
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                                color: Colors.amber.shade50,
                                borderRadius: AppBorders.borderRadiusSm,
                                border:
                                    Border.all(color: Colors.amber.shade200)),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Icon(Icons.lightbulb,
                                    color: Colors.amber, size: 20),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    "Explanation: ${q['explanation']}",
                                    style: TextStyle(
                                        color: Colors.brown.shade700,
                                        fontSize: 13),
                                  ),
                                ),
                              ],
                            ),
                          )
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
          Container(
            padding: const EdgeInsets.all(16),
            width: double.infinity,
            decoration: BoxDecoration(color: Colors.white, boxShadow: [
              BoxShadow(
                  color: Colors.black12, blurRadius: 4, offset: Offset(0, -2))
            ]),
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
                backgroundColor: Colors.blueAccent,
                shape: RoundedRectangleBorder(
                    borderRadius: AppBorders.borderRadiusSm),
              ),
              onPressed: isSubmitted || userAnswers.length != questions.length
                  ? null
                  : calculateScore,
              child: Text(
                userAnswers.length != questions.length
                    ? 'Answer All Questions (${userAnswers.length}/${questions.length})'
                    : 'Submit Quiz',
                style: const TextStyle(
                    color: Colors.white, fontWeight: FontWeight.bold),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
