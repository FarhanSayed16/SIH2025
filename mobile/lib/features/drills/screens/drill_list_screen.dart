/// Phase 4.2: Drill List Screen
/// Phase 101.7.1: Redesigned with new component library
/// Displays list of drills (scheduled, in progress, completed)

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/widgets/widgets.dart';
import '../../../core/design/design_system.dart';
import '../../../core/providers/api_service_provider.dart';
import '../models/drill_model.dart';
import '../services/drill_service.dart';
import 'drill_detail_screen.dart';

class DrillListScreen extends ConsumerStatefulWidget {
  const DrillListScreen({super.key});

  @override
  ConsumerState<DrillListScreen> createState() => _DrillListScreenState();
}

class _DrillListScreenState extends ConsumerState<DrillListScreen>
    with SingleTickerProviderStateMixin {
  late final DrillService _drillService;
  final List<DrillModel> _drills = [];
  bool _isLoading = false;
  String _selectedStatus = 'all'; // all, scheduled, in_progress, completed
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    // Initialize DrillService with shared ApiService from provider
    _drillService = DrillService(
      apiService: ref.read(apiServiceProvider),
    );
    _loadDrills();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadDrills({String? status}) async {
    setState(() {
      _isLoading = true;
      if (status != null) _selectedStatus = status;
    });

    try {
      final drills = await _drillService.getDrills(
        status: status == 'all' ? null : status,
      );
      setState(() {
        _drills.clear();
        _drills.addAll(drills);
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading drills: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Drills'),
        bottom: TabBar(
          controller: _tabController,
          onTap: (index) {
            final statuses = ['all', 'scheduled', 'in_progress', 'completed'];
            _loadDrills(status: statuses[index]);
          },
          tabs: const [
            Tab(text: 'All'),
            Tab(text: 'Scheduled'),
            Tab(text: 'Active'),
            Tab(text: 'Completed'),
          ],
        ),
      ),
      body: _isLoading
          ? const LoadingState(message: 'Loading drills...')
          : _drills.isEmpty
              ? _buildEmptyState()
              : RefreshIndicator(
                  onRefresh: () => _loadDrills(status: _selectedStatus),
                  child: ListView.builder(
                    padding: EdgeInsets.all(AppSpacing.md),
                    itemCount: _drills.length,
                    itemBuilder: (context, index) {
                      final drill = _drills[index];
                      return Padding(
                        padding: EdgeInsets.only(bottom: AppSpacing.md),
                        child: _DrillCard(
                          drill: drill,
                          onTap: () {
                            Navigator.push<void>(
                              context,
                              MaterialPageRoute<void>(
                                builder: (context) =>
                                    DrillDetailScreen(drillId: drill.id),
                              ),
                            );
                          },
                        ),
                      );
                    },
                  ),
                ),
    );
  }

  Widget _buildEmptyState() {
    return EmptyState(
      icon: Icons.event_busy,
      title: 'No drills found',
      message: 'Pull down to refresh or check back later',
      actionLabel: 'Refresh',
      onAction: () => _loadDrills(status: _selectedStatus),
    );
  }
}

class _DrillCard extends StatelessWidget {
  final DrillModel drill;
  final VoidCallback onTap;

  const _DrillCard({
    required this.drill,
    required this.onTap,
  });

  String _formatType() {
    return drill.type.toUpperCase();
  }

  BadgeType _getStatusBadgeType() {
    switch (drill.status) {
      case 'scheduled':
        return BadgeType.info;
      case 'in_progress':
        return BadgeType.warning;
      case 'completed':
        return BadgeType.success;
      case 'cancelled':
        return BadgeType.error;
      default:
        return BadgeType.info;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 2,
      shadowColor: AppColors.shadow,
      shape: RoundedRectangleBorder(
        borderRadius: AppBorders.borderRadiusMd,
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: AppBorders.borderRadiusMd,
        child: Padding(
          padding: AppSpacing.card,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  BadgeWidget(
                    text: drill.status.toUpperCase().replaceAll('_', ' '),
                    type: _getStatusBadgeType(),
                    size: BadgeSize.medium,
                  ),
                  const Spacer(),
                  BadgeWidget(
                    text: _formatType(),
                    type: BadgeType.info,
                    size: BadgeSize.small,
                    color: Colors.amber,
                  ),
                ],
              ),
              SizedBox(height: AppSpacing.md),
              Text(
                '${_formatType()} Drill',
                style: AppTextStyles.h5,
              ),
              SizedBox(height: AppSpacing.sm),
              Row(
                children: [
                  Icon(Icons.calendar_today,
                      size: 16, color: AppColors.textSecondary),
                  SizedBox(width: AppSpacing.sm),
                  Expanded(
                    child: Text(
                      'Scheduled: ${_formatDate(drill.scheduledAt)}',
                      style: AppTextStyles.bodySmall,
                    ),
                  ),
                ],
              ),
              if (drill.actualStart != null) ...[
                SizedBox(height: AppSpacing.xs),
                Row(
                  children: [
                    Icon(Icons.play_arrow,
                        size: 16, color: AppColors.textSecondary),
                    SizedBox(width: AppSpacing.sm),
                    Expanded(
                      child: Text(
                        'Started: ${_formatDate(drill.actualStart!)}',
                        style: AppTextStyles.bodySmall,
                      ),
                    ),
                  ],
                ),
              ],
              SizedBox(height: AppSpacing.sm),
              Row(
                children: [
                  Icon(Icons.people, size: 16, color: AppColors.textSecondary),
                  SizedBox(width: AppSpacing.sm),
                  Text(
                    '${drill.results.completedParticipants}/${drill.results.totalParticipants} participants',
                    style: AppTextStyles.bodySmall,
                  ),
                  if (drill.results.participationRate > 0) ...[
                    SizedBox(width: AppSpacing.md),
                    BadgeWidget(
                      text: '${drill.results.participationRate}%',
                      type: BadgeType.success,
                      size: BadgeSize.small,
                    ),
                  ],
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year} ${date.hour}:${date.minute.toString().padLeft(2, '0')}';
  }
}
