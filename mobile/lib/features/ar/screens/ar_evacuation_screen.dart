/// Phase 5.5: AR Evacuation Screen
/// Phase 101.7.3: Enhanced with new component library
/// Displays AR overlay with evacuation path arrows and compass fallback

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:geolocator/geolocator.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'dart:async';
import 'dart:math' as math;
import '../../../core/widgets/widgets.dart';
import '../../../core/design/design_system.dart';
import '../services/ar_evacuation_service.dart';
import '../models/waypoint.dart';
import '../providers/ar_provider.dart';

/// AR Evacuation Screen
class AREvacuationScreen extends ConsumerStatefulWidget {
  final String? schoolId;
  final String? alertType;
  final String? alertId;

  const AREvacuationScreen({
    super.key,
    this.schoolId,
    this.alertType,
    this.alertId,
  });

  @override
  ConsumerState<AREvacuationScreen> createState() => _AREvacuationScreenState();
}

class _AREvacuationScreenState extends ConsumerState<AREvacuationScreen> {
  AREvacuationService? _arService;
  Position? _currentPosition;
  ARPath? _currentPath;
  CompassNavigationData? _compassData;
  
  bool _isLoading = true;
  bool _isInitializing = true;
  
  Timer? _locationUpdateTimer;
  Timer? _compassUpdateTimer;
  
  @override
  void initState() {
    super.initState();
    _initializeService();
  }
  
