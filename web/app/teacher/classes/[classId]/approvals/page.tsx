/**
 * Teacher: Student Approval Page
 * Moved from /classes/[classId]/approvals to /teacher/classes/[classId]/approvals
 * RBAC Refinement: View and approve/reject pending student join requests
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';
import { classroomApi, ClassroomJoinRequest } from '@/lib/api/classroom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';

export default function TeacherClassApprovalsPage() {
  const router = useRouter();
  const params = useParams();
  const classId = params.classId as string;
  const { user, isAuthenticated, accessToken } = useAuthStore();
  const [requests, setRequests] = useState<ClassroomJoinRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

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

    loadRequests();
  }, [isAuthenticated, user, router, accessToken, classId]);

  const loadRequests = async () => {
    setIsLoading(true);
    try {
      const response = await classroomApi.getPendingRequests(classId);
      if (response.success && response.data) {
        setRequests(response.data.requests || []);
      }
    } catch (error) {
      console.error('Error loading join requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    setProcessingId(requestId);
    try {
      const response = await classroomApi.approveRequest(requestId);
      if (response.success) {
        // Reload requests
        await loadRequests();
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

  const handleReject = async (requestId: string) => {
    const reason = prompt('Enter rejection reason (optional):');
    if (reason === null) return; // User cancelled

    setProcessingId(requestId);
    try {
      const response = await classroomApi.rejectRequest(requestId, reason || undefined);
      if (response.success) {
        // Reload requests
        await loadRequests();
        alert('Student request rejected.');
      } else {
        alert('Failed to reject request: ' + (response.message || 'Unknown error'));
      }
    } catch (error: any) {
      alert('Error rejecting request: ' + (error.message || 'Unknown error'));
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6">
          <div className="mb-6">
            <button
              onClick={() => router.push(`/teacher/classes/${classId}`)}
              className="text-blue-600 hover:text-blue-800 mb-4"
            >
              ← Back to Class Details
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Pending Student Approvals</h1>
            <p className="text-gray-600 mt-2">Review and approve student join requests</p>
          </div>

          {isLoading ? (
            <Card>
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-4">Loading requests...</p>
              </div>
            </Card>
          ) : requests.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No pending requests</p>
                <p className="text-gray-400 text-sm mt-2">All students have been processed</p>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <Card key={request._id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                          {request.studentInfo.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900">
                            {request.studentInfo.name}
                          </h3>
                          <p className="text-gray-600">{request.studentInfo.email}</p>
                          {request.studentInfo.phone && (
                            <p className="text-sm text-gray-500">Phone: {request.studentInfo.phone}</p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-500">Class</p>
                          <p className="font-semibold">
                            Grade {request.classId.grade} - Section {request.classId.section}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Requested</p>
                          <p className="font-semibold">
                            {new Date(request.requestedAt).toLocaleDateString()}
                          </p>
                        </div>
                        {request.studentInfo.parentName && (
                          <div>
                            <p className="text-sm text-gray-500">Parent</p>
                            <p className="font-semibold">{request.studentInfo.parentName}</p>
                            {request.studentInfo.parentPhone && (
                              <p className="text-sm text-gray-500">{request.studentInfo.parentPhone}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col space-y-2 ml-4">
                      <Button
                        onClick={() => handleApprove(request._id)}
                        disabled={processingId === request._id}
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg"
                      >
                        {processingId === request._id ? 'Processing...' : 'Approve'}
                      </Button>
                      <Button
                        onClick={() => handleReject(request._id)}
                        disabled={processingId === request._id}
                        variant="outline"
                        className="border-red-300 text-red-600 hover:bg-red-50 px-6 py-2 rounded-lg"
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

