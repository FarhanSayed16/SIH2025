/**
 * Phase 3.4.2: IoT Device List Screen
 * Displays IoT sensor devices with status and health monitoring
 * Note: This feature will gracefully handle cases when IoT devices are not yet configured
 */

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../../../core/services/api_service.dart';
import '../../../core/constants/api_endpoints.dart';
import 'iot_device_detail_screen.dart';

/// IoT Device List Screen
class IoTDeviceListScreen extends ConsumerStatefulWidget {
  const IoTDeviceListScreen({super.key});

  @override
  ConsumerState<IoTDeviceListScreen> createState() =>
      _IoTDeviceListScreenState();
}

class _IoTDeviceListScreenState extends ConsumerState<IoTDeviceListScreen> {
  List<Map<String, dynamic>> _devices = [];
  bool _isLoading = true;
  String? _error;
  bool _isFeatureUnavailable = false; // Track if feature is not yet available

  @override
  void initState() {
    super.initState();
    _loadDevices();
  }

  Future<void> _loadDevices() async {
    setState(() {
      _isLoading = true;
      _error = null;
      _isFeatureUnavailable = false;
    });

    try {
      final apiService = ApiService();
      final response =
          await apiService.get(ApiEndpoints.deviceHealthMonitoring);

      // Fix: Access response.data, not response directly (Dio Response object)
      // response is a Response<dynamic> object, we need response.data to get the actual JSON
      final responseData = response.data;

      // Handle different response types
      if (responseData == null) {
        setState(() {
          _isFeatureUnavailable = true;
          _error =
              'IoT devices not configured yet. This feature will be available when IoT devices are connected.';
          _isLoading = false;
        });
        return;
      }

      // Cast to Map if it's a Map
      if (responseData is Map<String, dynamic>) {
        if (responseData['success'] == true && responseData['data'] != null) {
          final healthData = responseData['data'] as Map<String, dynamic>?;
          if (healthData != null && healthData['devices'] != null) {
            final devicesList = healthData['devices'];
            if (devicesList is List) {
              setState(() {
                _devices = devicesList
                    .map((item) => item as Map<String, dynamic>)
                    .toList();
                _isLoading = false;
              });
              return;
            }
          }
        }

        // Handle case where success is false or no data
        setState(() {
          _isFeatureUnavailable = true;
          final message = responseData['message'];
          _error = (message is String ? message : null) ??
              'No IoT devices configured yet. This feature will be available when IoT devices are connected.';
          _isLoading = false;
        });
      } else {
        // Unexpected response format
        setState(() {
          _isFeatureUnavailable = true;
          _error =
              'IoT devices not configured yet. This feature will be available when IoT devices are connected.';
          _isLoading = false;
        });
      }
    } on DioException catch (e) {
      // Handle Dio-specific errors
      setState(() {
        if (e.response?.statusCode == 404) {
          _isFeatureUnavailable = true;
          _error =
              'IoT devices not configured yet. This feature will be available when IoT devices are connected.';
        } else if (e.response?.statusCode == 403) {
          _error = 'You do not have permission to access IoT devices.';
        } else {
          _error = 'Unable to load IoT devices. Please try again later.';
        }
        _isLoading = false;
      });
    } catch (e) {
      // Handle other errors gracefully
      setState(() {
        _isFeatureUnavailable = true;
        _error =
            'IoT devices not configured yet. This feature will be available when IoT devices are connected.';
        _isLoading = false;
      });
    }
  }

