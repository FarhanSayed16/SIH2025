/// RBAC Refinement: Register Screen - Modern Redesign with Role Selection
/// High-end startup-quality UI with step-by-step registration flow

import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:dio/dio.dart';
import '../../../core/widgets/widgets.dart';
import '../../../core/design/design_system.dart';
import '../../../core/utils/validators.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/navigation/app_router.dart';
import '../providers/auth_provider.dart';
import '../services/school_service.dart';
import '../../qr/screens/qr_scanner_screen.dart';
import 'classroom_join_request_screen.dart';
import 'approval_pending_screen.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  int _currentStep = 0;
  final PageController _pageController = PageController();
  final _formKey = GlobalKey<FormState>();

  // Form controllers
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  final _phoneController = TextEditingController();
  final _parentNameController = TextEditingController();
  final _parentPhoneController = TextEditingController();

  String? _selectedRole;
  String? _selectedInstitutionId;
  String? _selectedGrade;
  String? _selectedClassId;
  String? _scannedQRCode; // For classroom QR
  final _classCodeController =
      TextEditingController(); // PHASE D: Class code for student registration

  List<Map<String, dynamic>> _schools = [];

  // Field-specific error messages from backend
  String? _nameError;
  String? _emailError;
  String? _passwordError;
  String? _confirmPasswordError;
  String? _phoneError;
  String? _institutionIdError;
  String? _gradeError;
  String? _sectionError;
  String? _classCodeError; // PHASE D: Class code error

  // Touched state tracking
  bool _nameTouched = false;
  bool _emailTouched = false;
  bool _passwordTouched = false;
  bool _confirmPasswordTouched = false;
  bool _phoneTouched = false;

  final SchoolService _schoolService = SchoolService();

  @override
  void initState() {
    super.initState();
    _loadSchools();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    _phoneController.dispose();
    _parentNameController.dispose();
    _parentPhoneController.dispose();
    _classCodeController.dispose(); // PHASE D
    _pageController.dispose();
    super.dispose();
  }

  Future<void> _loadSchools() async {
    try {
      final schools = await _schoolService.getSchools(limit: 100);
      setState(() {
        _schools = schools;
      });
    } catch (e) {
      if (mounted) {
        SnackbarWidget.show(context,
            message: 'Failed to load schools', type: SnackbarType.error);
      }
    }
  }

  void _nextStep() {
    // Validate current step before moving to next
    if (_currentStep == 0) {
      // Step 1: Role selection
      if (_selectedRole == null) {
        SnackbarWidget.show(context,
            message: 'Please select a role', type: SnackbarType.error);
        return;
      }
    } else if (_currentStep == 1) {
      // Step 2: Basic info - validate all fields
      setState(() {
        _nameTouched = true;
        _emailTouched = true;
        _passwordTouched = true;
        _confirmPasswordTouched = true;
        _phoneTouched = true;
      });

      _validateName();
      _validateEmail();
      _validatePassword();
      _validateConfirmPassword();
      _validatePhone();

      if (!_isCurrentStepValid()) {
        // Trigger form validation to show errors
        _formKey.currentState?.validate();
        return;
      }
    }

    if (_currentStep < 2) {
      setState(() => _currentStep++);
      _pageController.nextPage(
          duration: const Duration(milliseconds: 300), curve: Curves.easeInOut);
    }
  }

  void _previousStep() {
    if (_currentStep > 0) {
      setState(() => _currentStep--);
      _pageController.previousPage(
          duration: const Duration(milliseconds: 300), curve: Curves.easeInOut);
    }
  }

  // Validate fields (real-time validation - always runs, but only shows error if touched)
  void _validateName() {
    final name = _nameController.text.trim();
    final error = Validators.nameError(name);
    setState(() {
      _nameError = _nameTouched ? error : null;
    });
  }

  void _validateEmail() {
    final email = _emailController.text.trim();
    final error = Validators.emailErrorForRegistration(email);
    setState(() {
      _emailError = _emailTouched ? error : null;
    });
  }

  void _validatePassword() {
    final password = _passwordController.text;
    final error = Validators.passwordStrengthError(password);
    setState(() {
      _passwordError = _passwordTouched ? error : null;
    });
    // Also validate confirm password in real-time if it's been touched
    if (_confirmPasswordTouched) {
      _validateConfirmPassword();
    }
  }

  void _validateConfirmPassword() {
    final password = _passwordController.text;
    final confirmPassword = _confirmPasswordController.text;
    final error = Validators.confirmPasswordError(password, confirmPassword);
    setState(() {
      _confirmPasswordError = _confirmPasswordTouched ? error : null;
    });
  }

  void _validatePhone() {
    final phone = _phoneController.text.trim();
    // Phone is required for account_user (all mobile registrations)
    final error = Validators.phoneError(phone, required: true);
    setState(() {
      _phoneError = _phoneTouched ? error : null;
    });
  }

  // Check if current step is valid
  bool _isCurrentStepValid() {
    if (_currentStep == 0) {
      // Step 1: Role selection
      return _selectedRole != null;
    } else if (_currentStep == 1) {
      // Step 2: Basic info (name, email, password, confirm password, phone)
      // Validate all fields to get current errors
      _validateName();
      _validateEmail();
      _validatePassword();
      _validateConfirmPassword();
      _validatePhone();

      // Form is valid only if all fields have no errors
      return _nameError == null &&
          _emailError == null &&
          _passwordError == null &&
          _confirmPasswordError == null &&
          _phoneError == null;
    } else {
      // Step 3: Additional info (optional fields)
      return true;
    }
  }

  Future<void> _handleRegister() async {
    if (_selectedRole == null) {
      SnackbarWidget.show(context,
          message: 'Please select a role', type: SnackbarType.error);
      return;
    }

    // Mark all fields in step 2 as touched
    setState(() {
      _nameTouched = true;
      _emailTouched = true;
      _passwordTouched = true;
      _confirmPasswordTouched = true;
      _phoneTouched = true;
    });

    // Clear previous backend errors
    setState(() {
      _nameError = null;
      _emailError = null;
      _passwordError = null;
      _confirmPasswordError = null;
      _phoneError = null;
      _institutionIdError = null;
      _gradeError = null;
      _sectionError = null;
      _classCodeError = null; // PHASE D
    });

    // Validate all fields
    _validateName();
    _validateEmail();
    _validatePassword();
    _validateConfirmPassword();
    _validatePhone();

    // Check if form is valid
    if (!_isCurrentStepValid() && _currentStep == 1) {
      // Trigger form validation to show errors
      _formKey.currentState?.validate();
      return;
    }

    try {
      if (_selectedRole == AppConstants.roleStudent) {
        // Student registration - check if QR code was scanned
        if (_scannedQRCode != null) {
          // Navigate to join request screen
          Navigator.of(context).pushReplacement<void, void>(
            MaterialPageRoute<void>(
              builder: (context) => ClassroomJoinRequestScreen(
                qrCode: _scannedQRCode!,
                studentInfo: {
                  'name': _nameController.text.trim(),
                  'email': _emailController.text.trim(),
                  'phone': _phoneController.text.trim(),
                  'parentName': _parentNameController.text.trim(),
                  'parentPhone': _parentPhoneController.text.trim(),
                  'password': _passwordController.text,
                },
              ),
            ),
          );
          return;
        }
      }

      // Standard registration for teachers/parents/students
      // Phone is required for all account_user registrations (mobile app)
      if (!_phoneController.text.trim().isNotEmpty) {
        setState(() {
          _phoneTouched = true;
          _phoneError = 'Phone number is required';
        });
        SnackbarWidget.show(
          context,
          message: 'Phone number is required',
          type: SnackbarType.error,
        );
        return;
      }

      // PHASE D: For students, use classCode if provided, otherwise use scanned QR classId
      String? classCode;
      if (_selectedRole == AppConstants.roleStudent) {
        if (_classCodeController.text.trim().isNotEmpty) {
          classCode = _classCodeController.text.trim();
        } else if (_scannedQRCode != null) {
          // If QR was scanned, we still need classCode - extract from QR or use classId
          // For now, if QR was scanned, we'll use the join request flow
          // But for direct registration, we need classCode
        }
      }

      await ref.read(authProvider.notifier).register(
            name: _nameController.text.trim(),
            email: _emailController.text.trim(),
            password: _passwordController.text,
            role: _selectedRole!,
            phone: _phoneController.text.trim(),
            institutionId: _selectedInstitutionId,
            grade: _selectedGrade,
            classCode: classCode, // PHASE D: Send classCode instead of classId
          );

      // Registration successful - user is already logged in (tokens stored)
      if (mounted) {
        final authState = ref.read(authProvider);
        final user = authState.user;

        if (user != null) {
          // Check if student needs approval
          if (_selectedRole == AppConstants.roleStudent) {
            final approvalStatus = user.approvalStatus ?? 'pending';

            if (approvalStatus == 'pending') {
              // Student needs teacher approval - show approval pending screen
              Navigator.of(context).pushReplacement<void, void>(
                MaterialPageRoute<void>(
                  builder: (context) => ApprovalPendingScreen(
                    studentName: user.name,
                    studentEmail: user.email,
                  ),
                ),
              );
            } else {
              // Student is approved or auto-approved - auto-login and navigate to home
              SnackbarWidget.show(
                context,
                message: 'Registration successful! Welcome to EduSafe.',
                type: SnackbarType.success,
              );

              // Navigate to appropriate home screen based on role
              await Future<void>.delayed(const Duration(milliseconds: 500));
              if (mounted) {
                // Use AppRouter to get the correct home screen for the user
                final homeScreen = AppRouter.getInitialScreen(authState);
                Navigator.of(context).pushAndRemoveUntil(
                  MaterialPageRoute<void>(builder: (_) => homeScreen),
                  (route) => false, // Clear all previous routes
                );
              }
            }
          } else {
            // Teacher/Parent - auto-login and navigate to home
            SnackbarWidget.show(
              context,
              message: 'Registration successful! Welcome to EduSafe.',
              type: SnackbarType.success,
            );

            // Navigate to appropriate home screen based on role
            await Future<void>.delayed(const Duration(milliseconds: 500));
            if (mounted) {
              // Use AppRouter to get the correct home screen for the user
              final homeScreen = AppRouter.getInitialScreen(authState);
              Navigator.of(context).pushAndRemoveUntil(
                MaterialPageRoute<void>(builder: (_) => homeScreen),
                (route) => false, // Clear all previous routes
              );
            }
          }
        }
      }
    } on DioException catch (e) {
      // Handle DioException (API errors)
      if (mounted) {
        final data = e.response?.data as Map<String, dynamic>?;

        // Extract error message
        String message = 'Registration failed';
        if (data != null) {
          message =
              data['message'] as String? ?? data['error'] as String? ?? message;
        }

        // Extract field-specific errors from response
        Map<String, String> fieldErrors = {};
        if (data != null) {
          // Check for errors object with fields
          final errors = data['errors'] as Map<String, dynamic>?;
          if (errors != null) {
            // Check for fields object
            final fields = errors['fields'] as Map<String, dynamic>?;
            if (fields != null) {
              fields.forEach((key, value) {
                if (value is String) {
                  fieldErrors[key] = value;
                }
              });
            }
            // Also check for details array (express-validator format)
            final details = errors['details'] as List?;
            if (details != null) {
              for (var detail in details) {
                if (detail is Map<String, dynamic>) {
                  final param =
                      detail['param'] as String? ?? detail['path'] as String?;
                  final msg = detail['msg'] as String?;
                  if (param != null && msg != null) {
                    fieldErrors[param] = msg;
                  }
                }
              }
            }
          }
        }

        // Update field errors
        setState(() {
          _nameError = fieldErrors['name'];
          _emailError = fieldErrors['email'];
          _passwordError = fieldErrors['password'];
          _phoneError = fieldErrors['phone'];
          _institutionIdError = fieldErrors['institutionId'];
          _gradeError = fieldErrors['grade'];
          _sectionError = fieldErrors['section'];
          _classCodeError = fieldErrors['classCode']; // PHASE D
        });

        // Show general error message if no field-specific errors
        if (_nameError == null &&
            _emailError == null &&
            _passwordError == null &&
            _phoneError == null &&
            _institutionIdError == null &&
            _gradeError == null &&
            _sectionError == null) {
          SnackbarWidget.show(
            context,
            message: message,
            type: SnackbarType.error,
          );
        }
      }
    } catch (e, stack) {
      // Fallback for unexpected errors
      if (mounted) {
        print('Registration error: $e');
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
          child: Column(
            children: [
              // Progress Indicator
              Padding(
                padding: AppSpacing.screenEdge,
                child: Row(
                  children: List.generate(3, (index) {
                    return Expanded(
                      child: Container(
                        height: 4,
                        margin: EdgeInsets.only(right: index < 2 ? 8 : 0),
                        decoration: BoxDecoration(
                          color: index <= _currentStep
                              ? AppColors.primaryGreen
                              : AppColors.divider,
                          borderRadius: BorderRadius.circular(2),
                        ),
                      )
                          .animate()
                          .fadeIn(delay: (index * 100).ms)
                          .scale(delay: (index * 100).ms),
                    );
                  }),
                ),
              ),

              // Page View
              Expanded(
                child: PageView(
                  controller: _pageController,
                  physics: const NeverScrollableScrollPhysics(),
                  children: [
                    _buildRoleSelectionStep(),
                    Form(
                      key: _formKey,
                      child: _buildBasicInfoStep(),
                    ),
                    _buildAdditionalInfoStep(),
                  ],
                ),
              ),

              // Navigation Buttons
              Padding(
                padding: AppSpacing.screenEdge,
                child: Row(
                  children: [
                    if (_currentStep > 0)
                      Expanded(
                        child: OutlinedButtonCustom(
                          label: 'Back',
                          onPressed: _previousStep,
                          icon: Icons.arrow_back,
                        ),
                      ),
                    if (_currentStep > 0) const SizedBox(width: AppSpacing.md),
                    Expanded(
                      flex: 2,
                      child: PrimaryButton(
                        label: _currentStep == 2 ? 'Register' : 'Continue',
                        onPressed: (authState.isLoading ||
                                (_currentStep == 1 && !_isCurrentStepValid()))
                            ? null
                            : (_currentStep == 2 ? _handleRegister : _nextStep),
                        isLoading: authState.isLoading,
                        icon: _currentStep == 2
                            ? Icons.check
                            : Icons.arrow_forward,
                      ),
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

  Widget _buildRoleSelectionStep() {
    return SingleChildScrollView(
      padding: AppSpacing.screenEdge,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          SizedBox(height: MediaQuery.of(context).size.height * 0.05),

          // Title
          Text(
            'Choose Your Role',
            style: AppTextStyles.h1.copyWith(
              color: AppColors.primaryGreen,
              fontWeight: FontWeight.bold,
            ),
            textAlign: TextAlign.center,
          )
              .animate()
              .fadeIn(duration: 600.ms)
              .slideY(begin: -0.2, end: 0, duration: 600.ms),

          SizedBox(height: AppSpacing.md),

          Text(
            'Select how you will use EduSafe',
            style: AppTextStyles.bodyMedium.copyWith(
              color: AppColors.textSecondary,
            ),
            textAlign: TextAlign.center,
          ).animate().fadeIn(delay: 200.ms, duration: 600.ms),

          SizedBox(height: AppSpacing.xxl * 1.5),

          // Role Cards
          _buildRoleCard(
            role: AppConstants.roleStudent,
            title: 'Student',
            description:
                'Join your classroom and learn about disaster preparedness',
            icon: Icons.school_outlined,
            color: AppColors.primaryGreen,
            delay: 300.ms,
          ),

          SizedBox(height: AppSpacing.lg),

          _buildRoleCard(
            role: AppConstants.roleTeacher,
            title: 'Teacher',
            description: 'Manage your classes and conduct drills',
            icon: Icons.person_outline,
            color: AppColors.accentBlue,
            delay: 400.ms,
          ),

          SizedBox(height: AppSpacing.lg),

          _buildRoleCard(
            role: AppConstants.roleParent,
            title: 'Parent',
            description: 'Monitor your child\'s progress and safety',
            icon: Icons.family_restroom,
            color: AppColors.accentBlue,
            delay: 500.ms,
          ),
        ],
      ),
    );
  }

  Widget _buildRoleCard({
    required String role,
    required String title,
    required String description,
    required IconData icon,
    required Color color,
    required Duration delay,
  }) {
    final isSelected = _selectedRole == role;

    return GestureDetector(
      onTap: () {
        setState(() => _selectedRole = role);
      },
      child: Container(
        padding: const EdgeInsets.all(AppSpacing.xl),
        decoration: BoxDecoration(
          color: isSelected
              ? color.withOpacity(0.1)
              : Colors.white.withOpacity(0.9),
          borderRadius: BorderRadius.circular(AppBorders.radiusXl),
          border: Border.all(
            color: isSelected ? color : Colors.white.withOpacity(0.3),
            width: isSelected ? 2.5 : 1.5,
          ),
          boxShadow: [
            BoxShadow(
              color: isSelected
                  ? color.withOpacity(0.2)
                  : Colors.black.withOpacity(0.05),
              blurRadius: isSelected ? 20 : 10,
              spreadRadius: isSelected ? 2 : 0,
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(AppSpacing.lg),
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                borderRadius: BorderRadius.circular(AppBorders.radiusLg),
              ),
              child: Icon(icon, color: color, size: 32),
            ),
            const SizedBox(width: AppSpacing.lg),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: AppTextStyles.h3.copyWith(
                      color: isSelected ? color : AppColors.textPrimary,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  SizedBox(height: AppSpacing.xs),
                  Text(
                    description,
                    style: AppTextStyles.bodySmall.copyWith(
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
            if (isSelected)
              Icon(Icons.check_circle, color: color, size: 28)
                  .animate()
                  .scale(delay: 100.ms)
                  .fadeIn(delay: 100.ms),
          ],
        ),
      )
          .animate()
          .fadeIn(delay: delay, duration: 500.ms)
          .slideX(begin: -0.1, end: 0, delay: delay, duration: 500.ms),
    );
  }

  Widget _buildBasicInfoStep() {
    return SingleChildScrollView(
      padding: AppSpacing.screenEdge,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          SizedBox(height: MediaQuery.of(context).size.height * 0.05),

          Text(
            'Basic Information',
            style: AppTextStyles.h1.copyWith(
              color: AppColors.primaryGreen,
              fontWeight: FontWeight.bold,
            ),
            textAlign: TextAlign.center,
          ).animate().fadeIn(duration: 600.ms),

          SizedBox(height: AppSpacing.xxl),

          // Name Field
          TextInputCustom(
            label: 'Full Name',
            hint: 'Enter your full name',
            controller: _nameController,
            leadingIcon: Icons.person_outline,
            required: true,
            errorText: _nameError,
            onChanged: (value) {
              // Real-time validation: validate immediately when user types
              _validateName();
            },
            onEditingComplete: () {
              // Mark as touched on blur
              setState(() {
                _nameTouched = true;
              });
              _validateName();
            },
            validator: (value) {
              // Return error if field is touched and has error
              if (_nameTouched && _nameError != null) {
                return _nameError;
              }
              return null;
            },
          )
              .animate()
              .fadeIn(delay: 200.ms, duration: 500.ms)
              .slideX(begin: -0.1, end: 0, delay: 200.ms, duration: 500.ms),

          SizedBox(height: AppSpacing.lg),

          // Email Field
          TextInputCustom(
            label: 'Email',
            hint: 'example@gmail.com',
            controller: _emailController,
            keyboardType: TextInputType.emailAddress,
            leadingIcon: Icons.email_outlined,
            required: true,
            errorText: _emailError,
            onChanged: (value) {
              // Real-time validation: validate immediately when user types
              _validateEmail();
            },
            onEditingComplete: () {
              // Mark as touched on blur
              setState(() {
                _emailTouched = true;
              });
              _validateEmail();
            },
            validator: (value) {
              // Return error if field is touched and has error
              if (_emailTouched && _emailError != null) {
                return _emailError;
              }
              return null;
            },
          )
              .animate()
              .fadeIn(delay: 300.ms, duration: 500.ms)
              .slideX(begin: -0.1, end: 0, delay: 300.ms, duration: 500.ms),

          SizedBox(height: AppSpacing.lg),

          // Password Field
          PasswordInputCustom(
            label: 'Password',
            hint: 'Create a password',
            controller: _passwordController,
            required: true,
            errorText: _passwordError,
            onChanged: (value) {
              // Real-time validation: validate immediately when user types
              _validatePassword();
              // Also validate confirm password in real-time if it's been touched
              if (_confirmPasswordTouched) {
                _validateConfirmPassword();
              }
            },
            onEditingComplete: () {
              // Mark as touched on blur
              setState(() {
                _passwordTouched = true;
              });
              _validatePassword();
            },
            validator: (value) {
              // Return error if field is touched and has error
              if (_passwordTouched && _passwordError != null) {
                return _passwordError;
              }
              return null;
            },
          )
              .animate()
              .fadeIn(delay: 400.ms, duration: 500.ms)
              .slideX(begin: -0.1, end: 0, delay: 400.ms, duration: 500.ms),

          SizedBox(height: AppSpacing.lg),

          // Confirm Password Field
          PasswordInputCustom(
            label: 'Confirm Password',
            hint: 'Re-enter your password',
            controller: _confirmPasswordController,
            required: true,
            errorText: _confirmPasswordError,
            onChanged: (value) {
              // Real-time validation: validate immediately when user types
              _validateConfirmPassword();
            },
            onEditingComplete: () {
              // Mark as touched on blur
              setState(() {
                _confirmPasswordTouched = true;
              });
              _validateConfirmPassword();
            },
            validator: (value) {
              // Return error if field is touched and has error
              if (_confirmPasswordTouched && _confirmPasswordError != null) {
                return _confirmPasswordError;
              }
              return null;
            },
          )
              .animate()
              .fadeIn(delay: 500.ms, duration: 500.ms)
              .slideX(begin: -0.1, end: 0, delay: 500.ms, duration: 500.ms),

          SizedBox(height: AppSpacing.lg),

          // Phone Number Field (Required for account_user)
          TextInputCustom(
            label: 'Phone Number',
            hint: 'Enter your 10-digit phone number',
            controller: _phoneController,
            keyboardType: TextInputType.phone,
            leadingIcon: Icons.phone_outlined,
            required: true,
            errorText: _phoneError,
            onChanged: (value) {
              // Real-time validation: validate immediately when user types
              _validatePhone();
            },
            onEditingComplete: () {
              // Mark as touched on blur
              setState(() {
                _phoneTouched = true;
              });
              _validatePhone();
            },
            validator: (value) {
              // Return error if field is touched and has error
              if (_phoneTouched && _phoneError != null) {
                return _phoneError;
              }
              return null;
            },
          )
              .animate()
              .fadeIn(delay: 600.ms, duration: 500.ms)
              .slideX(begin: -0.1, end: 0, delay: 600.ms, duration: 500.ms),

          // Student-specific: Classroom QR Scan
          if (_selectedRole == AppConstants.roleStudent) ...[
            SizedBox(height: AppSpacing.xl),
            Divider(color: AppColors.divider),
            SizedBox(height: AppSpacing.lg),
            Text(
              'Join Your Classroom',
              style: AppTextStyles.h3,
              textAlign: TextAlign.center,
            ),
            SizedBox(height: AppSpacing.md),
            Text(
              'Scan the QR code provided by your teacher to join your classroom',
              style: AppTextStyles.bodySmall.copyWith(
                color: AppColors.textSecondary,
              ),
              textAlign: TextAlign.center,
            ),
            SizedBox(height: AppSpacing.lg),
            Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    AppColors.primaryGreen.withOpacity(0.1),
                    AppColors.primaryGreenSubtle.withOpacity(0.05),
                  ],
                ),
                borderRadius: BorderRadius.circular(AppBorders.radiusLg),
                border: Border.all(
                  color: AppColors.primaryGreen.withOpacity(0.3),
                  width: 1.5,
                ),
              ),
              child: OutlinedButtonCustom(
                label: _scannedQRCode != null
                    ? 'QR Code Scanned ✓'
                    : 'Scan Classroom QR Code',
                onPressed: () async {
                  final result = await Navigator.of(context).push<String>(
                    MaterialPageRoute<String>(
                      builder: (context) => const QRScannerScreen(
                        title: 'Scan Classroom QR',
                      ),
                    ),
                  );
                  if (result != null) {
                    // REQUIREMENT: Parse JSON QR code to extract classId
                    try {
                      final parsedQR =
                          jsonDecode(result) as Map<String, dynamic>;
                      if (parsedQR['type'] == 'classroom_join' &&
                          parsedQR['classId'] != null) {
                        // Auto-fill classId from QR code
                        setState(() {
                          _scannedQRCode = result;
                          _selectedClassId = parsedQR['classId'] as String?;
                        });
                      } else {
                        setState(() => _scannedQRCode = result);
                      }
                    } catch (e) {
                      // Not JSON, store as-is (backward compatibility)
                      setState(() => _scannedQRCode = result);
                    }
                  }
                },
                icon: Icons.qr_code_scanner_rounded,
                fullWidth: true,
              ),
            )
                .animate()
                .fadeIn(delay: 600.ms, duration: 500.ms)
                .scale(delay: 600.ms, duration: 500.ms),
            SizedBox(height: AppSpacing.lg),
            Text(
              'OR',
              style: AppTextStyles.bodyMedium.copyWith(
                color: AppColors.textSecondary,
              ),
              textAlign: TextAlign.center,
            ),
            SizedBox(height: AppSpacing.lg),
            // PHASE D: Class Code input field (OPTIONAL - students can join class later)
            TextInputCustom(
              label: 'Class Code (Optional)',
              hint: 'Enter class code to join now, or join later',
              controller: _classCodeController,
              leadingIcon: Icons.class_outlined,
              required: false, // Made optional - students can join class later
              errorText: _classCodeError,
              onChanged: (value) {
                setState(() {
                  _classCodeError = null;
                });
              },
              validator: (value) {
                if (_classCodeError != null) {
                  return _classCodeError;
                }
                return null;
              },
            )
                .animate()
                .fadeIn(delay: 700.ms, duration: 500.ms)
                .slideX(begin: -0.1, end: 0, delay: 700.ms, duration: 500.ms),
          ],
        ],
      ),
    );
  }

  Widget _buildAdditionalInfoStep() {
    return SingleChildScrollView(
      padding: AppSpacing.screenEdge,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          SizedBox(height: MediaQuery.of(context).size.height * 0.05),

          Text(
            'Additional Information',
            style: AppTextStyles.h1.copyWith(
              color: AppColors.primaryGreen,
              fontWeight: FontWeight.bold,
            ),
            textAlign: TextAlign.center,
          ).animate().fadeIn(duration: 600.ms),

          SizedBox(height: AppSpacing.xxl),

          // School Selection (for teachers/parents)
          if (_selectedRole != AppConstants.roleStudent) ...[
            DropdownInputCustom(
              label: 'School/Institution',
              value: _selectedInstitutionId,
              items: _schools.map((school) {
                return DropdownMenuItem<String>(
                  value: school['_id']?.toString(),
                  child: Text(school['name']?.toString() ?? 'Unknown'),
                );
              }).toList(),
              onChanged: (value) {
                setState(() => _selectedInstitutionId = value);
              },
              required: true,
            ).animate().fadeIn(delay: 200.ms, duration: 500.ms),
            SizedBox(height: AppSpacing.lg),
          ],

          // Phone is now required and moved to step 2 (Basic Info)
          // This section is for additional optional info only

          // Parent Info (for students)
          if (_selectedRole == AppConstants.roleStudent) ...[
            SizedBox(height: AppSpacing.lg),
            Text(
              'Parent/Guardian Information (Optional)',
              style: AppTextStyles.h4,
            ),
            SizedBox(height: AppSpacing.md),
            TextInputCustom(
              label: 'Parent Name',
              hint: 'Enter parent/guardian name',
              controller: _parentNameController,
              leadingIcon: Icons.person_outline,
            ).animate().fadeIn(delay: 400.ms, duration: 500.ms),
            SizedBox(height: AppSpacing.lg),
            TextInputCustom(
              label: 'Parent Phone',
              hint: 'Enter parent/guardian phone',
              controller: _parentPhoneController,
              keyboardType: TextInputType.phone,
              leadingIcon: Icons.phone_outlined,
            ).animate().fadeIn(delay: 500.ms, duration: 500.ms),
          ],
        ],
      ),
    );
  }
}
