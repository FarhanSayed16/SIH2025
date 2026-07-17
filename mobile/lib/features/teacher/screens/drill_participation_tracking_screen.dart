/// Phase 3: Drill Participation Tracking Screen
/// Shows real-time participation status for an active drill

import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../drills/services/drill_service.dart';
import '../../drills/models/drill_model.dart';

/// Drill Participation Tracking Screen
class DrillParticipationTrackingScreen extends ConsumerStatefulWidget {
  final String drillId;
  final String drillType;
  final String? classId;

  const DrillParticipationTrackingScreen({
    super.key,
    required this.drillId,
    required this.drillType,
    this.classId,
  });

  @override
  ConsumerState<DrillParticipationTrackingScreen> createState() =>
      _DrillParticipationTrackingScreenState();
}

class _DrillParticipationTrackingScreenState
    extends ConsumerState<DrillParticipationTrackingScreen> {
  final DrillService _drillService = DrillService();
  Timer? _refreshTimer;
  Map<String, dynamic>? _participantsData;
  DrillModel? _drill;
  bool _isLoading = true;
  bool _isEndingDrill = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadParticipants();
    // Auto-refresh every 5 seconds
    _refreshTimer = Timer.periodic(const Duration(seconds: 5), (_) {
      if (mounted) {
        _loadParticipants();
      }
    });
  }

  @override
  void dispose() {
    _refreshTimer?.cancel();
    super.dispose();
  }

  Future<void> _loadParticipants() async {
    try {
      setState(() {
        _error = null;
      });

      // Load drill details
      final drill = await _drillService.getDrillById(widget.drillId);
      if (drill != null) {
        setState(() {
          _drill = drill;
        });
      }

      // Load participants
      final participantsData =
          await _drillService.getDrillParticipants(widget.drillId);
      if (mounted) {
        setState(() {
          _participantsData = participantsData;
          _isLoading = false;
        });
      }
    } catch (e) {
      print('Error loading participants: $e');
      if (mounted) {
        setState(() {
          _error = e.toString();
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _endDrill() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('End Drill'),
        content: const Text('Are you sure you want to end this drill?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('End Drill'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    setState(() {
      _isEndingDrill = true;
    });

    try {
      final success = await _drillService.endDrill(widget.drillId);
      if (mounted) {
        if (success) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Drill ended successfully'),
              backgroundColor: Colors.green,
            ),
          );
          // Reload to get final summary
          await _loadParticipants();
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Failed to end drill'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error ending drill: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isEndingDrill = false;
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
        title: Text(_formatDrillType(widget.drillType)),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadParticipants,
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
                        onPressed: _loadParticipants,
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadParticipants,
                  child: _participantsData == null
                      ? const Center(child: Text('No participants data'))
                      : ListView(
                          padding: const EdgeInsets.all(16),
                          children: [
                            // Summary Card
                            _buildSummaryCard(),
                            const SizedBox(height: 16),
                            // Participants List
                            _buildParticipantsList(),
                          ],
                        ),
                ),
      floatingActionButton: _drill?.isInProgress == true
          ? FloatingActionButton.extended(
              onPressed: _isEndingDrill ? null : _endDrill,
              icon: _isEndingDrill
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                      ),
                    )
                  : const Icon(Icons.stop),
              label: Text(_isEndingDrill ? 'Ending...' : 'End Drill'),
              backgroundColor: Colors.red,
            )
          : null,
    );
  }

  Widget _buildSummaryCard() {
    final summary = _participantsData?['summary'] as Map<String, dynamic>?;
    if (summary == null) {
      return const Card(
        child: Padding(
          padding: EdgeInsets.all(16),
          child: Text('No summary available'),
        ),
      );
    }

    final total = summary['total'] as int? ?? 0;
    final acknowledged = summary['acknowledged'] as int? ?? 0;
    final notAcknowledged = summary['notAcknowledged'] as int? ?? 0;
    final participationRate = summary['participationRate'] as int? ?? 0;

    return Card(
      color: Theme.of(context).colorScheme.primaryContainer,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Participation Summary',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: _buildStatItem(
                    'Total',
                    total.toString(),
                    Colors.blue,
                  ),
                ),
                Expanded(
                  child: _buildStatItem(
                    'Acknowledged',
                    acknowledged.toString(),
                    Colors.green,
                  ),
                ),
                Expanded(
                  child: _buildStatItem(
                    'Not Acknowledged',
                    notAcknowledged.toString(),
                    Colors.red,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            LinearProgressIndicator(
              value: participationRate / 100,
              backgroundColor: Colors.grey[300],
              valueColor: AlwaysStoppedAnimation<Color>(
                participationRate >= 80
                    ? Colors.green
                    : participationRate >= 50
                        ? Colors.orange
                        : Colors.red,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Participation Rate: $participationRate%',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatItem(String label, String value, Color color) {
    return Column(
      children: [
        Text(
          value,
          style: TextStyle(
            fontSize: 24,
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

  Widget _buildParticipantsList() {
    final participants = _participantsData?['participants'] as List<dynamic>?;
    if (participants == null || participants.isEmpty) {
      return const Card(
        child: Padding(
          padding: EdgeInsets.all(16),
          child: Text('No participants found'),
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Participants',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
        ),
        const SizedBox(height: 12),
        ...participants.map((participant) {
          final participantMap = participant as Map<String, dynamic>;
          final name = participantMap['name'] as String? ?? 'Unknown';
          final acknowledged = participantMap['acknowledged'] as bool? ?? false;
          final responseTime = participantMap['responseTime'] as int?;
          final acknowledgedAt = participantMap['acknowledgedAt'] as String?;
          final completedAt = participantMap['completedAt'] as String?;
          final evacuationTime = participantMap['evacuationTime'] as int?;

          return Card(
            margin: const EdgeInsets.only(bottom: 8),
            child: ListTile(
              leading: CircleAvatar(
                backgroundColor: acknowledged ? Colors.green : Colors.red,
                child: Icon(
                  acknowledged ? Icons.check : Icons.close,
                  color: Colors.white,
                ),
              ),
              title: Text(name),
              subtitle: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    acknowledged ? 'Acknowledged' : 'Not Acknowledged',
                    style: TextStyle(
                      color: acknowledged ? Colors.green : Colors.red,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  if (responseTime != null)
                    Text('Response Time: ${responseTime}s'),
                  if (acknowledgedAt != null)
                    Text('Acknowledged: ${_formatTime(acknowledgedAt)}'),
                  if (completedAt != null)
                    Text('Completed: ${_formatTime(completedAt)}'),
                  if (evacuationTime != null)
                    Text('Evacuation Time: ${evacuationTime}s'),
                ],
              ),
            ),
          );
        }).toList(),
      ],
    );
  }

  String _formatTime(String? timeString) {
    if (timeString == null) return 'N/A';
    try {
      final time = DateTime.parse(timeString);
      return '${time.hour.toString().padLeft(2, '0')}:${time.minute.toString().padLeft(2, '0')}';
    } catch (e) {
      return timeString;
    }
  }
}
