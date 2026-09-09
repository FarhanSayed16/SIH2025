/**
 * WB8 scenario progression + gallery caption honesty
 */

import { describe, it, expect } from 'vitest';
import {
  isQuotaLimited,
  isValidScenarioAdvance,
  appendAcceptedStep,
  normalizeScenarioOptions,
  galleryLabelForSrc,
  WEB_GALLERY_CORRECT_LABELS,
  feedbackSectionTitle,
} from '../../lib/api/wb8-scenario';

describe('WB8 scenario advance validation', () => {
  it('rejects quota fallback as an accepted advance', () => {
    expect(
      isValidScenarioAdvance({
        nextScenario: 'Practice mode smoke…',
        options: ['A', 'B'],
        isGameOver: false,
        quotaLimited: true,
      })
    ).toBe(false);
    expect(isQuotaLimited({ quotaLimited: true })).toBe(true);
  });

  it('rejects non-terminal steps with no options', () => {
    expect(
      isValidScenarioAdvance({
        nextScenario: 'Something happens.',
        options: [],
        isGameOver: false,
        quotaLimited: false,
      })
    ).toBe(false);
  });

  it('accepts game over without options', () => {
    expect(
      isValidScenarioAdvance({
        nextScenario: 'You reach the assembly point.',
        options: [],
        isGameOver: true,
      })
    ).toBe(true);
  });

  it('accepts a normal step with options', () => {
    expect(
      isValidScenarioAdvance({
        nextScenario: 'Smoke thickens.',
        options: ['Leave', 'Stay'],
        isGameOver: false,
      })
    ).toBe(true);
  });

  it('appends history only via helper after acceptance', () => {
    const next = appendAcceptedStep(
      [],
      { scenario: 'Lab', choice: 'Tell teacher' },
      'Teacher calls for help.'
    );
    expect(next).toHaveLength(1);
    expect(next[0].choice).toBe('Tell teacher');
    expect(next[0].consequence).toContain('Teacher');
  });

  it('normalizes options and drops empties', () => {
    expect(normalizeScenarioOptions([' A ', '', null as any, 'B'])).toEqual(['A', 'B']);
  });

  it('labels narrative feedback without inventing a score title', () => {
    expect(feedbackSectionTitle()).toMatch(/Feedback on your choices/i);
    expect(feedbackSectionTitle().toLowerCase()).not.toContain('score');
  });
});

describe('WB8 gallery caption corrections', () => {
  it('maps inventory files to plan-accurate labels', () => {
    expect(galleryLabelForSrc('/gallery/web/teacher-4.png')).toMatch(/QR/i);
    expect(galleryLabelForSrc('/gallery/web/teacher-12.png')).toMatch(/Map/i);
    expect(galleryLabelForSrc('/gallery/web/admin-19.png')).toMatch(/scenario/i);
    expect(galleryLabelForSrc('/gallery/web/teacher-10.png')).toMatch(/Broadcast/i);
  });

  it('covers all W01–W18 web gallery files', () => {
    expect(Object.keys(WEB_GALLERY_CORRECT_LABELS)).toHaveLength(18);
  });
});
