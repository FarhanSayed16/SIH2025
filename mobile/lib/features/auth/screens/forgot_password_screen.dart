/// Forgot Password Screen
/// Allows users to request a password reset link via email

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/widgets/widgets.dart';
import '../../../core/design/design_system.dart';
import '../../../core/utils/validators.dart';
import '../services/auth_service.dart';

class ForgotPasswordScreen extends ConsumerStatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  ConsumerState<ForgotPasswordScreen> createState() =>
      _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends ConsumerState<ForgotPasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  bool _emailTouched = false;
  String? _emailError;
  bool _isLoading = false;
  bool _isSuccess = false;

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  void _validateEmail() {
    if (_emailTouched) {
      final email = _emailController.text.trim();
      final error = Validators.emailError(email);
      setState(() {
        _emailError = error;
      });
    }
  }

  bool _isFormValid() {
    final email = _emailController.text.trim();
    if (email.isEmpty) {
      return false;
    }
    if (_emailError != null) {
      return false;
    }
    if (Validators.emailError(email) != null) {
      return false;
    }
    return true;
  }

  Future<void> _handleSubmit() async {
    // Mark field as touched
    setState(() {
      _emailTouched = true;
      _emailError = null;
    });

    // Validate
    _validateEmail();

    if (!_isFormValid()) {
      _formKey.currentState?.validate();
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      final authService = AuthService();
      final response = await authService.forgotPassword(
        _emailController.text.trim(),
      );

      if (response['success'] == true) {
        setState(() {
          _isSuccess = true;
          _isLoading = false;
        });
      } else {
        setState(() {
          _isLoading = false;
        });
        if (mounted) {
          SnackbarWidget.show(
            context,
            message: (response['message'] as String?) ?? 'Failed to send reset link',
            type: SnackbarType.error,
          );
        }
      }
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
      
      // Even on error, show success for security (don't reveal if email exists)
      setState(() {
        _isSuccess = true;
      });
      
      if (mounted) {
        print('Forgot password error: $e');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;

    if (_isSuccess) {
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
              child: Padding(
                padding: AppSpacing.screenEdge,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    SizedBox(height: size.height * 0.1),
                    
                    // Success Icon
                    Container(
                      padding: const EdgeInsets.all(AppSpacing.xl),
                      decoration: BoxDecoration(
                        color: AppColors.primaryGreen.withOpacity(0.1),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        Icons.email_outlined,
                        size: 80,
                        color: AppColors.primaryGreen,
                      ),
                    )
                        .animate()
                        .scale(delay: 200.ms, duration: 500.ms)
                        .fadeIn(delay: 200.ms, duration: 500.ms),
                    
                    SizedBox(height: AppSpacing.xl),
                    
                    // Success Title
                    Text(
                      'Check Your Email',
                      style: AppTextStyles.h1,
                      textAlign: TextAlign.center,
                    )
                        .animate()
                        .fadeIn(delay: 400.ms, duration: 500.ms)
                        .slideY(begin: 0.2, end: 0, delay: 400.ms, duration: 500.ms),
                    
                    SizedBox(height: AppSpacing.md),
                    
                    // Success Message
                    Text(
                      'If this email is registered, we have sent a password reset link.',
                      style: AppTextStyles.bodyLarge.copyWith(
                        color: AppColors.textSecondary,
                      ),
                      textAlign: TextAlign.center,
                    )
                        .animate()
                        .fadeIn(delay: 600.ms, duration: 500.ms),
                    
                    SizedBox(height: AppSpacing.sm),
                    
                    Text(
                      'The link will expire in 30 minutes.',
                      style: AppTextStyles.bodySmall.copyWith(
                        color: AppColors.textTertiary,
                      ),
                      textAlign: TextAlign.center,
                    )
                        .animate()
                        .fadeIn(delay: 800.ms, duration: 500.ms),
                    
                    SizedBox(height: AppSpacing.xl * 2),
                    
                    // Back to Login Button
                    PrimaryButton(
                      label: 'Back to Login',
                      onPressed: () {
                        Navigator.of(context).pop();
                      },
                      fullWidth: true,
                      size: ButtonSize.large,
                    )
                        .animate()
                        .fadeIn(delay: 1000.ms, duration: 500.ms)
                        .scale(
                            delay: 1000.ms,
                            duration: 500.ms,
                            begin: const Offset(0.95, 0.95)),
                    
                    SizedBox(height: AppSpacing.md),
                    
                    // Request Another Link Button
                    SecondaryButton(
                      label: 'Request Another Link',
                      onPressed: () {
                        setState(() {
                          _isSuccess = false;
                          _emailController.clear();
                          _emailTouched = false;
                          _emailError = null;
                        });
                      },
                      fullWidth: true,
                      size: ButtonSize.large,
                    )
                        .animate()
                        .fadeIn(delay: 1200.ms, duration: 500.ms),
                  ],
                ),
              ),
            ),
          ),
        ),
      );
    }

    return Scaffold(
      appBar: const AppBarCustom(
        title: 'Forgot Password',
        automaticallyImplyLeading: true,
      ),
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
            child: Padding(
              padding: AppSpacing.screenEdge,
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    SizedBox(height: size.height * 0.05),
                    
                    // Icon
                    Container(
                      padding: const EdgeInsets.all(AppSpacing.xl),
                      decoration: BoxDecoration(
                        color: AppColors.primaryGreen.withOpacity(0.1),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        Icons.lock_reset,
                        size: 60,
                        color: AppColors.primaryGreen,
                      ),
                    )
                        .animate()
                        .scale(delay: 200.ms, duration: 500.ms)
                        .fadeIn(delay: 200.ms, duration: 500.ms),
                    
                    SizedBox(height: AppSpacing.xl),
                    
                    // Title
                    Text(
                      'Forgot Password?',
                      style: AppTextStyles.h1,
                      textAlign: TextAlign.center,
                    )
                        .animate()
                        .fadeIn(delay: 400.ms, duration: 500.ms)
                        .slideY(begin: 0.2, end: 0, delay: 400.ms, duration: 500.ms),
                    
                    SizedBox(height: AppSpacing.md),
                    
                    // Description
                    Text(
                      'Enter your email address and we\'ll send you a link to reset your password.',
                      style: AppTextStyles.bodyLarge.copyWith(
                        color: AppColors.textSecondary,
                      ),
                      textAlign: TextAlign.center,
                    )
                        .animate()
                        .fadeIn(delay: 600.ms, duration: 500.ms),
                    
                    SizedBox(height: AppSpacing.xl * 2),
                    
                    // Email Input
                    TextInputCustom(
                      controller: _emailController,
                      label: 'Email',
                      hint: 'example@gmail.com',
                      keyboardType: TextInputType.emailAddress,
                      onChanged: (value) {
                        setState(() {
                          _emailError = null;
                        });
                        if (_emailTouched) {
                          _validateEmail();
                        }
                      },
                      onEditingComplete: () {
                        _validateEmail();
                        _handleSubmit();
                      },
                      validator: (value) {
                        if (_emailTouched) {
                          return Validators.emailError(value ?? '');
                        }
                        return null;
                      },
                      errorText: _emailTouched ? _emailError : null,
                    )
                        .animate()
                        .fadeIn(delay: 800.ms, duration: 500.ms)
                        .slideX(
                            begin: -0.1,
                            end: 0,
                            delay: 800.ms,
                            duration: 500.ms),
                    
                    SizedBox(height: AppSpacing.xl),
                    
                    // Submit Button
                    PrimaryButton(
                      label: 'Send Reset Link',
                      onPressed:
                          (_isLoading || !_isFormValid()) ? null : _handleSubmit,
                      isLoading: _isLoading,
                      fullWidth: true,
                      size: ButtonSize.large,
                    )
                        .animate()
                        .fadeIn(delay: 1000.ms, duration: 500.ms)
                        .scale(
                            delay: 1000.ms,
                            duration: 500.ms,
                            begin: const Offset(0.95, 0.95)),
                    
                    SizedBox(height: AppSpacing.lg),
                    
                    // Back to Login Link
                    TextButtonCustom(
                      label: 'Back to Login',
                      onPressed: () {
                        Navigator.of(context).pop();
                      },
                    )
                        .animate()
                        .fadeIn(delay: 1200.ms, duration: 500.ms),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

