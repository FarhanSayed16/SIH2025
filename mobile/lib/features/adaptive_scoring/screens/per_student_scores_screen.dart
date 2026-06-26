/// Phase 3.3.2: Per-Student Scores Screen
/// Shows individual student scores for a class

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/constants/app_constants.dart';
import '../providers/adaptive_scoring_provider.dart';
import '../models/adaptive_scoring_models.dart';

class PerStudentScoresScreen extends ConsumerStatefulWidget {
  final String classId;
  final String? className;

  const PerStudentScoresScreen({
    super.key,
    required this.classId,
    this.className,
  });

  @override
  ConsumerState<PerStudentScoresScreen> createState() =>
      _PerStudentScoresScreenState();
}

class _PerStudentScoresScreenState
    extends ConsumerState<PerStudentScoresScreen> {
  String? _selectedGameType;
  DateTime? _startDate;
  DateTime? _endDate;

  @override
  void initState() {
    super.initState();
    // Load scores on init
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref
          .read(perStudentScoresProvider(widget.classId).notifier)
          .loadScores(classId: widget.classId);
    });
  }

  @override
  Widget build(BuildContext context) {
    final scoresState = ref.watch(perStudentScoresProvider(widget.classId));

    return Scaffold(
      appBar: AppBar(
        title: Text(widget.className ?? 'Student Scores'),
        actions: [
          IconButton(
            icon: const Icon(Icons.filter_list),
            onPressed: _showFilterDialog,
            tooltip: 'Filter',
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              ref
                  .read(perStudentScoresProvider(widget.classId).notifier)
                  .loadScores(
                    classId: widget.classId,
                    gameType: _selectedGameType,
                    startDate: _startDate,
                    endDate: _endDate,
                    forceRefresh: true,
                  );
            },
            tooltip: 'Refresh',
          ),
        ],
      ),
      body: scoresState.isLoading
          ? const Center(child: CircularProgressIndicator())
          : scoresState.error != null
              ? _buildErrorWidget(scoresState.error!)
              : scoresState.scores.isEmpty
                  ? _buildEmptyWidget()
                  : _buildScoresList(scoresState.scores),
    );
  }

  Widget _buildErrorWidget(String error) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.error_outline, size: 64, color: Colors.red[300]),
          const SizedBox(height: 16),
          Text(
            error,
            style: TextStyle(color: Colors.red[700]),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: () {
              ref
                  .read(perStudentScoresProvider(widget.classId).notifier)
                  .loadScores(
                    classId: widget.classId,
                    gameType: _selectedGameType,
                    startDate: _startDate,
                    endDate: _endDate,
                    forceRefresh: true,
                  );
            },
            child: const Text('Retry'),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyWidget() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.person_outline, size: 64, color: Colors.grey[400]),
          const SizedBox(height: 16),
          Text(
            'No student scores found',
            style: TextStyle(color: Colors.grey[600]),
          ),
        ],
      ),
    );
  }

  Widget _buildScoresList(List<StudentScore> scores) {
    return RefreshIndicator(
      onRefresh: () async {
        await ref
            .read(perStudentScoresProvider(widget.classId).notifier)
            .loadScores(
              classId: widget.classId,
              gameType: _selectedGameType,
              startDate: _startDate,
              endDate: _endDate,
              forceRefresh: true,
            );
      },
      child: ListView.builder(
        padding: const EdgeInsets.all(AppConstants.defaultPadding),
        itemCount: scores.length,
        itemBuilder: (context, index) {
          final studentScore = scores[index];
          return _StudentScoreCard(studentScore: studentScore);
        },
      ),
    );
  }

  void _showFilterDialog() {
    showDialog<void>(
      context: context,
      builder: (context) => _FilterDialog(
        selectedGameType: _selectedGameType,
        startDate: _startDate,
        endDate: _endDate,
        onApply: (gameType, startDate, endDate) {
          setState(() {
            _selectedGameType = gameType;
            _startDate = startDate;
            _endDate = endDate;
          });
          ref
              .read(perStudentScoresProvider(widget.classId).notifier)
              .loadScores(
                classId: widget.classId,
                gameType: _selectedGameType,
                startDate: _startDate,
                endDate: _endDate,
                forceRefresh: true,
              );
          Navigator.pop(context);
        },
        onClear: () {
          setState(() {
            _selectedGameType = null;
            _startDate = null;
            _endDate = null;
          });
          ref
              .read(perStudentScoresProvider(widget.classId).notifier)
              .loadScores(
                classId: widget.classId,
                forceRefresh: true,
              );
          Navigator.pop(context);
        },
      ),
    );
  }
}

