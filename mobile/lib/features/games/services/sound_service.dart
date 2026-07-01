/// Phase 3.2: Game Sound Service
/// Handles sound effects for games (optional enhancement)

import 'package:audioplayers/audioplayers.dart';
import 'package:flutter/services.dart';
import 'package:flutter/foundation.dart';

class GameSoundService {
  static final GameSoundService _instance = GameSoundService._internal();
  factory GameSoundService() => _instance;
  GameSoundService._internal();

  AudioPlayer? _audioPlayer;
  bool _soundsEnabled = true;
  bool _isDisposed = false;

  bool get soundsEnabled => _soundsEnabled;

  void setSoundsEnabled(bool enabled) {
    _soundsEnabled = enabled;
  }

  // Play system sound (no external files needed)
  Future<void> playSuccess() async {
    if (!_soundsEnabled || _isDisposed) return;
    try {
      await SystemSound.play(SystemSoundType.alert);
    } catch (e) {
      // Ignore errors - sounds are optional
      if (kDebugMode) {
        print('Sound play error (ignored): $e');
      }
    }
  }

  Future<void> playError() async {
    if (!_soundsEnabled || _isDisposed) return;
    try {
      // Use haptic feedback as fallback
      await HapticFeedback.heavyImpact();
    } catch (e) {
      // Ignore errors
      if (kDebugMode) {
        print('Haptic feedback error (ignored): $e');
      }
    }
  }

  Future<void> playItemDrop() async {
    if (!_soundsEnabled || _isDisposed) return;
    try {
      await SystemSound.play(SystemSoundType.alert);
    } catch (e) {
      // Ignore errors
      if (kDebugMode) {
        print('Sound play error (ignored): $e');
      }
    }
  }

  Future<void> playLevelComplete() async {
    if (!_soundsEnabled || _isDisposed) return;
    try {
      await SystemSound.play(SystemSoundType.alert);
      await Future<void>.delayed(const Duration(milliseconds: 100));
      await SystemSound.play(SystemSoundType.alert);
    } catch (e) {
      // Ignore errors
      if (kDebugMode) {
        print('Sound play error (ignored): $e');
      }
    }
  }

  /// Safely dispose audio player
  /// Since this is a singleton, we track disposal state to prevent multiple disposals
  void dispose() {
    if (_isDisposed) return;
    
    _isDisposed = true;
    
    if (_audioPlayer != null) {
      try {
        // Try to stop first if playing
        _audioPlayer?.stop().catchError((Object e) {
          if (kDebugMode) {
            print('Audio stop error (ignored): $e');
          }
        });
      } catch (e) {
        if (kDebugMode) {
          print('Audio stop error (ignored): $e');
        }
      }
      
      try {
        _audioPlayer?.dispose();
        _audioPlayer = null;
      } catch (e) {
        // Audio player already disposed or not initialized - ignore error
        if (kDebugMode) {
          print('Audio player dispose error (ignored): $e');
        }
        _audioPlayer = null;
      }
    }
  }
}

