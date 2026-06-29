/// Phase 4.2: Drill Detail Screen
/// Phase 101.7.2: Redesigned with new component library
/// Shows drill details and allows acknowledgment

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/widgets/widgets.dart';
import '../../../core/design/design_system.dart';
import '../../../core/providers/api_service_provider.dart';
import '../../../core/constants/api_endpoints.dart';
import '../models/drill_model.dart';
import '../services/drill_service.dart';
import '../../auth/providers/auth_provider.dart';
import '../../emergency/screens/crisis_mode_screen.dart';
import '../../ar/screens/ar_fire_simulation_screen.dart'; // Phase 5.6: AR Fire Simulation

class DrillDetailScreen extends ConsumerStatefulWidget {
  final String drillId;

  const DrillDetailScreen({
    super.key,
    required this.drillId,
  });

  @override
  ConsumerState<DrillDetailScreen> createState() => _DrillDetailScreenState();
}

class _DrillDetailScreenState extends ConsumerState<DrillDetailScreen> {
  late final DrillService _drillService;
  DrillModel? _drill;
  bool _isLoading = true;
  bool _isAcknowledging = false;

  @override
  void initState() {
    super.initState();
    // Initialize DrillService with shared ApiService from provider
    _drillService = DrillService(
      apiService: ref.read(apiServiceProvider),
    );
    _loadDrill();
  }

  Future<void> _loadDrill() async {
    setState(() {
      _isLoading = true;
    });

    try {
      final drill = await _drillService.getDrillById(widget.drillId);
      setState(() {
        _drill = drill;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading drill: $e')),
        );
      }
    }
  }

