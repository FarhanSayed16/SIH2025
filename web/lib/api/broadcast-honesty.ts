/**
 * Broadcast honesty helpers (WB5 / WD10–WD11) — pure UI/client presentation.
 */

export type BroadcastChannel = 'sms' | 'email' | 'push';

export function resolveComposerChannels(
  selected: BroadcastChannel[],
  options?: { requireNonEmpty?: boolean }
): BroadcastChannel[] | null {
  const unique = Array.from(new Set(selected.filter(Boolean)));
  if (unique.length === 0) {
    return options?.requireNonEmpty === false ? [] : null;
  }
  return unique;
}

/** Delivery rate only when receipts exist; never invent 0% failure from delivered=0. */
export function formatDeliveryReceiptLabel(stats?: {
  totalRecipients?: number;
  delivered?: number;
} | null): { label: string; showRate: boolean; rateText?: string } {
  const delivered = stats?.delivered;
  const total = stats?.totalRecipients;
  if (delivered == null || delivered <= 0) {
    return {
      label: 'Delivery receipts unavailable',
      showRate: false,
    };
  }
  if (total != null && total > 0) {
    const rate = ((delivered / total) * 100).toFixed(1);
    return {
      label: 'Delivery receipts',
      showRate: true,
      rateText: `${rate}%`,
    };
  }
  return {
    label: 'Delivery receipts',
    showRate: true,
    rateText: String(delivered),
  };
}

export function broadcastSuccessMessage(opts: {
  scheduled: boolean;
  status?: string;
}): string {
  if (opts.scheduled) {
    return 'Broadcast scheduled. It has not been sent yet.';
  }
  if (opts.status === 'failed') {
    return 'Broadcast recorded as failed — no channel send succeeded.';
  }
  return 'Broadcast send submitted. Channel send counts are shown in history; delivery receipts may be unavailable.';
}
