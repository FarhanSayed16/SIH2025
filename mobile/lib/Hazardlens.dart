// ignore_for_file: depend_on_referenced_packages

import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';

import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_generative_ai/google_generative_ai.dart';
import 'package:image_picker/image_picker.dart';
import 'core/config/env.dart';
import 'core/widgets/disaster_alert_widget.dart';

// --- Global Configuration for HazardLens ---
// API Key is loaded from .env file via Env.geminiApiKey
const String modelName = 'gemini-2.5-flash';

const String systemPrompt = '''
You are HazardLens, an expert AI safety inspector. 
Analyze the image for man-made physical hazards (electrical, structural, fire, chemical, trip hazards). 
You MUST respond in valid, raw JSON format only (no markdown code blocks).
Structure: { "score": int (1-10), "summary": "string (max 5 words)", "action": "string (concise advice)", "color": "string (green|yellow|red)" }

Scoring Logic:
1-3: Low Risk (Cosmetic, minor clutter, or Safe)
4-7: Moderate Risk (Potential injury, exposed wires but not live, leaks)
8-10: Critical Danger (Immediate threat to life, fire, collapse, live sparks)

If the image is unclear or safe, return score 1.
''';

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
      // 1. Convert image to bytes
      final Uint8List imageBytes = await imageFile.readAsBytes();

      // 2. Initialize Gemini Model
      final apiKey = Env.geminiApiKey;
      if (apiKey.isEmpty) {
        throw 'API Key is missing. Set GEMINI_API_KEY in .env file.';
      }
      final model = GenerativeModel(model: modelName, apiKey: apiKey);

      // 3. Prepare Prompt & Content
      final content = [
        Content.multi([
          TextPart(systemPrompt),
          DataPart('image/jpeg', imageBytes),
        ])
      ];

      // 4. Send to API
      final response = await model.generateContent(content);

      if (response.text == null) throw 'No response from AI';

      // 5. Parse JSON
      // Clean up markdown fences if Gemini adds them
      String cleanJson =
          response.text!.replaceAll('```json', '').replaceAll('```', '').trim();

      final Map<String, dynamic> data =
          jsonDecode(cleanJson) as Map<String, dynamic>;

      setState(() {
        _result = data;
      });

      // Haptic feedback based on severity
      final int score = (data['score'] as int?) ?? 0;
      if (score >= 8) {
        HapticFeedback.heavyImpact();
      } else if (score >= 4) {
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

  Future<void> _captureAndAnalyze() async {
    try {
      await _initializeControllerFuture;
      final image = await _controller.takePicture();
      setState(() {
        _capturedImage = File(image.path);
      });
      _analyzeImage(File(image.path));
    } catch (e) {
      print(e);
    }
  }

  Future<void> _pickFromGallery() async {
    final picker = ImagePicker();
    final image = await picker.pickImage(source: ImageSource.gallery);
    if (image != null) {
      setState(() {
        _capturedImage = File(image.path);
      });
      _analyzeImage(File(image.path));
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
                              color: Colors.red.withOpacity(0.8),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.red.withOpacity(0.5),
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

                  // 5. Bottom Controls (Shutter)
                  if (_result == null)
                    Positioned(
                      bottom: 40,
                      left: 0,
                      right: 0,
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                        children: [
                          IconButton(
                            icon: const Icon(Icons.photo_library,
                                color: Colors.white70),
                            iconSize: 32,
                            onPressed: _isScanning ? null : _pickFromGallery,
                          ),
                          GestureDetector(
                            onTap: _isScanning ? null : _captureAndAnalyze,
                            child: Container(
                              width: 80,
                              height: 80,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                border:
                                    Border.all(color: Colors.white, width: 4),
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
                            onPressed: () {}, // Info placeholder
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
            const DisasterAlertWidget(),
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
                    color: Colors.cyanAccent.withOpacity(0.5)),
                Container(
                    width: 1,
                    height: 10,
                    color: Colors.cyanAccent.withOpacity(0.5)),
                Container(
                    width: 10,
                    height: 1,
                    color: Colors.cyanAccent.withOpacity(0.5)),
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
                    color: Colors.cyanAccent.withOpacity(0.5)),
                const SizedBox(height: 20), // Spacing for horizontal line
                Container(
                    width: 1,
                    height: 10,
                    color: Colors.cyanAccent.withOpacity(0.5)),
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
    final int score = (_result!['score'] as int?) ?? 0;
    Color themeColor = Colors.green;
    String status = 'SAFE / LOW RISK';
    if (score >= 8) {
      themeColor = Colors.red;
      status = 'CRITICAL DANGER';
    } else if (score >= 4) {
      themeColor = Colors.orange;
      status = 'MODERATE RISK';
    }

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: themeColor.withOpacity(0.9),
        borderRadius: const BorderRadius.vertical(top: Radius.circular(30)),
        boxShadow: [
          BoxShadow(color: themeColor.withOpacity(0.5), blurRadius: 20)
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
                  const Text('HAZARD LEVEL',
                      style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          color: Colors.black54)),
                  Row(
                    children: [
                      Text('$score',
                          style: const TextStyle(
                              fontSize: 40,
                              fontWeight: FontWeight.w900,
                              color: Colors.white)),
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
                          fontSize: 18,
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
                    const Icon(Icons.warning_amber_rounded,
                        color: Colors.white, size: 20),
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
      ..color = Colors.cyanAccent.withOpacity(0.1)
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
