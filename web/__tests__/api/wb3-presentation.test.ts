/**
 * WB3 dashboard / classes presentation helpers
 */

import { describe, it, expect } from 'vitest';
import { isDrillInProgress, normalizeDrillStatus } from '../../lib/api/drills';
import { classHasServerQRHash } from '../../components/teacher/ClassroomQRShareDialog';

describe('WB3 dashboard drill filters', () => {
  it('treats in_progress as active and scheduled separately from completed', () => {
    const drills = [
      { status: 'scheduled' },
      { status: 'in_progress' },
      { status: 'active' },
      { status: 'completed' },
      { status: 'completed' },
    ];
    const active = drills.filter((d) => isDrillInProgress(d.status));
    const scheduled = drills.filter((d) => normalizeDrillStatus(d.status) === 'scheduled');
    const completed = drills.filter((d) => d.status === 'completed');
    expect(active).toHaveLength(2);
    expect(scheduled).toHaveLength(1);
    expect(completed).toHaveLength(2);
  });
});

describe('WB3 QR session honesty', () => {
  it('detects server hash presence without inventing an image', () => {
    expect(classHasServerQRHash('ABC123')).toBe(true);
    expect(classHasServerQRHash(undefined)).toBe(false);
    expect(classHasServerQRHash(null)).toBe(false);
  });
});
