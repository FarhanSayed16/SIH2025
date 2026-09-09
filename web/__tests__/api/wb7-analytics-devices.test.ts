/**
 * WB7 analytics + devices honesty helpers
 */

import { describe, it, expect } from 'vitest';
import {
  formatMetricOrUnavailable,
  analyticsRequestKey,
  mapTabToReportType,
  registrationLabel,
  healthLabel,
  formatAxisValue,
  resolveSampleVsContact,
} from '../../lib/api/wb7-honesty';

describe('WB7 analytics metrics', () => {
  it('does not invent 0 for null/undefined averages', () => {
    expect(formatMetricOrUnavailable(null)).toBe('Unavailable');
    expect(formatMetricOrUnavailable(undefined, { suffix: '%' })).toBe('Unavailable');
    expect(formatMetricOrUnavailable(Number.NaN)).toBe('Unavailable');
  });

  it('preserves valid zero', () => {
    expect(formatMetricOrUnavailable(0, { suffix: '%' })).toBe('0%');
    expect(formatMetricOrUnavailable(12.34, { decimals: 1, suffix: 's' })).toBe('12.3s');
  });

  it('scopes request keys by tab and applied dates', () => {
    expect(analyticsRequestKey('drills', '2026-01-01', '2026-01-31')).toBe(
      'drills|2026-01-01|2026-01-31'
    );
    expect(analyticsRequestKey('drills', '', '')).not.toBe(
      analyticsRequestKey('students', '', '')
    );
  });

  it('maps tabs to report types for export', () => {
    expect(mapTabToReportType('drills')).toBe('drill_summary');
    expect(mapTabToReportType('institution')).toBe('institution_overview');
  });
});

describe('WB7 device labels and axes', () => {
  it('separates registration from health wording', () => {
    expect(registrationLabel('active')).toMatch(/Registered/i);
    expect(healthLabel('healthy')).toMatch(/telemetry/i);
    expect(healthLabel(null)).toMatch(/unknown/i);
  });

  it('keeps valid zero axes and marks missing unavailable', () => {
    expect(formatAxisValue(0)).toBe('0.00');
    expect(formatAxisValue(undefined)).toBe('Unavailable');
    expect(formatAxisValue(null)).toBe('Unavailable');
  });

  it('does not relabel lastSeen as sample time', () => {
    const r = resolveSampleVsContact({
      lastSeen: '2026-09-09T12:00:00.000Z',
      sampleTimestamp: null,
    });
    expect(r.sampleLabel).toMatch(/unavailable/i);
    expect(r.contactLabel).not.toMatch(/unavailable/i);
  });

  it('uses sampleTimestamp when present', () => {
    const r = resolveSampleVsContact({
      sampleTimestamp: '2026-09-09T11:00:00.000Z',
      lastSeen: '2026-09-09T12:00:00.000Z',
    });
    expect(r.sampleLabel).not.toMatch(/unavailable/i);
    expect(r.contactLabel).not.toMatch(/unavailable/i);
  });
});
