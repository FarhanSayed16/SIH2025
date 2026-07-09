/// Phase 3.1.3: Tap-to-Listen Widget
/// Wraps text content with TTS functionality

import 'package:flutter/material.dart';
import '../../../core/services/tts_service.dart';

class TapToListenWidget extends StatefulWidget {
  final Widget child;
  final String text;
  final bool showIcon;
  final IconData icon;
  final Color? iconColor;
  final double? iconSize;
  final EdgeInsets? padding;

  const TapToListenWidget({
    super.key,
    required this.child,
    required this.text,
    this.showIcon = true,
    this.icon = Icons.volume_up,
    this.iconColor,
    this.iconSize = 24.0,
    this.padding,
  });

  @override
  State<TapToListenWidget> createState() => _TapToListenWidgetState();
}

class _TapToListenWidgetState extends State<TapToListenWidget> {
  final TtsService _ttsService = TtsService();
  bool _isSpeaking = false;

  @override
  void initState() {
    super.initState();
    _ttsService.initialize();
    
    // Listen to TTS state changes (would need to extend TtsService with stream)
    // For now, we'll just track button presses
  }

  Future<void> _toggleSpeech() async {
    if (_isSpeaking) {
      await _ttsService.stop();
      setState(() {
        _isSpeaking = false;
      });
    } else {
      if (widget.text.isEmpty) return;
      
      setState(() {
        _isSpeaking = true;
      });

      final success = await _ttsService.speak(widget.text);
      
      if (mounted) {
        setState(() {
          _isSpeaking = success;
        });

        // Reset after speech completes (approximate timing)
        if (success) {
          // Note: In a real implementation, you'd listen to TTS completion events
          // For now, we estimate based on text length
          final estimatedDuration = Duration(
            milliseconds: widget.text.length * 50, // ~50ms per character
          );
          Future.delayed(estimatedDuration, () {
            if (mounted) {
              setState(() {
                _isSpeaking = false;
              });
            }
          });
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final iconColor = widget.iconColor ?? Theme.of(context).primaryColor;

    return InkWell(
      onTap: _toggleSpeech,
      borderRadius: BorderRadius.circular(8),
      child: Padding(
        padding: widget.padding ?? const EdgeInsets.all(8),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(child: widget.child),
            if (widget.showIcon) ...[
              const SizedBox(width: 8),
              _isSpeaking
                  ? SizedBox(
                      width: widget.iconSize,
                      height: widget.iconSize,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: iconColor,
                      ),
                    )
                  : Icon(
                      _isSpeaking ? Icons.volume_down : widget.icon,
                      size: widget.iconSize,
                      color: iconColor,
                    ),
            ],
          ],
        ),
      ),
    );
  }

  @override
  void dispose() {
    _ttsService.stop();
    super.dispose();
  }
}

