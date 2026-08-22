/// Phase 3.1.1: Content Viewer Widget
/// Displays different types of content (text, images, videos, audio, animations)

import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:lottie/lottie.dart';
import '../models/module_model.dart';
import 'tap_to_listen_widget.dart';
import 'audio_player_widget.dart';

class ContentViewer extends StatelessWidget {
  final ModuleSection section;

  const ContentViewer({
    super.key,
    required this.section,
  });

  @override
  Widget build(BuildContext context) {
    switch (section.type) {
      case 'text':
        return _TextSection(content: section.content);
      case 'image':
        return _ImageSection(
          content: section.content,
          metadata: section.metadata,
        );
      case 'video':
        return _VideoSection(
          content: section.content,
          metadata: section.metadata,
        );
      case 'audio':
        return _AudioSection(
          content: section.content,
          metadata: section.metadata,
        );
      case 'animation':
        return _AnimationSection(metadata: section.metadata);
      case 'ar':
        return _ARSection(
          content: section.content,
          metadata: section.metadata,
        );
      default:
        return _TextSection(content: section.content);
    }
  }
}

/// Text Section Widget
class _TextSection extends StatelessWidget {
  final dynamic content;

  const _TextSection({required this.content});

  @override
  Widget build(BuildContext context) {
    final text = (content is String ? content : content.toString()) as String;

    // Phase 3.1.3: Wrap text with tap-to-listen for non-readers
    return TapToListenWidget(
      text: text,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(16),
        margin: const EdgeInsets.only(bottom: 16),
        decoration: BoxDecoration(
          color: Colors.grey[50],
          borderRadius: BorderRadius.circular(12),
        ),
        child: Text(
          text,
          style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                height: 1.6,
              ),
        ),
      ),
    );
  }
}

/// Image Section Widget
class _ImageSection extends StatelessWidget {
  final dynamic content;
  final ModuleSectionMetadata? metadata;

  const _ImageSection({
    required this.content,
    this.metadata,
  });

  @override
  Widget build(BuildContext context) {
    final imageUrl = metadata?.url ?? (content is String ? content : null);

    if (imageUrl == null || (imageUrl as String).isEmpty) {
      return const SizedBox.shrink();
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: CachedNetworkImage(
              imageUrl: imageUrl,
              placeholder: (context, url) => Container(
                height: 200,
                color: Colors.grey[200],
                child: const Center(
                  child: CircularProgressIndicator(),
                ),
              ),
              errorWidget: (context, url, error) => Container(
                height: 200,
                color: Colors.grey[300],
                child: const Icon(Icons.error_outline),
              ),
              fit: BoxFit.cover,
            ),
          ),
          if (metadata?.caption != null && metadata!.caption!.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(
              metadata!.caption!,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    fontStyle: FontStyle.italic,
                    color: Colors.grey[600],
                  ),
              textAlign: TextAlign.center,
            ),
          ],
        ],
      ),
    );
  }
}

/// Video Section Widget
class _VideoSection extends StatelessWidget {
  final dynamic content;
  final ModuleSectionMetadata? metadata;

  const _VideoSection({
    required this.content,
    this.metadata,
  });

  @override
  Widget build(BuildContext context) {
    final videoUrl = metadata?.url ?? (content is String ? content : null);

    if (videoUrl == null || (videoUrl as String).isEmpty) {
      return const SizedBox.shrink();
    }

    // For now, show a placeholder with play button
    // Full video player implementation can be added later with video_player package
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      height: 200,
      decoration: BoxDecoration(
        color: Colors.black87,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Placeholder for video thumbnail
          Container(
            decoration: BoxDecoration(
              color: Colors.grey[800],
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(
              Icons.videocam,
              size: 64,
              color: Colors.white70,
            ),
          ),
          // Play button
          Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: () {
                // TODO: Open video player
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Video player will be implemented'),
                  ),
                );
              },
              borderRadius: BorderRadius.circular(50),
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.9),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.play_arrow,
                  size: 48,
                  color: Colors.black87,
                ),
              ),
            ),
          ),
          // Duration badge
          if (metadata?.duration != null)
            Positioned(
              bottom: 8,
              right: 8,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.black.withOpacity(0.7),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  _formatDuration(metadata!.duration!),
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  // ignore: unused_element
  String _formatDuration(int seconds) {
    final minutes = seconds ~/ 60;
    final secs = seconds % 60;
    return '${minutes.toString().padLeft(2, '0')}:${secs.toString().padLeft(2, '0')}';
  }
}

/// Audio Section Widget
/// Phase 3.1.3: Enhanced with AudioPlayerWidget for non-readers
class _AudioSection extends StatelessWidget {
  final dynamic content;
  final ModuleSectionMetadata? metadata;

  const _AudioSection({
    required this.content,
    this.metadata,
  });

  @override
  Widget build(BuildContext context) {
    final audioUrl = metadata?.url ?? (content is String ? content : null);

    if (audioUrl == null || (audioUrl as String).isEmpty) {
      return const SizedBox.shrink();
    }

    // Phase 3.1.3: Use AudioPlayerWidget for pre-recorded audio
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      child: AudioPlayerWidget(
        audioUrl: audioUrl,
        autoplay: false,
      ),
    );
  }

  // ignore: unused_element
  String _formatDuration(int seconds) {
    final minutes = seconds ~/ 60;
    final secs = seconds % 60;
    return '${minutes.toString().padLeft(2, '0')}:${secs.toString().padLeft(2, '0')}';
  }
}

/// Animation Section Widget (Lottie)
class _AnimationSection extends StatelessWidget {
  final ModuleSectionMetadata? metadata;

  const _AnimationSection({this.metadata});

  @override
  Widget build(BuildContext context) {
    final animationUrl = metadata?.lottieUrl;

    if (animationUrl == null || animationUrl.isEmpty) {
      return const SizedBox.shrink();
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      height: 200,
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(12),
      ),
      child: Lottie.network(
        animationUrl,
        fit: BoxFit.contain,
        errorBuilder: (context, error, stackTrace) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.error_outline, color: Colors.grey),
                const SizedBox(height: 8),
                Text(
                  'Failed to load animation',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

/// AR Section Widget (Placeholder)
class _ARSection extends StatelessWidget {
  final dynamic content;
  final ModuleSectionMetadata? metadata;

  const _ARSection({
    required this.content,
    this.metadata,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.purple[50],
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.purple[200]!),
      ),
      child: Column(
        children: [
          const Icon(
            Icons.view_in_ar,
            size: 48,
            color: Colors.purple,
          ),
          const SizedBox(height: 8),
          Text(
            'AR Experience',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
          ),
          const SizedBox(height: 4),
          Text(
            (content is String ? content : 'AR scenario will be available soon') as String,
            style: Theme.of(context).textTheme.bodySmall,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 12),
          ElevatedButton.icon(
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('AR feature will be implemented in Phase 5'),
                ),
              );
            },
            icon: const Icon(Icons.launch),
            label: const Text('Launch AR'),
          ),
        ],
      ),
    );
  }
}

