import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';
import 'package:chewie/chewie.dart';

import '../screens/vr_player_screen.dart';
import '../screens/ar_360_viewer.dart';

class VideoPlayerView extends StatefulWidget {
  final String videoUrl;
  final String title;
  final VoidCallback onVideoCompleted;
  final bool vrPassthroughByDefault;
  final String? backgroundImagePath;
  /// When false, the learner must tap play (B5 / §11.2).
  final bool autoPlay;
  /// Fraction 0.0–1.0 to seek after initialize (NDMA resume, B9 / D06).
  final double? initialPosition;
  /// Called periodically and on dispose with current fraction + seconds.
  final void Function(double position, int watchTimeSeconds)? onPositionSave;

  const VideoPlayerView({
    Key? key,
    required this.videoUrl,
    required this.title,
    required this.onVideoCompleted,
    this.vrPassthroughByDefault = true,
    this.backgroundImagePath,
    this.autoPlay = false,
    this.initialPosition,
    this.onPositionSave,
  }) : super(key: key);

  @override
  State<VideoPlayerView> createState() => _VideoPlayerViewState();
}

class _VideoPlayerViewState extends State<VideoPlayerView>
    with WidgetsBindingObserver {
  VideoPlayerController? _videoPlayerController;
  ChewieController? _chewieController;

  bool _isError = false;
  bool _isInitializing = false;
  bool _completionFired = false;
  DateTime? _lastSaveAt;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _initializePlayer();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.paused ||
        state == AppLifecycleState.inactive) {
      _persistPosition(force: true);
    }
  }

  Future<void> _initializePlayer() async {
    if (_isInitializing) return;
    _isInitializing = true;

    try {
      _disposeControllers(savePosition: false);

      _videoPlayerController = VideoPlayerController.networkUrl(
        Uri.parse(widget.videoUrl),
      );

      await _videoPlayerController!.initialize();

      if (!mounted) return;

      final start = widget.initialPosition;
      if (start != null && start >= 0.02 && start < 0.95) {
        final duration = _videoPlayerController!.value.duration;
        if (duration.inMilliseconds > 0) {
          final target = Duration(
            milliseconds: (duration.inMilliseconds * start).round(),
          );
          await _videoPlayerController!.seekTo(target);
        }
      }

      if (!mounted) return;

      _videoPlayerController!.addListener(_videoListener);

      _chewieController = ChewieController(
        videoPlayerController: _videoPlayerController!,
        autoPlay: widget.autoPlay,
        looping: false,
        aspectRatio: _videoPlayerController!.value.aspectRatio,
        allowedScreenSleep: false,
        useRootNavigator: true,
        additionalOptions: (context) {
          return [
            OptionItem(
              iconData: Icons.view_in_ar,
              title: 'Experience Modes',
              onTap: (BuildContext ctx) {
                Navigator.pop(ctx);
                _showEnvironmentMenu(ctx, isVr: true);
              },
            ),
          ];
        },
        bufferingBuilder: (context) {
          return const Center(
            child: CircularProgressIndicator(color: Colors.white),
          );
        },
        errorBuilder: (context, errorMessage) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.error, color: Colors.white),
                const SizedBox(height: 8),
                const Text(
                  'Playback Error',
                  style: TextStyle(color: Colors.white),
                ),
                TextButton(
                  onPressed: () {
                    setState(() {
                      _isError = false;
                    });
                    _initializePlayer();
                  },
                  child: const Text('Retry'),
                ),
              ],
            ),
          );
        },
      );

      setState(() {
        _isError = false;
      });
    } catch (e) {
      debugPrint('Video Error: $e');
      if (mounted) {
        setState(() => _isError = true);
      }
    } finally {
      _isInitializing = false;
    }
  }

  void _videoListener() {
    final controller = _videoPlayerController;
    if (controller == null || !controller.value.isInitialized) return;

    if (!_completionFired) {
      final position = controller.value.position;
      final duration = controller.value.duration;

      if (duration.inMilliseconds > 0 &&
          position.inMilliseconds >= duration.inMilliseconds * 0.95) {
        _completionFired = true;
        _persistPosition(force: true);
        controller.removeListener(_videoListener);
        widget.onVideoCompleted();
        return;
      }
    }

    _persistPosition();
  }

  void _persistPosition({bool force = false}) {
    final callback = widget.onPositionSave;
    final controller = _videoPlayerController;
    if (callback == null || controller == null) return;
    if (!controller.value.isInitialized || _completionFired) return;

    final duration = controller.value.duration;
    if (duration.inMilliseconds <= 0) return;

    final now = DateTime.now();
    if (!force &&
        _lastSaveAt != null &&
        now.difference(_lastSaveAt!) < const Duration(seconds: 3)) {
      return;
    }
    _lastSaveAt = now;

    final position = controller.value.position;
    final fraction =
        (position.inMilliseconds / duration.inMilliseconds).clamp(0.0, 1.0);
    callback(fraction, position.inSeconds);
  }

  void _openVrMode(BuildContext context,
      {required bool passthrough, String? bgPath}) {
    _persistPosition(force: true);
    _videoPlayerController?.pause();

    Navigator.push(
      context,
      MaterialPageRoute<dynamic>(
        builder: (_) => VrPlayerEnhanced(
          videoUrl: widget.videoUrl,
          isYouTube: false,
          usePassthrough: passthrough,
          backgroundImagePath: bgPath ?? widget.backgroundImagePath,
        ),
      ),
    );
  }

  void _openAr360Mode(BuildContext context, String bgPath) {
    _persistPosition(force: true);
    _videoPlayerController?.pause();

    Navigator.push(
      context,
      MaterialPageRoute<dynamic>(
        builder: (_) => Ar360Viewer(
          imagePath: bgPath,
          videoUrl: widget.videoUrl,
          isYouTube: false,
        ),
      ),
    );
  }

  void _showEnvironmentMenu(BuildContext context, {required bool isVr}) {
    if (widget.backgroundImagePath != null) {
      if (isVr) {
        _openVrMode(context,
            passthrough: false, bgPath: widget.backgroundImagePath);
      } else {
        _openAr360Mode(context, widget.backgroundImagePath!);
      }
      return;
    }

    showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: Colors.black87,
        title: Text(
          isVr ? 'Choose VR Cinematic' : 'Choose AR Environment',
          style: const TextStyle(color: Colors.white),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (isVr) ...[
              ListTile(
                leading: const Icon(Icons.videocam, color: Colors.greenAccent),
                title: const Text('AR Passthrough (Camera)',
                    style: TextStyle(color: Colors.white)),
                onTap: () {
                  Navigator.pop(ctx);
                  _openVrMode(context, passthrough: true);
                },
              ),
              const Divider(color: Colors.white24),
              const Padding(
                padding: EdgeInsets.all(8.0),
                child: Text('Or Choose Environment:',
                    style: TextStyle(color: Colors.grey, fontSize: 12)),
              ),
            ],
            _buildScenarioOption(ctx, context, 'Earthquake',
                'assets/360image/EarthQuake_360.png', Icons.vibration, isVr),
            _buildScenarioOption(ctx, context, 'Flood',
                'assets/360image/Flood_360.png', Icons.water, isVr),
            _buildScenarioOption(
                ctx,
                context,
                'Fire Disaster',
                'assets/360image/FIre_disaster_360.png',
                Icons.local_fire_department,
                isVr),
            _buildScenarioOption(ctx, context, 'Tsunami',
                'assets/360image/Tsunami_360.png', Icons.waves, isVr),
            _buildScenarioOption(
                ctx,
                context,
                'Pandemic Lockdown',
                'assets/360image/Pandamic_Lockdown_360.png',
                Icons.local_hospital,
                isVr),
            _buildScenarioOption(ctx, context, 'Landslide',
                'assets/360image/Landslide_360.png', Icons.terrain, isVr),
            _buildScenarioOption(ctx, context, 'Heatwave',
                'assets/360image/Heatwave_360.png', Icons.wb_sunny, isVr),
            _buildScenarioOption(
                ctx,
                context,
                'Chemical Disaster',
                'assets/360image/chemical_disaster_360.png',
                Icons.warning_amber,
                isVr),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel', style: TextStyle(color: Colors.grey)),
          ),
        ],
      ),
    );
  }

  Widget _buildScenarioOption(BuildContext dialogContext,
      BuildContext parentContext, String name, String path, IconData icon,
      bool isVr) {
    return ListTile(
      leading: Icon(icon, color: Colors.cyan),
      title: Text(name, style: const TextStyle(color: Colors.white)),
      onTap: () {
        Navigator.pop(dialogContext);
        if (isVr) {
          _openVrMode(parentContext, passthrough: false, bgPath: path);
        } else {
          _openAr360Mode(parentContext, path);
        }
      },
    );
  }

  void _disposeControllers({bool savePosition = true}) {
    if (savePosition) {
      _persistPosition(force: true);
    }
    _videoPlayerController?.removeListener(_videoListener);
    _chewieController?.dispose();
    _chewieController = null;
    _videoPlayerController?.dispose();
    _videoPlayerController = null;
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _disposeControllers();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        iconTheme: const IconThemeData(color: Colors.white),
        titleTextStyle: const TextStyle(color: Colors.white, fontSize: 16),
        title: Text(widget.title),
        actions: [
          PopupMenuButton<String>(
            icon: const Icon(Icons.view_in_ar),
            tooltip: 'Experience Modes',
            onSelected: (value) {
              if (value == 'passthrough') {
                _openVrMode(context, passthrough: true);
              } else if (value == 'cinematic') {
                _showEnvironmentMenu(context, isVr: true);
              } else if (value == 'ar_view') {
                _showEnvironmentMenu(context, isVr: false);
              }
            },
            itemBuilder: (BuildContext context) => [
              const PopupMenuItem<String>(
                value: 'passthrough',
                child: Row(
                  children: [
                    Icon(Icons.videocam, size: 18),
                    SizedBox(width: 12),
                    Text('VR + Live Camera'),
                  ],
                ),
              ),
              const PopupMenuItem<String>(
                value: 'cinematic',
                child: Row(
                  children: [
                    Icon(Icons.movie, size: 18),
                    SizedBox(width: 12),
                    Text('VR Cinematic'),
                  ],
                ),
              ),
              const PopupMenuItem<String>(
                value: 'ar_view',
                child: Row(
                  children: [
                    Icon(Icons.threesixty, size: 18, color: Colors.cyan),
                    SizedBox(width: 12),
                    Text(
                      'AR 360° View',
                      style: TextStyle(
                        color: Colors.cyan,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
            ],
            enabled: _chewieController != null,
          ),
        ],
      ),
      body: SafeArea(
        child: _isError
            ? Center(
                child: TextButton.icon(
                  icon: const Icon(Icons.refresh, color: Colors.white),
                  label: const Text(
                    'Retry Connection',
                    style: TextStyle(color: Colors.white),
                  ),
                  onPressed: () {
                    setState(() {
                      _isError = false;
                    });
                    _initializePlayer();
                  },
                ),
              )
            : Center(
                child: (_chewieController != null &&
                        _videoPlayerController != null &&
                        _videoPlayerController!.value.isInitialized)
                    ? Chewie(controller: _chewieController!)
                    : const CircularProgressIndicator(color: Colors.white),
              ),
      ),
    );
  }
}
