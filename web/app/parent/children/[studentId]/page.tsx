/**
 * Child Detail Page
 * Detailed view of a child's progress, drills, attendance, and safety
 * Parent Monitoring System - Phase 2
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';
import { parentApi, ChildProgress, DrillParticipation, AttendanceData } from '@/lib/api/parent';
import { Card } from '@/components/ui/card';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import {
  ArrowLeft,
  User,
  BookOpen,
  Activity,
  Calendar,
  Shield,
  MapPin,
  TrendingUp,
  Award,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

type TabType = 'overview' | 'progress' | 'drills' | 'attendance' | 'safety';

export default function ChildDetailPage() {
  const router = useRouter();
  const params = useParams();
  const studentId = params?.studentId as string;
  const { user, isAuthenticated, accessToken } = useAuthStore();
  const { showToast } = useToast();
  
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [childDetails, setChildDetails] = useState<ChildProgress | null>(null);
  const [drills, setDrills] = useState<DrillParticipation[]>([]);
  const [attendance, setAttendance] = useState<AttendanceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDrills, setIsLoadingDrills] = useState(false);
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'parent') {
      router.push('/login');
      return;
    }

    if (accessToken) {
      const { apiClient } = require('@/lib/api/client');
      apiClient.setToken(accessToken);
    }

    if (studentId) {
      loadChildDetails();
    }
  }, [isAuthenticated, router, accessToken, user, studentId]);

  const loadChildDetails = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await parentApi.getChildDetails(studentId);
      if (response.success && response.data) {
        setChildDetails(response.data);
      }
    } catch (error: any) {
      console.error('Error loading child details:', error);
      showToast('Failed to load child details', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [studentId, showToast]);

  const loadDrills = useCallback(async () => {
    setIsLoadingDrills(true);
    try {
      const response = await parentApi.getChildDrills(studentId);
      if (response.success && response.data?.drills) {
        setDrills(response.data.drills);
      }
    } catch (error: any) {
      console.error('Error loading drills:', error);
      showToast('Failed to load drill history', 'error');
    } finally {
      setIsLoadingDrills(false);
    }
  }, [studentId, showToast]);

  const loadAttendance = useCallback(async () => {
    setIsLoadingAttendance(true);
    try {
      // Get last 30 days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      
      const response = await parentApi.getChildAttendance(
        studentId,
        startDate.toISOString(),
        endDate.toISOString()
      );
      if (response.success && response.data) {
        setAttendance(response.data);
      }
    } catch (error: any) {
      console.error('Error loading attendance:', error);
      showToast('Failed to load attendance', 'error');
    } finally {
      setIsLoadingAttendance(false);
    }
  }, [studentId, showToast]);

  useEffect(() => {
    if (activeTab === 'drills' && drills.length === 0) {
      loadDrills();
    }
    if (activeTab === 'attendance' && !attendance) {
      loadAttendance();
    }
  }, [activeTab, drills.length, attendance, loadDrills, loadAttendance]);

  // Auto-refresh progress data every 30 seconds
  useEffect(() => {
    if (studentId) {
      // Initial load
      loadChildDetails();
      // Set up polling every 30 seconds
      const progressInterval = setInterval(() => {
        loadChildDetails();
      }, 30000);
      return () => clearInterval(progressInterval);
    }
  }, [studentId, loadChildDetails]);

  // Auto-refresh drills when on drills tab
  useEffect(() => {
    if (activeTab === 'drills' && studentId) {
      const drillsInterval = setInterval(() => {
        loadDrills();
      }, 60000); // Refresh drills every 60 seconds
      return () => clearInterval(drillsInterval);
    }
  }, [activeTab, studentId, loadDrills]);

  // Auto-refresh attendance when on attendance tab
  useEffect(() => {
    if (activeTab === 'attendance' && studentId) {
      const attendanceInterval = setInterval(() => {
        loadAttendance();
      }, 60000); // Refresh attendance every 60 seconds
      return () => clearInterval(attendanceInterval);
    }
  }, [activeTab, studentId, loadAttendance]);

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview', icon: User },
    { id: 'progress' as TabType, label: 'Progress', icon: TrendingUp },
    { id: 'drills' as TabType, label: 'Drills', icon: Activity },
    { id: 'attendance' as TabType, label: 'Attendance', icon: Calendar },
    { id: 'safety' as TabType, label: 'Safety', icon: Shield }
  ];

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

  if (!childDetails) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            <Card className="p-12 text-center">
              <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Child Not Found</h2>
              <p className="text-gray-600 mb-4">Unable to load child details.</p>
              <Button onClick={() => router.push('/parent/dashboard')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Card>
          </main>
        </div>
      </div>
    );
  }

  const { student, progress } = childDetails;

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-blue-50 via-white to-blue-50 p-6">
          {/* Header */}
          <div className="mb-6">
            <Button
              onClick={() => router.push('/parent/dashboard')}
              variant="outline"
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                  {student.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{student.name}</h1>
                  {student.grade && student.section && (
                    <p className="text-gray-600">Grade {student.grade} - Section {student.section}</p>
                  )}
                  {student.classId && (
                    <p className="text-sm text-gray-500">Class: {student.classId.classCode}</p>
                  )}
                </div>
              </div>
              <Button
                onClick={loadChildDetails}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-6 border-b border-gray-200">
            <div className="flex space-x-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content */}
          <div className="space-y-6">
            {activeTab === 'overview' && (
              <OverviewTab childDetails={childDetails} />
            )}
            {activeTab === 'progress' && (
              <ProgressTab childDetails={childDetails} />
            )}
            {activeTab === 'drills' && (
              <DrillsTab drills={drills} isLoading={isLoadingDrills} />
            )}
            {activeTab === 'attendance' && (
              <AttendanceTab attendance={attendance} isLoading={isLoadingAttendance} />
            )}
            {activeTab === 'safety' && (
              <SafetyTab studentId={studentId} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

// Overview Tab Component
function OverviewTab({ childDetails }: { childDetails: ChildProgress }) {
  const { student, progress, modules, quiz } = childDetails;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-blue-50 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Preparedness Score</p>
              <p className="text-2xl font-bold text-blue-700">{progress?.preparednessScore || 0}</p>
            </div>
            <Shield className="w-8 h-8 text-blue-600 opacity-50" />
          </div>
        </Card>
        <Card className="p-4 bg-green-50 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Modules Completed</p>
              <p className="text-2xl font-bold text-green-700">{modules?.completed || 0}</p>
            </div>
            <BookOpen className="w-8 h-8 text-green-600 opacity-50" />
          </div>
        </Card>
        <Card className="p-4 bg-purple-50 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Quiz Average</p>
              <p className="text-2xl font-bold text-purple-700">{quiz?.avgScore || 0}%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-600 opacity-50" />
          </div>
        </Card>
        <Card className="p-4 bg-yellow-50 border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Login Streak</p>
              <p className="text-2xl font-bold text-yellow-700">{progress?.loginStreak || 0} days</p>
            </div>
            <Award className="w-8 h-8 text-yellow-600 opacity-50" />
          </div>
        </Card>
      </div>

      {/* Student Info */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Name</p>
            <p className="font-medium text-gray-900">{student.name}</p>
          </div>
          {student.email && (
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-medium text-gray-900">{student.email}</p>
            </div>
          )}
          {student.grade && (
            <div>
              <p className="text-sm text-gray-600">Grade</p>
              <p className="font-medium text-gray-900">{student.grade}</p>
            </div>
          )}
          {student.section && (
            <div>
              <p className="text-sm text-gray-600">Section</p>
              <p className="font-medium text-gray-900">{student.section}</p>
            </div>
          )}
          {student.classId && (
            <div>
              <p className="text-sm text-gray-600">Class</p>
              <p className="font-medium text-gray-900">{student.classId.classCode}</p>
            </div>
          )}
          {student.institutionId && (
            <div>
              <p className="text-sm text-gray-600">Institution</p>
              <p className="font-medium text-gray-900">{student.institutionId.name}</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

// ProgressTab Component
function ProgressTab({ childDetails }: { childDetails: ChildProgress }) {
  const { quiz, games } = childDetails;

  const quizData = quiz?.recentQuizzes?.slice(0, 10).map((q, idx) => ({
    name: `Quiz ${idx + 1}`,
    score: q.score || 0,
    passed: q.passed ? 1 : 0
  })) || [];

  const gameData = games?.recentGames?.slice(0, 10).map((g, idx) => ({
    name: `Game ${idx + 1}`,
    score: g.score || 0,
    xp: g.xpEarned || 0
  })) || [];

  return (
    <div className="space-y-6">
      {/* Quiz Performance */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quiz Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Total Quizzes</p>
            <p className="text-2xl font-bold text-blue-700">{quiz?.totalQuizzes || 0}</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Average Score</p>
            <p className="text-2xl font-bold text-green-700">{quiz?.avgScore || 0}%</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Pass Rate</p>
            <p className="text-2xl font-bold text-purple-700">{quiz?.passRate || 0}%</p>
          </div>
        </div>
        {quizData.length > 0 && (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={quizData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="score" stroke="#3b82f6" name="Score" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Game Performance */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Game Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Total Games</p>
            <p className="text-2xl font-bold text-yellow-700">{games?.totalGames || 0}</p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Total XP</p>
            <p className="text-2xl font-bold text-orange-700">{games?.totalXP || 0}</p>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Average Score</p>
            <p className="text-2xl font-bold text-red-700">{games?.avgScore || 0}</p>
          </div>
        </div>
        {gameData.length > 0 && (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={gameData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="score" fill="#f59e0b" name="Score" />
              <Bar dataKey="xp" fill="#ef4444" name="XP" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>
    </div>
  );
}

// Drills Tab Component
function DrillsTab({ drills, isLoading }: { drills: DrillParticipation[]; isLoading: boolean }) {
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (drills.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Drill History</h3>
        <p className="text-gray-600">No drill participation records found.</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Drill Participation History</h3>
      <div className="space-y-4">
        {drills.map((drill, idx) => (
          <div key={idx} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full mt-1.5 ${
                  drill.status === 'in_progress' ? 'bg-red-500' :
                  drill.status === 'completed' ? 'bg-green-500' :
                  'bg-gray-400'
                }`} />
                <div>
                  <h4 className="font-medium text-gray-900 flex items-center gap-2">
                    {drill.drillType.charAt(0).toUpperCase() + drill.drillType.slice(1)} Drill
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      drill.status === 'in_progress' ? 'bg-red-100 text-red-700' :
                      drill.status === 'completed' ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {drill.status.replace('_', ' ')}
                    </span>
                  </h4>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Start Time</p>
                <p className="font-medium text-gray-900">
                  {new Date(drill.startTime).toLocaleString()}
                </p>
              </div>
              {drill.endTime && (
                <div>
                  <p className="text-gray-600">End Time</p>
                  <p className="font-medium text-gray-900">
                    {new Date(drill.endTime).toLocaleString()}
                  </p>
                </div>
              )}
              {drill.completionTime && (
                <div>
                  <p className="text-gray-600">Completion Time</p>
                  <p className="font-medium text-gray-900">{drill.completionTime}s</p>
                </div>
              )}
              {drill.location && (
                <div>
                  <p className="text-gray-600">Location</p>
                  <p className="font-medium text-gray-900">
                    {drill.location.latitude.toFixed(4)}, {drill.location.longitude.toFixed(4)}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// Attendance Tab Component
function AttendanceTab({ attendance, isLoading }: { attendance: AttendanceData | null; isLoading: boolean }) {
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (!attendance) {
    return (
      <Card className="p-12 text-center">
        <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Attendance Data</h3>
        <p className="text-gray-600">No attendance records found.</p>
      </Card>
    );
  }

  const { records, statistics } = attendance;

  const attendanceData = [
    { name: 'Present', value: statistics.present, color: '#10b981' },
    { name: 'Absent', value: statistics.absent, color: '#ef4444' },
    { name: 'Late', value: statistics.late, color: '#f59e0b' },
    { name: 'Excused', value: statistics.excused, color: '#6366f1' }
  ];

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-green-50 border border-green-200">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Present</p>
            <p className="text-2xl font-bold text-green-700">{statistics.present}</p>
          </div>
        </Card>
        <Card className="p-4 bg-red-50 border border-red-200">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Absent</p>
            <p className="text-2xl font-bold text-red-700">{statistics.absent}</p>
          </div>
        </Card>
        <Card className="p-4 bg-yellow-50 border border-yellow-200">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Late</p>
            <p className="text-2xl font-bold text-yellow-700">{statistics.late}</p>
          </div>
        </Card>
        <Card className="p-4 bg-blue-50 border border-blue-200">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Attendance Rate</p>
            <p className="text-2xl font-bold text-blue-700">{statistics.attendanceRate}%</p>
          </div>
        </Card>
      </div>

      {/* Chart */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Attendance Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={attendanceData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {attendanceData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </Card>

      {/* Records */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Records</h3>
        <div className="space-y-2">
          {records.slice(0, 20).map((record) => (
            <div key={record._id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-3">
                {record.status === 'present' ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : record.status === 'absent' ? (
                  <XCircle className="w-5 h-5 text-red-600" />
                ) : (
                  <Clock className="w-5 h-5 text-yellow-600" />
                )}
                <span className="font-medium text-gray-900">
                  {new Date(record.date).toLocaleDateString()}
                </span>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                record.status === 'present' ? 'bg-green-100 text-green-700' :
                record.status === 'absent' ? 'bg-red-100 text-red-700' :
                record.status === 'late' ? 'bg-yellow-100 text-yellow-700' :
                'bg-blue-100 text-blue-700'
              }`}>
                {record.status}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// Safety Tab Component
function SafetyTab({ studentId }: { studentId: string }) {
  const router = useRouter();
  const [location, setLocation] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLocation();
    const interval = setInterval(loadLocation, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [studentId]);

  const loadLocation = async () => {
    setIsLoading(true);
    try {
      const response = await parentApi.getChildLocation(studentId);
      if (response.success && response.data) {
        setLocation(response.data);
      }
    } catch (error: any) {
      console.error('Error loading location:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Status</h3>
        {isLoading ? (
          <LoadingSkeleton />
        ) : location ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full ${
                  location.status === 'safe' ? 'bg-green-500' :
                  location.status === 'in_drill' ? 'bg-yellow-500' :
                  location.status === 'emergency' ? 'bg-red-500' : 'bg-gray-500'
                }`} />
                <span className="font-medium text-gray-900 capitalize">
                  Status: {location.status.replace('_', ' ')}
                </span>
              </div>
            </div>
            {location.latitude && location.longitude && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Last Known Location</p>
                <p className="font-mono text-sm text-gray-900">
                  {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                </p>
                <Button
                  onClick={() => router.push(`/map?lat=${location.latitude}&lng=${location.longitude}`)}
                  className="mt-3"
                  variant="outline"
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  View on Map
                </Button>
              </div>
            )}
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Last Seen</p>
              <p className="font-medium text-gray-900">
                {new Date(location.lastSeen).toLocaleString()}
              </p>
            </div>
            {location.activeDrill && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm font-medium text-yellow-900 mb-1">Active Drill</p>
                <p className="text-sm text-yellow-700">
                  {location.activeDrill.drillType} - {location.activeDrill.status}
                </p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-600">No location data available</p>
        )}
      </Card>
    </div>
  );
}

