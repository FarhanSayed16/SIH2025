/// Shared parent status display helpers (B7 §13.3).

class ParentStatusDisplay {
  ParentStatusDisplay._();

  /// Normalize raw API/status strings into a stable key.
  static String normalizeKey(String? raw) {
    final s = (raw ?? '').trim().toLowerCase();
    if (s.isEmpty || s == 'unknown' || s == 'unavailable' || s == 'null') {
      return 'unavailable';
    }
    if (s == 'safe' || s == 'reported_safe') return 'safe';
    if (s == 'in_drill' || s == 'drill' || s == 'participating') {
      return 'in_drill';
    }
    if (s == 'help' || s == 'emergency' || s == 'at_risk' || s == 'danger') {
      return 'help';
    }
    if (s == 'missing') return 'missing';
    return 'unavailable';
  }

  static String labelFor(String? raw) {
    switch (normalizeKey(raw)) {
      case 'safe':
        return 'Reported safe';
      case 'in_drill':
        return 'Participating in drill';
      case 'help':
        return 'Needs help';
      case 'missing':
        return 'Reported missing';
      default:
        return 'Status unavailable';
    }
  }

  static bool isCalm(String? raw) => normalizeKey(raw) == 'safe';
  static bool isUrgent(String? raw) {
    final k = normalizeKey(raw);
    return k == 'help' || k == 'missing';
  }

  static bool isInformational(String? raw) => normalizeKey(raw) == 'in_drill';
}
