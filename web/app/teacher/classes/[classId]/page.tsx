/**
 * Teacher Class Details Page
 * Moved from /classes/[classId] to /teacher/classes/[classId]
 * Teacher view of class with pending students and approval actions
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';
import { teacherApi, PendingStudent, ClassStudent } from '@/lib/api/teacher';
import { classroomApi } from '@/lib/api/classroom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { StudentPerformanceCard, StudentPerformanceData } from '@/components/teacher/StudentPerformanceCard';
import { PerformanceMetricsCard, MetricData } from '@/components/teacher/PerformanceMetricsCard';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { Search, Award, BookOpen, Gamepad2, TrendingUp, Zap, Play, Clock, CheckCircle } from 'lucide-react';
import { drillsApi, Drill } from '@/lib/api/drills';
import { socketService } from '@/lib/services/socket-service';
import { getInstitutionId } from '@/lib/utils/institution';
import { useToast } from '@/components/ui/toast';
import Link from 'next/link';

interface Class {
  _id: string;
  grade: string;
  section: string;
  classCode: string;
  teacherId: { _id: string; name: string; email: string };
  studentIds?: any[];
  institutionId?: { _id: string; name: string };
}

export default function TeacherClassDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const classId = params.classId as string;
  const { user, isAuthenticated, accessToken } = useAuthStore();
  const [classData, setClassData] = useState<Class | null>(null);
  const [pendingStudents, setPendingStudents] = useState<PendingStudent[]>([]);
  const [approvedStudents, setApprovedStudents] = useState<ClassStudent[]>([]);
  const [rosterStudents, setRosterStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'roster' | 'performance' | 'drills'>('pending');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showRosterForm, setShowRosterForm] = useState(false);
  const [rosterFormData, setRosterFormData] = useState({
    name: '',
    parentName: '',
    parentPhone: '',
    notes: ''
  });
  const [qrCodeData, setQrCodeData] = useState<any>(null);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [studentProgress, setStudentProgress] = useState<any>(null);
  const [isLoadingProgress, setIsLoadingProgress] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'modules' | 'quiz' | 'preparedness'>('preparedness');
  
  // Phase 4: Drill state
  const [classDrills, setClassDrills] = useState<Drill[]>([]);
  const [isLoadingDrills, setIsLoadingDrills] = useState(false);
  const [showDrillForm, setShowDrillForm] = useState(false);
  const [drillFormData, setDrillFormData] = useState({
    type: 'fire' as Drill['type'],
    scheduledAt: '',
  });
  const { showToast } = useToast();

  // Define loadStudentProgress before useEffect hooks to avoid initialization error
  const loadStudentProgress = useCallback(async () => {
    setIsLoadingProgress(true);
    try {
      const response = await teacherApi.getStudentProgress(classId);
      if (response.success && response.data) {
        setStudentProgress(response.data);
      }
    } catch (error) {
      console.error('Error loading student progress:', error);
    } finally {
      setIsLoadingProgress(false);
    }
  }, [classId]);

  // Define all loaders as useCallback BEFORE any useEffect that references them
  const loadClassData = useCallback(async () => {
    try {
      const response = await teacherApi.getClassStudents(classId);
      if (response.success && response.data) {
        setClassData(response.data);
      }
    } catch (error) {
      console.error('Error loading class data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [classId]);

  const loadPendingStudents = useCallback(async () => {
    try {
      const response = await teacherApi.getPendingStudents(classId);
      if (response.success && response.data) {
        // PHASE 2: Backend now returns array directly, not wrapped in students
        const students = Array.isArray(response.data) ? response.data : (response.data.students || []);
        setPendingStudents(students);
      }
    } catch (error) {
      console.error('Error loading pending students:', error);
    }
  }, [classId]);

  const loadApprovedStudents = useCallback(async () => {
    try {
      const response = await teacherApi.getClassStudents(classId);
      if (response.success && response.data) {
        const students = response.data.studentIds || [];
        // Filter approved students: account_user with approved status
        const approved = students.filter((s: any) => 
          s.approvalStatus === 'approved' && s.userType === 'account_user'
        );
        setApprovedStudents(approved);
        
        // Filter roster students separately
        const roster = students.filter((s: any) => s.userType === 'roster_record');
        setRosterStudents(roster);
      }
    } catch (error) {
      console.error('Error loading approved students:', error);
    }
  }, [classId]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // Only teachers can access (removed admin access for cleaner separation)
    if (user?.role !== 'teacher') {
      router.push('/dashboard');
      return;
    }

    if (accessToken) {
      const { apiClient } = require('@/lib/api/client');
      apiClient.setToken(accessToken);
    }

    loadClassData();
    loadPendingStudents();
    loadApprovedStudents();
    if (activeTab === 'performance') {
      loadStudentProgress();
    }
    if (activeTab === 'drills') {
      loadClassDrills();
    }
  }, [isAuthenticated, user, router, accessToken, classId, activeTab, loadStudentProgress, loadClassData, loadPendingStudents, loadApprovedStudents]);

  // Auto-refresh student progress when on performance tab
  useEffect(() => {
    if (activeTab === 'performance' && classId) {
      // Initial load
      loadStudentProgress();
      // Set up polling every 30 seconds
      const progressInterval = setInterval(() => {
        loadStudentProgress();
      }, 30000);
      return () => clearInterval(progressInterval);
    }
  }, [activeTab, classId, loadStudentProgress]);

  // Auto-refresh approved students list every 60 seconds
  useEffect(() => {
    if (classId) {
      const studentsInterval = setInterval(() => {
        loadApprovedStudents();
        loadPendingStudents();
      }, 60000);
      return () => clearInterval(studentsInterval);
    }
  }, [classId, loadApprovedStudents, loadPendingStudents]);

  const handleApprove = async (studentId: string) => {
    setProcessingId(studentId);
    try {
      const response = await teacherApi.approveStudent(classId, studentId);
      if (response.success) {
        await loadPendingStudents();
        await loadApprovedStudents();
        alert('Student approved successfully!');
      } else {
        alert('Failed to approve student: ' + (response.message || 'Unknown error'));
      }
    } catch (error: any) {
      alert('Error approving student: ' + (error.message || 'Unknown error'));
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (studentId: string) => {
    const reason = prompt('Enter rejection reason (optional):');
    if (reason === null) return; // User cancelled

    setProcessingId(studentId);
    try {
      const response = await teacherApi.rejectStudent(classId, studentId, reason || undefined);
      if (response.success) {
        await loadPendingStudents();
        alert('Student rejected.');
      } else {
        alert('Failed to reject student: ' + (response.message || 'Unknown error'));
      }
    } catch (error: any) {
      alert('Error rejecting student: ' + (error.message || 'Unknown error'));
    } finally {
      setProcessingId(null);
    }
  };

  const handleGenerateQR = async () => {
    setIsGeneratingQR(true);
    try {
      const response = await classroomApi.generateQR(classId);
      if (response.success && response.data) {
        setQrCodeData(response.data);
        alert('QR code generated successfully! Students can now scan this QR code to join your class.');
      } else {
        alert('Failed to generate QR code: ' + (response.message || 'Unknown error'));
      }
    } catch (error: any) {
      alert('Error generating QR code: ' + (error.message || 'Unknown error'));
    } finally {
      setIsGeneratingQR(false);
    }
  };

  const handleCreateRosterStudent = async () => {
    if (!rosterFormData.name.trim()) {
      alert('Name is required');
      return;
    }

    setProcessingId('roster');
    try {
      const response = await teacherApi.createRosterStudent(classId, {
        name: rosterFormData.name.trim(),
        parentName: rosterFormData.parentName.trim() || undefined,
        parentPhone: rosterFormData.parentPhone.trim() || undefined,
        notes: rosterFormData.notes.trim() || undefined
      });

      if (response.success) {
        alert('Roster student created successfully!');
        setShowRosterForm(false);
        setRosterFormData({ name: '', parentName: '', parentPhone: '', notes: '' });
        await loadApprovedStudents(); // Reload to show new roster student in both tabs
      } else {
        alert('Failed to create roster student: ' + (response.message || 'Unknown error'));
      }
    } catch (error: any) {
      alert('Error creating roster student: ' + (error.message || 'Unknown error'));
    } finally {
      setProcessingId(null);
    }
  };

  const getSchoolId = (): string | undefined => getInstitutionId(user?.institutionId);

  // Phase 4: Load class drills
  const loadClassDrills = async () => {
    setIsLoadingDrills(true);
    try {
      const response = await drillsApi.list(getSchoolId());
      if (response.success && response.data) {
        // Filter drills for this class
        const filtered = response.data.filter((drill: any) => {
          // Check if drill is for this class
          if (drill.participantSelection?.type === 'class' && 
              drill.participantSelection?.classIds?.includes(classId)) {
            return true;
          }
          return false;
        });
        setClassDrills(filtered);
      }
    } catch (error) {
      console.error('Error loading class drills:', error);
      showToast('Failed to load drills', 'error');
    } finally {
      setIsLoadingDrills(false);
    }
  };

  // Phase 4: Start drill for class
  const handleStartDrill = async (drillType: Drill['type']) => {
    if (!confirm(`Start ${drillType} drill for this class?`)) return;

    try {
      const response = await teacherApi.startClassDrill(classId, drillType);
      if (response.success) {
        showToast(`${drillType} drill started successfully`, 'success');
        loadClassDrills();
        
        // Setup Socket.io listener for this drill
        const institutionId = getInstitutionId(user?.institutionId);
        
        if (institutionId && accessToken) {
          socketService.connect(institutionId, accessToken);
          socketService.on('DRILL_START', (data: any) => {
            if (data.drillId) {
              loadClassDrills();
            }
          });
        }
      } else {
        showToast('Failed to start drill', 'error');
      }
    } catch (error: any) {
      console.error('Error starting drill:', error);
      showToast('Failed to start drill: ' + (error.message || 'Unknown error'), 'error');
    }
  };

  // Phase 4: Schedule drill for class
  const handleScheduleDrill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!drillFormData.scheduledAt) {
      showToast('Please select a date and time', 'error');
      return;
    }

    try {
      const response = await drillsApi.create({
        schoolId: getSchoolId() || '',
        type: drillFormData.type,
        scheduledAt: drillFormData.scheduledAt,
        participantSelection: {
          type: 'class',
          classIds: [classId],
        },
      });

      if (response.success) {
        showToast('Drill scheduled successfully', 'success');
        setShowDrillForm(false);
        setDrillFormData({ type: 'fire', scheduledAt: '' });
        loadClassDrills();
      } else {
        showToast('Failed to schedule drill', 'error');
      }
    } catch (error: any) {
      console.error('Error scheduling drill:', error);
      showToast('Failed to schedule drill: ' + (error.message || 'Unknown error'), 'error');
    }
  };

  const isKG4Class = classData && (classData.grade === 'KG' || (parseInt(classData.grade) >= 1 && parseInt(classData.grade) <= 4));

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 p-6">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-4">Loading class details...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 p-6">
            <Card>
              <div className="text-center py-12">
                <p className="text-gray-500">Class not found</p>
                <Button onClick={() => router.push('/teacher/classes')} className="mt-4">
                  Back to Classes
                </Button>
              </div>
            </Card>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6">
          <div className="mb-6">
            <button
              onClick={() => router.push('/teacher/classes')}
              className="text-blue-600 hover:text-blue-800 mb-4"
            >
              ← Back to My Classes
            </button>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Grade {classData.grade} - Section {classData.section}
                </h1>
                <div className="mt-2 flex items-center space-x-4">
                  <p className="text-gray-600">
                    <span className="font-semibold">Class Code:</span>{' '}
                    <span className="font-mono text-lg bg-blue-50 px-3 py-1 rounded border border-blue-200">
                      {classData.classCode}
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={handleGenerateQR}
                  disabled={isGeneratingQR}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {isGeneratingQR ? 'Generating...' : 'Generate QR Code'}
                </Button>
              </div>
            </div>
            
            {qrCodeData && (
              <Card className="mt-4 p-4 bg-green-50 border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-green-800">QR Code Generated!</p>
                    <p className="text-xs text-green-600 mt-1">
                      Students can scan this QR code to join your class. Expires: {new Date(qrCodeData.expiresAt).toLocaleString()}
                    </p>
                  </div>
                  {qrCodeData.qrImage && (
                    <img src={qrCodeData.qrImage} alt="Class QR Code" className="w-24 h-24" />
                  )}
                </div>
              </Card>
            )}
          </div>

          {/* Tabs */}
          <div className="mb-6 border-b border-gray-200">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('pending')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'pending'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Pending Approval ({pendingStudents.length})
              </button>
              <button
                onClick={() => setActiveTab('approved')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'approved'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Approved Students ({approvedStudents.length})
              </button>
              <button
                onClick={() => {
                  setActiveTab('performance');
                  if (!studentProgress) {
                    loadStudentProgress();
                  }
                }}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'performance'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Student Performance
              </button>
              {isKG4Class && (
                <button
                  onClick={() => setActiveTab('roster')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'roster'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Roster Students
                </button>
              )}
              <button
                onClick={() => setActiveTab('drills')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'drills'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Drills
              </button>
            </nav>
          </div>

          {/* Pending Tab */}
          {activeTab === 'pending' && (
            <Card>
              {pendingStudents.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">No pending students</p>
                  <p className="text-gray-400 text-sm mt-2">All students have been processed</p>
                </div>
              ) : (
                <div className="space-y-4 p-6">
                  {pendingStudents.map((student) => {
                    const studentId = (student as any).id || (student as any)._id;
                    return (
                      <div key={studentId} className="border rounded-lg p-4 flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                              {student.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold">{student.name}</h3>
                              <p className="text-gray-600">{student.email}</p>
                              {student.phone && (
                                <p className="text-sm text-gray-500">Phone: {student.phone}</p>
                              )}
                              <p className="text-sm text-gray-500">
                                Requested: {new Date(student.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            onClick={() => handleApprove(studentId)}
                            disabled={processingId === studentId}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            {processingId === studentId ? 'Processing...' : 'Approve'}
                          </Button>
                          <Button
                            onClick={() => handleReject(studentId)}
                            disabled={processingId === studentId}
                            variant="outline"
                            className="border-red-300 text-red-600 hover:bg-red-50"
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          )}

          {/* Approved Tab */}
          {activeTab === 'approved' && (
            <Card>
              <div className="p-6">
                {approvedStudents.length === 0 && rosterStudents.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No approved students yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Account Users (Approved) */}
                    {approvedStudents.map((student) => {
                      const studentId = (student as any).id || (student as any)._id;
                      return (
                        <div key={studentId} className="border rounded-lg p-4 flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                              {student.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h3 className="font-semibold">{student.name}</h3>
                              <p className="text-sm text-gray-600">{student.email || 'No email'}</p>
                            </div>
                          </div>
                          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                            Approved
                          </span>
                        </div>
                      );
                    })}
                    {/* Roster Students */}
                    {rosterStudents.map((student: any) => {
                      const studentId = student.id || student._id;
                      return (
                        <div key={studentId} className="border rounded-lg p-4 flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                              {student.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold">{student.name}</h3>
                                <span className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded">
                                  Roster
                                </span>
                              </div>
                              {student.parentName && (
                                <p className="text-sm text-gray-600">Parent: {student.parentName}</p>
                              )}
                              {student.parentPhone && (
                                <p className="text-sm text-gray-600">Phone: {student.parentPhone}</p>
                              )}
                            </div>
                          </div>
                          <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
                            Teacher-Led
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Student Performance Tab */}
          {activeTab === 'performance' && (
            <div className="space-y-6">
              {isLoadingProgress ? (
                <LoadingSkeleton />
              ) : studentProgress && studentProgress.students ? (
                <>
                  {/* Quick Stats */}
                  {studentProgress.summary && (
                    <PerformanceMetricsCard
                      metrics={[
                        {
                          label: 'Total Students',
                          value: studentProgress.summary.totalStudents || 0,
                          color: 'blue'
                        },
                        {
                          label: 'Avg Modules',
                          value: (studentProgress.summary.avgModulesCompleted || 0).toFixed(1),
                          color: 'purple'
                        },
                        {
                          label: 'Avg Preparedness',
                          value: Math.round(studentProgress.summary.avgPreparednessScore || 0),
                          color: 'green'
                        },
                        {
                          label: 'Avg Login Streak',
                          value: (studentProgress.summary.avgLoginStreak || 0).toFixed(1),
                          color: 'indigo'
                        }
                      ]}
                    />
                  )}

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
                        <option value="quiz">Sort by Quiz Score</option>
                        <option value="name">Sort by Name</option>
                      </select>
                    </div>
                  </Card>

                  {/* Students Grid */}
                  {(() => {
                    const filtered = studentProgress.students
                      .filter((item: any) => {
                        if (!searchQuery) return true;
                        const query = searchQuery.toLowerCase();
                        return (
                          item.student?.name?.toLowerCase().includes(query) ||
                          item.student?.email?.toLowerCase().includes(query) ||
                          false
                        );
                      })
                      .sort((a: any, b: any) => {
                        switch (sortBy) {
                          case 'name':
                            return (a.student?.name || '').localeCompare(b.student?.name || '');
                          case 'modules':
                            return (b.modules?.completed || 0) - (a.modules?.completed || 0);
                          case 'quiz':
                            return (b.quiz?.avgScore || 0) - (a.quiz?.avgScore || 0);
                          case 'preparedness':
                            return (b.progress?.preparednessScore || 0) - (a.progress?.preparednessScore || 0);
                          default:
                            return 0;
                        }
                      });

                    return filtered.length === 0 ? (
                      <Card className="p-12">
                        <EmptyState
                          title="No Students Found"
                          description={searchQuery ? "Try adjusting your search query" : "No students in this class"}
                          icon={<Award className="w-12 h-12 text-gray-400" />}
                        />
                      </Card>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filtered.map((item: any) => {
                          const studentData: StudentPerformanceData = {
                            student: {
                              id: item.student?.id || item.student?._id || '',
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
                            quiz: {
                              totalQuizzes: item.quiz?.totalQuizzes || 0,
                              avgScore: item.quiz?.avgScore || 0,
                              passRate: item.quiz?.passRate || 0
                            },
                            games: {
                              totalGames: item.games?.totalGames || item.games?.played || 0,
                              totalXP: item.games?.totalXP || 0,
                              avgScore: item.games?.avgScore || item.games?.averageScore || 0
                            },
                            progress: {
                              preparednessScore: item.progress?.preparednessScore || item.preparednessScore || 0,
                              loginStreak: item.progress?.loginStreak || 0
                            },
                            lastActivity: item.lastActivity
                          };
                          return (
                            <StudentPerformanceCard
                              key={studentData.student.id}
                              data={studentData}
                              onClick={() => {
                                router.push(`/teacher/classes/${classId}/students/${studentData.student.id}`);
                              }}
                            />
                          );
                        })}
                      </div>
                    );
                  })()}
                </>
              ) : (
                <Card className="p-12">
                  <EmptyState
                    title="No Performance Data"
                    description="Student performance data will appear here once available"
                    icon={<TrendingUp className="w-12 h-12 text-gray-400" />}
                  />
                </Card>
              )}
            </div>
          )}

          {/* Roster Tab (KG-4 only) */}
          {activeTab === 'roster' && isKG4Class && (
            <Card>
              <div className="p-6">
                <div className="mb-4 flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Roster Students (KG-4)</h2>
                  <Button
                    onClick={() => setShowRosterForm(!showRosterForm)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {showRosterForm ? 'Cancel' : 'Add Roster Student'}
                  </Button>
                </div>

                {showRosterForm && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
                    <h3 className="font-semibold mb-4">Add Roster Student</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={rosterFormData.name}
                          onChange={(e) => setRosterFormData({ ...rosterFormData, name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          placeholder="Student name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Parent Name (Optional)
                        </label>
                        <input
                          type="text"
                          value={rosterFormData.parentName}
                          onChange={(e) => setRosterFormData({ ...rosterFormData, parentName: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          placeholder="Parent name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Parent Phone (Optional)
                        </label>
                        <input
                          type="text"
                          value={rosterFormData.parentPhone}
                          onChange={(e) => setRosterFormData({ ...rosterFormData, parentPhone: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          placeholder="10-digit phone number"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Notes (Optional)
                        </label>
                        <textarea
                          value={rosterFormData.notes}
                          onChange={(e) => setRosterFormData({ ...rosterFormData, notes: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          rows={2}
                          placeholder="Additional notes"
                        />
                      </div>
                      <Button
                        onClick={handleCreateRosterStudent}
                        disabled={processingId === 'roster' || !rosterFormData.name.trim()}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        {processingId === 'roster' ? 'Creating...' : 'Create Roster Student'}
                      </Button>
                    </div>
                  </div>
                )}

                <div className="text-sm text-gray-600 mb-4">
                  Roster students are for class lists and drills. They cannot log in to the app.
                </div>

                {/* Roster students list */}
                {rosterStudents.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No roster students yet. Use the &quot;Add Roster Student&quot; button to create them.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {rosterStudents.map((student: any) => (
                      <div
                        key={student._id || student.id}
                        className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-gray-900">{student.name}</h3>
                              <span className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded">
                                Roster
                              </span>
                            </div>
                            {student.parentName && (
                              <p className="text-sm text-gray-600 mt-1">
                                Parent: {student.parentName}
                              </p>
                            )}
                            {student.parentPhone && (
                              <p className="text-sm text-gray-600">
                                Phone: {student.parentPhone}
                              </p>
                            )}
                            {student.notes && (
                              <p className="text-sm text-gray-500 mt-1 italic">
                                {student.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Phase 4: Drills Tab */}
          {activeTab === 'drills' && (
            <Card>
              <div className="p-6">
                <div className="mb-4 flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Class Drills</h2>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => setShowDrillForm(!showDrillForm)}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {showDrillForm ? 'Cancel' : 'Schedule Drill'}
                    </Button>
                  </div>
                </div>

                {showDrillForm && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
                    <h3 className="font-semibold mb-4">Schedule Drill</h3>
                    <form onSubmit={handleScheduleDrill} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Drill Type
                        </label>
                        <select
                          value={drillFormData.type}
                          onChange={(e) => setDrillFormData({ ...drillFormData, type: e.target.value as Drill['type'] })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        >
                          <option value="fire">Fire</option>
                          <option value="earthquake">Earthquake</option>
                          <option value="flood">Flood</option>
                          <option value="cyclone">Cyclone</option>
                          <option value="stampede">Stampede</option>
                          <option value="heatwave">Heatwave</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Scheduled Date & Time
                        </label>
                        <input
                          type="datetime-local"
                          value={drillFormData.scheduledAt}
                          onChange={(e) => setDrillFormData({ ...drillFormData, scheduledAt: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white">
                        Schedule Drill
                      </Button>
                    </form>
                  </div>
                )}

                {/* Quick Start Buttons */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Quick Start</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <Button
                      onClick={() => handleStartDrill('fire')}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Fire Drill
                    </Button>
                    <Button
                      onClick={() => handleStartDrill('earthquake')}
                      className="bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Earthquake
                    </Button>
                    <Button
                      onClick={() => handleStartDrill('flood')}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Flood Drill
                    </Button>
                  </div>
                </div>

                {/* Active Drills */}
                {isLoadingDrills ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Loading drills...</p>
                  </div>
                ) : classDrills.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No drills for this class yet. Start a drill or schedule one above.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {classDrills
                      .filter((d) => d.status === 'active')
                      .map((drill) => (
                        <div key={drill._id} className="border border-orange-200 bg-orange-50 rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center space-x-2 mb-2">
                                <span className="font-semibold text-lg">{drill.type.toUpperCase()}</span>
                                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded">ACTIVE</span>
                              </div>
                              <p className="text-sm text-gray-600">
                                Started: {new Date(drill.scheduledAt).toLocaleString()}
                              </p>
                            </div>
                            <Link href={`/drills/${drill._id}`}>
                              <Button size="sm">View Details</Button>
                            </Link>
                          </div>
                        </div>
                      ))}

                    {/* Scheduled Drills */}
                    {classDrills
                      .filter((d) => d.status === 'scheduled')
                      .map((drill) => (
                        <div key={drill._id} className="border border-blue-200 bg-blue-50 rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center space-x-2 mb-2">
                                <span className="font-semibold text-lg">{drill.type.toUpperCase()}</span>
                                <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded">SCHEDULED</span>
                              </div>
                              <p className="text-sm text-gray-600">
                                Scheduled: {new Date(drill.scheduledAt).toLocaleString()}
                              </p>
                            </div>
                            <Link href={`/drills/${drill._id}`}>
                              <Button size="sm" variant="outline">View</Button>
                            </Link>
                          </div>
                        </div>
                      ))}

                    {/* Completed Drills */}
                    {classDrills
                      .filter((d) => d.status === 'completed')
                      .slice(0, 5)
                      .map((drill) => (
                        <div key={drill._id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center space-x-2 mb-2">
                                <span className="font-semibold">{drill.type.toUpperCase()}</span>
                                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">COMPLETED</span>
                              </div>
                              <p className="text-sm text-gray-600">
                                {drill.completionTime
                                  ? `Completed: ${new Date(drill.completionTime).toLocaleString()}`
                                  : `Scheduled: ${new Date(drill.scheduledAt).toLocaleString()}`}
                              </p>
                            </div>
                            <Link href={`/drills/${drill._id}`}>
                              <Button size="sm" variant="outline">View Summary</Button>
                            </Link>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}