  Future<void> _acknowledgeDrill() async {
    if (_drill == null) return;

    setState(() {
      _isAcknowledging = true;
    });

    try {
      final success = await _drillService.acknowledgeDrill(_drill!.id);
      if (success) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('✓ Drill participation acknowledged'),
              backgroundColor: Colors.green,
            ),
          );
        }
        // B7: Fetch AI feedback and show on completion
        if (mounted) {
          try {
            final api = ref.read(apiServiceProvider);
            final res = await api.post(
              ApiEndpoints.aiDrillFeedback,
              data: {
                'acknowledged': true,
                'responseTimeSeconds': null,
                'drillType': _drill?.type ?? 'safety',
              },
            );
            final feedback = res.data is Map && res.data['data'] != null
                ? (res.data['data'] as Map)['feedback']?.toString()
                : null;
            if (mounted && feedback != null && feedback.isNotEmpty) {
              showDialog<void>(
                context: context,
                builder: (ctx) => AlertDialog(
                  title: const Text('AI feedback'),
                  content: Text(feedback),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.of(ctx).pop(),
                      child: const Text('OK'),
                    ),
                  ],
                ),
              );
            }
          } catch (_) {
            // Non-blocking: feedback is optional
          }
        }
        // Reload drill to get updated status
        await _loadDrill();
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Failed to acknowledge drill'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    } finally {
      setState(() {
        _isAcknowledging = false;
      });
    }
  }

  void _navigateToCrisisMode() {
    if (_drill == null) return;

    // Navigate to Crisis Mode screen in Drill Mode
    Navigator.push<void>(
      context,
      MaterialPageRoute<void>(
        builder: (context) => CrisisModeScreen(
          alertId: _drill!.id,
          alertType: _drill!.type,
          message: 'PRACTICE DRILL — This is not a real emergency',
          isDrill: true,
          drillId: _drill!.id,
          drillType: _drill!.type,
          drillDuration: _drill!.duration,
        ),
      ),
    );
  }

  /// Phase 5.6: Navigate to AR Fire Simulation
  void _navigateToARFireSimulation() {
    if (_drill == null) return;

    final authState = ref.read(authProvider);
    final user = authState.user;
    final isTeacherMode = user?.role == 'teacher' || user?.role == 'admin';

    // Navigate to AR Fire Simulation screen
    Navigator.push<void>(
      context,
      MaterialPageRoute<void>(
        builder: (context) => ARFireSimulationScreen(
          drillId: _drill!.id,
          drill: _drill,
          isTeacherMode: isTeacherMode,
        ),
      ),
    );
  }

  /// Phase 5.6: Get button text based on user role
  String _getARFireSimulationButtonText(String role) {
    switch (role) {
      case 'teacher':
      case 'admin':
        return 'Start AR Fire Simulation (Teacher Mode)';
      case 'student':
      default:
        return 'Join AR Fire Simulation';
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final currentUserId = authState.user?.id;

    if (_isLoading) {
      return Scaffold(
        appBar: const AppBarCustom(title: 'Drill Details'),
        body: const LoadingState(message: 'Loading drill details...'),
      );
    }

    if (_drill == null) {
      return Scaffold(
        appBar: const AppBarCustom(title: 'Drill Details'),
        body: ErrorState(
          title: 'Drill not found',
          message: 'The drill you are looking for does not exist.',
          onRetry: _loadDrill,
        ),
      );
    }

    final drill = _drill!;
    final isParticipant =
        drill.participants.any((p) => p.userId == currentUserId);
    final hasAcknowledged = isParticipant &&
        drill.participants
            .firstWhere((p) => p.userId == currentUserId,
                orElse: () => DrillParticipant(userId: ''))
            .acknowledged;

    return Scaffold(
      appBar: AppBarCustom(
        title: '${drill.type.toUpperCase()} Drill',
      ),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(AppSpacing.md),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Status Card
            _buildStatusCard(drill),
            SizedBox(height: AppSpacing.md),

            // Schedule Info
            _buildInfoSection(
              'Schedule',
              [
                _buildInfoRow('Scheduled', _formatDateTime(drill.scheduledAt)),
                if (drill.actualStart != null)
                  _buildInfoRow('Started', _formatDateTime(drill.actualStart!)),
                if (drill.completedAt != null)
                  _buildInfoRow(
                      'Completed', _formatDateTime(drill.completedAt!)),
                _buildInfoRow('Duration', '${drill.duration} minutes'),
              ],
            ),
            SizedBox(height: AppSpacing.md),

            // Participants Info
            _buildInfoSection(
              'Participants',
              [
                _buildInfoRow('Total', '${drill.results.totalParticipants}'),
                _buildInfoRow(
                    'Acknowledged', '${drill.results.completedParticipants}'),
                _buildInfoRow('Participation Rate',
                    '${drill.results.participationRate}%'),
                if (drill.results.avgEvacuationTime != null)
                  _buildInfoRow('Avg Evacuation Time',
                      '${drill.results.avgEvacuationTime}s'),
              ],
            ),
            SizedBox(height: AppSpacing.md),

            // Action Buttons
            if (drill.isInProgress && isParticipant && !hasAcknowledged) ...[
              PrimaryButton(
                label: 'Acknowledge Participation',
                onPressed: _isAcknowledging ? null : _acknowledgeDrill,
                icon: Icons.check_circle,
                isLoading: _isAcknowledging,
                size: ButtonSize.large,
                fullWidth: true,
              ),
              SizedBox(height: AppSpacing.md),
              OutlinedButtonCustom(
                label: 'View Drill Mode',
                icon: Icons.warning_amber,
                onPressed: _navigateToCrisisMode,
                size: ButtonSize.large,
                fullWidth: true,
              ),
            ] else if (drill.isInProgress &&
                isParticipant &&
                hasAcknowledged) ...[
              AlertCard(
                title: 'Acknowledged',
                message: 'You have acknowledged this drill',
                type: AlertType.success,
                icon: Icons.check_circle,
              ),
              SizedBox(height: AppSpacing.md),

              // Phase 5.6: AR Fire Simulation Button (only for fire drills)
              if (drill.type == 'fire') ...[
                EmergencyButton(
                  label: _getARFireSimulationButtonText(
                      authState.user?.role ?? 'student'),
                  onPressed: () => _navigateToARFireSimulation(),
                  icon: Icons.local_fire_department,
                  size: ButtonSize.large,
                ),
                SizedBox(height: AppSpacing.md),
              ],

              OutlinedButtonCustom(
                label: 'View Drill Mode',
                icon: Icons.warning_amber,
                onPressed: _navigateToCrisisMode,
                size: ButtonSize.large,
                fullWidth: true,
              ),
            ],
          ],
        ),
      ),
    );
  }

  String _getStatusText(String status) {
    switch (status) {
      case 'scheduled':
        return 'Scheduled';
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  }

  Widget _buildStatusCard(DrillModel drill) {
    return InfoCard(
      title: _getStatusText(drill.status),
      leadingIcon: Icons.info_outline,
      content: drill.isInProgress && drill.remainingTime != null
          ? Text(
              'Time remaining: ${_formatDuration(drill.remainingTime!)}',
              style: AppTextStyles.bodySmall,
            )
          : null,
    );
  }

  Widget _buildInfoSection(String title, List<Widget> children) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: AppTextStyles.h4,
        ),
        SizedBox(height: AppSpacing.sm),
        InfoCard(
          content: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: children,
          ),
        ),
      ],
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          Text(
            value,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
          ),
        ],
      ),
    );
  }

  String _formatDateTime(DateTime date) {
    return '${date.day}/${date.month}/${date.year} ${date.hour}:${date.minute.toString().padLeft(2, '0')}';
  }

  String _formatDuration(Duration duration) {
    final minutes = duration.inMinutes;
    final seconds = duration.inSeconds % 60;
    return '${minutes}m ${seconds}s';
  }
}
