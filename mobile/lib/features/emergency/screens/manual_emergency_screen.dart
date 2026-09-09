import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/design/design_system.dart';
import '../../../core/widgets/widgets.dart';
import '../../../l10n/app_localizations.dart';

/// Calm, dismissible manual emergency help entry.
/// Opening this screen does not sound an alarm, emit SOS, or start a call.
class ManualEmergencyScreen extends ConsumerWidget {
  const ManualEmergencyScreen({super.key});

  Future<void> _dial(BuildContext context, String number, String label) async {
    final uri = Uri(scheme: 'tel', path: number);
    try {
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri);
      } else if (context.mounted) {
        SnackbarWidget.show(
          context,
          message: 'Unable to open the phone dialer for $label.',
          type: SnackbarType.error,
        );
      }
    } catch (_) {
      if (context.mounted) {
        SnackbarWidget.show(
          context,
          message: 'Unable to place a call right now.',
          type: SnackbarType.error,
        );
      }
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: Text(AppLocalizations.of(context).emergencyHelp),
        leading: IconButton(
          icon: const Icon(Icons.close),
          tooltip: 'Close',
          onPressed: () => Navigator.of(context).maybePop(),
        ),
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            Text(
              'Choose what you need',
              style: theme.textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'This screen does not send an alert automatically. '
              'Use an action below only when you intend to request help or call.',
              style: theme.textTheme.bodyMedium?.copyWith(
                color: AppColors.textSecondary,
              ),
            ),
            const SizedBox(height: 24),
            Card(
              elevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
                side: BorderSide(color: AppColors.borderLight),
              ),
              child: ListTile(
                leading: Icon(Icons.school_outlined, color: AppColors.textSecondary),
                title: const Text('Request help from your institution'),
                subtitle: const Text(
                  'Unavailable from this button. Institution messaging opens '
                  'only during a real received alert or drill.',
                ),
                enabled: false,
              ),
            ),
            const SizedBox(height: 16),
            Card(
              elevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
                side: BorderSide(color: AppColors.borderLight),
              ),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Call a national emergency number',
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Calls open only when you tap a number below. '
                      'Configured campus contacts are not shown until your school provides them.',
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: AppColors.textSecondary,
                      ),
                    ),
                    const SizedBox(height: 12),
                    _CallTile(
                      label: 'Police / Emergency (112)',
                      number: '112',
                      onTap: () => _dial(context, '112', '112'),
                    ),
                    _CallTile(
                      label: 'Fire (101)',
                      number: '101',
                      onTap: () => _dial(context, '101', '101'),
                    ),
                    _CallTile(
                      label: 'Ambulance (108)',
                      number: '108',
                      onTap: () => _dial(context, '108', '108'),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            Card(
              elevation: 0,
              color: AppColors.warningBackground,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
                side: BorderSide(color: AppColors.warning.withOpacity(0.35)),
              ),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Icon(Icons.info_outline, color: AppColors.warning),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            'Connection and delivery',
                            style: theme.textTheme.titleSmall?.copyWith(
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'No help request is submitted from this screen. '
                      'During a real alert, delivery feedback will show whether '
                      'a report was accepted, saved locally, or failed — never '
                      'that responders are already on the way.',
                      style: theme.textTheme.bodySmall,
                    ),
                    const SizedBox(height: 12),
                    Text(
                      'Location sharing',
                      style: theme.textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Location is only shared when you submit a report from an '
                      'active incident screen and GPS is available. '
                      'This app will not invent coordinates. '
                      'If location is unavailable, you can still call the numbers above.',
                      style: theme.textTheme.bodySmall,
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CallTile extends StatelessWidget {
  final String label;
  final String number;
  final VoidCallback onTap;

  const _CallTile({
    required this.label,
    required this.number,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: const Icon(Icons.phone_in_talk_outlined),
      title: Text(label),
      subtitle: Text(number),
      trailing: const Icon(Icons.chevron_right),
      onTap: onTap,
    );
  }
}
