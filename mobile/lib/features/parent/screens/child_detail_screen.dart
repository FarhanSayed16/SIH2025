/// Child Detail Screen
/// Detailed view of a child's progress, drills, attendance, and safety
/// Parent Monitoring System - Phase 3

import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/widgets/widgets.dart';
import '../providers/parent_provider.dart';
import '../models/parent_models.dart';
import 'child_location_screen.dart';
import 'child_analytics_screen.dart';
import 'child_activity_screen.dart';
import 'qr_code_screen.dart';

class ChildDetailScreen extends ConsumerStatefulWidget {
  final String studentId;

  const ChildDetailScreen({
    super.key,
    required this.studentId,
  });

  @override
  ConsumerState<ChildDetailScreen> createState() => _ChildDetailScreenState();
}

class _ChildDetailScreenState extends ConsumerState<ChildDetailScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  late DateTime _attendanceStartDate;
  late DateTime _attendanceEndDate;
  late Map<String, String?> _attendanceParams;
  Timer? _progressRefreshTimer;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 8, vsync: this);
    // Calculate stable date range for attendance (last 30 days)
    _attendanceEndDate = DateTime.now();
    _attendanceStartDate =
        _attendanceEndDate.subtract(const Duration(days: 30));
    // Create stable params map once
    _attendanceParams = {
      'studentId': widget.studentId,
      'startDate': _attendanceStartDate.toIso8601String(),
      'endDate': _attendanceEndDate.toIso8601String(),
    };
    // Set up periodic refresh every 30 seconds for progress data
    _progressRefreshTimer = Timer.periodic(const Duration(seconds: 30), (_) {
      if (mounted) {
        // Invalidate child details provider to refresh progress data
        ref.invalidate(childDetailsProvider(widget.studentId));
      }
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    _progressRefreshTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final childDetailsAsync = ref.watch(childDetailsProvider(widget.studentId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Child Details'),
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          tabs: const [
            Tab(text: 'Overview', icon: Icon(Icons.person)),
            Tab(text: 'Analytics', icon: Icon(Icons.analytics)),
            Tab(text: 'Progress', icon: Icon(Icons.trending_up)),
            Tab(text: 'Activities', icon: Icon(Icons.timeline)),
            Tab(text: 'QR Code', icon: Icon(Icons.qr_code)),
            Tab(text: 'Drills', icon: Icon(Icons.flash_on)),
            Tab(text: 'Attendance', icon: Icon(Icons.calendar_today)),
            Tab(text: 'Safety', icon: Icon(Icons.shield)),
          ],
        ),
      ),
      body: childDetailsAsync.when(
        data: (childDetails) {
          return TabBarView(
            controller: _tabController,
            children: [
              _buildOverviewTab(childDetails),
              _buildAnalyticsTab(),
              _buildProgressTab(childDetails),
              _buildActivitiesTab(childDetails),
              _buildQRCodeTab(childDetails),
              _buildDrillsTab(),
              _buildAttendanceTab(),
              _buildSafetyTab(),
            ],
          );
        },
        loading: () => const LoadingState(),
        error: (error, stack) => ErrorState(
          message: error.toString(),
          onRetry: () {
            ref.invalidate(childDetailsProvider(widget.studentId));
          },
        ),
      ),
    );
  }

  Widget _buildOverviewTab(ChildProgress childDetails) {
    final student = childDetails.student;
    final progress = childDetails.progress;

    return RefreshIndicator(
      onRefresh: () async {
        ref.invalidate(childDetailsProvider(widget.studentId));
      },
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Key Metrics
          Row(
            children: [
              Expanded(
                child: StatCard(
                  label: 'Preparedness',
                  value: '${progress['preparednessScore'] ?? 0}',
                  icon: Icons.shield,
                  iconColor: Colors.blue,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: StatCard(
                  label: 'Modules',
                  value: '${childDetails.modules['completed'] ?? 0}',
                  icon: Icons.book,
                  iconColor: Colors.green,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: StatCard(
                  label: 'Quiz Avg',
                  value: '${childDetails.quiz['avgScore'] ?? 0}%',
                  icon: Icons.quiz,
                  iconColor: Colors.purple,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Student Info
          InfoCard(
            title: 'Student Information',
            content: Column(
              children: [
                ListTile(
                  leading: const Icon(Icons.person),
                  title: const Text('Name'),
                  subtitle: Text(student.name),
                ),
                if (student.email != null)
                  ListTile(
                    leading: const Icon(Icons.email),
                    title: const Text('Email'),
                    subtitle: Text(student.email!),
                  ),
                if (student.grade != null && student.section != null)
                  ListTile(
                    leading: const Icon(Icons.school),
                    title: const Text('Grade & Section'),
                    subtitle: Text(
                        'Grade ${student.grade} - Section ${student.section}'),
                  ),
                if (student.institutionName != null)
                  ListTile(
                    leading: const Icon(Icons.business),
                    title: const Text('Institution'),
                    subtitle: Text(student.institutionName!),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAnalyticsTab() {
    return ChildAnalyticsScreen(studentId: widget.studentId);
  }

  Widget _buildProgressTab(ChildProgress childDetails) {
    return RefreshIndicator(
      onRefresh: () async {
        ref.invalidate(childDetailsProvider(widget.studentId));
      },
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Quiz Performance
          InfoCard(
            title: 'Quiz Performance',
            content: Column(
              children: [
                ListTile(
                  title: const Text('Total Quizzes'),
                  trailing: Text('${childDetails.quiz['totalQuizzes'] ?? 0}'),
                ),
                ListTile(
                  title: const Text('Average Score'),
                  trailing: Text('${childDetails.quiz['avgScore'] ?? 0}%'),
                ),
                ListTile(
                  title: const Text('Pass Rate'),
                  trailing: Text('${childDetails.quiz['passRate'] ?? 0}%'),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Game Performance
          InfoCard(
            title: 'Game Performance',
            content: Column(
              children: [
                ListTile(
                  title: const Text('Total Games'),
                  trailing: Text('${childDetails.games['totalGames'] ?? 0}'),
                ),
                ListTile(
                  title: const Text('Total XP'),
                  trailing: Text('${childDetails.games['totalXP'] ?? 0}'),
                ),
                ListTile(
                  title: const Text('Average Score'),
                  trailing: Text('${childDetails.games['avgScore'] ?? 0}'),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDrillsTab() {
    final drillsAsync = ref.watch(childDrillsProvider(widget.studentId));

    return drillsAsync.when(
      data: (drills) {
        if (drills.isEmpty) {
          return const EmptyState(
            message: 'No drill participation records found.',
            title: 'No Drill History',
            icon: Icons.flash_on,
          );
        }

        return RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(childDrillsProvider(widget.studentId));
          },
          child: ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: drills.length,
            itemBuilder: (context, index) {
              final drill = drills[index];
              return Card(
                margin: const EdgeInsets.only(bottom: 12),
                child: ListTile(
                  leading: CircleAvatar(
                    backgroundColor: drill.status == 'completed'
                        ? Colors.green
                        : drill.status == 'in_progress'
                            ? Colors.yellow
                            : Colors.red,
                    child: const Icon(Icons.flash_on, color: Colors.white),
                  ),
                  title: Text('${drill.drillType} Drill'),
                  subtitle: Text(
                    'Started: ${drill.startTime.toLocal().toString().split('.')[0]}',
                  ),
                  trailing: Chip(
                    label: Text(drill.status),
                    backgroundColor: drill.status == 'completed'
                        ? Colors.green.shade100
                        : drill.status == 'in_progress'
                            ? Colors.yellow.shade100
                            : Colors.red.shade100,
                  ),
                ),
              );
            },
          ),
        );
      },
      loading: () => const LoadingState(),
      error: (error, stack) => ErrorState(
        message: error.toString(),
        onRetry: () {
          ref.invalidate(childDrillsProvider(widget.studentId));
        },
      ),
    );
  }

  Widget _buildAttendanceTab() {
    // Use stable params from state to prevent infinite loops
    final attendanceAsync = ref.watch(
      childAttendanceProvider(_attendanceParams),
    );

    return attendanceAsync.when(
      data: (attendance) {
        final stats = attendance.statistics;
        return RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(childAttendanceProvider(_attendanceParams));
          },
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              // Statistics
              Row(
                children: [
                  Expanded(
                    child: StatCard(
                      label: 'Present',
                      value: '${stats['present'] ?? 0}',
                      icon: Icons.check_circle,
                      iconColor: Colors.green,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: StatCard(
                      label: 'Absent',
                      value: '${stats['absent'] ?? 0}',
                      icon: Icons.cancel,
                      iconColor: Colors.red,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: StatCard(
                      label: 'Rate',
                      value: '${stats['attendanceRate'] ?? 0}%',
                      icon: Icons.percent,
                      iconColor: Colors.blue,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Records
              InfoCard(
                title: 'Recent Records',
                content: Column(
                  children: attendance.records.take(20).map((record) {
                    return ListTile(
                      leading: Icon(
                        record.status == 'present'
                            ? Icons.check_circle
                            : record.status == 'absent'
                                ? Icons.cancel
                                : Icons.schedule,
                        color: record.status == 'present'
                            ? Colors.green
                            : record.status == 'absent'
                                ? Colors.red
                                : Colors.orange,
                      ),
                      title:
                          Text(record.date.toLocal().toString().split(' ')[0]),
                      trailing: Chip(
                        label: Text(record.status),
                        backgroundColor: record.status == 'present'
                            ? Colors.green.shade100
                            : record.status == 'absent'
                                ? Colors.red.shade100
                                : Colors.orange.shade100,
                      ),
                    );
                  }).toList(),
                ),
              ),
            ],
          ),
        );
      },
      loading: () => const LoadingState(),
      error: (error, stack) => ErrorState(
        message: error.toString(),
        onRetry: () {
          ref.invalidate(childAttendanceProvider(_attendanceParams));
        },
      ),
    );
  }

  /// Phase 6: Build Activities Tab
  Widget _buildActivitiesTab(ChildProgress childDetails) {
    return ChildActivityScreen(
      studentId: widget.studentId,
      childName: childDetails.student.name,
    );
  }

  /// Phase 6: Build QR Code Tab
  Widget _buildQRCodeTab(ChildProgress childDetails) {
    return QRCodeScreen(
      studentId: widget.studentId,
      childName: childDetails.student.name,
    );
  }

  Widget _buildSafetyTab() {
    final locationAsync = ref.watch(childLocationProvider(widget.studentId));

    return locationAsync.when(
      data: (location) {
        return RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(childLocationProvider(widget.studentId));
          },
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              // Status Card
              Card(
                color: location.status == 'safe'
                    ? Colors.green.shade50
                    : location.status == 'in_drill'
                        ? Colors.yellow.shade50
                        : Colors.red.shade50,
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      Icon(
                        location.status == 'safe'
                            ? Icons.check_circle
                            : location.status == 'in_drill'
                                ? Icons.flash_on
                                : Icons.warning,
                        size: 48,
                        color: location.status == 'safe'
                            ? Colors.green
                            : location.status == 'in_drill'
                                ? Colors.yellow
                                : Colors.red,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Status: ${location.status.toUpperCase()}',
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // Location Info
              if (location.latitude != null && location.longitude != null)
                InfoCard(
                  title: 'Location',
                  content: Column(
                    children: [
                      ListTile(
                        leading: const Icon(Icons.location_on),
                        title: const Text('Coordinates'),
                        subtitle: Text(
                          '${location.latitude!.toStringAsFixed(6)}, ${location.longitude!.toStringAsFixed(6)}',
                        ),
                      ),
                      ListTile(
                        leading: const Icon(Icons.access_time),
                        title: const Text('Last Seen'),
                        subtitle: Text(
                          location.lastSeen.toLocal().toString().split('.')[0],
                        ),
                      ),
                      PrimaryButton(
                        label: 'View on Map',
                        icon: Icons.map,
                        onPressed: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute<dynamic>(
                              builder: (context) => ChildLocationScreen(
                                studentId: widget.studentId,
                                location: location,
                              ),
                            ),
                          );
                        },
                      ),
                    ],
                  ),
                ),

              // Active Drill Info
              if (location.activeDrill != null)
                Card(
                  color: Colors.yellow.shade50,
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Active Drill',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text('Type: ${location.activeDrill!['drillType']}'),
                        Text('Status: ${location.activeDrill!['status']}'),
                      ],
                    ),
                  ),
                ),
            ],
          ),
        );
      },
      loading: () => const LoadingState(),
      error: (error, stack) => ErrorState(
        message: error.toString(),
        onRetry: () {
          ref.invalidate(childLocationProvider(widget.studentId));
        },
      ),
    );
  }
}
