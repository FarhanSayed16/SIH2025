/**
 * Teacher Analytics Dashboard
 * Comprehensive monitoring and performance tracking for teachers
 * Phase 1: Complete implementation with reusable components
 * 
 * NOTE: Backend getStudentProgress returns:
 * - modules: { completed, inProgress, total, averageScore }
 * - games: { played, totalXP, averageScore }
 * - preparednessScore
 * - badges
 * Quiz data is NOT available per student from this endpoint
 */

'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';
import { teacherApi } from '@/lib/api/teacher';
import { Card } from '@/components/ui/card';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { StudentPerformanceCard, StudentPerformanceData } from '@/components/teacher/StudentPerformanceCard';
import { ProgressChart, ChartDataPoint } from '@/components/teacher/ProgressChart';
import { PerformanceMetricsCard, MetricData } from '@/components/teacher/PerformanceMetricsCard';
import {
  Users,
  BookOpen,
  Award,
  Gamepad2,
  TrendingUp,
  Clock,
  BarChart3,
  Activity,
  Target,
  CheckCircle,
  RefreshCw,
  Calendar,
  Search,
  Filter
} from 'lucide-react';

type TabType = 'overview' | 'students' | 'sessions' | 'performance';

interface ClassData {
  _id: string;
  grade: string;
  section: string;
  classCode: string;
  studentIds?: any[];
}

// Backend response structure from getStudentProgress
interface BackendStudentProgress {
  classId: string;
  totalStudents: number;
  students: Array<{
    student: {
      id: string;
      name: string;
      email?: string;
      grade?: string;
      section?: string;
    };
    modules: {
      completed: number;
      inProgress: number;
      total: number;
      averageScore: number;
    };
    games: {
      played: number;
      totalXP: number;
      averageScore: number;
    };
    preparednessScore: number;
    badges: number;
  }>;
}

interface StudentProgressData extends BackendStudentProgress {
  summary?: {
    totalStudents: number;
    avgModulesCompleted: number;
    avgPreparednessScore: number;
    avgLoginStreak: number;
  };
}

