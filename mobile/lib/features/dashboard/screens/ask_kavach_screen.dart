/// B4: Ask Kavach – AI chatbot for disaster safety (Category B)
/// C-V1: Talk to Kavach – voice-in (STT) + voice-out (TTS) for full voice assistant.
/// Shown as the 5th tab in the bottom nav (Home, Learn, Games, Profile, Ask).

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:speech_to_text/speech_to_text.dart' as stt;
import 'package:permission_handler/permission_handler.dart';
import '../../../core/constants/api_endpoints.dart';
import '../../../core/design/design_system.dart';
import '../../../core/services/api_service.dart';
import '../../../core/services/tts_service.dart';

class _ChatMessage {
  final bool isUser;
  final String text;
  final DateTime at;

  _ChatMessage({required this.isUser, required this.text, required this.at});
}

class AskKavachScreen extends StatefulWidget {
  const AskKavachScreen({super.key});

  @override
  State<AskKavachScreen> createState() => _AskKavachScreenState();
}

class _AskKavachScreenState extends State<AskKavachScreen> {
  final ApiService _api = ApiService();
  final TextEditingController _inputController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final TtsService _tts = TtsService();
  final stt.SpeechToText _speech = stt.SpeechToText();
  final List<_ChatMessage> _messages = [];
  bool _loading = false;
  bool _isListening = false;
  bool _speechInitialized = false;
  bool _isSpeaking = false;
  /// C-V2: Index of bot message currently being read aloud (null if none).
  int? _playingMessageIndex;
  /// O6: Preferred response language: auto (detect from question), en, hi, mr
  String _responseLang = 'auto';

  static const String _welcomeText =
      "Hi! I'm Kavach, your safety assistant. Ask me anything about disaster preparedness, drills, earthquakes, fire safety, or what to do in an emergency. I'm here to help you learn and stay safe.";

  @override
  void initState() {
    super.initState();
    if (_messages.isEmpty) {
      _messages.add(_ChatMessage(isUser: false, text: _welcomeText, at: DateTime.now()));
    }
    _tts.initialize();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 200),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _sendMessage() async {
    final text = _inputController.text.trim();
    if (text.isEmpty || _loading) return;
    _inputController.clear();
    await _sendMessageWithText(text);
  }

  /// Send a message (from text field or from voice). C-V1: speaks bot reply with TTS.
  Future<void> _sendMessageWithText(String text) async {
    if (text.isEmpty || _loading) return;

    // Stop any ongoing TTS so the new reply can play
    await _tts.stop();

    final userMsg = _ChatMessage(isUser: true, text: text, at: DateTime.now());
    setState(() {
      _messages.add(userMsg);
      _loading = true;
    });
    _scrollToBottom();

    final Map<String, dynamic> payload = {'question': text};
    if (_responseLang != 'auto') payload['preferredResponseLang'] = _responseLang;
    try {
      final res = await _api.post(
        ApiEndpoints.aiAsk,
        data: payload,
      );
      final data = res.data;
      final answer = data is Map && data['data'] != null
          ? (data['data'] as Map)['answer']?.toString()
          : (data is Map ? data['answer']?.toString() : null);
      final replyText = answer ?? 'I couldn\'t generate an answer. Please try rephrasing.';
      if (mounted) {
        setState(() {
          _messages.add(_ChatMessage(isUser: false, text: replyText, at: DateTime.now()));
          _loading = false;
        });
        _scrollToBottom();
        // C-V1: Read the reply aloud (C-V2: same bubble shows "Stop" while playing)
        if (replyText.isNotEmpty) {
          final replyIndex = _messages.length - 1;
          setState(() {
            _isSpeaking = true;
            _playingMessageIndex = replyIndex;
          });
          await _tts.speak(replyText, onDone: () {
            if (mounted) setState(() {
              _isSpeaking = false;
              _playingMessageIndex = null;
            });
          });
        }
      }
    } catch (e) {
      String errorText = 'Something went wrong. Please check your connection and try again.';
      if (e is DioException && e.response?.data is Map) {
        final msg = (e.response!.data as Map)['message']?.toString();
        if (msg != null && msg.isNotEmpty) errorText = msg;
      }
      if (mounted) {
        setState(() {
          _messages.add(_ChatMessage(isUser: false, text: errorText, at: DateTime.now()));
          _loading = false;
        });
        _scrollToBottom();
      }
    }
  }

