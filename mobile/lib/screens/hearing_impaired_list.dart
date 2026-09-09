/// Sign-language safety videos catalogue (B5 §11.1).

import 'package:flutter/material.dart';
import '../core/design/design_system.dart';
import '../data/hearing_impaired_data.dart';
import 'video_player_view.dart';

class HearingImpairedList extends StatefulWidget {
  const HearingImpairedList({Key? key}) : super(key: key);

  @override
  State<HearingImpairedList> createState() => _HearingImpairedListState();
}

class _HearingImpairedListState extends State<HearingImpairedList> {
  String _query = '';
  final _controller = TextEditingController();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final videos = HearingImpairedRepository.getVideos();
    final filtered = _query.trim().isEmpty
        ? videos
        : videos
            .where((v) =>
                v.title.toLowerCase().contains(_query.trim().toLowerCase()))
            .toList();

    return Scaffold(
      backgroundColor: theme.colorScheme.surface,
      appBar: AppBar(
        title: const Text('Sign-language safety videos'),
        backgroundColor: theme.colorScheme.primary,
        foregroundColor: theme.colorScheme.onPrimary,
      ),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
            child: Text(
              'Visual safety videos from NDMA source materials. Format accent only — not a separate app mode. Playback requires internet. Progress is not saved on this route yet.',
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: TextField(
              controller: _controller,
              onChanged: (v) => setState(() => _query = v),
              decoration: InputDecoration(
                hintText: 'Search videos',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: _query.isEmpty
                    ? null
                    : IconButton(
                        icon: const Icon(Icons.clear),
                        onPressed: () {
                          _controller.clear();
                          setState(() => _query = '');
                        },
                      ),
                border: OutlineInputBorder(
                  borderRadius: AppBorders.borderRadiusMd,
                ),
              ),
            ),
          ),
          Expanded(
            child: filtered.isEmpty
                ? Center(
                    child: Text(
                      'No videos match your search',
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                  )
                : ListView.separated(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
                    itemCount: filtered.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                    itemBuilder: (context, index) {
                      final video = filtered[index];
                      final meta = _formatMeta(video.size);
                      return Material(
                        color: theme.colorScheme.surface,
                        borderRadius: AppBorders.borderRadiusMd,
                        child: InkWell(
                          borderRadius: AppBorders.borderRadiusMd,
                          onTap: () {
                            Navigator.push<void>(
                              context,
                              MaterialPageRoute<void>(
                                builder: (context) => VideoPlayerView(
                                  videoUrl: video.url,
                                  title: video.title,
                                  autoPlay: false,
                                  onVideoCompleted: () {},
                                ),
                              ),
                            );
                          },
                          child: Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              borderRadius: AppBorders.borderRadiusMd,
                              border: Border.all(color: AppColors.borderLight),
                            ),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Container(
                                  width: 48,
                                  height: 48,
                                  decoration: BoxDecoration(
                                    color: AppColors.accentSignLanguage
                                        .withValues(alpha: 0.12),
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                  child: const Icon(
                                    Icons.sign_language,
                                    color: AppColors.accentSignLanguage,
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        video.title,
                                        style: theme.textTheme.titleSmall
                                            ?.copyWith(
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        meta,
                                        style:
                                            theme.textTheme.bodySmall?.copyWith(
                                          color: theme
                                              .colorScheme.onSurfaceVariant,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(width: 12),
                                SizedBox(
                                  width: 48,
                                  height: 48,
                                  child: Icon(
                                    Icons.play_circle_fill,
                                    color: AppColors.accentSignLanguage,
                                    size: 40,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }

  String _formatMeta(String sizeField) {
    final lower = sizeField.toLowerCase();
    if (lower.contains('sign')) {
      return 'Format: sign-language video · Requires internet';
    }
    if (lower.contains('mb') || lower.contains('kb')) {
      return 'Approx. file size: $sizeField · Requires internet';
    }
    return '$sizeField · Requires internet';
  }
}
