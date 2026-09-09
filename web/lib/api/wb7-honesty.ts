/**
 * WB7 analytics / devices presentation helpers
 */

export function formatMetricOrUnavailable(
  value: number | null | undefined,
  opts?: { suffix?: string; decimals?: number }
): string {
  if (value == null || !Number.isFinite(Number(value))) return 'Unavailable';
  const n = Number(value);
  const text =
    opts?.decimals != null ? n.toFixed(opts.decimals) : String(n);
  return `${text}${opts?.suffix ?? ''}`;
}

/** Scope key for race-safe analytics loads */
export function analyticsRequestKey(
  tab: string,
  start?: string,
  end?: string
): string {
  return `${tab}|${start || ''}|${end || ''}`;
}

export function mapTabToReportType(tab: string): string {
  switch (tab) {
    case 'drills':
      return 'drill_summary';
    case 'students':
      return 'student_progress';
    case 'institution':
      return 'institution_overview';
    case 'modules':
      return 'module_completion';
    case 'games':
      return 'game_performance';
    case 'quizzes':
      return 'quiz_accuracy';
    default:
      return 'institution_overview';
  }
}

export function registrationLabel(status?: string | null): string {
  if (!status) return 'Registration unknown';
  return `Registered: ${status}`;
}

export function healthLabel(health?: string | null): string {
  if (!health) return 'Health unknown';
  if (health === 'healthy') return 'Fresh telemetry (healthy)';
  if (health === 'warning') return 'Stale telemetry (warning)';
  if (health === 'offline') return 'No recent telemetry (offline)';
  return `Health: ${health}`;
}

/** Format accel axis — keep valid zero; missing stays unavailable */
export function formatAxisValue(value: unknown): string {
  if (value == null || value === '') return 'Unavailable';
  const n = Number(value);
  if (!Number.isFinite(n)) return 'Unavailable';
  return n.toFixed(2);
}

export function resolveSampleVsContact(input: {
  sampleTimestamp?: string | Date | null;
  receivedAt?: string | Date | null;
  lastSeen?: string | Date | null;
}): { sampleLabel: string; contactLabel: string } {
  const sample = input.sampleTimestamp
    ? new Date(input.sampleTimestamp)
    : null;
  const contact = input.lastSeen
    ? new Date(input.lastSeen)
    : input.receivedAt
    ? new Date(input.receivedAt)
    : null;

  return {
    sampleLabel:
      sample && !Number.isNaN(sample.getTime())
        ? sample.toLocaleString()
        : 'Sample time unavailable',
    contactLabel:
      contact && !Number.isNaN(contact.getTime())
        ? contact.toLocaleString()
        : 'Last contact unavailable',
  };
}
