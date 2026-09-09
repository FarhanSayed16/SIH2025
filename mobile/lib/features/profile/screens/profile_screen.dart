import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/theme/theme_provider.dart';
import '../../../core/providers/locale_provider.dart';
import '../../../core/providers/access_level_provider.dart';
import '../../../l10n/app_localizations.dart';
import '../../../core/widgets/widgets.dart';
import '../../../core/design/design_system.dart';
import '../../auth/providers/auth_provider.dart';
import '../../fcm/providers/fcm_provider.dart';
import '../../badges/providers/badge_provider.dart';
import '../../badges/screens/badge_collection_screen.dart';
import '../../badges/screens/badge_detail_screen.dart';
import '../../certificates/providers/certificate_provider.dart';
import '../../certificates/screens/certificate_list_screen.dart';
import '../../certificates/screens/certificate_detail_screen.dart';
import '../../leaderboard/screens/leaderboard_screen.dart';
import '../../iot/screens/iot_device_list_screen.dart';
import '../../student/screens/join_class_screen.dart';
import '../../student/services/student_service.dart';
import '../../qr/screens/qr_scanner_screen.dart';
import '../../../core/providers/api_service_provider.dart';
import '../widgets/developer_menu.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:flutter/services.dart';

/// Profile Screen with User Details and Settings
class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  int _versionTapCount = 0;
  DateTime? _lastTapTime;

  @override
  void initState() {
    super.initState();
    // Load certificates on init
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(myCertificatesProvider.notifier).loadCertificates();
    });
  }

  void _handleVersionTap() {
    final now = DateTime.now();
    if (_lastTapTime == null ||
        now.difference(_lastTapTime!) > const Duration(seconds: 2)) {
      _versionTapCount = 1;
    } else {
      _versionTapCount++;
    }
    _lastTapTime = now;

    if (_versionTapCount >= AppConstants.devMenuTapCount) {
      _versionTapCount = 0;
      _showDeveloperMenu();
    }
  }

  String _localeLabel(String code) {
    switch (code) {
      case 'hi':
        return 'हिंदी';
      case 'mr':
        return 'मराठी';
      case 'pa':
        return 'ਪੰਜਾਬੀ';
      default:
        return 'English';
    }
  }

  void _showDeveloperMenu() {
    showModalBottomSheet<void>(
      context: context,
      builder: (context) => const DeveloperMenu(),
    );
  }

  Future<void> _handleQRJoin(BuildContext context, String qrCode) async {
    // Use shared ApiService from provider to ensure token is available
    final apiService = ref.read(apiServiceProvider);
    final studentService = StudentService(apiService: apiService);
    String? error;
    String? success;

    // Show loading dialog
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
        error = 'Invalid QR code format. Please scan a valid class QR code.';
        Navigator.pop(context); // Close loading
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(error),
              backgroundColor: AppColors.error,
            ),
          );
        }
        return;
      }

      // Join class using classId
      final response = await studentService.joinClassByQR(classId);

      if (response['success'] == true) {
        success = (response['message'] as String?) ??
            'Join request sent successfully!';
        Navigator.pop(context); // Close loading

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(success),
              backgroundColor: AppColors.success,
            ),
          );
        }
      } else {
        error = (response['message'] as String?) ?? 'Failed to join class';
        Navigator.pop(context); // Close loading
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(error),
              backgroundColor: AppColors.error,
            ),
          );
        }
      }
    } catch (e) {
      error = e.toString().replaceAll('Exception: ', '');
      Navigator.pop(context); // Close loading
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(error),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  @override
  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final user = authState.user;
    final appMode = ref.watch(appModeProvider);
    final themeMode = ref.watch(themeModeProvider);
    final localeState = ref.watch(localeProvider);
    final l10n = AppLocalizations.of(context);
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Scaffold(
      backgroundColor: colorScheme.surface,
      appBar: const AppBarCustom(
        title: 'Profile',
        automaticallyImplyLeading: false,
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            // Header Profile Information
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: AppSpacing.xxl, horizontal: AppSpacing.lg),
              child: Column(
                children: [
                  AvatarWidget(
                    name: user?.name ?? 'User',
                    size: 96,
                    backgroundColor: colorScheme.primaryContainer,
                  ),
                  const SizedBox(height: AppSpacing.md),
                  Text(
                    user?.name ?? 'User',
                    style: theme.textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.w700,
                      color: colorScheme.onSurface,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.xs),
                  Text(
                    user?.email ?? 'No email',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: colorScheme.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                    decoration: BoxDecoration(
                      color: colorScheme.secondaryContainer,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Text(
                      user?.role.toUpperCase() ?? 'UNKNOWN',
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: colorScheme.onSecondaryContainer,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            
            Padding(
              padding: AppSpacing.screenEdge,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Achievements & Progression
                  _SettingsGroup(
                    title: 'Learning & Achievements',
                    children: [
                      _SettingsTile(
                        icon: Icons.workspace_premium_outlined,
                        title: 'Badges',
                        subtitle: 'View your earned badges',
                        onTap: () {
                          Navigator.push<void>(
                            context,
                            MaterialPageRoute<void>(
                              builder: (context) => const BadgeCollectionScreen(),
                            ),
                          );
                        },
                      ),
                      _SettingsTile(
                        icon: Icons.military_tech_outlined,
                        title: 'Certificates',
                        subtitle: 'Download course certificates',
                        onTap: () {
                          Navigator.push<void>(
                            context,
                            MaterialPageRoute<void>(
                              builder: (context) => const CertificateListScreen(),
                            ),
                          );
                        },
                      ),
                      if (user == null || user.role != 'student' || AccessLevelProvider.canAccessFeature(user, 'leaderboard'))
                        _SettingsTile(
                          icon: Icons.emoji_events_outlined,
                          title: 'Leaderboard',
                          subtitle: 'See how you rank against others',
                          onTap: () {
                            Navigator.push<void>(
                              context,
                              MaterialPageRoute<void>(
                                builder: (context) => const LeaderboardScreen(),
                              ),
                            );
                          },
                        ),
                    ],
                  ),

                  // Role-specific Actions
                  if (user?.role == 'student')
                    _SettingsGroup(
                      title: 'Classroom & Parents',
                      children: [
                        _SettingsTile(
                          icon: Icons.class_outlined,
                          title: 'Join a Class',
                          subtitle: user!.classId != null ? 'Manage class membership' : 'Join using code or QR',
                          onTap: () {
                            Navigator.push<void>(
                              context,
                              MaterialPageRoute<void>(
                                builder: (context) => const JoinClassScreen(),
                              ),
                            );
                          },
                        ),
                        _SettingsTile(
                          icon: Icons.qr_code_scanner,
                          title: 'Scan QR Code',
                          subtitle: 'Scan teacher\'s QR code to join',
                          onTap: () async {
                            final qrCode = await Navigator.push<String>(
                              context,
                              MaterialPageRoute<String>(
                                builder: (context) => const QRScannerScreen(
                                  title: 'Scan Class QR Code',
                                  isClassroomMode: true,
                                ),
                              ),
                            );
                            if (qrCode != null && mounted) {
                              await _handleQRJoin(context, qrCode);
                            }
                          },
                        ),
                        _SettingsTile(
                          icon: Icons.family_restroom_outlined,
                          title: 'Link Parent',
                          subtitle: 'Share access code with parent',
                          onTap: () {
                            _showParentLinkingDialog(context, user!.qrCode);
                          },
                        ),
                      ],
                    ),

                  // IoT Devices
                  _SettingsGroup(
                    title: 'Devices',
                    children: [
                      _SettingsTile(
                        icon: Icons.sensors_outlined,
                        title: 'IoT Sensors',
                        subtitle: 'View device health status',
                        onTap: () {
                          Navigator.push<void>(
                            context,
                            MaterialPageRoute<void>(
                              builder: (context) => const IoTDeviceListScreen(),
                            ),
                          );
                        },
                      ),
                    ],
                  ),

                  // Preferences
                  _SettingsGroup(
                    title: l10n.settings,
                    children: [
                      _SettingsTile(
                        icon: themeMode == AppThemeMode.dark ? Icons.dark_mode_outlined : Icons.light_mode_outlined,
                        title: 'Appearance',
                        subtitle: themeMode == AppThemeMode.dark ? 'Dark Mode' : 'Light Mode',
                        trailing: Switch(
                          value: themeMode == AppThemeMode.dark,
                          onChanged: (value) {
                            if (value) {
                              ref.read(themeModeProvider.notifier).setDark();
                            } else {
                              ref.read(themeModeProvider.notifier).setLight();
                            }
                          },
                        ),
                        onTap: () {
                          if (themeMode == AppThemeMode.dark) {
                            ref.read(themeModeProvider.notifier).setLight();
                          } else {
                            ref.read(themeModeProvider.notifier).setDark();
                          }
                        },
                      ),
                      if (user == null || user.role != 'student' || AccessLevelProvider.canAccessFeature(user, 'crisis_mode'))
                        _SettingsTile(
                          icon: Icons.color_lens_outlined,
                          title: l10n.appMode,
                          subtitle: appMode == AppMode.peace ? l10n.peaceMode : l10n.crisisMode,
                          trailing: Switch(
                            value: appMode == AppMode.peace,
                            onChanged: (value) {
                              if (value) {
                                ref.read(appModeProvider.notifier).setPeaceMode();
                              } else {
                                ref.read(appModeProvider.notifier).setCrisisMode();
                              }
                            },
                          ),
                          onTap: () {
                            if (appMode == AppMode.peace) {
                              ref.read(appModeProvider.notifier).setCrisisMode();
                            } else {
                              ref.read(appModeProvider.notifier).setPeaceMode();
                            }
                          },
                        ),
                      _SettingsTile(
                        icon: Icons.language_outlined,
                        title: l10n.language,
                        subtitle: _localeLabel(localeState.locale.languageCode),
                        onTap: () {
                          ref.read(localeProvider.notifier).cycleLocale();
                        },
                      ),
                    ],
                  ),

                  // System & Security
                  _SettingsGroup(
                    title: 'System & Security',
                    children: [
                      _SettingsTile(
                        icon: Icons.notifications_outlined,
                        title: 'Alert notifications',
                        subtitle: 'Manage push alerts',
                        onTap: () async {
                          final granted = await ref.read(fcmProvider.notifier).requestAlertPermission();
                          if (!mounted) return;
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text(
                                granted ? 'Alert notifications enabled' : 'Notification permission was not granted.',
                              ),
                            ),
                          );
                        },
                      ),
                      _SettingsTile(
                        icon: Icons.privacy_tip_outlined,
                        title: 'Permissions Info',
                        subtitle: 'Camera, Mic, Location usage',
                        onTap: () {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Permissions are requested only when needed by specific features.'),
                            ),
                          );
                        },
                      ),
                    ],
                  ),

                  // About & Version
                  _SettingsGroup(
                    title: l10n.about,
                    children: [
                      _SettingsTile(
                        icon: Icons.info_outline,
                        title: l10n.appVersion,
                        subtitle: '${AppConstants.appVersion} (${AppConstants.appVersion}+1)',
                        onTap: _handleVersionTap,
                      ),
                    ],
                  ),

                  const SizedBox(height: AppSpacing.xl),

                  // Logout Action
                  OutlinedButtonCustom(
                    label: l10n.logout,
                    icon: Icons.logout,
                    fullWidth: true,
                    onPressed: () async {
                      final confirmed = await DialogWidget.showConfirm(
                        context,
                        title: 'Logout',
                        message: '${l10n.logout}?',
                        confirmLabel: l10n.logout,
                        cancelLabel: l10n.cancel,
                      );

                      if (confirmed == true) {
                        await ref.read(authProvider.notifier).logout();
                        if (context.mounted) {
                          Navigator.of(context).pushReplacementNamed('/login');
                        }
                      }
                    },
                  ),
                  const SizedBox(height: AppSpacing.xxl),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showParentLinkingDialog(BuildContext context, String? qrCode) {
    if (qrCode == null || qrCode.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('QR Code not available. Please try again later.')),
      );
      return;
    }

    showDialog<void>(
      context: context,
      builder: (context) {
        return AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppBorders.radiusLg)),
          title: const Text('Parent Linking'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                'Share this code with your parent to link accounts.',
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.grey.shade300),
                ),
                child: QrImageView(
                  data: qrCode,
                  version: QrVersions.auto,
                  size: 200.0,
                ),
              ),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.surfaceContainerHighest,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        qrCode,
                        style: const TextStyle(fontFamily: 'monospace'),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.copy, size: 20),
                      onPressed: () {
                        Clipboard.setData(ClipboardData(text: qrCode));
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Copied to clipboard')),
                        );
                      },
                    ),
                  ],
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Close'),
            ),
          ],
        );
      },
    );
  }
}

