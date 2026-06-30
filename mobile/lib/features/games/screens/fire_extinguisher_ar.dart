// --- FINAL WORKING FIRE EXTINGUISHER DRILL SIMULATION ---
// Place this entire file in lib/main.dart

// ignore_for_file: unused_field

import 'dart:async';
import 'dart:math';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:sensors_plus/sensors_plus.dart';
import 'package:camera/camera.dart';

List<CameraDescription> _cameras = [];

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Fire Extinguisher Drill',
      theme: ThemeData(
        primarySwatch: Colors.blue,
        useMaterial3: true,
      ),
      home: const FireExtinguisherApp(),
      debugShowCheckedModeBanner: false,
    );
  }
}

class FireExtinguisherApp extends StatelessWidget {
  const FireExtinguisherApp({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      backgroundColor: Colors.black,
      body: PASS_SimulationScreen(),
    );
  }
}

// ---------------------------------------------------------------------------
// P.A.S.S. DRILL ENGINE
// ---------------------------------------------------------------------------

enum DrillStage {
  scanRoom,
  placeFire,
  pullPin,
  aimBase,
  readyToSqueeze,
  extinguish,
  success,
  failed
}

class PASS_SimulationScreen extends StatefulWidget {
  const PASS_SimulationScreen({super.key});

  @override
  State<PASS_SimulationScreen> createState() => _PASS_SimulationScreenState();
}

