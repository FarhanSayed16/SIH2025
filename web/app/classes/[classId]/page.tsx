/**
 * Class Details Page
 * PHASE C: Teacher view of class with pending students and approval actions
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';
import { teacherApi, PendingStudent, ClassStudent } from '@/lib/api/teacher';
import { classroomApi } from '@/lib/api/classroom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';

interface Class {
  _id: string;
  grade: string;
  section: string;
  classCode: string;
  teacherId: { _id: string; name: string; email: string };
  studentIds?: any[];
  institutionId?: { _id: string; name: string };
}

export default function ClassDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const classId = params.classId as string;
  const { user, isAuthenticated, accessToken } = useAuthStore();
  const [classData, setClassData] = useState<Class | null>(null);
  const [pendingStudents, setPendingStudents] = useState<PendingStudent[]>([]);
  const [approvedStudents, setApprovedStudents] = useState<ClassStudent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'roster'>('pending');
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

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // Only teachers and admins can access
    if (user?.role !== 'teacher' && user?.role !== 'admin') {
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
  }, [isAuthenticated, user, router, accessToken, classId]);

  const loadClassData = async () => {
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
  };

  const loadPendingStudents = async () => {
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
  };

  const loadApprovedStudents = async () => {
    try {
      const response = await teacherApi.getClassStudents(classId);
      if (response.success && response.data) {
        const students = response.data.studentIds || [];
        // Filter approved students (account_user with approved status)
        const approved = students.filter((s: any) => 
          s.approvalStatus === 'approved' && s.userType === 'account_user'
        );
        setApprovedStudents(approved);
      }
    } catch (error) {
      console.error('Error loading approved students:', error);
    }
  };

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
        await loadApprovedStudents(); // Reload to show new roster student
      } else {
        alert('Failed to create roster student: ' + (response.message || 'Unknown error'));
      }
    } catch (error: any) {
      alert('Error creating roster student: ' + (error.message || 'Unknown error'));
    } finally {
      setProcessingId(null);
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
              onClick={() => router.push('/classes')}
              className="text-blue-600 hover:text-blue-800 mb-4"
            >
              ← Back to Classes
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
              {/* Generate QR button moved to Join Methods Card below */}
            </div>
            
            {/* Join Methods Card - QR Code + Manual Code */}
            <Card className="mt-4 p-6 bg-gradient-to-br from-blue-50 to-green-50 border-2 border-blue-200">
              <div className="mb-4">
                <h2 className="text-xl font-bold text-gray-900 mb-2">Share Class Join Information</h2>
                <p className="text-sm text-gray-600">
                  Students can join your class using either the QR code or the manual class code below.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* QR Code Section */}
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                      </svg>
                      QR Code
                    </h3>
                    {!qrCodeData && (
                      <Button
                        onClick={handleGenerateQR}
                        disabled={isGeneratingQR}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        {isGeneratingQR ? 'Generating...' : 'Generate QR'}
                      </Button>
                    )}
                  </div>
                  
                  {qrCodeData ? (
                    <div className="space-y-3">
                      <div className="flex justify-center bg-white p-4 rounded-lg border-2 border-green-300">
                        {qrCodeData.qrImage && (
                          <img 
                            src={qrCodeData.qrImage} 
                            alt="Class QR Code" 
                            className="w-48 h-48"
                          />
                        )}
                      </div>
                      <div className="text-center space-y-2">
                        <p className="text-xs text-gray-500">
                          Expires: {new Date(qrCodeData.expiresAt).toLocaleString()}
                        </p>
                        <div className="flex gap-2 justify-center">
                          <Button
                            onClick={() => {
                              if (qrCodeData.qrImage) {
                                const link = document.createElement('a');
                                link.href = qrCodeData.qrImage;
                                link.download = `class-qr-${classData.classCode}.png`;
                                link.click();
                              }
                            }}
                            size="sm"
                            variant="outline"
                            className="text-xs"
                          >
                            Download QR
                          </Button>
                          <Button
                            onClick={handleGenerateQR}
                            disabled={isGeneratingQR}
                            size="sm"
                            variant="outline"
                            className="text-xs"
                          >
                            Regenerate
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                      <svg className="w-16 h-16 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                      </svg>
                      <p className="text-sm text-gray-500 mt-2">No QR code generated yet</p>
                      <p className="text-xs text-gray-400 mt-1">Click "Generate QR" to create one</p>
                    </div>
                  )}
                </div>

                {/* Manual Class Code Section */}
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Class Code
                    </h3>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-6 text-center">
                      <p className="text-xs text-gray-600 mb-2 font-medium">Class Code</p>
                      <p className="text-3xl font-bold text-blue-700 font-mono tracking-wider">
                        {classData.classCode}
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Button
                        onClick={() => {
                          navigator.clipboard.writeText(classData.classCode);
                          alert('Class code copied to clipboard!');
                        }}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        size="sm"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy Class Code
                      </Button>
                      
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <p className="text-xs text-gray-600 mb-1 font-semibold">Instructions for Students:</p>
                        <ul className="text-xs text-gray-500 space-y-1 text-left">
                          <li>• Open the mobile app</li>
                          <li>• Go to "Join a Class"</li>
                          <li>• Enter this code manually or scan QR</li>
                          <li>• Wait for teacher approval</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Info Banner */}
              <div className="mt-4 bg-blue-100 border border-blue-300 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm text-blue-800">
                    <p className="font-semibold mb-1">Both methods work!</p>
                    <p className="text-xs">
                      Students can use either the QR code (scan with mobile app) or the class code (enter manually). 
                      If QR code doesn't work, students can always use the manual class code.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
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
                    const studentId = (student as any).id || student.id;
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
                {approvedStudents.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No approved students yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {approvedStudents.map((student) => {
                      const studentId = (student as any).id || student._id;
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
                  </div>
                )}
              </div>
            </Card>
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

                {/* Roster students list would go here - can be loaded from classData.studentIds filtered by userType='roster_record' */}
                <div className="text-center py-8 text-gray-500">
                  Roster students will appear here. Use the "Add Roster Student" button to create them.
                </div>
              </div>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}