export default function TeacherAnalyticsPage() {
  const router = useRouter();
  const { user, isAuthenticated, accessToken } = useAuthStore();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [studentProgress, setStudentProgress] = useState<StudentProgressData | null>(null);
  const [classAnalytics, setClassAnalytics] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'modules' | 'quiz' | 'preparedness'>('preparedness');

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

    setIsLoadingData(true);
    try {
      const [progressResponse, analyticsResponse] = await Promise.all([
        teacherApi.getStudentProgress(selectedClassId),
        teacherApi.getClassAnalytics(selectedClassId)
      ]);

      if (progressResponse.success && progressResponse.data) {
        const data = progressResponse.data as BackendStudentProgress;
        // Calculate summary if not provided by backend
        if (!data.summary && data.students && data.students.length > 0) {
          const students = data.students;
          const totalStudents = data.totalStudents || students.length;
          const avgModulesCompleted = students.reduce((sum: number, s: any) => 
            sum + (s.modules?.completed || 0), 0) / totalStudents;
          const avgPreparednessScore = students.reduce((sum: number, s: any) => 
            sum + (s.preparednessScore || 0), 0) / totalStudents;
          // Login streak not available from backend
          const avgLoginStreak = 0;
          
          (data as StudentProgressData).summary = {
            totalStudents,
            avgModulesCompleted,
            avgPreparednessScore,
            avgLoginStreak
          };
        }
        setStudentProgress(data as StudentProgressData);
      }

      if (analyticsResponse.success && analyticsResponse.data) {
        setClassAnalytics(analyticsResponse.data);
      }
    } catch (error: any) {
      console.error('Error loading class data:', error);
      showToast('Failed to load class data', 'error');
    } finally {
      setIsLoadingData(false);
    }
  }, [selectedClassId, showToast]);

  useEffect(() => {
    if (selectedClassId) {
      loadClassData();
    }
  }, [selectedClassId, loadClassData]);

  const selectedClass = classes.find(c => c._id === selectedClassId);

  // Filter and sort students - memoized for performance
  const filteredStudents = useMemo(() => {
    if (!studentProgress?.students) return [];
    
    return studentProgress.students
      .filter((item: any) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        const name = item.student?.name || '';
        const email = item.student?.email || '';
        return (
          name.toLowerCase().includes(query) ||
          email.toLowerCase().includes(query)
        );
      })
      .sort((a: any, b: any) => {
        switch (sortBy) {
          case 'name':
            return (a.student?.name || '').localeCompare(b.student?.name || '');
          case 'modules':
            return (b.modules?.completed || 0) - (a.modules?.completed || 0);
          case 'quiz':
            // Quiz data not available - sort by games instead
            return (b.games?.played || 0) - (a.games?.played || 0);
          case 'preparedness':
            return (b.preparednessScore || 0) - (a.preparednessScore || 0);
          default:
            return 0;
        }
      });
  }, [studentProgress?.students, searchQuery, sortBy]);

  // Prepare metrics for overview
  const overviewMetrics: MetricData[] = useMemo(() => {
    if (!studentProgress?.summary) return [];
    
    return [
      {
        label: 'Total Students',
        value: studentProgress.summary.totalStudents,
        icon: <Users className="w-5 h-5" />,
        color: 'blue'
      },
      {
        label: 'Avg Modules Completed',
        value: studentProgress.summary.avgModulesCompleted.toFixed(1),
        icon: <BookOpen className="w-5 h-5" />,
        color: 'purple'
      },
      {
        label: 'Avg Preparedness Score',
        value: Math.round(studentProgress.summary.avgPreparednessScore),
        icon: <Target className="w-5 h-5" />,
        color: 'green'
      },
      {
        label: 'Total Games Played',
        value: studentProgress.students?.reduce((sum: number, s: any) => 
          sum + (s.games?.played || 0), 0) || 0,
        icon: <Gamepad2 className="w-5 h-5" />,
        color: 'indigo'
      }
    ];
  }, [studentProgress]);

  // Prepare progress chart data - memoized
  const progressChartData: ChartDataPoint[] = useMemo(() => {
    return filteredStudents
      .slice(0, 10)
      .map((item: any) => ({
        name: (item.student?.name || 'Unknown').split(' ')[0],
        modules: item.modules?.completed || 0,
        games: item.games?.played || 0,
        preparedness: item.preparednessScore || 0
      }));
  }, [filteredStudents]);

  // Prepare module completion chart data - memoized
  const moduleCompletionData: ChartDataPoint[] = useMemo(() => {
    if (!studentProgress?.students) return [];
    
    return studentProgress.students
      .map((item: any) => ({
        name: (item.student?.name || 'Unknown').split(' ')[0],
        completed: item.modules?.completed || 0,
        total: item.modules?.total || 0,
        rate: (item.modules?.total || 0) > 0 
          ? Math.round(((item.modules?.completed || 0) / (item.modules?.total || 1)) * 100) 
          : 0
      }));
  }, [studentProgress?.students]);

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            <LoadingSkeleton />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-blue-50 via-white to-blue-50 p-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  Teacher Analytics
                </h1>
                <p className="text-gray-600 mt-2">Monitor student performance and training sessions</p>
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

            {/* Class Selector */}
            {classes.length > 0 && (
              <div className="flex items-center gap-3 mb-4">
                <label className="text-sm font-medium text-gray-700">Select Class:</label>
                <select
                  value={selectedClassId || ''}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {classes.map((cls) => (
                    <option key={cls._id} value={cls._id}>
                      Grade {cls.grade} - Section {cls.section} ({cls.classCode})
                    </option>
                  ))}
                </select>
                {selectedClass && (
                  <div className="text-sm text-gray-600">
                    {selectedClass.studentIds?.length || 0} students
                  </div>
                )}
              </div>
            )}
          </div>

          {!selectedClassId ? (
            <Card className="p-12">
              <EmptyState
                title="No Class Selected"
                description="Please select a class to view analytics"
                icon={<BarChart3 className="w-12 h-12 text-gray-400" />}
              />
            </Card>
          ) : isLoadingData ? (
            <LoadingSkeleton />
          ) : (
            <>
              {/* Tabs */}
              <div className="mb-6 border-b border-gray-200">
                <nav className="flex space-x-8">
                  {(['overview', 'students', 'sessions', 'performance'] as TabType[]).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === tab
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {overviewMetrics.length > 0 && (
                    <PerformanceMetricsCard metrics={overviewMetrics} />
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ProgressChart
                      data={progressChartData}
                      type="bar"
                      title="Top 10 Students - Performance Comparison"
                      dataKey="preparedness"
                      xAxisKey="name"
                      color="#3b82f6"
                      multipleSeries={[
                        { key: 'modules', name: 'Modules Completed', color: '#8b5cf6' },
                        { key: 'games', name: 'Games Played', color: '#10b981' },
                        { key: 'preparedness', name: 'Preparedness Score', color: '#3b82f6' }
                      ]}
                      showLegend
                    />

                    <ProgressChart
                      data={moduleCompletionData}
                      type="bar"
                      title="Module Completion Rates"
                      dataKey="rate"
                      xAxisKey="name"
                      color="#8b5cf6"
                    />
                  </div>

                  {classAnalytics && (
                    <Card className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Class Activity Summary</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="text-sm text-gray-600 mb-1">Total Drills</div>
                          <div className="text-2xl font-bold text-blue-700">
                            {classAnalytics.totalDrills || 0}
                          </div>
                        </div>
                        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                          <div className="text-sm text-gray-600 mb-1">Avg Participation</div>
                          <div className="text-2xl font-bold text-green-700">
                            {classAnalytics.avgParticipation || 0}%
                          </div>
                        </div>
                        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                          <div className="text-sm text-gray-600 mb-1">Total Students</div>
                          <div className="text-2xl font-bold text-purple-700">
                            {classAnalytics.totalStudents || 0}
                          </div>
                        </div>
                        <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                          <div className="text-sm text-gray-600 mb-1">Recent Activity</div>
                          <div className="text-sm font-semibold text-indigo-700">
                            {classAnalytics.recentDrills?.length || 0} drills
                          </div>
                        </div>
                      </div>
                    </Card>
                  )}
                </div>
              )}

              {/* Students Tab */}
              {activeTab === 'students' && (
                <div className="space-y-6">
                  {/* Search and Filter */}
                  <Card className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="text"
                          placeholder="Search students..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="preparedness">Sort by Preparedness</option>
                        <option value="modules">Sort by Modules</option>
                        <option value="quiz">Sort by Games</option>
                        <option value="name">Sort by Name</option>
                      </select>
                    </div>
                  </Card>

                  {/* Students Grid */}
                  {filteredStudents.length === 0 ? (
                    <Card className="p-12">
                      <EmptyState
                        title="No Students Found"
                        description={searchQuery ? "Try adjusting your search query" : "No students in this class"}
                        icon={<Users className="w-12 h-12 text-gray-400" />}
                      />
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredStudents.map((item: any) => {
                        // Map backend structure to frontend component structure
                        const studentData: StudentPerformanceData = {
                          student: {
                            id: item.student?.id || '',
                            name: item.student?.name || 'Unknown',
                            email: item.student?.email,
                            grade: item.student?.grade,
                            section: item.student?.section
                          },
                          modules: {
                            completed: item.modules?.completed || 0,
                            inProgress: item.modules?.inProgress || 0,
                            total: item.modules?.total || 0
                          },
                          // Quiz data not available from backend endpoint
                          quiz: {
                            totalQuizzes: 0,
                            avgScore: 0,
                            passRate: 0
                          },
                          games: {
                            totalGames: item.games?.played || 0,
                            totalXP: item.games?.totalXP || 0,
                            avgScore: item.games?.averageScore || 0
                          },
                          progress: {
                            preparednessScore: item.preparednessScore || 0,
                            loginStreak: 0 // Not available from backend
                          }
                        };
                        return (
                          <StudentPerformanceCard
                            key={studentData.student.id}
                            data={studentData}
                            onClick={() => {
                              router.push(`/teacher/classes/${selectedClassId}/students/${studentData.student.id}`);
                            }}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Training Sessions Tab */}
              {activeTab === 'sessions' && (
                <div className="space-y-6">
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Training Session History</h3>
                    {classAnalytics?.recentDrills && classAnalytics.recentDrills.length > 0 ? (
                      <div className="space-y-3">
                        {classAnalytics.recentDrills.map((drill: any, index: number) => (
                          <div
                            key={index}
                            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-semibold text-gray-900">
                                  {drill.type || 'Drill'} - {new Date(drill.date).toLocaleDateString()}
                                </div>
                                <div className="text-sm text-gray-600 mt-1">
                                  Participation: {drill.participation || 0}%
                                </div>
                              </div>
                              <div className="text-sm text-gray-500">
                                {new Date(drill.date).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState
                        title="No Training Sessions"
                        description="Training session history will appear here"
                        icon={<Activity className="w-12 h-12 text-gray-400" />}
                      />
                    )}
                  </Card>
                </div>
              )}

              {/* Performance Metrics Tab */}
              {activeTab === 'performance' && (
                <div className="space-y-6">
                  {studentProgress && (
                    <>
                      <Card className="p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Class Performance Summary</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex items-center gap-2 mb-2">
                              <BookOpen className="w-5 h-5 text-blue-600" />
                              <span className="font-medium text-gray-700">Module Completion</span>
                            </div>
                            <div className="text-3xl font-bold text-blue-700">
                              {studentProgress.summary?.avgModulesCompleted.toFixed(1) || 0}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">average modules completed</div>
                          </div>

                          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                            <div className="flex items-center gap-2 mb-2">
                              <Gamepad2 className="w-5 h-5 text-green-600" />
                              <span className="font-medium text-gray-700">Game Activity</span>
                            </div>
                            <div className="text-3xl font-bold text-green-700">
                              {studentProgress.students.length > 0
                                ? Math.round(studentProgress.students.reduce((sum: number, s: any) => 
                                    sum + (s.games?.played || 0), 0) / studentProgress.students.length)
                                : 0}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">average games played</div>
                          </div>

                          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                            <div className="flex items-center gap-2 mb-2">
                              <Target className="w-5 h-5 text-purple-600" />
                              <span className="font-medium text-gray-700">Preparedness</span>
                            </div>
                            <div className="text-3xl font-bold text-purple-700">
                              {Math.round(studentProgress.summary?.avgPreparednessScore || 0)}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">average preparedness score</div>
                          </div>
                        </div>
                      </Card>

                      <ProgressChart
                        data={progressChartData}
                        type="area"
                        title="Student Performance Trends"
                        dataKey="preparedness"
                        xAxisKey="name"
                        color="#3b82f6"
                        multipleSeries={[
                          { key: 'modules', name: 'Modules Completed', color: '#8b5cf6' },
                          { key: 'games', name: 'Games Played', color: '#10b981' },
                          { key: 'preparedness', name: 'Preparedness Score', color: '#3b82f6' }
                        ]}
                        showLegend
                      />
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
