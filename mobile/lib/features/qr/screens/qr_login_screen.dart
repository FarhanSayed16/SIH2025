/// Phase 101.3: QR Login Screen - Redesigned
/// Modern QR login screen using new component library

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/widgets/widgets.dart';
import '../../../core/design/design_system.dart';
import '../../auth/providers/auth_provider.dart';
import '../screens/qr_scanner_screen.dart';

/// QR Login Screen - Allows students to login by scanning their QR badge
class QRLoginScreen extends ConsumerWidget {
  const QRLoginScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);

    return ScreenLayout(
      appBar: const AppBarCustom(
        title: 'QR Code Login',
        automaticallyImplyLeading: true,
      ),
      child: Center(
        child: SingleChildScrollView(
          padding: AppSpacing.screenEdge,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              SizedBox(height: MediaQuery.of(context).size.height * 0.1),

              // QR Code Icon
              Container(
                padding: const EdgeInsets.all(AppSpacing.xl),
                decoration: BoxDecoration(
                  color: AppColors.accentBlue.withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.qr_code_scanner,
                  size: 80,
                  color: AppColors.accentBlue,
                ),
              ),

              SizedBox(height: AppSpacing.xl),

              // Title
              Text(
                'Scan Your QR Badge',
                style: AppTextStyles.h2,
                textAlign: TextAlign.center,
              ),

              SizedBox(height: AppSpacing.md),

              // Description
              Padding(
                padding: AppSpacing.screenHorizontal,
                child: Text(
                  'Use the camera to scan your student QR badge to login quickly and securely',
                  style: AppTextStyles.bodyMedium.copyWith(
                    color: AppColors.textSecondary,
                  ),
                  textAlign: TextAlign.center,
                ),
              ),

              SizedBox(height: AppSpacing.xxl),

              // Scan Button
              PrimaryButton(
                label: 'Scan QR Code',
                icon: Icons.camera_alt_outlined,
                onPressed: authState.isLoading
                    ? null
                    : () {
                        Navigator.of(context).push<void>(
                          MaterialPageRoute<void>(
                            builder: (context) => QRScannerScreen(
                              title: 'Login with QR',
                              onQRScanned: (qrCode) async {
                                try {
                                  await ref
                                      .read(authProvider.notifier)
                                      .loginWithQR(qrCode);
                                  // Navigation is handled automatically by main.dart
                                } catch (e) {
                                  if (context.mounted) {
                                    SnackbarWidget.show(
                                      context,
                                      message: e.toString().replaceAll(
                                          'Exception: ', ''),
                                      type: SnackbarType.error,
                                    );
                                  }
                                }
                              },
                            ),
                          ),
                        );
                      },
                isLoading: authState.isLoading,
                fullWidth: false,
                size: ButtonSize.large,
              ),

              SizedBox(height: AppSpacing.xl),

              // Help Info Card
              InfoCard(
                leadingIcon: Icons.info_outline,
                title: 'How to use QR Login',
                content: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildHelpItem(
                      '1. Tap "Scan QR Code" button',
                    ),
                    SizedBox(height: AppSpacing.xs),
                    _buildHelpItem(
                      '2. Position your QR badge within the frame',
                    ),
                    SizedBox(height: AppSpacing.xs),
                    _buildHelpItem(
                      '3. Wait for automatic recognition',
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHelpItem(String text) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(
          Icons.check_circle_outline,
          size: 16,
          color: AppColors.success,
        ),
        SizedBox(width: AppSpacing.xs),
        Expanded(
          child: Text(
            text,
            style: AppTextStyles.bodySmall,
          ),
        ),
      ],
    );
  }
}
