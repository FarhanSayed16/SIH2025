/// Reset Password Screen
/// Allows users to set a new password using a reset token

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/widgets/widgets.dart';
import '../../../core/design/design_system.dart';
import '../../../core/utils/validators.dart';
import '../services/auth_service.dart';

class ResetPasswordScreen extends ConsumerStatefulWidget {
  final String? token;

  const ResetPasswordScreen({
    super.key,
    this.token,
  });

  @override
  ConsumerState<ResetPasswordScreen> createState() =>
      _ResetPasswordScreenState();
}

class _ResetPasswordScreenState extends ConsumerState<ResetPasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _passwordTouched = false;
  bool _confirmPasswordTouched = false;
  String? _passwordError;
  String? _confirmPasswordError;
  bool _isLoading = false;
  bool _isSuccess = false;

  @override
  void initState() {
    super.initState();
    if (widget.token == null || widget.token!.isEmpty) {
      // Token is invalid, show error state
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) {
          SnackbarWidget.show(
            context,
            message: 'Invalid reset link. Please request a new one.',
            type: SnackbarType.error,
          );
        }
      });
    }
  }

  @override
  void dispose() {
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  void _validatePassword() {
    if (_passwordTouched) {
      final password = _passwordController.text;
      final error = Validators.passwordError(password);
      setState(() {
        _passwordError = error;
      });
    }
  }

  void _validateConfirmPassword() {
    if (_confirmPasswordTouched) {
      final password = _passwordController.text;
      final confirmPassword = _confirmPasswordController.text;
      String? error;
      
      if (confirmPassword.isEmpty) {
        error = 'Please re-enter your password.';
      } else if (confirmPassword != password) {
        error = 'Passwords do not match.';
      }
      
      setState(() {
        _confirmPasswordError = error;
      });
    }
  }

  bool _isFormValid() {
    final password = _passwordController.text;
    final confirmPassword = _confirmPasswordController.text;
    
    if (password.isEmpty || confirmPassword.isEmpty) {
      return false;
    }
    
    if (_passwordError != null || _confirmPasswordError != null) {
      return false;
    }
    
    if (Validators.passwordError(password) != null) {
      return false;
    }
    
    if (confirmPassword != password) {
      return false;
    }
    
    return true;
  }

  Future<void> _handleSubmit() async {
    if (widget.token == null || widget.token!.isEmpty) {
      if (mounted) {
        SnackbarWidget.show(
          context,
          message: 'Invalid reset link. Please request a new one.',
          type: SnackbarType.error,
        );
      }
      return;
    }

    // Mark fields as touched
    setState(() {
      _passwordTouched = true;
      _confirmPasswordTouched = true;
      _passwordError = null;
      _confirmPasswordError = null;
    });

    // Validate
    _validatePassword();
    _validateConfirmPassword();

    if (!_isFormValid()) {
      _formKey.currentState?.validate();
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      final authService = AuthService();
      final response = await authService.resetPassword(
        widget.token!,
        _passwordController.text,
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
            message: (response['message'] as String?) ?? 'Failed to reset password',
            type: SnackbarType.error,
          );
        }
      }
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
      
      final errorMessage = e.toString();
      String displayMessage = 'Failed to reset password.';
      
      if (errorMessage.contains('Invalid') || errorMessage.contains('expired')) {
        displayMessage = 'This reset link is invalid or has expired. Please request a new one.';
      } else if (errorMessage.contains('message')) {
        // Try to extract the actual error message
        try {
          final match = RegExp(r'message: (.+)').firstMatch(errorMessage);
          if (match != null) {
            displayMessage = match.group(1) ?? displayMessage;
          }
        } catch (_) {}
      }
      
      if (mounted) {
        SnackbarWidget.show(
          context,
          message: displayMessage,
          type: SnackbarType.error,
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;

    if (widget.token == null || widget.token!.isEmpty) {
      return Scaffold(
        appBar: const AppBarCustom(
          title: 'Invalid Reset Link',
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
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    SizedBox(height: size.height * 0.1),
                    
                    // Warning Icon
                    Container(
                      padding: const EdgeInsets.all(AppSpacing.xl),
                      decoration: BoxDecoration(
                        color: AppColors.error.withOpacity(0.1),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        Icons.warning_amber_rounded,
                        size: 80,
                        color: AppColors.error,
                      ),
                    ),
                    
                    SizedBox(height: AppSpacing.xl),
                    
                    // Error Title
                    Text(
                      'Invalid Reset Link',
                      style: AppTextStyles.h1,
                      textAlign: TextAlign.center,
                    ),
                    
                    SizedBox(height: AppSpacing.md),
                    
                    // Error Message
                    Text(
                      'This reset link is invalid or has expired. Please request a new password reset.',
                      style: AppTextStyles.bodyLarge.copyWith(
                        color: AppColors.textSecondary,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    
                    SizedBox(height: AppSpacing.xl * 2),
                    
                    // Request New Link Button
                    PrimaryButton(
                      label: 'Request New Reset Link',
                      onPressed: () {
                        Navigator.of(context).pushReplacementNamed('/forgot-password');
                      },
                      fullWidth: true,
                      size: ButtonSize.large,
                    ),
                    
                    SizedBox(height: AppSpacing.md),
                    
                    // Back to Login Button
                    SecondaryButton(
                      label: 'Back to Login',
                      onPressed: () {
                        Navigator.of(context).popUntil((route) => route.isFirst);
                      },
                      fullWidth: true,
                      size: ButtonSize.large,
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      );
    }

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
                        Icons.check_circle_outline,
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
                      'Password Reset Successful',
                      style: AppTextStyles.h1,
                      textAlign: TextAlign.center,
                    )
                        .animate()
                        .fadeIn(delay: 400.ms, duration: 500.ms)
                        .slideY(begin: 0.2, end: 0, delay: 400.ms, duration: 500.ms),
                    
                    SizedBox(height: AppSpacing.md),
                    
                    // Success Message
                    Text(
                      'Your password has been reset successfully. You can now log in with your new password.',
                      style: AppTextStyles.bodyLarge.copyWith(
                        color: AppColors.textSecondary,
                      ),
                      textAlign: TextAlign.center,
                    )
                        .animate()
                        .fadeIn(delay: 600.ms, duration: 500.ms),
                    
                    SizedBox(height: AppSpacing.xl * 2),
                    
                    // Go to Login Button
                    PrimaryButton(
                      label: 'Go to Login',
                      onPressed: () {
                        Navigator.of(context).popUntil((route) => route.isFirst);
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
        title: 'Reset Password',
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
                        Icons.lock_outline,
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
                      'Reset Password',
                      style: AppTextStyles.h1,
                      textAlign: TextAlign.center,
                    )
                        .animate()
                        .fadeIn(delay: 400.ms, duration: 500.ms)
                        .slideY(begin: 0.2, end: 0, delay: 400.ms, duration: 500.ms),
                    
                    SizedBox(height: AppSpacing.md),
                    
                    // Description
                    Text(
                      'Enter your new password below.',
                      style: AppTextStyles.bodyLarge.copyWith(
                        color: AppColors.textSecondary,
                      ),
                      textAlign: TextAlign.center,
                    )
                        .animate()
                        .fadeIn(delay: 600.ms, duration: 500.ms),
                    
                    SizedBox(height: AppSpacing.xl * 2),
                    
                    // Password Input
                    PasswordInputCustom(
                      controller: _passwordController,
                      label: 'New Password',
                      hint: '••••••••',
                      errorText: _passwordTouched ? _passwordError : null,
                      onChanged: (value) {
                        setState(() {
                          _passwordError = null;
                        });
                        if (_passwordTouched) {
                          _validatePassword();
                        }
                        // Re-validate confirm password when password changes
                        if (_confirmPasswordTouched) {
                          _validateConfirmPassword();
                        }
                      },
                      onEditingComplete: () {
                        setState(() {
                          _passwordTouched = true;
                        });
                        _validatePassword();
                        FocusScope.of(context).nextFocus();
                      },
                      validator: (value) {
                        if (_passwordTouched) {
                          return Validators.passwordError(value ?? '');
                        }
                        return null;
                      },
                    )
                        .animate()
                        .fadeIn(delay: 800.ms, duration: 500.ms)
                        .slideX(
                            begin: -0.1,
                            end: 0,
                            delay: 800.ms,
                            duration: 500.ms),
                    
                    SizedBox(height: AppSpacing.lg),
                    
                    // Confirm Password Input
                    PasswordInputCustom(
                      controller: _confirmPasswordController,
                      label: 'Confirm Password',
                      hint: '••••••••',
                      errorText: _confirmPasswordTouched ? _confirmPasswordError : null,
                      onChanged: (value) {
                        setState(() {
                          _confirmPasswordError = null;
                        });
                        if (_confirmPasswordTouched) {
                          _validateConfirmPassword();
                        }
                      },
                      onEditingComplete: () {
                        setState(() {
                          _confirmPasswordTouched = true;
                        });
                        _validateConfirmPassword();
                        _handleSubmit();
                      },
                      validator: (value) {
                        if (_confirmPasswordTouched) {
                          final password = _passwordController.text;
                          if (value == null || value.isEmpty) {
                            return 'Please re-enter your password.';
                          }
                          if (value != password) {
                            return 'Passwords do not match.';
                          }
                        }
                        return null;
                      },
                    )
                        .animate()
                        .fadeIn(delay: 900.ms, duration: 500.ms)
                        .slideX(
                            begin: -0.1,
                            end: 0,
                            delay: 900.ms,
                            duration: 500.ms),
                    
                    SizedBox(height: AppSpacing.xl),
                    
                    // Submit Button
                    PrimaryButton(
                      label: 'Reset Password',
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
                    
                    // Request New Link
                    TextButtonCustom(
                      label: 'Request New Reset Link',
                      onPressed: () {
                        Navigator.of(context).pushReplacementNamed('/forgot-password');
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

