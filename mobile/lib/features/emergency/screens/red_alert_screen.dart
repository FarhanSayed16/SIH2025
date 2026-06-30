import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/constants/socket_events.dart';
import '../../../core/widgets/accessibility_wrapper.dart';
import '../../../core/widgets/widgets.dart';
import '../../../core/design/design_system.dart';
import '../../../l10n/app_localizations.dart';
import '../../auth/providers/auth_provider.dart';
import '../../socket/providers/socket_provider.dart';
import '../../auth/models/user_model.dart';

/// Red Alert Screen - Full-screen emergency alert
class RedAlertScreen extends ConsumerStatefulWidget {
  final String alertType;
  final String message;
  final String? location;
  final String? severity;

  const RedAlertScreen({
    super.key,
    required this.alertType,
    required this.message,
    this.location,
    this.severity,
  });

  @override
  ConsumerState<RedAlertScreen> createState() => _RedAlertScreenState();
}

class _RedAlertScreenState extends ConsumerState<RedAlertScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _pulseAnimation;
  bool _isSending = false;
  String? _lastLocation;
  DateTime? _lastSentAt;

  @override
  void initState() {
    super.initState();

    // Vibrate device
    HapticFeedback.heavyImpact();

    // Play alert sound (if available)
    SystemSound.play(SystemSoundType.alert);

    // Pulse animation
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    )..repeat(reverse: true);

    _pulseAnimation = Tween<double>(begin: 0.8, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  IconData _getIconForType(String type) {
    switch (type.toLowerCase()) {
      case 'fire':
        return Icons.local_fire_department;
      case 'earthquake':
        return Icons.terrain;
      case 'flood':
        return Icons.water_drop;
      case 'cyclone':
        return Icons.air;
      case 'emergency':
      default:
        return Icons.warning;
    }
  }

  String _getAlertTitle(String type, BuildContext context) {
    final l10n = AppLocalizations.of(context);
    switch (type.toLowerCase()) {
      case 'fire':
        return l10n.fireAlert;
      case 'earthquake':
        return l10n.earthquakeAlert;
      case 'flood':
        return l10n.floodAlert;
      case 'cyclone':
        return l10n.cycloneAlert;
      case 'emergency':
      default:
        return l10n.crisisAlert;
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final user = ref.watch(authProvider).user;
    return WillPopScope(
      onWillPop: () async => false, // Prevent back button
      child: Scaffold(
        backgroundColor: Colors.black,
        body: SafeArea(
          child: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Pulsing Alert Icon
                AccessibilityWrapper(
                  label: 'Emergency Alert Icon',
                  isImage: true,
                  child: AnimatedBuilder(
                    animation: _pulseAnimation,
                    builder: (context, child) {
                      return Transform.scale(
                        scale: _pulseAnimation.value,
                        child: Container(
                          width: 150,
                          height: 150,
                          decoration: BoxDecoration(
                            color: Colors.red,
                            shape: BoxShape.circle,
                          ),
                          child: Icon(
                            _getIconForType(widget.alertType),
                            size: 80,
                            color: Colors.white,
                          ),
                        ),
                      );
                    },
                  ),
                ),
                const SizedBox(height: 40),

                // Alert Title
                Text(
                  _getAlertTitle(widget.alertType, context),
                  style: AppTextStyles.displaySmall.copyWith(
                    color: Colors.white,
                    letterSpacing: 2,
                    fontWeight: FontWeight.bold,
                  ),
                  textAlign: TextAlign.center,
                ),
                SizedBox(height: AppSpacing.md),

                // Alert Message
                Padding(
                  padding: EdgeInsets.symmetric(horizontal: AppSpacing.xxl),
                  child: Text(
                    widget.message,
                    style: AppTextStyles.h5.copyWith(
                      color: Colors.white,
                      height: 1.5,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),

                // Location (if available)
                if (widget.location != null) ...[
                  SizedBox(height: AppSpacing.md),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.location_on,
                          color: Colors.white70, size: 20),
                      SizedBox(width: AppSpacing.sm),
                      Text(
                        widget.location!,
                        style: AppTextStyles.bodyMedium.copyWith(
                          color: Colors.white70,
                        ),
                      ),
                    ],
                  ),
                ],

                // Severity (if available)
                if (widget.severity != null) ...[
                  SizedBox(height: AppSpacing.md),
                  BadgeWidget(
                    text: widget.severity!.toUpperCase(),
                    type: widget.severity == AppConstants.severityCritical
                        ? BadgeType.error
                        : BadgeType.warning,
                    size: BadgeSize.large,
                  ),
                ],

                SizedBox(height: AppSpacing.xxl),

                // Action Buttons
                Padding(
                  padding: EdgeInsets.symmetric(horizontal: AppSpacing.xxl),
                  child: Column(
                    children: [
                      // I'm Safe Button
                      PrimaryButton(
                        label: l10n.imSafe.toUpperCase(),
                        onPressed: _isSending ? null : () => _handleSafe(user),
                        icon: Icons.check_circle,
                        backgroundColor: AppColors.success,
                        size: ButtonSize.large,
                        fullWidth: true,
                      ),
                      SizedBox(height: AppSpacing.md),

                      // Need Help Button
                      EmergencyButton(
                        label: l10n.needHelp,
                        onPressed:
                            _isSending ? null : () => _handleDanger(user),
                        icon: Icons.emergency,
                        pulse: true,
                        size: ButtonSize.large,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _handleDanger(UserModel? user) async {
    setState(() => _isSending = true);

    Position? position;
    try {
      final permission = await Geolocator.checkPermission();
      LocationPermission perm = permission;
      if (permission == LocationPermission.denied ||
          permission == LocationPermission.deniedForever) {
        perm = await Geolocator.requestPermission();
      }
      if (perm == LocationPermission.whileInUse ||
          perm == LocationPermission.always) {
        position = await Geolocator.getCurrentPosition(
          desiredAccuracy: LocationAccuracy.high,
        );
        _lastLocation =
            '${position.latitude.toStringAsFixed(5)}, ${position.longitude.toStringAsFixed(5)}';
      }
    } catch (_) {
      _lastLocation = null;
    }

    await _emitSos(status: 'danger', user: user, position: position);
    _lastSentAt = DateTime.now();
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Emergency alert sent'),
          backgroundColor: Colors.red,
        ),
      );
      // Auto-open primary emergency dialer (112) then show directory
      await _autoDialPrimary();
      _showCallDirectory();
    }

    setState(() => _isSending = false);
  }

  Future<void> _handleSafe(UserModel? user) async {
    setState(() => _isSending = true);
    await _emitSos(status: 'safe', user: user, position: null);
    _lastSentAt = DateTime.now();
    if (mounted) {
      Navigator.of(context).pop();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Marked safe'),
          backgroundColor: Colors.green,
        ),
      );
    }
    setState(() => _isSending = false);
  }

  Future<void> _emitSos({
    required String status,
    required UserModel? user,
    Position? position,
  }) async {
    final socket = ref.read(socketProvider.notifier);
    final payload = <String, dynamic>{
      'status': status,
      'timestamp': DateTime.now().toIso8601String(),
      if (user?.id != null) 'userId': user?.id,
      if (user?.role != null) 'role': user?.role,
      if (user?.institutionId != null)
        'institutionId': user?.institutionId is String
            ? user?.institutionId
            : user?.institutionId?.toString(),
      if (position != null)
        'location': {
          'lat': position.latitude,
          'lng': position.longitude,
          'accuracy': position.accuracy,
        },
      if (_lastLocation != null) 'locationText': _lastLocation,
      'device': 'mobile',
    };

    final event =
        status == 'safe' ? SocketEvents.sosSafe : SocketEvents.sosAlert;
    socket.emit(event, payload);
  }

  void _showCallDirectory() {
    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (context) {
        final contacts = [
          {'label': 'Police (112)', 'number': '112'},
          {'label': 'Fire (101)', 'number': '101'},
          {'label': 'Ambulance (108)', 'number': '108'},
          {'label': 'Campus Security', 'number': '9999999999'},
        ];
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Call Directory',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 12),
                ...contacts.map((c) => ListTile(
                      leading: const Icon(Icons.phone),
                      title: Text(c['label']!),
                      subtitle: _lastLocation != null
                          ? Text('Share location: $_lastLocation')
                          : null,
                      onTap: () async {
                        final uri = Uri(scheme: 'tel', path: c['number']!);
                        if (await canLaunchUrl(uri)) {
                          await launchUrl(uri);
                        }
                      },
                    )),
                const SizedBox(height: 8),
                if (_lastLocation != null)
                  Text(
                    'Location: $_lastLocation',
                    style: const TextStyle(fontSize: 12, color: Colors.grey),
                  ),
                if (_lastSentAt != null)
                  Text(
                    'Last sent: ${_lastSentAt!.toLocal()}',
                    style: const TextStyle(fontSize: 12, color: Colors.grey),
                  ),
              ],
            ),
          ),
        );
      },
    );
  }

  /// Try to auto-open the primary emergency dialer (112) for the user.
  Future<void> _autoDialPrimary() async {
    const primaryNumber = '112';
    final uri = Uri(scheme: 'tel', path: primaryNumber);
    try {
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri);
      }
    } catch (_) {
      // If auto-launch fails, silently ignore.
    }
  }
}
