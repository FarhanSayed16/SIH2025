/// Phase 4.1: Enhanced Crisis Mode Screen
/// Phase 101.6.1: Redesigned with new component library
/// Full-screen emergency alert with Real Crisis vs Drill Mode distinction
/// Includes Dead Man's Switch, enhanced vibrations, and Phase 4.0 integration

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:audioplayers/audioplayers.dart';
import 'dart:async';
import '../../../core/widgets/accessibility_wrapper.dart';
import '../../../l10n/app_localizations.dart';
import '../../../core/services/location_optimization_service.dart';
import '../../../core/widgets/widgets.dart';
import '../../../core/design/design_system.dart';
import '../../../core/providers/api_service_provider.dart';
import '../../../core/constants/api_endpoints.dart';
import '../services/crisis_alert_service.dart';
import '../../socket/providers/socket_provider.dart';
import '../../auth/providers/auth_provider.dart';
import '../../drills/services/drill_service.dart'; // Phase 4.2
import '../../ar/screens/ar_evacuation_screen.dart'; // Phase 5.5: Enhanced AR Evacuation

/// Crisis Mode Screen - Phase 4.1 Enhanced
class CrisisModeScreen extends ConsumerStatefulWidget {
  final String alertId;
  final String alertType;
  final String message;
  final String? location;
  final String? severity;
  final String? source; // IoT, Admin, Teacher, AI, NDMA
  final bool isDrill; // Phase 4.1: Drill vs Real distinction
  final String? drillId; // If this is a drill
  final String? drillType; // Phase 4.2: Drill type
  final int? drillDuration; // Phase 4.2: Drill duration in minutes
  final Map<String, dynamic>? locationDetails; // building, floor, room

  const CrisisModeScreen({
    super.key,
    required this.alertId,
    required this.alertType,
    required this.message,
    this.location,
    this.severity,
    this.source,
    this.isDrill = false,
    this.drillId,
    this.drillType,
    this.drillDuration,
    this.locationDetails,
  });

  @override
  ConsumerState<CrisisModeScreen> createState() => _CrisisModeScreenState();
}

