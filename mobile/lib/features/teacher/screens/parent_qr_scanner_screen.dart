/// Parent QR Scanner Screen
/// Phase 7: Parent-Teacher-Student Linkage
/// Camera-based QR code scanning for parent verification

import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import '../services/teacher_service.dart';
import 'package:geolocator/geolocator.dart';

class ParentQRScannerScreen extends StatefulWidget {
  final String? studentId; // Optional: pre-select student
  final String? classId; // Optional: pre-select class

  const ParentQRScannerScreen({
    super.key,
    this.studentId,
    this.classId,
  });

  @override
  State<ParentQRScannerScreen> createState() => _ParentQRScannerScreenState();
}

class _ParentQRScannerScreenState extends State<ParentQRScannerScreen> {
  final TeacherService _teacherService = TeacherService();
  final MobileScannerController _controller = MobileScannerController();
  bool _isScanning = true;
  bool _isVerifying = false;
  Map<String, dynamic>? _verificationResult;
  String? _error;
  final List<Map<String, dynamic>> _scanHistory = [];

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _handleQRCode(String qrCodeData) async {
    if (_isVerifying || !_isScanning) return;

    setState(() {
      _isScanning = false;
      _isVerifying = true;
      _error = null;
      _verificationResult = null;
    });

    try {
      // Get current location if available
      Map<String, double>? location;
      try {
        final position = await Geolocator.getCurrentPosition(
          desiredAccuracy: LocationAccuracy.medium,
        );
        location = {
          'lat': position.latitude,
          'lng': position.longitude,
        };
      } catch (e) {
        print('⚠️ Could not get location: $e');
      }

      // Verify QR code
      final result = await _teacherService.verifyParentByQR(
        qrCodeData,
        location: location,
      );

      setState(() {
        _verificationResult = result;
        _isVerifying = false;
      });

      // Add to scan history
      _scanHistory.insert(0, {
        'qrCodeData': qrCodeData,
        'result': result,
        'timestamp': DateTime.now(),
      });

      // Show success message
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              result['verified'] == true
                  ? 'Parent verified successfully!'
                  : 'Verification failed',
            ),
            backgroundColor:
                result['verified'] == true ? Colors.green : Colors.red,
            duration: const Duration(seconds: 3),
          ),
        );
      }
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isVerifying = false;
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Verification failed: $e'),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 5),
          ),
        );
      }
    }
  }

  void _resetScanner() {
    setState(() {
      _isScanning = true;
      _verificationResult = null;
      _error = null;
    });
  }

  void _toggleFlash() {
    _controller.toggleTorch();
  }

  void _switchCamera() {
    _controller.switchCamera();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Scan Parent QR Code'),
        actions: [
          IconButton(
            icon: const Icon(Icons.flash_on),
            onPressed: _toggleFlash,
            tooltip: 'Toggle Flash',
          ),
          IconButton(
            icon: const Icon(Icons.flip_camera_ios),
            onPressed: _switchCamera,
            tooltip: 'Switch Camera',
          ),
        ],
      ),
      body: Column(
        children: [
          // Scanner View
          Expanded(
            flex: 3,
            child: Stack(
              children: [
                if (_isScanning)
                  MobileScanner(
                    controller: _controller,
                    onDetect: (capture) {
                      final List<Barcode> barcodes = capture.barcodes;
                      for (final barcode in barcodes) {
                        if (barcode.rawValue != null) {
                          _handleQRCode(barcode.rawValue!);
                          break;
                        }
                      }
                    },
                  ),
                if (!_isScanning)
                  Container(
                    color: Colors.black,
                    child: const Center(
                      child: CircularProgressIndicator(),
                    ),
                  ),
                // Scanning overlay
                if (_isScanning)
                  Container(
                    decoration: BoxDecoration(
                      border: Border.all(
                        color: Colors.white,
                        width: 2,
                      ),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    margin: const EdgeInsets.all(40),
                  ),
              ],
            ),
          ),
          // Verification Result or Error
          if (_isVerifying)
            const Expanded(
              flex: 1,
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    CircularProgressIndicator(),
                    SizedBox(height: 16),
                    Text('Verifying QR code...'),
                  ],
                ),
              ),
            )
          else if (_verificationResult != null)
            Expanded(
              flex: 2,
              child: _buildVerificationResult(),
            )
          else if (_error != null)
            Expanded(
              flex: 1,
              child: _buildErrorView(),
            )
          else
            Expanded(
              flex: 1,
              child: _buildInstructions(),
            ),
        ],
      ),
      floatingActionButton: _verificationResult != null
          ? FloatingActionButton.extended(
              onPressed: _resetScanner,
              icon: const Icon(Icons.refresh),
              label: const Text('Scan Another'),
            )
          : null,
    );
  }

  Widget _buildVerificationResult() {
    final result = _verificationResult!;
    final parent = result['parent'] as Map<String, dynamic>? ?? {};
    final student = result['student'] as Map<String, dynamic>? ?? {};
    final relationship = result['relationship'] as Map<String, dynamic>? ?? {};
    final verified = result['verified'] == true;

    return Container(
      padding: const EdgeInsets.all(16),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Status Card
            Card(
              color: verified ? Colors.green.shade50 : Colors.red.shade50,
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    Icon(
                      verified ? Icons.check_circle : Icons.cancel,
                      color: verified ? Colors.green : Colors.red,
                      size: 32,
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Text(
                        verified
                            ? 'Parent Verified Successfully!'
                            : 'Verification Failed',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: verified ? Colors.green : Colors.red,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            // Parent Information
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Parent Information',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                                    _buildInfoRow('Name', (parent['name'] as String?) ?? 'N/A'),
                                    _buildInfoRow('Email', (parent['email'] as String?) ?? 'N/A'),
                                    if (parent['phone'] != null)
                                      _buildInfoRow('Phone', parent['phone'] as String),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            // Student Information
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Student Information',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                                    _buildInfoRow('Name', (student['name'] as String?) ?? 'N/A'),
                                    if (student['grade'] != null)
                                      _buildInfoRow(
                                        'Grade',
                                        '${student['grade']} - ${(student['section'] as String?) ?? ''}',
                                      ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            // Relationship Information
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Relationship',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                                    _buildInfoRow(
                                      'Type',
                                      (relationship['relationship'] as String?) ?? 'N/A',
                                    ),
                    _buildInfoRow(
                      'Status',
                      relationship['verified'] == true
                          ? 'Verified'
                          : 'Not Verified',
                      valueColor: relationship['verified'] == true
                          ? Colors.green
                          : Colors.orange,
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildErrorView() {
    return Container(
      padding: const EdgeInsets.all(16),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(
            Icons.error_outline,
            size: 64,
            color: Colors.red,
          ),
          const SizedBox(height: 16),
          Text(
            'Verification Failed',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 8),
          Text(
            _error ?? 'Unknown error',
            textAlign: TextAlign.center,
            style: TextStyle(color: Colors.grey[600]),
          ),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: _resetScanner,
            icon: const Icon(Icons.refresh),
            label: const Text('Try Again'),
          ),
        ],
      ),
    );
  }

  Widget _buildInstructions() {
    return Container(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.qr_code_scanner,
            size: 64,
            color: Colors.blue[300],
          ),
          const SizedBox(height: 16),
          Text(
            'Point camera at parent\'s QR code',
            style: Theme.of(context).textTheme.titleLarge,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          Text(
            'The QR code will be automatically scanned and verified',
            textAlign: TextAlign.center,
            style: TextStyle(color: Colors.grey[600]),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoRow(String label, String value, {Color? valueColor}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              fontWeight: FontWeight.w500,
              color: Colors.grey[600],
            ),
          ),
          Text(
            value,
            style: TextStyle(
              fontWeight: FontWeight.bold,
              color: valueColor ?? Colors.black,
            ),
          ),
        ],
      ),
    );
  }
}

