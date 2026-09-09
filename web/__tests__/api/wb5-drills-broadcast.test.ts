/**
 * WB5 drills + broadcast honesty helpers
 */

import { describe, it, expect } from 'vitest';
import {
  formatParticipantScope,
  countAcknowledgedParticipants,
  drillActualDurationMinutes,
  normalizeDrillStatus,
  isDrillInProgress,
} from '../../lib/api/drills';
import {
  resolveComposerChannels,
  formatDeliveryReceiptLabel,
  broadcastSuccessMessage,
} from '../../lib/api/broadcast-honesty';

describe('WB5 drill presentation', () => {
  it('maps active → in_progress and scopes labels', () => {
    expect(normalizeDrillStatus('active')).toBe('in_progress');
    expect(isDrillInProgress('active')).toBe(true);
    expect(formatParticipantScope({ type: 'all' })).toMatch(/Institution/i);
    expect(formatParticipantScope({ type: 'class', classIds: ['c1'] })).toMatch(/class/i);
  });

  it('never invents AI duration without actualStart + end', () => {
    expect(
      drillActualDurationMinutes({
        scheduledAt: '2026-01-01T10:00:00.000Z',
        actualStart: null,
        completedAt: '2026-01-01T10:05:00.000Z',
      })
    ).toBeUndefined();
    expect(
      drillActualDurationMinutes({
        scheduledAt: '2026-01-01T10:00:00.000Z',
        actualStart: '2026-01-01T10:00:00.000Z',
        completedAt: '2026-01-01T10:12:00.000Z',
      })
    ).toBe(12);
  });

  it('counts acknowledgements from participant objects', () => {
    expect(
      countAcknowledgedParticipants({
        _id: 'd1',
        type: 'fire',
        scheduledAt: '',
        status: 'completed',
        participants: [
          { userId: 'a', acknowledged: true },
          { userId: 'b', acknowledged: false },
        ],
      })
    ).toBe(1);
  });
});

describe('WB5 broadcast honesty', () => {
  it('refuses empty channel selection instead of silent push default', () => {
    expect(resolveComposerChannels([])).toBeNull();
    expect(resolveComposerChannels(['email', 'push'])).toEqual(['email', 'push']);
  });

  it('does not invent a 0% delivery rate from zero receipts', () => {
    const none = formatDeliveryReceiptLabel({ totalRecipients: 40, delivered: 0 });
    expect(none.showRate).toBe(false);
    expect(none.label).toMatch(/unavailable/i);

    const some = formatDeliveryReceiptLabel({ totalRecipients: 10, delivered: 4 });
    expect(some.showRate).toBe(true);
    expect(some.rateText).toBe('40.0%');
  });

  it('distinguishes scheduled vs send success copy', () => {
    expect(broadcastSuccessMessage({ scheduled: true })).toMatch(/not been sent/i);
    expect(broadcastSuccessMessage({ scheduled: false })).toMatch(/submitted/i);
  });
});
