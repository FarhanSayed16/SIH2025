/// Phase 3.1.3: Audio Player Widget
/// Plays pre-recorded audio files for non-reader content

import 'package:flutter/material.dart';
import 'package:audioplayers/audioplayers.dart';

class AudioPlayerWidget extends StatefulWidget {
  final String audioUrl;
  final bool autoplay;
  final Color? iconColor;
  final double? iconSize;

  const AudioPlayerWidget({
    super.key,
    required this.audioUrl,
    this.autoplay = false,
    this.iconColor,
    this.iconSize,
  });

  @override
  State<AudioPlayerWidget> createState() => _AudioPlayerWidgetState();
}

class _AudioPlayerWidgetState extends State<AudioPlayerWidget> {
  final AudioPlayer _audioPlayer = AudioPlayer();
  bool _isPlaying = false;
  bool _isLoading = false;
  bool _hasError = false;
  Duration _duration = Duration.zero;
  Duration _position = Duration.zero;

  @override
  void initState() {
    super.initState();
    _initAudioPlayer();
    
    if (widget.autoplay) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _play();
      });
    }
  }

  void _initAudioPlayer() {
    // Listen to player state changes
    _audioPlayer.onPlayerStateChanged.listen((state) {
      if (mounted) {
        setState(() {
          _isPlaying = state == PlayerState.playing;
          // Note: PlayerState doesn't have 'loading', checking for stopped/paused as not-playing
          _isLoading = false; // We'll track loading separately if needed
        });
      }
    });

    // Listen to duration changes
    _audioPlayer.onDurationChanged.listen((duration) {
      if (mounted) {
        setState(() {
          _duration = duration;
        });
      }
    });

    // Listen to position changes
    _audioPlayer.onPositionChanged.listen((position) {
      if (mounted) {
        setState(() {
          _position = position;
        });
      }
    });

    // Listen to completion
    _audioPlayer.onPlayerComplete.listen((_) {
      if (mounted) {
        setState(() {
          _isPlaying = false;
          _position = Duration.zero;
        });
      }
    });
  }

  Future<void> _play() async {
    if (widget.audioUrl.isEmpty) return;

    try {
      setState(() {
        _hasError = false;
        _isLoading = true;
      });

      await _audioPlayer.play(UrlSource(widget.audioUrl));
    } catch (e) {
      if (mounted) {
        setState(() {
          _hasError = true;
          _isLoading = false;
          _isPlaying = false;
        });
      }
    }
  }

  Future<void> _pause() async {
    await _audioPlayer.pause();
  }

  Future<void> _stop() async {
    await _audioPlayer.stop();
    if (mounted) {
      setState(() {
        _position = Duration.zero;
      });
    }
  }

  @override
  void dispose() {
    try {
      // Stop audio before disposing
      _audioPlayer.stop().catchError((e) {
        // Ignore stop errors
      });
    } catch (e) {
      // Ignore stop errors
    }
    
    try {
      _audioPlayer.dispose();
    } catch (e) {
      // Audio player already disposed or not initialized - ignore error
      debugPrint('Audio player dispose error (ignored): $e');
    }
    
    super.dispose();
  }

  String _formatDuration(Duration duration) {
    String twoDigits(int n) => n.toString().padLeft(2, '0');
    final minutes = twoDigits(duration.inMinutes.remainder(60));
    final seconds = twoDigits(duration.inSeconds.remainder(60));
    return '$minutes:$seconds';
  }

  @override
  Widget build(BuildContext context) {
    final iconColor = widget.iconColor ?? Theme.of(context).primaryColor;
    final iconSize = widget.iconSize ?? 48.0;

    if (_hasError) {
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.red[50],
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.red[200]!),
        ),
        child: Row(
          children: [
            Icon(Icons.error_outline, color: Colors.red[700]),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                'Failed to load audio',
                style: TextStyle(color: Colors.red[700]),
              ),
            ),
          ],
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.blue[50],
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.blue[200]!),
      ),
      child: Column(
        children: [
          Row(
            children: [
              IconButton(
                iconSize: iconSize,
                icon: _isLoading
                    ? SizedBox(
                        width: iconSize,
                        height: iconSize,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: iconColor,
                        ),
                      )
                    : Icon(
                        _isPlaying ? Icons.pause_circle : Icons.play_circle,
                        size: iconSize,
                        color: iconColor,
                      ),
                onPressed: _isLoading
                    ? null
                    : () {
                        if (_isPlaying) {
                          _pause();
                        } else {
                          _play();
                        }
                      },
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _isPlaying ? 'Playing...' : 'Tap to play',
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    if (_duration.inSeconds > 0) ...[
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Text(
                            _formatDuration(_position),
                            style: Theme.of(context).textTheme.bodySmall,
                          ),
                          Expanded(
                            child: LinearProgressIndicator(
                              value: _duration.inSeconds > 0
                                  ? _position.inSeconds / _duration.inSeconds
                                  : 0,
                              backgroundColor: Colors.blue[200],
                              valueColor: AlwaysStoppedAnimation<Color>(iconColor),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            _formatDuration(_duration),
                            style: Theme.of(context).textTheme.bodySmall,
                          ),
                        ],
                      ),
                    ],
                  ],
                ),
              ),
              if (_isPlaying || _position.inSeconds > 0)
                IconButton(
                  icon: const Icon(Icons.stop),
                  onPressed: _stop,
                  tooltip: 'Stop',
                ),
            ],
          ),
        ],
      ),
    );
  }
}

