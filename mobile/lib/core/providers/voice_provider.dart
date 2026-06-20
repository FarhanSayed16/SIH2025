/// Phase 3.5.5: Voice Provider
/// Riverpod provider for voice assistant state

import 'package:flutter_riverpod/flutter_riverpod.dart';

class VoiceState {
  final bool isListening;
  final String? recognizedText;
  final String? lastCommand;
  final bool isProcessing;

  VoiceState({
    this.isListening = false,
    this.recognizedText,
    this.lastCommand,
    this.isProcessing = false,
  });

  VoiceState copyWith({
    bool? isListening,
    String? recognizedText,
    String? lastCommand,
    bool? isProcessing,
  }) {
    return VoiceState(
      isListening: isListening ?? this.isListening,
      recognizedText: recognizedText ?? this.recognizedText,
      lastCommand: lastCommand ?? this.lastCommand,
      isProcessing: isProcessing ?? this.isProcessing,
    );
  }
}

class VoiceNotifier extends StateNotifier<VoiceState> {
  VoiceNotifier() : super(VoiceState());

  void startListening() {
    state = state.copyWith(isListening: true);
  }

  void stopListening() {
    state = state.copyWith(isListening: false);
  }

  void setRecognizedText(String text) {
    state = state.copyWith(recognizedText: text);
  }

  void setLastCommand(String command) {
    state = state.copyWith(lastCommand: command, isProcessing: true);
  }

  void setProcessing(bool processing) {
    state = state.copyWith(isProcessing: processing);
  }

  void reset() {
    state = VoiceState();
  }
}

final voiceProvider = StateNotifierProvider<VoiceNotifier, VoiceState>((ref) {
  return VoiceNotifier();
});


