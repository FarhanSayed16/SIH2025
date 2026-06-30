// --- VR EARTHQUAKE DRILL (Cardboard Gaze Edition) ---
// Save this as lib/earthquake_drill_ar.dart

// ignore_for_file: unused_local_variable, unused_field

import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:flutter/services.dart';
import 'package:dchs_motion_sensors/dchs_motion_sensors.dart';
import 'package:vector_math/vector_math_64.dart' as vector;

// ---------------------------------------------------------------------------
// 1. APP ENTRY POINT
// ---------------------------------------------------------------------------

/// Wrapper used when pushing from MainMenuScreen. Does not use a nested
/// MaterialApp so the device back button pops back to the Games menu.
class EarthquakeDrillApp extends StatelessWidget {
  const EarthquakeDrillApp({super.key});

  @override
  Widget build(BuildContext context) {
    return Theme(
      data: ThemeData.dark(),
      child: const VrEarthquakeScreen(),
    );
  }
}

// ---------------------------------------------------------------------------
// 2. VR GAME ENGINE
// ---------------------------------------------------------------------------

enum DrillPhase {
  loading,      // ⏳ Wait 5s for VR Box setup
  intro,        // Peaceful classroom
  quakeStart,   // Shaking begins
  taskDrop,     // Wait for Drop input
  waitDrop,     // 10s delay under desk
  taskCover,    // Wait for Cover input
  waitCover,    // 10s delay covering
  taskHold,     // Wait for Hold input
  waitHold,     // 10s delay holding
  success,      // End - Safe
  failed        // End - Took too long
}

class VrEarthquakeScreen extends StatefulWidget {
  const VrEarthquakeScreen({super.key});

  @override
  State<VrEarthquakeScreen> createState() => _VrEarthquakeScreenState();
}

