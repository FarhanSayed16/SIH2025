/**
 * Phase 201: IoT Status Widget
 * Shows IoT device status on home screen
 */

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/services/api_service.dart';
import '../../../core/constants/api_endpoints.dart';
import '../../../core/design/design_system.dart';
import '../../../core/constants/socket_events.dart';
import '../../socket/providers/socket_provider.dart';
import '../../iot/screens/iot_device_list_screen.dart';

class IoTStatusWidget extends ConsumerStatefulWidget {
  const IoTStatusWidget({super.key});

  @override
  ConsumerState<IoTStatusWidget> createState() => _IoTStatusWidgetState();
}

class _IoTStatusWidgetState extends ConsumerState<IoTStatusWidget> {
  List<Map<String, dynamic>> _devices = [];
  bool _isLoading = true;
  int _healthyCount = 0;
  int _warningCount = 0;
  int _offlineCount = 0;

  @override
  void initState() {
    super.initState();
    _loadDevices();
  }

  Future<void> _loadDevices() async {
    try {
      final apiService = ApiService();
      final response =
          await apiService.get(ApiEndpoints.deviceHealthMonitoring);

      final responseData = response.data;
      if (responseData is Map<String, dynamic> &&
          responseData['success'] == true &&
          responseData['data'] != null) {
        final healthData = responseData['data'] as Map<String, dynamic>?;
        if (healthData != null && healthData['devices'] != null) {
          final devicesList = healthData['devices'];
          if (devicesList is List) {
            final devices = devicesList
                .map((item) => item as Map<String, dynamic>)
                .toList();

            setState(() {
              _devices = devices;
              _healthyCount =
                  devices.where((d) => d['health'] == 'healthy').length;
              _warningCount =
                  devices.where((d) => d['health'] == 'warning').length;
              _offlineCount =
                  devices.where((d) => d['health'] == 'offline').length;
              _isLoading = false;
            });
            return;
          }
        }
      }

      setState(() {
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Container(
        padding: EdgeInsets.all(AppSpacing.lg),
        decoration: BoxDecoration(
          color: AppColors.backgroundWhite,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: AppColors.shadow.withOpacity(0.08),
              blurRadius: 10,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Center(
          child: CircularProgressIndicator(
            strokeWidth: 2,
            valueColor: AlwaysStoppedAnimation<Color>(AppColors.primaryGreen),
          ),
        ),
      );
    }

    if (_devices.isEmpty) {
      return const SizedBox.shrink();
    }

    final totalDevices = _devices.length;
    final hasAlerts = _warningCount > 0 || _offlineCount > 0;

    return GestureDetector(
      onTap: () {
        Navigator.push<void>(
          context,
          MaterialPageRoute<void>(
            builder: (context) => const IoTDeviceListScreen(),
          ),
        );
      },
      child: Container(
        padding: EdgeInsets.all(AppSpacing.lg),
        decoration: BoxDecoration(
          color: AppColors.backgroundWhite,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: AppColors.shadow.withOpacity(0.08),
              blurRadius: 10,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: EdgeInsets.all(AppSpacing.sm),
                  decoration: BoxDecoration(
                    color: AppColors.primaryGreen.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(
                    Icons.sensors,
                    color: AppColors.primaryGreen,
                    size: 24,
                  ),
                ),
                SizedBox(width: AppSpacing.md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'IoT Devices',
                        style: AppTextStyles.h3.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        '$totalDevices devices connected',
                        style: AppTextStyles.bodySmall.copyWith(
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
                if (hasAlerts)
                  Container(
                    padding: EdgeInsets.symmetric(
                      horizontal: AppSpacing.sm,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: AppColors.error.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.warning,
                          size: 14,
                          color: AppColors.error,
                        ),
                        SizedBox(width: 4),
                        Text(
                          '${_warningCount + _offlineCount}',
                          style: AppTextStyles.bodySmall.copyWith(
                            color: AppColors.error,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
            SizedBox(height: AppSpacing.md),
            Row(
              children: [
                _buildStatusChip('Healthy', _healthyCount, AppColors.success),
                SizedBox(width: AppSpacing.sm),
                if (_warningCount > 0)
                  _buildStatusChip('Warning', _warningCount, AppColors.warning),
                SizedBox(width: AppSpacing.sm),
                if (_offlineCount > 0)
                  _buildStatusChip('Offline', _offlineCount, AppColors.error),
              ],
            ),
            SizedBox(height: AppSpacing.sm),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                Text(
                  'Tap to view details',
                  style: AppTextStyles.bodySmall.copyWith(
                    color: AppColors.primaryGreen,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                SizedBox(width: 4),
                Icon(
                  Icons.arrow_forward,
                  size: 14,
                  color: AppColors.primaryGreen,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusChip(String label, int count, Color color) {
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: AppSpacing.sm,
        vertical: 4,
      ),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(
              color: color,
              shape: BoxShape.circle,
            ),
          ),
          SizedBox(width: 6),
          Text(
            '$label: $count',
            style: AppTextStyles.bodySmall.copyWith(
              color: color,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}
