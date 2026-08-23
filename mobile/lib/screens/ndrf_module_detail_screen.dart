import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart'; // For rootBundle
import '../data/ndrf_data.dart';
import 'youtube_player_screen.dart';

class NdrfModuleDetailScreen extends StatefulWidget {
  final String language;

  const NdrfModuleDetailScreen({Key? key, required this.language})
      : super(key: key);

  @override
  State<NdrfModuleDetailScreen> createState() => _NdrfModuleDetailScreenState();
}

class _NdrfModuleDetailScreenState extends State<NdrfModuleDetailScreen> {
  Map<String, String> _summaries = {};
  // ignore: unused_field
  bool _isLoadingSummaries = true;

  @override
  void initState() {
    super.initState();
    _loadSummaries();
  }

  // FIXED: Logic to extract English Key from "Hindi Title (English Key)"
  String _normalizeKey(String title) {
    String keyToNormalize = title;

    // 1. Check if title has text in brackets like "à¤­à¥‚à¤•à¤‚à¤ª (Earthquake)"
    // The regex looks for content inside the last set of parentheses
    RegExp bracketPattern = RegExp(r'\((.*?)\)$');
    Match? match = bracketPattern.firstMatch(title);

    if (match != null) {
      // Use the text inside brackets: "Earthquake"
      keyToNormalize = match.group(1) ?? title;
    }

    // 2. Standard Normalization (Uppercase, remove special chars)
    return keyToNormalize
        .toUpperCase()
        .replaceAll('&', 'AND')
        .replaceAll(RegExp(r'[^A-Z0-9]'), '') // Keep only alphanumeric
        .trim();
  }

  Future<void> _loadSummaries() async {
    try {
      String fileName = '${widget.language}.json';

      // Filename overrides
      if (widget.language == 'Telugu') fileName = 'Telgu.json';
      if (widget.language == 'Marathi') fileName = 'marathi.json';
      if (widget.language == 'Punjabi') fileName = 'Punjabi.json';
      if (widget.language == 'Hindi') fileName = 'Hindi.json';
      if (widget.language == 'Gujarati') fileName = 'Gujarati.json';
      if (widget.language == 'English') fileName = 'English.json';

      debugPrint(
          'Attempting to load summary file: assets/Summary_ndrf/$fileName');

      String response;
      try {
        response = await rootBundle.loadString('assets/Summary_ndrf/$fileName');
      } catch (e) {
        debugPrint(
            'Primary file not found, trying lowercase: ${fileName.toLowerCase()}');
        response = await rootBundle
            .loadString('assets/Summary_ndrf/${fileName.toLowerCase()}');
      }

      final decoded = json.decode(response);
      final Map<String, dynamic> data = (decoded is Map)
          ? decoded as Map<String, dynamic>
          : <String, dynamic>{};

      final Map<String, String> normalizedData = {};
      data.forEach((key, value) {
        // We also normalize the JSON keys so they match the extracted video keys
        String cleanKey = key
            .toString()
            .toUpperCase()
            .replaceAll('&', 'AND')
            .replaceAll(RegExp(r'[^A-Z0-9]'), '')
            .trim();
        normalizedData[cleanKey] = value.toString();
      });

      debugPrint(
          'Loaded ${normalizedData.length} summaries for ${widget.language}');

      if (mounted) {
        setState(() {
          _summaries = normalizedData;
          _isLoadingSummaries = false;
        });
      }
    } catch (e) {
      debugPrint('ERROR loading summaries: $e');
      if (mounted) {
        setState(() {
          _isLoadingSummaries = false;
        });
      }
    }
  }

  void _showSummaryDialog(BuildContext context, String title, String summary) {
    showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Row(
          children: [
            const Icon(Icons.info_outline, color: Colors.blue),
            const SizedBox(width: 10),
            Expanded(child: Text(title, style: const TextStyle(fontSize: 16))),
          ],
        ),
        content: SingleChildScrollView(
          child: Text(
            summary,
            style: const TextStyle(fontSize: 15, height: 1.5),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final videos = NdrfRepository.getNdrfModules()[widget.language] ?? [];

    return Scaffold(
      appBar: AppBar(
        title: Text('${widget.language} Modules'),
        backgroundColor: Colors.blue,
        foregroundColor: Colors.white,
      ),
      body: videos.isEmpty
          ? const Center(child: Text('No videos available.'))
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: videos.length,
              itemBuilder: (context, index) {
                final video = videos[index];

                // Lookup Logic
                String lookupKey = _normalizeKey(video.title);
                String? summary = _summaries[lookupKey];

                return Card(
                  margin: const EdgeInsets.only(bottom: 16),
                  elevation: 2,
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12)),
                  child: Column(
                    children: [
                      InkWell(
                        borderRadius: const BorderRadius.vertical(
                            top: Radius.circular(12)),
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute<dynamic>(
                              builder: (context) => YoutubePlayerScreen(
                                videoUrl: video.url,
                                title: video.title,
                              ),
                            ),
                          );
                        },
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            ClipRRect(
                              borderRadius: const BorderRadius.vertical(
                                  top: Radius.circular(12)),
                              child: Stack(
                                alignment: Alignment.center,
                                children: [
                                  Image.network(
                                    "https://img.youtube.com/vi/${video.url.split('/').last}/hqdefault.jpg",
                                    height: 180,
                                    width: double.infinity,
                                    fit: BoxFit.cover,
                                    errorBuilder: (c, o, s) => Container(
                                      height: 180,
                                      color: Colors.grey.shade300,
                                      child: const Center(
                                          child: Icon(Icons.broken_image,
                                              color: Colors.grey)),
                                    ),
                                  ),
                                  Container(
                                    decoration: BoxDecoration(
                                      color: Colors.black.withOpacity(0.5),
                                      shape: BoxShape.circle,
                                    ),
                                    padding: const EdgeInsets.all(12),
                                    child: const Icon(Icons.play_arrow,
                                        color: Colors.white, size: 40),
                                  ),
                                ],
                              ),
                            ),
                            Padding(
                              padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                              child: Text(
                                video.title,
                                style: const TextStyle(
                                    fontWeight: FontWeight.bold, fontSize: 16),
                              ),
                            ),
                          ],
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.all(12.0),
                        child: Row(
                          children: [
                            const Icon(Icons.video_library,
                                size: 14, color: Colors.grey),
                            const SizedBox(width: 4),
                            const Text('NDRF Official',
                                style: TextStyle(
                                    color: Colors.grey, fontSize: 12)),

                            const Spacer(),

                            // Summary Button
                            OutlinedButton.icon(
                              onPressed: () {
                                String content = summary ??
                                    'Summary not available.\n\nDebug Info:\nLooking for key: $lookupKey\nVideo Title: ${video.title}';
                                _showSummaryDialog(
                                    context, video.title, content);
                              },
                              icon: const Icon(Icons.description, size: 16),
                              label: const Text('Summary'),
                              style: OutlinedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 12, vertical: 0),
                                side: BorderSide(
                                    color: summary != null
                                        ? Colors.blue
                                        : Colors.grey.shade300),
                                foregroundColor:
                                    summary != null ? Colors.blue : Colors.grey,
                                visualDensity: VisualDensity.compact,
                              ),
                            ),

                            const SizedBox(width: 8),

                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: Colors.red.shade50,
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: const Text('YouTube',
                                  style: TextStyle(
                                      color: Colors.red,
                                      fontSize: 10,
                                      fontWeight: FontWeight.bold)),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
    );
  }
}
