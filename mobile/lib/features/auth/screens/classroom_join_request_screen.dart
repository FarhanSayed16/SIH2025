/// RBAC Refinement: Classroom Join Request Screen
/// Shows join request form and pending status after scanning classroom QR

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/widgets/widgets.dart';
import '../../../core/design/design_system.dart';
import '../../../core/services/api_service.dart';
import '../../../core/constants/api_endpoints.dart';
import 'approval_pending_screen.dart';

class ClassroomJoinRequestScreen extends ConsumerStatefulWidget {
  final String qrCode;
  final Map<String, dynamic> studentInfo;

  const ClassroomJoinRequestScreen({
    super.key,
    required this.qrCode,
    required this.studentInfo,
  });

  @override
  ConsumerState<ClassroomJoinRequestScreen> createState() =>
      _ClassroomJoinRequestScreenState();
}

class _ClassroomJoinRequestScreenState
    extends ConsumerState<ClassroomJoinRequestScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _isSubmitting = false;

  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _parentNameController = TextEditingController();
  final _parentPhoneController = TextEditingController();

  @override
  void initState() {
    super.initState();
    // Pre-fill from student info
    _nameController.text = (widget.studentInfo['name'] as String?) ?? '';
    _emailController.text = (widget.studentInfo['email'] as String?) ?? '';
    _phoneController.text = (widget.studentInfo['phone'] as String?) ?? '';
    _parentNameController.text =
        (widget.studentInfo['parentName'] as String?) ?? '';
    _parentPhoneController.text =
        (widget.studentInfo['parentPhone'] as String?) ?? '';
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _parentNameController.dispose();
    _parentPhoneController.dispose();
    super.dispose();
  }

  Future<void> _submitJoinRequest() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      final apiService = ApiService();
      final response = await apiService.post(
        ApiEndpoints.classroomJoinScan,
        data: {
          'qrCode': widget.qrCode,
          'studentInfo': {
            'name': _nameController.text.trim(),
            'email': _emailController.text.trim(),
            'phone': _phoneController.text.trim(),
            'parentName': _parentNameController.text.trim(),
            'parentPhone': _parentPhoneController.text.trim(),
            'password': widget.studentInfo['password'],
          },
        },
      );

      final data = response.data as Map<String, dynamic>;
      final requestId = data['data']?['requestId'] as String?;

      if (mounted && requestId != null) {
        // Navigate to approval pending screen
        Navigator.of(context).pushReplacement<void, void>(
          MaterialPageRoute<void>(
            builder: (context) => ApprovalPendingScreen(
              requestId: requestId,
              studentName: _nameController.text.trim(),
            ),
          ),
        );
      }
    } catch (e) {
      setState(() => _isSubmitting = false);
      if (mounted) {
        SnackbarWidget.show(
          context,
          message: e.toString().replaceAll('Exception: ', ''),
          type: SnackbarType.error,
        );
      }
    }
  }

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
            ],
          ),
        ),
        child: SafeArea(
          child: SingleChildScrollView(
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
                      Icons.class_outlined,
                      size: 64,
                      color: AppColors.primaryGreen,
                    ),
                  )
                      .animate()
                      .scale(delay: 100.ms, duration: 600.ms)
                      .fadeIn(delay: 100.ms, duration: 600.ms),

                  SizedBox(height: AppSpacing.lg),

                  Text(
                    'Join Classroom',
                    style: AppTextStyles.h1.copyWith(
                      color: AppColors.primaryGreen,
                      fontWeight: FontWeight.bold,
                    ),
                    textAlign: TextAlign.center,
                  ).animate().fadeIn(delay: 300.ms, duration: 600.ms),

                  SizedBox(height: AppSpacing.md),

                  Text(
                    'Complete your information to request joining the classroom',
                    style: AppTextStyles.bodyMedium.copyWith(
                      color: AppColors.textSecondary,
                    ),
                    textAlign: TextAlign.center,
                  ).animate().fadeIn(delay: 500.ms, duration: 600.ms),

                  SizedBox(height: AppSpacing.xxl),

                  // Glassmorphic Form Card
                  Container(
                    padding: const EdgeInsets.all(AppSpacing.xl),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.9),
                      borderRadius: BorderRadius.circular(AppBorders.radiusXl),
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
                        TextInputCustom(
                          label: 'Full Name',
                          hint: 'Enter your full name',
                          controller: _nameController,
                          leadingIcon: Icons.person_outline,
                          required: true,
                          validator: (value) => value?.isEmpty ?? true
                              ? 'Name is required'
                              : null,
                        ),
                        SizedBox(height: AppSpacing.lg),
                        TextInputCustom(
                          label: 'Email',
                          hint: 'Enter your email',
                          controller: _emailController,
                          keyboardType: TextInputType.emailAddress,
                          leadingIcon: Icons.email_outlined,
                          required: true,
                          validator: (value) {
                            if (value?.isEmpty ?? true)
                              return 'Email is required';
                            if (!value!.contains('@'))
                              return 'Invalid email format';
                            return null;
                          },
                        ),
                        SizedBox(height: AppSpacing.lg),
                        TextInputCustom(
                          label: 'Phone (Optional)',
                          hint: 'Enter your phone number',
                          controller: _phoneController,
                          keyboardType: TextInputType.phone,
                          leadingIcon: Icons.phone_outlined,
                        ),
                        SizedBox(height: AppSpacing.xl),
                        Divider(color: AppColors.divider),
                        SizedBox(height: AppSpacing.lg),
                        Text(
                          'Parent/Guardian Information',
                          style: AppTextStyles.h4,
                        ),
                        SizedBox(height: AppSpacing.md),
                        TextInputCustom(
                          label: 'Parent Name (Optional)',
                          hint: 'Enter parent/guardian name',
                          controller: _parentNameController,
                          leadingIcon: Icons.person_outline,
                        ),
                        SizedBox(height: AppSpacing.lg),
                        TextInputCustom(
                          label: 'Parent Phone (Optional)',
                          hint: 'Enter parent/guardian phone',
                          controller: _parentPhoneController,
                          keyboardType: TextInputType.phone,
                          leadingIcon: Icons.phone_outlined,
                        ),
                      ],
                    ),
                  ).animate().fadeIn(delay: 700.ms, duration: 800.ms).slideY(
                      begin: 0.2, end: 0, delay: 700.ms, duration: 800.ms),

                  SizedBox(height: AppSpacing.xl),

                  PrimaryButton(
                    label: 'Submit Join Request',
                    onPressed: _isSubmitting ? null : _submitJoinRequest,
                    isLoading: _isSubmitting,
                    fullWidth: true,
                    size: ButtonSize.large,
                    icon: Icons.send_outlined,
                  )
                      .animate()
                      .fadeIn(delay: 900.ms, duration: 500.ms)
                      .scale(delay: 900.ms, duration: 500.ms),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
