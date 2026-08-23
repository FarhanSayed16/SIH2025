/// Phase 3: Teacher Drill Dashboard
/// Shows active drills, scheduled drills, and drill history

import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../drills/services/drill_service.dart';
import '../../drills/models/drill_model.dart';
import 'drill_participation_tracking_screen.dart';

/// Teacher Drill Dashboard Screen
class DrillDashboardScreen extends ConsumerStatefulWidget {
  const DrillDashboardScreen({super.key});

  @override
  ConsumerState<DrillDashboardScreen> createState() =>
      _DrillDashboardScreenState();
}

class _DrillDashboardScreenState extends ConsumerState<DrillDashboardScreen>
    with SingleTickerProviderStateMixin {
  final DrillService _drillService = DrillService();
  late TabController _tabController;
  Timer? _refreshTimer;

  List<DrillModel> _activeDrills = [];
  List<DrillModel> _scheduledDrills = [];
  List<DrillModel> _completedDrills = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadDrills();
    // Auto-refresh every 30 seconds
    _refreshTimer = Timer.periodic(const Duration(seconds: 30), (_) {
      if (mounted) {
        _loadDrills();
      }
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    _refreshTimer?.cancel();
    super.dispose();
  }

  Future<void> _loadDrills() async {
    try {
      setState(() {
        _error = null;
        _isLoading = true;
      });

      // Load all drills
      final allDrills = await _drillService.getDrills();

      if (mounted) {
        setState(() {
          _activeDrills = allDrills.where((d) => d.isInProgress).toList();
          _scheduledDrills = allDrills.where((d) => d.isScheduled).toList();
          _completedDrills = allDrills.where((d) => d.isCompleted).toList();
          _isLoading = false;
        });
      }
    } catch (e) {
      print('Error loading drills: $e');
      if (mounted) {
        setState(() {
          _error = e.toString();
          _isLoading = false;
        });
      }
    }
  }

  String _formatDrillType(String type) {
    switch (type.toLowerCase()) {
      case 'fire':
        return 'Fire Drill';
      case 'earthquake':
        return 'Earthquake Drill';
      case 'flood':
        return 'Flood Drill';
      case 'cyclone':
        return 'Cyclone Drill';
      case 'stampede':
        return 'Stampede Drill';
      case 'heatwave':
        return 'Heatwave Drill';
      default:
        return 'Safety Drill';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Drill Dashboard'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Active', icon: Icon(Icons.play_circle)),
            Tab(text: 'Scheduled', icon: Icon(Icons.schedule)),
            Tab(text: 'History', icon: Icon(Icons.history)),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadDrills,
            tooltip: 'Refresh',
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
                          size: 64, color: Colors.red),
                      const SizedBox(height: 16),
                      Text('Error: $_error'),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: _loadDrills,
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadDrills,
                  child: TabBarView(
                    controller: _tabController,
                    children: [
                      _buildActiveDrillsTab(),
                      _buildScheduledDrillsTab(),
                      _buildCompletedDrillsTab(),
                    ],
                  ),
                ),
    );
  }

  Widget _buildActiveDrillsTab() {
    if (_activeDrills.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.play_circle_outline, size: 80, color: Colors.grey),
            const SizedBox(height: 16),
            const Text(
              'No Active Drills',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            const Text(
              'Active drills will appear here',
              style: TextStyle(color: Colors.grey),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _activeDrills.length,
      itemBuilder: (context, index) {
        final drill = _activeDrills[index];
        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          child: ListTile(
            leading: CircleAvatar(
              backgroundColor: Colors.orange,
              child: const Icon(Icons.play_arrow, color: Colors.white),
            ),
            title: Text(_formatDrillType(drill.type)),
            subtitle: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                    'Started: ${_formatDateTime(drill.actualStart ?? drill.scheduledAt)}'),
                if (drill.remainingTime != null)
                  Text(
                      'Time Remaining: ${_formatDuration(drill.remainingTime!)}'),
                Text('Status: ${drill.status}'),
              ],
            ),
            trailing: const Icon(Icons.arrow_forward_ios, size: 16),
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute<dynamic>(
                  builder: (context) => DrillParticipationTrackingScreen(
                    drillId: drill.id,
                    drillType: drill.type,
                  ),
                ),
              );
            },
          ),
        );
      },
    );
  }

  Widget _buildScheduledDrillsTab() {
    if (_scheduledDrills.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.schedule, size: 80, color: Colors.grey),
            const SizedBox(height: 16),
            const Text(
              'No Scheduled Drills',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            const Text(
              'Scheduled drills will appear here',
              style: TextStyle(color: Colors.grey),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _scheduledDrills.length,
      itemBuilder: (context, index) {
        final drill = _scheduledDrills[index];
        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          child: ListTile(
            leading: CircleAvatar(
              backgroundColor: Colors.blue,
              child: const Icon(Icons.schedule, color: Colors.white),
            ),
            title: Text(_formatDrillType(drill.type)),
            subtitle: Text('Scheduled: ${_formatDateTime(drill.scheduledAt)}'),
            trailing: const Icon(Icons.arrow_forward_ios, size: 16),
            onTap: () {
              // Show drill details
              showDialog<void>(
                context: context,
                builder: (context) => AlertDialog(
                  title: Text(_formatDrillType(drill.type)),
                  content: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Scheduled: ${_formatDateTime(drill.scheduledAt)}'),
                      Text('Duration: ${drill.duration} minutes'),
                      Text('Status: ${drill.status}'),
                    ],
                  ),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.pop(context),
                      child: const Text('Close'),
                    ),
                  ],
                ),
              );
            },
          ),
        );
      },
    );
  }

  Widget _buildCompletedDrillsTab() {
    if (_completedDrills.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.history, size: 80, color: Colors.grey),
            const SizedBox(height: 16),
            const Text(
              'No Drill History',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            const Text(
              'Completed drills will appear here',
              style: TextStyle(color: Colors.grey),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _completedDrills.length,
      itemBuilder: (context, index) {
        final drill = _completedDrills[index];
        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          child: ListTile(
            leading: CircleAvatar(
              backgroundColor: Colors.green,
              child: const Icon(Icons.check_circle, color: Colors.white),
            ),
            title: Text(_formatDrillType(drill.type)),
            subtitle: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (drill.completedAt != null)
                  Text('Completed: ${_formatDateTime(drill.completedAt!)}'),
                Text('Participation Rate: ${drill.results.participationRate}%'),
              ],
            ),
            trailing: const Icon(Icons.arrow_forward_ios, size: 16),
            onTap: () {
              // Show drill summary
              showDialog<void>(
                context: context,
                builder: (context) => AlertDialog(
                  title: Text(_formatDrillType(drill.type)),
                  content: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                          'Completed: ${_formatDateTime(drill.completedAt ?? DateTime.now())}'),
                      Text(
                          'Total Participants: ${drill.results.totalParticipants}'),
                      Text('Completed: ${drill.results.completedParticipants}'),
                      Text(
                          'Participation Rate: ${drill.results.participationRate}%'),
                      if (drill.results.avgEvacuationTime != null)
                        Text(
                            'Avg Evacuation Time: ${drill.results.avgEvacuationTime}s'),
                    ],
                  ),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.pop(context),
                      child: const Text('Close'),
                    ),
                  ],
                ),
              );
            },
          ),
        );
      },
    );
  }

  String _formatDateTime(DateTime dateTime) {
    return '${dateTime.day}/${dateTime.month}/${dateTime.year} ${dateTime.hour.toString().padLeft(2, '0')}:${dateTime.minute.toString().padLeft(2, '0')}';
  }

  String _formatDuration(Duration duration) {
    final minutes = duration.inMinutes;
    final seconds = duration.inSeconds % 60;
    return '${minutes}m ${seconds}s';
  }
}
