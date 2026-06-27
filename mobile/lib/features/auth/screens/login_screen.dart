/// RBAC Refinement: Login Screen - Modern Redesign
/// High-end startup-quality UI with animations and glassmorphism

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:dio/dio.dart';
import '../../../core/widgets/widgets.dart';
import '../../../core/design/design_system.dart';
import '../../../core/utils/validators.dart';
import '../../../l10n/app_localizations.dart';
import '../providers/auth_provider.dart';
import 'register_screen.dart';
import 'approval_pending_screen.dart';
import '../../qr/screens/qr_scanner_screen.dart';
import '../../student/services/student_service.dart';
import '../../../core/providers/api_service_provider.dart';
import '../../student/screens/join_class_screen.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  // Field-specific error messages from backend
  String? _emailError;
  String? _passwordError;

  // Touched state tracking
  bool _emailTouched = false;
  bool _passwordTouched = false;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleJoinClassByQR(BuildContext context, String qrCode) async {
    // Use shared ApiService from provider to ensure token is available
    final apiService = ref.read(apiServiceProvider);
    final studentService = StudentService(apiService: apiService);

    // Show loading
    showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (context) => const Center(
        child: CircularProgressIndicator(),
      ),
    );

    try {
      // Parse QR code to extract classId
      final classId = studentService.parseClassQRCode(qrCode);
      if (classId == null) {
        Navigator.pop(context); // Close loading
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: const Text(
                  'Invalid QR code format. Please scan a valid class QR code.'),
              backgroundColor: AppColors.error,
            ),
          );
        }
        return;
      }

      // Join class using classId
      final response = await studentService.joinClassByQR(classId);

      Navigator.pop(context); // Close loading

      if (response['success'] == true) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                (response['message'] as String?) ??
                    'Join request sent successfully!',
              ),
              backgroundColor: AppColors.success,
            ),
          );
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                (response['message'] as String?) ?? 'Failed to join class',
              ),
              backgroundColor: AppColors.error,
            ),
          );
        }
      }
    } catch (e) {
      Navigator.pop(context); // Close loading
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString().replaceAll('Exception: ', '')),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  // Validate field and update errors
  void _validateEmail() {
    if (_emailTouched) {
      final email = _emailController.text.trim();
      final error = Validators.emailError(email);
      setState(() {
        _emailError = error;
      });
    }
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

  // Check if form is valid
  bool _isFormValid() {
    final email = _emailController.text.trim();
    final password = _passwordController.text;

    if (email.isEmpty || password.isEmpty) {
      return false;
    }

    // Check for validation errors
    if (_emailError != null || _passwordError != null) {
      return false;
    }

    // Validate fields
    if (Validators.emailError(email) != null) {
      return false;
    }
    if (Validators.passwordError(password) != null) {
      return false;
    }

    return true;
  }

  Future<void> _handleLogin() async {
    // Mark all fields as touched
    setState(() {
      _emailTouched = true;
      _passwordTouched = true;
    });

    // Clear previous backend errors
    setState(() {
      _emailError = null;
      _passwordError = null;
    });

    // Validate all fields
    _validateEmail();
    _validatePassword();

    // Check if form is valid
    if (!_isFormValid()) {
      // Trigger form validation to show errors
      _formKey.currentState?.validate();
      return;
    }

    if (!_formKey.currentState!.validate()) {
      return;
    }

    try {
      await ref.read(authProvider.notifier).login(
            _emailController.text.trim(),
            _passwordController.text,
          );
      // Navigation handled automatically by main.dart
    } on DioException catch (e) {
      // Handle DioException (API errors)
      if (mounted) {
        final data = e.response?.data as Map<String, dynamic>?;

        // Extract error message from response
        String errorMessage = 'Login failed';
        if (data != null) {
          errorMessage = data['message'] as String? ??
              data['error'] as String? ??
              errorMessage;
        }

        // Extract field-specific errors if available
        Map<String, String> fieldErrors = {};
        if (data != null) {
          final errors = data['errors'] as Map<String, dynamic>?;
          if (errors != null) {
            final fields = errors['fields'] as Map<String, dynamic>?;
            if (fields != null) {
              fields.forEach((key, value) {
                if (value is String) {
                  fieldErrors[key] = value;
                }
              });
            }
          }
        }

        // Update field errors
        if (fieldErrors.isNotEmpty) {
          setState(() {
            _emailError = fieldErrors['email'];
            _passwordError = fieldErrors['password'];
          });
        }

        final errorString = errorMessage.toLowerCase();

        // Debug: Print the actual error to help diagnose
        print('🔍 Login catch - Error type: ${e.runtimeType}');
        print('🔍 Login catch - Error message: $errorMessage');

        // Check if account is pending approval - navigate to approval screen
        final isPendingApproval =
            errorString.contains('pending teacher approval') ||
                errorString.contains('pending approval') ||
                errorString.contains('account is pending') ||
                errorString.contains('wait for approval') ||
                (errorString.contains('pending') &&
                    errorString.contains('teacher')) ||
                (errorString.contains('pending') &&
                    errorString.contains('approval'));

        // Check if user is a roster record (cannot login)
        final isRosterRecord = errorString.contains('roster record') ||
            errorString.contains('cannot login') ||
            errorString.contains('contact your teacher') ||
            errorString.contains('contact your school admin') ||
            errorString.contains('please register');

        print('🔍 Is pending approval? $isPendingApproval');
        print('🔍 Is roster record? $isRosterRecord');

        if (isPendingApproval) {
          // Extract email from controller for student name
          final email = _emailController.text.trim();
          // Format name from email (e.g., "rohan.sharma@student.com" -> "rohan sharma")
          final nameParts = email.split('@').first.split('.');
          final name = nameParts
              .map((part) =>
                  part.isEmpty ? '' : part[0].toUpperCase() + part.substring(1))
              .join(' ');

          print(
              '✅ Detected pending approval - navigating to ApprovalPendingScreen');
          print('   Email: $email');
          print('   Name: $name');

          Navigator.of(context).pushReplacement<void, void>(
            MaterialPageRoute<void>(
              builder: (context) => ApprovalPendingScreen(
                studentName: name.isNotEmpty ? name : email.split('@').first,
                studentEmail: email,
              ),
            ),
          );
          return; // Don't show snackbar, we navigated
        } else if (isRosterRecord) {
          // Roster records cannot login - show specific message
          errorMessage =
              'Roster records cannot login. Please contact your teacher.';
        } else if (errorString.contains('rejected')) {
          errorMessage =
              'Your account has been rejected. Please contact your teacher.';
        } else if (errorString.contains('invalid credentials') ||
            errorString.contains('invalid email or password')) {
          errorMessage = 'Invalid email or password';
        } else if (errorString.contains('connection timeout') ||
            errorString.contains('no internet') ||
            errorString.contains('connection error')) {
          errorMessage =
              'Connection error. Please check your internet connection.';
        }

        // Only show snackbar if we didn't navigate away
        if (!isPendingApproval) {
          SnackbarWidget.show(
            context,
            message: errorMessage,
            type: SnackbarType.error,
          );
        }
      }
    } catch (e, stack) {
      // Fallback for unexpected errors
      if (mounted) {
        print('❌ Login error: $e');
        print('Stack trace: $stack');
        SnackbarWidget.show(
          context,
          message: 'Something went wrong. Please try again.',
          type: SnackbarType.error,
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final l10n = AppLocalizations.of(context);
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
            child: Padding(
              padding: AppSpacing.screenEdge,
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    SizedBox(height: size.height * 0.08),

                    // Animated Logo Section
                    Column(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(AppSpacing.xl),
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: [
                                AppColors.primaryGreen.withOpacity(0.2),
                                AppColors.primaryGreenSubtle,
                              ],
                            ),
                            shape: BoxShape.circle,
                            boxShadow: [
                              BoxShadow(
                                color: AppColors.primaryGreen.withOpacity(0.3),
                                blurRadius: 20,
                                spreadRadius: 2,
                              ),
                            ],
                          ),
                          child: Icon(
                            Icons.shield,
                            size: 64,
                            color: AppColors.primaryGreen,
                          ),
                        )
                            .animate()
                            .scale(
                                delay: 100.ms,
                                duration: 600.ms,
                                curve: Curves.easeOut)
                            .fadeIn(delay: 100.ms, duration: 600.ms),
                        SizedBox(height: AppSpacing.lg),
                        Text(
                          l10n.appName,
                          style: AppTextStyles.h1.copyWith(
                            color: AppColors.primaryGreen,
                            fontWeight: FontWeight.bold,
                          ),
                          textAlign: TextAlign.center,
                        )
                            .animate()
                            .fadeIn(delay: 300.ms, duration: 600.ms)
                            .slideY(
                                begin: -0.2,
                                end: 0,
                                delay: 300.ms,
                                duration: 600.ms),
                        SizedBox(height: AppSpacing.sm),
                        Text(
                          l10n.appDescription,
                          style: AppTextStyles.bodyMedium.copyWith(
                            color: AppColors.textSecondary,
                          ),
                          textAlign: TextAlign.center,
                        ).animate().fadeIn(delay: 500.ms, duration: 600.ms),
                      ],
                    ),

                    SizedBox(height: AppSpacing.xxl * 1.5),

                    // Glassmorphic Card Container
                    Container(
                      padding: const EdgeInsets.all(AppSpacing.xl),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.9),
                        borderRadius:
                            BorderRadius.circular(AppBorders.radiusXl),
                        border: Border.all(
                          color: Colors.white.withOpacity(0.3),
                          width: 1.5,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.primaryGreen.withOpacity(0.1),
                            blurRadius: 30,
                            spreadRadius: 5,
                            offset: const Offset(0, 10),
                          ),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          // Email Field
                          TextInputCustom(
                            label: l10n.email,
                            hint: 'example@gmail.com',
                            controller: _emailController,
                            keyboardType: TextInputType.emailAddress,
                            leadingIcon: Icons.email_outlined,
                            required: true,
                            errorText: _emailError,
                            onChanged: (value) {
                              // Clear backend error when user starts typing
                              if (_emailError != null &&
                                  !_emailError!.contains('Gmail')) {
                                setState(() {
                                  _emailError = null;
                                });
                              }
                              // Real-time validation if touched
                              if (_emailTouched) {
                                _validateEmail();
                              }
                            },
                            onEditingComplete: () {
                              setState(() {
                                _emailTouched = true;
                              });
                              _validateEmail();
                            },
                            validator: (value) {
                              // Show backend error if available, otherwise use client-side validation
                              if (_emailError != null) {
                                return _emailError;
                              }
                              // Only show client-side error if field is touched
                              if (_emailTouched) {
                                return Validators.emailError(value ?? '');
                              }
                              return null;
                            },
                          )
                              .animate()
                              .fadeIn(delay: 700.ms, duration: 500.ms)
                              .slideX(
                                  begin: -0.1,
                                  end: 0,
                                  delay: 700.ms,
                                  duration: 500.ms),

                          SizedBox(height: AppSpacing.lg),

                          // Password Field
                          PasswordInputCustom(
                            label: l10n.password,
                            hint: '${l10n.password}...',
                            controller: _passwordController,
                            required: true,
                            errorText: _passwordError,
                            onChanged: (value) {
                              // Clear backend error when user starts typing
                              if (_passwordError != null) {
                                setState(() {
                                  _passwordError = null;
                                });
                              }
                              // Real-time validation if touched
                              if (_passwordTouched) {
                                _validatePassword();
                              }
                            },
                            onEditingComplete: () {
                              setState(() {
                                _passwordTouched = true;
                              });
                              _validatePassword();
                            },
                            validator: (value) {
                              // Show backend error if available, otherwise use client-side validation
                              if (_passwordError != null) {
                                return _passwordError;
                              }
                              // Only show client-side error if field is touched
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

                          SizedBox(height: AppSpacing.md),

                          // Forgot Password Link
                          Align(
                            alignment: Alignment.centerRight,
                            child: TextButtonCustom(
                              label: 'Forgot Password?',
                              onPressed: () {
                                Navigator.of(context)
                                    .pushNamed('/forgot-password');
                              },
                            ),
                          ).animate().fadeIn(delay: 900.ms, duration: 400.ms),

                          SizedBox(height: AppSpacing.lg),

                          // Login Button
                          PrimaryButton(
                            label: l10n.login,
                            onPressed: (authState.isLoading || !_isFormValid())
                                ? null
                                : _handleLogin,
                            isLoading: authState.isLoading,
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
                    ).animate().fadeIn(delay: 600.ms, duration: 800.ms).slideY(
                        begin: 0.2,
                        end: 0,
                        delay: 600.ms,
                        duration: 800.ms,
                        curve: Curves.easeOut),

                    SizedBox(height: AppSpacing.xl),

                    // Divider with Animation
                    Row(
                      children: [
                        Expanded(
                          child: Divider(
                            color: AppColors.divider.withOpacity(0.5),
                            thickness: 1,
                          ),
                        ),
                        Padding(
                          padding: const EdgeInsets.symmetric(
                              horizontal: AppSpacing.md),
                          child: Text(
                            'OR',
                            style: AppTextStyles.bodySmall.copyWith(
                              color: AppColors.textSecondary,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                        Expanded(
                          child: Divider(
                            color: AppColors.divider.withOpacity(0.5),
                            thickness: 1,
                          ),
                        ),
                      ],
                    )
                        .animate()
                        .fadeIn(delay: 1100.ms, duration: 500.ms)
                        .scale(delay: 1100.ms, duration: 500.ms),

                    SizedBox(height: AppSpacing.lg),

                    // QR Login Button - Prominent for Students
                    Container(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            AppColors.primaryGreen.withOpacity(0.1),
                            AppColors.primaryGreenSubtle.withOpacity(0.05),
                          ],
                        ),
                        borderRadius:
                            BorderRadius.circular(AppBorders.radiusLg),
                        border: Border.all(
                          color: AppColors.primaryGreen.withOpacity(0.3),
                          width: 1.5,
                        ),
                      ),
                      child: Column(
                        children: [
                          // Join Class Header
                          Text(
                            'Join a Class',
                            style: AppTextStyles.h4.copyWith(
                              color: AppColors.primaryGreen,
                              fontWeight: FontWeight.bold,
                            ),
                            textAlign: TextAlign.center,
                          ),
                          SizedBox(height: AppSpacing.sm),
                          Text(
                            'Use class code or QR code',
                            style: AppTextStyles.bodySmall.copyWith(
                              color: AppColors.textSecondary,
                            ),
                            textAlign: TextAlign.center,
                          ),
                          SizedBox(height: AppSpacing.lg),

                          // Manual Code Option
                          OutlinedButtonCustom(
                            label: 'Enter Class Code',
                            onPressed: () {
                              final authState = ref.read(authProvider);
                              if (!authState.isAuthenticated) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: const Text(
                                        'Please login first to join a class'),
                                    backgroundColor: AppColors.warning,
                                    duration: const Duration(seconds: 3),
                                  ),
                                );
                                return;
                              }
                              // Navigate to join class screen
                              Navigator.of(context).push<void>(
                                MaterialPageRoute<void>(
                                  builder: (context) => const JoinClassScreen(),
                                ),
                              );
                            },
                            icon: Icons.text_fields,
                            fullWidth: true,
                            size: ButtonSize.large,
                          ),
                          SizedBox(height: AppSpacing.md),

                          // QR Code Option
                          OutlinedButtonCustom(
                            label: 'Scan QR Code',
                            onPressed: () {
                              // Check if user is logged in
                              final authState = ref.read(authProvider);
                              if (authState.isAuthenticated &&
                                  authState.user != null) {
                                // User is logged in - open QR scanner for class join
                                Navigator.of(context)
                                    .push<String>(
                                  MaterialPageRoute(
                                    builder: (context) => const QRScannerScreen(
                                      title: 'Scan Class QR Code',
                                      isClassroomMode: true,
                                    ),
                                  ),
                                )
                                    .then((qrCode) async {
                                  if (qrCode != null && mounted) {
                                    await _handleJoinClassByQR(context, qrCode);
                                  }
                                });
                              } else {
                                // User not logged in - show message
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: const Text(
                                      'Please login first to join a class via QR code',
                                    ),
                                    action: SnackBarAction(
                                      label: 'Login',
                                      textColor: Colors.white,
                                      onPressed: () {
                                        // Focus on email field to encourage login
                                        FocusScope.of(context).requestFocus(
                                          FocusNode(),
                                        );
                                      },
                                    ),
                                    backgroundColor: AppColors.warning,
                                    duration: const Duration(seconds: 4),
                                  ),
                                );
                              }
                            },
                            icon: Icons.qr_code_scanner_rounded,
                            fullWidth: true,
                            size: ButtonSize.large,
                          ),
                        ],
                      ),
                    ).animate().fadeIn(delay: 1200.ms, duration: 500.ms).slideY(
                        begin: 0.1, end: 0, delay: 1200.ms, duration: 500.ms),

                    SizedBox(height: AppSpacing.xl),

                    // Register Link
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          "Don't have an account? ",
                          style: AppTextStyles.bodyMedium.copyWith(
                            color: AppColors.textSecondary,
                          ),
                        ),
                        TextButtonCustom(
                          label: l10n.register,
                          onPressed: () {
                            Navigator.of(context).push<void>(
                              MaterialPageRoute<void>(
                                builder: (context) => const RegisterScreen(),
                              ),
                            );
                          },
                        ),
                      ],
                    ).animate().fadeIn(delay: 1300.ms, duration: 500.ms),
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
