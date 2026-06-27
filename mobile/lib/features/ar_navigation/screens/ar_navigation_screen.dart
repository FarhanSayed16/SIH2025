/// Phase 4.7: AR Navigation Screen
/// Camera-based navigation with route overlay and AR markers

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:camera/camera.dart';
import 'package:geolocator/geolocator.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/ar_navigation_service.dart';
import 'dart:async';
import '../../maps/models/map_models.dart';

/// AR Navigation Screen
class ARNavigationScreen extends ConsumerStatefulWidget {
  final String? schoolId;
  final String? alertType;
  final String? alertId;

  const ARNavigationScreen({
    super.key,
    this.schoolId,
    this.alertType,
    this.alertId,
  });

  @override
  ConsumerState<ARNavigationScreen> createState() => _ARNavigationScreenState();
}

class _ARNavigationScreenState extends ConsumerState<ARNavigationScreen> {
  CameraController? _cameraController;
  List<CameraDescription>? _cameras;
  bool _isCameraInitialized = false;
  bool _isLoading = true;

  ARRoute? _currentRoute;
  List<ARMarker> _markers = [];
  Position? _currentPosition;

  ARNavigationService? _arService;
  NavigationRouteModel? _blueprintRoute;
  int _currentInstructionIndex = 0;

  Timer? _locationUpdateTimer;
  Timer? _routeRefreshTimer;

  @override
  void initState() {
    super.initState();
    _initializeCamera();
    _initializeAR();
  }

  Future<void> _initializeCamera() async {
    try {
      _cameras = await availableCameras();
      if (_cameras != null && _cameras!.isNotEmpty) {
        _cameraController = CameraController(
          _cameras![0],
          ResolutionPreset.high,
          enableAudio: false,
        );

        await _cameraController!.initialize();

        if (mounted) {
          setState(() {
            _isCameraInitialized = true;
          });
        }
      }
    } catch (e) {
      print('❌ Camera initialization error: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Camera access denied or unavailable'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _initializeAR() async {
    try {
      _arService = ARNavigationService();

      // Get current location
      await _getCurrentLocation();

      if (_currentPosition != null && widget.schoolId != null) {
        // Calculate route to nearest safe zone
        await _calculateRoute();

        // Load AR markers
        await _loadMarkers();

        // Fetch blueprint-based indoor route (placeholder from (0,0) to (100,100); replace with real target)
        try {
          _blueprintRoute = await _arService!.getBlueprintRoute(
            schoolId: widget.schoolId!,
            fromX: 0,
            fromY: 0,
            toX: 100,
            toY: 100,
            floor: 0,
          );
          if (mounted) {
            setState(() {});
          }
        } catch (_) {
          // Non-fatal; ignore
        }
      }

      // Start location updates
      _startLocationUpdates();

      // Start route refresh
      _startRouteRefresh();

      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    } catch (e) {
      print('❌ AR initialization error: $e');
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to initialize AR navigation: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _getCurrentLocation() async {
    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        throw Exception('Location services are disabled');
      }

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          throw Exception('Location permissions are denied');
        }
      }

      if (permission == LocationPermission.deniedForever) {
        throw Exception('Location permissions are permanently denied');
      }

      _currentPosition = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );
    } catch (e) {
      print('❌ Get location error: $e');
      rethrow;
    }
  }

