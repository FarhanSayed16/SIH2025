/// QR Verification Screen
/// Allows parents to scan and verify student QR codes
/// Parent Monitoring System - Phase 3

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import '../../../core/widgets/widgets.dart';
import '../../../core/design/design_system.dart';
import '../providers/parent_provider.dart';
import '../models/parent_models.dart';
import 'child_detail_screen.dart';

class QRVerificationScreen extends ConsumerStatefulWidget {
  const QRVerificationScreen({super.key});

  @override
  ConsumerState<QRVerificationScreen> createState() =>
      _QRVerificationScreenState();
}

class _QRVerificationScreenState extends ConsumerState<QRVerificationScreen> {
  final MobileScannerController _controller = MobileScannerController();
  bool _isProcessing = false;
  // ignore: unused_field
  QRVerificationResult? _verificationResult;
  String? _lastScannedQRCode; // Prevent duplicate scans

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _handleQRCode(String qrCode) async {
    // Prevent duplicate scans of the same QR code
    if (_isProcessing || _lastScannedQRCode == qrCode) return;

    setState(() {
      _isProcessing = true;
      _verificationResult = null;
      _lastScannedQRCode = qrCode;
    });

    // Stop scanner temporarily to prevent multiple scans
    await _controller.stop();

    try {
      final service = ref.read(parentServiceProvider);
      final result = await service.verifyStudentQR(qrCode);
      
      setState(() {
        _verificationResult = result;
        _isProcessing = false;
      });

      if (result.verified && result.student != null) {
        _showSuccessDialog(result);
      } else {
        // Student not linked - offer to link them
        _showLinkDialog(qrCode, result);
      }
    } catch (e) {
      setState(() {
        _isProcessing = false;
        _lastScannedQRCode = null; // Allow retry on error
      });
      // Restart scanner on error
      await _controller.start();
      _showErrorDialog('Failed to verify QR code: $e');
    }
  }