  Color _getHealthColor(String health) {
    switch (health.toLowerCase()) {
      case 'healthy':
        return Colors.green;
      case 'warning':
        return Colors.orange;
      case 'offline':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('IoT Devices'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadDevices,
            tooltip: 'Refresh devices',
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(24.0),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          _isFeatureUnavailable
                              ? Icons.sensors_off
                              : Icons.error_outline,
                          size: 80,
                          color: _isFeatureUnavailable
                              ? Colors.orange
                              : Colors.red[300],
                        ),
                        const SizedBox(height: 24),
                        Text(
                          _isFeatureUnavailable
                              ? 'Feature Not Available Yet'
                              : 'Error Loading Devices',
                          style: Theme.of(context)
                              .textTheme
                              .headlineSmall
                              ?.copyWith(
                                fontWeight: FontWeight.bold,
                              ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 16),
                        Text(
                          _error!,
                          style:
                              Theme.of(context).textTheme.bodyLarge?.copyWith(
                                    color: Colors.grey[700],
                                  ),
                          textAlign: TextAlign.center,
                        ),
                        if (_isFeatureUnavailable) ...[
                          const SizedBox(height: 24),
                          Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: Colors.blue[50],
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: Colors.blue[200]!),
                            ),
                            child: Column(
                              children: [
                                Icon(Icons.info_outline,
                                    color: Colors.blue[700]),
                                const SizedBox(height: 8),
                                Text(
                                  'IoT device integration will be enabled once sensors are connected and configured.',
                                  style: TextStyle(color: Colors.blue[900]),
                                  textAlign: TextAlign.center,
                                ),
                              ],
                            ),
                          ),
                        ],
                        const SizedBox(height: 24),
                        ElevatedButton.icon(
                          onPressed: _loadDevices,
                          icon: const Icon(Icons.refresh),
                          label: const Text('Retry'),
                        ),
                      ],
                    ),
                  ),
                )
              : _devices.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.sensors_off,
                              size: 80, color: Colors.grey[400]),
                          const SizedBox(height: 16),
                          Text(
                            'No IoT devices found',
                            style: Theme.of(context).textTheme.titleLarge,
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Devices will appear here once they are connected and configured.',
                            style: Theme.of(context)
                                .textTheme
                                .bodyMedium
                                ?.copyWith(
                                  color: Colors.grey[600],
                                ),
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 24),
                          ElevatedButton.icon(
                            onPressed: _loadDevices,
                            icon: const Icon(Icons.refresh),
                            label: const Text('Refresh'),
                          ),
                        ],
                      ),
                    )
                  : RefreshIndicator(
                      onRefresh: _loadDevices,
                      child: ListView.builder(
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        itemCount: _devices.length,
                        itemBuilder: (context, index) {
                          final device = _devices[index];
                          final health = (device['health'] ?? 'unknown')
                              .toString()
                              .toLowerCase();
                          final deviceName = (device['deviceName'] ??
                                  device['deviceId'] ??
                                  'Unknown Device')
                              .toString();
                          final deviceType =
                              (device['deviceType'] ?? 'unknown').toString();
                          final batteryLevel = device['batteryLevel'];
                          final minutesSinceLastSeenRaw =
                              device['minutesSinceLastSeen'];
                          final minutesSinceLastSeen =
                              minutesSinceLastSeenRaw is int
                                  ? minutesSinceLastSeenRaw
                                  : (minutesSinceLastSeenRaw is num
                                      ? minutesSinceLastSeenRaw.toInt()
                                      : 0);

                          return Card(
                            margin: const EdgeInsets.symmetric(
                                horizontal: 16, vertical: 8),
                            elevation: 2,
                            child: ListTile(
                              leading: CircleAvatar(
                                backgroundColor: _getHealthColor(health),
                                child: const Icon(Icons.sensors,
                                    color: Colors.white),
                              ),
                              title: Text(
                                deviceName,
                                style: const TextStyle(
                                    fontWeight: FontWeight.bold),
                              ),
                              subtitle: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const SizedBox(height: 4),
                                  Text(
                                      'Type: ${deviceType.replaceAll('-', ' ').toUpperCase()}'),
                                  if (batteryLevel != null)
                                    Text('Battery: $batteryLevel%'),
                                  Text(
                                    minutesSinceLastSeen < 1
                                        ? 'Last seen: Just now'
                                        : 'Last seen: $minutesSinceLastSeen min ago',
                                    style: TextStyle(
                                      color: health == 'offline'
                                          ? Colors.red
                                          : Colors.grey[600],
                                      fontSize: 12,
                                    ),
                                  ),
                                ],
                              ),
                              trailing: Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color:
                                      _getHealthColor(health).withOpacity(0.2),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Text(
                                  health.toUpperCase(),
                                  style: TextStyle(
                                    color: _getHealthColor(health),
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                              onTap: () {
                                final deviceId =
                                    device['deviceId'] as String? ?? '';
                                final deviceName =
                                    device['deviceName'] as String? ??
                                        'Unknown Device';
                                final deviceType =
                                    device['deviceType'] as String? ??
                                        'unknown';
                                final deviceStatus =
                                    device['status'] as String? ?? 'unknown';

                                Navigator.push<void>(
                                  context,
                                  MaterialPageRoute<void>(
                                    builder: (context) => IoTDeviceDetailScreen(
                                      deviceId: deviceId,
                                      deviceName: deviceName,
                                      deviceType: deviceType,
                                      status: deviceStatus,
                                    ),
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
}
