/**
 * Teacher Analytics Dashboard (WB4)
 * WD07/WD08: honest denominators, class-scoped payloads, drill history vs totals.
 */

'use client';

import { AppShell } from '@/components/layout/app-shell';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store/auth-store';
import { teacherApi } from '@/lib/api/teacher';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { StudentPerformanceCard } from '@/components/teacher/StudentPerformanceCard';
import { ProgressChart, ChartDataPoint } from '@/components/teacher/ProgressChart';
import { PerformanceMetricsCard, MetricData } from '@/components/teacher/PerformanceMetricsCard';
import { mapStudentProgressItem, formatNullableScore } from '@/lib/teacher/mapStudentPerformance';
import {
  Users,
  BookOpen,
  Gamepad2,
  Target,
  BarChart3,
  Activity,
  RefreshCw,
  Search,
} from 'lucide-react';

type TabType = 'overview' | 'students' | 'drills' | 'performance';

interface ClassData {
  _id: string;
  grade: string;
  section: string;
  classCode: string;
  studentIds?: any[];
}

interface StudentProgressData {
  classId: string;
  totalStudents: number;
  eligibleModuleCount?: number | null;
  denominatorAvailable?: boolean;
  students: any[];
  summary?: {
    totalStudents: number;
    avgDistinctModulesCompleted?: number;
    avgPreparednessScore?: number | null;
    preparednessSampleSize?: number;
    totalGamesPlayed?: number;
  };
}

const TAB_LABELS: Record<TabType, string> = {
  overview: 'Overview',
  students: 'Students',
  drills: 'Drill history',
  performance: 'Performance',
};

