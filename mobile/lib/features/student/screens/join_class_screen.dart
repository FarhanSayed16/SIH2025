/// Student Join Class Screen
/// Allows students to join a class using a class code

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/widgets/widgets.dart';
import '../../../core/design/design_system.dart';
import '../../qr/screens/qr_scanner_screen.dart';
import '../services/student_service.dart';
import '../../../core/providers/api_service_provider.dart';

class JoinClassScreen extends ConsumerStatefulWidget {
  const JoinClassScreen({super.key});

  @override
  ConsumerState<JoinClassScreen> createState() => _JoinClassScreenState();
}

class _JoinClassScreenState extends ConsumerState<JoinClassScreen> {
  final _formKey = GlobalKey<FormState>();
  final _classCodeController = TextEditingController();
  late final StudentService _studentService;

  bool _isLoading = false;
  String? _error;
  String? _success;
  Map<String, dynamic>? _currentClassInfo;

  @override
  void initState() {
    super.initState();
    // Use shared ApiService from provider to ensure token is available
    final apiService = ref.read(apiServiceProvider);
    _studentService = StudentService(apiService: apiService);
    _loadCurrentClassInfo();
  }

  @override
  void dispose() {
    _classCodeController.dispose();
    super.dispose();
  }

  Future<void> _loadCurrentClassInfo() async {
    try {
      final response = await _studentService.getStudentClassInfo();
      if (response['success'] == true && response['data'] != null) {
        final userData = response['data']['user'] ?? response['data'];
        setState(() {
          _currentClassInfo = {
            'classId': userData['classId'] as String?,
            'grade': userData['grade'] as String?,
            'section': userData['section'] as String?,
            'approvalStatus': userData['approvalStatus'] as String?,
          };
        });
      }
    } catch (e) {
      // Silently fail - user might not have a class yet
      print('Error loading class info: $e');
    }
  }

  Future<void> _handleScanQR() async {
    final qrCode = await Navigator.push<String>(
      context,
      MaterialPageRoute(
        builder: (context) => const QRScannerScreen(
          title: 'Scan Class QR Code',
          isClassroomMode: true,
        ),
      ),
    );

    if (qrCode != null && mounted) {
      await _handleJoinClassByQR(qrCode);
    }
  }

