/// Compact Login — B3 layout and explained class-join flow.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/widgets/widgets.dart';
import '../../../core/design/design_system.dart';
import '../../../core/utils/validators.dart';
import '../../../core/providers/locale_provider.dart';
import '../../../l10n/app_localizations.dart';
import '../providers/auth_provider.dart';
import '../providers/pending_join_intent_provider.dart';
import '../services/auth_service.dart';
import 'register_screen.dart';
import 'approval_pending_screen.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _emailFocus = FocusNode();
  final _passwordFocus = FocusNode();

  String? _emailError;
  String? _passwordError;
  bool _emailTouched = false;
  bool _passwordTouched = false;
  bool _isSubmitting = false;

  static const _languageOptions = <(String code, String label)>[
    ('en', 'English'),
    ('hi', 'हिंदी'),
    ('mr', 'मराठी'),
    ('pa', 'ਪੰਜਾਬੀ'),
  ];

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _emailFocus.dispose();
    _passwordFocus.dispose();
    super.dispose();
  }

  void _validateEmail() {
    if (_emailTouched) {
      setState(() {
        _emailError = Validators.emailError(_emailController.text.trim());
      });
    }
  }

  void _validatePassword() {
    if (_passwordTouched) {
      setState(() {
        _passwordError = Validators.passwordError(_passwordController.text);
      });
    }
  }

  bool _isFormValid() {
    final email = _emailController.text.trim();
    final password = _passwordController.text;
    if (email.isEmpty || password.isEmpty) return false;
    if (_emailError != null || _passwordError != null) return false;
    if (Validators.emailError(email) != null) return false;
    if (Validators.passwordError(password) != null) return false;
    return true;
  }

  Future<void> _handleLogin() async {
    if (_isSubmitting) return;

    setState(() {
      _emailTouched = true;
      _passwordTouched = true;
      _emailError = null;
      _passwordError = null;
    });

    _validateEmail();
    _validatePassword();

    if (!_isFormValid()) {
      _formKey.currentState?.validate();
      return;
    }

    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSubmitting = true);
    try {
      await ref.read(authProvider.notifier).login(
            _emailController.text.trim(),
            _passwordController.text,
          );
      // Navigation + pending join intent handled by app shell.
    } on AuthValidationException catch (e) {
      if (!mounted) return;
      await _handleAuthError(e);
    } catch (e) {
      if (mounted) {
        SnackbarWidget.show(
          context,
          message: 'Something went wrong. Please try again.',
          type: SnackbarType.error,
        );
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  Future<void> _handleAuthError(AuthValidationException e) async {
    String errorMessage = e.message.isNotEmpty ? e.message : 'Login failed';
    final fieldErrors = e.fieldErrors;

    if (fieldErrors.isNotEmpty) {
      setState(() {
        _emailError = fieldErrors['email'];
        _passwordError = fieldErrors['password'];
      });
    }

    final errorString = errorMessage.toLowerCase();

    final isPendingApproval =
        errorString.contains('pending teacher approval') ||
            errorString.contains('pending approval') ||
            errorString.contains('account is pending') ||
            errorString.contains('wait for approval') ||
            (errorString.contains('pending') &&
                errorString.contains('teacher')) ||
            (errorString.contains('pending') &&
                errorString.contains('approval'));

    final isRosterRecord = errorString.contains('roster record') ||
        errorString.contains('cannot login') ||
        errorString.contains('contact your teacher') ||
        errorString.contains('contact your school admin') ||
        errorString.contains('please register');

    if (isPendingApproval) {
      final email = _emailController.text.trim();
      final nameParts = email.split('@').first.split('.');
      final name = nameParts
          .map((part) =>
              part.isEmpty ? '' : part[0].toUpperCase() + part.substring(1))
          .join(' ');

      Navigator.of(context).pushReplacement<void, void>(
        MaterialPageRoute<void>(
          builder: (context) => ApprovalPendingScreen(
            studentName: name.isNotEmpty ? name : email.split('@').first,
            studentEmail: email,
          ),
        ),
      );
      return;
    } else if (isRosterRecord) {
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

    SnackbarWidget.show(
      context,
      message: errorMessage,
      type: SnackbarType.error,
    );
  }

  void _openJoinClassSheet() {
    final theme = Theme.of(context);
    final l10n = AppLocalizations.of(context);
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      backgroundColor: theme.colorScheme.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (sheetContext) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(24, 8, 24, 24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  l10n.joinYourClass,
                  style: theme.textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Sign in or create an account to join a class. '
                  'You can enter a class code or scan a classroom QR after you are signed in.',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
                const SizedBox(height: 20),
                PrimaryButton(
                  label: l10n.signIn,
                  fullWidth: true,
                  onPressed: () {
                    Navigator.pop(sheetContext);
                    _emailFocus.requestFocus();
                  },
                ),
                const SizedBox(height: 12),
                OutlinedButtonCustom(
                  label: 'Create an account',
                  fullWidth: true,
                  onPressed: () {
                    Navigator.pop(sheetContext);
                    Navigator.of(context).push<void>(
                      MaterialPageRoute<void>(
                        builder: (context) => const RegisterScreen(),
                      ),
                    );
                  },
                ),
                const SizedBox(height: 16),
                Text(
                  'Already planning how you will join?',
                  style: theme.textTheme.labelLarge,
                ),
                const SizedBox(height: 8),
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: Icon(Icons.password, color: theme.colorScheme.primary),
                  title: const Text('I will use a class code'),
                  subtitle: const Text('Opens after you sign in'),
                  onTap: () {
                    ref.read(pendingJoinIntentProvider.notifier).state =
                        PendingJoinMode.classCode;
                    Navigator.pop(sheetContext);
                    SnackbarWidget.show(
                      context,
                      message: 'Sign in to continue with your class code.',
                      type: SnackbarType.info,
                    );
                    _emailFocus.requestFocus();
                  },
                ),
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: Icon(Icons.qr_code_scanner,
                      color: theme.colorScheme.primary),
                  title: const Text('I will scan a classroom QR'),
                  subtitle: const Text('Opens after you sign in'),
                  onTap: () {
                    ref.read(pendingJoinIntentProvider.notifier).state =
                        PendingJoinMode.scanQr;
                    Navigator.pop(sheetContext);
                    SnackbarWidget.show(
                      context,
                      message: 'Sign in to scan your classroom QR code.',
                      type: SnackbarType.info,
                    );
                    _emailFocus.requestFocus();
                  },
                ),
                TextButton(
                  onPressed: () {
                    ref.read(pendingJoinIntentProvider.notifier).state = null;
                    Navigator.pop(sheetContext);
                  },
                  child: const Text('Cancel'),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildLanguageControl(BuildContext context) {
    final locale = ref.watch(localeProvider).locale.languageCode;
    final current = _languageOptions.firstWhere(
      (o) => o.$1 == locale,
      orElse: () => _languageOptions.first,
    );

    return Align(
      alignment: Alignment.centerRight,
      child: PopupMenuButton<String>(
        tooltip: 'Application language',
        onSelected: (code) {
          ref.read(localeProvider.notifier).setLocale(Locale(code));
        },
        itemBuilder: (context) => _languageOptions
            .map(
              (o) => PopupMenuItem<String>(
                value: o.$1,
                child: Text(
                  o.$2,
                  style: TextStyle(
                    fontWeight:
                        o.$1 == locale ? FontWeight.w700 : FontWeight.w400,
                  ),
                ),
              ),
            )
            .toList(),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.language, size: 20, color: Theme.of(context).colorScheme.primary),
              const SizedBox(width: 6),
              Text(
                current.$2,
                style: Theme.of(context).textTheme.labelLarge?.copyWith(
                      color: Theme.of(context).colorScheme.primary,
                    ),
              ),
              const Icon(Icons.arrow_drop_down, size: 20),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final l10n = AppLocalizations.of(context);
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final busy = authState.isLoading || _isSubmitting;

    return Scaffold(
      backgroundColor: colorScheme.surface,
      body: Container(
        width: double.infinity,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              AppColors.primaryGreenSubtle.withValues(alpha: 0.65),
              colorScheme.surface,
              colorScheme.surface,
            ],
            stops: const [0, 0.28, 1],
          ),
        ),
        child: SafeArea(
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 480),
              child: AutofillGroup(
                child: Form(
                  key: _formKey,
                  child: ListView(
                    padding: ScreenLayout.pagePaddingOf(context).copyWith(
                      top: AppSpacing.sm,
                      bottom: AppSpacing.xl,
                    ),
                    children: [
                      _buildLanguageControl(context),
                      const SizedBox(height: AppSpacing.sm),
                      const Center(
                        child: KavachLogo(size: KavachLogoSize.login),
                      ),
                      const SizedBox(height: AppSpacing.md),
                      Text(
                        l10n.appName,
                        textAlign: TextAlign.center,
                        style: theme.textTheme.displaySmall?.copyWith(
                          color: colorScheme.primary,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: AppSpacing.sm),
                      Text(
                        l10n.loginTagline,
                        textAlign: TextAlign.center,
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: colorScheme.onSurfaceVariant,
                        ),
                      ),
                      const SizedBox(height: AppSpacing.xl),
                      Text(
                        l10n.signIn,
                        style: theme.textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: AppSpacing.lg),
                      TextInputCustom(
                        label: l10n.email,
                        hint: 'you@school.edu',
                        controller: _emailController,
                        focusNode: _emailFocus,
                        keyboardType: TextInputType.emailAddress,
                        textInputAction: TextInputAction.next,
                        textCapitalization: TextCapitalization.none,
                        autofillHints: const [AutofillHints.email],
                        leadingIcon: Icons.email_outlined,
                        required: true,
                        errorText: _emailError,
                        onChanged: (_) {
                          setState(() {
                            if (_emailError != null &&
                                !_emailError!.contains('Gmail')) {
                              _emailError = null;
                            }
                          });
                          if (_emailTouched) _validateEmail();
                        },
                        onEditingComplete: () {
                          setState(() => _emailTouched = true);
                          _validateEmail();
                          _passwordFocus.requestFocus();
                        },
                        onSubmitted: (_) => _passwordFocus.requestFocus(),
                        validator: (value) {
                          if (_emailError != null) return _emailError;
                          if (_emailTouched) {
                            return Validators.emailError(value ?? '');
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: AppSpacing.lg),
                      PasswordInputCustom(
                        label: l10n.password,
                        controller: _passwordController,
                        focusNode: _passwordFocus,
                        required: true,
                        errorText: _passwordError,
                        textInputAction: TextInputAction.done,
                        autofillHints: const [AutofillHints.password],
                        onSubmitted: (_) {
                          if (_isFormValid() && !busy) {
                            _handleLogin();
                          }
                        },
                        onChanged: (_) {
                          setState(() {
                            if (_passwordError != null) _passwordError = null;
                          });
                          if (_passwordTouched) _validatePassword();
                        },
                        onEditingComplete: () {
                          setState(() => _passwordTouched = true);
                          _validatePassword();
                        },
                        validator: (value) {
                          if (_passwordError != null) return _passwordError;
                          if (_passwordTouched) {
                            return Validators.passwordError(value ?? '');
                          }
                          return null;
                        },
                      ),
                      Align(
                        alignment: Alignment.centerRight,
                        child: TextButton(
                          onPressed: () {
                            Navigator.of(context).pushNamed('/forgot-password');
                          },
                          child: Text(l10n.forgotPassword),
                        ),
                      ),
                      const SizedBox(height: AppSpacing.sm),
                      PrimaryButton(
                        label: l10n.login,
                        onPressed: (busy || !_isFormValid()) ? null : _handleLogin,
                        isLoading: busy,
                        fullWidth: true,
                        size: ButtonSize.large,
                      ),
                      const SizedBox(height: AppSpacing.xl),
                      OutlinedButtonCustom(
                        label: l10n.joinYourClass,
                        icon: Icons.school_outlined,
                        fullWidth: true,
                        onPressed: _openJoinClassSheet,
                      ),
                      const SizedBox(height: AppSpacing.lg),
                      Text.rich(
                        TextSpan(
                          style: theme.textTheme.bodyMedium?.copyWith(
                            color: colorScheme.onSurfaceVariant,
                          ),
                          children: [
                            const TextSpan(text: 'New to EduSafe? '),
                            WidgetSpan(
                              alignment: PlaceholderAlignment.middle,
                              child: TextButton(
                                style: TextButton.styleFrom(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 4,
                                  ),
                                  minimumSize: const Size(48, 40),
                                  tapTargetSize:
                                      MaterialTapTargetSize.shrinkWrap,
                                ),
                                onPressed: () {
                                  Navigator.of(context).push<void>(
                                    MaterialPageRoute<void>(
                                      builder: (context) =>
                                          const RegisterScreen(),
                                    ),
                                  );
                                },
                                child: Text(l10n.register),
                              ),
                            ),
                          ],
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