export default function TeacherAnalyticsPage() {
  const router = useRouter();
  const { user, isAuthenticated, accessToken } = useAuthStore();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [lastFetchedAt, setLastFetchedAt] = useState<string | null>(null);
  const [studentProgress, setStudentProgress] = useState<StudentProgressData | null>(null);
  const [progressClassId, setProgressClassId] = useState<string | null>(null);
  const [classAnalytics, setClassAnalytics] = useState<any>(null);
  const [analyticsClassId, setAnalyticsClassId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'modules' | 'games' | 'preparedness'>('preparedness');
  const [compareMetric, setCompareMetric] = useState<'modules' | 'games' | 'preparedness'>('preparedness');
  const selectedClassIdRef = useRef<string | null>(null);
  selectedClassIdRef.current = selectedClassId;

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

    loadClasses();
  }, [isAuthenticated, router, accessToken, user]);

  const loadClasses = async () => {
    setIsLoading(true);
    try {
      const response = await teacherApi.getClasses();
      if (response.success && response.data?.classes) {
        setClasses(response.data.classes);
        if (response.data.classes.length > 0 && !selectedClassId) {
          setSelectedClassId(response.data.classes[0]._id);
        }
      }
    } catch (error: any) {
      console.error('Error loading classes:', error);
      showToast('Failed to load classes', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const loadClassData = useCallback(async () => {
    if (!selectedClassId) return;
    const requestClassId = selectedClassId;

    setIsLoadingData(true);
    setLoadError(null);
    try {
      const [progressResponse, analyticsResponse] = await Promise.all([
        teacherApi.getStudentProgress(requestClassId),
        teacherApi.getClassAnalytics(requestClassId),
      ]);

      if (requestClassId !== selectedClassIdRef.current) return;

      if (progressResponse.success && progressResponse.data) {
        setStudentProgress(progressResponse.data as StudentProgressData);
        setProgressClassId(requestClassId);
      } else {
        setStudentProgress(null);
        setProgressClassId(null);
        setLoadError(progressResponse.message || 'Failed to load student progress');
      }

      if (analyticsResponse.success && analyticsResponse.data) {
        setClassAnalytics(analyticsResponse.data);
        setAnalyticsClassId(requestClassId);
      } else {
        setClassAnalytics(null);
        setAnalyticsClassId(null);
        if (!progressResponse.success) {
          // keep existing loadError
        } else if (!analyticsResponse.success) {
          setLoadError((prev) => prev || analyticsResponse.message || 'Failed to load drill analytics');
        }
      }

      setLastFetchedAt(new Date().toISOString());
    } catch (error: any) {
      if (requestClassId !== selectedClassIdRef.current) return;
      console.error('Error loading class data:', error);
      setLoadError(error?.message || 'Failed to load class data');
      setStudentProgress(null);
      setProgressClassId(null);
      setClassAnalytics(null);
      setAnalyticsClassId(null);
      showToast('Failed to load class data', 'error');
    } finally {
      if (requestClassId === selectedClassIdRef.current) {
        setIsLoadingData(false);
      }
    }
  }, [selectedClassId, showToast]);

  useEffect(() => {
    if (selectedClassId) {
      setStudentProgress(null);
      setProgressClassId(null);
      setClassAnalytics(null);
      setAnalyticsClassId(null);
      loadClassData();
    }
  }, [selectedClassId, loadClassData]);

  const selectedClass = classes.find((c) => c._id === selectedClassId);
  const scopedStudents =
    studentProgress && progressClassId === selectedClassId ? studentProgress.students : [];
  const scopedAnalytics =
    classAnalytics && analyticsClassId === selectedClassId ? classAnalytics : null;
  const hasScopedPayload = scopedStudents.length > 0 || !!scopedAnalytics || !!studentProgress;

  const filteredStudents = useMemo(() => {
    return scopedStudents
      .filter((item: any) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        const name = item.student?.name || '';
        const email = item.student?.email || '';
        return name.toLowerCase().includes(query) || email.toLowerCase().includes(query);
      })
      .sort((a: any, b: any) => {
        switch (sortBy) {
          case 'name': {
            const byName = (a.student?.name || '').localeCompare(b.student?.name || '');
            return byName !== 0
              ? byName
              : String(a.student?.id).localeCompare(String(b.student?.id));
          }
          case 'modules':
            return (b.modules?.completed || 0) - (a.modules?.completed || 0);
          case 'games':
            return (b.games?.played || 0) - (a.games?.played || 0);
          case 'preparedness': {
            const ap = a.preparednessScore;
            const bp = b.preparednessScore;
            if (ap == null && bp == null) {
              return String(a.student?.id).localeCompare(String(b.student?.id));
            }
            if (ap == null) return 1;
            if (bp == null) return -1;
            const diff = bp - ap;
            return diff !== 0
              ? diff
              : String(a.student?.id).localeCompare(String(b.student?.id));
          }
          default:
            return 0;
        }
      });
  }, [scopedStudents, searchQuery, sortBy]);

  const overviewMetrics: MetricData[] = useMemo(() => {
    if (!studentProgress?.summary || progressClassId !== selectedClassId) return [];
    const s = studentProgress.summary;
    return [
      {
        label: 'Students in class',
        value: s.totalStudents,
        icon: <Users className="w-5 h-5" />,
        color: 'blue',
      },
      {
        label: 'Avg distinct modules passed',
        value: s.avgDistinctModulesCompleted ?? '—',
        icon: <BookOpen className="w-5 h-5" />,
        color: 'purple',
      },
      {
        label: 'Avg preparedness (/100)',
        value:
          s.avgPreparednessScore != null
            ? `${s.avgPreparednessScore} (n=${s.preparednessSampleSize ?? '—'})`
            : 'No recorded scores',
        icon: <Target className="w-5 h-5" />,
        color: 'green',
      },
      {
        label: 'Games recorded',
        value: s.totalGamesPlayed ?? 0,
        icon: <Gamepad2 className="w-5 h-5" />,
        color: 'indigo',
      },
    ];
  }, [studentProgress, progressClassId, selectedClassId]);

  const compareDataKey =
    compareMetric === 'modules' ? 'modules' : compareMetric === 'games' ? 'games' : 'preparedness';

  const progressChartData: ChartDataPoint[] = useMemo(() => {
    return filteredStudents.slice(0, 10).map((item: any) => {
      const point: ChartDataPoint = {
        name: item.student?.name || 'Unknown',
        id: item.student?.id,
      };
      if (compareMetric === 'modules') point.modules = item.modules?.completed || 0;
      if (compareMetric === 'games') point.games = item.games?.played || 0;
      if (compareMetric === 'preparedness' && item.preparednessScore != null) {
        point.preparedness = item.preparednessScore;
      }
      return point;
    });
  }, [filteredStudents, compareMetric]);

  if (isLoading) {
    return (
      <AppShell title="Teacher Analytics">
        <LoadingSkeleton />
      </AppShell>
    );
  }

  return (
    <AppShell title="Teacher Analytics">
      <div className="mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="w-12 h-12 bg-teal-800 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              Teacher Analytics
            </h1>
            <p className="text-gray-600 mt-2">
              Class-scoped student progress and drill participation (recorded data only)
            </p>
            {lastFetchedAt && (
              <p className="text-xs text-gray-500 mt-1">
                Last fetched: {new Date(lastFetchedAt).toLocaleString()}
              </p>
            )}
          </div>
          <Button
            onClick={loadClassData}
            disabled={isLoadingData || !selectedClassId}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingData ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {classes.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <label htmlFor="analytics-class" className="text-sm font-medium text-gray-700">
              Select class
            </label>
            <select
              id="analytics-class"
              value={selectedClassId || ''}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
            >
              {classes.map((cls) => (
                <option key={cls._id} value={cls._id}>
                  Grade {cls.grade} - Section {cls.section} ({cls.classCode})
                </option>
              ))}
            </select>
            {selectedClass && (
              <div className="text-sm text-gray-600">
                {selectedClass.studentIds?.length ?? '—'} roster seats
              </div>
            )}
          </div>
        )}
      </div>

      {!selectedClassId ? (
        <Card className="p-12">
          <EmptyState
            title="No class selected"
            description="Select a class to view analytics"
            icon={<BarChart3 className="w-12 h-12 text-gray-400" />}
          />
        </Card>
      ) : isLoadingData && !hasScopedPayload && !loadError ? (
        <LoadingSkeleton />
      ) : loadError && !hasScopedPayload ? (
        <Card className="p-8">
          <EmptyState
            title="Could not load analytics"
            description={loadError}
            icon={<Activity className="w-12 h-12 text-gray-400" />}
          />
          <Button onClick={loadClassData} className="mt-4" variant="outline">
            Retry
          </Button>
        </Card>
      ) : (
        <>
          {loadError && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {loadError}{' '}
              <button type="button" className="underline font-medium" onClick={loadClassData}>
                Retry
              </button>
            </div>
          )}

          <div className="mb-6 border-b border-gray-200">
            <nav className="flex flex-wrap gap-4" aria-label="Analytics sections">
              {(Object.keys(TAB_LABELS) as TabType[]).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab
                      ? 'border-teal-700 text-teal-800'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {TAB_LABELS[tab]}
                </button>
              ))}
            </nav>
          </div>

          {activeTab === 'overview' && (
            <div className="space-y-6">
              {overviewMetrics.length > 0 && <PerformanceMetricsCard metrics={overviewMetrics} />}

              <Card className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Student comparison</h3>
                  <label className="text-sm text-gray-600 flex items-center gap-2">
                    Metric
                    <select
                      value={compareMetric}
                      onChange={(e) => setCompareMetric(e.target.value as typeof compareMetric)}
                      className="px-3 py-1.5 border border-gray-300 rounded-lg bg-white"
                    >
                      <option value="preparedness">Preparedness</option>
                      <option value="modules">Distinct modules passed</option>
                      <option value="games">Games recorded</option>
                    </select>
                  </label>
                </div>
                <p className="text-xs text-gray-500 mb-3">
                  Up to 10 students from the current Students sort/filter. Full names in tooltips.
                  Missing preparedness is omitted from the bar series.
                </p>
                <ProgressChart
                  data={progressChartData}
                  type="bar"
                  title=""
                  dataKey={compareDataKey}
                  xAxisKey="name"
                  color="#0f766e"
                />
              </Card>

              {scopedAnalytics && (
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Class drill summary</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="text-sm text-gray-600 mb-1">Total drills (all time)</div>
                      <div className="text-2xl font-bold text-gray-900">
                        {scopedAnalytics.totalDrills ?? 0}
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="text-sm text-gray-600 mb-1">Avg participation</div>
                      <div className="text-2xl font-bold text-gray-900">
                        {scopedAnalytics.avgParticipation != null
                          ? `${scopedAnalytics.avgParticipation}%`
                          : 'Not enough completed drills'}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">Among completed drills in recent list</div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="text-sm text-gray-600 mb-1">Students on roster</div>
                      <div className="text-2xl font-bold text-gray-900">
                        {scopedAnalytics.totalStudents ?? 0}
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="text-sm text-gray-600 mb-1">Recent list</div>
                      <div className="text-sm font-semibold text-gray-900">
                        {scopedAnalytics.recentListCount ?? scopedAnalytics.recentDrills?.length ?? 0} of{' '}
                        {scopedAnalytics.totalDrills ?? 0}
                        {scopedAnalytics.recentListLimit
                          ? ` (cap ${scopedAnalytics.recentListLimit})`
                          : ''}
                      </div>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          )}

          {activeTab === 'students' && (
            <div className="space-y-6">
              <Card className="p-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex-1 min-w-[200px] relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search students..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600"
                    />
                  </div>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                    className="px-4 py-2 border border-gray-300 rounded-lg bg-white"
                  >
                    <option value="preparedness">Sort by preparedness</option>
                    <option value="modules">Sort by modules passed</option>
                    <option value="games">Sort by games</option>
                    <option value="name">Sort by name</option>
                  </select>
                </div>
              </Card>

              {filteredStudents.length === 0 ? (
                <Card className="p-12">
                  <EmptyState
                    title="No students found"
                    description={
                      searchQuery ? 'Try adjusting your search' : 'No students in this class payload'
                    }
                    icon={<Users className="w-12 h-12 text-gray-400" />}
                  />
                </Card>
              ) : (
                <>
                  <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-200">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50 text-left text-gray-600">
                        <tr>
                          <th className="px-4 py-3 font-medium">Name</th>
                          <th className="px-4 py-3 font-medium">Preparedness</th>
                          <th className="px-4 py-3 font-medium">Modules</th>
                          <th className="px-4 py-3 font-medium">Games</th>
                          <th className="px-4 py-3 font-medium">Last activity</th>
                          <th className="px-4 py-3 font-medium"> </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStudents.map((item: any) => {
                          const id = item.student?.id || '';
                          const denomOk =
                            item.modules?.denominatorAvailable !== false &&
                            item.modules?.total != null &&
                            item.modules.total > 0;
                          const modulesLabel = denomOk
                            ? `${item.modules.completed}/${item.modules.total}`
                            : `${item.modules?.completed ?? 0} passed`;
                          return (
                            <tr key={id} className="border-t border-gray-100">
                              <td className="px-4 py-3 font-medium text-gray-900">
                                {item.student?.name || 'Unknown'}
                              </td>
                              <td className="px-4 py-3">
                                {formatNullableScore(item.preparednessScore, '/100')}
                              </td>
                              <td className="px-4 py-3">{modulesLabel}</td>
                              <td className="px-4 py-3">{item.games?.played ?? 0}</td>
                              <td className="px-4 py-3 text-gray-600">
                                {item.lastActivity
                                  ? new Date(item.lastActivity).toLocaleDateString()
                                  : 'Not recorded'}
                              </td>
                              <td className="px-4 py-3">
                                <Link
                                  href={`/teacher/classes/${selectedClassId}/students/${id}`}
                                  className="text-teal-800 font-medium hover:underline"
                                >
                                  Open details
                                </Link>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="md:hidden grid grid-cols-1 gap-4">
                    {filteredStudents.map((item: any) => {
                      const id = item.student?.id || '';
                      return (
                        <StudentPerformanceCard
                          key={id}
                          data={mapStudentProgressItem(
                            item,
                            `/teacher/classes/${selectedClassId}/students/${id}`
                          )}
                        />
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'drills' && (
            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Drill history</h3>
                {scopedAnalytics ? (
                  <p className="text-sm text-gray-600 mb-4">
                    Showing {scopedAnalytics.recentListCount ?? scopedAnalytics.recentDrills?.length ?? 0}{' '}
                    most recent of {scopedAnalytics.totalDrills ?? 0} drills
                    {scopedAnalytics.recentListLimit
                      ? ` (list limited to ${scopedAnalytics.recentListLimit})`
                      : ''}
                    . Scoped by participantSelection.classIds.
                  </p>
                ) : (
                  <p className="text-sm text-gray-600 mb-4">Drill analytics not loaded for this class.</p>
                )}

                {scopedAnalytics?.recentDrills?.length > 0 ? (
                  <div className="space-y-3">
                    {scopedAnalytics.recentDrills.map((drill: any) => {
                      const when = drill.eventAt || drill.completedAt || drill.actualStart || drill.scheduledAt;
                      return (
                        <div
                          key={drill.id || `${drill.type}-${when}`}
                          className="p-4 border border-gray-200 rounded-lg"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <div className="font-semibold text-gray-900">
                                {drill.type || 'Drill'}
                                {drill.status ? (
                                  <span className="ml-2 text-xs font-normal text-gray-500">
                                    ({drill.status})
                                  </span>
                                ) : null}
                              </div>
                              <div className="text-sm text-gray-600 mt-1">
                                Participation:{' '}
                                {drill.participationRate != null
                                  ? `${drill.participationRate}%`
                                  : 'Not recorded'}
                                {drill.totalParticipants != null
                                  ? ` (${drill.completedParticipants ?? 0}/${drill.totalParticipants} finished)`
                                  : ''}
                              </div>
                            </div>
                            <div className="text-sm text-gray-500">
                              {when ? new Date(when).toLocaleString() : 'No event time'}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <EmptyState
                    title="No drills in recent list"
                    description="Drills that include this class will appear here"
                    icon={<Activity className="w-12 h-12 text-gray-400" />}
                  />
                )}
              </Card>
            </div>
          )}

          {activeTab === 'performance' && (
            <div className="space-y-6">
              {studentProgress && progressClassId === selectedClassId ? (
                <>
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Class performance summary</h3>
                    {!studentProgress.denominatorAvailable && (
                      <p className="text-sm text-amber-800 mb-4">
                        Eligible curriculum denominator unavailable — module counts are distinct
                        modules passed, not a completion percentage.
                      </p>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-2 mb-2">
                          <BookOpen className="w-5 h-5 text-teal-700" />
                          <span className="font-medium text-gray-700">Avg distinct modules passed</span>
                        </div>
                        <div className="text-3xl font-bold text-gray-900">
                          {studentProgress.summary?.avgDistinctModulesCompleted ?? '—'}
                        </div>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Gamepad2 className="w-5 h-5 text-teal-700" />
                          <span className="font-medium text-gray-700">Total games recorded</span>
                        </div>
                        <div className="text-3xl font-bold text-gray-900">
                          {studentProgress.summary?.totalGamesPlayed ?? 0}
                        </div>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Target className="w-5 h-5 text-teal-700" />
                          <span className="font-medium text-gray-700">Avg preparedness</span>
                        </div>
                        <div className="text-3xl font-bold text-gray-900">
                          {studentProgress.summary?.avgPreparednessScore != null
                            ? studentProgress.summary.avgPreparednessScore
                            : '—'}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          Sample n={studentProgress.summary?.preparednessSampleSize ?? 0}
                        </div>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">Comparison chart</h3>
                      <select
                        value={compareMetric}
                        onChange={(e) => setCompareMetric(e.target.value as typeof compareMetric)}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg bg-white text-sm"
                      >
                        <option value="preparedness">Preparedness</option>
                        <option value="modules">Modules passed</option>
                        <option value="games">Games</option>
                      </select>
                    </div>
                    <ProgressChart
                      data={progressChartData}
                      type="bar"
                      title=""
                      dataKey={compareDataKey}
                      xAxisKey="name"
                      color="#0f766e"
                    />
                  </Card>
                </>
              ) : (
                <EmptyState
                  title="No performance payload"
                  description="Student progress has not loaded for this class"
                  icon={<Target className="w-12 h-12 text-gray-400" />}
                />
              )}
            </div>
          )}
        </>
      )}
    </AppShell>
  );
}
