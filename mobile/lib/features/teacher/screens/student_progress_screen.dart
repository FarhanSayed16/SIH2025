/// Phase 3.4.5: Student Progress Screen
/// Shows detailed progress for all students in a class

import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/teacher_service.dart';

class StudentProgressScreen extends ConsumerStatefulWidget {
  final String classId;

  const StudentProgressScreen({
    super.key,
    required this.classId,
  });

  @override
  ConsumerState<StudentProgressScreen> createState() =>
      _StudentProgressScreenState();
}

class _StudentProgressScreenState extends ConsumerState<StudentProgressScreen> {
  final TeacherService _teacherService = TeacherService();
  Map<String, dynamic>? _progressData;
  bool _isLoading = true;
  String? _error;
  Timer? _refreshTimer;

  @override
  void initState() {
    super.initState();
    _loadProgress();
    // Set up periodic refresh every 30 seconds
    _refreshTimer = Timer.periodic(const Duration(seconds: 30), (_) {
      if (mounted) {
        _loadProgress();
      }
    });
  }

  @override
  void dispose() {
    _refreshTimer?.cancel();
    super.dispose();
  }

  Future<void> _loadProgress() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final progress = await _teacherService.getStudentProgress(widget.classId);
      setState(() {
        _progressData = progress;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Student Progress'),
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadProgress,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.error_outline,
                          size: 80, color: Colors.red),
                      const SizedBox(height: 16),
                      Text(
                        'Error loading progress',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: Colors.red[700],
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        _error!,
                        style: const TextStyle(color: Colors.grey),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 16),
                      ElevatedButton.icon(
                        onPressed: _loadProgress,
                        icon: const Icon(Icons.refresh),
                        label: const Text('Retry'),
                      ),
                    ],
                  ),
                )
              : _buildProgressContent(),
    );
  }

  Widget _buildProgressContent() {
    final students = _progressData?['students'] as List? ?? [];
    final totalStudents = _progressData?['totalStudents'] as int? ?? 0;

    if (students.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.people_outline, size: 80, color: Colors.grey),
            const SizedBox(height: 16),
            const Text(
              'No Progress Data',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Students will appear here once they start activities',
              style: TextStyle(color: Colors.grey),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadProgress,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Summary card
          Card(
            color: Theme.of(context).colorScheme.primaryContainer,
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _buildSummaryItem(
                      'Total Students', '$totalStudents', Icons.people),
                  _buildSummaryItem(
                    'Avg. Score',
                    '${_calculateAverageScore(students).toStringAsFixed(1)}%',
                    Icons.assessment,
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Students list
          ...students.map((studentData) {
            final student =
                studentData['student'] as Map<String, dynamic>? ?? {};
            final name = student['name'] as String? ?? 'Unknown';
            final modules =
                studentData['modules'] as Map<String, dynamic>? ?? {};
            final games = studentData['games'] as Map<String, dynamic>? ?? {};
            final preparednessScore =
                studentData['preparednessScore'] as int? ?? 0;
            final badges = studentData['badges'] as int? ?? 0;

            return Card(
              margin: const EdgeInsets.only(bottom: 12),
              child: ExpansionTile(
                leading: CircleAvatar(
                  backgroundColor: Theme.of(context).colorScheme.primary,
                  child: Text(
                    name.isNotEmpty ? name[0].toUpperCase() : '?',
                    style: const TextStyle(color: Colors.white),
                  ),
                ),
                title: Text(
                  name,
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
                subtitle: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Icon(Icons.star, size: 16, color: Colors.amber),
                        const SizedBox(width: 4),
                        Text('Score: $preparednessScore%'),
                      ],
                    ),
                  ],
                ),
                children: [
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Modules progress
                        _buildProgressSection(
                          'Modules',
                          Icons.menu_book,
                          'Completed: ${modules['completed'] ?? 0}',
                          'Average Score: ${modules['averageScore'] ?? 0}%',
                        ),
                        const SizedBox(height: 12),

                        // Games progress
                        _buildProgressSection(
                          'Games',
                          Icons.games,
                          'Played: ${games['played'] ?? 0}',
                          'Total XP: ${games['totalXP'] ?? 0}',
                        ),
                        const SizedBox(height: 12),

                        // Badges
                        Row(
                          children: [
                            Icon(Icons.emoji_events,
                                size: 20, color: Colors.amber),
                            const SizedBox(width: 8),
                            Text(
                              'Badges Earned: $badges',
                              style:
                                  const TextStyle(fontWeight: FontWeight.w500),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }

  Widget _buildSummaryItem(String label, String value, IconData icon) {
    return Column(
      children: [
        Icon(icon, size: 32, color: Theme.of(context).colorScheme.primary),
        const SizedBox(height: 8),
        Text(
          value,
          style: const TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
          ),
        ),
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: Colors.grey[600],
          ),
        ),
      ],
    );
  }

  Widget _buildProgressSection(
    String title,
    IconData icon,
    String line1,
    String line2,
  ) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surfaceVariant,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        children: [
          Icon(icon, color: Theme.of(context).colorScheme.primary),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 4),
                Text(line1, style: const TextStyle(fontSize: 12)),
                Text(line2, style: const TextStyle(fontSize: 12)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  double _calculateAverageScore(List<dynamic> students) {
    if (students.isEmpty) return 0.0;

    int totalScore = 0;
    int count = 0;

    for (var student in students) {
      final score = student['preparednessScore'] as int? ?? 0;
      if (score > 0) {
        totalScore += score;
        count++;
      }
    }

    return count > 0 ? totalScore / count : 0.0;
  }
}