  Future<void> _initializeService() async {
    try {
      _arService = ref.read(arEvacuationServiceProvider);
      
      // Set up callbacks
      _arService!.onModeChanged = (mode) {
        if (mounted) {
          setState(() {});
        }
      };
      
      _arService!.onPathChanged = (path) {
        if (mounted) {
          setState(() {
            _currentPath = path;
          });
        }
      };
      
      // Get current location
      await _getCurrentLocation();
      
      // Load evacuation path
      if (widget.schoolId != null && _currentPosition != null) {
        await _loadEvacuationPath();
      }
      
      // Start location updates
      _startLocationUpdates();
      
      // Start compass updates (if in compass mode)
      _startCompassUpdates();
      
      if (mounted) {
        setState(() {
          _isLoading = false;
          _isInitializing = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _isInitializing = false;
        });
        
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to initialize AR evacuation: $e'),
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
      
      _arService?.updatePosition(_currentPosition!);
    } catch (e) {
      print('❌ Get location error: $e');
      rethrow;
    }
  }
  
  Future<void> _loadEvacuationPath() async {
    if (_arService == null || widget.schoolId == null) return;
    
    try {
      final path = await _arService!.loadEvacuationPath(
        schoolId: widget.schoolId!,
        startPosition: _currentPosition,
        alertType: widget.alertType,
      );
      
      if (path != null) {
        setState(() {
          _currentPath = path;
        });
      }
    } catch (e) {
      print('❌ Load evacuation path error: $e');
    }
  }
  
  void _startLocationUpdates() {
    _locationUpdateTimer = Timer.periodic(
      const Duration(seconds: 3),
      (timer) async {
        try {
          final position = await Geolocator.getCurrentPosition(
            desiredAccuracy: LocationAccuracy.high,
          );
          
          if (mounted) {
            setState(() {
              _currentPosition = position;
            });
            
            _arService?.updatePosition(position);
          }
        } catch (e) {
          print('⚠️ Location update error: $e');
        }
      },
    );
  }
  
  void _startCompassUpdates() {
    _compassUpdateTimer = Timer.periodic(
      const Duration(milliseconds: 500),
      (timer) async {
        if (_arService?.currentMode == AREvacuationMode.compass) {
          final compassData = await _arService!.getCompassNavigationData();
          
          if (mounted && compassData != null) {
            setState(() {
              _compassData = compassData;
            });
          }
        }
      },
    );
  }
  
  @override
  void dispose() {
    _locationUpdateTimer?.cancel();
    _compassUpdateTimer?.cancel();
    super.dispose();
  }
  
  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        backgroundColor: Colors.black,
        body: const Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CircularProgressIndicator(color: Colors.white),
              SizedBox(height: 20),
              Text(
                'Initializing AR Evacuation...',
                style: TextStyle(color: Colors.white, fontSize: 16),
              ),
            ],
          ),
        ),
      );
    }
    
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          // Camera/AR View
          _buildARView(),
          
          // Overlay UI
          SafeArea(
            child: Column(
              children: [
                _buildTopBar(),
                if (_isInitializing) _buildInitializationStatus(),
              ],
            ),
          ),
          
          // Bottom Navigation Info
          SafeArea(
            child: Align(
              alignment: Alignment.bottomCenter,
              child: _buildNavigationInfo(),
            ),
          ),
          
          // Compass Overlay (if in compass mode)
          if (_arService?.currentMode == AREvacuationMode.compass && _compassData != null)
            _buildCompassOverlay(),
        ],
      ),
    );
  }
  
  Widget _buildARView() {
    // TODO: Integrate with actual AR camera view when plugin is added
    // For now, show placeholder or camera preview
    return Container(
      color: Colors.black,
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              _arService?.currentMode == AREvacuationMode.ar
                  ? Icons.view_in_ar
                  : Icons.explore,
              size: 64,
              color: Colors.white.withOpacity(0.3),
            ),
            const SizedBox(height: 16),
            Text(
              _arService?.currentMode == AREvacuationMode.ar
                  ? 'AR Mode Active'
                  : 'Compass Mode Active',
              style: TextStyle(
                color: Colors.white.withOpacity(0.5),
                fontSize: 16,
              ),
            ),
          ],
        ),
      ),
    );
  }
  
  Widget _buildTopBar() {
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.8),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          IconButton(
            icon: const Icon(Icons.close, color: Colors.white),
            onPressed: () => Navigator.of(context).pop(),
          ),
          Column(
            children: [
              Text(
                'AR Evacuation',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              if (_arService != null)
                Text(
                  _arService!.currentMode == AREvacuationMode.ar
                      ? 'AR Mode'
                      : 'Compass Mode',
                  style: TextStyle(
                    color: Colors.green,
                    fontSize: 12,
                  ),
                ),
            ],
          ),
          IconButton(
            icon: const Icon(Icons.refresh, color: Colors.white),
            onPressed: () {
              _loadEvacuationPath();
            },
          ),
        ],
      ),
    );
  }
  
  Widget _buildInitializationStatus() {
    final status = _arService?.planeDetectionStatus;
    
    if (status == null || status == ARPlaneDetectionStatus.unavailable) {
      return const SizedBox.shrink();
    }
    
    String statusText = 'Detecting planes...';
    Color statusColor = Colors.orange;
    
    if (status == ARPlaneDetectionStatus.detected) {
      statusText = 'AR Ready';
      statusColor = Colors.green;
    } else if (status == ARPlaneDetectionStatus.failed) {
      statusText = 'Using Compass Mode';
      statusColor = Colors.blue;
    }
    
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: statusColor.withOpacity(0.2),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: statusColor, width: 1),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          SizedBox(
            width: 16,
            height: 16,
            child: CircularProgressIndicator(
              strokeWidth: 2,
              valueColor: AlwaysStoppedAnimation<Color>(statusColor),
            ),
          ),
          const SizedBox(width: 12),
          Text(
            statusText,
            style: TextStyle(
              color: statusColor,
              fontSize: 14,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildNavigationInfo() {
    if (_currentPath == null) {
      return Container(
        margin: const EdgeInsets.all(16),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.black.withOpacity(0.9),
          borderRadius: BorderRadius.circular(20),
        ),
        child: const Text(
          'Calculating evacuation path...',
          style: TextStyle(color: Colors.white, fontSize: 16),
        ),
      );
    }
    
    if (_arService?.currentMode == AREvacuationMode.compass && _compassData != null) {
      return _buildCompassNavigationInfo(_compassData!);
    }
    
    return _buildARNavigationInfo();
  }
  
  Widget _buildARNavigationInfo() {
    final nextWaypoint = _arService?.nextWaypoint;
    final distance = nextWaypoint != null && _currentPosition != null
        ? Geolocator.distanceBetween(
            _currentPosition!.latitude,
            _currentPosition!.longitude,
            nextWaypoint.position.latitude,
            nextWaypoint.position.longitude,
          )
        : _currentPath?.totalDistance ?? 0.0;
    
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
          Row(
            children: [
              const Icon(Icons.navigation, color: Colors.green, size: 28),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  nextWaypoint?.name ?? 'Safe Zone',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildInfoItem(
                icon: Icons.straighten,
                label: 'Distance',
                value: _formatDistance(distance),
              ),
              _buildInfoItem(
                icon: Icons.timer,
                label: 'ETA',
                value: _formatETA(distance),
              ),
              if (_currentPath != null)
                _buildInfoItem(
                  icon: Icons.flag,
                  label: 'Total',
                  value: _formatDistance(_currentPath!.totalDistance),
                ),
            ],
          ),
          if (_currentPath != null && _currentPath!.waypoints.isNotEmpty) ...[
            const SizedBox(height: 12),
            LinearProgressIndicator(
              value: _calculateProgress(),
              backgroundColor: Colors.grey[800],
              valueColor: const AlwaysStoppedAnimation<Color>(Colors.green),
            ),
          ],
        ],
      ),
    );
  }
  
  Widget _buildCompassNavigationInfo(CompassNavigationData data) {
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.blue.withOpacity(0.2),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.blue, width: 2),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            children: [
              const Icon(Icons.explore, color: Colors.blue, size: 28),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      data.waypoint.name,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Text(
                      data.cardinalDirection,
                      style: const TextStyle(
                        color: Colors.blue,
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildInfoItem(
                icon: Icons.straighten,
                label: 'Distance',
                value: data.formattedDistance,
              ),
              _buildInfoItem(
                icon: Icons.explore,
                label: 'Direction',
                value: data.turnDirection,
              ),
              _buildInfoItem(
                icon: Icons.timer,
                label: 'ETA',
                value: data.estimatedTime,
              ),
            ],
          ),
        ],
      ),
    );
  }
  
  Widget _buildCompassOverlay() {
    if (_compassData == null) return const SizedBox.shrink();
    
    return Center(
      child: CompassWidget(
        targetBearing: _compassData!.targetBearing,
        currentHeading: _compassData!.currentHeading,
        distance: _compassData!.distance,
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
  
  String _formatETA(double meters) {
    const walkingSpeedMs = 1.4; // 1.4 m/s average walking speed
    final seconds = (meters / walkingSpeedMs).round();
    final minutes = (seconds / 60).round();
    
    if (minutes < 1) {
      return '< 1 min';
    }
    return '$minutes min';
  }
  
  double _calculateProgress() {
    if (_currentPath == null || _currentPosition == null) return 0.0;
    
    // Calculate progress based on distance traveled
    final remainingDistance = _arService?.nextWaypoint != null
        ? Geolocator.distanceBetween(
            _currentPosition!.latitude,
            _currentPosition!.longitude,
            _arService!.nextWaypoint!.position.latitude,
            _arService!.nextWaypoint!.position.longitude,
          )
        : _currentPath!.totalDistance;
    
    final progress = 1.0 - (remainingDistance / _currentPath!.totalDistance);
    return progress.clamp(0.0, 1.0);
  }
}

/// Compass Widget - Shows directional compass with target bearing
class CompassWidget extends StatelessWidget {
  final double targetBearing;  // Bearing to target (0-360)
  final double currentHeading; // Current device heading (0-360)
  final double distance;       // Distance to target
  
  const CompassWidget({
    super.key,
    required this.targetBearing,
    required this.currentHeading,
    required this.distance,
  });
  
  @override
  Widget build(BuildContext context) {
    // Calculate relative bearing
    double relative = targetBearing - currentHeading;
    if (relative > 180) relative -= 360;
    if (relative < -180) relative += 360;
    
    return Container(
      width: 200,
      height: 200,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: Colors.blue.withOpacity(0.3),
        border: Border.all(color: Colors.blue, width: 3),
      ),
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Compass background
          CustomPaint(
            painter: CompassPainter(
              targetBearing: targetBearing,
              currentHeading: currentHeading,
            ),
            size: const Size(200, 200),
          ),
          
          // Center arrow pointing to target
          Transform.rotate(
            angle: relative * (math.pi / 180),
            child: const Icon(
              Icons.arrow_upward,
              color: Colors.red,
              size: 40,
            ),
          ),
          
          // Distance label
          Positioned(
            bottom: 10,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.7),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                distance < 1000
                    ? '${distance.toInt()}m'
                    : '${(distance / 1000).toStringAsFixed(1)}km',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Compass Painter - Draws compass dial with cardinal directions
class CompassPainter extends CustomPainter {
  final double targetBearing;
  final double currentHeading;
  
  CompassPainter({
    required this.targetBearing,
    required this.currentHeading,
  });
  
  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2;
    
    // Draw cardinal directions
    final directions = ['N', 'E', 'S', 'W'];
    final angles = [0.0, 90.0, 180.0, 270.0];
    
    for (int i = 0; i < directions.length; i++) {
      final angle = angles[i] - currentHeading;
      final rad = angle * (math.pi / 180);
      
      final x = center.dx + (radius - 20) * math.sin(rad);
      final y = center.dy - (radius - 20) * math.cos(rad);
      
      final textPainter = TextPainter(
        text: TextSpan(
          text: directions[i],
          style: const TextStyle(
            color: Colors.white,
            fontSize: 20,
            fontWeight: FontWeight.bold,
          ),
        ),
        textDirection: TextDirection.ltr,
      );
      textPainter.layout();
      textPainter.paint(
        canvas,
        Offset(x - textPainter.width / 2, y - textPainter.height / 2),
      );
    }
    
    // Draw tick marks
    final paint = Paint()
      ..color = Colors.white.withOpacity(0.5)
      ..strokeWidth = 2;
    
    for (int i = 0; i < 12; i++) {
      final angle = (i * 30) - currentHeading;
      final rad = angle * (math.pi / 180);
      
      final startX = center.dx + (radius - 15) * math.sin(rad);
      final startY = center.dy - (radius - 15) * math.cos(rad);
      final endX = center.dx + (radius - 5) * math.sin(rad);
      final endY = center.dy - (radius - 5) * math.cos(rad);
      
      canvas.drawLine(
        Offset(startX, startY),
        Offset(endX, endY),
        paint,
      );
    }
  }
  
  @override
  bool shouldRepaint(CompassPainter oldDelegate) {
    return targetBearing != oldDelegate.targetBearing ||
        currentHeading != oldDelegate.currentHeading;
  }
}

