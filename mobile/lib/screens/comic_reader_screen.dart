import 'dart:async';
import 'package:audioplayers/audioplayers.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../managers/game_manager.dart';

class ComicReaderScreen extends StatefulWidget {
  final int totalPages;
  final String topicName; // e.g., "EARTHQUAKE"
  final String characterName; // e.g., "doremon", "shinchan"

  const ComicReaderScreen({
    super.key, 
    this.totalPages = 10, 
    this.topicName = 'EARTHQUAKE',
    this.characterName = 'doremon', // Default
  });

  @override
  State<ComicReaderScreen> createState() => _ComicReaderScreenState();
}

class _ComicReaderScreenState extends State<ComicReaderScreen> {
  int _currentPage = 1;
  late AudioPlayer _audioPlayer;
  bool _isPlaying = false;
  String _currentLang = 'English';
  String _basePath = '';

  @override
  void initState() {
    super.initState();
    _audioPlayer = AudioPlayer();
    
    // Force Landscape for better comic viewing
    SystemChrome.setPreferredOrientations([
      DeviceOrientation.landscapeLeft,
      DeviceOrientation.landscapeRight,
    ]);

    _initStory();
  }

  void _initStory() {
    _currentLang = GameManager().selectedLanguage;

    // DYNAMIC PATH CONSTRUCTION
    // Structure: assets/Mod_game/{character}/{topic}/{language}/
    _basePath = 'Mod_game/${widget.characterName}/${widget.topicName}/$_currentLang';

    _playAudioForPage(_currentPage);
  }

  Future<void> _playAudioForPage(int pageIndex) async {
    try {
      await _audioPlayer.stop(); 
      String audioPath = '$_basePath/$pageIndex.mp3';
      await _audioPlayer.play(AssetSource(audioPath));
      setState(() => _isPlaying = true);
      
      _audioPlayer.onPlayerComplete.listen((event) {
        if (mounted) setState(() => _isPlaying = false);
      });

    } catch (e) {
      debugPrint('Error playing audio for page $pageIndex: $e');
    }
  }

  void _nextPage() {
    if (_currentPage < widget.totalPages) {
      setState(() {
        _currentPage++;
      });
      _playAudioForPage(_currentPage);
    } else {
      _finishStory();
    }
  }

  void _prevPage() {
    if (_currentPage > 1) {
      setState(() {
        _currentPage--;
      });
      _playAudioForPage(_currentPage);
    }
  }

  void _replayAudio() {
    _playAudioForPage(_currentPage);
  }

  void _finishStory() {
    _audioPlayer.stop();
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        backgroundColor: Colors.black87,
        title: Text(
          GameManager().getTrans('Win'), 
          style: const TextStyle(color: Colors.greenAccent, fontWeight: FontWeight.bold),
          textAlign: TextAlign.center,
        ),
        content: const Text(
          'Great job learning about safety!',
          style: TextStyle(color: Colors.white),
          textAlign: TextAlign.center,
        ),
        actions: [
          Center(
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: Colors.green),
              onPressed: () {
                Navigator.pop(ctx); 
                Navigator.pop(context); 
              },
              child: Text(GameManager().getTrans('Exit')),
            ),
          )
        ],
      ),
    );
  }

  @override
  void dispose() {
    _audioPlayer.dispose();
    SystemChrome.setPreferredOrientations([
      DeviceOrientation.portraitUp,
      DeviceOrientation.landscapeLeft,
      DeviceOrientation.landscapeRight,
    ]);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    String imagePath = 'assets/$_basePath/$_currentPage.png';

    return Scaffold(
      backgroundColor: const Color(0xFF2C3E50),
      body: SafeArea(
        child: Stack(
          children: [
            // --- 1. MAIN IMAGE AREA ---
            Center(
              child: Container(
                margin: const EdgeInsets.symmetric(horizontal: 60, vertical: 10),
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.white, width: 4),
                  borderRadius: BorderRadius.circular(12),
                  color: Colors.black,
                  boxShadow: const [BoxShadow(color: Colors.black45, blurRadius: 10, offset: Offset(0, 5))]
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: Image.asset(
                    imagePath,
                    fit: BoxFit.contain,
                    errorBuilder: (context, error, stackTrace) {
                      return Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.broken_image, color: Colors.white54, size: 50),
                            const SizedBox(height: 10),
                            Text('Missing Image: $_currentPage.png', style: const TextStyle(color: Colors.white54)),
                            Text('Path: $imagePath', style: const TextStyle(color: Colors.white24, fontSize: 10)),
                          ],
                        ),
                      );
                    },
                  ),
                ),
              ),
            ),

            // --- 2. TOP HUD ---
            Positioned(
              top: 10,
              left: 20,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(color: Colors.black54, borderRadius: BorderRadius.circular(20)),
              ),
            ),

            Positioned(
              top: 10,
              right: 20,
              child: IconButton(
                onPressed: () => Navigator.pop(context),
                icon: const Icon(Icons.close, color: Colors.white, size: 30),
              ),
            ),

            // --- 3. NAVIGATION BUTTONS ---
            if (_currentPage > 1)
              Positioned(
                left: 10,
                top: 0,
                bottom: 0,
                child: Center(
                  child: CircleAvatar(
                    backgroundColor: Colors.white.withOpacity(0.8),
                    radius: 25,
                    child: IconButton(
                      icon: const Icon(Icons.arrow_back, color: Colors.black),
                      onPressed: _prevPage,
                    ),
                  ),
                ),
              ),

            Positioned(
              right: 10,
              top: 0,
              bottom: 0,
              child: Center(
                child: CircleAvatar(
                  backgroundColor: Colors.greenAccent.withOpacity(0.9),
                  radius: 30,
                  child: IconButton(
                    icon: Icon(
                      _currentPage == widget.totalPages ? Icons.check : Icons.arrow_forward, 
                      color: Colors.black, size: 30
                    ),
                    onPressed: _nextPage,
                  ),
                ),
              ),
            ),

            // --- 4. AUDIO CONTROLS ---
            Positioned(
              bottom: 15,
              right: 80,
              child: FloatingActionButton.small(
                backgroundColor: _isPlaying ? Colors.green : Colors.orangeAccent,
                onPressed: _replayAudio,
                child: Icon(_isPlaying ? Icons.volume_up : Icons.replay),
              ),
            ),
          ],
        ),
      ),
    );
  }
}