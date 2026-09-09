/**
 * Reusable Student Performance Card — honest null/unknown handling (WB4).
 */

'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Award, BookOpen, Gamepad2, TrendingUp, Clock } from 'lucide-react';

export interface StudentPerformanceData {
  student: {
    id: string;
    name: string;
    email?: string;
    grade?: string;
    section?: string;
  };
  modules: {
    completed: number;
    inProgress?: number;
    /** Eligible denominator; null when curriculum size unknown */
    total: number | null;
    denominatorAvailable?: boolean;
  };
  quiz?: {
    totalQuizzes?: number;
    totalAttempts?: number;
    avgScore?: number | null;
    passRate?: number | null;
    recorded?: boolean;
  } | null;
  games: {
    totalGames: number;
    totalXP: number;
    avgScore: number | null;
  };
  progress: {
    preparednessScore: number | null;
    loginStreak?: number | null;
  };
  lastActivity?: string | Date | null;
  detailsHref?: string;
}

interface StudentPerformanceCardProps {
  data: StudentPerformanceData;
  showDetails?: boolean;
}

function formatDate(date?: string | Date | null) {
  if (!date) return 'Not recorded';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return 'Not recorded';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function StudentPerformanceCard({ data, showDetails = true }: StudentPerformanceCardProps) {
  const denomOk =
    data.modules.denominatorAvailable !== false &&
    data.modules.total != null &&
    data.modules.total > 0;
  const completionLabel = denomOk
    ? `${data.modules.completed}/${data.modules.total} modules passed`
    : `${data.modules.completed} distinct modules passed`;
  const completionRate = denomOk
    ? Math.round((data.modules.completed / (data.modules.total as number)) * 100)
    : null;

  const body = (
    <>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-teal-700 rounded-full flex items-center justify-center text-white font-bold text-lg">
            {data.student.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{data.student.name}</h3>
            {(data.student.grade || data.student.section) && (
              <p className="text-xs text-gray-500">
                {data.student.grade && `Grade ${data.student.grade}`}
                {data.student.grade && data.student.section && ' · '}
                {data.student.section && `Section ${data.student.section}`}
              </p>
            )}
          </div>
        </div>
        {data.progress.preparednessScore != null ? (
          <div className="text-right">
            <div className="text-xs text-gray-500">Preparedness</div>
            <div className="text-lg font-semibold text-gray-900">
              {data.progress.preparednessScore}
              <span className="text-xs text-gray-500 font-normal">/100</span>
            </div>
          </div>
        ) : (
          <div className="text-right text-xs text-gray-500">Preparedness unavailable</div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-start gap-2">
          <BookOpen className="w-4 h-4 text-gray-400 mt-0.5" />
          <div>
            <div className="text-gray-500 text-xs">Modules</div>
            <div className="font-medium text-gray-900">{completionLabel}</div>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <Gamepad2 className="w-4 h-4 text-gray-400 mt-0.5" />
          <div>
            <div className="text-gray-500 text-xs">Games recorded</div>
            <div className="font-medium text-gray-900">{data.games.totalGames}</div>
          </div>
        </div>
        <div className="flex items-start gap-2 col-span-2">
          <Clock className="w-4 h-4 text-gray-400 mt-0.5" />
          <div>
            <div className="text-gray-500 text-xs">Last recorded learning activity</div>
            <div className="font-medium text-gray-900">{formatDate(data.lastActivity)}</div>
          </div>
        </div>
      </div>

      {completionRate != null && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-gray-600">Passed modules / eligible curriculum</span>
            <span className="font-semibold text-teal-800">{completionRate}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-teal-700 h-2 rounded-full"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>
      )}

      {showDetails && data.detailsHref && (
        <p className="mt-3 text-sm text-teal-800 font-medium">Open details →</p>
      )}
    </>
  );

  if (data.detailsHref) {
    return (
      <Link
        href={data.detailsHref}
        className="block rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
      >
        <Card className="p-4 h-full border border-gray-200 shadow-sm hover:border-teal-600/40 transition-colors">
          {body}
        </Card>
      </Link>
    );
  }

  return <Card className="p-4 border border-gray-200 shadow-sm">{body}</Card>;
}
