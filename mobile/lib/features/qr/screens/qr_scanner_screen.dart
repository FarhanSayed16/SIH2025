/// RBAC Refinement: QR Scanner Screen - Enhanced
/// Handles both individual QR codes (login) and classroom QR codes (joining)

import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import '../../../core/services/api_service.dart';
import '../../../core/constants/api_endpoints.dart';
import '../../../core/design/design_system.dart';
import '../../../core/widgets/widgets.dart';
import '../../auth/providers/auth_provider.dart';

/// QR Scanner Screen
/// RBAC Refinement: Enhanced to handle both individual and classroom QR codes
class QRScannerScreen extends ConsumerStatefulWidget {
  final void Function(String qrCode)? onQRScanned;
  final String? title;
  final bool isClassroomMode; // If true, expects classroom QR

  const QRScannerScreen({
    super.key,
    this.onQRScanned,
    this.title,
    this.isClassroomMode = false,
  });

  @override
  ConsumerState<QRScannerScreen> createState() => _QRScannerScreenState();
}

class _QRScannerScreenState extends ConsumerState<QRScannerScreen> {
  final MobileScannerController controller = MobileScannerController();
  bool _isProcessing = false;

  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }

  Future<void> _handleQRCode(String qrCode) async {
    if (_isProcessing) return;

    setState(() => _isProcessing = true);

    try {
      final apiService = ApiService();

      // REQUIREMENT: QR code must be JSON for classroom join
      // Try to parse as JSON first to detect classroom QR
      try {
        final parsedQR = jsonDecode(qrCode) as Map<String, dynamic>;
        if (parsedQR['type'] == 'classroom_join' &&
            parsedQR['classId'] != null) {
          // This is a classroom QR code - return it for joining
          if (widget.isClassroomMode || widget.onQRScanned == null) {
            if (mounted) {
              Navigator.of(context).pop(qrCode);
            }
            return;
          }
          // If callback provided, use it
          if (widget.onQRScanned != null) {
            widget.onQRScanned!(qrCode);
            if (mounted) {
              Navigator.of(context).pop();
            }
            return;
          }
        }
      } catch (e) {
        // Not JSON, might be individual QR or hash
      }

      // Try to verify as individual QR (for login)
      try {
        final response = await apiService.get(ApiEndpoints.verifyQR(qrCode));
        final data = response.data as Map<String, dynamic>;
        final studentInfo = data['data'] as Map<String, dynamic>? ?? {};

        if (mounted) {
          // Individual QR code - show student info and allow login
          _showIndividualQRDialog(qrCode, studentInfo);
        }
        return;
      } catch (e) {
        // Not an individual QR either
      }

      // If classroom mode, treat as classroom QR even if not JSON
      if (widget.isClassroomMode) {
        if (mounted) {
          Navigator.of(context).pop(qrCode);
        }
        return;
      }

      // If callback provided, use it
      if (widget.onQRScanned != null) {
        widget.onQRScanned!(qrCode);
        if (mounted) {
          Navigator.of(context).pop();
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isProcessing = false);
        SnackbarWidget.show(
          context,
          message: 'Failed to process QR code: ${e.toString()}',
          type: SnackbarType.error,
        );
      }
    }
  }

  void _showIndividualQRDialog(
      String qrCode, Map<String, dynamic> studentInfo) {
    showDialog<void>(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppBorders.radiusXl),
        ),
        title: Row(
          children: [
            Icon(Icons.qr_code_scanner, color: AppColors.primaryGreen),
            const SizedBox(width: AppSpacing.md),
            const Text('QR Code Scanned'),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Name: ${studentInfo['name'] ?? 'Unknown'}'),
            const SizedBox(height: AppSpacing.sm),
            Text('Grade: ${studentInfo['grade'] ?? 'N/A'}'),
            const SizedBox(height: AppSpacing.sm),
            Text('Section: ${studentInfo['section'] ?? 'N/A'}'),
            const SizedBox(height: AppSpacing.sm),
            Text('Class: ${studentInfo['className'] ?? 'N/A'}'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              setState(() => _isProcessing = false);
            },
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(context);
              try {
                await ref.read(authProvider.notifier).loginWithQR(qrCode);
                if (mounted) {
                  Navigator.of(context).pop(); // Close scanner
                }
              } catch (e) {
                setState(() => _isProcessing = false);
                if (mounted) {
                  SnackbarWidget.show(
                    context,
                    message: e.toString().replaceAll('Exception: ', ''),
                    type: SnackbarType.error,
                  );
                }
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primaryGreen,
              foregroundColor: Colors.white,
            ),
            child: const Text('Login'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.title ??
            (widget.isClassroomMode ? 'Scan Classroom QR' : 'Scan QR Code')),
        elevation: 0,
        backgroundColor: AppColors.primaryGreen,
        foregroundColor: Colors.white,
      ),
      body: Stack(
        children: [
          // QR Scanner
          MobileScanner(
            controller: controller,
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

          // Animated Overlay
          Container(
            decoration: ShapeDecoration(
              shape: const QrScannerOverlayShape(
                borderColor: AppColors.primaryGreen,
                borderRadius: 16,
                borderLength: 30,
                borderWidth: 8,
                cutOutSize: 250,
              ),
            ),
          ).animate().fadeIn(duration: 500.ms),

          // Instructions Card
          Positioned(
            bottom: 50,
            left: 0,
            right: 0,
            child: Container(
              padding: const EdgeInsets.all(AppSpacing.lg),
              margin: const EdgeInsets.symmetric(horizontal: 32),
              decoration: BoxDecoration(
                color: Colors.black87,
                borderRadius: BorderRadius.circular(AppBorders.radiusLg),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.3),
                    blurRadius: 20,
                    spreadRadius: 2,
                  ),
                ],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    Icons.qr_code_scanner_rounded,
                    color: AppColors.primaryGreen,
                    size: 32,
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  Text(
                    widget.isClassroomMode
                        ? 'Position classroom QR code within the frame'
                        : 'Position QR code within the frame',
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
          )
              .animate()
              .fadeIn(delay: 300.ms, duration: 500.ms)
              .slideY(begin: 0.2, end: 0, delay: 300.ms, duration: 500.ms),

          // Processing indicator
          if (_isProcessing)
            Container(
              color: Colors.black54,
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const CircularProgressIndicator(
                      valueColor:
                          AlwaysStoppedAnimation<Color>(AppColors.primaryGreen),
                    ),
                    const SizedBox(height: AppSpacing.lg),
                    Text(
                      'Processing QR code...',
                      style: AppTextStyles.bodyMedium.copyWith(
                        color: Colors.white,
                      ),
                    ),
                  ],
                ),
              ),
            ).animate().fadeIn(duration: 300.ms),
        ],
      ),
    );
  }
}