  Future<void> _calculateRoute() async {
    if (_currentPosition == null ||
        widget.schoolId == null ||
        _arService == null) {
      return;
    }

    try {
      final route = await _arService!.calculateRoute(
        schoolId: widget.schoolId!,
        startLat: _currentPosition!.latitude,
        startLng: _currentPosition!.longitude,
        alertType: widget.alertType,
      );

      if (mounted) {
        setState(() {
          _currentRoute = route;
          _currentInstructionIndex = 0;
        });
      }
    } catch (e) {
      print('❌ Calculate route error: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to calculate route: $e'),
            backgroundColor: Colors.orange,
          ),
        );
      }
    }
  }

  Future<void> _loadMarkers() async {
    if (widget.schoolId == null || _arService == null) {
      return;
    }

    try {
      final markers = await _arService!.getMarkers(
        schoolId: widget.schoolId!,
        alertType: widget.alertType,
      );

      if (mounted) {
        setState(() {
          _markers = markers;
        });
      }
    } catch (e) {
      print('❌ Load markers error: $e');
    }
  }

  void _startLocationUpdates() {
    _locationUpdateTimer =
        Timer.periodic(const Duration(seconds: 5), (timer) async {
      try {
        final position = await Geolocator.getCurrentPosition(
          desiredAccuracy: LocationAccuracy.high,
        );

        if (mounted) {
          setState(() {
            _currentPosition = position;
          });

          // Update current instruction based on proximity to waypoints
          _updateCurrentInstruction();
        }
      } catch (e) {
        print('❌ Location update error: $e');
      }
    });
  }

  void _startRouteRefresh() {
    _routeRefreshTimer = Timer.periodic(const Duration(seconds: 30), (timer) {
      if (_currentPosition != null && widget.schoolId != null) {
        _calculateRoute();
      }
    });
  }

  void _updateCurrentInstruction() {
    if (_currentRoute == null ||
        _currentRoute!.instructions.isEmpty ||
        _currentPosition == null) {
      return;
    }

    // Find nearest waypoint/instruction
    double minDistance = double.infinity;
    int nearestIndex = 0;

    for (int i = 0; i < _currentRoute!.instructions.length; i++) {
      final instruction = _currentRoute!.instructions[i];
      final distance = Geolocator.distanceBetween(
        _currentPosition!.latitude,
        _currentPosition!.longitude,
        instruction.lat,
        instruction.lng,
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearestIndex = i;
      }
    }

    // Update if we're closer to a different instruction
    if (minDistance < 50 && nearestIndex != _currentInstructionIndex) {
      if (mounted) {
        setState(() {
          _currentInstructionIndex = nearestIndex;
        });
      }
    }
  }

  @override
  void dispose() {
    _locationUpdateTimer?.cancel();
    _routeRefreshTimer?.cancel();
    _cameraController?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        backgroundColor: Colors.black,
        body: const Center(
          child: CircularProgressIndicator(
            color: Colors.white,
          ),
        ),
      );
    }

    if (!_isCameraInitialized || _cameraController == null) {
      return Scaffold(
        backgroundColor: Colors.black,
        appBar: AppBar(
          backgroundColor: Colors.black,
          leading: IconButton(
            icon: const Icon(Icons.close, color: Colors.white),
            onPressed: () => Navigator.of(context).pop(),
          ),
          title: const Text(
            'AR Navigation',
            style: TextStyle(color: Colors.white),
          ),
        ),
        body: const Center(
          child: Text(
            'Camera not available',
            style: TextStyle(color: Colors.white),
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          // Camera Preview
          SizedBox.expand(
            child: CameraPreview(_cameraController!),
          ),

          // AR Overlay
          _buildAROverlay(),

          // Top Bar
          SafeArea(
            child: _buildTopBar(),
          ),

          // Bottom Navigation Info
          SafeArea(
            child: Align(
              alignment: Alignment.bottomCenter,
              child: _buildNavigationInfo(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTopBar() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.7),
        borderRadius: const BorderRadius.only(
          bottomLeft: Radius.circular(20),
          bottomRight: Radius.circular(20),
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          IconButton(
            icon: const Icon(Icons.close, color: Colors.white, size: 28),
            onPressed: () => Navigator.of(context).pop(),
          ),
          const Text(
            'AR Navigation',
            style: TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          IconButton(
            icon: const Icon(Icons.refresh, color: Colors.white, size: 28),
            onPressed: () {
              _calculateRoute();
              _loadMarkers();
            },
          ),
        ],
      ),
    );
  }

  Widget _buildAROverlay() {
    return CustomPaint(
      painter: ARRoutePainter(
        route: _currentRoute,
        markers: _markers,
        currentPosition: _currentPosition,
      ),
      child: const SizedBox.expand(),
    );
  }

  Widget _buildNavigationInfo() {
    if (_currentRoute == null ||
        _currentRoute!.instructions.isEmpty ||
        _currentInstructionIndex >= _currentRoute!.instructions.length) {
      return Container(
        margin: const EdgeInsets.all(16),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.black.withOpacity(0.8),
          borderRadius: BorderRadius.circular(16),
        ),
        child: const Text(
          'Calculating route...',
          style: TextStyle(color: Colors.white, fontSize: 16),
        ),
      );
    }

    final currentInstruction =
        _currentRoute!.instructions[_currentInstructionIndex];
    final distanceToDestination = _currentPosition != null
        ? Geolocator.distanceBetween(
            _currentPosition!.latitude,
            _currentPosition!.longitude,
            _currentRoute!.endLocation.lat,
            _currentRoute!.endLocation.lng,
          )
        : _currentRoute!.totalDistance;

    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.9),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.green, width: 2),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Current Instruction
          Row(
            children: [
              const Icon(Icons.navigation, color: Colors.green, size: 28),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  currentInstruction.instruction,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Distance and Time
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildInfoItem(
                icon: Icons.straighten,
                label: 'Distance',
                value: _formatDistance(distanceToDestination),
              ),
              _buildInfoItem(
                icon: Icons.timer,
                label: 'Time',
                value: _formatTime(distanceToDestination),
              ),
              _buildInfoItem(
                icon: Icons.flag,
                label: 'Destination',
                value: _currentRoute!.endLocation.name ?? 'Safe Zone',
              ),
            ],
          ),

          // Progress Indicator
          if (_currentRoute!.instructions.length > 1) ...[
            const SizedBox(height: 12),
            LinearProgressIndicator(
              value: (_currentInstructionIndex + 1) /
                  _currentRoute!.instructions.length,
              backgroundColor: Colors.grey[800],
              valueColor: const AlwaysStoppedAnimation<Color>(Colors.green),
            ),
            const SizedBox(height: 4),
            Text(
              'Step ${_currentInstructionIndex + 1} of ${_currentRoute!.instructions.length}',
              style: TextStyle(
                color: Colors.grey[400],
                fontSize: 12,
              ),
            ),
          ],

          if (_blueprintRoute != null) ...[
            const SizedBox(height: 12),
            Text(
              'Indoor (blueprint) route preview',
              style: TextStyle(
                color: Colors.grey[300],
                fontSize: 13,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            SizedBox(
              height: 160,
              child: _IndoorRoutePreview(route: _blueprintRoute!),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildInfoItem({
    required IconData icon,
    required String label,
    required String value,
  }) {
    return Column(
      children: [
        Icon(icon, color: Colors.green, size: 20),
        const SizedBox(height: 4),
        Text(
          value,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 14,
            fontWeight: FontWeight.bold,
          ),
        ),
        Text(
          label,
          style: TextStyle(
            color: Colors.grey[400],
            fontSize: 10,
          ),
        ),
      ],
    );
  }

  String _formatDistance(double meters) {
    if (meters < 1000) {
      return '${meters.toInt()}m';
    }
    return '${(meters / 1000).toStringAsFixed(1)}km';
  }

  String _formatTime(double meters) {
    // Average walking speed: 1.4 m/s
    final seconds = (meters / 1.4).round();
    final minutes = (seconds / 60).round();

    if (minutes < 1) {
      return '< 1 min';
    }
    return '$minutes min';
  }
}

class _IndoorRoutePreview extends StatelessWidget {
  final NavigationRouteModel route;
  const _IndoorRoutePreview({required this.route});

  @override
  Widget build(BuildContext context) {
    if (route.route.isEmpty) {
      return const Center(
          child:
              Text('No indoor route', style: TextStyle(color: Colors.white70)));
    }
    // Normalize to container size 1x1, then fit into box with padding
    double minX = route.route.map((p) => p.x).reduce((a, b) => a < b ? a : b);
    double maxX = route.route.map((p) => p.x).reduce((a, b) => a > b ? a : b);
    double minY = route.route.map((p) => p.y).reduce((a, b) => a < b ? a : b);
    double maxY = route.route.map((p) => p.y).reduce((a, b) => a > b ? a : b);
    double dx = (maxX - minX).abs();
    double dy = (maxY - minY).abs();
    if (dx == 0) dx = 1;
    if (dy == 0) dy = 1;

    List<Offset> normalized = route.route
        .map((p) => Offset((p.x - minX) / dx, (p.y - minY) / dy))
        .toList();

    return Container(
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.4),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white24),
      ),
      padding: const EdgeInsets.all(8),
      child: LayoutBuilder(
        builder: (context, constraints) {
          final w = constraints.maxWidth;
          final h = constraints.maxHeight;
          final pts =
              normalized.map((p) => Offset(p.dx * w, p.dy * h)).toList();
          return CustomPaint(
            painter: _IndoorRoutePainter(points: pts),
          );
        },
      ),
    );
  }
}

class _IndoorRoutePainter extends CustomPainter {
  final List<Offset> points;
  _IndoorRoutePainter({required this.points});

  @override
  void paint(Canvas canvas, Size size) {
    if (points.length < 2) return;
    final path = Path()..moveTo(points.first.dx, points.first.dy);
    for (int i = 1; i < points.length; i++) {
      path.lineTo(points[i].dx, points[i].dy);
    }
    final paint = Paint()
      ..color = Colors.orangeAccent
      ..strokeWidth = 3
      ..style = PaintingStyle.stroke;
    canvas.drawPath(path, paint);

    final dotPaint = Paint()
      ..color = Colors.orangeAccent
      ..style = PaintingStyle.fill;
    for (final p in points) {
      canvas.drawCircle(p, 4, dotPaint);
    }
  }

  @override
  bool shouldRepaint(covariant _IndoorRoutePainter oldDelegate) {
    return oldDelegate.points != points;
  }
}

/// Custom Painter for AR Route Overlay
class ARRoutePainter extends CustomPainter {
  final ARRoute? route;
  final List<ARMarker> markers;
  final Position? currentPosition;

  ARRoutePainter({
    this.route,
    required this.markers,
    this.currentPosition,
  });

  @override
  void paint(Canvas canvas, Size size) {
    // This is a simplified overlay painter
    // In a real AR implementation, you would:
    // 1. Project GPS coordinates to screen coordinates
    // 2. Draw route lines connecting waypoints
    // 3. Draw AR markers at their positions
    // 4. Draw navigation arrows and directions

    // For now, we'll show a simplified version
    if (route == null || route!.waypoints.isEmpty) return;

    final paint = Paint()
      ..color = Colors.green
      ..strokeWidth = 4
      ..style = PaintingStyle.stroke;

    // Draw route path (simplified - would need proper coordinate projection)
    final path = Path();
    // In real implementation, convert GPS coords to screen coords

    canvas.drawPath(path, paint);

    // Draw markers
    // In real implementation, project marker location to screen coordinates
    // and draw AR markers at their positions
    // For now, placeholder for future AR overlay implementation
    // ignore: unused_local_variable
    for (final marker in markers) {
      // Would draw marker at projected screen coordinates
    }
  }

  @override
  bool shouldRepaint(ARRoutePainter oldDelegate) {
    return route != oldDelegate.route ||
        markers.length != oldDelegate.markers.length ||
        currentPosition != oldDelegate.currentPosition;
  }
}
