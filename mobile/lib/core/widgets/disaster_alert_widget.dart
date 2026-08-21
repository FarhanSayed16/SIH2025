/// Disaster alert banner (unused on screens).
/// Wire to `/api/alerts` when you want a live NDMA/school alert strip.
/// Hidden from HazardLens in Phase 3 so the demo does not show a fake stub.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class DisasterAlertWidget extends ConsumerWidget {
  const DisasterAlertWidget({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return const SizedBox.shrink();
  }
}