class _StudentScoreCard extends StatelessWidget {
  final StudentScore studentScore;

  const _StudentScoreCard({required this.studentScore});

  @override
  Widget build(BuildContext context) {
    final stats = studentScore.stats;

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CircleAvatar(
                  child: Text(
                    studentScore.name.isNotEmpty
                        ? studentScore.name[0].toUpperCase()
                        : '?',
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        studentScore.name,
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                      ),
                      if (studentScore.grade != null)
                        Text(
                          'Grade ${studentScore.grade}',
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                color: Colors.grey[600],
                              ),
                        ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: _StatItem(
                    icon: Icons.games,
                    label: 'Games',
                    value: '${stats.totalGames}',
                    color: Colors.blue,
                  ),
                ),
                Expanded(
                  child: _StatItem(
                    icon: Icons.stars,
                    label: 'XP',
                    value: '${stats.totalGameXP}',
                    color: Colors.orange,
                  ),
                ),
                Expanded(
                  child: _StatItem(
                    icon: Icons.quiz,
                    label: 'Quizzes',
                    value: '${stats.totalQuizzes}',
                    color: Colors.purple,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            if (stats.averageQuizScore > 0)
              Row(
                children: [
                  Icon(Icons.trending_up, size: 16, color: Colors.green[700]),
                  const SizedBox(width: 4),
                  Text(
                    'Avg Quiz Score: ${stats.averageQuizScore}%',
                    style: TextStyle(
                      color: Colors.green[700],
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
          ],
        ),
      ),
    );
  }
}

class _StatItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color color;

  const _StatItem({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Icon(icon, color: color, size: 24),
        const SizedBox(height: 4),
        Text(
          value,
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: color,
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
}

class _FilterDialog extends StatefulWidget {
  final String? selectedGameType;
  final DateTime? startDate;
  final DateTime? endDate;
  final void Function(String?, DateTime?, DateTime?) onApply;
  final VoidCallback onClear;

  const _FilterDialog({
    required this.selectedGameType,
    required this.startDate,
    required this.endDate,
    required this.onApply,
    required this.onClear,
  });

  @override
  State<_FilterDialog> createState() => _FilterDialogState();
}

class _FilterDialogState extends State<_FilterDialog> {
  late String? _selectedGameType;
  late DateTime? _startDate;
  late DateTime? _endDate;

  @override
  void initState() {
    super.initState();
    _selectedGameType = widget.selectedGameType;
    _startDate = widget.startDate;
    _endDate = widget.endDate;
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Filter Scores'),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            DropdownButtonFormField<String>(
              value: _selectedGameType,
              decoration: const InputDecoration(
                labelText: 'Game Type',
                border: OutlineInputBorder(),
              ),
              items: [
                const DropdownMenuItem(value: null, child: Text('All Games')),
                const DropdownMenuItem(
                  value: 'bag-packer',
                  child: Text('Bag Packer'),
                ),
                const DropdownMenuItem(
                  value: 'hazard-hunter',
                  child: Text('Hazard Hunter'),
                ),
                const DropdownMenuItem(
                  value: 'earthquake-shake',
                  child: Text('Earthquake Shake'),
                ),
              ],
              onChanged: (value) {
                setState(() {
                  _selectedGameType = value;
                });
              },
            ),
            const SizedBox(height: 16),
            ListTile(
              title: Text(_startDate == null
                  ? 'Start Date (Optional)'
                  : 'Start: ${_formatDate(_startDate!)}'),
              trailing: const Icon(Icons.calendar_today),
              onTap: () async {
                final date = await showDatePicker(
                  context: context,
                  initialDate: _startDate ?? DateTime.now(),
                  firstDate: DateTime(2020),
                  lastDate: DateTime.now(),
                );
                if (date != null) {
                  setState(() {
                    _startDate = date;
                  });
                }
              },
            ),
            ListTile(
              title: Text(_endDate == null
                  ? 'End Date (Optional)'
                  : 'End: ${_formatDate(_endDate!)}'),
              trailing: const Icon(Icons.calendar_today),
              onTap: () async {
                final date = await showDatePicker(
                  context: context,
                  initialDate: _endDate ?? DateTime.now(),
                  firstDate: _startDate ?? DateTime(2020),
                  lastDate: DateTime.now(),
                );
                if (date != null) {
                  setState(() {
                    _endDate = date;
                  });
                }
              },
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: widget.onClear,
          child: const Text('Clear'),
        ),
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Cancel'),
        ),
        ElevatedButton(
          onPressed: () {
            widget.onApply(_selectedGameType, _startDate, _endDate);
          },
          child: const Text('Apply'),
        ),
      ],
    );
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }
}