class _SettingsGroup extends StatelessWidget {
  final String title;
  final List<Widget> children;

  const _SettingsGroup({
    required this.title,
    required this.children,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 8, bottom: 8, top: 24),
          child: Text(
            title,
            style: Theme.of(context).textTheme.titleSmall?.copyWith(
                  color: Theme.of(context).colorScheme.primary,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 0.5,
                ),
          ),
        ),
        Card(
          margin: EdgeInsets.zero,
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppBorders.radiusLg),
            side: BorderSide(
              color: Theme.of(context).colorScheme.outlineVariant.withValues(alpha: 0.5),
              width: 1,
            ),
          ),
          clipBehavior: Clip.antiAlias,
          child: Column(
            children: [
              for (int i = 0; i < children.length; i++) ...[
                children[i],
                if (i < children.length - 1)
                  Divider(
                    height: 1,
                    thickness: 1,
                    indent: 56,
                    color: Theme.of(context).colorScheme.outlineVariant.withValues(alpha: 0.2),
                  ),
              ],
            ],
          ),
        ),
      ],
    );
  }
}

class _SettingsTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;
  final Widget? trailing;

  const _SettingsTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
    this.trailing,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: theme.colorScheme.primaryContainer.withValues(alpha: 0.5),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(
                  icon,
                  size: 20,
                  color: theme.colorScheme.primary,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ),
              if (trailing != null)
                trailing!
              else
                Icon(
                  Icons.chevron_right,
                  size: 20,
                  color: theme.colorScheme.onSurfaceVariant.withValues(alpha: 0.5),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
