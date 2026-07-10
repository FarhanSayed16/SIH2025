import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:device_info_plus/device_info_plus.dart';
import '../services/projector_service.dart';

/// Projector Controller Screen
/// Phase 2.5: K-12 Multi-Access
/// Allows teachers to control projector from mobile device
class ProjectorControllerScreen extends ConsumerStatefulWidget {
  final String sessionId;

  const ProjectorControllerScreen({
    super.key,
    required this.sessionId,
  });

  @override
  ConsumerState<ProjectorControllerScreen> createState() => _ProjectorControllerScreenState();
}

class _ProjectorControllerScreenState extends ConsumerState<ProjectorControllerScreen> {
  final ProjectorService _projectorService = ProjectorService();
  Map<String, dynamic>? _session;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadSession();
    _connectDevice();
  }

  Future<void> _loadSession() async {
    try {
      final session = await _projectorService.getSession(widget.sessionId);
      setState(() {
        _session = session;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  Future<void> _connectDevice() async {
    try {
      final deviceInfo = DeviceInfoPlugin();
      final androidInfo = await deviceInfo.androidInfo;
      final deviceId = androidInfo.id;
      final deviceName = '${androidInfo.brand} ${androidInfo.model}';

      await _projectorService.connectDevice(
        widget.sessionId,
        deviceId,
        deviceName,
      );
    } catch (e) {
      print('Failed to connect device: $e');
    }
  }

  Future<void> _updateContent(Map<String, dynamic> contentData) async {
    try {
      await _projectorService.updateContent(widget.sessionId, contentData);
      await _loadSession();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to update: $e')),
      );
    }
  }

  Future<void> _advanceSlide() async {
    if (_session?['currentContent']?['slideIndex'] != null) {
      final currentIndex = _session!['currentContent']['slideIndex'] as int;
      await _updateContent({
        'slideIndex': currentIndex + 1,
      });
    }
  }

  Future<void> _goBackSlide() async {
    if (_session?['currentContent']?['slideIndex'] != null) {
      final currentIndex = _session!['currentContent']['slideIndex'] as int;
      if (currentIndex > 0) {
        await _updateContent({
          'slideIndex': currentIndex - 1,
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    if (_error != null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Projector Controller')),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error, size: 64, color: Colors.red),
              const SizedBox(height: 16),
              Text('Error: $_error'),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () {
                  setState(() {
                    _error = null;
                    _isLoading = true;
                  });
                  _loadSession();
                },
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      );
    }

    final currentContent = _session?['currentContent'] as Map<String, dynamic>?;
    final contentType = currentContent?['type'] as String? ?? 'module';
    final slideIndex = currentContent?['slideIndex'] as int? ?? 0;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Projector Controller'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadSession,
          ),
        ],
      ),
      body: Column(
        children: [
          // Session Info
          Container(
            padding: const EdgeInsets.all(16),
            color: Theme.of(context).colorScheme.primaryContainer,
            child: Row(
              children: [
                const Icon(Icons.tv, size: 32),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Session: ${widget.sessionId}',
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        'Type: ${currentContent?['type'] ?? 'N/A'}',
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.grey[600],
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Controls
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  // Content Type Selection
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Content Type',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 12),
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: [
                              _buildContentTypeButton('module', 'Module', Icons.book),
                              _buildContentTypeButton('game', 'Game', Icons.games),
                              _buildContentTypeButton('quiz', 'Quiz', Icons.quiz),
                              _buildContentTypeButton('video', 'Video', Icons.video_library),
                              _buildContentTypeButton('image', 'Image', Icons.image),
                              _buildContentTypeButton('presentation', 'Presentation', Icons.slideshow),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 16),

                  // Slide Navigation (for presentations)
                  if (contentType == 'presentation')
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          children: [
                            const Text(
                              'Slide Navigation',
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 16),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                              children: [
                                ElevatedButton.icon(
                                  onPressed: slideIndex > 0 ? _goBackSlide : null,
                                  icon: const Icon(Icons.arrow_back),
                                  label: const Text('Previous'),
                                ),
                                Text(
                                  'Slide ${slideIndex + 1}',
                                  style: const TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                ElevatedButton.icon(
                                  onPressed: _advanceSlide,
                                  icon: const Icon(Icons.arrow_forward),
                                  label: const Text('Next'),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ),

          // Action Buttons
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.surface,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.1),
                  blurRadius: 4,
                  offset: const Offset(0, -2),
                ),
              ],
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                ElevatedButton.icon(
                  onPressed: () {
                    Navigator.pop(context);
                  },
                  icon: const Icon(Icons.close),
                  label: const Text('Close'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.grey,
                  ),
                ),
                ElevatedButton.icon(
                  onPressed: () async {
                    try {
                      await _projectorService.endSession(widget.sessionId);
                      if (mounted) {
                        Navigator.pop(context);
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Session ended')),
                        );
                      }
                    } catch (e) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('Failed to end session: $e')),
                      );
                    }
                  },
                  icon: const Icon(Icons.stop),
                  label: const Text('End Session'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.red,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildContentTypeButton(String type, String label, IconData icon) {
    final isSelected = _session?['currentContent']?['type'] == type;
    return ElevatedButton.icon(
      onPressed: () {
        _updateContent({
          'type': type,
          'contentName': label,
        });
      },
      icon: Icon(icon),
      label: Text(label),
      style: ElevatedButton.styleFrom(
        backgroundColor: isSelected
            ? Theme.of(context).colorScheme.primary
            : null,
      ),
    );
  }
}

