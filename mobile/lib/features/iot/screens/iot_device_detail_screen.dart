/**
 * Phase 201: IoT Device Detail Screen
 * Shows real-time sensor readings and device status
 */

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/services/api_service.dart';
import '../../../core/constants/api_endpoints.dart';
import '../../socket/providers/socket_provider.dart';
import '../../../core/constants/socket_events.dart';

class IoTDeviceDetailScreen extends ConsumerStatefulWidget {
  final String deviceId;
  final String deviceName;
  final String deviceType;
  final String? status;

  const IoTDeviceDetailScreen({
    super.key,
    required this.deviceId,
    required this.deviceName,
    required this.deviceType,
    this.status,
  });

  @override
  ConsumerState<IoTDeviceDetailScreen> createState() => _IoTDeviceDetailScreenState();
}

class _IoTDeviceDetailScreenState extends ConsumerState<IoTDeviceDetailScreen> {
  Map<String, dynamic>? _deviceData;
  Map<String, dynamic>? _latestTelemetry;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadDeviceData();
    _setupSocketListeners();
  }

  void _setupSocketListeners() {
    final socketNotifier = ref.read(socketProvider.notifier);
    
    // Listen for telemetry updates
    socketNotifier.on('TELEMETRY_UPDATE', (data) {
      if (data is Map<String, dynamic> && data['deviceId'] == widget.deviceId) {
        setState(() {
          _latestTelemetry = data['readings'] as Map<String, dynamic>?;
        });
      }
    });

    // Listen for device alerts
    socketNotifier.on(SocketEvents.deviceAlert, (data) {
      if (data is Map<String, dynamic> && data['deviceId'] == widget.deviceId) {
        _showAlertNotification(data);
      }
    });
  }

  void _showAlertNotification(Map<String, dynamic> alertData) {
    if (!mounted) return;
    
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Alert: ${alertData['alertType'] ?? 'Unknown'}'),
        backgroundColor: Colors.red,
        duration: const Duration(seconds: 3),
      ),
    );
  }

  Future<void> _loadDeviceData() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final apiService = ApiService();
      
      // Load device details
      final deviceResponse = await apiService.get(ApiEndpoints.device(widget.deviceId));
      if (deviceResponse.data != null && deviceResponse.data['success'] == true) {
        setState(() {
          _deviceData = deviceResponse.data['data'] as Map<String, dynamic>?;
        });
      }

      // Load latest telemetry
      final historyResponse = await apiService.get(ApiEndpoints.deviceHistory(widget.deviceId));
      if (historyResponse.data != null && historyResponse.data['success'] == true) {
        final history = historyResponse.data['data'];
        if (history is List && history.isNotEmpty) {
          final firstItem = history[0] as Map<String, dynamic>;
          setState(() {
            _latestTelemetry = firstItem['readings'] as Map<String, dynamic>?;
          });
        }
      }

      setState(() {
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
        _error = e.toString();
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.deviceName),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadDeviceData,
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
                      Text('Error: $_error'),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: _loadDeviceData,
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadDeviceData,
                  child: SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildDeviceInfo(),
                        const SizedBox(height: 24),
                        _buildSensorReadings(),
                        const SizedBox(height: 24),
                        _buildStatusCard(),
                      ],
                    ),
                  ),
                ),
    );
  }

  Widget _buildDeviceInfo() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  _getDeviceIcon(widget.deviceType),
                  size: 32,
                  color: Theme.of(context).primaryColor,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        widget.deviceName,
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      Text(
                        widget.deviceType,
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: Colors.grey[600],
                            ),
                      ),
                    ],
                  ),
                ),
                _buildStatusBadge(widget.status ?? 'unknown'),
              ],
            ),
            if (_deviceData != null) ...[
              const Divider(height: 24),
              _buildInfoRow('Device ID', widget.deviceId),
              if (_deviceData!['room'] != null)
                _buildInfoRow('Room', _deviceData!['room'].toString()),
              if (_deviceData!['lastSeen'] != null)
                _buildInfoRow(
                  'Last Seen',
                  _formatTimestamp(_deviceData!['lastSeen']),
                ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildSensorReadings() {
    if (_latestTelemetry == null) {
      return Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Center(
            child: Text(
              'No sensor readings available',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Colors.grey[600],
                  ),
            ),
          ),
        ),
      );
    }

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Sensor Readings',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 16),
            if (_latestTelemetry!['flame'] != null)
              _buildSensorCard(
                'Fire Sensor',
                (_latestTelemetry!['flame'] == true || _latestTelemetry!['flame'] == 1) ? 'Fire Detected!' : 'No Fire',
                (_latestTelemetry!['flame'] == true || _latestTelemetry!['flame'] == 1) ? Colors.red : Colors.green,
                Icons.local_fire_department,
              ),
            if (_latestTelemetry!['water'] != null)
              _buildSensorCard(
                'Water Level',
                '${_latestTelemetry!['water']}',
                (_latestTelemetry!['water'] as num) > 2000 ? Colors.orange : Colors.blue,
                Icons.water_drop,
              ),
            if (_latestTelemetry!['acceleration'] != null) ...[
              _buildSensorCard(
                'Acceleration X',
                '${(_latestTelemetry!['acceleration']['x'] ?? 0).toStringAsFixed(2)} m/s²',
                Colors.blue,
                Icons.speed,
              ),
              _buildSensorCard(
                'Acceleration Y',
                '${(_latestTelemetry!['acceleration']['y'] ?? 0).toStringAsFixed(2)} m/s²',
                Colors.blue,
                Icons.speed,
              ),
              _buildSensorCard(
                'Acceleration Z',
                '${(_latestTelemetry!['acceleration']['z'] ?? 0).toStringAsFixed(2)} m/s²',
                Colors.blue,
                Icons.speed,
              ),
            ],
            if (_latestTelemetry!['magnitude'] != null)
              _buildSensorCard(
                'Magnitude',
                '${(_latestTelemetry!['magnitude'] ?? 0).toStringAsFixed(2)} m/s²',
                (_latestTelemetry!['magnitude'] as num) > 2.5 ? Colors.orange : Colors.green,
                Icons.vibration,
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildSensorCard(String label, String value, Color color, IconData icon) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Row(
        children: [
          Icon(icon, color: color),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Colors.grey[600],
                      ),
                ),
                Text(
                  value,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: color,
                        fontWeight: FontWeight.bold,
                      ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusCard() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Device Status',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 16),
            if (_deviceData != null) ...[
              _buildInfoRow('Status', widget.status ?? 'unknown'),
              if (_deviceData!['lastSeen'] != null)
                _buildInfoRow(
                  'Last Update',
                  _formatTimestamp(_deviceData!['lastSeen']),
                ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.grey[600],
                ),
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

  Widget _buildStatusBadge(String status) {
    Color color;
    switch (status.toLowerCase()) {
      case 'active':
        color = Colors.green;
        break;
      case 'warning':
        color = Colors.orange;
        break;
      case 'critical':
        color = Colors.red;
        break;
      default:
        color = Colors.grey;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color),
      ),
      child: Text(
        status.toUpperCase(),
        style: TextStyle(
          color: color,
          fontSize: 12,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  IconData _getDeviceIcon(String deviceType) {
    switch (deviceType.toLowerCase()) {
      case 'multi-sensor':
        return Icons.sensors;
      case 'fire-sensor':
        return Icons.local_fire_department;
      case 'flood-sensor':
        return Icons.water_drop;
      default:
        return Icons.device_hub;
    }
  }

  String _formatTimestamp(dynamic timestamp) {
    if (timestamp == null) return 'Never';
    try {
      final date = DateTime.parse(timestamp.toString());
      final now = DateTime.now();
      final diff = now.difference(date);
      
      if (diff.inSeconds < 60) {
        return '${diff.inSeconds}s ago';
      } else if (diff.inMinutes < 60) {
        return '${diff.inMinutes}m ago';
      } else if (diff.inHours < 24) {
        return '${diff.inHours}h ago';
      } else {
        return '${diff.inDays}d ago';
      }
    } catch (e) {
      return timestamp.toString();
    }
  }
}

