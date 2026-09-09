// ignore_for_file: depend_on_referenced_packages

import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:camera/camera.dart';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:image_picker/image_picker.dart';
import 'core/constants/api_endpoints.dart';
import 'core/services/api_service.dart';

class ScannerScreen extends StatefulWidget {
  final CameraDescription camera;

  const ScannerScreen({super.key, required this.camera});

  @override
  State<ScannerScreen> createState() => _ScannerScreenState();
}

class _ScannerScreenState extends State<ScannerScreen>
    with SingleTickerProviderStateMixin {
  late CameraController _controller;
  late Future<void> _initializeControllerFuture;
  late AnimationController _scanAnimationController;
  late Animation<double> _scanAnimation;

  bool _isScanning = false;
  File? _capturedImage;
  Map<String, dynamic>? _result;
  String? _error;

  @override
  void initState() {
    super.initState();
    // Initialize Camera
    _controller = CameraController(
      widget.camera,
      ResolutionPreset.high,
      enableAudio: false,
    );
    _initializeControllerFuture = _controller.initialize();

    // Initialize Scanning Animation
    _scanAnimationController = AnimationController(
      duration: const Duration(seconds: 2),
      vsync: this,
    );
    _scanAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _scanAnimationController, curve: Curves.linear),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    _scanAnimationController.dispose();
    super.dispose();
  }

  Future<void> _analyzeImage(File imageFile) async {
    setState(() {
      _isScanning = true;
      _error = null;
      _result = null;
    });
    _scanAnimationController.repeat(reverse: false);

    try {
      final Uint8List imageBytes = await imageFile.readAsBytes();
      final api = ApiService();
      final res = await api.post(
        ApiEndpoints.aiAnalyze,
        data: {
          'image': base64Encode(imageBytes),
          'mimeType': 'image/jpeg',
        },
        options: Options(receiveTimeout: const Duration(seconds: 90)),
      );

      final analysis = _extractAnalysis(res.data);
      if (analysis == null) throw 'No response from AI';
      final data = _mapAnalysisToUi(analysis);

      setState(() {
        _result = data;
      });

      final int? score = data['score'] as int?;
      if (score != null && score >= 8) {
        HapticFeedback.heavyImpact();
      } else if (score != null && score >= 4) {
        HapticFeedback.mediumImpact();
      }
    } catch (e) {
      setState(() {
        _error = e.toString();
      });
    } finally {
      _scanAnimationController.stop();
      _scanAnimationController.reset();
      setState(() {
        _isScanning = false;
      });
    }
  }

  Map<String, dynamic>? _extractAnalysis(dynamic body) {
    Map<String, dynamic>? asMap(dynamic v) {
      if (v is Map<String, dynamic>) return v;
      if (v is Map) return Map<String, dynamic>.from(v);
      return null;
    }

    final root = asMap(body);
    if (root == null) return null;
    final data = asMap(root['data']) ?? root;
    return asMap(data['analysis']) ?? data;
  }

  Map<String, dynamic> _mapAnalysisToUi(Map<String, dynamic> analysis) {
    if (analysis['score'] != null && analysis['summary'] != null) {
      final scoreRaw = analysis['score'];
      final score = scoreRaw is int
          ? scoreRaw
          : int.tryParse(scoreRaw.toString());
      if (score == null) {
        return {
          'score': null,
          'summary': 'Unable to assess this photo',
          'action': 'The analysis result was incomplete. Try another photo.',
          'color': 'grey',
          'unknown': true,
        };
      }
      return {
        'score': score,
        'summary': analysis['summary'].toString(),
        'action': (analysis['action'] ?? analysis['description'] ?? 'Stay aware.')
            .toString(),
        'color': (analysis['color'] ?? _colorForScore(score)).toString(),
        'unknown': false,
      };
    }

    if (!analysis.containsKey('hazardDetected')) {
      return {
        'score': null,
        'summary': 'Unable to assess this photo',
        'action': 'The analysis result was incomplete or ambiguous.',
        'color': 'grey',
        'unknown': true,
      };
    }

    final detected = analysis['hazardDetected'] == true;
    final severity = (analysis['severity'] as String?)?.toLowerCase() ?? '';
    int? score;
    if (!detected) {
      score = 2;
    } else if (severity == 'high' || severity == 'critical') {
      score = 9;
    } else if (severity == 'medium') {
      score = 6;
    } else if (severity == 'low') {
      score = 3;
    } else {
      score = null;
    }

    if (score == null) {
      return {
        'score': null,
        'summary': 'Unable to assess this photo',
        'action': 'Hazard severity was not provided. Try another photo.',
        'color': 'grey',
        'unknown': true,
      };
    }

    final recs = analysis['recommendations'];
    String action = 'Stay aware.';
    if (recs is List && recs.isNotEmpty) {
      action = recs.first.toString();
    } else if (analysis['description'] != null) {
      action = analysis['description'].toString();
    }

    final summaryRaw = (analysis['hazardType'] ??
            analysis['description'] ??
            (detected ? 'Hazard observed in photo' : 'No hazard detected in this photo'))
        .toString();
    final summary =
        summaryRaw.length > 40 ? '${summaryRaw.substring(0, 40)}…' : summaryRaw;

    return {
      'score': score,
      'summary': summary,
      'action': action,
      'color': _colorForScore(score),
      'unknown': false,
    };
  }

  String _colorForScore(int score) {
    if (score >= 8) return 'red';
    if (score >= 4) return 'yellow';
    return 'green';
  }

  Future<void> _capturePreview() async {
    try {
      await _initializeControllerFuture;
      final image = await _controller.takePicture();
      setState(() {
        _capturedImage = File(image.path);
        _result = null;
        _error = null;
      });
    } catch (e) {
      debugPrint(e.toString());
    }
  }

  Future<void> _pickFromGallery() async {
    final picker = ImagePicker();
    final image = await picker.pickImage(source: ImageSource.gallery);
    if (image != null) {
      setState(() {
        _capturedImage = File(image.path);
        _result = null;
        _error = null;
      });
    }
  }

  void _reset() {
    setState(() {
      _result = null;
      _capturedImage = null;
      _error = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    // We use a dark theme specifically for this immersive scanner screen
    return Theme(
      data: ThemeData.dark().copyWith(
        scaffoldBackgroundColor: Colors.black,
        primaryColor: Colors.cyanAccent,
      ),
      child: Scaffold(
        backgroundColor: Colors.black,
        body: Column(
          children: [
            Expanded(
              child: Stack(
                fit: StackFit.expand,
                children: [
                  // 1. Camera Layer
                  FutureBuilder<void>(
                    future: _initializeControllerFuture,
                    builder: (context, snapshot) {
                      if (snapshot.connectionState == ConnectionState.done) {
                        // If we have a captured image, show that (freeze frame)
                        if (_capturedImage != null) {
                          return Image.file(_capturedImage!, fit: BoxFit.cover);
                        }
                        return CameraPreview(_controller);
                      } else {
                        return const Center(child: CircularProgressIndicator());
                      }
                    },
                  ),

                  // 2. HUD Overlay (Grid, Corners, etc.)
                  if (_result == null) _buildHUD(),

                  // 3. Scanning Line Animation
                  if (_isScanning)
                    AnimatedBuilder(
                      animation: _scanAnimation,
                      builder: (context, child) {
                        return Positioned(
                          top: MediaQuery.of(context).size.height *
                              _scanAnimation.value,
                          left: 0,
                          right: 0,
                          child: Container(
                            height: 4,
                            decoration: BoxDecoration(
                              color: Colors.red.withValues(alpha: 0.8),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.red.withValues(alpha: 0.5),
                                  blurRadius: 20,
                                  spreadRadius: 2,
                                )
                              ],
                            ),
                          ),
                        );
                      },
                    ),

                  // 4. Header (Back Button + Status)
                  Positioned(
                    top: 50,
                    left: 20,
                    right: 20,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            // Back Button to return to counter app
                            GestureDetector(
                              onTap: () => Navigator.of(context).pop(),
                              child: Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  color: Colors.black54,
                                  shape: BoxShape.circle,
                                  border: Border.all(color: Colors.white24),
                                ),
                                child: const Icon(Icons.arrow_back,
                                    color: Colors.white),
                              ),
                            ),
                            const SizedBox(width: 12),
                            const Icon(Icons.shield_outlined,
                                color: Colors.cyanAccent),
                            const SizedBox(width: 8),
                            const Text(
                              'HAZARDLENS',
                              style: TextStyle(
                                color: Colors.cyanAccent,
                                fontWeight: FontWeight.bold,
                                letterSpacing: 2,
                                fontSize: 18,
                              ),
                            ),
                          ],
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: Colors.black54,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: Colors.white24),
                          ),
                          child: Row(
                            children: [
                              Container(
                                width: 8,
                                height: 8,
                                decoration: BoxDecoration(
                                  color:
                                      _isScanning ? Colors.red : Colors.green,
                                  shape: BoxShape.circle,
                                ),
                              ),
                              const SizedBox(width: 8),
                              Text(
                                _isScanning ? 'ANALYZING...' : 'LIVE FEED',
                                style: const TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.white),
                              ),
                            ],
                          ),
                        )
                      ],
                    ),
                  ),

                  // 5. Bottom Controls (Shutter / Analyze)
                  if (_result == null)
                    Positioned(
                      bottom: 40,
                      left: 0,
                      right: 0,
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          if (_capturedImage != null && !_isScanning) ...[
                            Padding(
                              padding:
                                  const EdgeInsets.symmetric(horizontal: 24),
                              child: FilledButton.icon(
                                onPressed: () =>
                                    _analyzeImage(_capturedImage!),
                                icon: const Icon(Icons.search),
                                label: const Text('Analyze photo'),
                                style: FilledButton.styleFrom(
                                  backgroundColor: Colors.cyanAccent,
                                  foregroundColor: Colors.black,
                                  minimumSize: const Size(double.infinity, 48),
                                ),
                              ),
                            ),
                            const SizedBox(height: 12),
                            TextButton(
                              onPressed: _reset,
                              child: const Text('Retake / clear',
                                  style: TextStyle(color: Colors.white70)),
                            ),
                            const SizedBox(height: 8),
                          ],
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                            children: [
                              IconButton(
                                icon: const Icon(Icons.photo_library,
                                    color: Colors.white70),
                                iconSize: 32,
                                onPressed:
                                    _isScanning ? null : _pickFromGallery,
                              ),
                              GestureDetector(
                                onTap:
                                    _isScanning ? null : _capturePreview,
                                child: Container(
                                  width: 80,
                                  height: 80,
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    border: Border.all(
                                        color: Colors.white, width: 4),
                                    color: Colors.transparent,
                                  ),
                                  child: Center(
                                    child: Container(
                                      width: 65,
                                      height: 65,
                                      decoration: const BoxDecoration(
                                        color: Colors.white,
                                        shape: BoxShape.circle,
                                      ),
                                      child: _isScanning
                                          ? const CircularProgressIndicator(
                                              color: Colors.cyanAccent)
                                          : null,
                                    ),
                                  ),
                                ),
                              ),
                              IconButton(
                                icon: const Icon(Icons.info_outline,
                                    color: Colors.white70),
                                iconSize: 32,
                                onPressed: () {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(
                                      content: Text(
                                        'Capture or pick a photo, then tap Analyze. '
                                        'Results describe this photo only.',
                                      ),
                                    ),
                                  );
                                },
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),

                  // 6. Result Card
                  if (_result != null)
                    Positioned(
                      bottom: 0,
                      left: 0,
                      right: 0,
                      child: _buildResultCard(),
                    ),

                  // 7. Error Message
                  if (_error != null)
                    Center(
                      child: Container(
                        margin: const EdgeInsets.all(20),
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          color: Colors.black87,
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: Colors.red),
                        ),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.error_outline,
                                color: Colors.red, size: 40),
                            const SizedBox(height: 10),
                            Text(_error!,
                                textAlign: TextAlign.center,
                                style: const TextStyle(color: Colors.white)),
                            const SizedBox(height: 10),
                            TextButton(
                                onPressed: _reset, child: const Text('Dismiss'))
                          ],
                        ),
                      ),
                    )
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // --- Helper Widgets ---

  Widget _buildHUD() {
    return IgnorePointer(
      child: Stack(
        children: [
          // Grid Overlay (CustomPainter)
          CustomPaint(
            painter: GridPainter(),
            child: Container(),
          ),
          // Crosshair
          Center(
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                    width: 10,
                    height: 1,
                    color: Colors.cyanAccent.withValues(alpha: 0.5)),
                Container(
                    width: 1,
                    height: 10,
                    color: Colors.cyanAccent.withValues(alpha: 0.5)),
                Container(
                    width: 10,
                    height: 1,
                    color: Colors.cyanAccent.withValues(alpha: 0.5)),
              ],
            ),
          ),
          Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                    width: 1,
                    height: 10,
                    color: Colors.cyanAccent.withValues(alpha: 0.5)),
                const SizedBox(height: 20), // Spacing for horizontal line
                Container(
                    width: 1,
                    height: 10,
                    color: Colors.cyanAccent.withValues(alpha: 0.5)),
              ],
            ),
          ),
          // Corners
          Positioned(
              top: 20,
              left: 20,
              child: _cornerWidget(isTop: true, isLeft: true)),
          Positioned(
              top: 20,
              right: 20,
              child: _cornerWidget(isTop: true, isLeft: false)),
          Positioned(
              bottom: 20,
              left: 20,
              child: _cornerWidget(isTop: false, isLeft: true)),
          Positioned(
              bottom: 20,
              right: 20,
              child: _cornerWidget(isTop: false, isLeft: false)),
        ],
      ),
    );
  }

  Widget _cornerWidget({required bool isTop, required bool isLeft}) {
    return Container(
      width: 40,
      height: 40,
      decoration: BoxDecoration(
        border: Border(
          top: isTop
              ? const BorderSide(color: Colors.cyanAccent, width: 3)
              : BorderSide.none,
          bottom: !isTop
              ? const BorderSide(color: Colors.cyanAccent, width: 3)
              : BorderSide.none,
          left: isLeft
              ? const BorderSide(color: Colors.cyanAccent, width: 3)
              : BorderSide.none,
          right: !isLeft
              ? const BorderSide(color: Colors.cyanAccent, width: 3)
              : BorderSide.none,
        ),
      ),
    );
  }

  Widget _buildResultCard() {
    final unknown = _result!['unknown'] == true;
    final int? score = _result!['score'] as int?;
    Color themeColor = Colors.blueGrey;
    String status = 'UNABLE TO ASSESS';
    if (!unknown && score != null) {
      if (score >= 8) {
        themeColor = Colors.red;
        status = 'HIGH RISK IN PHOTO';
      } else if (score >= 4) {
        themeColor = Colors.orange;
        status = 'MODERATE RISK IN PHOTO';
      } else {
        themeColor = Colors.green;
        status = 'LOW RISK IN PHOTO';
      }
    }

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: themeColor.withValues(alpha: 0.9),
        borderRadius: const BorderRadius.vertical(top: Radius.circular(30)),
        boxShadow: [
          BoxShadow(color: themeColor.withValues(alpha: 0.5), blurRadius: 20)
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('PHOTO OBSERVATION',
                      style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          color: Colors.black54)),
                  Row(
                    children: [
                      Text(score == null ? '—' : '$score',
                          style: const TextStyle(
                              fontSize: 40,
                              fontWeight: FontWeight.w900,
                              color: Colors.white)),
                      if (score != null)
                        const Text('/10',
                            style:
                                TextStyle(fontSize: 20, color: Colors.white70)),
                    ],
                  ),
                ],
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  const Text('STATUS',
                      style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          color: Colors.black54)),
                  Text(status,
                      style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Colors.white)),
                ],
              ),
            ],
          ),
          const SizedBox(height: 20),
          Container(
            padding: const EdgeInsets.all(16),
            width: double.infinity,
            decoration: BoxDecoration(
              color: Colors.black26,
              borderRadius: BorderRadius.circular(15),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(
                      unknown
                          ? Icons.help_outline
                          : Icons.warning_amber_rounded,
                      color: Colors.white,
                      size: 20,
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                        child: Text((_result!['summary'] ?? '').toString(),
                            style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: Colors.white))),
                  ],
                ),
                const SizedBox(height: 8),
                Text((_result!['action'] ?? '').toString(),
                    style: const TextStyle(color: Colors.white70)),
                const SizedBox(height: 8),
                const Text(
                  'Photo observation only — not a building or route safety confirmation.',
                  style: TextStyle(color: Colors.white60, fontSize: 11),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: _reset,
              icon: const Icon(Icons.refresh),
              label: const Text('SCAN AGAIN'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.white24,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// Custom Painter for the background grid
class GridPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.cyanAccent.withValues(alpha: 0.1)
      ..strokeWidth = 1;

    const double step = 40;

    for (double x = 0; x < size.width; x += step) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), paint);
    }
    for (double y = 0; y < size.height; y += step) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
