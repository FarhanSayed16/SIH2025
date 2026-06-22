/// Phase 3.5.5: Voice Button Widget
/// Floating action button for voice commands

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/services/voice_service.dart';
import '../../core/services/voice_command_handler.dart';
import '../../core/providers/voice_provider.dart';

class VoiceButton extends ConsumerStatefulWidget {
  final String? context;
  final Map<String, dynamic>? contextData;
  final bool showAlways;

  const VoiceButton({
    super.key,
    this.context,
    this.contextData,
    this.showAlways = false,
  });

  @override
  ConsumerState<VoiceButton> createState() => _VoiceButtonState();
}

class _VoiceButtonState extends ConsumerState<VoiceButton> with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  final VoiceService _voiceService = VoiceService();
  bool _isInitialized = false;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat(reverse: true);

    _initializeVoice();
  }

  Future<void> _initializeVoice() async {
    final initialized = await _voiceService.initialize();
    if (mounted) {
      setState(() {
        _isInitialized = initialized;
      });
    }
  }

  Future<void> _toggleListening() async {
    final voiceState = ref.read(voiceProvider);

    if (voiceState.isListening) {
      await _voiceService.stopListening();
      ref.read(voiceProvider.notifier).stopListening();
    } else {
      await _voiceService.startListening(
        context: widget.context,
        onCommand: (String action) async {
          // Execute command
          final result = await VoiceCommandHandler.instance.executeCommand(
            action,
            context,
            contextData: widget.contextData,
          );

          if (mounted) {
            final message = result['message'] as String?;
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(message ?? 'Command executed'),
                duration: const Duration(seconds: 2),
              ),
            );
          }
        },
        onResult: (String text) {
          ref.read(voiceProvider.notifier).setRecognizedText(text);
        },
      );
      ref.read(voiceProvider.notifier).startListening();
    }
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final voiceState = ref.watch(voiceProvider);

    if (!_isInitialized && !widget.showAlways) {
      return const SizedBox.shrink();
    }

    return FloatingActionButton(
      onPressed: _isInitialized ? _toggleListening : null,
      backgroundColor: voiceState.isListening ? Colors.red : Theme.of(context).primaryColor,
      child: voiceState.isListening
          ? AnimatedBuilder(
              animation: _animationController,
              builder: (context, child) {
                return Transform.scale(
                  scale: 1.0 + (_animationController.value * 0.2),
                  child: const Icon(Icons.mic, color: Colors.white),
                );
              },
            )
          : const Icon(Icons.mic_none, color: Colors.white),
      tooltip: voiceState.isListening ? 'Stop listening' : 'Start voice command',
    );
  }
}

