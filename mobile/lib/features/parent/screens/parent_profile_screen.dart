/// Parent Profile Screen
/// Parent account information and settings
/// Parent Monitoring System - Phase 2 Complete

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/widgets/widgets.dart';
import '../../../core/design/design_system.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/parent_provider.dart';
import '../services/parent_service.dart';
import '../../../core/providers/api_service_provider.dart';
import 'child_detail_screen.dart';

class ParentProfileScreen extends ConsumerStatefulWidget {
  final bool embedded;
  final ValueChanged<int>? onSelectTab;

  const ParentProfileScreen({
    super.key,
    this.embedded = false,
    this.onSelectTab,
  });

  @override
  ConsumerState<ParentProfileScreen> createState() =>
      _ParentProfileScreenState();
}

class _ParentProfileScreenState extends ConsumerState<ParentProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _phoneNumberController = TextEditingController();
  final _alternatePhoneController = TextEditingController();
  String _selectedRelationship = 'other';
  bool _isEditing = false;
  bool _isSaving = false;
  bool _showPasswordForm = false;
  final _oldPasswordController = TextEditingController();
  final _newPasswordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _isChangingPassword = false;

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _phoneNumberController.dispose();
    _alternatePhoneController.dispose();
    _oldPasswordController.dispose();
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  void _loadProfile() {
    final authState = ref.read(authProvider);
    final user = authState.user;
    if (user != null) {
      _nameController.text = user.name;
      _emailController.text = user.email;
      // Phone and parentProfile are not in UserModel, will be loaded from API response
      // For now, just initialize with empty values
      _phoneController.text = '';
      _phoneNumberController.text = '';
      _alternatePhoneController.text = '';
      _selectedRelationship = 'other';
    }
  }

  Future<void> _handleSaveProfile() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isSaving = true;
    });

    try {
      final apiService = ref.read(apiServiceProvider);
      final parentService = ParentService(apiService);

      final profileData = <String, dynamic>{
        'name': _nameController.text.trim(),
        'email': _emailController.text.trim(),
      };
      // Only send phone fields when the user entered a value — avoid wiping
      // existing server phones with empty strings from unhydrated form state.
      final phone = _phoneController.text.trim();
      final phoneNumber = _phoneNumberController.text.trim();
      final altPhone = _alternatePhoneController.text.trim();
      if (phone.isNotEmpty) profileData['phone'] = phone;
      final parentProfile = <String, dynamic>{
        'relationship': _selectedRelationship,
      };
      if (phoneNumber.isNotEmpty) parentProfile['phoneNumber'] = phoneNumber;
      if (altPhone.isNotEmpty) {
        parentProfile['alternatePhoneNumber'] = altPhone;
      }
      profileData['parentProfile'] = parentProfile;

      await parentService.updateProfile(profileData);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('Profile updated successfully'),
            backgroundColor: AppColors.success,
          ),
        );
        setState(() {
          _isEditing = false;
          // Keep edited field values — do not wipe phones by reloading empty auth snapshot
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to update profile: ${e.toString()}'),
            backgroundColor: AppColors.error,
          ),
        );
        // Retain in-progress edits on failure
      }
    } finally {
      if (mounted) {
        setState(() {
          _isSaving = false;
        });
      }
    }
  }

  Future<void> _handleChangePassword() async {
    if (_newPasswordController.text != _confirmPasswordController.text) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('New passwords do not match'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    if (_newPasswordController.text.length < 8) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Password must be at least 8 characters long'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    setState(() {
      _isChangingPassword = true;
    });

    try {
      final apiService = ref.read(apiServiceProvider);
      final parentService = ParentService(apiService);

      await parentService.changePassword(
        _oldPasswordController.text,
        _newPasswordController.text,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('Password changed successfully'),
            backgroundColor: AppColors.success,
          ),
        );
        setState(() {
          _showPasswordForm = false;
          _oldPasswordController.clear();
          _newPasswordController.clear();
          _confirmPasswordController.clear();
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to change password: ${e.toString()}'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isChangingPassword = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final user = authState.user;
    final childrenAsync = ref.watch(childrenProvider);

    if (user == null) {
      return const Scaffold(
        body: Center(child: Text('Not authenticated')),
      );
    }

    return Scaffold(
      appBar: AppBarCustom(
        title: 'Profile',
        actions: [
          if (_isEditing)
            IconButton(
              icon: _isSaving
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                      ),
                    )
                  : const Icon(Icons.check),
              onPressed: _isSaving ? null : _handleSaveProfile,
            ),
          IconButton(
            icon: Icon(_isEditing ? Icons.close : Icons.edit),
            onPressed: () {
              setState(() {
                _isEditing = !_isEditing;
                if (!_isEditing) {
                  _loadProfile(); // Reset to original values
                }
              });
            },
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Profile Header
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  AppColors.accentBlue.withOpacity(0.1),
                  AppColors.accentBlue.withOpacity(0.05),
                ],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: AppBorders.borderRadiusLg,
            ),
            child: Column(
              children: [
                Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    color: AppColors.accentBlue,
                    shape: BoxShape.circle,
                  ),
                  child: Center(
                    child: Text(
                      (user.name.trim().isNotEmpty
                              ? user.name.trim()[0]
                              : '?')
                          .toUpperCase(),
                      style: AppTextStyles.h3.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  user.name,
                  style: AppTextStyles.h4.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                if (user.email.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text(
                    user.email,
                    style: AppTextStyles.bodyMedium.copyWith(
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: AppColors.accentBlue.withOpacity(0.1),
                    borderRadius: AppBorders.borderRadiusSm,
                  ),
                  child: Text(
                    'Parent',
                    style: AppTextStyles.caption.copyWith(
                      color: AppColors.accentBlue,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 24),

          // Account Information
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Account Information',
                style: AppTextStyles.h4,
              ),
            ],
          ),
          const SizedBox(height: 12),
          Form(
            key: _formKey,
            child: InfoCard(
              title: 'Personal Details',
              content: Column(
                children: [
                  if (_isEditing) ...[
                    TextInputCustom(
                      controller: _nameController,
                      label: 'Name',
                      hint: 'Your name',
                      leadingIcon: Icons.person,
                      required: true,
                      validator: (value) {
                        if (value == null || value.trim().isEmpty) {
                          return 'Name is required';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 12),
                    TextInputCustom(
                      controller: _emailController,
                      label: 'Email',
                      hint: 'your.email@example.com',
                      leadingIcon: Icons.email,
                      keyboardType: TextInputType.emailAddress,
                      required: true,
                      validator: (value) {
                        if (value == null || value.trim().isEmpty) {
                          return 'Email is required';
                        }
                        if (!value.contains('@')) {
                          return 'Invalid email format';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 12),
                    TextInputCustom(
                      controller: _phoneController,
                      label: 'Phone',
                      hint: 'Your phone number',
                      leadingIcon: Icons.phone,
                      keyboardType: TextInputType.phone,
                    ),
                    const SizedBox(height: 12),
                    TextInputCustom(
                      controller: _phoneNumberController,
                      label: 'Parent Phone Number',
                      hint: 'Primary phone number',
                      leadingIcon: Icons.phone,
                      keyboardType: TextInputType.phone,
                      required: true,
                      validator: (value) {
                        if (value == null || value.trim().isEmpty) {
                          return 'Phone number is required';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 12),
                    TextInputCustom(
                      controller: _alternatePhoneController,
                      label: 'Alternate Phone (Optional)',
                      hint: 'Alternate phone number',
                      leadingIcon: Icons.phone_android,
                      keyboardType: TextInputType.phone,
                    ),
                    const SizedBox(height: 12),
                    DropdownInputCustom(
                      label: 'Relationship',
                      value: _selectedRelationship,
                      items: const [
                        DropdownMenuItem(
                            value: 'father', child: Text('Father')),
                        DropdownMenuItem(
                            value: 'mother', child: Text('Mother')),
                        DropdownMenuItem(
                            value: 'guardian', child: Text('Guardian')),
                        DropdownMenuItem(value: 'other', child: Text('Other')),
                      ],
                      onChanged: (value) {
                        if (value != null) {
                          setState(() {
                            _selectedRelationship = value;
                          });
                        }
                      },
                    ),
                  ] else ...[
                    ListTile(
                      leading: const Icon(Icons.person),
                      title: const Text('Name'),
                      subtitle: Text(user.name),
                    ),
                    ListTile(
                      leading: const Icon(Icons.email),
                      title: const Text('Email'),
                      subtitle: Text(user.email.isNotEmpty ? user.email : 'Not provided'),
                    ),
                    // Phone will be shown if available from profile data
                    ListTile(
                      leading: const Icon(Icons.fingerprint),
                      title: const Text('User ID'),
                      subtitle: Text(
                        user.id,
                        style: const TextStyle(
                            fontFamily: 'monospace', fontSize: 12),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),

          const SizedBox(height: 24),

          // Linked Children
          Text(
            'Linked Children',
            style: AppTextStyles.h4,
          ),
          const SizedBox(height: 12),
          childrenAsync.when(
            data: (children) {
              if (children.isEmpty) {
                return InfoCard(
                  title: 'No Children Linked',
                  content: Column(
                    children: [
                      const Icon(
                        Icons.people_outline,
                        size: 48,
                        color: Colors.grey,
                      ),
                      const SizedBox(height: 12),
                      Text(
                        'No children are currently linked to your account.',
                        style: AppTextStyles.bodyMedium,
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                );
              }
              return InfoCard(
                title: 'Children (${children.length})',
                content: Column(
                  children: children.map((child) {
                    return ListTile(
                      leading: CircleAvatar(
                        backgroundColor: AppColors.accentBlue.withOpacity(0.1),
                        child: Text(
                          (child.name.trim().isNotEmpty
                                  ? child.name.trim()[0]
                                  : '?')
                              .toUpperCase(),
                          style: TextStyle(
                            color: AppColors.accentBlue,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      title: Text(child.name),
                      subtitle: child.grade != null && child.section != null
                          ? Text(
                              'Grade ${child.grade} - Section ${child.section}')
                          : null,
                      trailing: const Icon(Icons.chevron_right),
                      onTap: () {
                        Navigator.push<void>(
                          context,
                          MaterialPageRoute<void>(
                            builder: (context) => ChildDetailScreen(
                              studentId: child.id,
                            ),
                          ),
                        );
                      },
                    );
                  }).toList(),
                ),
              );
            },
            loading: () => const LoadingState(),
            error: (error, stack) => ErrorState(
              message: error.toString(),
            ),
          ),

          const SizedBox(height: 24),

          // Change Password Section
          Text(
            'Security',
            style: AppTextStyles.h4,
          ),
          const SizedBox(height: 12),
          if (!_showPasswordForm)
            SecondaryButton(
              label: 'Change Password',
              icon: Icons.lock,
              onPressed: () {
                setState(() {
                  _showPasswordForm = true;
                });
              },
              fullWidth: true,
            )
          else
            InfoCard(
              title: 'Change Password',
              content: Column(
                children: [
                  PasswordInputCustom(
                    controller: _oldPasswordController,
                    label: 'Current Password',
                    hint: 'Enter current password',
                    required: true,
                  ),
                  const SizedBox(height: 12),
                  PasswordInputCustom(
                    controller: _newPasswordController,
                    label: 'New Password',
                    hint: 'Enter new password',
                    required: true,
                  ),
                  const SizedBox(height: 12),
                  PasswordInputCustom(
                    controller: _confirmPasswordController,
                    label: 'Confirm New Password',
                    hint: 'Confirm new password',
                    required: true,
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButtonCustom(
                          label: 'Cancel',
                          onPressed: () {
                            setState(() {
                              _showPasswordForm = false;
                              _oldPasswordController.clear();
                              _newPasswordController.clear();
                              _confirmPasswordController.clear();
                            });
                          },
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: PrimaryButton(
                          label: 'Change Password',
                          onPressed: _isChangingPassword
                              ? null
                              : _handleChangePassword,
                          isLoading: _isChangingPassword,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

          const SizedBox(height: 24),

          // Actions
          Text(
            'Actions',
            style: AppTextStyles.h4,
          ),
          const SizedBox(height: 12),
          PrimaryButton(
            label: 'Logout',
            icon: Icons.logout,
            onPressed: () async {
              final confirmed = await showDialog<bool>(
                context: context,
                builder: (context) => AlertDialog(
                  title: const Text('Logout'),
                  content: const Text('Are you sure you want to logout?'),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.pop(context, false),
                      child: const Text('Cancel'),
                    ),
                    TextButton(
                      onPressed: () => Navigator.pop(context, true),
                      child: const Text('Logout'),
                    ),
                  ],
                ),
              );

              if (confirmed == true && context.mounted) {
                await ref.read(authProvider.notifier).logout();
                if (context.mounted) {
                  Navigator.of(context).pushReplacementNamed('/login');
                }
              }
            },
            fullWidth: true,
          ),

          const SizedBox(height: 24),
        ],
      ),
    );
  }
}
