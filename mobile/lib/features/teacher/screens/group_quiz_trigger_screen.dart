/// Phase 3.4.5: Group Quiz Trigger Screen
/// Allows teachers to trigger group quizzes for their class

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/teacher_service.dart';
import '../../../core/services/api_service.dart';

class GroupQuizTriggerScreen extends ConsumerStatefulWidget {
  final String classId;

  const GroupQuizTriggerScreen({
    super.key,
    required this.classId,
  });

  @override
  ConsumerState<GroupQuizTriggerScreen> createState() =>
      _GroupQuizTriggerScreenState();
}

class _GroupQuizTriggerScreenState
    extends ConsumerState<GroupQuizTriggerScreen> {
  final TeacherService _teacherService = TeacherService();
  final ApiService _apiService = ApiService();

  String? _selectedModuleId;
  List<Map<String, dynamic>> _modules = [];
  bool _isLoadingModules = false;
  bool _isTriggering = false;

  @override
  void initState() {
    super.initState();
    _loadModules();
  }

  Future<void> _loadModules() async {
    setState(() => _isLoadingModules = true);

    try {
      final response = await _apiService.get('/modules');
      final data = response.data as Map<String, dynamic>;
      final modulesList = (data['data'] as Map<String, dynamic>?)?['modules'] as List? ?? [];
      
      // Filter modules that have quizzes
      final modulesWithQuizzes = modulesList.where((module) {
        final quiz = module['quiz'] as Map<String, dynamic>?;
        final questions = quiz?['questions'] as List?;
        return questions != null && questions.isNotEmpty;
      }).toList();

      setState(() {
        _modules = List<Map<String, dynamic>>.from(modulesWithQuizzes);
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error loading modules: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoadingModules = false);
      }
    }
  }

  Future<void> _triggerQuiz() async {
    if (_selectedModuleId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select a module/quiz'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    setState(() => _isTriggering = true);

    try {
      final result = await _teacherService.triggerGroupQuiz(
        widget.classId,
        _selectedModuleId!,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Group quiz triggered! Students have been notified.'),
            backgroundColor: Colors.green,
          ),
        );
        Navigator.pop(context, true);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isTriggering = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Trigger Group Quiz'),
        elevation: 0,
      ),
      body: Column(
        children: [
          // Instructions
          Container(
            padding: const EdgeInsets.all(16),
            color: Theme.of(context).colorScheme.primaryContainer,
            child: Row(
              children: [
                Icon(
                  Icons.info_outline,
                  color: Theme.of(context).colorScheme.primary,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'Select a module quiz to trigger for all students in this class. They will receive a push notification.',
                    style: TextStyle(
                      color: Theme.of(context).colorScheme.onPrimaryContainer,
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Module selection
          if (_isLoadingModules)
            const Expanded(
              child: Center(child: CircularProgressIndicator()),
            )
          else if (_modules.isEmpty)
            Expanded(
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.quiz_outlined, size: 80, color: Colors.grey),
                    const SizedBox(height: 16),
                    const Text(
                      'No Modules with Quizzes',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Create modules with quizzes first',
                      style: TextStyle(color: Colors.grey),
                    ),
                    const SizedBox(height: 16),
                    ElevatedButton.icon(
                      onPressed: _loadModules,
                      icon: const Icon(Icons.refresh),
                      label: const Text('Retry'),
                    ),
                  ],
                ),
              ),
            )
          else
            Expanded(
              child: ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: _modules.length,
                itemBuilder: (context, index) {
                  final module = _modules[index];
                  final moduleId = module['_id'] as String? ?? module['id'] as String? ?? '';
                  final title = module['title'] as String? ?? 'Unknown Module';
                  final description = module['description'] as String? ?? '';
                  final quiz = module['quiz'] as Map<String, dynamic>?;
                  final questionCount = (quiz?['questions'] as List?)?.length ?? 0;
                  final isSelected = _selectedModuleId == moduleId;

                  return Card(
                    margin: const EdgeInsets.only(bottom: 12),
                    color: isSelected
                        ? Theme.of(context).colorScheme.primaryContainer
                        : null,
                    child: RadioListTile<String>(
                      value: moduleId,
                      groupValue: _selectedModuleId,
                      onChanged: (value) {
                        setState(() {
                          _selectedModuleId = value;
                        });
                      },
                      title: Text(
                        title,
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                      subtitle: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          if (description.isNotEmpty) ...[
                            Text(description),
                            const SizedBox(height: 4),
                          ],
                          Row(
                            children: [
                              const Icon(Icons.quiz, size: 16),
                              const SizedBox(width: 4),
                              Text('$questionCount questions'),
                            ],
                          ),
                        ],
                      ),
                      secondary: isSelected
                          ? Icon(
                              Icons.check_circle,
                              color: Theme.of(context).colorScheme.primary,
                            )
                          : null,
                    ),
                  );
                },
              ),
            ),
        ],
      ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Theme.of(context).scaffoldBackgroundColor,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.1),
              blurRadius: 4,
              offset: const Offset(0, -2),
            ),
          ],
        ),
        child: SizedBox(
          width: double.infinity,
          child: ElevatedButton.icon(
            onPressed: (_selectedModuleId != null && !_isTriggering)
                ? _triggerQuiz
                : null,
            icon: _isTriggering
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.send),
            label: Text(_isTriggering ? 'Triggering...' : 'Trigger Quiz'),
            style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 16),
            ),
          ),
        ),
      ),
    );
  }
}

