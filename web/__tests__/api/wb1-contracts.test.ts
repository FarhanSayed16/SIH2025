/**
 * WB1 contract helpers — drills unwrap/status and classroom QR normalize
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  normalizeDrillStatus,
  isDrillInProgress,
  unwrapDrillPayload,
  unwrapDrillList,
  drillActualDurationMinutes,
  drillsApi,
  normalizeDrill,
} from '../../lib/api/drills';
import { normalizeClassroomQR, classroomApi } from '../../lib/api/classroom';
import { apiClient } from '../../lib/api/client';

vi.mock('../../lib/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('WB1 drill contracts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('maps legacy active → in_progress', () => {
    expect(normalizeDrillStatus('active')).toBe('in_progress');
    expect(isDrillInProgress('active')).toBe(true);
    expect(isDrillInProgress('in_progress')).toBe(true);
    expect(isDrillInProgress('scheduled')).toBe(false);
  });

  it('unwraps nested { drill } detail payloads', () => {
    const drill = unwrapDrillPayload({
      drill: {
        _id: 'd1',
        status: 'in_progress',
        type: 'fire',
        scheduledAt: '2026-01-01T00:00:00.000Z',
        completedAt: null,
        institutionId: 'inst1',
      },
    });
    expect(drill?._id).toBe('d1');
    expect(drill?.status).toBe('in_progress');
    expect(drill?.schoolId).toBe('inst1');
  });

  it('aliases completionTime from completedAt', () => {
    const drill = normalizeDrill({
      _id: 'd2',
      status: 'completed',
      type: 'flood',
      scheduledAt: '2026-01-01T00:00:00.000Z',
      completedAt: '2026-01-01T00:12:00.000Z',
    });
    expect(drill.completedAt).toBe('2026-01-01T00:12:00.000Z');
    expect(drill.completionTime).toBe('2026-01-01T00:12:00.000Z');
  });

  it('never invents a five-minute AI duration', () => {
    expect(
      drillActualDurationMinutes({
        scheduledAt: '2026-01-01T00:00:00.000Z',
      })
    ).toBeUndefined();
    expect(
      drillActualDurationMinutes({
        scheduledAt: '2026-01-01T00:00:00.000Z',
        actualStart: '2026-01-01T00:00:00.000Z',
        completedAt: '2026-01-01T00:10:00.000Z',
      })
    ).toBe(10);
  });

  it('normalizes list arrays', () => {
    const list = unwrapDrillList([
      { _id: 'a', status: 'active', type: 'fire', scheduledAt: 'x' },
    ]);
    expect(list[0].status).toBe('in_progress');
  });

  it('getById returns unwrapped drill from { drill }', async () => {
    (apiClient.get as any).mockResolvedValue({
      success: true,
      data: {
        drill: {
          _id: 'd9',
          status: 'scheduled',
          type: 'earthquake',
          scheduledAt: '2026-02-01T00:00:00.000Z',
          institutionId: 's1',
        },
      },
    });
    const res = await drillsApi.getById('d9');
    expect(res.data?._id).toBe('d9');
    expect(res.data?.status).toBe('scheduled');
  });
});

describe('WB1 classroom QR contracts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('normalizes qrImage/qrString from server payload', () => {
    const qr = normalizeClassroomQR({
      qrImage: 'data:image/png;base64,abc',
      qrString: '{"classId":"c1"}',
      expiresAt: '2026-09-10T00:00:00.000Z',
      class: { _id: 'c1', classCode: '5A' },
    });
    expect(qr?.qrImage).toMatch(/^data:image/);
    expect(qr?.qrString).toContain('classId');
    expect(qr?.qrCode).toContain('classId');
    expect(qr?.classId).toBe('c1');
  });

  it('generateQR returns normalized data', async () => {
    (apiClient.post as any).mockResolvedValue({
      success: true,
      data: {
        qrImage: 'data:image/png;base64,xyz',
        qrString: 'payload',
        expiresAt: '2026-09-10T00:00:00.000Z',
        classId: 'c2',
      },
    });
    const res = await classroomApi.generateQR('c2');
    expect(res.data?.qrImage).toBe('data:image/png;base64,xyz');
    expect(res.data?.qrCode).toBe('payload');
  });
});