/// QR Scanner Overlay Shape
class QrScannerOverlayShape extends ShapeBorder {
  final Color borderColor;
  final double borderWidth;
  final Color overlayColor;
  final double borderRadius;
  final double borderLength;
  final double cutOutSize;

  const QrScannerOverlayShape({
    this.borderColor = Colors.red,
    this.borderWidth = 3.0,
    this.overlayColor = const Color.fromRGBO(0, 0, 0, 80),
    this.borderRadius = 0,
    this.borderLength = 40,
    this.cutOutSize = 250,
  });

  @override
  EdgeInsetsGeometry get dimensions => const EdgeInsets.all(10);

  @override
  Path getInnerPath(Rect rect, {TextDirection? textDirection}) {
    return Path()
      ..fillType = PathFillType.evenOdd
      ..addPath(getOuterPath(rect), Offset.zero);
  }

  @override
  Path getOuterPath(Rect rect, {TextDirection? textDirection}) {
    Path _getLeftTopPath(Rect rect) {
      return Path()
        ..moveTo(rect.left, rect.bottom)
        ..lineTo(rect.left, rect.top + borderRadius)
        ..quadraticBezierTo(
            rect.left, rect.top, rect.left + borderRadius, rect.top)
        ..lineTo(rect.right, rect.top);
    }

    return _getLeftTopPath(rect)
      ..lineTo(rect.right, rect.bottom)
      ..lineTo(rect.left, rect.bottom)
      ..lineTo(rect.left, rect.top);
  }

  @override
  void paint(Canvas canvas, Rect rect, {TextDirection? textDirection}) {
    final width = rect.width;
    final height = rect.height;
    final _cutOutSize = cutOutSize < width || cutOutSize < height
        ? (width < height ? width : height) - 50
        : cutOutSize;

    final _left = (width / 2) - (_cutOutSize / 2);
    final _top = (height / 2) - (_cutOutSize / 2);
    final _right = _left + _cutOutSize;
    final _bottom = _top + _cutOutSize;

    final cutOutRect = Rect.fromLTRB(_left, _top, _right, _bottom);

    final backgroundPath = Path()..addRect(Rect.fromLTWH(0, 0, width, height));

    final cutOutPath = Path()
      ..addRRect(
        RRect.fromRectAndRadius(
          cutOutRect,
          Radius.circular(borderRadius),
        ),
      );

    final backgroundPaint = Paint()
      ..color = overlayColor
      ..style = PaintingStyle.fill;

    final backgroundWithCutOut = Path.combine(
      PathOperation.difference,
      backgroundPath,
      cutOutPath,
    );
    canvas.drawPath(backgroundWithCutOut, backgroundPaint);

    final borderPaint = Paint()
      ..color = borderColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = borderWidth;

    final borderPath = _getBorderPath(cutOutRect);

    canvas.drawPath(borderPath, borderPaint);
  }

  Path _getBorderPath(Rect cutOutRect) {
    final _borderLength = borderLength;
    final _left = cutOutRect.left;
    final _top = cutOutRect.top;
    final _right = cutOutRect.right;
    final _bottom = cutOutRect.bottom;

    final borderPath = Path()
      ..moveTo(_left + _borderLength, _top)
      ..lineTo(_left, _top)
      ..lineTo(_left, _top + _borderLength)
      ..moveTo(_right - _borderLength, _top)
      ..lineTo(_right, _top)
      ..lineTo(_right, _top + _borderLength)
      ..moveTo(_left + _borderLength, _bottom)
      ..lineTo(_left, _bottom)
      ..lineTo(_left, _bottom - _borderLength)
      ..moveTo(_right - _borderLength, _bottom)
      ..lineTo(_right, _bottom)
      ..lineTo(_right, _bottom - _borderLength);

    return borderPath;
  }

  @override
  ShapeBorder scale(double t) {
    return QrScannerOverlayShape(
      borderColor: borderColor,
      borderWidth: borderWidth,
      overlayColor: overlayColor,
    );
  }
}
