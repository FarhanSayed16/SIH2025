/// Phase 3.5.5: Voice Service
/// Handles voice recognition and command processing

import 'package:speech_to_text/speech_to_text.dart' as stt;
import 'package:permission_handler/permission_handler.dart';
import '../../../core/services/api_service.dart';
import '../../../core/constants/api_endpoints.dart';
import 'dart:async';

class VoiceService {
  static final VoiceService _instance = VoiceService._internal();
  factory VoiceService() => _instance;
  VoiceService._internal();

  final stt.SpeechToText _speech = stt.SpeechToText();
  final ApiService _apiService = ApiService();
  
  bool _isInitialized = false;
  bool _isListening = false;
  String? _lastRecognizedText;
  
  StreamController<String>? _commandController;
  Stream<String>? get commandStream => _commandController?.stream;

  /// Initialize voice service
  Future<bool> initialize() async {
    if (_isInitialized) return true;

    try {
      // Request microphone permission
      final permission = await Permission.microphone.request();
      if (!permission.isGranted) {
        return false;
      }

      // Initialize speech recognition
      final available = await _speech.initialize(
        onStatus: (String status) {
          _isListening = status == 'listening';
        },
        onError: (Object error) {
          print('Speech recognition error: $error');
          _isListening = false;
        },
      );

      if (available) {
        _commandController = StreamController<String>.broadcast();
        _isInitialized = true;
        return true;
      }
      
      return false;
    } catch (e) {
      print('Voice service initialization error: $e');
      return false;
    }
  }

  /// Check if speech recognition is available
  bool get isAvailable => _speech.isAvailable && _isInitialized;

  /// Check if currently listening
  bool get isListening => _isListening;

  /// Get last recognized text
  String? get lastRecognizedText => _lastRecognizedText;

  /// Start listening for voice commands
  Future<void> startListening({
    String? context,
    Duration? listenDuration,
    void Function(String)? onResult,
    void Function(String)? onCommand,
  }) async {
    if (!isAvailable || _isListening) return;

    try {
      await _speech.listen(
        onResult: (result) async {
          _lastRecognizedText = result.recognizedWords;
          
          if (result.finalResult && result.recognizedWords.isNotEmpty) {
            // Process command
            await _processCommand(
              result.recognizedWords,
              context,
              onCommand: onCommand,
            );
            
            // Call onResult callback
            if (onResult != null) {
              onResult(result.recognizedWords);
            }
          }
        },
        listenFor: listenDuration ?? const Duration(seconds: 5),
        pauseFor: const Duration(seconds: 2),
        localeId: 'en_US',
        cancelOnError: false,
      );
    } catch (e) {
      print('Start listening error: $e');
    }
  }

  /// Stop listening
  Future<void> stopListening() async {
    if (!_isListening) return;
    
    try {
      await _speech.stop();
      _isListening = false;
    } catch (e) {
      print('Stop listening error: $e');
    }
  }

  /// Cancel listening
  Future<void> cancel() async {
    try {
      await _speech.cancel();
      _isListening = false;
      _lastRecognizedText = null;
    } catch (e) {
      print('Cancel listening error: $e');
    }
  }

  /// Process recognized text as command
  Future<Map<String, dynamic>> _processCommand(
    String text,
    String? context, {
    void Function(String)? onCommand,
  }) async {
    try {
      // Send to backend for processing
      final response = await _apiService.post(
        ApiEndpoints.voiceCommand,
        data: {
          'text': text,
          if (context != null) 'context': context,
        },
      );

      if (response.data != null && response.data['success'] == true) {
        final action = response.data['data']?['action'] as String?;
        if (action != null) {
          // Emit command via stream
          _commandController?.add(action);
          
          // Call callback
          if (onCommand != null) {
            onCommand(action);
          }
        }
        
        return {
          'success': true,
          'action': action,
          'message': response.data['data']?['message'],
        };
      } else {
        return {
          'success': false,
          'error': response.data?['error'] ?? 'Command not recognized',
          'suggestions': response.data?['suggestions'],
        };
      }
    } catch (e) {
      print('Process command error: $e');
      // Fallback: Try local parsing
      return _parseCommandLocally(text);
    }
  }

  /// Local command parsing (fallback)
  Map<String, dynamic> _parseCommandLocally(String text) {
    final normalized = text.toLowerCase().trim();
    
    // Simple keyword matching
    if (normalized.contains('next') || normalized.contains('skip') || normalized.contains('continue')) {
      return {'success': true, 'action': 'next'};
    }
    if (normalized.contains('back') || normalized.contains('previous') || normalized.contains('return')) {
      return {'success': true, 'action': 'back'};
    }
    if (normalized.contains('home') || normalized.contains('main') || normalized.contains('dashboard')) {
      return {'success': true, 'action': 'home'};
    }
    if (normalized.contains('start game') || normalized.contains('play game')) {
      return {'success': true, 'action': 'startGame'};
    }
    if (normalized.contains('show answer') || normalized.contains('reveal')) {
      return {'success': true, 'action': 'showAnswer'};
    }
    if (normalized.contains('explain') || normalized.contains('tell me') || normalized.contains('what is')) {
      return {'success': true, 'action': 'explain'};
    }
    if (normalized.contains('play') || normalized.contains('start')) {
      return {'success': true, 'action': 'play'};
    }
    if (normalized.contains('stop') || normalized.contains('pause')) {
      return {'success': true, 'action': 'stop'};
    }
    if (normalized.contains('help')) {
      return {'success': true, 'action': 'help'};
    }
    
    return {'success': false, 'error': 'Command not recognized'};
  }

  /// Get available commands
  Future<List<Map<String, dynamic>>> getAvailableCommands({String? context}) async {
    try {
      final response = await _apiService.get(
        ApiEndpoints.voiceCommands,
        queryParameters: context != null ? {'context': context} : null,
      );

      if (response.data != null && response.data['success'] == true) {
        final commands = response.data['data']?['commands'];
        if (commands != null && commands is List) {
          return List<Map<String, dynamic>>.from(
            commands.map<Map<String, dynamic>>((cmd) => cmd is Map<String, dynamic> ? Map<String, dynamic>.from(cmd) : <String, dynamic>{}),
          );
        }
      }
      
      return [];
    } catch (e) {
      print('Get commands error: $e');
      return [];
    }
  }

  /// Dispose resources
  void dispose() {
    _commandController?.close();
    _commandController = null;
    _speech.cancel();
  }
}

