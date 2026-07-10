/// Phase 3.1.3: Audio Quiz Widget
/// Displays audio-based quiz questions with image answer options

import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../modules/widgets/audio_player_widget.dart';
import '../../modules/models/module_model.dart';

class AudioQuizWidget extends StatelessWidget {
  final QuizQuestion question;
  final int? selectedAnswer;
  final ValueChanged<int> onAnswerSelected;

  const AudioQuizWidget({
    super.key,
    required this.question,
    this.selectedAnswer,
    required this.onAnswerSelected,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Audio player for question
        if (question.questionAudio != null && question.questionAudio!.isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(bottom: 24),
            child: AudioPlayerWidget(
              audioUrl: question.questionAudio!,
              autoplay: false,
            ),
          ),

        // Instructions
        Container(
          padding: const EdgeInsets.all(16),
          margin: const EdgeInsets.only(bottom: 24),
          decoration: BoxDecoration(
            color: Colors.blue[50],
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.blue[200]!),
          ),
          child: Row(
            children: [
              Icon(Icons.info_outline, color: Colors.blue[700]),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  'Listen to the audio and select the correct answer',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Colors.blue[900],
                      ),
                ),
              ),
            ],
          ),
        ),

        // Answer options (preferably with images)
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            crossAxisSpacing: 16,
            mainAxisSpacing: 16,
            childAspectRatio: 1.0,
          ),
          itemCount: question.options.length,
          itemBuilder: (context, index) {
            final option = question.options[index];
            final isSelected = selectedAnswer == index;

            return GestureDetector(
              onTap: () => onAnswerSelected(index),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                decoration: BoxDecoration(
                  border: Border.all(
                    color: isSelected ? Colors.blue : Colors.grey[300]!,
                    width: isSelected ? 3 : 2,
                  ),
                  borderRadius: BorderRadius.circular(12),
                  color: isSelected ? Colors.blue[50] : Colors.white,
                ),
                child: Stack(
                  children: [
                    // Option image (if available)
                    ClipRRect(
                      borderRadius: BorderRadius.circular(10),
                      child: option.imageUrl != null && option.imageUrl!.isNotEmpty
                          ? CachedNetworkImage(
                              imageUrl: option.imageUrl!,
                              fit: BoxFit.cover,
                              placeholder: (context, url) => Container(
                                color: Colors.grey[200],
                                child: const Center(
                                  child: CircularProgressIndicator(),
                                ),
                              ),
                              errorWidget: (context, url, error) => Container(
                                color: Colors.grey[200],
                                child: const Icon(Icons.error_outline),
                              ),
                            )
                          : Container(
                              color: Colors.grey[200],
                              padding: const EdgeInsets.all(8),
                              child: Center(
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    if (option.audioUrl != null && option.audioUrl!.isNotEmpty)
                                      AudioPlayerWidget(
                                        audioUrl: option.audioUrl!,
                                        iconSize: 32,
                                      )
                                    else
                                      Text(
                                        option.text,
                                        textAlign: TextAlign.center,
                                        style: const TextStyle(fontSize: 14),
                                      ),
                                  ],
                                ),
                              ),
                            ),
                    ),

                    // Selection indicator
                    if (isSelected)
                      Positioned(
                        top: 8,
                        right: 8,
                        child: Container(
                          padding: const EdgeInsets.all(4),
                          decoration: const BoxDecoration(
                            color: Colors.blue,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.check,
                            color: Colors.white,
                            size: 20,
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            );
          },
        ),
      ],
    );
  }
}

