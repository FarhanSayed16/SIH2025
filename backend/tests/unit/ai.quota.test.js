import { describe, it, expect } from '@jest/globals';
import { isGeminiQuotaError } from '../../src/services/ai.service.js';

describe('Gemini quota error shape', () => {
  it('treats 429 and quota messages as quota errors (maps to HTTP 503)', () => {
    expect(isGeminiQuotaError({ status: 429, message: 'rate limited' })).toBe(true);
    expect(isGeminiQuotaError({ message: 'RESOURCE_EXHAUSTED: quota exceeded' })).toBe(true);
    expect(isGeminiQuotaError({ message: 'Too Many Requests' })).toBe(true);
    expect(isGeminiQuotaError({ message: 'network timeout' })).toBe(false);
  });
});