class _PASS_SimulationScreenState extends State<PASS_SimulationScreen>
    with TickerProviderStateMixin, WidgetsBindingObserver {
  
  // --- Performance guards ---
  static const int _maxFireParticles = 300;
  static const int _maxFoamParticles = 120;
  int _frameCounter = 0;

  // --- Drill State ---
  DrillStage _currentStage = DrillStage.scanRoom;
  String _instructionText = 'SCANNING ROOM...';

  List<double> _fireHealth = [100.0, 100.0, 100.0];
  double _co2Level = 100.0;
  int _timeRemaining = 60;
  Timer? _drillTimer;

  bool _isPinPulled = false;
  bool _isSpraying = false;
  double _aimLockDuration = 0.0;

  // --- AR / Camera ---
  CameraController? _cameraController;
  bool _isCameraInitialized = false;

  // --- Spatial Tracking ---
  Offset _virtualCameraHeading = Offset.zero;
  bool _isPlaced = false;
  Offset _placementHeading = Offset.zero;
  Offset _fireWorldPosition = Offset.zero;

  StreamSubscription<GyroscopeEvent>? _gyroSubscription;

  // --- Particles ---
  final List<FireParticle> _particles = [];
  final List<FoamParticle> _foam = [];
  final Random _rng = Random();
  late AnimationController _loopController;

  // --- Scanning UI ---
  double _scanLineY = 0.0;
  bool _scanMovingDown = true;

  static const double _gyroSmoothing = 0.14;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _initCamera();
    _initSensors();

    // Game Loop (60 FPS)
    _loopController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 16),
    )..repeat();
    _loopController.addListener(_updateLoop);

    // Scan delay
    Future.delayed(const Duration(seconds: 3), () {
      if (mounted) {
        setState(() {
          _currentStage = DrillStage.placeFire;
          _instructionText = 'POINT AT WALL & TAP PLACE';
        });
      }
    });
  }

  void _startTimer() {
    _drillTimer?.cancel();
    _drillTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_currentStage == DrillStage.success ||
          _currentStage == DrillStage.failed ||
          _currentStage == DrillStage.scanRoom ||
          _currentStage == DrillStage.placeFire) {
        return;
      }
      if (mounted) {
        setState(() {
          if (_timeRemaining > 0) {
            _timeRemaining--;
          } else {
            _triggerFailure('Time Expired! Fire spread.');
          }
        });
      }
    });
  }

  Future<void> _initCamera() async {
    try {
      if (_cameras.isEmpty) _cameras = await availableCameras();
      if (_cameras.isEmpty) return;

      final camera = _cameras.firstWhere(
        (c) => c.lensDirection == CameraLensDirection.back,
        orElse: () => _cameras.first,
      );

      await _cameraController?.dispose();
      _cameraController = CameraController(
        camera,
        ResolutionPreset.medium,
        enableAudio: false,
      );

      await _cameraController!.initialize();
      if (mounted) setState(() => _isCameraInitialized = true);
    } catch (e) {
      debugPrint('Camera Error: $e');
    }
  }

  void _initSensors() {
    _gyroSubscription?.cancel();

    _gyroSubscription = gyroscopeEvents.listen((event) {
      if (_currentStage == DrillStage.success ||
          _currentStage == DrillStage.failed) return;

      double gx = event.x.abs() < 0.02 ? 0.0 : event.x;
      double gy = event.y.abs() < 0.02 ? 0.0 : event.y;

      const double sensitivity = 28.0;

      final dx = gy * sensitivity;
      final dy = gx * sensitivity;

      final smoothed = Offset(
        _virtualCameraHeading.dx + dx * _gyroSmoothing,
        _virtualCameraHeading.dy + dy * _gyroSmoothing,
      );

      setState(() {
        _virtualCameraHeading = smoothed;
        if (_currentStage == DrillStage.scanRoom ||
            _currentStage == DrillStage.placeFire) {
          _virtualCameraHeading = Offset(
            _virtualCameraHeading.dx.clamp(-1000.0, 1000.0),
            _virtualCameraHeading.dy.clamp(-800.0, 800.0),
          );
        }
      });
    });
  }

  // -------------------------------------------------------------------------
  // GAME LOGIC
  // -------------------------------------------------------------------------
  void _updateLoop() {
    if (!mounted) return;

    // Scan Animation
    if (_currentStage == DrillStage.scanRoom) {
      if (_scanMovingDown) {
        _scanLineY += 5;
        if (_scanLineY > 600) _scanMovingDown = false;
      } else {
        _scanLineY -= 5;
        if (_scanLineY < 0) _scanMovingDown = true;
      }
      return;
    }

    if (_currentStage == DrillStage.placeFire) {
      return;
    }

    if (_currentStage == DrillStage.failed ||
        _currentStage == DrillStage.success) return;

    _checkDrillProgress();

    Offset relativeFirePos;
    if (_isPlaced) {
      relativeFirePos = _fireWorldPosition - _virtualCameraHeading;
    } else {
      relativeFirePos = Offset.zero;
    }

    _frameCounter++;

    // THROTTLED SPAWNING
    if (relativeFirePos.distance < 2000 && _frameCounter % 3 == 0) {
      if (_particles.length < _maxFireParticles) {
        _spawnFireCluster(
          relativeFirePos.dx - 120,
          relativeFirePos.dy + 150,
          _fireHealth[0],
        );
        _spawnFireCluster(
          relativeFirePos.dx,
          relativeFirePos.dy + 150,
          _fireHealth[1],
        );
        _spawnFireCluster(
          relativeFirePos.dx + 120,
          relativeFirePos.dy + 150,
          _fireHealth[2],
        );
      }
    }

    // SPAWN FOAM
    if (_isSpraying && _co2Level > 0) {
      _spawnFoam();
      _co2Level -= 0.3;
    } else if (_isSpraying && _co2Level <= 0) {
      _isSpraying = false;
      if (_getTotalHealth() > 10) _triggerFailure('CO2 Tank Empty!');
    }

    // PHYSICS
    _updateParticles();

    // REGEN
    if (_currentStage == DrillStage.extinguish && !_isSpraying) {
      for (int i = 0; i < 3; i++) {
        if (_fireHealth[i] > 0 && _fireHealth[i] < 100) {
          _fireHealth[i] += 0.2;
        }
      }
    }

    setState(() {});
  }

  void _placeFire() {
    final Offset forwardOffset = const Offset(0, -400);
    final absoluteFirePos = _virtualCameraHeading + forwardOffset;

    setState(() {
      _placementHeading = _virtualCameraHeading;
      _fireWorldPosition = absoluteFirePos;
      _isPlaced = true;
      _currentStage = DrillStage.pullPin;
      _instructionText = 'STEP 1: SWIPE UP TO PULL PIN';
      _startTimer();
    });
  }

  void _checkDrillProgress() {
    double totalHealth = _getTotalHealth();

    if (!_isPlaced) return;

    Offset relativeFirePos = _fireWorldPosition - _virtualCameraHeading;

    if (_currentStage == DrillStage.pullPin) {
      if (_isPinPulled) {
        _currentStage = DrillStage.aimBase;
        _instructionText = 'STEP 2: AIM AT THE BASE OF FIRE';
      }
    } else if (_currentStage == DrillStage.aimBase) {
      final baseScreenPos =
          Offset(relativeFirePos.dx, relativeFirePos.dy + 150);
      final aimError = baseScreenPos.distance;

      if (aimError < 150) {
        _aimLockDuration += 0.02;
        if (_aimLockDuration > 1.5) {
          _currentStage = DrillStage.readyToSqueeze;
          _instructionText = 'STEP 3: SQUEEZE & SWEEP SIDE-TO-SIDE';
          HapticFeedback.heavyImpact();
        }
      } else {
        _aimLockDuration = max(0, _aimLockDuration - 0.05);
      }
    } else if (_currentStage == DrillStage.readyToSqueeze) {
      if (_isSpraying) _currentStage = DrillStage.extinguish;
    } else if (_currentStage == DrillStage.extinguish) {
      if (totalHealth <= 0) {
        _currentStage = DrillStage.success;
        _showEndDialog(true);
      }
    }
  }

  void _spawnFireCluster(double x, double y, double health) {
    if (health <= 0) return;
    if (_particles.length >= _maxFireParticles) return;

    int intensity = (health / 30).ceil();
    if (intensity < 1) intensity = 1;
    if (intensity > 4) intensity = 4;

    // FIRE
    for (int i = 0;
        i < intensity && _particles.length < _maxFireParticles;
        i++) {
      _particles.add(FireParticle(
        x: x + (_rng.nextDouble() - 0.5) * 60,
        y: y + (_rng.nextDouble() - 0.5) * 20,
        vx: (_rng.nextDouble() - 0.5) * 1.5,
        vy: -2.5 - _rng.nextDouble() * 3.0,
        life: 1.0,
        size: 26.0 + _rng.nextDouble() * 24.0,
        type: ParticleType.fire,
      ));
    }

    // SMOKE
    if (_rng.nextDouble() < 0.25 && _particles.length < _maxFireParticles) {
      _particles.add(FireParticle(
        x: x + (_rng.nextDouble() - 0.5) * 80,
        y: y - 80,
        vx: (_rng.nextDouble() - 0.5) * 3.0,
        vy: -2.5 - _rng.nextDouble() * 1.5,
        life: 1.0,
        size: 40.0 + _rng.nextDouble() * 25.0,
        type: ParticleType.smoke,
      ));
    }
  }

  void _spawnFoam() {
    if (_foam.length >= _maxFoamParticles) return;

    for (int i = 0; i < 6 && _foam.length < _maxFoamParticles; i++) {
      _foam.add(FoamParticle(
        x: (_rng.nextDouble() - 0.5) * 30,
        y: 600,
        vx: (_rng.nextDouble() - 0.5) * 35,
        vy: -40.0 - _rng.nextDouble() * 12,
        life: 1.0,
        size: 18.0 + _rng.nextDouble() * 18.0,
      ));
    }
    if (_rng.nextDouble() > 0.7) HapticFeedback.lightImpact();
  }

  void _updateParticles() {
    for (var p in _particles) p.update();
    _particles.removeWhere((p) => p.life <= 0);

    Offset relFire = _fireWorldPosition - _virtualCameraHeading;

    for (var p in _foam) {
      p.update();

      double zoneY = relFire.dy + 150;
      double zoneX_L = relFire.dx - 120;
      double zoneX_C = relFire.dx;
      double zoneX_R = relFire.dx + 120;

      if ((p.y - zoneY).abs() < 80) {
        bool hit = false;
        if ((p.x - zoneX_L).abs() < 60 && _fireHealth[0] > 0) {
          _fireHealth[0] -= 0.3;
          hit = true;
        } else if ((p.x - zoneX_C).abs() < 60 && _fireHealth[1] > 0) {
          _fireHealth[1] -= 0.3;
          hit = true;
        } else if ((p.x - zoneX_R).abs() < 60 && _fireHealth[2] > 0) {
          _fireHealth[2] -= 0.3;
          hit = true;
        }
        if (hit) p.life = 0;
      }
    }
    _foam.removeWhere((p) => p.life <= 0);
  }

  double _getTotalHealth() => _fireHealth.fold(0, (a, b) => a + b);

  void _triggerFailure(String reason) {
    if (_currentStage == DrillStage.failed) return;
    setState(() => _currentStage = DrillStage.failed);
    _showEndDialog(false, reason: reason);
  }

  void _showEndDialog(bool success, {String? reason}) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => AlertDialog(
        backgroundColor: const Color(0xFF1A1A2E),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: BorderSide(
            color: success ? Colors.green : Colors.red,
            width: 2,
          ),
        ),
        title: Row(
          children: [
            Icon(
              success ? Icons.check_circle : Icons.error,
              color: success ? Colors.green : Colors.red,
              size: 32,
            ),
            const SizedBox(width: 12),
            Text(
              success ? 'DRILL PASSED ✓' : 'DRILL FAILED ✗',
              style: TextStyle(
                color: success ? Colors.green : Colors.red,
                fontWeight: FontWeight.bold,
                fontSize: 18,
              ),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              success
                  ? 'Excellent execution of P.A.S.S. technique!'
                  : reason ?? 'Try again.',
              style: const TextStyle(color: Colors.white, fontSize: 16),
            ),
            if (success) ...[
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.green.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.green, width: 1),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.timer, color: Colors.green, size: 20),
                    const SizedBox(width: 8),
                    Text(
                      'Time: ${_timeRemaining}s',
                      style: const TextStyle(
                        color: Colors.green,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              Navigator.pop(context);
            },
            child: const Text(
              'Exit',
              style: TextStyle(color: Colors.grey),
            ),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: success ? Colors.green : Colors.red,
            ),
            onPressed: () {
              Navigator.pop(context);
              _resetDrill();
            },
            child: const Text('Retry Drill'),
          ),
        ],
      ),
    );
  }

  void _resetDrill() {
    setState(() {
      _currentStage = DrillStage.scanRoom;
      _instructionText = 'SCANNING ROOM...';
      _fireHealth = [100.0, 100.0, 100.0];
      _co2Level = 100.0;
      _timeRemaining = 60;
      _isPinPulled = false;
      _isSpraying = false;
      _aimLockDuration = 0.0;
      _particles.clear();
      _foam.clear();
      _virtualCameraHeading = Offset.zero;
      _fireWorldPosition = Offset.zero;
      _isPlaced = false;
      _placementHeading = Offset.zero;
      _scanMovingDown = true;
      _scanLineY = 0;
      _frameCounter = 0;
    });

    Future.delayed(const Duration(seconds: 3), () {
      if (mounted && _currentStage == DrillStage.scanRoom) {
        setState(() {
          _currentStage = DrillStage.placeFire;
          _instructionText = 'POINT AT WALL & TAP PLACE';
        });
      }
    });
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) async {
    if (_cameraController == null) return;
    if (state == AppLifecycleState.inactive) {
      try {
        await _cameraController?.dispose();
      } catch (e) {}
    } else if (state == AppLifecycleState.resumed) {
      await _initCamera();
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _loopController.dispose();
    _gyroSubscription?.cancel();
    _cameraController?.dispose();
    _drillTimer?.cancel();
    super.dispose();
  }

  // -------------------------------------------------------------------------
  // UI - FIXED FOR AR CAMERA FREEZING
  // -------------------------------------------------------------------------
  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        // 1. CAMERA LAYER - Isolated from setState
        RepaintBoundary(
          child: _isCameraInitialized
              ? SizedBox.expand(
                  child: CameraPreview(_cameraController!),
                )
              : Container(color: Colors.black),
        ),

        // 2. GAME OVERLAY - Fire/Foam particles
        if (_currentStage != DrillStage.scanRoom)
          Positioned.fill(
            child: CustomPaint(
              painter: RealisticFirePainter(
                fireParticles: _particles,
                foamParticles: _foam,
                relativeOffset: (_currentStage == DrillStage.placeFire)
                    ? Offset.zero
                    : (_isPlaced
                        ? (_fireWorldPosition - _virtualCameraHeading)
                        : Offset.zero),
                fireHealth: _fireHealth,
                isGhost: _currentStage == DrillStage.placeFire,
              ),
              willChange: true,
            ),
          ),

        // 3. SCANNING OVERLAY
        if (_currentStage == DrillStage.scanRoom)
          _buildScanningOverlay(),

        // 4. OFF-SCREEN INDICATOR
        if (_currentStage.index >= DrillStage.pullPin.index &&
            _currentStage != DrillStage.success)
          _buildOffScreenIndicator(),

        // 5. AIM GUIDE
        if (_currentStage == DrillStage.aimBase)
          Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.arrow_downward,
                    color: Colors.yellow, size: 50),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    color: Colors.black54,
                    border: Border.all(color: Colors.yellow, width: 2),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Text('AIM AT BASE OF FIRE',
                      style: TextStyle(
                          color: Colors.yellow,
                          fontWeight: FontWeight.bold,
                          fontSize: 14)),
                ),
                const SizedBox(height: 150),
              ],
            ),
          ),

        // 6. AIM PROGRESS
        if (_currentStage == DrillStage.aimBase)
          Positioned(
            top: MediaQuery.of(context).size.height / 2 + 100,
            left: 50,
            right: 50,
            child: Column(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(5),
                  child: LinearProgressIndicator(
                    value: _aimLockDuration / 1.5,
                    backgroundColor: Colors.white24,
                    valueColor: AlwaysStoppedAnimation<Color>(
                      Color.lerp(Colors.yellow, Colors.green,
                          _aimLockDuration / 1.5)!,
                    ),
                    minHeight: 12,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'LOCKING TARGET...',
                  style: TextStyle(
                    color: Colors.white.withOpacity(0.7),
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),

        // 7. HUD - TOP
        SafeArea(
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    Container(
                      decoration: BoxDecoration(
                        color: Colors.black54,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.white24),
                      ),
                      child: IconButton(
                        icon: const Icon(Icons.arrow_back,
                            color: Colors.white),
                        onPressed: () => Navigator.pop(context),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: [
                              _getStageColor().withOpacity(0.9),
                              _getStageColor().withOpacity(0.6)
                            ],
                          ),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.white24),
                        ),
                        child: Row(
                          children: [
                            Icon(_getStageIcon(),
                                color: Colors.white, size: 20),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(_instructionText,
                                  textAlign: TextAlign.center,
                                  style: const TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 14)),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              // STATS
              if (_currentStage.index > DrillStage.placeFire.index)
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _statChip(
                        Icons.timer,
                        '${_timeRemaining}s',
                        _timeRemaining < 10 ? Colors.red : Colors.white,
                        'TIME',
                      ),
                      _statChip(
                        Icons.local_fire_department,
                        '${_getTotalHealth().toInt()}%',
                        _getTotalHealth() > 150
                            ? Colors.red
                            : Colors.orange,
                        'FIRE',
                      ),
                      _statChip(
                        Icons.propane_tank,
                        '${_co2Level.toInt()}%',
                        _co2Level < 20 ? Colors.red : Colors.cyan,
                        'CO2',
                      ),
                    ],
                  ),
                ),

              // DEBUG INFO
              if (_isPlaced)
                Padding(
                  padding: const EdgeInsets.only(top: 8.0),
                  child: Text(
                    'Particles: ${_particles.length} | Foam: ${_foam.length}',
                    style:
                        const TextStyle(color: Colors.cyan, fontSize: 10),
                  ),
                ),
            ],
          ),
        ),

        // 8. PLACE BUTTON
        if (_currentStage == DrillStage.placeFire)
          Positioned(
            bottom: 50,
            left: 50,
            right: 50,
            child: ElevatedButton.icon(
              icon: const Icon(Icons.location_on, color: Colors.white),
              label: const Text('PLACE FIRE HERE',
                  style: TextStyle(
                      fontSize: 16, fontWeight: FontWeight.bold)),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFDC143C),
                padding: const EdgeInsets.all(20),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
                elevation: 8,
              ),
              onPressed: _placeFire,
            ),
          ),

        // 9. PULL PIN
        if (_currentStage == DrillStage.pullPin)
          Positioned(
            right: 30,
            bottom: 200,
            child: Dismissible(
              key: const Key('pin'),
              direction: DismissDirection.up,
              onDismissed: (_) {
                setState(() => _isPinPulled = true);
                HapticFeedback.heavyImpact();
              },
              child: Container(
                width: 90,
                height: 150,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [Colors.red[700]!, Colors.red[900]!],
                  ),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: Colors.white, width: 2),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.red.withOpacity(0.5),
                      blurRadius: 15,
                      spreadRadius: 2,
                    ),
                  ],
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.swipe_up, color: Colors.white, size: 30),
                    const SizedBox(height: 8),
                    const Text(
                      'SWIPE UP',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Colors.yellow[700],
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: Colors.yellow.withOpacity(0.5),
                            blurRadius: 8,
                          )
                        ],
                      ),
                      child: const Icon(
                        Icons.push_pin,
                        color: Colors.black,
                        size: 24,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),

        // 10. SPRAY BUTTON
        if (_currentStage == DrillStage.readyToSqueeze ||
            _currentStage == DrillStage.extinguish)
          Positioned(
            bottom: 60,
            left: 0,
            right: 0,
            child: Center(
              child: GestureDetector(
                onTapDown: (_) => setState(() => _isSpraying = true),
                onTapUp: (_) => setState(() => _isSpraying = false),
                onTapCancel: () => setState(() => _isSpraying = false),
                child: AnimatedScale(
                  scale: _isSpraying ? 0.9 : 1.0,
                  duration: const Duration(milliseconds: 100),
                  child: Container(
                    width: 110,
                    height: 110,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: RadialGradient(
                        colors: _isSpraying
                            ? [Colors.red[400]!, Colors.red[800]!]
                            : [Colors.red[600]!, Colors.red[900]!],
                      ),
                      border: Border.all(color: Colors.white, width: 4),
                      boxShadow: [
                        BoxShadow(
                          color: _isSpraying
                              ? Colors.red.withOpacity(0.8)
                              : Colors.black.withOpacity(0.5),
                          blurRadius: _isSpraying ? 20 : 10,
                          spreadRadius: _isSpraying ? 5 : 0,
                        ),
                      ],
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          _isSpraying
                              ? Icons.water_drop
                              : Icons.touch_app,
                          color: Colors.white,
                          size: 28,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          _isSpraying ? 'SPRAYING' : 'SQUEEZE',
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 11,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),

        // 11. RETICLE
        Center(
          child: Container(
            width: 14,
            height: 14,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(color: Colors.white, width: 2),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.5),
                  blurRadius: 4,
                ),
              ],
            ),
            child: Center(
              child: Container(
                width: 4,
                height: 4,
                decoration: const BoxDecoration(
                  color: Colors.white,
                  shape: BoxShape.circle,
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }

  // --- UI Helpers ---

  Widget _buildScanningOverlay() {
    return Stack(
      children: [
        Positioned(
          top: _scanLineY,
          left: 0,
          right: 0,
          child: Container(
            height: 3,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  Colors.transparent,
                  Colors.greenAccent,
                  Colors.transparent
                ],
              ),
              boxShadow: [
                BoxShadow(color: Colors.greenAccent, blurRadius: 15)
              ],
            ),
          ),
        ),
        Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.radar, color: Colors.greenAccent, size: 60),
              const SizedBox(height: 16),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                decoration: BoxDecoration(
                  color: Colors.black54,
                  borderRadius: BorderRadius.circular(8),
                  border:
                      Border.all(color: Colors.greenAccent.withOpacity(0.5)),
                ),
                child: const Text(
                  'SCANNING ENVIRONMENT...',
                  style: TextStyle(
                    color: Colors.greenAccent,
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildOffScreenIndicator() {
    if (!_isPlaced) return const SizedBox.shrink();

    Offset relativeFirePos = _fireWorldPosition - _virtualCameraHeading;
    if (relativeFirePos.dx.abs() < 500 &&
        relativeFirePos.dy.abs() < 800) {
      return const SizedBox.shrink();
    }

    double angle = atan2(relativeFirePos.dy, relativeFirePos.dx);

    return Align(
      alignment: Alignment.center,
      child: Transform.rotate(
        angle: angle,
        child: Padding(
          padding: const EdgeInsets.all(120.0),
          child: Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.red.withOpacity(0.8),
              borderRadius: BorderRadius.circular(8),
              boxShadow: [
                BoxShadow(
                  color: Colors.red.withOpacity(0.5),
                  blurRadius: 10,
                )
              ],
            ),
            child: const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.local_fire_department,
                    color: Colors.white, size: 24),
                Icon(Icons.arrow_forward_ios,
                    color: Colors.white, size: 20),
              ],
            ),
          ),
        ),
      ),
    );
  }

  IconData _getStageIcon() {
    switch (_currentStage) {
      case DrillStage.scanRoom:
        return Icons.radar;
      case DrillStage.placeFire:
        return Icons.location_on;
      case DrillStage.pullPin:
        return Icons.push_pin;
      case DrillStage.aimBase:
        return Icons.gps_fixed;
      case DrillStage.readyToSqueeze:
      case DrillStage.extinguish:
        return Icons.water_drop;
      case DrillStage.success:
        return Icons.check_circle;
      default:
        return Icons.warning;
    }
  }

  Color _getStageColor() {
    switch (_currentStage) {
      case DrillStage.scanRoom:
        return const Color(0xFF1E3A5F);
      case DrillStage.placeFire:
        return const Color(0xFF6B2D5B);
      case DrillStage.pullPin:
        return const Color(0xFFD4740C);
      case DrillStage.aimBase:
        return const Color(0xFF1565C0);
      case DrillStage.readyToSqueeze:
      case DrillStage.extinguish:
        return const Color(0xFFB71C1C);
      case DrillStage.success:
        return const Color(0xFF2E7D32);
      default:
        return Colors.grey;
    }
  }

  Widget _statChip(IconData icon, String value, Color color, String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.black87,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withOpacity(0.5)),
        boxShadow: [BoxShadow(color: color.withOpacity(0.2), blurRadius: 8)],
      ),
      child: Row(
        children: [
          Icon(icon, color: color, size: 18),
          const SizedBox(width: 6),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(value,
                  style: TextStyle(
                      color: color,
                      fontWeight: FontWeight.bold,
                      fontSize: 14)),
              Text(label,
                  style: TextStyle(
                      color: color.withOpacity(0.7), fontSize: 8)),
            ],
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// PARTICLE MODELS
// ---------------------------------------------------------------------------

enum ParticleType { fire, smoke }

class FireParticle {
  double x, y, vx, vy, life, size;
  ParticleType type;

  FireParticle({
    required this.x,
    required this.y,
    required this.vx,
    required this.vy,
    required this.life,
    required this.size,
    required this.type,
  });

  void update() {
    x += vx;
    y += vy;
    x += (Random().nextDouble() - 0.5) * 1.5;

    if (type == ParticleType.fire) {
      life -= 0.04;
      size *= 0.96;
    } else {
      life -= 0.02;
      size *= 1.01;
      vy *= 0.98;
    }
  }
}

class FoamParticle {
  double x, y, vx, vy, life, size;

  FoamParticle({
    required this.x,
    required this.y,
    required this.vx,
    required this.vy,
    required this.life,
    required this.size,
  });

  void update() {
    x += vx;
    y += vy;
    vy += 0.45;
    life -= 0.03;
    size *= 1.025;
  }
}

// ---------------------------------------------------------------------------
// FIRE PAINTER
// ---------------------------------------------------------------------------

class RealisticFirePainter extends CustomPainter {
  final List<FireParticle> fireParticles;
  final List<FoamParticle> foamParticles;
  final Offset relativeOffset;
  final List<double> fireHealth;
  final bool isGhost;

  RealisticFirePainter({
    required this.fireParticles,
    required this.foamParticles,
    required this.relativeOffset,
    required this.fireHealth,
    this.isGhost = false,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);

    canvas.save();

    if (isGhost) {
      canvas.translate(center.dx, center.dy);
      _drawGhostFire(canvas);
    } else {
      canvas.translate(center.dx + relativeOffset.dx,
          center.dy + relativeOffset.dy);

      // Scorch mark
      Paint scorchPaint = Paint()
        ..color = Colors.black.withOpacity(0.6)
        ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 20);
      canvas.drawOval(
          const Rect.fromLTWH(-150, 160, 300, 60), scorchPaint);

      // Health bars
      if (fireHealth.any((h) => h < 100)) {
        _drawHealthBar(canvas, -120, 150, fireHealth[0]);
        _drawHealthBar(canvas, 0, 150, fireHealth[1]);
        _drawHealthBar(canvas, 120, 150, fireHealth[2]);
      }

      // Smoke particles
      for (var p
          in fireParticles.where((p) => p.type == ParticleType.smoke)) {
        Paint pPaint = Paint()
          ..color = Colors.grey[800]!.withOpacity(p.life * 0.4);
        canvas.drawCircle(Offset(p.x, p.y), p.size, pPaint);
      }

      // Fire particles
      for (var p in fireParticles.where((p) => p.type == ParticleType.fire)) {
        Color c;
        if (p.life > 0.7) {
          c = Colors.yellow;
        } else if (p.life > 0.3) {
          c = Colors.orange;
        } else {
          c = Colors.red;
        }
        Paint pPaint = Paint()..color = c.withOpacity(p.life);
        canvas.drawCircle(Offset(p.x, p.y), p.size, pPaint);
      }
    }

    canvas.restore();

    // Foam (screen space)
    canvas.save();
    canvas.translate(center.dx, center.dy);
    for (var p in foamParticles) {
      Paint pPaint = Paint()..color = Colors.white.withOpacity(0.9);
      canvas.drawCircle(Offset(p.x, p.y), p.size, pPaint);
    }
    canvas.restore();
  }

  void _drawGhostFire(Canvas canvas) {
    Paint p = Paint()
      ..color = Colors.orange.withOpacity(0.3)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2;
    canvas.drawCircle(const Offset(0, 100), 50, p);
    canvas.drawCircle(const Offset(0, 150), 70, p);
    canvas.drawLine(const Offset(-50, 150), const Offset(50, 150), p);

    TextPainter tp = TextPainter(
      text: const TextSpan(
        text: '🔥 FIRE TARGET ZONE',
        style: TextStyle(
          color: Colors.orange,
          fontWeight: FontWeight.bold,
          fontSize: 14,
          shadows: [Shadow(color: Colors.black, blurRadius: 4)],
        ),
      ),
      textDirection: TextDirection.ltr,
    );
    tp.layout();
    tp.paint(canvas, Offset(-tp.width / 2, 50));
  }

  void _drawHealthBar(
      Canvas canvas, double x, double y, double health) {
    if (health <= 0) return;

    double barWidth = 50;
    double barHeight = 6;

    Paint bgPaint = Paint()
      ..color = Colors.black54
      ..style = PaintingStyle.fill;
    RRect bgRect = RRect.fromRectAndRadius(
      Rect.fromLTWH(x - barWidth / 2, y + 50, barWidth, barHeight),
      const Radius.circular(3),
    );
    canvas.drawRRect(bgRect, bgPaint);

    Color healthColor =
        health > 60 ? Colors.green : (health > 30 ? Colors.orange : Colors.red);
    Paint fgPaint = Paint()
      ..color = healthColor
      ..style = PaintingStyle.fill;
    RRect fgRect = RRect.fromRectAndRadius(
      Rect.fromLTWH(
          x - barWidth / 2, y + 50, barWidth * (health / 100), barHeight),
      const Radius.circular(3),
    );
    canvas.drawRRect(fgRect, fgPaint);

    Paint borderPaint = Paint()
      ..color = Colors.white.withOpacity(0.5)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1;
    canvas.drawRRect(bgRect, borderPaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}
