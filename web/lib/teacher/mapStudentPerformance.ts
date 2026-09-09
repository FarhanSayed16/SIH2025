/**
 * Map getStudentProgress row → StudentPerformanceCard props (WB4 / WD07).
 */

import type { StudentPerformanceData } from '@/components/teacher/StudentPerformanceCard';

export function mapStudentProgressItem(
  item: any,
  detailsHref?: string
): StudentPerformanceData {
  const quizRecorded =
    item?.quiz?.recorded === true || (item?.quiz?.totalAttempts ?? 0) > 0;

  return {
    student: {
      id: String(item?.student?.id || item?.student?._id || ''),
      name: item?.student?.name || 'Unknown',
      email: item?.student?.email,
      grade: item?.student?.grade,
      section: item?.student?.section,
    },
    modules: {
      completed: item?.modules?.completed || 0,
      inProgress: item?.modules?.inProgress || 0,
      total: item?.modules?.total ?? null,
      denominatorAvailable: item?.modules?.denominatorAvailable,
    },
    quiz: quizRecorded
      ? {
          totalAttempts: item.quiz?.totalAttempts ?? 0,
          avgScore: item.quiz?.avgScore ?? null,
          passRate: item.quiz?.passRate ?? null,
          recorded: true,
        }
      : { recorded: false },
    games: {
      totalGames: item?.games?.played ?? item?.games?.totalGames ?? 0,
      totalXP: item?.games?.totalXP || 0,
      avgScore: item?.games?.averageScore ?? item?.games?.avgScore ?? null,
    },
    progress: {
      preparednessScore:
        item?.preparednessScore ?? item?.progress?.preparednessScore ?? null,
      loginStreak: item?.loginStreak ?? item?.progress?.loginStreak ?? null,
    },
    lastActivity: item?.lastActivity ?? null,
    detailsHref,
  };
}

export function formatNullableScore(value: number | null | undefined, suffix = ''): string {
  if (value == null || !Number.isFinite(value)) return 'Not recorded';
  return `${value}${suffix}`;
}
