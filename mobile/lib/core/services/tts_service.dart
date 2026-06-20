/// Phase 3.1.3: Text-to-Speech Service
/// Provides TTS functionality for non-reader content mode

import 'package:flutter_tts/flutter_tts.dart';

class TtsService {
  static final TtsService _instance = TtsService._internal();
  factory TtsService() => _instance;
  TtsService._internal();

  final FlutterTts _flutterTts = FlutterTts();
  bool _isInitialized = false;
  bool _isSpeaking = false;

  /// Initialize TTS service
  Future<void> initialize() async {
    if (_isInitialized) return;

    try {
      await _flutterTts.setLanguage('en-US');
      await _flutterTts.setSpeechRate(0.5); // Slower rate for children
      await _flutterTts.setVolume(1.0);
      await _flutterTts.setPitch(1.0);
      
      // Set completion handler
      _flutterTts.setCompletionHandler(() {
        _isSpeaking = false;
      });

      // Set error handler
      _flutterTts.setErrorHandler((msg) {
        _isSpeaking = false;
      });

      _isInitialized = true;
    } catch (e) {
      print('TTS initialization error: $e');
      _isInitialized = false;
    }
  }

  /// Speak text. Optional [onDone] is called when speech finishes (or is stopped).
  Future<bool> speak(String text, {void Function()? onDone}) async {
    if (!_isInitialized) {
      await initialize();
    }

    if (text.isEmpty) return false;

    try {
      // Stop any current speech
      await stop();

      _flutterTts.setCompletionHandler(() {
        _isSpeaking = false;
        onDone?.call();
      });

      _isSpeaking = true;
      final result = await _flutterTts.speak(text);
      return result == 1;
    } catch (e) {
      print('TTS speak error: $e');
      _isSpeaking = false;
      if (onDone != null) onDone();
      return false;
    }
  }

  /// Stop speaking
  Future<void> stop() async {
    if (!_isInitialized) return;

    try {
      await _flutterTts.stop();
      _isSpeaking = false;
    } catch (e) {
      print('TTS stop error: $e');
    }
  }

  /// Pause speaking
  Future<void> pause() async {
    if (!_isInitialized || !_isSpeaking) return;

    try {
      await _flutterTts.pause();
    } catch (e) {
      print('TTS pause error: $e');
    }
  }

  /// Check if currently speaking
  bool get isSpeaking => _isSpeaking;

  /// Set speech rate (0.0 to 1.0)
  Future<void> setSpeechRate(double rate) async {
    if (!_isInitialized) return;
    await _flutterTts.setSpeechRate(rate.clamp(0.0, 1.0));
  }

  /// Set language
  Future<void> setLanguage(String language) async {
    if (!_isInitialized) return;
    await _flutterTts.setLanguage(language);
  }

  /// Set volume (0.0 to 1.0)
  Future<void> setVolume(double volume) async {
    if (!_isInitialized) return;
    await _flutterTts.setVolume(volume.clamp(0.0, 1.0));
  }

  /// Dispose resources
  Future<void> dispose() async {
    await stop();
    _isInitialized = false;
  }
}

