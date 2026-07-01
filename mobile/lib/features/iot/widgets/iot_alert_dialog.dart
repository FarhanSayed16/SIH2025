/**
 * Phase 201: IoT Alert Dialog
 * Shows full-screen alert when IoT device detects disaster
 */

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../../core/design/design_system.dart';
import '../screens/iot_device_detail_screen.dart';

class IoTAlertDialog extends StatelessWidget {
  final String alertType; // 'FIRE', 'FLOOD', 'EARTHQUAKE'
  final String deviceId;
  final String deviceName;
  final String? deviceType;
  final String? room;
  final Map<String, dynamic>? sensorData;
  final String severity; // 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
  final DateTime timestamp;
  final VoidCallback? onDismiss;
  final VoidCallback? onViewDetails;

  const IoTAlertDialog({
    super.key,
    required this.alertType,
    required this.deviceId,
    required this.deviceName,
    this.deviceType,
    this.room,
    this.sensorData,
    this.severity = 'HIGH',
    required this.timestamp,
    this.onDismiss,
    this.onViewDetails,
  });

  static Future<void> show(
    BuildContext context, {
    required String alertType,
    required String deviceId,
    required String deviceName,
    String? deviceType,
    String? room,
    Map<String, dynamic>? sensorData,
    String severity = 'HIGH',
    required DateTime timestamp,
    VoidCallback? onDismiss,
    VoidCallback? onViewDetails,
  }) {
    return showDialog(
      context: context,
      barrierDismissible: severity != 'CRITICAL' &&
          alertType != 'FIRE', // Fire cannot be dismissed
      barrierColor: Colors.black87,
      builder: (context) => IoTAlertDialog(
        alertType: alertType,
        deviceId: deviceId,
        deviceName: deviceName,
        deviceType: deviceType,
        room: room,
        sensorData: sensorData,
        severity: severity,
        timestamp: timestamp,
        onDismiss: onDismiss,
        onViewDetails: onViewDetails,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isCritical = severity == 'CRITICAL' || alertType == 'FIRE';

    // Auto-dismiss after 30s for non-critical alerts
    if (!isCritical) {
      Future.delayed(const Duration(seconds: 30), () {
        // Check if dialog is still open before dismissing
        if (Navigator.of(context).canPop()) {
          Navigator.of(context).pop();
          onDismiss?.call();
        }
      });
    }

    return WillPopScope(
      onWillPop: () async {
        // Prevent dismiss for critical alerts
        if (isCritical) {
          return false;
        }
        onDismiss?.call();
        return true;
      },
      child: Dialog(
        backgroundColor: Colors.transparent,
        insetPadding: EdgeInsets.zero,
        child: Container(
          width: double.infinity,
          height: double.infinity,
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: _getGradientColors(alertType),
            ),
          ),
          child: SafeArea(
            child: Padding(
              padding: EdgeInsets.all(AppSpacing.xl),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Alert Icon
                  Container(
                    width: 120,
                    height: 120,
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.2),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      _getAlertIcon(alertType),
                      size: 60,
                      color: Colors.white,
                    ),
                  ),
                  SizedBox(height: AppSpacing.xl),

                  // Alert Type
                  Text(
                    _getAlertTitle(alertType),
                    style: AppTextStyles.h1.copyWith(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 32,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  SizedBox(height: AppSpacing.md),

                  // Device Info
                  Text(
                    deviceName,
                    style: AppTextStyles.h3.copyWith(
                      color: Colors.white.withOpacity(0.9),
                      fontSize: 20,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  if (room != null) ...[
                    SizedBox(height: AppSpacing.xs),
                    Text(
                      'Location: $room',
                      style: AppTextStyles.bodyMedium.copyWith(
                        color: Colors.white.withOpacity(0.8),
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ],
                  SizedBox(height: AppSpacing.xl),

                  // Sensor Data
                  if (sensorData != null) ...[
                    Container(
                      padding: EdgeInsets.all(AppSpacing.lg),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Column(
                        children: [
                          Text(
                            'Sensor Data',
                            style: AppTextStyles.h3.copyWith(
                              color: Colors.white,
                            ),
                          ),
                          SizedBox(height: AppSpacing.md),
                          _buildSensorDataRow(context),
                        ],
                      ),
                    ),
                    SizedBox(height: AppSpacing.xl),
                  ],

                  // Timestamp
                  Text(
                    'Detected: ${_formatTimestamp(timestamp)}',
                    style: AppTextStyles.bodySmall.copyWith(
                      color: Colors.white.withOpacity(0.7),
                    ),
                    textAlign: TextAlign.center,
                  ),
                  SizedBox(height: AppSpacing.xl),

                  // Action Buttons
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      if (!isCritical)
                        ElevatedButton(
                          onPressed: () {
                            Navigator.of(context).pop();
                            onDismiss?.call();
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.white.withOpacity(0.3),
                            foregroundColor: Colors.white,
                            padding: EdgeInsets.symmetric(
                              horizontal: AppSpacing.xl,
                              vertical: AppSpacing.md,
                            ),
                          ),
                          child: Text('Dismiss'),
                        ),
                      if (!isCritical) SizedBox(width: AppSpacing.md),
                      ElevatedButton(
                        onPressed: () {
                          Navigator.of(context).pop();
                          onViewDetails?.call();
                          Navigator.push(
                            context,
                            MaterialPageRoute<void>(
                              builder: (context) => IoTDeviceDetailScreen(
                                deviceId: deviceId,
                                deviceName: deviceName,
                                deviceType: deviceType ?? 'multi-sensor',
                                status: 'active',
                              ),
                            ),
                          );
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.white,
                          foregroundColor: _getPrimaryColor(alertType),
                          padding: EdgeInsets.symmetric(
                            horizontal: AppSpacing.xl,
                            vertical: AppSpacing.md,
                          ),
                        ),
                        child: Text('View Details'),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildSensorDataRow(BuildContext context) {
    if (sensorData == null) return SizedBox.shrink();

    if (alertType == 'FIRE' && sensorData!['flame'] == true) {
      return Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.local_fire_department, color: Colors.white, size: 24),
          SizedBox(width: AppSpacing.sm),
          Text(
            'Flame Detected',
            style: AppTextStyles.bodyLarge.copyWith(
              color: Colors.white,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      );
    } else if (alertType == 'FLOOD' && sensorData!['water'] != null) {
      return Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.water_drop, color: Colors.white, size: 24),
          SizedBox(width: AppSpacing.sm),
          Text(
            'Water Level: ${sensorData!['water']}',
            style: AppTextStyles.bodyLarge.copyWith(
              color: Colors.white,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      );
    } else if (alertType == 'EARTHQUAKE' && sensorData!['magnitude'] != null) {
      return Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.warning, color: Colors.white, size: 24),
          SizedBox(width: AppSpacing.sm),
          Text(
            'Magnitude: ${(sensorData!['magnitude'] as num).toStringAsFixed(2)} G',
            style: AppTextStyles.bodyLarge.copyWith(
              color: Colors.white,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      );
    }

    return SizedBox.shrink();
  }

  List<Color> _getGradientColors(String alertType) {
    switch (alertType.toUpperCase()) {
      case 'FIRE':
        return [
          Colors.red.shade900,
          Colors.orange.shade700,
          Colors.red.shade600
        ];
      case 'FLOOD':
        return [
          Colors.blue.shade900,
          Colors.cyan.shade700,
          Colors.blue.shade600
        ];
      case 'EARTHQUAKE':
        return [
          Colors.orange.shade900,
          Colors.amber.shade700,
          Colors.orange.shade600
        ];
      default:
        return [Colors.red.shade900, Colors.red.shade700, Colors.red.shade600];
    }
  }

  Color _getPrimaryColor(String alertType) {
    switch (alertType.toUpperCase()) {
      case 'FIRE':
        return Colors.red.shade900;
      case 'FLOOD':
        return Colors.blue.shade900;
      case 'EARTHQUAKE':
        return Colors.orange.shade900;
      default:
        return Colors.red.shade900;
    }
  }

  IconData _getAlertIcon(String alertType) {
    switch (alertType.toUpperCase()) {
      case 'FIRE':
        return Icons.local_fire_department;
      case 'FLOOD':
        return Icons.water_drop;
      case 'EARTHQUAKE':
        return Icons.warning;
      default:
        return Icons.warning;
    }
  }

  String _getAlertTitle(String alertType) {
    switch (alertType.toUpperCase()) {
      case 'FIRE':
        return '🔥 FIRE DETECTED!';
      case 'FLOOD':
        return '🌊 FLOOD ALERT!';
      case 'EARTHQUAKE':
        return '⚠️ EARTHQUAKE DETECTED!';
      default:
        return '⚠️ ALERT!';
    }
  }

  String _formatTimestamp(DateTime timestamp) {
    final now = DateTime.now();
    final difference = now.difference(timestamp);

    if (difference.inSeconds < 60) {
      return 'Just now';
    } else if (difference.inMinutes < 60) {
      return '${difference.inMinutes} minute${difference.inMinutes > 1 ? 's' : ''} ago';
    } else {
      return '${timestamp.hour.toString().padLeft(2, '0')}:${timestamp.minute.toString().padLeft(2, '0')}';
    }
  }
}