  void _showSuccessDialog(QRVerificationResult result) {
    showDialog<void>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.check_circle, color: Colors.green),
            SizedBox(width: 8),
            Text('Verified Successfully'),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Student: ${result.student!.name}'),
            if (result.student!.grade != null && result.student!.section != null)
              Text('Grade: ${result.student!.grade} - Section ${result.student!.section}'),
            if (result.relationship != null)
              Text('Relationship: ${result.relationship!['relationship']}'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close'),
          ),
          PrimaryButton(
            label: 'View Details',
            onPressed: () {
              Navigator.pop(context);
              Navigator.push<void>(
                context,
                MaterialPageRoute<void>(
                  builder: (context) =>
                      ChildDetailScreen(studentId: result.student!.id),
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  void _showLinkDialog(String qrCode, QRVerificationResult result) {
    showDialog<void>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.info, color: Colors.orange),
            SizedBox(width: 8),
            Text('Student Not Linked'),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(result.message ?? 'This student is not linked to your account.'),
            const SizedBox(height: 16),
            const Text(
              'Would you like to link this student to your account?',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              setState(() {
                _verificationResult = null;
              });
            },
            child: const Text('Cancel'),
          ),
          PrimaryButton(
            label: 'Link Student',
            icon: Icons.link,
            onPressed: () async {
              Navigator.pop(context);
              await _linkStudentByQR(qrCode);
            },
          ),
        ],
      ),
    );
  }

  Future<void> _linkStudentByQR(String qrCode) async {
    if (_isProcessing) return;

    setState(() {
      _isProcessing = true;
      _verificationResult = null;
    });

    try {
      final service = ref.read(parentServiceProvider);
      final result = await service.linkChildByQR(qrCode);
      
      setState(() {
        _verificationResult = result;
        _isProcessing = false;
      });

      if (result.verified && result.student != null) {
        // Refresh children list
        ref.invalidate(childrenProvider);
        _showSuccessDialog(result);
      } else {
        _showErrorDialog(
          result.message ?? 'Linking request submitted. Awaiting approval.',
        );
        // Restart scanner if linking failed
        await _controller.start();
      }
    } catch (e) {
      setState(() {
        _isProcessing = false;
      });
      // Restart scanner on error
      await _controller.start();
      _showErrorDialog('Failed to link student: $e');
    }
  }

  void _showErrorDialog(String message) {
    showDialog<void>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.error, color: Colors.red),
            SizedBox(width: 8),
            Text('Error'),
          ],
        ),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              setState(() {
                _verificationResult = null;
              });
            },
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Scan Student QR Code'),
        backgroundColor: AppColors.accentBlue,
        foregroundColor: Colors.white,
      ),
      body: Stack(
        children: [
          // QR Scanner
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

          // Scanning Frame Overlay
          Center(
            child: Container(
              width: 250,
              height: 250,
              decoration: BoxDecoration(
                border: Border.all(
                  color: AppColors.accentBlue,
                  width: 3,
                ),
                borderRadius: AppBorders.borderRadiusLg,
              ),
              child: Stack(
                children: [
                  // Corner indicators
                  Positioned(
                    top: 0,
                    left: 0,
                    child: Container(
                      width: 30,
                      height: 30,
                      decoration: BoxDecoration(
                        border: Border(
                          top: BorderSide(color: AppColors.accentBlue, width: 4),
                          left: BorderSide(color: AppColors.accentBlue, width: 4),
                        ),
                        borderRadius: const BorderRadius.only(
                          topLeft: Radius.circular(8),
                        ),
                      ),
                    ),
                  ),
                  Positioned(
                    top: 0,
                    right: 0,
                    child: Container(
                      width: 30,
                      height: 30,
                      decoration: BoxDecoration(
                        border: Border(
                          top: BorderSide(color: AppColors.accentBlue, width: 4),
                          right: BorderSide(color: AppColors.accentBlue, width: 4),
                        ),
                        borderRadius: const BorderRadius.only(
                          topRight: Radius.circular(8),
                        ),
                      ),
                    ),
                  ),
                  Positioned(
                    bottom: 0,
                    left: 0,
                    child: Container(
                      width: 30,
                      height: 30,
                      decoration: BoxDecoration(
                        border: Border(
                          bottom: BorderSide(color: AppColors.accentBlue, width: 4),
                          left: BorderSide(color: AppColors.accentBlue, width: 4),
                        ),
                        borderRadius: const BorderRadius.only(
                          bottomLeft: Radius.circular(8),
                        ),
                      ),
                    ),
                  ),
                  Positioned(
                    bottom: 0,
                    right: 0,
                    child: Container(
                      width: 30,
                      height: 30,
                      decoration: BoxDecoration(
                        border: Border(
                          bottom: BorderSide(color: AppColors.accentBlue, width: 4),
                          right: BorderSide(color: AppColors.accentBlue, width: 4),
                        ),
                        borderRadius: const BorderRadius.only(
                          bottomRight: Radius.circular(8),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Processing Overlay
          if (_isProcessing)
            Container(
              color: Colors.black54,
              child: Center(
                child: Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: AppColors.backgroundWhite,
                    borderRadius: AppBorders.borderRadiusLg,
                  ),
                  child: const Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      CircularProgressIndicator(),
                      SizedBox(height: 16),
                      Text(
                        'Verifying QR Code...',
                        style: TextStyle(fontSize: 16),
                      ),
                    ],
                  ),
                ),
              ),
            ),

          // Instructions
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.transparent,
                    Colors.black87,
                  ],
                ),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppColors.backgroundWhite.withOpacity(0.95),
                      borderRadius: AppBorders.borderRadiusLg,
                    ),
                    child: Column(
                      children: [
                        Icon(
                          Icons.qr_code_scanner,
                          size: 48,
                          color: AppColors.accentBlue,
                        ),
                        const SizedBox(height: 12),
                        Text(
                          'Scan Student QR Code',
                          style: AppTextStyles.h5.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Position the QR code within the frame above',
                          style: AppTextStyles.bodySmall.copyWith(
                            color: AppColors.textSecondary,
                          ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 16),
                        Row(
                          children: [
                            Expanded(
                              child: SecondaryButton(
                                label: 'Cancel',
                                onPressed: () => Navigator.pop(context),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

