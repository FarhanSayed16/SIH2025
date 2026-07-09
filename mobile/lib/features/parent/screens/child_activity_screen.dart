/// Child Activity Screen
/// Phase 6: Parent-Teacher-Student Linkage
/// Real-time activity timeline for a child

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/widgets/widgets.dart';
import '../services/parent_service.dart';
import '../../../core/services/api_service.dart';
import 'package:intl/intl.dart';

class ChildActivityScreen extends ConsumerStatefulWidget {
  final String studentId;
  final String childName;

  const ChildActivityScreen({
    super.key,
    required this.studentId,
    required this.childName,
  });

  @override
  ConsumerState<ChildActivityScreen> createState() =>
      _ChildActivityScreenState();
}

class _ChildActivityScreenState extends ConsumerState<ChildActivityScreen> {
  final ParentService _parentService = ParentService(ApiService());
  List<Map<String, dynamic>> _activities = [];
  bool _isLoading = true;
  String? _error;
  String? _selectedFilter;
  int _currentPage = 1;
  bool _hasMore = true;

  @override
  void initState() {
    super.initState();
    _loadActivities();
    // Auto-refresh every 30 seconds
    Future.delayed(const Duration(seconds: 30), () {
      if (mounted) {
        _refreshActivities();
      }
    });
  }