  Future<void> _handleJoinClassByQR(String qrCode) async {
    setState(() {
      _isLoading = true;
      _error = null;
      _success = null;
    });

    try {
      // Parse QR code to extract classId
      final classId = _studentService.parseClassQRCode(qrCode);
      if (classId == null) {
        setState(() {
          _error = 'Invalid QR code format. Please scan a valid class QR code.';
        });
        return;
      }

      // Join class using classId
      final response = await _studentService.joinClassByQR(classId);

      if (response['success'] == true) {
        setState(() {
          _success = (response['message'] as String?) ??
              'Join request sent successfully!';
        });

        // Reload class info
        await _loadCurrentClassInfo();

        // Clear success message after 5 seconds
        Future.delayed(const Duration(seconds: 5), () {
          if (mounted) {
            setState(() {
              _success = null;
            });
          }
        });
      } else {
        setState(() {
          _error = (response['message'] as String?) ?? 'Failed to join class';
        });
      }
    } catch (e) {
      setState(() {
        _error = e.toString().replaceAll('Exception: ', '');
      });
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _handleJoinClass() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() {
      _isLoading = true;
      _error = null;
      _success = null;
    });

    try {
      final response = await _studentService.joinClass(
        _classCodeController.text.trim(),
      );

      if (response['success'] == true) {
        setState(() {
          _success = (response['message'] as String?) ??
              'Join request sent successfully!';
          _classCodeController.clear();
        });

        // Reload class info
        await _loadCurrentClassInfo();

        // Clear success message after 5 seconds
        Future.delayed(const Duration(seconds: 5), () {
          if (mounted) {
            setState(() {
              _success = null;
            });
          }
        });
      } else {
        setState(() {
          _error = (response['message'] as String?) ?? 'Failed to join class';
        });
      }
    } catch (e) {
      setState(() {
        _error = e.toString().replaceAll('Exception: ', '');
      });
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _handleLeaveClass() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Leave Class'),
        content: const Text('Are you sure you want to leave this class?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Leave', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    setState(() {
      _isLoading = true;
      _error = null;
      _success = null;
    });

    try {
      final response = await _studentService.leaveClass();

      if (response['success'] == true) {
        setState(() {
          _success =
              (response['message'] as String?) ?? 'Successfully left the class';
          _currentClassInfo = null;
        });

        // Reload class info
        await _loadCurrentClassInfo();

        // Clear success message after 5 seconds
        Future.delayed(const Duration(seconds: 5), () {
          if (mounted) {
            setState(() {
              _success = null;
            });
          }
        });
      } else {
        setState(() {
          _error = (response['message'] as String?) ?? 'Failed to leave class';
        });
      }
    } catch (e) {
      setState(() {
        _error = e.toString().replaceAll('Exception: ', '');
      });
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  Widget _buildApprovalStatusBadge(String? status) {
    switch (status) {
      case 'approved':
        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: AppColors.success.withOpacity(0.1),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.check_circle, color: AppColors.success, size: 16),
              const SizedBox(width: 4),
              Text(
                'Approved',
                style: AppTextStyles.bodySmall.copyWith(
                  color: AppColors.success,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        );
      case 'pending':
        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: AppColors.warning.withOpacity(0.1),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.access_time, color: AppColors.warning, size: 16),
              const SizedBox(width: 4),
              Text(
                'Pending Approval',
                style: AppTextStyles.bodySmall.copyWith(
                  color: AppColors.warning,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        );
      case 'rejected':
        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: AppColors.error.withOpacity(0.1),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.cancel, color: AppColors.error, size: 16),
              const SizedBox(width: 4),
              Text(
                'Rejected',
                style: AppTextStyles.bodySmall.copyWith(
                  color: AppColors.error,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        );
      default:
        return const SizedBox.shrink();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Join a Class'),
        backgroundColor: AppColors.primaryGreen,
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: AppSpacing.screenEdge,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            SizedBox(height: AppSpacing.lg),

            // Current Class Status
            if (_currentClassInfo?['classId'] != null) ...[
              Card(
                elevation: 2,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(AppBorders.radiusLg),
                ),
                child: Padding(
                  padding: AppSpacing.card,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Current Class',
                            style: AppTextStyles.h3,
                          ),
                          if (_currentClassInfo?['approvalStatus'] ==
                              'approved')
                            TextButton(
                              onPressed: _isLoading ? null : _handleLeaveClass,
                              child: Text(
                                'Leave Class',
                                style: TextStyle(color: AppColors.error),
                              ),
                            ),
                        ],
                      ),
                      SizedBox(height: AppSpacing.sm),
                      Text(
                        'Grade ${_currentClassInfo?['grade'] ?? 'N/A'} - Section ${_currentClassInfo?['section'] ?? 'N/A'}',
                        style: AppTextStyles.bodyMedium.copyWith(
                          color: AppColors.textSecondary,
                        ),
                      ),
                      SizedBox(height: AppSpacing.sm),
                      _buildApprovalStatusBadge(
                          _currentClassInfo?['approvalStatus'] as String?),
                      if (_currentClassInfo?['approvalStatus'] ==
                          'pending') ...[
                        SizedBox(height: AppSpacing.md),
                        Container(
                          padding: AppSpacing.card,
                          decoration: BoxDecoration(
                            color: AppColors.warning.withOpacity(0.1),
                            borderRadius:
                                BorderRadius.circular(AppBorders.radiusMd),
                          ),
                          child: Row(
                            children: [
                              Icon(Icons.info_outline,
                                  color: AppColors.warning, size: 20),
                              SizedBox(width: AppSpacing.sm),
                              Expanded(
                                child: Text(
                                  'Your join request is pending approval from your teacher. You\'ll be notified once approved.',
                                  style: AppTextStyles.bodySmall.copyWith(
                                    color: AppColors.warning,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
              SizedBox(height: AppSpacing.xl),
            ],

            // Join Class Form
            if (_currentClassInfo?['classId'] == null) ...[
              Text(
                'Join a Class',
                style: AppTextStyles.h2.copyWith(
                  color: AppColors.primaryGreen,
                ),
              )
                  .animate()
                  .fadeIn(duration: 400.ms)
                  .slideY(begin: -0.1, end: 0, duration: 500.ms),
              SizedBox(height: AppSpacing.sm),
              Text(
                'You can join a class using either a class code or by scanning a QR code.',
                style: AppTextStyles.bodyMedium.copyWith(
                  color: AppColors.textSecondary,
                ),
              ),
              SizedBox(height: AppSpacing.xl),

              // Join Method Selection Tabs
              Row(
                children: [
                  Expanded(
                    child: Card(
                      elevation: 2,
                      shape: RoundedRectangleBorder(
                        borderRadius:
                            BorderRadius.circular(AppBorders.radiusMd),
                        side: BorderSide(
                          color: AppColors.primaryGreen.withOpacity(0.3),
                          width: 2,
                        ),
                      ),
                      child: InkWell(
                        onTap: () {
                          // Focus on class code input
                          FocusScope.of(context).requestFocus(FocusNode());
                        },
                        borderRadius:
                            BorderRadius.circular(AppBorders.radiusMd),
                        child: Padding(
                          padding: AppSpacing.card,
                          child: Column(
                            children: [
                              Icon(Icons.text_fields,
                                  color: AppColors.primaryGreen, size: 32),
                              SizedBox(height: AppSpacing.sm),
                              Text(
                                'Enter Code',
                                style: AppTextStyles.h5.copyWith(
                                  color: AppColors.primaryGreen,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              SizedBox(height: AppSpacing.xs),
                              Text(
                                'Manual entry',
                                style: AppTextStyles.bodySmall.copyWith(
                                  color: AppColors.textSecondary,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                  SizedBox(width: AppSpacing.md),
                  Expanded(
                    child: Card(
                      elevation: 2,
                      shape: RoundedRectangleBorder(
                        borderRadius:
                            BorderRadius.circular(AppBorders.radiusMd),
                        side: BorderSide(
                          color: AppColors.primaryGreen.withOpacity(0.3),
                          width: 2,
                        ),
                      ),
                      child: InkWell(
                        onTap: _isLoading ? null : _handleScanQR,
                        borderRadius:
                            BorderRadius.circular(AppBorders.radiusMd),
                        child: Padding(
                          padding: AppSpacing.card,
                          child: Column(
                            children: [
                              Icon(Icons.qr_code_scanner,
                                  color: AppColors.primaryGreen, size: 32),
                              SizedBox(height: AppSpacing.sm),
                              Text(
                                'Scan QR',
                                style: AppTextStyles.h5.copyWith(
                                  color: AppColors.primaryGreen,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              SizedBox(height: AppSpacing.xs),
                              Text(
                                'Quick scan',
                                style: AppTextStyles.bodySmall.copyWith(
                                  color: AppColors.textSecondary,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              )
                  .animate()
                  .fadeIn(delay: 50.ms, duration: 400.ms)
                  .slideY(begin: 0.1, end: 0, delay: 50.ms, duration: 500.ms),

              SizedBox(height: AppSpacing.xl),

              // Divider with "OR"
              Row(
                children: [
                  Expanded(
                      child: Divider(
                          color: AppColors.textSecondary.withOpacity(0.3))),
                  Padding(
                    padding: EdgeInsets.symmetric(horizontal: AppSpacing.md),
                    child: Text(
                      'OR',
                      style: AppTextStyles.bodySmall.copyWith(
                        color: AppColors.textSecondary,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  Expanded(
                      child: Divider(
                          color: AppColors.textSecondary.withOpacity(0.3))),
                ],
              ),

              SizedBox(height: AppSpacing.xl),

              Text(
                'Enter Class Code Manually',
                style: AppTextStyles.h3.copyWith(
                  color: AppColors.primaryGreen,
                ),
              ).animate().fadeIn(delay: 100.ms, duration: 400.ms),
              SizedBox(height: AppSpacing.sm),
              Text(
                'Ask your teacher for the class code if QR scanning doesn\'t work.',
                style: AppTextStyles.bodyMedium.copyWith(
                  color: AppColors.textSecondary,
                ),
              ),
              SizedBox(height: AppSpacing.lg),

              Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    TextInputCustom(
                      label: 'Class Code',
                      hint: 'Enter class code (e.g., 10A)',
                      controller: _classCodeController,
                      leadingIcon: Icons.class_outlined,
                      required: true,
                      validator: (value) {
                        if (value == null || value.trim().isEmpty) {
                          return 'Please enter a class code';
                        }
                        return null;
                      },
                    ).animate().fadeIn(delay: 100.ms, duration: 400.ms).slideX(
                        begin: -0.1, end: 0, delay: 100.ms, duration: 500.ms),

                    SizedBox(height: AppSpacing.lg),

                    if (_error != null)
                      Container(
                        padding: AppSpacing.card,
                        margin: EdgeInsets.only(bottom: AppSpacing.md),
                        decoration: BoxDecoration(
                          color: AppColors.error.withOpacity(0.1),
                          borderRadius:
                              BorderRadius.circular(AppBorders.radiusMd),
                          border: Border.all(
                              color: AppColors.error.withOpacity(0.3)),
                        ),
                        child: Row(
                          children: [
                            Icon(Icons.error_outline,
                                color: AppColors.error, size: 20),
                            SizedBox(width: AppSpacing.sm),
                            Expanded(
                              child: Text(
                                _error!,
                                style: AppTextStyles.bodySmall.copyWith(
                                  color: AppColors.error,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ).animate().fadeIn().shake(),

                    if (_success != null)
                      Container(
                        padding: AppSpacing.card,
                        margin: EdgeInsets.only(bottom: AppSpacing.md),
                        decoration: BoxDecoration(
                          color: AppColors.success.withOpacity(0.1),
                          borderRadius:
                              BorderRadius.circular(AppBorders.radiusMd),
                          border: Border.all(
                              color: AppColors.success.withOpacity(0.3)),
                        ),
                        child: Row(
                          children: [
                            Icon(Icons.check_circle,
                                color: AppColors.success, size: 20),
                            SizedBox(width: AppSpacing.sm),
                            Expanded(
                              child: Text(
                                _success!,
                                style: AppTextStyles.bodySmall.copyWith(
                                  color: AppColors.success,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ).animate().fadeIn().scale(),

                    // Join Class Button
                    PrimaryButton(
                      label: 'Join Class with Code',
                      onPressed: _isLoading ? null : _handleJoinClass,
                      isLoading: _isLoading,
                      icon: Icons.class_outlined,
                      fullWidth: true,
                    ).animate().fadeIn(delay: 200.ms, duration: 400.ms).slideY(
                        begin: 0.1, end: 0, delay: 200.ms, duration: 500.ms),

                    SizedBox(height: AppSpacing.md),

                    // QR Scanner Button
                    OutlinedButtonCustom(
                      label: 'Scan QR Code Instead',
                      onPressed: _isLoading ? null : _handleScanQR,
                      icon: Icons.qr_code_scanner,
                      fullWidth: true,
                    ).animate().fadeIn(delay: 250.ms, duration: 400.ms).slideY(
                        begin: 0.1, end: 0, delay: 250.ms, duration: 500.ms),
                  ],
                ),
              ),
            ],

            SizedBox(height: AppSpacing.xl),

            // Info Card
            Card(
              elevation: 1,
              color: AppColors.info.withOpacity(0.1),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(AppBorders.radiusLg),
                side: BorderSide(color: AppColors.info.withOpacity(0.3)),
              ),
              child: Padding(
                padding: AppSpacing.card,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.info_outline,
                            color: AppColors.info, size: 24),
                        SizedBox(width: AppSpacing.sm),
                        Text(
                          'How it works',
                          style: AppTextStyles.h3.copyWith(
                            color: AppColors.info,
                          ),
                        ),
                      ],
                    ),
                    SizedBox(height: AppSpacing.md),
                    ...[
                      'You can join using a class code OR by scanning a QR code',
                      'If QR code doesn\'t work, use the manual class code option',
                      'Your join request will be sent to the teacher for approval',
                      'Once approved, you\'ll have full access to class features',
                      'You can only be in one class at a time'
                    ]
                        .map((text) => Padding(
                              padding: EdgeInsets.only(bottom: AppSpacing.sm),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text('• ', style: AppTextStyles.bodyMedium),
                                  Expanded(
                                    child: Text(
                                      text,
                                      style: AppTextStyles.bodyMedium.copyWith(
                                        color: AppColors.textSecondary,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ))
                        .toList(),
                  ],
                ),
              ),
            )
                .animate()
                .fadeIn(delay: 300.ms, duration: 400.ms)
                .slideY(begin: 0.1, end: 0, delay: 300.ms, duration: 500.ms),
          ],
        ),
      ),
    );
  }
}
