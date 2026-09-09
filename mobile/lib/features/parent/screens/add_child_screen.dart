/// Add Child Screen
/// Allows parents to link children by QR code or Student ID
/// Parent Monitoring System - Phase 3 Enhancement

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import '../../../core/widgets/widgets.dart';
import '../../../core/design/design_system.dart';
import '../providers/parent_provider.dart';
import '../models/parent_models.dart';
import 'parent_shell_screen.dart';
import 'child_detail_screen.dart';

class AddChildScreen extends ConsumerStatefulWidget {
  const AddChildScreen({super.key});

  @override
  ConsumerState<AddChildScreen> createState() => _AddChildScreenState();
}

class _AddChildScreenState extends ConsumerState<AddChildScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final TextEditingController _qrCodeController = TextEditingController();
  final TextEditingController _studentIdController = TextEditingController();
  bool _isLinking = false;
  QRVerificationResult? _linkingResult;
  MobileScannerController? _scannerController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _qrCodeController.dispose();
    _studentIdController.dispose();
    _scannerController?.dispose();
    super.dispose();
  }

  Future<void> _linkByQR(String qrCode) async {
    if (_isLinking || qrCode.isEmpty) return;

    setState(() {
      _isLinking = true;
      _linkingResult = null;
    });

    try {
      final service = ref.read(parentServiceProvider);
      final result = await service.linkChildByQR(qrCode);

      setState(() {
        _linkingResult = result;
        _isLinking = false;
      });

      if (result.verified && result.student != null) {
        SnackbarWidget.show(
          context,
          message: 'Child linked successfully!',
          type: SnackbarType.success,
        );
        // Refresh children list
        ref.invalidate(childrenProvider);
        // Navigate to dashboard after a delay
        Future.delayed(const Duration(seconds: 1), () {
          if (mounted) {
            Navigator.pushReplacement<void, void>(
              context,
              MaterialPageRoute<void>(
                builder: (context) => const ParentShellScreen(),
              ),
            );
          }
        });
      } else {
        SnackbarWidget.show(
          context,
          message: result.message ?? 'Linking request submitted. Awaiting approval.',
          type: SnackbarType.info,
        );
      }
    } catch (e) {
      setState(() {
        _isLinking = false;
      });
      SnackbarWidget.show(
        context,
        message: 'Failed to link child: $e',
        type: SnackbarType.error,
      );
    }
  }

  Future<void> _linkById(String studentId) async {
    if (_isLinking || studentId.isEmpty) return;

    setState(() {
      _isLinking = true;
      _linkingResult = null;
    });

    try {
      final service = ref.read(parentServiceProvider);
      final result = await service.linkChildById(studentId);

      setState(() {
        _linkingResult = result;
        _isLinking = false;
      });

      if (result.verified && result.student != null) {
        SnackbarWidget.show(
          context,
          message: 'Child linked successfully!',
          type: SnackbarType.success,
        );
        // Refresh children list
        ref.invalidate(childrenProvider);
        // Navigate to dashboard after a delay
        Future.delayed(const Duration(seconds: 1), () {
          if (mounted) {
            Navigator.pushReplacement<void, void>(
              context,
              MaterialPageRoute<void>(
                builder: (context) => const ParentShellScreen(),
              ),
            );
          }
        });
      } else {
        SnackbarWidget.show(
          context,
          message: result.message ?? 'Linking request submitted. Awaiting approval.',
          type: SnackbarType.info,
        );
      }
    } catch (e) {
      setState(() {
        _isLinking = false;
      });
      SnackbarWidget.show(
        context,
        message: 'Failed to link child: $e',
        type: SnackbarType.error,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Add Child'),
        backgroundColor: AppColors.accentBlue,
        foregroundColor: Colors.white,
        bottom: TabBar(
          controller: _tabController,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white70,
          indicatorColor: Colors.white,
          tabs: const [
            Tab(
              icon: Icon(Icons.qr_code),
              text: 'QR Code',
            ),
            Tab(
              icon: Icon(Icons.person),
              text: 'Student ID',
            ),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildQRCodeTab(),
          _buildStudentIdTab(),
        ],
      ),
    );
  }

  Widget _buildQRCodeTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Instructions
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.accentBlue.withOpacity(0.1),
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
                  'Link Child by QR Code',
                  style: AppTextStyles.h5.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Scan your child\'s QR code or enter it manually below',
                  style: AppTextStyles.bodySmall,
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),

          const SizedBox(height: 24),

          // QR Code Input
          TextInputCustom(
            controller: _qrCodeController,
            label: 'QR Code',
            hint: 'Enter or scan QR code',
            leadingIcon: Icons.qr_code,
          ),

          const SizedBox(height: 16),

          // Scan Button
          PrimaryButton(
            label: 'Open QR Scanner',
            icon: Icons.camera_alt,
            onPressed: () {
              _showQRScanner();
            },
            fullWidth: true,
          ),

          const SizedBox(height: 16),

          // Link Button
          PrimaryButton(
            label: _isLinking ? 'Linking...' : 'Link Child',
            icon: Icons.link,
            onPressed: _isLinking || _qrCodeController.text.isEmpty
                ? null
                : () => _linkByQR(_qrCodeController.text.trim()),
            fullWidth: true,
            isLoading: _isLinking,
          ),

          // Result Display
          if (_linkingResult != null) ...[
            const SizedBox(height: 24),
            _buildLinkingResult(_linkingResult!),
          ],
        ],
      ),
    );
  }

  Widget _buildStudentIdTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Instructions
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.accentBlue.withOpacity(0.1),
              borderRadius: AppBorders.borderRadiusLg,
            ),
            child: Column(
              children: [
                Icon(
                  Icons.person,
                  size: 48,
                  color: AppColors.accentBlue,
                ),
                const SizedBox(height: 12),
                Text(
                  'Link Child by Student ID',
                  style: AppTextStyles.h5.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Enter your child\'s Student ID or Registration Number',
                  style: AppTextStyles.bodySmall,
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),

          const SizedBox(height: 24),

          // Student ID Input
          TextInputCustom(
            controller: _studentIdController,
            label: 'Student ID',
            hint: 'Enter Student ID or Registration Number',
            leadingIcon: Icons.badge,
          ),

          const SizedBox(height: 16),

          // Link Button
          PrimaryButton(
            label: _isLinking ? 'Linking...' : 'Link Child',
            icon: Icons.link,
            onPressed: _isLinking || _studentIdController.text.isEmpty
                ? null
                : () => _linkById(_studentIdController.text.trim()),
            fullWidth: true,
            isLoading: _isLinking,
          ),

          // Result Display
          if (_linkingResult != null) ...[
            const SizedBox(height: 24),
            _buildLinkingResult(_linkingResult!),
          ],
        ],
      ),
    );
  }

  Widget _buildLinkingResult(QRVerificationResult result) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: result.verified
            ? AppColors.success.withOpacity(0.1)
            : AppColors.warning.withOpacity(0.1),
        borderRadius: AppBorders.borderRadiusLg,
        border: Border.all(
          color: result.verified ? AppColors.success : AppColors.warning,
          width: 2,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                result.verified ? Icons.check_circle : Icons.info,
                color: result.verified ? AppColors.success : AppColors.warning,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  result.verified
                      ? 'Child Linked Successfully!'
                      : 'Linking Pending Approval',
                  style: AppTextStyles.h5.copyWith(
                    fontWeight: FontWeight.bold,
                    color: result.verified
                        ? AppColors.success
                        : AppColors.warning,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            result.message ?? '',
            style: AppTextStyles.bodyMedium,
          ),
          if (result.student != null) ...[
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.backgroundWhite,
                borderRadius: AppBorders.borderRadiusMd,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Student Information',
                    style: AppTextStyles.bodyMedium.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text('Name: ${result.student!.name}'),
                  if (result.student!.grade != null &&
                      result.student!.section != null)
                    Text(
                        'Grade: ${result.student!.grade} - Section ${result.student!.section}'),
                  if (result.student!.institutionName != null)
                    Text('School: ${result.student!.institutionName}'),
                ],
              ),
            ),
            if (result.verified) ...[
              const SizedBox(height: 16),
              PrimaryButton(
                label: 'View Child Dashboard',
                icon: Icons.dashboard,
                onPressed: () {
                  Navigator.push<void>(
                    context,
                    MaterialPageRoute<void>(
                      builder: (context) => ChildDetailScreen(
                        studentId: result.student!.id,
                      ),
                    ),
                  );
                },
                fullWidth: true,
              ),
            ],
          ],
        ],
      ),
    );
  }

  void _showQRScanner() {
    _scannerController = MobileScannerController();
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.8,
        decoration: BoxDecoration(
          color: Colors.black,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Stack(
          children: [
            MobileScanner(
              controller: _scannerController,
              onDetect: (capture) {
                final List<Barcode> barcodes = capture.barcodes;
                for (final barcode in barcodes) {
                  if (barcode.rawValue != null) {
                    Navigator.pop(context);
                    _qrCodeController.text = barcode.rawValue!;
                    _linkByQR(barcode.rawValue!);
                    break;
                  }
                }
              },
            ),
            Positioned(
              top: 16,
              right: 16,
              child: IconButton(
                icon: const Icon(Icons.close, color: Colors.white),
                onPressed: () {
                  _scannerController?.dispose();
                  Navigator.pop(context);
                },
              ),
            ),
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
                    const Text(
                      'Position QR code within frame',
                      style: TextStyle(color: Colors.white),
                    ),
                    const SizedBox(height: 16),
                    SecondaryButton(
                      label: 'Close Scanner',
                      onPressed: () {
                        _scannerController?.dispose();
                        Navigator.pop(context);
                      },
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
}

