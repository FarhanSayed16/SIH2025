/// Phase 5.6: AR Fire Simulation Screen
/// Interactive AR drill for fire safety training

import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'dart:async';

import '../services/ar_fire_simulation_service.dart';
import '../models/fire_instance.dart';
import '../../drills/models/drill_model.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/ar_provider.dart';

/// AR Fire Simulation Screen
class ARFireSimulationScreen extends ConsumerStatefulWidget {
  final String drillId;
  final DrillModel? drill;
  final bool isTeacherMode; // True for teacher, false for student

  const ARFireSimulationScreen({
    super.key,
    required this.drillId,
    this.drill,
    required this.isTeacherMode,
  });

  @override
  ConsumerState<ARFireSimulationScreen> createState() => _ARFireSimulationScreenState();
}

class _ARFireSimulationScreenState extends ConsumerState<ARFireSimulationScreen> {
  ARFireSimulationService? _fireService;
  bool _isInitialized = false;
  bool _isLoading = true;
  
  List<FireInstance> _activeFires = [];
  FireInstance? _selectedFire;
  Position? _currentPosition;
  
  Timer? _updateTimer;

  @override
  void initState() {
    super.initState();
    _initialize();
  }

  Future<void> _initialize() async {
    try {
      _fireService = ref.read(arFireSimulationServiceProvider);
      
      // Initialize drill
      await _fireService!.initializeDrill(widget.drillId);
      
      // Set up callbacks
      _fireService!.onFiresChanged = (fires) {
        if (mounted) {
          setState(() {
            _activeFires = fires;
          });
        }
      };
      
      _fireService!.onFireExtinguished = (fire) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('🔥 Fire extinguished! Score: ${fire.score ?? 0}'),
              backgroundColor: Colors.green,
              duration: const Duration(seconds: 2),
            ),
          );
        }
      };
      
      _fireService!.onResultRecorded = (result) {
        if (mounted && kDebugMode) {
          print('✅ Result recorded: ${result.score} points');
        }
      };
      
      // Get current position
      await _getCurrentPosition();
      
      // Start update timer
      _updateTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
        _updateFireDistances();
      });
      
      if (mounted) {
        setState(() {
          _isInitialized = true;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
        
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error initializing fire simulation: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _getCurrentPosition() async {
    try {
      final position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );
      if (mounted) {
        setState(() {
          _currentPosition = position;
        });
      }
    } catch (e) {
      if (kDebugMode) {
        print('⚠️ Error getting position: $e');
      }
    }
  }

  void _updateFireDistances() {
    if (_currentPosition != null) {
      setState(() {
        // Update distances are calculated in UI
      });
    }
  }

  /// Teacher Mode: Place fire at current position
  Future<void> _placeFire() async {
    if (_fireService == null || _currentPosition == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Wait for GPS fix before placing fire'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }
    
    try {
      final fire = await _fireService!.placeFire();
      if (fire != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('🔥 Fire placed!'),
            backgroundColor: Colors.red,
            duration: Duration(seconds: 1),
          ),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error placing fire: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  /// Student Mode: Extinguish selected fire
  Future<void> _extinguishFire(FireInstance fire) async {
    if (_fireService == null) return;
    
    final authState = ref.read(authProvider);
    final userId = authState.user?.id;
    
    try {
      final result = await _fireService!.extinguishFire(
        fireId: fire.id,
        userId: userId,
      );
      
      if (result != null) {
        setState(() {
          _selectedFire = null;
        });
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error extinguishing fire: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  @override
  void dispose() {
    _updateTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        backgroundColor: Colors.black,
        body: Center(
          child: CircularProgressIndicator(
            color: Colors.orange,
          ),
        ),
      );
    }
    
    if (!_isInitialized) {
      return Scaffold(
        backgroundColor: Colors.black,
        appBar: AppBar(
          title: const Text('Fire Simulation'),
          backgroundColor: Colors.black,
        ),
        body: const Center(
          child: Text(
            'Failed to initialize',
            style: TextStyle(color: Colors.white),
          ),
        ),
      );
    }
    
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        title: Text(widget.isTeacherMode ? 'Teacher Mode' : 'Student Mode'),
        backgroundColor: Colors.black,
        actions: [
          IconButton(
            icon: const Icon(Icons.info_outline),
            onPressed: () {
              _showStatistics();
            },
          ),
        ],
      ),
      body: Stack(
        children: [
          // Camera/AR View (placeholder - would use AR plugin here)
          _buildARView(),
          
          // Fire markers overlay
          if (_activeFires.isNotEmpty)
            _buildFireMarkers(),
          
          // Bottom controls
          SafeArea(
            child: Align(
              alignment: Alignment.bottomCenter,
              child: widget.isTeacherMode
                  ? _buildTeacherControls()
                  : _buildStudentControls(),
            ),
          ),
          
          // Top status bar
          SafeArea(
            child: Align(
              alignment: Alignment.topCenter,
              child: _buildStatusBar(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildARView() {
    // Placeholder for AR camera view
    // In real implementation, this would use AR plugin
    return Container(
      color: Colors.black,
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.camera_alt,
              size: 100,
              color: Colors.white.withOpacity(0.3),
            ),
            const SizedBox(height: 16),
            Text(
              widget.isTeacherMode
                  ? 'Tap to place fires'
                  : 'Find and extinguish fires',
              style: TextStyle(
                color: Colors.white.withOpacity(0.7),
                fontSize: 18,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFireMarkers() {
    // Display fire markers on screen
    // In real AR implementation, fires would be placed in 3D space
    return Container(
      child: Stack(
        children: _activeFires.map((fire) {
          if (fire.isExtinguished) return const SizedBox.shrink();
          
          final distance = _currentPosition != null
              ? fire.distanceTo(_currentPosition!)
              : null;
          
          return Positioned(
            left: 50.0 + (fire.id.hashCode % 200).toDouble(),
            top: 100.0 + ((fire.id.hashCode ~/ 200) % 300).toDouble(),
            child: GestureDetector(
              onTap: () {
                if (!widget.isTeacherMode) {
                  setState(() {
                    _selectedFire = fire;
                  });
                }
              },
              child: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.red.withOpacity(0.8),
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: _selectedFire?.id == fire.id
                        ? Colors.yellow
                        : Colors.orange,
                    width: _selectedFire?.id == fire.id ? 3 : 2,
                  ),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.local_fire_department, color: Colors.orange, size: 40),
                    if (distance != null)
                      Text(
                        '${distance.toInt()}m',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                  ],
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildTeacherControls() {
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.8),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              ElevatedButton.icon(
                onPressed: _placeFire,
                icon: const Icon(Icons.local_fire_department),
                label: const Text('Place Fire'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.red,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 24,
                    vertical: 16,
                  ),
                ),
              ),
              ElevatedButton.icon(
                onPressed: () {
                  _fireService?.clearAllFires();
                },
                icon: const Icon(Icons.clear_all),
                label: const Text('Clear All'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.grey,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 24,
                    vertical: 16,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            'Active Fires: ${_activeFires.where((f) => f.isBurning).length}',
            style: const TextStyle(color: Colors.white, fontSize: 14),
          ),
        ],
      ),
    );
  }

  Widget _buildStudentControls() {
    final nearestFire = _fireService?.getNearestFire();
    final canExtinguish = _selectedFire != null && !_selectedFire!.isExtinguished;
    
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.8),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (nearestFire != null && _currentPosition != null)
            Container(
              padding: const EdgeInsets.all(12),
              margin: const EdgeInsets.only(bottom: 12),
              decoration: BoxDecoration(
                color: Colors.orange.withOpacity(0.3),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  const Icon(Icons.local_fire_department, color: Colors.orange),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Nearest fire: ${nearestFire.distanceTo(_currentPosition!).toInt()}m away',
                      style: const TextStyle(color: Colors.white),
                    ),
                  ),
                ],
              ),
            ),
          
          if (_selectedFire != null)
            Container(
              padding: const EdgeInsets.all(12),
              margin: const EdgeInsets.only(bottom: 12),
              decoration: BoxDecoration(
                color: Colors.red.withOpacity(0.3),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Fire selected',
                    style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                  ),
                  TextButton(
                    onPressed: () {
                      setState(() {
                        _selectedFire = null;
                      });
                    },
                    child: const Text('Cancel'),
                  ),
                ],
              ),
            ),
          
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: canExtinguish
                  ? () => _extinguishFire(_selectedFire!)
                  : null,
              icon: const Icon(Icons.water_drop),
              label: const Text('Extinguish Fire'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.blue,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                disabledBackgroundColor: Colors.grey,
              ),
            ),
          ),
          
          const SizedBox(height: 8),
          Text(
            'Fires remaining: ${_activeFires.where((f) => f.isBurning).length}',
            style: const TextStyle(color: Colors.white, fontSize: 14),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusBar() {
    final stats = _fireService?.getStatistics() ?? {};
    
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.7),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            Icons.local_fire_department,
            color: Colors.orange,
            size: 20,
          ),
          const SizedBox(width: 8),
          Text(
            '${stats['activeFires'] ?? 0} active',
            style: const TextStyle(color: Colors.white, fontSize: 14),
          ),
          const SizedBox(width: 16),
          Icon(
            Icons.check_circle,
            color: Colors.green,
            size: 20,
          ),
          const SizedBox(width: 8),
          Text(
            '${stats['extinguishedFires'] ?? 0} extinguished',
            style: const TextStyle(color: Colors.white, fontSize: 14),
          ),
        ],
      ),
    );
  }

  void _showStatistics() {
    final stats = _fireService?.getStatistics() ?? {};
    
    showDialog<void>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Fire Simulation Statistics'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildStatRow('Active Fires', '${stats['activeFires'] ?? 0}'),
            _buildStatRow('Extinguished', '${stats['extinguishedFires'] ?? 0}'),
            _buildStatRow('Total Fires', '${stats['totalFires'] ?? 0}'),
            _buildStatRow('Total Score', '${stats['totalScore'] ?? 0}'),
            _buildStatRow('Average Score', '${stats['averageScore'] ?? 0}'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }

  Widget _buildStatRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label),
          Text(
            value,
            style: const TextStyle(fontWeight: FontWeight.bold),
          ),
        ],
      ),
    );
  }
}

