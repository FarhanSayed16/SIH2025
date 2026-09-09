/**
 * WB9 cross-route honesty helpers
 */

import { describe, it, expect } from 'vitest';
import { isDrillInProgress } from '../../lib/api/drills';
import {
  NO_ALERTS_NOT_ALL_CLEAR,
  PASTE_ONLY_QR_HINT,
  WD06_QR_REVOKE_DISCLAIMER,
  marketingAltAvoidsInventedSafetyScore,
} from '../../lib/api/wb9-honesty';
import { WEB_GALLERY_CORRECT_LABELS } from '../../lib/api/wb8-scenario';
import { SHOT_SLOTS } from '../../lib/landing/shot-config';

describe('WB9 drill status consistency', () => {
  it('treats normalized in_progress as active for filters', () => {
    expect(isDrillInProgress('in_progress')).toBe(true);
    expect(isDrillInProgress('active')).toBe(true);
    expect(isDrillInProgress('scheduled')).toBe(false);
  });
});

describe('WB9 honesty copy', () => {
  it('does not claim all-clear from empty alerts', () => {
    expect(NO_ALERTS_NOT_ALL_CLEAR.toLowerCase()).toMatch(/not an all-clear|not.*normal safety claim/);
  });

  it('keeps paste-only QR wording', () => {
    expect(PASTE_ONLY_QR_HINT).toMatch(/paste/i);
    expect(PASTE_ONLY_QR_HINT.toLowerCase()).not.toContain('start camera');
  });

  it('records WD06 deferral without promising revoke', () => {
    expect(WD06_QR_REVOKE_DISCLAIMER.toLowerCase()).toMatch(/not claimed rejected|not.*rejected/);
  });
});

describe('WB9 marketing alts', () => {
  it('shot-config alts do not invent safety score', () => {
    for (const slot of SHOT_SLOTS) {
      expect(marketingAltAvoidsInventedSafetyScore(slot.alt)).toBe(true);
    }
  });

  it('gallery inventory still covers 18 web shots', () => {
    expect(Object.keys(WEB_GALLERY_CORRECT_LABELS)).toHaveLength(18);
  });
});