  Future<void> _startVoiceInput() async {
    if (_loading || _isListening) return;

    final status = await Permission.microphone.request();
    if (!status.isGranted) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Microphone permission is needed to speak your question')),
        );
      }
      return;
    }

    if (!_speechInitialized) {
      final available = await _speech.initialize(
        onStatus: (s) {
          if (mounted) setState(() => _isListening = s == 'listening');
        },
        onError: (_) {
          if (mounted) setState(() => _isListening = false);
        },
      );
      if (!mounted) return;
      if (!available) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Speech recognition is not available')),
        );
        return;
      }
      _speechInitialized = true;
    }

    setState(() => _isListening = true);
    await _speech.listen(
      onResult: (result) {
        if (!result.finalResult || result.recognizedWords.isEmpty) return;
        final text = result.recognizedWords.trim();
        if (text.isEmpty) return;
        _speech.stop();
        if (mounted) {
          setState(() => _isListening = false);
          _sendMessageWithText(text);
        }
      },
      listenFor: const Duration(seconds: 10),
      pauseFor: const Duration(seconds: 2),
      localeId: 'en_US',
      cancelOnError: false,
    );
  }

  Future<void> _stopVoiceInput() async {
    if (!_isListening) return;
    await _speech.stop();
    if (mounted) setState(() => _isListening = false);
  }

  @override
  void dispose() {
    _speech.stop();
    _tts.stop();
    _inputController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppColors.backgroundDark : AppColors.backgroundWhite,
      appBar: AppBar(
        title: Row(
          children: [
            CircleAvatar(
              radius: 18,
              backgroundColor: AppColors.primaryGreen.withOpacity(0.2),
              child: Icon(Icons.shield_rounded, color: AppColors.primaryGreen, size: 22),
            ),
            const SizedBox(width: 10),
            Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Ask Kavach'),
                if (_isSpeaking)
                  Text(
                    'Speaking...',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: AppColors.primaryGreen,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
              ],
            ),
          ],
        ),
        actions: [
          if (_isSpeaking)
            IconButton(
              icon: const Icon(Icons.stop_rounded),
              onPressed: () async {
                await _tts.stop();
                if (mounted) setState(() {
                  _isSpeaking = false;
                  _playingMessageIndex = null;
                });
              },
              tooltip: 'Stop speaking',
            ),
        ],
        elevation: 0,
        backgroundColor: isDark ? AppColors.backgroundDark : AppColors.backgroundWhite,
        foregroundColor: theme.colorScheme.onSurface,
      ),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: ListView.builder(
                controller: _scrollController,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                itemCount: _messages.length + (_loading ? 1 : 0),
                itemBuilder: (context, index) {
                  if (index == _messages.length) {
                    return _buildTypingIndicator();
                  }
                  final msg = _messages[index];
                  return _buildBubble(msg, index, theme, isDark);
                },
              ),
            ),
            _buildResponseLangChips(theme, isDark),
            _buildInputBar(theme, isDark),
          ],
        ),
      ),
    );
  }

  /// O6: Answer in Auto / English / Hindi / Marathi
  Widget _buildResponseLangChips(ThemeData theme, bool isDark) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      child: Row(
        children: [
          Text(
            'Answer in: ',
            style: theme.textTheme.labelSmall?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
              fontWeight: FontWeight.w500,
            ),
          ),
          Wrap(
            spacing: 6,
            children: [
              _langChip('Auto', 'auto', theme, isDark),
              _langChip('English', 'en', theme, isDark),
              _langChip('हिंदी', 'hi', theme, isDark),
              _langChip('मराठी', 'mr', theme, isDark),
            ],
          ),
        ],
      ),
    );
  }

  Widget _langChip(String label, String value, ThemeData theme, bool isDark) {
    final selected = _responseLang == value;
    return FilterChip(
      label: Text(label, style: TextStyle(fontSize: 12, color: selected ? Colors.white : theme.colorScheme.onSurfaceVariant)),
      selected: selected,
      onSelected: (_) => setState(() => _responseLang = value),
      selectedColor: AppColors.primaryGreen,
      checkmarkColor: Colors.white,
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
    );
  }

  Widget _buildBubble(_ChatMessage msg, int index, ThemeData theme, bool isDark) {
    final isBot = !msg.isUser;
    final isThisPlaying = isBot && _playingMessageIndex == index;

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        mainAxisAlignment: msg.isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          if (isBot) ...[
            CircleAvatar(
              radius: 14,
              backgroundColor: AppColors.primaryGreen.withOpacity(0.2),
              child: Icon(Icons.shield_rounded, size: 16, color: AppColors.primaryGreen),
            ),
            const SizedBox(width: 8),
          ],
          Flexible(
            child: Column(
              crossAxisAlignment: msg.isUser ? CrossAxisAlignment.end : CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(
                    color: msg.isUser
                        ? (isDark ? AppColors.primaryGreen.withOpacity(0.35) : AppColors.primaryGreen)
                        : (isDark ? theme.colorScheme.surface : AppColors.textSecondary.withOpacity(0.12)),
                    borderRadius: BorderRadius.only(
                      topLeft: const Radius.circular(18),
                      topRight: const Radius.circular(18),
                      bottomLeft: Radius.circular(msg.isUser ? 18 : 4),
                      bottomRight: Radius.circular(msg.isUser ? 4 : 18),
                    ),
                  ),
                  child: SelectableText(
                    msg.text,
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: msg.isUser ? Colors.white : theme.colorScheme.onSurface,
                      height: 1.4,
                    ),
                  ),
                ),
                // C-V2: Listen button on each bot message
                if (isBot) ...[
                  const SizedBox(height: 6),
                  InkWell(
                    onTap: () => _playMessageAt(index),
                    borderRadius: BorderRadius.circular(16),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            isThisPlaying ? Icons.stop_rounded : Icons.volume_up_rounded,
                            size: 18,
                            color: isThisPlaying ? AppColors.primaryRed : AppColors.primaryGreen,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            isThisPlaying ? 'Stop' : 'Listen',
                            style: theme.textTheme.labelSmall?.copyWith(
                              color: isThisPlaying ? AppColors.primaryRed : AppColors.primaryGreen,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
          if (msg.isUser) const SizedBox(width: 8),
        ],
      ),
    );
  }

  /// C-V2: Play or stop TTS for the bot message at [index].
  Future<void> _playMessageAt(int index) async {
    if (index < 0 || index >= _messages.length) return;
    final msg = _messages[index];
    if (msg.isUser) return;

    if (_playingMessageIndex == index) {
      await _tts.stop();
      if (mounted) setState(() => _playingMessageIndex = null);
      return;
    }

    await _tts.stop();
    if (mounted) setState(() {
      _isSpeaking = true;
      _playingMessageIndex = index;
    });
    await _tts.speak(msg.text, onDone: () {
      if (mounted) setState(() {
        _isSpeaking = false;
        _playingMessageIndex = null;
      });
    });
  }

  Widget _buildTypingIndicator() {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          CircleAvatar(
            radius: 14,
            backgroundColor: AppColors.primaryGreen.withOpacity(0.2),
            child: Icon(Icons.shield_rounded, size: 16, color: AppColors.primaryGreen),
          ),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: Theme.of(context).brightness == Brightness.dark
                  ? Theme.of(context).colorScheme.surface
                  : AppColors.textSecondary.withOpacity(0.12),
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(18),
                topRight: Radius.circular(18),
                bottomLeft: Radius.circular(4),
                bottomRight: Radius.circular(18),
              ),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _dot(0),
                _dot(1),
                _dot(2),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _dot(int index) {
    return Container(
      width: 8,
      height: 8,
      margin: const EdgeInsets.symmetric(horizontal: 2),
      decoration: BoxDecoration(
        color: AppColors.primaryGreen.withOpacity(0.6),
        shape: BoxShape.circle,
      ),
    );
  }

  Widget _buildInputBar(ThemeData theme, bool isDark) {
    return Container(
      padding: EdgeInsets.only(
        left: 16,
        right: 16,
        top: 10,
        bottom: 10 + MediaQuery.of(context).padding.bottom,
      ),
      decoration: BoxDecoration(
        color: isDark ? AppColors.backgroundDark : AppColors.backgroundWhite,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.06),
            blurRadius: 8,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Expanded(
            child: TextField(
              controller: _inputController,
              maxLines: 4,
              minLines: 1,
              textInputAction: TextInputAction.send,
              decoration: InputDecoration(
                hintText: _isListening ? 'Listening...' : 'Ask about safety, drills, emergencies...',
                hintStyle: TextStyle(color: theme.colorScheme.onSurfaceVariant.withOpacity(0.6)),
                filled: true,
                fillColor: isDark ? theme.colorScheme.surface : AppColors.textSecondary.withOpacity(0.08),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(24),
                  borderSide: BorderSide.none,
                ),
                contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
              ),
              onSubmitted: (_) => _sendMessage(),
            ),
          ),
          const SizedBox(width: 8),
          // C-V1: Mic button – speak your question
          Material(
            color: _isListening
                ? AppColors.primaryRed.withOpacity(0.9)
                : (isDark ? theme.colorScheme.surface : AppColors.textSecondary.withOpacity(0.15)),
            borderRadius: BorderRadius.circular(24),
            child: InkWell(
              onTap: _loading
                  ? null
                  : (_isListening ? _stopVoiceInput : _startVoiceInput),
              borderRadius: BorderRadius.circular(24),
              child: Container(
                padding: const EdgeInsets.all(12),
                child: _isListening
                    ? const Icon(Icons.mic_rounded, color: Colors.white, size: 24)
                    : Icon(
                        Icons.mic_none_rounded,
                        color: isDark ? theme.colorScheme.onSurface : AppColors.textSecondary,
                        size: 24,
                      ),
              ),
            ),
          ),
          const SizedBox(width: 8),
          Material(
            color: _loading ? AppColors.primaryGreen.withOpacity(0.5) : AppColors.primaryGreen,
            borderRadius: BorderRadius.circular(24),
            child: InkWell(
              onTap: _loading ? null : _sendMessage,
              borderRadius: BorderRadius.circular(24),
              child: Container(
                padding: const EdgeInsets.all(12),
                child: _loading
                    ? const SizedBox(
                        width: 22,
                        height: 22,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                        ),
                      )
                    : const Icon(Icons.send_rounded, color: Colors.white, size: 24),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
