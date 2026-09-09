import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/auth_provider.dart';
import '../providers/pending_join_intent_provider.dart';
import '../../student/screens/join_class_screen.dart';
import '../../qr/screens/qr_scanner_screen.dart';
import '../../student/services/student_service.dart';
import '../../../core/providers/api_service_provider.dart';
import '../../../core/design/design_system.dart';

/// After login, opens the join flow the user chose on the login sheet.
class PendingJoinIntentListener extends ConsumerStatefulWidget {
  final Widget child;

  const PendingJoinIntentListener({super.key, required this.child});

  @override
  ConsumerState<PendingJoinIntentListener> createState() =>
      _PendingJoinIntentListenerState();
}

class _PendingJoinIntentListenerState
    extends ConsumerState<PendingJoinIntentListener> {
  bool _handled = false;

  @override
  Widget build(BuildContext context) {
    ref.listen<AuthState>(authProvider, (previous, next) {
      if (!next.isAuthenticated && previous?.isAuthenticated == true) {
        _handled = false;
        return;
      }

      final becameAuthed =
          next.isAuthenticated && previous?.isAuthenticated != true;
      if (!becameAuthed || _handled) return;

      final intent = ref.read(pendingJoinIntentProvider);
      if (intent == null) return;

      _handled = true;
      ref.read(pendingJoinIntentProvider.notifier).state = null;

      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!mounted) return;
        _openIntent(intent);
      });
    });

    return widget.child;
  }

  Future<void> _openIntent(PendingJoinMode intent) async {
    final navigator = Navigator.of(context, rootNavigator: true);

    if (intent == PendingJoinMode.classCode) {
      await navigator.push<void>(
        MaterialPageRoute<void>(
          builder: (context) => const JoinClassScreen(),
        ),
      );
      return;
    }

    final qrCode = await navigator.push<String>(
      MaterialPageRoute(
        builder: (context) => const QRScannerScreen(
          title: 'Scan Class QR Code',
          isClassroomMode: true,
        ),
      ),
    );

    if (qrCode == null || !mounted) return;

    final apiService = ref.read(apiServiceProvider);
    final studentService = StudentService(apiService: apiService);
    final classId = studentService.parseClassQRCode(qrCode);

    if (classId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text(
            'This QR code is not a classroom join code. '
            'Ask your teacher for the class QR or class code.',
          ),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    try {
      final response = await studentService.joinClassByQR(classId);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            (response['message'] as String?) ??
                (response['success'] == true
                    ? 'Join request sent. Wait for teacher approval.'
                    : 'Could not join class'),
          ),
          backgroundColor: response['success'] == true
              ? AppColors.success
              : AppColors.error,
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(e.toString().replaceAll('Exception: ', '')),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }
}
