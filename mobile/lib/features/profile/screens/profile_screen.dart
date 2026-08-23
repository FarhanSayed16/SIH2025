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
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final user = authState.user;
    final appMode = ref.watch(appModeProvider);
    final localeState = ref.watch(localeProvider);
    final l10n = AppLocalizations.of(context);

    return Scaffold(
      appBar: const AppBarCustom(
        title: 'Profile',
        automaticallyImplyLeading: false,
      ),
      body: SingleChildScrollView(
        padding: AppSpacing.screenEdge,
        child: Column(
          children: [
            // Profile Header
            InfoCard(
              padding: const EdgeInsets.all(24.0),
              content: Column(
                children: [
                  AvatarWidget(
                    name: user?.name ?? 'User',
                    size: 100,
                    backgroundColor: AppColors.primaryGreen,
                  ),
                  SizedBox(height: AppSpacing.md),
                  Text(
                    user?.name ?? 'User',
                    style: AppTextStyles.h3,
                  ),
                  SizedBox(height: AppSpacing.xs),
                  Text(
                    user?.email ?? 'No email',
                    style: AppTextStyles.bodyMedium.copyWith(
                      color: AppColors.textSecondary,
                    ),
                  ),
                  SizedBox(height: AppSpacing.sm),
                  BadgeWidget(
                    text: user?.role.toUpperCase() ?? 'UNKNOWN',
                    type: BadgeType.primary,
                    size: BadgeSize.medium,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Parent Linking Information Section (for students only)
            if (user?.role == AppConstants.roleStudent) ...[
              _buildParentLinkingSection(),
              const SizedBox(height: 24),
            ],

            // Badges Section
            _buildBadgesSection(),

            const SizedBox(height: 24),

            // Certificates Section
            _buildCertificatesSection(),

            // Leaderboard Section - Phase 3.4.6.4: Only for full access
            if (user == null ||
                user.role != 'student' ||
                AccessLevelProvider.canAccessFeature(user, 'leaderboard')) ...[
              const SizedBox(height: 24),
              _buildLeaderboardSection(),
            ],

            const SizedBox(height: 24),

            // Settings Section
            Text(
              l10n.settings,
              style: AppTextStyles.h3,
              textAlign: TextAlign.left,
            ),
            SizedBox(height: AppSpacing.md),

            // Theme Toggle (Crisis Mode) - Phase 3.4.6.4: Only for full access
            if (user == null ||
                user.role != 'student' ||
                AccessLevelProvider.canAccessFeature(user, 'crisis_mode'))
              Padding(
                padding: EdgeInsets.only(bottom: AppSpacing.md),
                child: Card(
                  elevation: 2,
                  shape: RoundedRectangleBorder(
                    borderRadius: AppBorders.borderRadiusMd,
                  ),
                  child: ListTile(
                    leading:
                        Icon(Icons.color_lens, color: AppColors.primaryGreen),
                    title: Text(l10n.appMode, style: AppTextStyles.h5),
                    subtitle: Text(
                      appMode == AppMode.peace
                          ? l10n.peaceMode
                          : l10n.crisisMode,
                      style: AppTextStyles.bodySmall,
                    ),
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
                  ),
                ),
              ),

            // Language Selector
            Padding(
              padding: EdgeInsets.only(bottom: AppSpacing.md),
              child: ActionCard(
                title: l10n.language,
                subtitle: localeState.locale.languageCode == 'hi'
                    ? '\u0939\u093F\u0902\u0926\u0940'
                    : 'English',
                leadingIcon: Icons.language,
                onTap: () {
                  ref.read(localeProvider.notifier).toggleLocale();
                },
              ),
            ),

            // Student: Join Class - Phase D
            if (user?.role == 'student') ...[
              Padding(
                padding: EdgeInsets.only(bottom: AppSpacing.md),
                child: Card(
                  elevation: 2,
                  shape: RoundedRectangleBorder(
                    borderRadius: AppBorders.borderRadiusMd,
                  ),
                  child: Column(
                    children: [
                      ListTile(
                        leading: Icon(Icons.class_outlined,
                            color: AppColors.primaryGreen),
                        title: Text('Join a Class', style: AppTextStyles.h5),
                        subtitle: Text(
                          user?.classId != null
                              ? 'Manage your class membership'
                              : 'Join using code or QR code',
                          style: AppTextStyles.bodySmall,
                        ),
                        trailing:
                            Icon(Icons.chevron_right, color: Colors.grey[400]),
                        onTap: () {
                          Navigator.push<void>(
                            context,
                            MaterialPageRoute<void>(
                              builder: (context) => const JoinClassScreen(),
                            ),
                          );
                        },
                      ),
                      const Divider(height: 1),
                      ListTile(
                        leading: Icon(Icons.qr_code_scanner,
                            color: AppColors.primaryGreen),
                        title: Text('Scan QR Code', style: AppTextStyles.h5),
                        subtitle: Text(
                          'Scan teacher\'s QR code to join',
                          style: AppTextStyles.bodySmall,
                        ),
                        trailing:
                            Icon(Icons.chevron_right, color: Colors.grey[400]),
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
                    ],
                  ),
                ),
              ),
            ],

            // Phase 3.4.2: IoT Devices - Phase 3.4.6.5: Add navigation link
            Padding(
              padding: EdgeInsets.only(bottom: AppSpacing.md),
              child: ActionCard(
                title: 'IoT Devices',
                subtitle: 'View sensor devices and health status',
                leadingIcon: Icons.sensors,
                onTap: () {
                  Navigator.push<void>(
                    context,
                    MaterialPageRoute<void>(
                      builder: (context) => const IoTDeviceListScreen(),
                    ),
                  );
                },
              ),
            ),

            // About Section
            SizedBox(height: AppSpacing.xl),
            Text(
              l10n.about,
              style: AppTextStyles.h3,
              textAlign: TextAlign.left,
            ),
            SizedBox(height: AppSpacing.md),

            Card(
              child: Column(
                children: [
                  ListTile(
                    leading: const Icon(Icons.info),
                    title: Text(l10n.appVersion),
                    subtitle: Text(
                        '${AppConstants.appVersion} (${AppConstants.appVersion}+1)'),
                    onTap: _handleVersionTap,
                  ),
                  const Divider(),
                  ListTile(
                    leading: const Icon(Icons.description),
                    title: Text(l10n.appName),
                    subtitle: Text(l10n.appName),
                  ),
                ],
              ),
            ),

            // Logout Button
            SizedBox(height: AppSpacing.xxl),
            PrimaryButton(
              label: l10n.logout,
              icon: Icons.logout,
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
              backgroundColor: AppColors.error,
              fullWidth: true,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildParentLinkingSection() {
    final user = ref.watch(authProvider).user;
    if (user == null || user.role != AppConstants.roleStudent) {
      return const SizedBox.shrink();
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(Icons.qr_code, color: AppColors.accentBlue, size: 24),
            const SizedBox(width: 8),
            Text(
              'Parent Linking Information',
              style: AppTextStyles.h3,
            ),
          ],
        ),
        const SizedBox(height: AppSpacing.md),
        InfoCard(
          title: 'Share with Parents',
          content: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Share this information with your parent so they can link your account and monitor your progress.',
                style: AppTextStyles.bodySmall,
              ),
              const SizedBox(height: AppSpacing.lg),

              // QR Code Display
              if (user.qrCode != null && user.qrCode!.isNotEmpty) ...[
                Text(
                  'QR Code',
                  style: AppTextStyles.h5,
                ),
                const SizedBox(height: AppSpacing.sm),
                Center(
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: AppBorders.borderRadiusMd,
                      border: Border.all(color: Colors.grey[300]!),
                    ),
                    child: QrImageView(
                      data: user.qrCode!,
                      version: QrVersions.auto,
                      size: 200.0,
                      backgroundColor: Colors.white,
                    ),
                  ),
                ),
                const SizedBox(height: AppSpacing.sm),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.backgroundWhite,
                    borderRadius: AppBorders.borderRadiusMd,
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Text(
                          user.qrCode!,
                          style: AppTextStyles.bodySmall.copyWith(
                            fontFamily: 'monospace',
                          ),
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.copy),
                        onPressed: () {
                          Clipboard.setData(ClipboardData(text: user.qrCode!));
                          SnackbarWidget.show(
                            context,
                            message: 'QR Code copied to clipboard',
                            type: SnackbarType.success,
                          );
                        },
                      ),
                    ],
                  ),
                ),
                if (user.qrBadgeId != null && user.qrBadgeId!.isNotEmpty) ...[
                  const SizedBox(height: AppSpacing.xs),
                  Text(
                    'Badge ID: ${user.qrBadgeId}',
                    style: AppTextStyles.caption.copyWith(
                      fontFamily: 'monospace',
                    ),
                  ),
                ],
                const SizedBox(height: AppSpacing.lg),
              ],

              // Student ID
              _buildInfoRow(
                label: 'Student ID',
                value: user.id,
                onCopy: () {
                  Clipboard.setData(ClipboardData(text: user.id));
                  SnackbarWidget.show(
                    context,
                    message: 'Student ID copied to clipboard',
                    type: SnackbarType.success,
                  );
                },
              ),

              const SizedBox(height: AppSpacing.md),

              // Institution ID
              if (user.institutionId != null) ...[
                _buildInfoRow(
                  label: 'Institution ID',
                  value: user.institutionId.toString(),
                  onCopy: () {
                    Clipboard.setData(
                      ClipboardData(text: user.institutionId.toString()),
                    );
                    SnackbarWidget.show(
                      context,
                      message: 'Institution ID copied to clipboard',
                      type: SnackbarType.success,
                    );
                  },
                ),
                const SizedBox(height: AppSpacing.md),
              ],

              // Instructions
              Container(
                padding: const EdgeInsets.all(AppSpacing.md),
                decoration: BoxDecoration(
                  color: AppColors.accentBlue.withOpacity(0.1),
                  borderRadius: AppBorders.borderRadiusMd,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(
                          Icons.info_outline,
                          size: 16,
                          color: AppColors.accentBlue,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'How to share with parents:',
                          style: AppTextStyles.h5.copyWith(
                            fontWeight: FontWeight.bold,
                            color: AppColors.accentBlue,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: AppSpacing.sm),
                    Text(
                      '\u2022 Share your QR code or Student ID with your parent\n'
                      '\u2022 Parent can use this to link your account\n'
                      '\u2022 Parent needs to login and go to "Add Child" page\n'
                      '\u2022 Parent can scan the QR code or enter your Student ID',
                      style: AppTextStyles.bodySmall,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildInfoRow({
    required String label,
    required String value,
    required VoidCallback onCopy,
  }) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: AppColors.backgroundWhite,
        borderRadius: AppBorders.borderRadiusMd,
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: AppTextStyles.caption,
                ),
                const SizedBox(height: AppSpacing.xs),
                Text(
                  value,
                  style: AppTextStyles.bodySmall.copyWith(
                    fontFamily: 'monospace',
                  ),
                ),
              ],
            ),
          ),
          IconButton(
            icon: const Icon(Icons.copy),
            onPressed: onCopy,
          ),
        ],
      ),
    );
  }

  Widget _buildBadgesSection() {
    final myBadgesState = ref.watch(myBadgesProvider);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Badges',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            TextButton(
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute<dynamic>(
                    builder: (context) => const BadgeCollectionScreen(),
                  ),
                );
              },
              child: const Text('View All'),
            ),
          ],
        ),
        const SizedBox(height: 16),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: myBadgesState.isLoading
                ? const Center(
                    child: Padding(
                      padding: EdgeInsets.all(16),
                      child: CircularProgressIndicator(),
                    ),
                  )
                : myBadgesState.badges.isEmpty
                    ? Column(
                        children: [
                          Icon(Icons.star_outline,
                              size: 48, color: Colors.grey[400]),
                          const SizedBox(height: 8),
                          Text(
                            'No badges earned yet',
                            style: TextStyle(color: Colors.grey[600]),
                          ),
                          const SizedBox(height: 16),
                          OutlinedButton.icon(
                            onPressed: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute<dynamic>(
                                  builder: (context) =>
                                      const BadgeCollectionScreen(),
                                ),
                              );
                            },
                            icon: const Icon(Icons.explore),
                            label: const Text('Explore Badges'),
                          ),
                        ],
                      )
                    : Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '${myBadgesState.badges.length} Badge${myBadgesState.badges.length != 1 ? 's' : ''} Earned',
                            style: Theme.of(context).textTheme.titleMedium,
                          ),
                          const SizedBox(height: 12),
                          SizedBox(
                            height: 80,
                            child: ListView.builder(
                              scrollDirection: Axis.horizontal,
                              itemCount: myBadgesState.badges.length,
                              itemBuilder: (context, index) {
                                final badge = myBadgesState.badges[index];
                                return Padding(
                                  padding: const EdgeInsets.only(right: 12),
                                  child: GestureDetector(
                                    onTap: () {
                                      Navigator.push(
                                        context,
                                        MaterialPageRoute<dynamic>(
                                          builder: (context) =>
                                              BadgeDetailScreen(
                                            badgeId: badge.id,
                                          ),
                                        ),
                                      );
                                    },
                                    child: Container(
                                      width: 80,
                                      decoration: BoxDecoration(
                                        shape: BoxShape.circle,
                                        border: Border.all(
                                          color: Theme.of(context)
                                              .colorScheme
                                              .primary,
                                          width: 2,
                                        ),
                                        gradient: LinearGradient(
                                          begin: Alignment.topLeft,
                                          end: Alignment.bottomRight,
                                          colors: [
                                            Theme.of(context)
                                                .colorScheme
                                                .primary
                                                .withOpacity(0.1),
                                            Colors.transparent,
                                          ],
                                        ),
                                      ),
                                      child: Center(
                                        child: Text(
                                          badge.icon,
                                          style: const TextStyle(fontSize: 40),
                                        ),
                                      ),
                                    ),
                                  ),
                                );
                              },
                            ),
                          ),
                        ],
                      ),
          ),
        ),
      ],
    );
  }

  Widget _buildCertificatesSection() {
    final myCertificatesState = ref.watch(myCertificatesProvider);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Certificates',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            TextButton(
              onPressed: () {
                Navigator.push<void>(
                  context,
                  MaterialPageRoute<void>(
                    builder: (context) => const CertificateListScreen(),
                  ),
                );
              },
              child: const Text('View All'),
            ),
          ],
        ),
        const SizedBox(height: 16),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: myCertificatesState.isLoading
                ? const Center(
                    child: Padding(
                      padding: EdgeInsets.all(16),
                      child: CircularProgressIndicator(),
                    ),
                  )
                : myCertificatesState.certificates.isEmpty
                    ? Column(
                        children: [
                          Icon(Icons.card_membership,
                              size: 48, color: Colors.grey[400]),
                          const SizedBox(height: 8),
                          Text(
                            'No certificates earned yet',
                            style: TextStyle(color: Colors.grey[600]),
                          ),
                          const SizedBox(height: 16),
                          OutlinedButton.icon(
                            onPressed: () {
                              Navigator.push<void>(
                                context,
                                MaterialPageRoute<void>(
                                  builder: (context) =>
                                      const CertificateListScreen(),
                                ),
                              );
                            },
                            icon: const Icon(Icons.explore),
                            label: const Text('View Certificates'),
                          ),
                        ],
                      )
                    : Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '${myCertificatesState.certificates.length} Certificate${myCertificatesState.certificates.length != 1 ? 's' : ''} Earned',
                            style: Theme.of(context).textTheme.titleMedium,
                          ),
                          const SizedBox(height: 12),
                          SizedBox(
                            height: 100,
                            child: ListView.builder(
                              scrollDirection: Axis.horizontal,
                              itemCount:
                                  myCertificatesState.certificates.length,
                              itemBuilder: (context, index) {
                                final certificate =
                                    myCertificatesState.certificates[index];
                                return Padding(
                                  padding: const EdgeInsets.only(right: 12),
                                  child: GestureDetector(
                                    onTap: () {
                                      Navigator.push<void>(
                                        context,
                                        MaterialPageRoute<void>(
                                          builder: (context) =>
                                              CertificateDetailScreen(
                                            certificateId: certificate.id,
                                          ),
                                        ),
                                      );
                                    },
                                    child: Container(
                                      width: 120,
                                      decoration: BoxDecoration(
                                        borderRadius: BorderRadius.circular(12),
                                        border: Border.all(
                                          color: Theme.of(context)
                                              .colorScheme
                                              .primary,
                                          width: 2,
                                        ),
                                        gradient: LinearGradient(
                                          begin: Alignment.topLeft,
                                          end: Alignment.bottomRight,
                                          colors: [
                                            Theme.of(context)
                                                .colorScheme
                                                .primaryContainer,
                                            Colors.transparent,
                                          ],
                                        ),
                                      ),
                                      child: Column(
                                        mainAxisAlignment:
                                            MainAxisAlignment.center,
                                        children: [
                                          Icon(
                                            Icons.verified,
                                            size: 32,
                                            color: Theme.of(context)
                                                .colorScheme
                                                .primary,
                                          ),
                                          const SizedBox(height: 8),
                                          Padding(
                                            padding: const EdgeInsets.symmetric(
                                                horizontal: 8.0),
                                            child: Text(
                                              certificate.displayTitle,
                                              textAlign: TextAlign.center,
                                              style: Theme.of(context)
                                                  .textTheme
                                                  .bodySmall
                                                  ?.copyWith(
                                                    fontWeight: FontWeight.bold,
                                                  ),
                                              maxLines: 2,
                                              overflow: TextOverflow.ellipsis,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                );
                              },
                            ),
                          ),
                        ],
                      ),
          ),
        ),
      ],
    );
  }

  Widget _buildLeaderboardSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Leaderboard',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            TextButton(
              onPressed: () {
                Navigator.push<void>(
                  context,
                  MaterialPageRoute<void>(
                    builder: (context) => const LeaderboardScreen(),
                  ),
                );
              },
              child: const Text('View All'),
            ),
          ],
        ),
        const SizedBox(height: 16),
        Card(
          child: InkWell(
            onTap: () {
              Navigator.push<void>(
                context,
                MaterialPageRoute<void>(
                  builder: (context) => const LeaderboardScreen(),
                ),
              );
            },
            borderRadius:
                BorderRadius.circular(AppConstants.defaultBorderRadius),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Theme.of(context).colorScheme.primaryContainer,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(
                      Icons.emoji_events,
                      color: Theme.of(context).colorScheme.primary,
                      size: 32,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'View Rankings',
                          style: Theme.of(context).textTheme.titleMedium,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'See how you rank against others',
                          style:
                              Theme.of(context).textTheme.bodySmall?.copyWith(
                                    color: Colors.grey[600],
                                  ),
                        ),
                      ],
                    ),
                  ),
                  Icon(
                    Icons.chevron_right,
                    color: Colors.grey[400],
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}
