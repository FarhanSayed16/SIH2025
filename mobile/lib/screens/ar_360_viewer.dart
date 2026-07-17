// ignore_for_file: unused_field

import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:flutter/services.dart';
import 'package:dchs_motion_sensors/dchs_motion_sensors.dart';
import 'package:vector_math/vector_math_64.dart' as vector;
import 'package:video_player/video_player.dart';
import 'package:youtube_explode_dart/youtube_explode_dart.dart';

/// ═══════════════════════════════════════════════════════════════════════════
/// AR 360° VIEWER (Vertical Support, Infinite Loop, Floating Video)
/// ═══════════════════════════════════════════════════════════════════════════

class Ar360Viewer extends StatefulWidget {
  final String imagePath;
  final String? videoUrl; // Optional: If provided, plays video in 3D space
  final bool isYouTube;

  const Ar360Viewer({
    Key? key,
    required this.imagePath,
    this.videoUrl,
    this.isYouTube = false,
  }) : super(key: key);

  @override
  State<Ar360Viewer> createState() => _Ar360ViewerState();
}

class _Ar360ViewerState extends State<Ar360Viewer>
    with SingleTickerProviderStateMixin {
  
  // ═══════════════════════════════════════════════════════════════════════════
  // 📐 STATE
  // ═══════════════════════════════════════════════════════════════════════════

  vector.Quaternion _sensorOrientation = vector.Quaternion.identity();
  
  // Touch offsets (User dragging finger)
  double _touchYaw = 0.0;
  double _touchPitch = 0.0;

  // Final calculated view angles
  double _finalYaw = 0.0;
  double _finalPitch = 0.0;

  // Video Placement State
  bool _isVideoPlaced = false;
  double _anchorYaw = 0.0;
  double _anchorPitch = 0.0;

  // ═══════════════════════════════════════════════════════════════════════════
  // ⚙️ TUNING
  // ═══════════════════════════════════════════════════════════════════════════

  static const double TOUCH_SENSITIVITY = 0.005;
  // This constant defines how many pixels "wide" the 360 image is virtually.
  // Larger number = slower rotation of background relative to sensor.
  static const double VIRTUAL_IMAGE_WIDTH = 3000.0; 
  static const double BG_SCALE = 1.1; // Slightly reduced scale as we stretch vertically
  static const double PANEL_DISTANCE = 500.0; // Distance of the virtual screen

  StreamSubscription<AbsoluteOrientationEvent>? _orientationSubscription;
  late Ticker _ticker;
  VideoPlayerController? _videoController;

  @override
  void initState() {
    super.initState();
    // REMOVED: SystemChrome.setPreferredOrientations to allow VERTICAL use.

    _initSensors();
    if (widget.videoUrl != null) {
      _initVideo();
    }

    _ticker = createTicker(_onTick);
    _ticker.start();
  }

  Future<void> _initVideo() async {
    String playUrl = widget.videoUrl!;
    
    if (widget.isYouTube) {
      final yt = YoutubeExplode();
      try {
        final videoId = VideoId(widget.videoUrl!);
        final manifest = await yt.videos.streamsClient.getManifest(videoId)
            .timeout(const Duration(seconds: 10));
        playUrl = manifest.muxed.withHighestBitrate().url.toString();
      } catch (e) {
        debugPrint('YouTube Error: $e');
      } finally {
        yt.close();
      }
    }

    _videoController = VideoPlayerController.networkUrl(Uri.parse(playUrl));
    await _videoController!.initialize();
    _videoController!.setLooping(true);
    _videoController!.play();
    setState(() {});
  }

  void _initSensors() {
    motionSensors.absoluteOrientationUpdateInterval = Duration.microsecondsPerSecond ~/ 60;
    _orientationSubscription = motionSensors.absoluteOrientation.listen((event) {
      if (!mounted) return;
      final q = vector.Quaternion.euler(event.yaw, event.pitch, event.roll);
      if (!mounted) return;
      setState(() {
        _sensorOrientation = q;
      });
    });
  }

  void _onTick(Duration elapsed) {
    // Convert Quaternion to Euler angles for mapping
    final vector.Vector3 forward = _sensorOrientation.rotate(vector.Vector3(0, 0, -1));
    
    double sensorYaw = math.atan2(forward.x, -forward.z);
    double sensorPitch = math.asin(forward.y.clamp(-1.0, 1.0));

    setState(() {
      _finalYaw = sensorYaw + _touchYaw;
      _finalPitch = sensorPitch + _touchPitch;
    });
  }

  void _placeOrResetScreen() {
    setState(() {
      if (_isVideoPlaced) {
        // If already placed, maybe we want to un-place or just re-center?
        // Let's re-center it to current view.
        _anchorYaw = _finalYaw;
        _anchorPitch = _finalPitch;
      } else {
        // Place it for the first time
        _isVideoPlaced = true;
        _anchorYaw = _finalYaw;
        _anchorPitch = _finalPitch;
      }
    });
  }

  @override
  void dispose() {
    _orientationSubscription?.cancel();
    _orientationSubscription = null;
    _ticker.dispose();
    _videoController?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          // 1. Gesture Layer
          GestureDetector(
            onScaleUpdate: (details) {
              setState(() {
                // Adjusts view based on finger drag (Street View style)
                _touchYaw += details.focalPointDelta.dx * TOUCH_SENSITIVITY;
                _touchPitch += details.focalPointDelta.dy * TOUCH_SENSITIVITY;
              });
            },
            child: Container(
              color: Colors.black,
              width: double.infinity,
              height: double.infinity,
              child: ClipRect(
                child: Stack(
                  children: [
                    // A. Infinite Background (Stitched & Stretched)
                    _buildInfiniteBackground(),

                    // B. Floating Video Plane
                    if (_videoController != null && _videoController!.value.isInitialized)
                      _buildVideoPlane(),
                  ],
                ),
              ),
            ),
          ),

          // 2. HUD / Controls
          _buildHUD(),

          // 3. Back Button
          Positioned(
            top: 40, left: 20,
            child: InkWell(
              onTap: () => Navigator.pop(context),
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.black54,
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white30),
                ),
                child: const Icon(Icons.arrow_back, color: Colors.white),
              ),
            ),
          ),
        ],
      ),
    );
  }

  /// 🔄 This creates the "Infinite Scroll" effect to remove black spots.
  /// It renders the image twice side-by-side based on the current Yaw angle.
  /// Now vertically stretched to ensure no black bars at top/bottom.
  Widget _buildInfiniteBackground() {
    final Size screenSize = MediaQuery.of(context).size;
    
    // 1. Normalize Yaw to a 0.0 to 1.0 range (0 to 360 degrees)
    double normalizedYaw = (_finalYaw % (2 * math.pi)) / (2 * math.pi);
    if (normalizedYaw < 0) normalizedYaw += 1.0;

    // 2. Convert to Pixel Offset (Horizontal)
    double pixelOffset = normalizedYaw * VIRTUAL_IMAGE_WIDTH;

    // 3. Vertical Shift (Pitch) 
    // We scale the pitch movement so it moves nicely but never reveals the edge.
    // Height is 3x screen height, so we have 1x screen height of buffer above and below.
    double virtualHeight = screenSize.height * 3;
    
    // Center the image vertically: -1 * screenSize.height centers the 3x height image
    double baseTop = -screenSize.height;
    
    // Add pitch offset. Positive pitch (look up) -> Image moves down (positive Y)
    // We clamp movement to half the screen height to be safe.
    double pitchScale = screenSize.height / 2.5; 
    double pixelPitch = (_finalPitch * pitchScale).clamp(-screenSize.height * 0.8, screenSize.height * 0.8);

    double topPosition = baseTop + pixelPitch;

    return Stack(
      children: [
        // Image Instance 1 (Primary)
        Positioned(
          left: -pixelOffset,
          top: topPosition,
          width: VIRTUAL_IMAGE_WIDTH,
          height: virtualHeight,
          child: _buildBgImage(),
        ),
        // Image Instance 2 (The Stitch/Loop)
        // Placed immediately to the RIGHT of Instance 1
        Positioned(
          left: -pixelOffset + VIRTUAL_IMAGE_WIDTH,
          top: topPosition,
          width: VIRTUAL_IMAGE_WIDTH,
          height: virtualHeight,
          child: _buildBgImage(),
        ),
         // Image Instance 3 (The Left Buffer)
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
        widget.imagePath,
        fit: BoxFit.fill, // ✅ CHANGED: Stretches image to fill the tall vertical space
        gaplessPlayback: true,
      ),
    );
  }

  Widget _buildVideoPlane() {
    if (!_isVideoPlaced) return const SizedBox();

    // Calculate delta between where we are looking (_final) and where screen is (_anchor)
    double diffYaw = _anchorYaw - _finalYaw;
    double diffPitch = _anchorPitch - _finalPitch;

    // 🧠 FIXED LOGIC TO MATCH REFERENCE CODE
    // 1. Horizontal: If I look Right (Yaw increases), plane should move Left.
    //    diffYaw = Anchor - Final (Negative).
    //    xOffset = diffYaw * Distance (Negative). Plane moves Left. Correct.
    double xOffset = diffYaw * PANEL_DISTANCE;

    // 2. Vertical: If I look Up (Pitch increases), plane should move Down.
    //    diffPitch = Anchor - Final (Negative).
    //    yOffset = diffPitch * Distance (Negative). 
    //    *Note: If sensor pitch decreases on look up, this logic auto-corrects.
    //    We removed the negative sign to match reference code structure.
    double yOffset = diffPitch * PANEL_DISTANCE;

    // Fade out if user looks too far away (approx 90 degrees)
    double dist = math.sqrt(diffYaw * diffYaw + diffPitch * diffPitch);
    double opacity = (1.0 - (dist / 1.5)).clamp(0.0, 1.0);

    if (opacity <= 0.05) return const SizedBox();

    return Opacity(
      opacity: opacity,
      child: Center(
        child: Transform(
          transform: Matrix4.identity()
            ..setEntry(3, 2, 0.001) // Perspective depth
            ..translate(xOffset, yOffset)
            ..rotateY(-diffYaw) // Face the user
            ..rotateX(diffPitch),
          alignment: Alignment.center,
          child: Container(
            width: 300, // Slightly smaller for Portrait
            height: 168,
            decoration: BoxDecoration(
              color: Colors.black,
              border: Border.all(color: Colors.white, width: 2),
              boxShadow: [
                BoxShadow(color: Colors.cyan.withOpacity(0.5), blurRadius: 20)
              ],
            ),
            child: Stack(
              children: [
                VideoPlayer(_videoController!),
                // Drag handle visual
                Align(
                  alignment: Alignment.topCenter,
                  child: Container(
                    width: 40, height: 4,
                    margin: const EdgeInsets.only(top: 4),
                    color: Colors.white24,
                  ),
                )
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHUD() {
    if (_isVideoPlaced) {
      // If placed, show a small "Reset" button
      return Positioned(
        bottom: 40,
        right: 30,
        child: FloatingActionButton.small(
          backgroundColor: Colors.white24,
          onPressed: _placeOrResetScreen,
          child: const Icon(Icons.refresh, color: Colors.white),
        ),
      );
    }

    // If NOT placed, show the big "Place Here" button
    return Positioned(
      bottom: 100,
      left: 0, 
      right: 0,
      child: Center(
        child: GestureDetector(
          onTap: _placeOrResetScreen,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
            decoration: BoxDecoration(
              color: Colors.cyan.withOpacity(0.9),
              borderRadius: BorderRadius.circular(30),
              boxShadow: const [BoxShadow(color: Colors.black45, blurRadius: 10)],
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: const [
                Icon(Icons.screen_share, color: Colors.white),
                SizedBox(width: 8),
                Text(
                  'TAP TO PLACE VIDEO',
                  style: TextStyle(
                    color: Colors.white, 
                    fontWeight: FontWeight.bold,
                    letterSpacing: 1.1
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}