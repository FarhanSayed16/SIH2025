/**
 * Individual Student Performance Detail Page
 * Shows comprehensive performance metrics for a single student
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';
import { teacherApi } from '@/lib/api/teacher';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { StudentPerformanceCard, StudentPerformanceData } from '@/components/teacher/StudentPerformanceCard';
import { ProgressChart, ChartDataPoint } from '@/components/teacher/ProgressChart';
import { PerformanceMetricsCard, MetricData } from '@/components/teacher/PerformanceMetricsCard';
import { ActivityTimeline } from '@/components/teacher/ActivityTimeline';
import { StudentParentsList } from '@/components/teacher/StudentParentsList';
import { QRCodeScanner } from '@/components/teacher/QRCodeScanner';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { useToast } from '@/components/ui/toast';
import {
  ArrowLeft,
  BookOpen,
  Award,
  Gamepad2,
  TrendingUp,
  Clock,
  Target,
  CheckCircle,
  Calendar,
  BarChart3,
  Activity
} from 'lucide-react';

export default function StudentPerformanceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const classId = params.classId as string;
  const studentId = params.studentId as string;
  const { user, isAuthenticated, accessToken } = useAuthStore();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [studentData, setStudentData] = useState<any>(null);
  const [studentProgress, setStudentProgress] = useState<any>(null);
  const [showQRScanner, setShowQRScanner] = useState(false);

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

    loadStudentData();
  }, [isAuthenticated, router, accessToken, user, classId, studentId]);

  // Auto-refresh student progress every 30 seconds
  useEffect(() => {
    if (classId && studentId) {
      // Initial load already done above
      // Set up polling every 30 seconds
      const progressInterval = setInterval(() => {
        loadStudentData();
      }, 30000);
      return () => clearInterval(progressInterval);
    }
  }, [classId, studentId, loadStudentData]);

  const loadStudentData = async () => {
    setIsLoading(true);
    try {
      const response = await teacherApi.getStudentProgress(classId);
      if (response.success && response.data?.students) {
        const student = response.data.students.find(
          (s: any) => s.student?.id === studentId || s.student?._id === studentId
        );
        if (student) {
          setStudentData(student);
          setStudentProgress(response.data);
        } else {
          showToast('Student not found', 'error');
          router.push(`/teacher/classes/${classId}`);
        }
      }
    } catch (error: any) {
      console.error('Error loading student data:', error);
      showToast('Failed to load student data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 p-6">
            <LoadingSkeleton />
          </main>
        </div>
      </div>
    );
  }

  if (!studentData) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 p-6">
            <Card className="p-12">
              <EmptyState
                title="Student Not Found"
                description="The student you're looking for doesn't exist or you don't have access"
                icon={<Award className="w-12 h-12 text-gray-400" />}
              />
              <Button
                onClick={() => router.push(`/teacher/classes/${classId}`)}
                className="mt-4"
              >
                Back to Class
              </Button>
            </Card>
          </main>
        </div>
      </div>
    );
  }

  const performanceData: StudentPerformanceData = {
    student: {
      id: studentData.student?.id || studentData.student?._id || '',
      name: studentData.student?.name || 'Unknown',
      email: studentData.student?.email,
      grade: studentData.student?.grade,
      section: studentData.student?.section
    },
    modules: {
      completed: studentData.modules?.completed || 0,
      inProgress: studentData.modules?.inProgress || 0,
      total: studentData.modules?.total || 0
    },
    quiz: {
      totalQuizzes: studentData.quiz?.totalQuizzes || 0,
      avgScore: studentData.quiz?.avgScore || 0,
      passRate: studentData.quiz?.passRate || 0
    },
    games: {
      totalGames: studentData.games?.totalGames || studentData.games?.played || 0,
      totalXP: studentData.games?.totalXP || 0,
      avgScore: studentData.games?.avgScore || studentData.games?.averageScore || 0
    },
    progress: {
      preparednessScore: studentData.progress?.preparednessScore || studentData.preparednessScore || 0,
      loginStreak: studentData.progress?.loginStreak || 0
    },
    lastActivity: studentData.lastActivity
  };

  const metrics: MetricData[] = [
    {
      label: 'Modules Completed',
      value: `${performanceData.modules.completed}/${performanceData.modules.total}`,
      icon: <BookOpen className="w-5 h-5" />,
      color: 'purple'
    },
    {
      label: 'Quiz Average',
      value: `${performanceData.quiz.avgScore.toFixed(1)}%`,
      icon: <Award className="w-5 h-5" />,
      color: 'blue'
    },
    {
      label: 'Games Played',
      value: performanceData.games.totalGames,
      icon: <Gamepad2 className="w-5 h-5" />,
      color: 'green'
    },
    {
      label: 'Total XP',
      value: performanceData.games.totalXP,
      icon: <Target className="w-5 h-5" />,
      color: 'indigo'
    }
  ];

  // Prepare chart data
  const progressChartData: ChartDataPoint[] = [
    {
      name: 'Modules',
      value: performanceData.modules.completed,
      total: performanceData.modules.total
    },
    {
      name: 'Quizzes',
      value: performanceData.quiz.totalQuizzes
    },
    {
      name: 'Games',
      value: performanceData.games.totalGames
    },
    {
      name: 'Preparedness',
      value: performanceData.progress.preparednessScore
    }
  ];

  const completionRate = performanceData.modules.total > 0
    ? Math.round((performanceData.modules.completed / performanceData.modules.total) * 100)
    : 0;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6 bg-gradient-to-br from-blue-50 via-white to-blue-50">
          {/* Header */}
          <div className="mb-6">
            <Button
              onClick={() => router.push(`/teacher/classes/${classId}`)}
              variant="outline"
              className="mb-4 flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Class
            </Button>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              {performanceData.student.name} - Performance Details
            </h1>
            <p className="text-gray-600 mt-2">
              Comprehensive performance metrics and progress tracking
            </p>
          </div>

          {/* Student Performance Card */}
          <div className="mb-6">
            <StudentPerformanceCard data={performanceData} showDetails={true} />
          </div>

          {/* Key Metrics */}
          <div className="mb-6">
            <PerformanceMetricsCard metrics={metrics} />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <ProgressChart
              data={progressChartData}
              type="bar"
              title="Performance Overview"
              dataKey="value"
              xAxisKey="name"
              color="#3b82f6"
            />

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Module Completion Progress</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600">Overall Completion</span>
                    <span className="font-semibold text-blue-600">{completionRate}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-4 rounded-full transition-all duration-300 flex items-center justify-end pr-2"
                      style={{ width: `${completionRate}%` }}
                    >
                      {completionRate > 10 && (
                        <span className="text-xs text-white font-semibold">{completionRate}%</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{performanceData.modules.completed}</div>
                    <div className="text-xs text-gray-500">Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{performanceData.modules.inProgress}</div>
                    <div className="text-xs text-gray-500">In Progress</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{performanceData.modules.total}</div>
                    <div className="text-xs text-gray-500">Total</div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Phase 4: Parent Information and Activity Timeline */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <StudentParentsList
              studentId={studentId}
              onScanQR={() => setShowQRScanner(true)}
            />
            <ActivityTimeline
              studentId={studentId}
              classId={classId}
              autoRefresh={true}
              refreshInterval={30000}
            />
          </div>

          {/* Detailed Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Quiz Performance */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-blue-600" />
                Quiz Performance
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <span className="text-gray-700">Total Quizzes</span>
                  <span className="font-bold text-blue-700">{performanceData.quiz.totalQuizzes}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <span className="text-gray-700">Average Score</span>
                  <span className="font-bold text-purple-700">{performanceData.quiz.avgScore.toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <span className="text-gray-700">Pass Rate</span>
                  <span className="font-bold text-green-700">{performanceData.quiz.passRate.toFixed(1)}%</span>
                </div>
              </div>
            </Card>

            {/* Game Performance */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Gamepad2 className="w-5 h-5 text-green-600" />
                Game Performance
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <span className="text-gray-700">Games Played</span>
                  <span className="font-bold text-green-700">{performanceData.games.totalGames}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg">
                  <span className="text-gray-700">Total XP Earned</span>
                  <span className="font-bold text-indigo-700">{performanceData.games.totalXP}</span>
                </div>
                {performanceData.games.avgScore > 0 && (
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <span className="text-gray-700">Average Score</span>
                    <span className="font-bold text-yellow-700">{performanceData.games.avgScore.toFixed(0)}</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Activity Stats */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-600" />
                Activity Stats
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg">
                  <span className="text-gray-700">Login Streak</span>
                  <span className="font-bold text-indigo-700">{performanceData.progress.loginStreak} days</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <span className="text-gray-700">Preparedness Score</span>
                  <span className="font-bold text-blue-700">{performanceData.progress.preparednessScore}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-700">Last Activity</span>
                  <span className="text-sm font-medium text-gray-700">
                    {performanceData.lastActivity
                      ? new Date(performanceData.lastActivity).toLocaleDateString()
                      : 'Never'}
                  </span>
                </div>
              </div>
            </Card>

            {/* Comparison with Class Average */}
            {studentProgress?.summary && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                  Class Comparison
                </h3>
                <div className="space-y-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600 mb-2">Modules Completed</div>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-900">
                        {performanceData.modules.completed} modules
                      </span>
                      <span className="text-sm text-gray-500">
                        Class avg: {studentProgress.summary.avgModulesCompleted?.toFixed(1) || 0}
                      </span>
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600 mb-2">Preparedness Score</div>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-900">
                        {performanceData.progress.preparednessScore}
                      </span>
                      <span className="text-sm text-gray-500">
                        Class avg: {Math.round(studentProgress.summary.avgPreparednessScore || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Phase 4: QR Code Scanner Modal */}
          <QRCodeScanner
            isOpen={showQRScanner}
            onClose={() => setShowQRScanner(false)}
            onVerified={(parentData) => {
              // Refresh parents list after verification
              setShowQRScanner(false);
            }}
          />
        </main>
      </div>
    </div>
  );
}

