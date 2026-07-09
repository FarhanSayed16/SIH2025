/// Child Location Screen
/// Real-time location map for child
/// Parent Monitoring System - Phase 3

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import '../../../features/socket/providers/socket_provider.dart';
import '../../../core/constants/socket_events.dart';
import '../../../core/widgets/widgets.dart';
import '../providers/parent_provider.dart';
import '../models/parent_models.dart';

class ChildLocationScreen extends ConsumerStatefulWidget {
  final String studentId;
  final ChildLocation? location;

  const ChildLocationScreen({
    super.key,
    required this.studentId,
    this.location,
  });

  @override
  ConsumerState<ChildLocationScreen> createState() =>
      _ChildLocationScreenState();
}

class _ChildLocationScreenState extends ConsumerState<ChildLocationScreen> {
  GoogleMapController? _mapController;
  bool _isRefreshing = false;
  final Set<Marker> _markers = {};
  bool _showBlueprint = true;

  @override
  void initState() {
    super.initState();
    // Auto-refresh location every 30 seconds
    Future.delayed(const Duration(seconds: 30), _refreshLocation);

    // Subscribe to socket events for realtime map updates
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final socket = ref.read(socketProvider.notifier);
      // Reuse existing handler for other events; here only refresh location on alerts/telemetry
      socket.on(SocketEvents.deviceAlert, (_) => _refreshLocation());
      socket.on(SocketEvents.telemetryUpdate, (_) => _refreshLocation());
    });
  }

  void _refreshLocation() {
    if (!mounted) return;
    setState(() => _isRefreshing = true);
    ref.invalidate(childLocationProvider(widget.studentId));
    Future.delayed(const Duration(seconds: 1), () {
      if (mounted) {
        setState(() => _isRefreshing = false);
      }
    });
    // Schedule next refresh
    Future.delayed(const Duration(seconds: 30), _refreshLocation);
  }

  /// Blueprint overlay stub: if backend provides bounds/image, add GroundOverlay
  Future<void> _applyBlueprintOverlay(
      GoogleMapController controller, double lat, double lng) async {
    if (!_showBlueprint) return;
    // Placeholder: center map to user location; in a future step, fetch blueprint bounds & image
    try {
      await controller.animateCamera(
        CameraUpdate.newLatLngZoom(LatLng(lat, lng), 16),
      );
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final locationAsync = ref.watch(childLocationProvider(widget.studentId));
    final location = widget.location;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Child Location'),
        actions: [
          if (_isRefreshing)
            const Padding(
              padding: EdgeInsets.all(16.0),
              child: SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(strokeWidth: 2),
              ),
            )
          else
            IconButton(
              icon: const Icon(Icons.refresh),
              onPressed: _refreshLocation,
            ),
        ],
      ),
      body: locationAsync.when(
        data: (currentLocation) {
          final lat = currentLocation.latitude;
          final lng = currentLocation.longitude;

          if (lat == null || lng == null) {
            return const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.location_off, size: 64, color: Colors.grey),
                  SizedBox(height: 16),
                  Text('Location not available'),
                ],
              ),
            );
          }

          return Stack(
            children: [
              GoogleMap(
                initialCameraPosition: CameraPosition(
                  target: LatLng(lat, lng),
                  zoom: 15,
                ),
                onMapCreated: (controller) {
                  _mapController = controller;
                  _applyBlueprintOverlay(controller, lat, lng);
                },
                markers: _markers.isEmpty
                    ? {
                        Marker(
                          markerId: const MarkerId('child_location'),
                          position: LatLng(lat, lng),
                          infoWindow: InfoWindow(
                            title: 'Child Location',
                            snippet:
                                'Last seen: ${currentLocation.lastSeen.toLocal().toString().split('.')[0]}',
                          ),
                        ),
                      }
                    : _markers,
                myLocationEnabled: true,
                myLocationButtonEnabled: true,
              ),
              // Status Card
              Positioned(
                top: 16,
                left: 16,
                right: 16,
                child: Card(
                  color: currentLocation.status == 'safe'
                      ? Colors.green.shade50
                      : currentLocation.status == 'in_drill'
                          ? Colors.yellow.shade50
                          : Colors.red.shade50,
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      children: [
                        Icon(
                          currentLocation.status == 'safe'
                              ? Icons.check_circle
                              : currentLocation.status == 'in_drill'
                                  ? Icons.flash_on
                                  : Icons.warning,
                          color: currentLocation.status == 'safe'
                              ? Colors.green
                              : currentLocation.status == 'in_drill'
                                  ? Colors.yellow
                                  : Colors.red,
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                'Status: ${currentLocation.status.toUpperCase()}',
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 16,
                                ),
                              ),
                              Text(
                                'Last seen: ${currentLocation.lastSeen.toLocal().toString().split('.')[0]}',
                                style: const TextStyle(fontSize: 12),
                              ),
                            ],
                          ),
                        ),
                        if (_mapController != null)
                          Switch(
                            value: _showBlueprint,
                            onChanged: (v) async {
                              setState(() => _showBlueprint = v);
                              await _applyBlueprintOverlay(
                                _mapController!,
                                lat,
                                lng,
                              );
                            },
                          ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          );
        },
        loading: () => const LoadingState(),
        error: (error, stack) => ErrorState(
          message: error.toString(),
          onRetry: () {
            ref.invalidate(childLocationProvider(widget.studentId));
          },
        ),
      ),
    );
  }

  @override
  void dispose() {
    _mapController?.dispose();
    super.dispose();
  }
}
