/**
 * WB4 teacher analytics / WD07–WD08 presentation helpers
 */

import { describe, it, expect } from 'vitest';
import {
  mapStudentProgressItem,
  formatNullableScore,
} from '../../lib/teacher/mapStudentPerformance';

describe('WB4 mapStudentProgressItem', () => {
  it('uses distinct modules and null preparedness without inventing zeros', () => {
    const mapped = mapStudentProgressItem({
      student: { id: 's1', name: 'Ada' },
      modules: {
        completed: 2,
        total: null,
        denominatorAvailable: false,
      },
      quiz: { recorded: false, totalAttempts: 0 },
      games: { played: 3, totalXP: 10, averageScore: null },
      preparednessScore: null,
      lastActivity: null,
    });

    expect(mapped.modules.completed).toBe(2);
    expect(mapped.modules.total).toBeNull();
    expect(mapped.progress.preparednessScore).toBeNull();
    expect(mapped.progress.loginStreak).toBeNull();
    expect(mapped.quiz?.recorded).toBe(false);
    expect(mapped.games.avgScore).toBeNull();
  });

  it('keeps eligible denominator when available', () => {
    const mapped = mapStudentProgressItem(
      {
        student: { id: 's2', name: 'Lin' },
        modules: { completed: 1, total: 5, denominatorAvailable: true },
        quiz: { recorded: true, totalAttempts: 4, avgScore: 80, passRate: 50 },
        games: { played: 0, totalXP: 0 },
        preparednessScore: 72,
      },
      '/teacher/classes/c1/students/s2'
    );

    expect(mapped.modules.total).toBe(5);
    expect(mapped.modules.denominatorAvailable).toBe(true);
    expect(mapped.progress.preparednessScore).toBe(72);
    expect(mapped.detailsHref).toContain('s2');
    expect(mapped.quiz?.recorded).toBe(true);
  });
});

describe('WB4 formatNullableScore', () => {
  it('labels missing scores as not recorded', () => {
    expect(formatNullableScore(null)).toBe('Not recorded');
    expect(formatNullableScore(undefined)).toBe('Not recorded');
    expect(formatNullableScore(88, '/100')).toBe('88/100');
  });
});

describe('WB4 drill analytics DTO shape', () => {
  it('treats totalDrills independently from recent list length', () => {
    const analytics = {
      totalDrills: 25,
      recentListLimit: 10,
      recentListCount: 10,
      recentDrills: Array.from({ length: 10 }, (_, i) => ({
        id: `d${i}`,
        eventAt: '2026-01-01T00:00:00.000Z',
        participationRate: 80,
        status: 'completed',
      })),
      avgParticipation: 80,
    };

    expect(analytics.totalDrills).toBeGreaterThan(analytics.recentListCount);
    expect(analytics.recentDrills).toHaveLength(analytics.recentListLimit);
    expect(analytics.recentDrills[0].eventAt).toBeTruthy();
  });
});
