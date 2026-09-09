import 'package:flutter_riverpod/flutter_riverpod.dart';

/// How the user wants to join a class after they authenticate.
enum PendingJoinMode {
  classCode,
  scanQr,
}

/// Transient join intent set from Login before auth. Cleared on cancel or consume.
final pendingJoinIntentProvider = StateProvider<PendingJoinMode?>((ref) => null);
