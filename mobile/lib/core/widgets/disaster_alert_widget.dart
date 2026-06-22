/// Disaster Alert Widget
/// Displays active disaster alerts from NDMA/IMD
/// Used in HazardLens screen and other emergency screens

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/alert_model.dart';
// import '../../features/emergency/services/alert_service.dart'; // TODO: Create alert service
import '../design/design_system.dart';
import 'cards/alert_card.dart';

class DisasterAlertWidget extends ConsumerWidget {
  const DisasterAlertWidget({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Watch for active alerts
    // Note: This assumes alert service/provider exists
    // If not, this will show empty or need to be connected to alert system
    
    return Container(
      height: 60,
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: _buildAlertBanner(context),
    );
  }

  Widget _buildAlertBanner(BuildContext context) {
    // For now, show a simple banner
    // TODO: Connect to actual alert service/provider when available
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.orange.shade50,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.orange.shade200),
      ),
      child: Row(
        children: [
          Icon(Icons.warning_amber_rounded, 
               color: Colors.orange.shade700, 
               size: 20),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              'Check for active disaster alerts',
              style: TextStyle(
                color: Colors.orange.shade900,
                fontSize: 12,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }

  /// Build alert list from active alerts
  Widget _buildAlertList(List<AlertModel> alerts) {
    if (alerts.isEmpty) {
      return const SizedBox.shrink();
    }

    return Column(
      children: alerts.map((alert) {
        return AlertCard(
          title: alert.title,
          message: alert.description ?? '',
          type: _mapSeverityToAlertType(alert.severity),
          onDismiss: () {
            // Handle dismiss if needed
          },
        );
      }).toList(),
    );
  }

  AlertType _mapSeverityToAlertType(String severity) {
    switch (severity.toLowerCase()) {
      case 'critical':
      case 'high':
        return AlertType.error;
      case 'medium':
        return AlertType.warning;
      case 'low':
      default:
        return AlertType.info;
    }
  }
}

