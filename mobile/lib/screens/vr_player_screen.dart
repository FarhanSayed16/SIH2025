// ignore_for_file: unused_field

import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:flutter/services.dart';
import 'package:camera/camera.dart';
import 'package:video_player/video_player.dart';
import 'package:dchs_motion_sensors/dchs_motion_sensors.dart';
import 'package:vector_math/vector_math_64.dart' as vector;
import 'package:permission_handler/permission_handler.dart';
import 'package:youtube_explode_dart/youtube_explode_dart.dart';

/// ═══════════════════════════════════════════════════════════════════════════
/// VR 360° ENGINE - INFINITE STITCHING & STABLE ANCHORING
/// ═══════════════════════════════════════════════════════════════════════════

class VrPlayerEnhanced extends StatefulWidget {
  final String videoUrl;
  final bool isYouTube;
  final bool usePassthrough;
  final String? backgroundImagePath;

  const VrPlayerEnhanced({
    Key? key,
    required this.videoUrl,
    this.isYouTube = false,
    this.usePassthrough = true,
    this.backgroundImagePath,
  }) : super(key: key);

  @override
  State<VrPlayerEnhanced> createState() => _VrPlayerEnhancedState();
}

class _VrPlayerEnhancedState extends State<VrPlayerEnhanced>
    with SingleTickerProviderStateMixin {
  
  // ═══════════════════════════════════════════════════════════════════════════
  // 📐 QUATERNION STATE
  // ═══════════════════════════════════════════════════════════════════════════

  vector.Quaternion _stableTargetOrientation = vector.Quaternion.identity();
  vector.Quaternion _renderOrientation = vector.Quaternion.identity();
  vector.Quaternion _anchorOrientation = vector.Quaternion.identity();
  
  bool _isVideoPlaced = false;
  bool _isCountingDown = false;

  // ═══════════════════════════════════════════════════════════════════════════
  // ⚙️ TUNING
  // ═══════════════════════════════════════════════════════════════════════════

  static const double LOCK_DEADZONE_DEGREES = 0.50; 
  static const double INTERPOLATION_SPEED = 0.12; 
  
  // Video Plane Tuning
  static const double PANEL_DISTANCE = 700.0; 
  static const double LEFT_EYE_SHIFT = 8.0;
  static const double RIGHT_EYE_SHIFT = -8.0;

  // Background Stitching Tuning (From Ar360Viewer)
  static const double VIRTUAL_IMAGE_WIDTH = 3000.0; 
  static const double BG_SCALE = 0.9 ; 

  // ═══════════════════════════════════════════════════════════════════════════
  // CONTROLLERS
  // ═══════════════════════════════════════════════════════════════════════════

  CameraController? _cameraController;
  VideoPlayerController? _videoController;
  StreamSubscription<AbsoluteOrientationEvent>? _orientationSubscription;
  late Ticker _ticker; 

  bool _isReady = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    SystemChrome.setPreferredOrientations([
      DeviceOrientation.landscapeLeft, 
    ]);
    
    _ticker = createTicker(_onTick);
    _ticker.start();
    
    _initializeVrExperience();
  }

  Future<void> _initializeVrExperience() async {
    try {
      await Future.wait([
        _initCamera(),
        _initVideo(),
      ]);

      _initSensors();

      if (mounted) {
        setState(() => _isReady = true);
      }
    } catch (e) {
      debugPrint('VR Error: $e');
      if (mounted) {
        setState(() => _errorMessage = 'Failed to load: $e');
      }
    }
  }

  Future<void> _initCamera() async {
    if (!widget.usePassthrough) return;

    try {
      final status = await Permission.camera.request();
      if (!status.isGranted) return;

      final cameras = await availableCameras();
      final backCamera = cameras.firstWhere(
        (camera) => camera.lensDirection == CameraLensDirection.back,
        orElse: () => cameras.first,
      );

      _cameraController = CameraController(
        backCamera,
        ResolutionPreset.medium,
        enableAudio: false,
      );
      
      await _cameraController!.initialize();

      try {
        double minZoom = await _cameraController!.getMinZoomLevel();
        await _cameraController!.setZoomLevel(minZoom);
      } catch (e) {
        debugPrint('Zoom Error: $e');
      }

    } catch (e) {
      debugPrint('Camera Init Error: $e');
    }
  }

  Future<void> _initVideo() async {
    String playUrl = widget.videoUrl;
    
    if (widget.isYouTube) {
      final yt = YoutubeExplode();
      try {
        final videoId = VideoId(widget.videoUrl);
        final manifest = await yt.videos.streamsClient.getManifest(videoId)
            .timeout(const Duration(seconds: 10));
        playUrl = manifest.muxed.withHighestBitrate().url.toString();
      } catch (e) {
        throw Exception('Check internet connection.');
      } finally {
        yt.close();
      }
    }

    _videoController = VideoPlayerController.networkUrl(Uri.parse(playUrl));
    await _videoController!.initialize();
    _videoController!.setLooping(true);
    // _videoController!.play(); // Delayed start
  }

  void _initSensors() {
    _orientationSubscription = motionSensors.absoluteOrientation.listen((event) {
      if (!mounted) return;
      final q = vector.Quaternion.euler(event.yaw, event.pitch, event.roll);
      // Fix Landscape Axis Mapping (-90 deg around Z)
      final qCorrected = q * vector.Quaternion.axisAngle(vector.Vector3(0, 0, 1), -math.pi / 2);

      // Deadzone Logic
      double diff = _getAngleBetween(_stableTargetOrientation, qCorrected);
      double diffDegrees = diff * (180 / math.pi);

      if (diffDegrees > LOCK_DEADZONE_DEGREES) {
        _stableTargetOrientation = qCorrected;
      }
    });
  }

  void _onTick(Duration elapsed) {
    if (!_isReady) return;
    _renderOrientation = _slerp(_renderOrientation, _stableTargetOrientation, INTERPOLATION_SPEED);
    _renderOrientation.normalize();
    setState(() {}); 
  }

  void _resetPosition() {
    setState(() {
      _anchorOrientation = _renderOrientation.clone();
      _isVideoPlaced = true;
      _isCountingDown = true;
    });

    Future.delayed(const Duration(seconds: 5), () {
      if (mounted) {
        setState(() => _isCountingDown = false);
        _videoController?.play();
      }
    });
  }

  double _getAngleBetween(vector.Quaternion q1, vector.Quaternion q2) {
    double dot = q1.x * q2.x + q1.y * q2.y + q1.z * q2.z + q1.w * q2.w;
    if (dot < 0) dot = -dot;
    dot = dot.clamp(-1.0, 1.0);
    return 2 * math.acos(dot);
  }

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

  @override
  void dispose() {
    _orientationSubscription?.cancel();
    _orientationSubscription = null;
    _ticker.dispose();
    _cameraController?.dispose();
    _videoController?.dispose();
    SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_errorMessage != null) return _buildError();
    if (!_isReady) return _buildLoader();

    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          Row(
            children: [
              Expanded(child: _buildEye(isLeft: true)),
              Container(width: 2, color: Colors.black),
              Expanded(child: _buildEye(isLeft: false)),
            ],
          ),
          
          if (!_isVideoPlaced)
            _buildPlacementUI(),
            
          _buildExitButton(),
        ],
      ),
    );
  }

  Widget _buildEye({required bool isLeft}) {
    return ClipRect(
      child: Stack(
        fit: StackFit.expand,
        children: [
          // 1. BACKGROUND LAYER (Infinite 360 or Camera)
          if (widget.usePassthrough && _cameraController != null)
            Transform.scale(
              scale: 1.0, 
              child: Center(child: CameraPreview(_cameraController!)),
            )
          else 
            _buildInfiniteBackground(isLeft),

          // 2. VIDEO LAYER
          if (_isVideoPlaced)
            _buildProjectedVideo(isLeft),
        ],
      ),
    );
  }

  // 🔄 REPLACED LOGIC: Uses Ar360Viewer style stitching logic
  Widget _buildInfiniteBackground(bool isLeft) {
    if (widget.backgroundImagePath == null) {
      return Container(color: Colors.black);
    }

    final Size screenSize = MediaQuery.of(context).size;
    
    // Extract Yaw/Pitch from our stable Render Quaternion
    final vector.Vector3 forward = _renderOrientation.rotate(vector.Vector3(0, 0, -1));
    double sensorYaw = math.atan2(forward.x, -forward.z);
    double sensorPitch = math.asin(forward.y.clamp(-1.0, 1.0));

    // Normalize Yaw to 0.0 -> 1.0
    double normalizedYaw = (sensorYaw % (2 * math.pi)) / (2 * math.pi);
    if (normalizedYaw < 0) normalizedYaw += 1.0;

    // Convert to Pixel Offsets (Horizontal)
    double pixelOffset = normalizedYaw * VIRTUAL_IMAGE_WIDTH;

    // Vertical Pitch Logic
    double virtualHeight = screenSize.height * 3;
    double baseTop = -screenSize.height; // Center vertically
    double pitchScale = screenSize.height / 2.5; 
    
    // Invert Pitch logic to match "Look Up -> Background moves Down"
    double pixelPitch = (sensorPitch * pitchScale).clamp(-screenSize.height * 0.8, screenSize.height * 0.8);
    double topPosition = baseTop + pixelPitch;

    return Stack(
      children: [
        // Image 1 (Center)
        Positioned(
          left: -pixelOffset,
          top: topPosition,
          width: VIRTUAL_IMAGE_WIDTH,
          height: virtualHeight,
          child: _buildBgImage(),
        ),
        // Image 2 (Right Stitch)
        Positioned(
          left: -pixelOffset + VIRTUAL_IMAGE_WIDTH,
          top: topPosition,
          width: VIRTUAL_IMAGE_WIDTH,
          height: virtualHeight,
          child: _buildBgImage(),
        ),
        // Image 3 (Left Stitch)
        Positioned(
          left: -pixelOffset - VIRTUAL_IMAGE_WIDTH,
          top: topPosition,
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
        widget.backgroundImagePath!,
        fit: BoxFit.fill,
        gaplessPlayback: true, // Fixes flickering
      ),
    );
  }

  Widget _buildProjectedVideo(bool isLeft) {
    // 🧠 ANCHORED VIDEO LOGIC
    double yawDiff = _getYawDifference(_renderOrientation, _anchorOrientation );
    double pitchDiff = _getPitchDifference(_renderOrientation,_anchorOrientation);

    // 🚨 FIX: AXIS CORRECTION
    // Move Head Right -> Screen moves Left (Positive X Offset relative to center)
    // Move Head Up -> Screen moves Down (Positive Y Offset)
    double xOffset = -yawDiff * PANEL_DISTANCE; 
    double yOffset = -pitchDiff * PANEL_DISTANCE; 
    
    double stereoOffset = isLeft ? LEFT_EYE_SHIFT : RIGHT_EYE_SHIFT;

    double dist = math.sqrt(yawDiff * yawDiff + pitchDiff * pitchDiff);
    double opacity = (1.0 - (dist / 1.4)).clamp(0.0, 1.0);

    if (opacity <= 0.05) return const SizedBox();

    return Opacity(
      opacity: opacity,
      child: Transform.translate(
        offset: Offset(xOffset + stereoOffset, yOffset),
        child: Center(
          child: Transform(
            transform: Matrix4.identity()
              ..setEntry(3, 2, 0.001) 
              // Rotate panel to face user
              ..rotateY(-yawDiff * 0.95) 
              ..rotateX(pitchDiff * 0.95),
            alignment: Alignment.center,
            child: Container(
              width: 350,
              height: 196, 
              decoration: BoxDecoration(
                color: Colors.black,
                boxShadow: [
                  BoxShadow(color: Colors.cyan.withOpacity(0.5), blurRadius: 25)
                ],
                border: Border.all(color: Colors.white, width: 2),
              ),
                child: AspectRatio(
                  aspectRatio: 16/9,
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      VideoPlayer(_videoController!),
                      if (_isCountingDown)
                        Container(
                          color: Colors.black54,
                          child: const Center(
                            child: Text(
                              'STARTING IN 5s...',
                              style: TextStyle(
                                color: Colors.white, 
                                fontSize: 24, 
                                fontWeight: FontWeight.bold
                              ),
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
            ),
          ),
        ),
      ),
    );
  }

  double _getYawDifference(vector.Quaternion qCurrent, vector.Quaternion qAnchor) {
     final v1 = qCurrent.rotate(vector.Vector3(0, 0, -1));
     final v2 = qAnchor.rotate(vector.Vector3(0, 0, -1));
     v1.y = 0; v1.normalize();
     v2.y = 0; v2.normalize();
     double dot = v1.dot(v2).clamp(-1.0, 1.0);
     double angle = math.acos(dot);
     if (v1.cross(v2).y > 0) angle = -angle;
     return -angle; 
  }

  double _getPitchDifference(vector.Quaternion qCurrent, vector.Quaternion qAnchor) {
     final v1 = qCurrent.rotate(vector.Vector3(0, 0, -1));
     final v2 = qAnchor.rotate(vector.Vector3(0, 0, -1));
     return v2.y - v1.y; 
  }

  Widget _buildPlacementUI() {
    return Center(
      child: GestureDetector(
        onTap: _resetPosition,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 20),
          decoration: BoxDecoration(
            color: Colors.black.withOpacity(0.7),
            border: Border.all(color: Colors.cyan),
            borderRadius: BorderRadius.circular(30),
            boxShadow: [BoxShadow(color: Colors.cyan.withOpacity(0.3), blurRadius: 15)]
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: const [
              Icon(Icons.lock, color: Colors.cyan, size: 30),
              SizedBox(height: 10),
              Text('TAP TO LOCK SCREEN', 
                style: TextStyle(color: Colors.cyan, fontWeight: FontWeight.bold, letterSpacing: 1.5)
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildExitButton() {
    return Positioned(
      top: 10, left: 10,
      child: SafeArea(
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: () => Navigator.pop(context),
            borderRadius: BorderRadius.circular(20),
            child: Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: Colors.black54,
                shape: BoxShape.circle,
                border: Border.all(color: Colors.white24)
              ),
              child: const Icon(Icons.close, color: Colors.white),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildLoader() => const Scaffold(
    backgroundColor: Colors.black,
    body: Center(child: CircularProgressIndicator(color: Colors.cyan)),
  );

  Widget _buildError() => Scaffold(
    backgroundColor: Colors.black,
    body: Center(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Text(
          _errorMessage ?? 'Error', 
          textAlign: TextAlign.center,
          style: const TextStyle(color: Colors.red),
        ),
      ),
    ),
  );
}