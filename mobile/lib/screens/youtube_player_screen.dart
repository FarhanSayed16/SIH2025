import 'package:flutter/material.dart';
import 'package:youtube_player_flutter/youtube_player_flutter.dart';

// Ensure this points to the VR engine file
import '../screens/vr_player_screen.dart';
// Import the new AR Viewer
import '../screens/ar_360_viewer.dart';
import '../core/design/design_system.dart';

class YoutubePlayerScreen extends StatefulWidget {
  final String videoUrl;
  final String title;
  final bool vrPassthroughByDefault;
  final String? backgroundImagePath; // Optional: Force a specific background

  const YoutubePlayerScreen({
    Key? key,
    required this.videoUrl,
    required this.title,
    this.vrPassthroughByDefault = true,
    this.backgroundImagePath,
  }) : super(key: key);

  @override
  State<YoutubePlayerScreen> createState() => _YoutubePlayerScreenState();
}

class _YoutubePlayerScreenState extends State<YoutubePlayerScreen> {
  late YoutubePlayerController _controller;
  bool _isReady = false;

  @override
  void initState() {
    super.initState();

    final videoId = YoutubePlayer.convertUrlToId(widget.videoUrl) ?? '';

    _controller = YoutubePlayerController(
      initialVideoId: videoId,
      flags: const YoutubePlayerFlags(
        autoPlay: true,
        mute: false,
        enableCaption: true,
        forceHD: false,
        disableDragSeek: false,
      ),
    )..addListener(_onPlayerChanged);
  }

  void _onPlayerChanged() {
    if (!_isReady && _controller.value.isReady) {
      setState(() => _isReady = true);
    }
  }

  @override
  void dispose() {
    _controller.removeListener(_onPlayerChanged);
    _controller.dispose();
    super.dispose();
  }

  /// Launch VR Mode (Stereoscopic)
  void _openVrMode({required bool passthrough, String? bgPath}) {
    _controller.pause();

    Navigator.push(
      context,
      MaterialPageRoute<dynamic>(
        builder: (_) => VrPlayerEnhanced(
          videoUrl: widget.videoUrl,
          isYouTube: true,
          usePassthrough: passthrough,
          backgroundImagePath: bgPath ?? widget.backgroundImagePath,
        ),
      ),
    );
  }

  /// Launch AR 360 Mode (Monoscopic / Single Screen)
  void _openAr360Mode(String bgPath) {
    _controller.pause();

    Navigator.push(
      context,
      MaterialPageRoute<dynamic>(
        builder: (_) => Ar360Viewer(
          imagePath: bgPath,
          videoUrl: widget.videoUrl,
          isYouTube: true,
        ),
      ),
    );
  }

  /// Show dialog to pick the 360 environment
  void _showEnvironmentMenu({required bool isVr}) {
    // If a background path was forced in constructor, use it directly
    if (widget.backgroundImagePath != null) {
      if (isVr) {
        _openVrMode(passthrough: false, bgPath: widget.backgroundImagePath);
      } else {
        _openAr360Mode(widget.backgroundImagePath!);
      }
      return;
    }

    // Otherwise, let the user pick the scenario
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
            _buildScenarioOption(ctx, 'Earthquake', 'assets/360image/EarthQuake_360.png', Icons.vibration, isVr),
            _buildScenarioOption(ctx, 'Flood', 'assets/360image/Flood_360.png', Icons.water, isVr),
            _buildScenarioOption(ctx, 'Fire Disaster', 'assets/360image/FIre_disaster_360.png', Icons.local_fire_department, isVr),
            _buildScenarioOption(ctx, 'Tsunami', 'assets/360image/Tsunami_360.png', Icons.waves, isVr),
            _buildScenarioOption(ctx, 'Pandemic Lockdown', 'assets/360image/Pandamic_Lockdown_360.png', Icons.local_hospital, isVr),
            _buildScenarioOption(ctx, 'Landslide', 'assets/360image/Landslide_360.png', Icons.terrain, isVr),
            _buildScenarioOption(ctx, 'Heatwave', 'assets/360image/Heatwave_360.png', Icons.wb_sunny, isVr),
            _buildScenarioOption(ctx, 'Chemical Disaster', 'assets/360image/chemical_disaster_360.png', Icons.warning_amber, isVr),
            _buildScenarioOption(ctx, 'Class Room Fire', 'assets/360image/Classroom_is _on_fire_360.png', Icons.warning_amber, isVr),
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

  Widget _buildScenarioOption(BuildContext ctx, String name, String path, IconData icon, bool isVr) {
    return ListTile(
      leading: Icon(icon, color: Colors.cyan),
      title: Text(name, style: const TextStyle(color: Colors.white)),
      onTap: () {
        Navigator.pop(ctx);
        if (isVr) {
          _openVrMode(passthrough: false, bgPath: path);
        } else {
          _openAr360Mode(path);
        }
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        foregroundColor: Colors.white,
        title: Text(widget.title),
        actions: [
          PopupMenuButton<String>(
            icon: Container(
              margin: const EdgeInsets.only(right: 8),
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.purple.withOpacity(0.2),
                borderRadius: AppBorders.borderRadiusLg,
                border: Border.all(
                  color: Colors.purpleAccent.withOpacity(0.5),
                ),
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.view_in_ar, size: 18),
                  SizedBox(width: 4),
                  Text(
                    'MODES',
                    style: TextStyle(fontSize: 12),
                  ),
                ],
              ),
            ),
            tooltip: 'Experience Modes',
            onSelected: (value) {
              if (value == 'passthrough') {
                _openVrMode(passthrough: true);
              } else if (value == 'cinematic') {
                _showEnvironmentMenu(isVr: true);
              } else if (value == 'ar_view') {
                _showEnvironmentMenu(isVr: false);
              }
            },
            itemBuilder: (BuildContext context) => [
              // 1. VR Passthrough
              const PopupMenuItem<String>(
                value: 'passthrough',
                child: Row(
                  children: [
                    Icon(Icons.videocam, size: 16),
                    SizedBox(width: 12),
                    Text('VR + Live Camera'),
                  ],
                ),
              ),
              // 2. VR Cinematic
              const PopupMenuItem<String>(
                value: 'cinematic',
                child: Row(
                  children: [
                    Icon(Icons.movie, size: 16),
                    SizedBox(width: 12),
                    Text('VR Cinematic'),
                  ],
                ),
              ),
              // 3. AR View (New Option)
              const PopupMenuItem<String>(
                value: 'ar_view',
                child: Row(
                  children: [
                    Icon(Icons.threesixty, size: 16, color: Colors.cyan),
                    SizedBox(width: 12),
                    Text(
                      'AR 360Â° View',
                      style: TextStyle(color: Colors.cyan, fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
              ),
            ],
            enabled: _isReady,
          ),
        ],
      ),
      body: Center(
        child: YoutubePlayer(
          controller: _controller,
          showVideoProgressIndicator: true,
          progressIndicatorColor: Colors.red,
          progressColors: const ProgressBarColors(
            playedColor: Colors.red,
            handleColor: Colors.redAccent,
          ),
        ),
      ),
    );
  }
}