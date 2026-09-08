/**
 * Teacher Classes List Page
 * PHASE 4: Teacher view of all assigned classes with pending student counts
 */

'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store/auth-store';
import { teacherApi } from '@/lib/api/teacher';
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
  joinQRCode?: string;
  joinQRExpiresAt?: string;
}

export default function TeacherClassesPage() {
  const router = useRouter();
  const { user, isAuthenticated, accessToken } = useAuthStore();
  const [classes, setClasses] = useState<Class[]>([]);
  const [pendingCounts, setPendingCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [generatingQR, setGeneratingQR] = useState<string | null>(null);
  const [qrCodeData, setQrCodeData] = useState<Record<string, any>>({});
  const hasRefreshedRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // Only teachers can access
    if (user?.role !== 'teacher') {
      router.push('/dashboard');
      return;
    }

    if (accessToken) {
      const { apiClient } = require('@/lib/api/client');
      apiClient.setToken(accessToken);
    }

    // Refresh user data once on mount to get latest approvalStatus from server
    // Use a ref to prevent infinite loops
    if (!hasRefreshedRef.current) {
      hasRefreshedRef.current = true;
      const { useAuthStore } = require('@/lib/store/auth-store');
      useAuthStore.getState().refreshUser().then(() => {
        loadClasses();
      }).catch(() => {
        // If refresh fails, still load classes
        loadClasses();
      });
    } else {
      loadClasses();
    }
  }, [isAuthenticated, router, accessToken]); // Removed 'user' from dependencies to prevent loop

  const loadClasses = async () => {
    setIsLoading(true);
    try {
      const response = await teacherApi.getClasses();
      if (response.success && response.data) {
        const classesList = response.data.classes || [];
        console.log('[Teacher Classes] ✅ Loaded', classesList.length, 'classes');
        setClasses(classesList);

        // Load pending counts for each class
        const counts: Record<string, number> = {};
        for (const classItem of classesList) {
          try {
            const pendingResponse = await teacherApi.getPendingStudents(classItem._id);
            if (pendingResponse.success && pendingResponse.data) {
              // Handle both array and object formats
              const students = Array.isArray(pendingResponse.data) 
                ? pendingResponse.data 
                : (pendingResponse.data.students || []);
              counts[classItem._id] = students.length;
            }
          } catch (error) {
            console.error(`Error loading pending students for class ${classItem._id}:`, error);
            counts[classItem._id] = 0;
          }
        }
        setPendingCounts(counts);
      }
    } catch (error: any) {
      console.error('[Teacher Classes] ❌ Error loading classes:', error);
      // PHASE 2: Handle specific error codes from RBAC middleware
      if (error.response?.status === 403) {
        const errorData = error.response?.data || {};
        const errorCode = errorData.code;
        const errorMsg = errorData.message || 'Access denied';
        
        // Store error code for UI display
        if (errorCode === 'TEACHER_NOT_APPROVED') {
          // UI will show "Account Pending Approval" banner
          console.log('[Teacher Classes] Teacher not approved');
        } else if (errorCode === 'TEACHER_NO_INSTITUTION') {
          // UI will show "Institution Required" banner
          console.log('[Teacher Classes] Teacher has no institution');
        } else if (errorCode === 'TEACHER_DEACTIVATED') {
          // UI will show deactivated message
          console.log('[Teacher Classes] Teacher account deactivated');
        }
        
        // Don't show alert - UI banners will handle it
        setClasses([]);
      } else {
        // Other errors (network, etc.)
        console.error('[Teacher Classes] Unexpected error:', error);
        setClasses([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateQR = async (classId: string) => {
    setGeneratingQR(classId);
    try {
      const response = await classroomApi.generateQR(classId);
      if (response.success && response.data) {
        setQrCodeData(prev => ({ ...prev, [classId]: response.data }));
        alert('QR code generated successfully! Students can now scan this QR code to join your class.');
        // Reload classes to get updated QR code info
        loadClasses();
      } else {
        alert('Failed to generate QR code: ' + (response.message || 'Unknown error'));
      }
    } catch (error: any) {
      console.error('[Teacher Classes] QR generation error:', error);
      const errorMessage = error.message || 'Unknown error occurred';
      alert(`Error generating QR code: ${errorMessage}`);
    } finally {
      setGeneratingQR(null);
    }
  };

  const handleCopyClassCode = (classCode: string) => {
    navigator.clipboard.writeText(classCode);
    alert('Class code copied to clipboard!');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">My Classes</h1>
            <p className="text-gray-600 mt-2">Manage your assigned classes and approve student join requests</p>
          </div>

          {/* PHASE 2: Show specific error messages based on RBAC error codes */}
          {user && user.role === 'teacher' && (
            <>
              {user.approvalStatus !== 'approved' && (
                <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800 font-semibold">⚠️ Account Pending Approval</p>
                  <p className="text-xs text-yellow-700 mt-1">
                    Your account is pending approval. Please contact your administrator to get access.
                  </p>
                </div>
              )}
              {user.approvalStatus === 'approved' && !user.institutionId && (
                <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800 font-semibold">⚠️ Institution Required</p>
                  <p className="text-xs text-yellow-700 mt-1">
                    Your account is not yet linked to a school. Please contact your administrator.
                  </p>
                </div>
              )}
              {user.approvalStatus === 'approved' && user.institutionId && classes.length === 0 && !isLoading && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800 font-semibold">ℹ️ No Classes Assigned</p>
                  <p className="text-xs text-blue-700 mt-1">
                    You don&apos;t have any classes assigned yet. Contact your administrator to get assigned to a class.
                  </p>
                </div>
              )}
            </>
          )}

          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-500">Loading classes...</p>
            </div>
          ) : classes.length === 0 ? (
            <Card className="p-6">
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No classes assigned</p>
                <p className="text-gray-400 text-sm mt-2">Contact your administrator to get assigned to a class</p>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {classes.map((classItem) => {
                const pendingCount = pendingCounts[classItem._id] || 0;
                const approvedCount = classItem.studentIds?.length || 0;

                const hasQRCode = qrCodeData[classItem._id] || classItem.joinQRCode;
                const currentQRData = qrCodeData[classItem._id];

                return (
                  <Card key={classItem._id} className="p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                          {classItem.grade}-{classItem.section}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold">
                            Grade {classItem.grade} - Section {classItem.section}
                          </h3>
                          <p className="text-sm text-gray-500">{classItem.classCode}</p>
                        </div>
                      </div>
                    </div>

                    {/* Class Code Display */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                      <p className="text-xs text-gray-600 mb-1 font-medium">Class Code</p>
                      <p className="text-lg font-bold text-blue-700 font-mono">
                        {classItem.classCode}
                      </p>
                      <button
                        onClick={() => handleCopyClassCode(classItem.classCode)}
                        className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline"
                      >
                        Copy Code
                      </button>
                    </div>

                    {/* Student Stats */}
                    <div className="space-y-2 mb-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Approved Students:</span>
                        <span className="font-semibold">{approvedCount}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Pending Requests:</span>
                        <span className={`font-semibold ${pendingCount > 0 ? 'text-yellow-600' : 'text-gray-500'}`}>
                          {pendingCount}
                        </span>
                      </div>
                    </div>

                    {/* Pending Alert */}
                    {pendingCount > 0 && (
                      <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-800">
                          <strong>{pendingCount}</strong> student{pendingCount !== 1 ? 's' : ''} waiting for approval
                        </p>
                      </div>
                    )}

                    {/* Join Methods Info */}
                    <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-2 mb-3">
                      <p className="text-xs font-semibold text-gray-700 mb-1">Students can join using:</p>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="flex items-center gap-1 text-green-700">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                          </svg>
                          QR Code
                        </span>
                        <span className="text-gray-400">or</span>
                        <span className="flex items-center gap-1 text-blue-700">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Class Code
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2">
                      <button
                        className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => handleGenerateQR(classItem._id)}
                        disabled={generatingQR === classItem._id}
                      >
                        {generatingQR === classItem._id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Generating...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                            </svg>
                            {hasQRCode ? 'Regenerate QR Code' : 'Generate QR Code'}
                          </>
                        )}
                      </button>
                      
                      {hasQRCode && (
                        <div className="text-xs text-gray-500 text-center mb-2">
                          {currentQRData?.expiresAt && (
                            <div>Expires: {new Date(currentQRData.expiresAt).toLocaleString()}</div>
                          )}
                          {classItem.joinQRExpiresAt && !currentQRData && (
                            <div>Expires: {new Date(classItem.joinQRExpiresAt).toLocaleString()}</div>
                          )}
                        </div>
                      )}

                      <button
                        className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition"
                        onClick={() => router.push(`/teacher/classes/${classItem._id}/approvals`)}
                      >
                        {pendingCount > 0 ? `Review ${pendingCount} Request${pendingCount !== 1 ? 's' : ''}` : 'View Approvals'}
                      </button>

                      <button
                        className="w-full bg-gray-200 text-gray-700 py-2 rounded hover:bg-gray-300 transition"
                        onClick={() => router.push(`/teacher/classes/${classItem._id}`)}
                      >
                        View Class Details
                      </button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

