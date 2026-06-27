/// RBAC Refinement: Approval Pending Screen
/// Shows waiting status while teacher reviews join request

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:lottie/lottie.dart';
import '../../../core/widgets/widgets.dart';
import '../../../core/design/design_system.dart';
import '../providers/auth_provider.dart';

class ApprovalPendingScreen extends ConsumerStatefulWidget {
  final String? requestId;
  final String studentName;
  final String? studentEmail;

  const ApprovalPendingScreen({
    super.key,
    this.requestId,
    required this.studentName,
    this.studentEmail,
  });

  @override
  ConsumerState<ApprovalPendingScreen> createState() =>
      _ApprovalPendingScreenState();
}

class _ApprovalPendingScreenState extends ConsumerState<ApprovalPendingScreen> {
  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;

    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              AppColors.primaryGreen.withOpacity(0.1),
              AppColors.backgroundLight,
              AppColors.primaryGreenSubtle.withOpacity(0.05),
            ],
          ),
        ),
        child: SafeArea(
          child: SingleChildScrollView(
            padding: AppSpacing.screenEdge,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                SizedBox(height: size.height * 0.1),

                // Animated Lottie
                Container(
                  height: 200,
                  child: Lottie.asset(
                    'assets/animations/loading.json',
                    fit: BoxFit.contain,
                    repeat: true,
                  ),
                )
                    .animate()
                    .scale(
                        delay: 100.ms, duration: 800.ms, curve: Curves.easeOut)
                    .fadeIn(delay: 100.ms, duration: 800.ms),

                SizedBox(height: AppSpacing.xxl),

                Text(
                  'Request Submitted!',
                  style: AppTextStyles.h1.copyWith(
                    color: AppColors.primaryGreen,
                    fontWeight: FontWeight.bold,
                  ),
                  textAlign: TextAlign.center,
                ).animate().fadeIn(delay: 300.ms, duration: 600.ms).slideY(
                    begin: -0.2, end: 0, delay: 300.ms, duration: 600.ms),

                SizedBox(height: AppSpacing.md),

                Text(
                  'Hello ${widget.studentName}!',
                  style: AppTextStyles.h3,
                  textAlign: TextAlign.center,
                ).animate().fadeIn(delay: 500.ms, duration: 600.ms),

                SizedBox(height: AppSpacing.lg),

                Container(
                  padding: const EdgeInsets.all(AppSpacing.xl),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.9),
                    borderRadius: BorderRadius.circular(AppBorders.radiusXl),
                    border: Border.all(
                      color: AppColors.primaryGreen.withOpacity(0.3),
                      width: 1.5,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.primaryGreen.withOpacity(0.1),
                        blurRadius: 30,
                        spreadRadius: 5,
                      ),
                    ],
                  ),
                  child: Column(
                    children: [
                      Icon(
                        Icons.hourglass_empty_rounded,
                        size: 48,
                        color: AppColors.accentOrange,
                      ),
                      SizedBox(height: AppSpacing.lg),
                      Text(
                        'Waiting for Teacher Approval',
                        style: AppTextStyles.h3,
                        textAlign: TextAlign.center,
                      ),
                      SizedBox(height: AppSpacing.md),
                      Text(
                        widget.requestId != null
                            ? 'Your join request has been submitted to your teacher. '
                                'You will receive a notification once your request is approved.'
                            : 'Your account registration is pending teacher approval. '
                                'You will receive a notification once your account is approved.',
                        style: AppTextStyles.bodyMedium.copyWith(
                          color: AppColors.textSecondary,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      if (widget.studentEmail != null) ...[
                        SizedBox(height: AppSpacing.md),
                        Text(
                          'Email: ${widget.studentEmail}',
                          style: AppTextStyles.bodySmall.copyWith(
                            color: AppColors.textSecondary,
                            fontStyle: FontStyle.italic,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ],
                  ),
                ).animate().fadeIn(delay: 700.ms, duration: 800.ms).slideY(
                    begin: 0.2, end: 0, delay: 700.ms, duration: 800.ms),

                SizedBox(height: AppSpacing.xxl),

                TextButtonCustom(
                  label: 'Back to Login',
                  onPressed: () async {
                    // Clear auth state before going back to prevent auto-login
                    final authNotifier = ref.read(authProvider.notifier);
                    await authNotifier.logout();
                    // Navigate to login screen
                    if (context.mounted) {
                      Navigator.of(context).popUntil((route) => route.isFirst);
                    }
                  },
                ).animate().fadeIn(delay: 900.ms, duration: 500.ms),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
