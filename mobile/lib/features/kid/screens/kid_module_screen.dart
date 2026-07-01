import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:speech_to_text/speech_to_text.dart' as stt;
import '../../../core/theme/kid_theme.dart';

/// Kid Module Screen
/// Phase 2.5: K-12 Multi-Access
/// Simplified module view with voice narration for young students
class KidModuleScreen extends ConsumerStatefulWidget {
  final String moduleId;
  final String moduleName;
  final String? moduleDescription;

  const KidModuleScreen({
    super.key,
    required this.moduleId,
    required this.moduleName,
    this.moduleDescription,
  });

  @override
  ConsumerState<KidModuleScreen> createState() => _KidModuleScreenState();
}

class _KidModuleScreenState extends ConsumerState<KidModuleScreen> {
  final stt.SpeechToText _speech = stt.SpeechToText();
  bool _isListening = false;
  bool _isSpeaking = false;
  String _spokenText = '';

  @override
  void initState() {
    super.initState();
    _initializeSpeech();
  }

  Future<void> _initializeSpeech() async {
    bool available = await _speech.initialize(
      onStatus: (status) {
        setState(() {
          _isListening = status == 'listening';
        });
      },
      onError: (error) {
        print('Speech error: $error');
      },
    );

    if (available) {
      // Auto-read module name when screen loads
      _speakText(widget.moduleName);
    }
  }

  Future<void> _speakText(String text) async {
    setState(() {
      _isSpeaking = true;
      _spokenText = text;
    });

    // In a real implementation, you would use text-to-speech here
    // For now, we'll just simulate it
    await Future.delayed(const Duration(seconds: 2));

    setState(() {
      _isSpeaking = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F5F5),
      appBar: AppBar(
        title: const Text('Learn'),
        backgroundColor: KidTheme.primaryColor,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, size: 32),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          IconButton(
            icon: Icon(
              _isSpeaking ? Icons.volume_up : Icons.volume_down,
              size: 32,
            ),
            onPressed: () {
              if (_isSpeaking) {
                // Stop speaking
                setState(() {
                  _isSpeaking = false;
                });
              } else {
                // Speak module name
                _speakText(widget.moduleName);
              }
            },
          ),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Module Icon
              Container(
                padding: const EdgeInsets.all(32),
                decoration: BoxDecoration(
                  color: KidTheme.primaryColor.withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.book,
                  size: 80,
                  color: KidTheme.primaryColor,
                ),
              ),

              const SizedBox(height: 32),

              // Module Name (Large Text)
              Text(
                widget.moduleName,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 36,
                  fontWeight: FontWeight.bold,
                  color: Colors.black87,
                ),
              ),

              const SizedBox(height: 24),

              // Module Description (if available)
              if (widget.moduleDescription != null)
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.1),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Column(
                    children: [
                      const Icon(
                        Icons.info_outline,
                        size: 48,
                        color: KidTheme.infoColor,
                      ),
                      const SizedBox(height: 16),
                      Text(
                        widget.moduleDescription!,
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          fontSize: 20,
                          color: Colors.black87,
                        ),
                      ),
                    ],
                  ),
                ),

              const SizedBox(height: 32),

              // Action Buttons
              ElevatedButton.icon(
                onPressed: () {
                  // Start module
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Starting module...')),
                  );
                },
                icon: const Icon(Icons.play_arrow, size: 32),
                label: const Text(
                  'Start Learning',
                  style: TextStyle(fontSize: 22),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: KidTheme.successColor,
                  padding: const EdgeInsets.symmetric(vertical: 24),
                ),
              ),

              const SizedBox(height: 16),

              // Voice Control Button
              if (_speech.isAvailable)
                OutlinedButton.icon(
                  onPressed: () {
                    if (_isListening) {
                      _speech.stop();
                    } else {
                      _speech.listen(
                        onResult: (result) {
                          setState(() {
                            _spokenText = result.recognizedWords;
                          });
                        },
                      );
                    }
                  },
                  icon: Icon(
                    _isListening ? Icons.mic : Icons.mic_none,
                    size: 32,
                  ),
                  label: Text(
                    _isListening ? 'Listening...' : 'Tap to Speak',
                    style: const TextStyle(fontSize: 20),
                  ),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 20),
                    side: const BorderSide(width: 2, color: KidTheme.primaryColor),
                  ),
                ),

              if (_spokenText.isNotEmpty) ...[
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: KidTheme.infoColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    'You said: $_spokenText',
                    style: const TextStyle(fontSize: 18),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  @override
  void dispose() {
    _speech.stop();
    super.dispose();
  }
}

