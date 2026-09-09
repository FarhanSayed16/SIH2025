/**
 * WB6 parent + map honesty helpers
 */

import { describe, it, expect } from 'vitest';
import {
  resolveParentSafetyDisplay,
  formatParentStatusLabel,
  hasFiniteCoordinates,
  childSafetyHref,
  normalizeMapDataEnvelope,
  deviceHealthColor,
} from '../../lib/api/parent-honesty';

describe('WB6 parent status provenance', () => {
  it('does not treat legacy safe without report time as reported safe', () => {
    const legacy = resolveParentSafetyDisplay({
      safetyStatus: 'safe',
      statusReportedAt: null,
    });
    expect(legacy.status).toBe('unknown');
    expect(legacy.provenance).toBe('unconfirmed');
  });

  it('accepts explicit reported safe', () => {
    const reported = resolveParentSafetyDisplay({
      safetyStatus: 'safe',
      statusReportedAt: '2026-09-09T10:00:00.000Z',
    });
    expect(reported.status).toBe('safe');
    expect(reported.provenance).toBe('reported');
  });

  it('prefers active drill over stored status', () => {
    const d = resolveParentSafetyDisplay({
      safetyStatus: 'safe',
      statusReportedAt: '2026-09-09T10:00:00.000Z',
      inActiveDrill: true,
    });
    expect(d.status).toBe('in_drill');
  });

  it('labels unknown honestly', () => {
    expect(formatParentStatusLabel('unknown')).toMatch(/unavailable/i);
    expect(formatParentStatusLabel('safe')).toMatch(/safe/i);
  });
});

describe('WB6 coordinates and destinations', () => {
  it('preserves finite zero coordinates', () => {
    expect(hasFiniteCoordinates(0, 0)).toBe(true);
    expect(hasFiniteCoordinates(null, 1)).toBe(false);
    expect(hasFiniteCoordinates(undefined, undefined)).toBe(false);
  });

  it('routes safety to child Safety tab', () => {
    expect(childSafetyHref('abc')).toBe('/parent/children/abc?tab=safety');
  });
});

describe('WB6 map envelope', () => {
  it('unwraps nested blueprint and layer arrays', () => {
    const n = normalizeMapDataEnvelope({
      blueprint: {
        imageUrl: 'https://example.test/bp.png',
        bounds: [77, 28, 78, 29],
      },
      equipment: [{ id: 1 }],
      exits: [],
      rooms: [{ id: 'r1' }],
      hazards: [],
    });
    expect(n.blueprint?.imageUrl).toContain('bp.png');
    expect(n.equipment).toHaveLength(1);
    expect(n.rooms).toHaveLength(1);
    expect(n.hasCampusLayers).toBe(true);
  });

  it('does not invent campus layers from empty payload', () => {
    const n = normalizeMapDataEnvelope({});
    expect(n.hasCampusLayers).toBe(false);
    expect(n.blueprint).toBeNull();
  });

  it('keeps unknown device health neutral (not green)', () => {
    expect(deviceHealthColor(undefined)).toBe('#9ca3af');
    expect(deviceHealthColor('healthy')).toBe('#22c55e');
    expect(deviceHealthColor('weird')).toBe('#9ca3af');
  });
});