  Future<void> _loadActivities({bool refresh = false}) async {
    if (refresh) {
      setState(() {
        _currentPage = 1;
        _activities = [];
        _hasMore = true;
      });
    }

    if (!_hasMore && !refresh) return;

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final result = await _parentService.getChildActivity(
        widget.studentId,
        page: _currentPage,
        limit: 20,
        activityType: _selectedFilter,
      );

      if (result['activities'] != null) {
        final newActivities = (result['activities'] as List<dynamic>)
            .map((e) => e as Map<String, dynamic>)
            .toList();

        setState(() {
          if (refresh) {
            _activities = newActivities;
          } else {
            _activities.addAll(newActivities);
          }
          _hasMore = newActivities.length == 20;
          _currentPage++;
          _isLoading = false;
        });
      } else {
        setState(() {
          _hasMore = false;
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  Future<void> _refreshActivities() async {
    await _loadActivities(refresh: true);
  }

  IconData _getActivityIcon(String activityType) {
    switch (activityType) {
      case 'module_complete':
        return Icons.book;
      case 'quiz_complete':
        return Icons.quiz;
      case 'game_complete':
        return Icons.games;
      case 'badge_earned':
        return Icons.military_tech;
      case 'xp_milestone':
        return Icons.star;
      case 'progress_update':
        return Icons.trending_up;
      case 'safety_status_change':
        return Icons.warning;
      case 'drill_participation':
      case 'drill_complete':
        return Icons.flash_on;
      default:
        return Icons.timeline;
    }
  }

  Color _getActivityColor(String activityType) {
    switch (activityType) {
      case 'module_complete':
        return Colors.blue;
      case 'quiz_complete':
        return Colors.green;
      case 'game_complete':
        return Colors.purple;
      case 'badge_earned':
        return Colors.amber;
      case 'xp_milestone':
        return Colors.pink;
      case 'progress_update':
        return Colors.cyan;
      case 'safety_status_change':
        return Colors.red;
      case 'drill_participation':
      case 'drill_complete':
        return Colors.orange;
      default:
        return Colors.grey;
    }
  }

  String _formatActivityMessage(Map<String, dynamic> activity) {
    final activityType = activity['activityType'] as String? ?? '';
    final activityData = activity['activityData'] as Map<String, dynamic>? ?? {};

    switch (activityType) {
      case 'module_complete':
        return 'Completed module: ${activityData['moduleName'] ?? 'Module'}';
      case 'quiz_complete':
        final score = activityData['quizScore'] ?? 0;
        final total = activityData['quizTotalQuestions'] ?? 0;
        return 'Completed quiz: $score/$total';
      case 'game_complete':
        return 'Completed game: ${activityData['gameName'] ?? 'Game'}';
      case 'badge_earned':
        return 'Earned badge: ${activityData['badgeName'] ?? 'Badge'}';
      case 'xp_milestone':
        return 'Reached ${activityData['totalXP'] ?? 0} XP!';
      case 'progress_update':
        return 'Progress: ${activityData['preparednessScore'] ?? 0}%';
      case 'safety_status_change':
        return 'Safety status: ${activityData['safetyStatus'] ?? 'Unknown'}';
      case 'drill_participation':
        return 'Participated in ${activityData['drillType'] ?? 'drill'}';
      case 'drill_complete':
        return 'Completed drill';
      default:
        return 'Activity performed';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('${widget.childName}\'s Activities'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _refreshActivities,
          ),
        ],
      ),
      body: Column(
        children: [
          // Filter chips
          Container(
            padding: const EdgeInsets.symmetric(vertical: 8),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  _buildFilterChip('All', null),
                  const SizedBox(width: 8),
                  _buildFilterChip('Modules', 'module_complete'),
                  const SizedBox(width: 8),
                  _buildFilterChip('Quizzes', 'quiz_complete'),
                  const SizedBox(width: 8),
                  _buildFilterChip('Games', 'game_complete'),
                  const SizedBox(width: 8),
                  _buildFilterChip('Badges', 'badge_earned'),
                  const SizedBox(width: 8),
                  _buildFilterChip('Drills', 'drill_participation'),
                ],
              ),
            ),
          ),
          const Divider(),
          // Activities list
          Expanded(
            child: _isLoading && _activities.isEmpty
                ? const LoadingState()
                : _error != null && _activities.isEmpty
                    ? ErrorState(message: _error!)
                    : _activities.isEmpty
                        ? EmptyState(
                            message: 'No activities found',
                            icon: Icons.timeline,
                          )
                        : RefreshIndicator(
                            onRefresh: _refreshActivities,
                            child: ListView.builder(
                              itemCount: _activities.length + (_hasMore ? 1 : 0),
                              itemBuilder: (context, index) {
                                if (index == _activities.length) {
                                  // Load more
                                  _loadActivities();
                                  return const Center(
                                    child: Padding(
                                      padding: EdgeInsets.all(16.0),
                                      child: CircularProgressIndicator(),
                                    ),
                                  );
                                }

                                final activity = _activities[index];
                                final activityType =
                                    activity['activityType'] as String? ?? '';
                                final createdAt = activity['createdAt'] as String?;

                                return Card(
                                  margin: const EdgeInsets.symmetric(
                                    horizontal: 16,
                                    vertical: 8,
                                  ),
                                  child: ListTile(
                                    leading: CircleAvatar(
                                      backgroundColor:
                                          _getActivityColor(activityType)
                                              .withOpacity(0.2),
                                      child: Icon(
                                        _getActivityIcon(activityType),
                                        color: _getActivityColor(activityType),
                                      ),
                                    ),
                                    title: Text(
                                      _formatActivityMessage(activity),
                                      style: const TextStyle(
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                    subtitle: createdAt != null
                                        ? Text(
                                            DateFormat('MMM dd, yyyy • hh:mm a')
                                                .format(DateTime.parse(createdAt)),
                                          )
                                        : null,
                                    trailing: activity['priority'] == 'critical' ||
                                            activity['priority'] == 'high'
                                        ? Icon(
                                            Icons.priority_high,
                                            color: Colors.red,
                                          )
                                        : null,
                                  ),
                                );
                              },
                            ),
                          ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label, String? value) {
    final isSelected = _selectedFilter == value;
    return FilterChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (selected) {
        setState(() {
          _selectedFilter = selected ? value : null;
        });
        _loadActivities(refresh: true);
      },
    );
  }
}