class _CrisisModeScreenState extends ConsumerState<CrisisModeScreen>
    with TickerProviderStateMixin {
  late AnimationController _flashController;
  late AnimationController _pulseController;
  late Animation<double> _flashAnimation;
  late Animation<double> _pulseAnimation;

  Timer? _deadManSwitchTimer;
  Timer? _vibrationTimer;
  Timer? _soundTimer;
  int _deadManSwitchSeconds = 300; // 5 minutes in seconds
  bool _statusSent = false;
  bool _isDisposed = false;

  AudioPlayer? _alarmPlayer;
  LocationOptimizationService? _locationService;
  Position? _currentPosition;

  @override
  void initState() {
    super.initState();
    _initializeScreen();
  }

  Future<void> _initializeScreen() async {
    // Initialize animations
    _flashController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 500),
    );

    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    );

    _flashAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _flashController, curve: Curves.easeInOut),
    );

    _pulseAnimation = Tween<double>(begin: 0.9, end: 1.0).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );

    // Real Crisis: Flashing red/black pattern + continuous vibration + siren
    if (!widget.isDrill) {
      // Start flashing animation
      _flashController.repeat(reverse: true);

      // Start continuous vibration
      _startContinuousVibration();

      // Play siren alarm (looping)
      _playAlarmSound(looping: true);

      // Start Dead Man's Switch timer
      _startDeadManSwitch();
    } else {
      // Drill Mode: Amber/orange (no flashing) + single pulse + mild beep
      _pulseController.repeat(reverse: true);

      // Single vibration pulse
      HapticFeedback.mediumImpact();

      // Mild beep (not siren)
      _playDrillBeep();
    }

    // Cache alert for offline access
    await _cacheAlert();

    // Get current location
    await _getCurrentLocation();
  }

  /// Start continuous vibration pattern
  void _startContinuousVibration() {
    _vibrationTimer?.cancel();
    _vibrationTimer = Timer.periodic(const Duration(milliseconds: 500), (_) {
      if (!_isDisposed) {
        HapticFeedback.heavyImpact();
      }
    });
  }

  /// Play alarm sound (siren for real crisis, beep for drill)
  void _playAlarmSound({bool looping = false}) {
    if (widget.isDrill) {
      _playDrillBeep();
      return;
    }

    try {
      _alarmPlayer?.dispose();
      _alarmPlayer = AudioPlayer();

      // Use system alert sound as siren (looping)
      SystemSound.play(SystemSoundType.alert);

      if (looping) {
        _soundTimer = Timer.periodic(const Duration(seconds: 2), (_) {
          if (!_isDisposed) {
            SystemSound.play(SystemSoundType.alert);
          }
        });
      }
    } catch (e) {
      print('Error playing alarm sound: $e');
    }
  }

  /// Play mild beep for drill
  void _playDrillBeep() {
    try {
      SystemSound.play(SystemSoundType.click);
    } catch (e) {
      print('Error playing drill beep: $e');
    }
  }

  /// Start Dead Man's Switch timer (Real Crisis only)
  void _startDeadManSwitch() {
    if (widget.isDrill) return; // No Dead Man's Switch for drills

    _deadManSwitchTimer?.cancel();
    _deadManSwitchSeconds = 300; // 5 minutes

    _deadManSwitchTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_isDisposed || _statusSent) {
        timer.cancel();
        return;
      }

      setState(() {
        _deadManSwitchSeconds--;
      });

      if (_deadManSwitchSeconds <= 0) {
        timer.cancel();
        _handleDeadManSwitchTimeout();
      }
    });
  }

  /// Handle Dead Man's Switch timeout - mark as potentially trapped
  Future<void> _handleDeadManSwitchTimeout() async {
    if (_statusSent) return;

    try {
      final authState = ref.read(authProvider);
      final userId = authState.user?.id;

      if (userId == null) return;

      final crisisService = ref.read(crisisAlertServiceProvider);
      await crisisService.markSafe(
        alertId: widget.alertId,
        userId: userId,
        ref: ref,
        position: _currentPosition,
      );

      // Also send via API to mark as potentially trapped
      // Note: Backend should interpret no response as potentially_trapped

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text(
                'No response detected. You have been marked as potentially trapped.'),
            backgroundColor: Colors.orange,
            duration: const Duration(seconds: 5),
          ),
        );
      }
    } catch (e) {
      print('Error handling dead man switch timeout: $e');
    }
  }

  /// Cache alert for offline access
  Future<void> _cacheAlert() async {
    try {
      final crisisService = ref.read(crisisAlertServiceProvider);
      await crisisService.cacheAlert({
        'alertId': widget.alertId,
        'alertType': widget.alertType,
        'message': widget.message,
        'location': widget.location,
        'severity': widget.severity,
        'source': widget.source,
        'isDrill': widget.isDrill,
        'drillId': widget.drillId,
        'locationDetails': widget.locationDetails,
        'timestamp': DateTime.now().toIso8601String(),
      });
    } catch (e) {
      print('Error caching alert: $e');
    }
  }

  /// Get current location
  Future<void> _getCurrentLocation() async {
    try {
      _locationService ??= LocationOptimizationService();
      _currentPosition = await _locationService!.getCurrentPosition();
    } catch (e) {
      print('Error getting location: $e');
    }
  }

  /// Handle I AM SAFE button
  Future<void> _handleSafe() async {
    if (_statusSent) return;

    try {
      _statusSent = true;
      _deadManSwitchTimer?.cancel();

      final authState = ref.read(authProvider);
      final userId = authState.user?.id;

      if (userId == null) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('User not authenticated')),
          );
        }
        return;
      }

      final crisisService = ref.read(crisisAlertServiceProvider);
      final result = await crisisService.markSafe(
        alertId: widget.alertId,
        userId: userId,
        ref: ref,
        position: _currentPosition,
      );

      if (mounted) {
        if (result['success'] == true) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('✓ You have been marked as SAFE'),
              backgroundColor: Colors.green,
              duration: Duration(seconds: 3),
            ),
          );

          // For drills, allow navigation back
          if (widget.isDrill) {
            Future.delayed(const Duration(seconds: 2), () {
              if (mounted) {
                Navigator.of(context).pop();
              }
            });
          }
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                  'Error: ${result['error'] ?? 'Failed to update status'}'),
              backgroundColor: Colors.red,
            ),
          );
          _statusSent = false; // Allow retry
        }
      }
    } catch (e) {
      print('Error handling safe: $e');
      _statusSent = false;
    }
  }

  /// Handle I NEED HELP button
  Future<void> _handleHelp() async {
    if (_statusSent) return;

    try {
      final authState = ref.read(authProvider);
      final userId = authState.user?.id;

      if (userId == null) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('User not authenticated')),
          );
        }
        return;
      }

      // Location is required for help requests
      if (_currentPosition == null) {
        await _getCurrentLocation();
        if (_currentPosition == null) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text(
                    'Location required for help request. Please enable GPS.'),
                backgroundColor: Colors.orange,
              ),
            );
          }
          return;
        }
      }

      final crisisService = ref.read(crisisAlertServiceProvider);
      final result = await crisisService.requestHelp(
        alertId: widget.alertId,
        userId: userId,
        ref: ref,
        position: _currentPosition,
        details: 'User requested help',
      );

      if (mounted) {
        if (result['success'] == true) {
          _statusSent = true;
          _deadManSwitchTimer?.cancel();

          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('🚨 Help request sent. Help is on the way!'),
              backgroundColor: Colors.red,
              duration: Duration(seconds: 5),
            ),
          );
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                  'Error: ${result['error'] ?? 'Failed to send help request'}'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    } catch (e) {
      print('Error handling help: $e');
    }
  }

  /// Phase 4.2: Handle drill acknowledgment
  /// Enhanced to use drill service API
  Future<void> _handleDrillAck() async {
    if (widget.drillId == null) return;

    try {
      // Phase 4.2: Use drill service to acknowledge
      // Use shared ApiService from provider to ensure auth token is included
      final drillService = DrillService(
        apiService: ref.read(apiServiceProvider),
      );
      final success = await drillService.acknowledgeDrill(widget.drillId!);

      // Also emit socket event for real-time updates
      final socketNotifier = ref.read(socketProvider.notifier);
      socketNotifier.emit('DRILL_ACK', {
        'drillId': widget.drillId,
      });

      if (mounted) {
        if (success) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('✓ Drill participation acknowledged'),
              backgroundColor: Colors.blue,
              duration: Duration(seconds: 3),
            ),
          );

          // B7: Fetch AI feedback and show before going back
          try {
            final api = ref.read(apiServiceProvider);
            final res = await api.post(
              ApiEndpoints.aiDrillFeedback,
              data: {
                'acknowledged': true,
                'responseTimeSeconds': null,
                'drillType': widget.drillType ?? widget.alertType,
              },
            );
            final feedback = res.data is Map && res.data['data'] != null
                ? (res.data['data'] as Map)['feedback']?.toString()
                : null;
            if (mounted && feedback != null && feedback.isNotEmpty) {
              await showDialog<void>(
                context: context,
                builder: (ctx) => AlertDialog(
                  title: const Text('AI feedback'),
                  content: Text(feedback),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.of(ctx).pop(),
                      child: const Text('OK'),
                    ),
                  ],
                ),
              );
            }
          } catch (_) {
            // Non-blocking
          }

          // Allow navigation back after acknowledgment (and optional feedback)
          if (mounted) {
            Navigator.of(context).pop();
          }
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Failed to acknowledge drill. Please try again.'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    } catch (e) {
      print('Error acknowledging drill: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  void dispose() {
    _isDisposed = true;
    _deadManSwitchTimer?.cancel();
    _vibrationTimer?.cancel();
    _soundTimer?.cancel();
    _flashController.dispose();
    _pulseController.dispose();
    _alarmPlayer?.dispose();
    _locationService?.dispose();
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
      case 'stampede':
        return Icons.running_with_errors;
      case 'medical':
        return Icons.medical_services;
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

  String _formatDeadManSwitchTime() {
    final minutes = _deadManSwitchSeconds ~/ 60;
    final seconds = _deadManSwitchSeconds % 60;
    return '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);

    // Real Crisis: RED/FLASHING background
    // Drill Mode: AMBER/ORANGE background (no flashing)
    final backgroundColor =
        widget.isDrill ? Colors.orange.shade900 : Colors.black;

    final primaryColor =
        widget.isDrill ? Colors.orange.shade700 : Colors.red.shade900;

    return WillPopScope(
      onWillPop: () async {
        // Real Crisis: Prevent back button
        if (!widget.isDrill) {
          return false;
        }

        // Drill Mode: Allow with warning
        final shouldPop = await showDialog<bool>(
          context: context,
          builder: (context) => AlertDialog(
            title: const Text('Exit Drill?'),
            content:
                const Text('Are you sure you want to exit the drill screen?'),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context, false),
                child: const Text('Stay'),
              ),
              TextButton(
                onPressed: () => Navigator.pop(context, true),
                child: const Text('Exit'),
              ),
            ],
          ),
        );
        return shouldPop ?? false;
      },
      child: Scaffold(
        backgroundColor: backgroundColor,
        body: SafeArea(
          child: Stack(
            children: [
              // Flashing background (Real Crisis only)
              if (!widget.isDrill)
                AnimatedBuilder(
                  animation: _flashAnimation,
                  builder: (context, child) {
                    return Container(
                      color: _flashAnimation.value < 0.5
                          ? Colors.black
                          : Colors.red.shade900,
                    );
                  },
                ),

              // Main content
              Center(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const SizedBox(height: 40),

                      // Alert Icon
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
                                  color: primaryColor,
                                  shape: BoxShape.circle,
                                  boxShadow: [
                                    BoxShadow(
                                      color: primaryColor.withOpacity(0.5),
                                      blurRadius: 30,
                                      spreadRadius: 10,
                                    ),
                                  ],
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
                        widget.isDrill
                            ? '⚠️ PRACTICE DRILL — This is not a real emergency ⚠️'
                            : '🚨 EMERGENCY — EVACUATE NOW! 🚨',
                        style: TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                          letterSpacing: 1.5,
                          shadows: [
                            Shadow(
                              color: Colors.black.withOpacity(0.8),
                              blurRadius: 10,
                            ),
                          ],
                        ),
                        textAlign: TextAlign.center,
                      ),

                      const SizedBox(height: 20),

                      // Alert Type Badge
                      BadgeWidget(
                        text: _getAlertTitle(widget.alertType, context)
                            .toUpperCase(),
                        type: widget.isDrill
                            ? BadgeType.warning
                            : BadgeType.error,
                        size: BadgeSize.large,
                        color: primaryColor,
                        textColor: Colors.white,
                      ),

                      SizedBox(height: AppSpacing.md),

                      // Source Indicator
                      if (widget.source != null) ...[
                        BadgeWidget(
                          text: 'Source: ${widget.source!.toUpperCase()}',
                          type: BadgeType.info,
                          size: BadgeSize.medium,
                        ),
                        SizedBox(height: AppSpacing.md),
                      ],

                      // Alert Message - Use AlertCard styling approach but keep full-screen design
                      Padding(
                        padding:
                            EdgeInsets.symmetric(horizontal: AppSpacing.md),
                        child: Text(
                          widget.message,
                          style: AppTextStyles.h5.copyWith(
                            color: Colors.white,
                            height: 1.5,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ),

                      // Location Details
                      if (widget.locationDetails != null &&
                          (widget.locationDetails!['building'] != null ||
                              widget.locationDetails!['room'] != null)) ...[
                        SizedBox(height: AppSpacing.md),
                        Container(
                          padding: AppSpacing.card,
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.1),
                            borderRadius: AppBorders.borderRadiusSm,
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.location_on,
                                  color: Colors.white70, size: 20),
                              SizedBox(width: AppSpacing.sm),
                              Text(
                                _formatLocationDetails(),
                                style: AppTextStyles.bodySmall.copyWith(
                                  color: Colors.white70,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],

                      SizedBox(height: AppSpacing.xl),

                      // Dead Man's Switch Timer (Real Crisis only)
                      if (!widget.isDrill) ...[
                        AlertCard(
                          title: _formatDeadManSwitchTime(),
                          message:
                              "If no response in 5 min, you'll be marked as potentially trapped",
                          type: AlertType.warning,
                          icon: Icons.timer,
                          padding: AppSpacing.card,
                        ),
                        SizedBox(height: AppSpacing.xl),
                      ],

                      // Action Buttons
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: Column(
                          children: [
                            if (widget.isDrill) ...[
                              // Drill Mode: Acknowledge Button
                              PrimaryButton(
                                label: 'ACKNOWLEDGE PARTICIPATION',
                                onPressed: _statusSent ? null : _handleDrillAck,
                                icon: Icons.check_circle_outline,
                                isDisabled: _statusSent,
                                size: ButtonSize.large,
                                fullWidth: true,
                              ),
                            ] else ...[
                              // Real Crisis: I AM SAFE Button (Green - positive action)
                              PrimaryButton(
                                label: l10n.imSafe.toUpperCase(),
                                onPressed: _statusSent ? null : _handleSafe,
                                icon: Icons.check_circle,
                                isDisabled: _statusSent,
                                backgroundColor: AppColors.success,
                                size: ButtonSize.large,
                                fullWidth: true,
                              ),
                              SizedBox(height: AppSpacing.md),

                              // Real Crisis: I NEED HELP Button (Red - emergency action)
                              EmergencyButton(
                                label: l10n.needHelp,
                                onPressed: _statusSent ? null : _handleHelp,
                                icon: Icons.emergency,
                                isDisabled: _statusSent,
                                pulse: !_statusSent,
                                size: ButtonSize.large,
                              ),
                              SizedBox(height: AppSpacing.md),

                              // Phase 4.7: AR Navigation Button (Real Crisis only)
                              OutlinedButtonCustom(
                                label: 'START AR NAVIGATION',
                                icon: Icons.camera_alt,
                                onPressed: () => _handleARNavigation(ref),
                                borderColor: Colors.cyan,
                                textColor: Colors.white,
                                fullWidth: true,
                                size: ButtonSize.large,
                              ),
                            ],
                          ],
                        ),
                      ),

                      const SizedBox(height: 40),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _formatLocationDetails() {
    final details = widget.locationDetails;
    if (details == null) return '';

    final parts = <String>[];
    if (details['building'] != null) parts.add(details['building'].toString());
    if (details['floor'] != null) parts.add('Floor ${details['floor']}');
    if (details['room'] != null) parts.add(details['room'].toString());

    return parts.join(' • ');
  }

  /// Phase 4.7: Handle AR Navigation
  void _handleARNavigation(WidgetRef ref) {
    try {
      final authState = ref.read(authProvider);
      final user = authState.user;

      if (user == null || user.institutionId == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
                'Unable to start AR navigation: School information not available'),
            backgroundColor: Colors.orange,
          ),
        );
        return;
      }

      // Phase 5.5: Use enhanced AR Evacuation Screen with compass fallback
      Navigator.push(
        context,
        MaterialPageRoute<void>(
          builder: (context) => AREvacuationScreen(
            schoolId: user.institutionId!,
            alertType: widget.alertType,
            alertId: widget.alertId,
          ),
        ),
      );
    } catch (e) {
      print('Error starting AR navigation: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to start AR navigation: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }
}