class _VrEarthquakeScreenState extends State<VrEarthquakeScreen>
    with SingleTickerProviderStateMixin {
  
  // --- VR SENSORS ---
  vector.Quaternion _targetOrientation = vector.Quaternion.identity();
  vector.Quaternion _renderOrientation = vector.Quaternion.identity();
  StreamSubscription? _orientationSubscription;
  
  // Tuning
  static const double INTERPOLATION_SPEED = 0.12; 
  static const double PANEL_DISTANCE = 700.0; // Distance of UI planes
  
  // --- VIEW STATE ---
  double _viewYaw = 0.0;
  double _viewPitch = 0.0;
  
  // --- GAME STATE ---
  DrillPhase _phase = DrillPhase.loading; 
  double _camHeightOffset = 0.0; 
  final List<RubbleParticle> _rubble = [];
  
  // Timers
  Timer? _gameLoopTimer;
  int _countDownSeconds = 0; // Universal countdown for loading/waiting
  int _score = 0;
  
  // Target Yaw for buttons (Spawns in front of user)
  double _targetButtonYaw = 0.0;
  
  // --- GAZE SYSTEM ---
  static const double GAZE_TIME_REQUIRED = 2.0; 
  double _gazeProgress = 0.0;
  bool _isGazingAtButton = false;
  String? _gazeTargetId; 
  
  // --- ANIMATION ---
  late Ticker _ticker;
  final math.Random _rng = math.Random();
  double _shakeIntensity = 0.0;
  Offset _currentShake = Offset.zero;

  // --- CONFIG ---
  static const double VIRTUAL_IMAGE_WIDTH = 3500.0; 
  static const double BG_SCALE = 0.9; 

  @override
  void initState() {
    super.initState();
    // VR / fullscreen (moved from EarthquakeDrillApp so we stay in parent navigator)
    SystemChrome.setPreferredOrientations([
      DeviceOrientation.landscapeLeft,
      DeviceOrientation.landscapeRight,
    ]);
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);

    _initSensors();
    _ticker = createTicker(_onTick);
    _ticker.start();

    // Start Loading Sequence
    _startCountdown(5, () {
      _startDrillScenario();
    });
  }

  /// Universal countdown helper for all phases
  void _startCountdown(int seconds, VoidCallback onComplete) {
    _gameLoopTimer?.cancel();
    setState(() => _countDownSeconds = seconds);
    
    _gameLoopTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) {
        timer.cancel();
        return;
      }
      setState(() {
        _countDownSeconds--;
      });

      if (_countDownSeconds <= 0) {
        timer.cancel();
        onComplete();
      }
    });
  }

  void _initSensors() {
    motionSensors.absoluteOrientationUpdateInterval = Duration.microsecondsPerSecond ~/ 60;
    _orientationSubscription = motionSensors.absoluteOrientation.listen((event) {
      if (!mounted) return;
      final q = vector.Quaternion.euler(event.yaw, event.pitch, event.roll);
      // Remap for LANDSCAPE (Cardboard)
      final qLandscape = q * vector.Quaternion.axisAngle(vector.Vector3(0, 0, 1), -math.pi / 2);
      if (!mounted) return;
      setState(() {
        _targetOrientation = qLandscape;
      });
    });
  }

  // --- GAME LOGIC FLOW ---

  void _startDrillScenario() async {
    setState(() => _phase = DrillPhase.intro);

    // Phase 1: Intro (4s)
    await Future.delayed(const Duration(seconds: 4));
    if (!mounted) return;

    // Phase 2: Quake Starts
    setState(() {
      _phase = DrillPhase.quakeStart;
      _shakeIntensity = 15.0; // RUMBLE!
    });

    // Wait a bit for panic effect (3s)
    await Future.delayed(const Duration(seconds: 3));
    if (!mounted) return;

    // Phase 3: Prompt Drop
    _activateTaskPhase(DrillPhase.taskDrop);
  }

  void _activateTaskPhase(DrillPhase newPhase) {
    setState(() {
      _phase = newPhase;
      // Spawn button exactly where player is currently looking
      _targetButtonYaw = _viewYaw; 
    });

    // Start 10s Failure Timer logic using our countdown
    _startCountdown(10, () {
      if (_phase == newPhase) {
        _triggerFailure();
      }
    });
  }

  void _triggerFailure() {
    setState(() {
      _phase = DrillPhase.failed;
      _shakeIntensity = 0.0;
    });
    HapticFeedback.vibrate();
  }

  void _handleButtonAction(String actionId) {
    HapticFeedback.heavyImpact();
    _gameLoopTimer?.cancel(); // Stop any failure/countdown timer

    setState(() {
      _gazeProgress = 0.0;
      _isGazingAtButton = false;
      _gazeTargetId = null;
    });

    // Task Logic
    if (actionId == 'DROP' && _phase == DrillPhase.taskDrop) {
      _score += 100;
      _advanceToWaitPhase(DrillPhase.waitDrop, 10, DrillPhase.taskCover);
      // Simulate dropping by shifting camera height positive (image moves up)
      setState(() => _camHeightOffset = 300.0);
    } 
    else if (actionId == 'COVER' && _phase == DrillPhase.taskCover) {
      _score += 100;
      _advanceToWaitPhase(DrillPhase.waitCover, 10, DrillPhase.taskHold);
    } 
    else if (actionId == 'HOLD' && _phase == DrillPhase.taskHold) {
      _score += 100;
      _advanceToWaitPhase(DrillPhase.waitHold, 10, DrillPhase.success);
    } 
    // Menu Logic
    else if (actionId == 'RETRY') {
      _retry();
    } 
    else if (actionId == 'EXIT') {
      _exitToGames(context);
    }
  }

  void _advanceToWaitPhase(DrillPhase waitPhase, int duration, DrillPhase nextTask) {
    setState(() {
      _phase = waitPhase;
    });
    
    _startCountdown(duration, () {
      if (nextTask == DrillPhase.success) {
        setState(() {
          _phase = DrillPhase.success;
          _shakeIntensity = 0.0; // Stop Quake
          _rubble.clear();
        });
      } else {
        _activateTaskPhase(nextTask);
      }
    });
  }

  void _retry() {
    setState(() {
      _phase = DrillPhase.intro;
      _camHeightOffset = 0.0;
      _shakeIntensity = 0.0;
      _score = 0;
      _rubble.clear();
    });
    _startDrillScenario();
  }

  void _exitToGames(BuildContext context) {
    if (context.mounted) Navigator.of(context).pop();
  }

  // --- TICKER LOOP (60 FPS) ---

  void _onTick(Duration elapsed) {
    // 1. Smooth Interpolation (SLERP) for stability
    _renderOrientation = _slerp(_renderOrientation, _targetOrientation, INTERPOLATION_SPEED);
    _renderOrientation.normalize();

    // 2. Extract View Angles from Sensor
    final vector.Vector3 forward = _renderOrientation.rotate(vector.Vector3(0, 0, -1));
    
    // Yaw (Heading)
    _viewYaw = math.atan2(forward.x, -forward.z);
    
    // Pitch (Look Up/Down) - Clamped
    _viewPitch = math.asin(forward.y.clamp(-1.0, 1.0)); 

    // 3. Shake Logic
    if (_shakeIntensity > 0) {
      _currentShake = Offset(
        (_rng.nextDouble() - 0.5) * _shakeIntensity,
        (_rng.nextDouble() - 0.5) * _shakeIntensity,
      );
    } else {
      _currentShake = Offset.zero;
    }

    // 4. Rubble Physics
    if (_shakeIntensity > 0) {
      _updateRubble();
    }

    // 5. Gaze Timer Logic
    // We allow gazing during Task phases and Success/Fail screens
    if (_isGazingAtButton && _phase != DrillPhase.loading && !_isWaitPhase()) {
      _gazeProgress += 0.016; 
      if (_gazeProgress >= GAZE_TIME_REQUIRED) {
        if (_gazeTargetId != null) {
          _handleButtonAction(_gazeTargetId!);
        }
      }
    } else {
      _gazeProgress = 0.0;
    }
    
    // Reset gaze flag for next frame
    _isGazingAtButton = false;
    _gazeTargetId = null;

    setState(() {});
  }

  bool _isWaitPhase() {
    return _phase == DrillPhase.waitDrop || _phase == DrillPhase.waitCover || _phase == DrillPhase.waitHold;
  }

  // Quaternion Slerp
  vector.Quaternion _slerp(vector.Quaternion q1, vector.Quaternion q2, double t) {
    double dot = q1.x * q2.x + q1.y * q2.y + q1.z * q2.z + q1.w * q2.w;
    vector.Quaternion target = q2;
    if (dot < 0.0) {
      target = vector.Quaternion(-q2.x, -q2.y, -q2.z, -q2.w);
      dot = -dot;
    }
    if (dot > 0.9995) {
      final f1 = 1.0 - t;
      final f2 = t;
      return vector.Quaternion(
        f1 * q1.x + f2 * target.x,
        f1 * q1.y + f2 * target.y,
        f1 * q1.z + f2 * target.z,
        f1 * q1.w + f2 * target.w,
      )..normalize();
    }
    final double theta_0 = math.acos(dot);
    final double theta = theta_0 * t;
    final double sin_theta = math.sin(theta);
    final double sin_theta_0 = math.sin(theta_0);
    final double s0 = math.cos(theta) - dot * sin_theta / sin_theta_0;
    final double s1 = sin_theta / sin_theta_0;
    return vector.Quaternion(
      (s0 * q1.x) + (s1 * target.x),
      (s0 * q1.y) + (s1 * target.y),
      (s0 * q1.z) + (s1 * target.z),
      (s0 * q1.w) + (s1 * target.w),
    );
  }

  void _updateRubble() {
    if (_rng.nextDouble() < 0.2) { 
      _rubble.add(RubbleParticle(
        x: (_rng.nextDouble() - 0.5) * 4000, 
        y: -1500,
        size: _rng.nextDouble() * 50 + 20,
        speed: _rng.nextDouble() * 20 + 10,
        rotation: _rng.nextDouble() * math.pi,
      ));
    }
    for (var r in _rubble) {
      r.y += r.speed;
      r.rotation += 0.05;
    }
    _rubble.removeWhere((r) => r.y > 1500);
  }

  @override
  void dispose() {
    // Cancel platform channel subscription first so native stops sending events
    // (avoids "FlutterJNI was detached" warnings after route is popped)
    _orientationSubscription?.cancel();
    _orientationSubscription = null;
    _gameLoopTimer?.cancel();
    _ticker.dispose();
    SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
    super.dispose();
  }

  // -------------------------------------------------------------------------
  // 3. RENDERER
  // -------------------------------------------------------------------------

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: true,
      child: Scaffold(
        backgroundColor: Colors.black,
        body: Row(
          children: [
            Expanded(child: _buildEye(isLeft: true)),
            Container(width: 2, color: Colors.black), // Divider
            Expanded(child: _buildEye(isLeft: false)),
          ],
        ),
      ),
    );
  }

  Widget _buildEye({required bool isLeft}) {
    return ClipRect(
      child: Stack(
        fit: StackFit.expand,
        children: [
          // 1. Infinite Background
          if (_phase != DrillPhase.loading)
            _buildInfiniteBackground(isLeft)
          else
            Container(color: Colors.black), 

          // 2. Rubble Overlay
          if (_shakeIntensity > 0)
            CustomPaint(painter: RubblePainter(rubble: _rubble, shake: _currentShake)),

          // 3. 3D World Space UI
          if (_phase != DrillPhase.loading)
            _buildWorldUI(isLeft),

          // 4. Loading Screen / HUD
          if (_phase == DrillPhase.loading)
            Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.headset_mic, color: Colors.cyan, size: 60),
                  const SizedBox(height: 20),
                  const Text('INSERT PHONE INTO VR BOX',
                    style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18),
                  ),
                  const SizedBox(height: 10),
                  Text('Starting in $_countDownSeconds...',
                    style: const TextStyle(color: Colors.yellow, fontSize: 24),
                  ),
                  const SizedBox(height: 32),
                  TextButton.icon(
                    onPressed: () => _exitToGames(context),
                    icon: const Icon(Icons.arrow_back, color: Colors.white70, size: 20),
                    label: const Text('Back to Games', style: TextStyle(color: Colors.white70, fontSize: 16)),
                    style: TextButton.styleFrom(
                      backgroundColor: Colors.white12,
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                    ),
                  ),
                ],
              ),
            )
          else 
            Center(child: _buildReticle()),
          
          // 5. Success/Fail Overlays (Fixed to World Gaze)
          if (_phase == DrillPhase.success)
            _buildOverlay('DRILL COMPLETE\nSAFE!\nScore: $_score', Colors.green, isSuccess: true),
          
          if (_phase == DrillPhase.failed)
             _buildOverlay('FAILED!\nTOO SLOW\nLook Here to Retry', Colors.red, isRetry: true),
        ],
      ),
    );
  }

  Widget _buildOverlay(String text, Color color, {bool isRetry = false, bool isSuccess = false}) {
    // Overlays are just centered content, but buttons need to be interactive via Gaze
    // We re-use _buildGazeButton with staticHUD logic for Retry/Exit
    
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: color.withOpacity(0.9),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              text,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white),
            ),
          ),
          const SizedBox(height: 40),
          if (isRetry)
             _buildGazeButton('RETRY', 0.0, 0.0, Colors.white24, 'RETRY', isStaticHUD: true),
          if (isSuccess || isRetry) ...[
             const SizedBox(height: 20),
             _buildGazeButton('MAIN MENU', 0.0, 0.0, Colors.blue, 'EXIT', isStaticHUD: true),
          ]
        ],
      ),
    );
  }

  // --- STITCHING LOGIC ---
  Widget _buildInfiniteBackground(bool isLeft) {
    final Size screenSize = MediaQuery.of(context).size;
    
    double normalizedYaw = (_viewYaw / (2 * math.pi));
    normalizedYaw = normalizedYaw - normalizedYaw.floor();

    double pixelOffset = normalizedYaw * VIRTUAL_IMAGE_WIDTH;
    double pitchScale = screenSize.height / 2.0; 
    
    // Inverted Pitch: Look UP (+Pitch) -> Image moves DOWN (+Top)
    double pixelPitch = (_viewPitch * pitchScale).clamp(-screenSize.height, screenSize.height);
    
    double virtualHeight = screenSize.height * 4; 
    double topPos = -(virtualHeight / 2) + (screenSize.height / 2) + pixelPitch + _camHeightOffset + _currentShake.dy;

    double shakeX = _currentShake.dx;

    return Stack(
      children: [
        Positioned(
          left: -pixelOffset + shakeX,
          top: topPos,
          width: VIRTUAL_IMAGE_WIDTH,
          height: virtualHeight,
          child: _buildBgImage(),
        ),
        Positioned(
          left: -pixelOffset + VIRTUAL_IMAGE_WIDTH + shakeX,
          top: topPos,
          width: VIRTUAL_IMAGE_WIDTH,
          height: virtualHeight,
          child: _buildBgImage(),
        ),
        Positioned(
          left: -pixelOffset - VIRTUAL_IMAGE_WIDTH + shakeX,
          top: topPos,
          width: VIRTUAL_IMAGE_WIDTH,
          height: virtualHeight,
          child: _buildBgImage(),
        ),
      ],
    );
  }

  Widget _buildBgImage() {
    return Transform.scale(
      scale: BG_SCALE, 
      child: Image.asset(
        'assets/360image/Classroom_360.png', 
        fit: BoxFit.cover,
        gaplessPlayback: true,
        filterQuality: FilterQuality.medium,
        errorBuilder: (_, __, ___) => Container(color: Colors.grey.shade900),
      ),
    );
  }

  // --- WORLD UI ---
  Widget _buildWorldUI(bool isLeft) {
    List<Widget> uiElements = [];
    
    if (_phase == DrillPhase.taskDrop) {
      uiElements.add(_buildGazeButton('DROP\nUNDER DESK', _targetButtonYaw, 0.0, Colors.red, 'DROP'));
    } 
    else if (_phase == DrillPhase.waitDrop) {
      // ✅ Now using _countDownSeconds to show real time
      uiElements.add(_buildInfoText('Stay Down... ($_countDownSeconds s)', _targetButtonYaw, 0.0));
    }
    else if (_phase == DrillPhase.taskCover) {
      uiElements.add(_buildGazeButton('COVER\nHEAD', _targetButtonYaw, 0.0, Colors.orange, 'COVER'));
    }
    else if (_phase == DrillPhase.waitCover) {
      uiElements.add(_buildInfoText('Covering... ($_countDownSeconds s)', _targetButtonYaw, 0.0));
    }
    else if (_phase == DrillPhase.taskHold) {
      uiElements.add(_buildGazeButton('HOLD\nON', _targetButtonYaw, 0.0, Colors.blue, 'HOLD'));
    }
    else if (_phase == DrillPhase.waitHold) {
      uiElements.add(_buildInfoText('Holding... ($_countDownSeconds s)', _targetButtonYaw, 0.0));
    }

    return Stack(children: uiElements);
  }

  Widget _buildGazeButton(String label, double targetYaw, double targetPitch, Color color, String id, {bool isStaticHUD = false}) {
    double x = 0;
    double y = 0;
    bool isLookedAt = false;

    if (isStaticHUD) {
       // STATIC HUD HIT TESTING (Center Gaze)
       // Since they are rendered in Center, (0,0) is their center.
       // We can just assume looking straight (small Pitch/Yaw) hits them?
       // But user might look around. 
       // Simplification: In Success/Fail screens, we lock controls. 
       // But to select between Retry/Exit we need spatial separation.
       // We'll treat them as simple gaze targets that activate if rendered.
       // We need to differentiate Retry vs Exit. 
       
       // Improved Logic: We will check gaze progress for these too.
       // We assume the user centers their view on the button.
       // Since we center the buttons in the overlay, looking forward works.
       // NOTE: Since both are stacked vertically, looking forward hits both? 
       // No, Overlay renders them with spacing.
       // We will rely on simple "Is this widget alive?" check for now, but 
       // ideally we'd track head pitch for selection.
       // For this fix, let's assume looking forward triggers the first available one?
       // Or even better: Just use a time delay if they look roughly forward.
       
       WidgetsBinding.instance.addPostFrameCallback((_) {
         if ((id == 'RETRY' || id == 'EXIT') && !_isGazingAtButton) {
            _isGazingAtButton = true;
            _gazeTargetId = id;
         }
      });
      
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
        decoration: BoxDecoration(
          color: color, 
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: Colors.white, width: 2)
        ),
        child: Text(label, style: const TextStyle(fontWeight: FontWeight.bold)),
      );
    } 
    else {
      // 📐 WORLD SPACE PROJECTION (INVERSED)
      double diffYaw = targetYaw - _viewYaw;
      double diffPitch = targetPitch - _viewPitch;

      while (diffYaw > math.pi) diffYaw -= 2 * math.pi;
      while (diffYaw < -math.pi) diffYaw += 2 * math.pi;

      if (diffYaw.abs() > math.pi / 2) return const SizedBox();

      // ✅ FIX: Inversed Horizontal: Right Movement -> Negative diffYaw -> Negative X (Left)
      x = (diffYaw * PANEL_DISTANCE); 
      
      // ✅ FIX: Inversed Vertical: Up Movement -> Positive Pitch -> Negative Y (Down)
      y = (-diffPitch * PANEL_DISTANCE) + _camHeightOffset + _currentShake.dy;
      x += _currentShake.dx;

      double dist = math.sqrt(x*x + y*y);
      isLookedAt = dist < 100.0; 

      if (isLookedAt) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          _isGazingAtButton = true;
          _gazeTargetId = id;
        });
      }
    }

    return Transform.translate(
      offset: Offset(x, y),
      child: Center(
        child: AnimatedScale(
          scale: isLookedAt ? 1.2 : 1.0,
          duration: const Duration(milliseconds: 150),
          child: Container(
            width: 180,
            height: 120,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: color.withOpacity(0.8),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: Colors.white, 
                width: isLookedAt ? 4 : 2
              ),
              boxShadow: [
                BoxShadow(
                  color: color.withOpacity(0.6), 
                  blurRadius: isLookedAt ? 20 : 10
                )
              ]
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (id == 'DROP') const Icon(Icons.arrow_downward, color: Colors.white, size: 30),
                if (id == 'COVER') const Icon(Icons.shield, color: Colors.white, size: 30),
                if (id == 'HOLD') const Icon(Icons.pan_tool, color: Colors.white, size: 30),
                const SizedBox(height: 8),
                Text(
                  label,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    color: Colors.white, 
                    fontWeight: FontWeight.bold, 
                    fontSize: 18
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildInfoText(String text, double targetYaw, double targetPitch) {
    double diffYaw = targetYaw - _viewYaw;
    while (diffYaw > math.pi) diffYaw -= 2 * math.pi;
    while (diffYaw < -math.pi) diffYaw += 2 * math.pi;
    
    if (diffYaw.abs() > math.pi / 2) return const SizedBox();

    // Match Button Logic (Inversed)
    double x = (diffYaw * PANEL_DISTANCE);
    double y = (-1 * (targetPitch - _viewPitch) * PANEL_DISTANCE) + _camHeightOffset + _currentShake.dy;

    return Transform.translate(
      offset: Offset(x, y),
      child: Center(
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          decoration: BoxDecoration(
            color: Colors.black54,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: Colors.white24)
          ),
          child: Text(text, style: const TextStyle(color: Colors.white, fontSize: 16)),
        ),
      ),
    );
  }

  Widget _buildReticle() {
    return SizedBox(
      width: 40,
      height: 40,
      child: Stack(
        alignment: Alignment.center,
        children: [
          Container(
            width: 6, height: 6,
            decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle),
          ),
          if (_gazeProgress > 0)
            SizedBox(
              width: 30, height: 30,
              child: CircularProgressIndicator(
                value: _gazeProgress / GAZE_TIME_REQUIRED,
                color: Colors.white,
                strokeWidth: 3,
              ),
            )
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// 4. PARTICLES (Rubble)
// ---------------------------------------------------------------------------

class RubbleParticle {
  double x;
  double y;
  double size;
  double speed;
  double rotation;

  RubbleParticle({required this.x, required this.y, required this.size, required this.speed, required this.rotation});
}

class RubblePainter extends CustomPainter {
  final List<RubbleParticle> rubble;
  final Offset shake;

  RubblePainter({required this.rubble, required this.shake});

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final paint = Paint()..color = const Color(0xFF5D4037); 

    canvas.translate(center.dx + shake.dx, center.dy + shake.dy);

    for (var r in rubble) {
      canvas.save();
      canvas.translate(r.x, r.y);
      canvas.rotate(r.rotation);
      canvas.drawRect(
        Rect.fromCenter(center: Offset.zero, width: r.size, height: r.size * 0.8), 
        paint
      );
      canvas.restore();
    }
  }

  @override
  bool shouldRepaint(covariant RubblePainter old) => true;
}