/**
 * Individual Student Performance Detail (WB4)
 * Soft refresh; honest nulls; back to class performance tab.
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';
import { teacherApi } from '@/lib/api/teacher';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AppShell } from '@/components/layout/app-shell';
import { StudentPerformanceCard } from '@/components/teacher/StudentPerformanceCard';
import { ProgressChart, ChartDataPoint } from '@/components/teacher/ProgressChart';
import { PerformanceMetricsCard, MetricData } from '@/components/teacher/PerformanceMetricsCard';
import { ActivityTimeline } from '@/components/teacher/ActivityTimeline';
import { StudentParentsList } from '@/components/teacher/StudentParentsList';
import { QRCodeScanner } from '@/components/teacher/QRCodeScanner';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { useToast } from '@/components/ui/toast';
import {
  mapStudentProgressItem,
  formatNullableScore,
} from '@/lib/teacher/mapStudentPerformance';
import {
  ArrowLeft,
  BookOpen,
  Award,
  Gamepad2,
  TrendingUp,
  Target,
  Activity,
  BarChart3,
  RefreshCw,
} from 'lucide-react';

export default function StudentPerformanceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const classId = params.classId as string;
  const studentId = params.studentId as string;
  const { user, isAuthenticated, accessToken } = useAuthStore();
  const { showToast } = useToast();
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [studentData, setStudentData] = useState<any>(null);
  const [classSummary, setClassSummary] = useState<any>(null);
  const [showQRScanner, setShowQRScanner] = useState(false);

  const loadStudentData = useCallback(
    async (opts?: { soft?: boolean }) => {
      const soft = opts?.soft === true;
      if (soft) setIsRefreshing(true);
      else setIsInitialLoading(true);
      setLoadError(null);
      setNotFound(false);

      try {
        const response = await teacherApi.getStudentProgress(classId);
        if (response.success && response.data?.students) {
          const student = response.data.students.find(
            (s: any) =>
              String(s.student?.id) === String(studentId) ||
              String(s.student?._id) === String(studentId)
          );
          if (student) {
            setStudentData(student);
            setClassSummary(response.data.summary || null);
          } else {
            setStudentData(null);
            setNotFound(true);
          }
        } else {
          setLoadError(response.message || 'Failed to load student progress');
          if (!soft) setStudentData(null);
        }
      } catch (error: any) {
        console.error('Error loading student data:', error);
        setLoadError(error?.message || 'Failed to load student data');
        if (!soft) {
          setStudentData(null);
          showToast('Failed to load student data', 'error');
        }
      } finally {
        setIsInitialLoading(false);
        setIsRefreshing(false);
      }
    },
    [classId, studentId, showToast]
  );

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user?.role !== 'teacher') {
      router.push('/dashboard');
      return;
    }

    if (accessToken) {
      const { apiClient } = require('@/lib/api/client');
      apiClient.setToken(accessToken);
    }

    loadStudentData({ soft: false });
  }, [isAuthenticated, router, accessToken, user, classId, studentId, loadStudentData]);

  const backHref = `/teacher/classes/${classId}?tab=performance`;

  if (isInitialLoading) {
    return (
      <AppShell title="Student Performance">
        <LoadingSkeleton />
      </AppShell>
    );
  }

  if (loadError && !studentData) {
    return (
      <AppShell title="Student Performance">
        <Card className="p-12">
          <EmptyState
            title="Could not load student"
            description={loadError}
            icon={<Award className="w-12 h-12 text-gray-400" />}
          />
          <div className="mt-4 flex gap-2">
            <Button onClick={() => loadStudentData({ soft: false })} variant="outline">
              Retry
            </Button>
            <Button onClick={() => router.push(backHref)} variant="outline">
              Back to class
            </Button>
          </div>
        </Card>
      </AppShell>
    );
  }

  if (notFound || !studentData) {
    return (
      <AppShell title="Student Performance">
        <Card className="p-12">
          <EmptyState
            title="Student not in this class payload"
            description="The student was not found in getStudentProgress for this class, or you may not have access"
            icon={<Award className="w-12 h-12 text-gray-400" />}
          />
          <Button onClick={() => router.push(backHref)} className="mt-4" variant="outline">
            Back to class
          </Button>
        </Card>
      </AppShell>
    );
  }

  const performanceData = mapStudentProgressItem(studentData);
  const denomOk =
    performanceData.modules.denominatorAvailable !== false &&
    performanceData.modules.total != null &&
    performanceData.modules.total > 0;
  const completionRate = denomOk
    ? Math.round(
        (performanceData.modules.completed / (performanceData.modules.total as number)) * 100
      )
    : null;

  const quiz = performanceData.quiz;
  const quizRecorded = quiz?.recorded === true;

  const metrics: MetricData[] = [
    {
      label: 'Distinct modules passed',
      value: denomOk
        ? `${performanceData.modules.completed}/${performanceData.modules.total}`
        : String(performanceData.modules.completed),
      icon: <BookOpen className="w-5 h-5" />,
      color: 'purple',
    },
    {
      label: 'Quiz attempts',
      value: quizRecorded ? String(quiz?.totalAttempts ?? 0) : 'Not recorded',
      icon: <Award className="w-5 h-5" />,
      color: 'blue',
    },
    {
      label: 'Games recorded',
      value: performanceData.games.totalGames,
      icon: <Gamepad2 className="w-5 h-5" />,
      color: 'green',
    },
    {
      label: 'Preparedness',
      value: formatNullableScore(performanceData.progress.preparednessScore, '/100'),
      icon: <Target className="w-5 h-5" />,
      color: 'indigo',
    },
  ];

  const progressChartData: ChartDataPoint[] = [
    {
      name: 'Modules passed',
      value: performanceData.modules.completed,
    },
    {
      name: 'Quiz attempts',
      value: quizRecorded ? quiz?.totalAttempts ?? 0 : 0,
    },
    {
      name: 'Games',
      value: performanceData.games.totalGames,
    },
  ];
  if (performanceData.progress.preparednessScore != null) {
    progressChartData.push({
      name: 'Preparedness',
      value: performanceData.progress.preparednessScore,
    });
  }

  return (
    <AppShell title="Student Performance">
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <Button
            onClick={() => router.push(backHref)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to class
          </Button>
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => loadStudentData({ soft: true })}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh progress
          </Button>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <div className="w-12 h-12 bg-teal-800 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          {performanceData.student.name}
        </h1>
        <p className="text-gray-600 mt-2">Recorded learning progress for this student</p>
        {loadError && (
          <p className="text-sm text-amber-800 mt-2">
            Soft refresh issue: {loadError} (showing last successful payload)
          </p>
        )}
      </div>

      <div className="mb-6">
        <StudentPerformanceCard data={performanceData} showDetails={false} />
      </div>

      <div className="mb-6">
        <PerformanceMetricsCard metrics={metrics} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ProgressChart
          data={progressChartData}
          type="bar"
          title="Recorded totals (not a time series)"
          dataKey="value"
          xAxisKey="name"
          color="#0f766e"
        />

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Module completion</h3>
          {completionRate != null ? (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600">Passed / eligible curriculum</span>
                  <span className="font-semibold text-teal-800">{completionRate}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className="bg-teal-700 h-4 rounded-full"
                    style={{ width: `${completionRate}%` }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {performanceData.modules.completed}
                  </div>
                  <div className="text-xs text-gray-500">Distinct passed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {performanceData.modules.total}
                  </div>
                  <div className="text-xs text-gray-500">Eligible modules</div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-600">
              {performanceData.modules.completed} distinct module(s) passed. Eligible curriculum
              size is not configured for this class grade, so a completion percentage is not shown.
            </p>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <StudentParentsList studentId={studentId} onScanQR={() => setShowQRScanner(true)} />
        <ActivityTimeline
          studentId={studentId}
          classId={classId}
          autoRefresh={true}
          refreshInterval={30000}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-teal-700" />
            Quiz
          </h3>
          {quizRecorded ? (
            <div className="space-y-3">
              <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700">Attempts</span>
                <span className="font-semibold">{quiz?.totalAttempts ?? 0}</span>
              </div>
              <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700">Average score</span>
                <span className="font-semibold">
                  {formatNullableScore(quiz?.avgScore ?? null, '%')}
                </span>
              </div>
              <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700">Pass rate (modules passed / attempted)</span>
                <span className="font-semibold">
                  {formatNullableScore(quiz?.passRate ?? null, '%')}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-600">No quiz attempts recorded for this student.</p>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-teal-700" />
            Games
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-700">Games recorded</span>
              <span className="font-semibold">{performanceData.games.totalGames}</span>
            </div>
            <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-700">Total XP</span>
              <span className="font-semibold">{performanceData.games.totalXP}</span>
            </div>
            <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-700">Average score</span>
              <span className="font-semibold">
                {formatNullableScore(performanceData.games.avgScore)}
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-teal-700" />
            Activity
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-700">Login streak</span>
              <span className="font-semibold">
                {performanceData.progress.loginStreak != null
                  ? `${performanceData.progress.loginStreak} days`
                  : 'Not provided by this endpoint'}
              </span>
            </div>
            <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-700">Preparedness</span>
              <span className="font-semibold">
                {formatNullableScore(performanceData.progress.preparednessScore, '/100')}
              </span>
            </div>
            <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-700">Last learning activity</span>
              <span className="text-sm font-medium">
                {performanceData.lastActivity
                  ? new Date(performanceData.lastActivity).toLocaleString()
                  : 'Not recorded'}
              </span>
            </div>
          </div>
        </Card>

        {classSummary && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-teal-700" />
              Class comparison
            </h3>
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Distinct modules passed</div>
                <div className="flex justify-between">
                  <span className="font-semibold">{performanceData.modules.completed}</span>
                  <span className="text-sm text-gray-500">
                    Class avg: {classSummary.avgDistinctModulesCompleted ?? '—'}
                  </span>
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Preparedness</div>
                <div className="flex justify-between">
                  <span className="font-semibold">
                    {formatNullableScore(performanceData.progress.preparednessScore)}
                  </span>
                  <span className="text-sm text-gray-500">
                    Class avg:{' '}
                    {classSummary.avgPreparednessScore != null
                      ? classSummary.avgPreparednessScore
                      : '—'}
                    {classSummary.preparednessSampleSize != null
                      ? ` (n=${classSummary.preparednessSampleSize})`
                      : ''}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>

      <QRCodeScanner
        isOpen={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        onVerified={() => setShowQRScanner(false)}
      />
    </AppShell>
  );
}
