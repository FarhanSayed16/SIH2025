/// Comic reader — page indicator, explicit narration, portrait restore (B6 §12.3).

import 'dart:async';
import 'package:audioplayers/audioplayers.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../managers/game_manager.dart';

class ComicReaderScreen extends StatefulWidget {
  final int totalPages;
  final String topicName;
  final String characterName;

  const ComicReaderScreen({
    super.key,
    this.totalPages = 10,
    this.topicName = 'EARTHQUAKE',
    this.characterName = 'doremon',
  });

  @override
  State<ComicReaderScreen> createState() => _ComicReaderScreenState();
}

class _ComicReaderScreenState extends State<ComicReaderScreen> {
  int _currentPage = 1;
  late AudioPlayer _audioPlayer;
  bool _isPlaying = false;
  StreamSubscription<void>? _audioCompletion;
  bool get _hasAudio => widget.characterName == 'doremon';
  String _currentLang = 'English';
  String _basePath = '';

  @override
  void initState() {
    super.initState();
    _audioPlayer = AudioPlayer();
    _audioCompletion = _audioPlayer.onPlayerComplete.listen((_) {
      if (mounted) setState(() => _isPlaying = false);
    });
    // Prefer current orientation for reading; landscape remains available.
    _initStory();
  }

  void _initStory() {
    _currentLang = GameManager().selectedLanguage;
    _basePath =
        'Mod_game/${widget.characterName}/${widget.topicName}/$_currentLang';
  }

  Future<void> _playAudioForPage(int pageIndex) async {
    try {
      await _audioPlayer.stop();
      if (mounted) setState(() => _isPlaying = false);
      if (!_hasAudio) return;
      final audioPath = '$_basePath/$pageIndex.mp3';
      await _audioPlayer.play(AssetSource(audioPath));
      if (mounted) setState(() => _isPlaying = true);
    } catch (e) {
      debugPrint('Error playing audio for page $pageIndex: $e');
      if (mounted) setState(() => _isPlaying = false);
    }
  }

  Future<void> _toggleAudio() async {
    if (!_hasAudio) return;
    if (_isPlaying) {
      await _audioPlayer.stop();
      if (mounted) setState(() => _isPlaying = false);
      return;
    }
    await _playAudioForPage(_currentPage);
  }

  void _nextPage() {
    _audioPlayer.stop();
    if (_currentPage < widget.totalPages) {
      setState(() {
        _currentPage++;
        _isPlaying = false;
      });
    } else {
      _finishStory();
    }
  }

  void _prevPage() {
    if (_currentPage > 1) {
      _audioPlayer.stop();
      setState(() {
        _currentPage--;
        _isPlaying = false;
      });
    }
  }

  void _finishStory() {
    _audioPlayer.stop();
    showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        title: Text(GameManager().getTrans('Win')),
        content: const Text('Great job learning about safety!'),
        actions: [
          FilledButton(
            onPressed: () {
              Navigator.pop(ctx);
              Navigator.pop(context);
            },
            child: Text(GameManager().getTrans('Exit')),
          ),
        ],
      ),
    );
  }

  Future<void> _close() async {
    await _audioPlayer.stop();
    if (mounted) Navigator.pop(context);
  }

  @override
  void dispose() {
    _audioCompletion?.cancel();
    _audioPlayer.dispose();
    SystemChrome.setPreferredOrientations([
      DeviceOrientation.portraitUp,
    ]);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final imagePath = 'assets/$_basePath/$_currentPage.png';
    final theme = Theme.of(context);

    return PopScope(
      canPop: true,
      onPopInvokedWithResult: (didPop, _) async {
        if (didPop) await _audioPlayer.stop();
      },
      child: Scaffold(
        backgroundColor: const Color(0xFF1E2A32),
        appBar: AppBar(
          backgroundColor: Colors.black87,
          foregroundColor: Colors.white,
          leading: IconButton(
            tooltip: 'Close',
            icon: const Icon(Icons.close),
            onPressed: _close,
          ),
          title: Text(
            '$_currentPage / ${widget.totalPages}',
            style: const TextStyle(fontSize: 16),
          ),
          centerTitle: true,
          actions: [
            if (_hasAudio)
              IconButton(
                tooltip: _isPlaying ? 'Stop narration' : 'Play narration',
                onPressed: _toggleAudio,
                icon: Icon(_isPlaying ? Icons.stop_circle_outlined : Icons.volume_up),
              )
            else
              Padding(
                padding: const EdgeInsets.only(right: 12),
                child: Center(
                  child: Text(
                    'No narration',
                    style: theme.textTheme.labelSmall?.copyWith(
                      color: Colors.white70,
                    ),
                  ),
                ),
              ),
          ],
        ),
        body: SafeArea(
          child: Column(
            children: [
              Expanded(
                child: InteractiveViewer(
                  minScale: 1,
                  maxScale: 3,
                  child: Center(
                    child: Image.asset(
                      imagePath,
                      fit: BoxFit.contain,
                      errorBuilder: (context, error, stackTrace) {
                        return const Padding(
                          padding: EdgeInsets.all(24),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.broken_image,
                                  color: Colors.white54, size: 48),
                              SizedBox(height: 12),
                              Text(
                                'This page image is unavailable.',
                                style: TextStyle(color: Colors.white70),
                                textAlign: TextAlign.center,
                              ),
                            ],
                          ),
                        );
                      },
                    ),
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
                child: Row(
                  children: [
                    SizedBox(
                      width: 56,
                      height: 56,
                      child: IconButton.filledTonal(
                        onPressed: _currentPage > 1 ? _prevPage : null,
                        icon: const Icon(Icons.arrow_back),
                        tooltip: 'Previous page',
                      ),
                    ),
                    const Spacer(),
                    Text(
                      widget.topicName,
                      style: const TextStyle(color: Colors.white70),
                    ),
                    const Spacer(),
                    SizedBox(
                      width: 56,
                      height: 56,
                      child: IconButton.filled(
                        onPressed: _nextPage,
                        icon: Icon(
                          _currentPage == widget.totalPages
                              ? Icons.check
                              : Icons.arrow_forward,
                        ),
                        tooltip: _currentPage == widget.totalPages
                            ? 'Finish'
                            : 'Next page',
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
