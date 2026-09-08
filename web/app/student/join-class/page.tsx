/**
 * Student Join Class Page
 * Allows students to join a class using a class code
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';
import { joinClass, leaveClass, getStudentClassInfo } from '@/lib/api/students';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function JoinClassPage() {
  const router = useRouter();
  const { user, isAuthenticated, accessToken, refreshUser } = useAuthStore();
  const [classCode, setClassCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentClass, setCurrentClass] = useState<{
    classId?: string;
    grade?: string;
    section?: string;
    approvalStatus?: string;
  } | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // Only students can access this page
    if (user?.role !== 'student') {
      router.push('/dashboard');
      return;
    }

    // Load current class info
    loadCurrentClassInfo();
  }, [isAuthenticated, user, router]);

  const loadCurrentClassInfo = async () => {
    try {
      const response = await getStudentClassInfo();
      if (response.success && response.data) {
        const userData = response.data.user || response.data;
        setCurrentClass({
          classId: userData.classId,
          grade: userData.grade,
          section: userData.section,
          approvalStatus: userData.approvalStatus,
        });
      }
    } catch (error) {
      console.error('Error loading class info:', error);
    }
  };

  const handleJoinClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    if (!classCode.trim()) {
      setError('Please enter a class code');
      setIsLoading(false);
      return;
    }

    try {
      const response = await joinClass(classCode.trim());
      
      if (response.success) {
        setSuccess(response.message || 'Join request sent successfully!');
        setClassCode('');
        
        // Refresh user data to get updated class info
        if (refreshUser) {
          await refreshUser();
        }
        
        // Reload class info
        await loadCurrentClassInfo();
        
        // Show success message for a few seconds
        setTimeout(() => {
          setSuccess(null);
        }, 5000);
      } else {
        setError(response.message || 'Failed to join class');
      }
    } catch (err: any) {
      console.error('Join class error:', err);
      setError(
        err.response?.data?.message || 
        err.message || 
        'Failed to join class. Please check the class code and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeaveClass = async () => {
    if (!confirm('Are you sure you want to leave this class?')) {
      return;
    }

    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      const response = await leaveClass();
      
      if (response.success) {
        setSuccess(response.message || 'Successfully left the class');
        setCurrentClass(null);
        
        // Refresh user data
        if (refreshUser) {
          await refreshUser();
        }
        
        // Show success message
        setTimeout(() => {
          setSuccess(null);
        }, 5000);
      } else {
        setError(response.message || 'Failed to leave class');
      }
    } catch (err: any) {
      console.error('Leave class error:', err);
      setError(
        err.response?.data?.message || 
        err.message || 
        'Failed to leave class. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getApprovalStatusBadge = (status?: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
            ✅ Approved
          </span>
        );
      case 'pending':
        return (
          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
            ⏳ Pending Approval
          </span>
        );
      case 'rejected':
        return (
          <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
            ❌ Rejected
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        <aside className="w-64 hidden md:block h-full overflow-y-auto border-r bg-white">
          <Sidebar />
        </aside>

        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <Header />
          
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-2xl mx-auto">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Join a Class</h1>
              <p className="text-gray-600 mb-6">
                Enter your class code to join a class. You&apos;ll need approval from your teacher.
              </p>

              {/* Current Class Status */}
              {currentClass?.classId && (
                <Card className="mb-6 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Current Class
                      </h3>
                      <p className="text-gray-600">
                        Grade {currentClass.grade} - Section {currentClass.section}
                      </p>
                      <div className="mt-2">
                        {getApprovalStatusBadge(currentClass.approvalStatus)}
                      </div>
                    </div>
                    {currentClass.approvalStatus === 'approved' && (
                      <Button
                        onClick={handleLeaveClass}
                        variant="outline"
                        className="text-red-600 border-red-600 hover:bg-red-50"
                        disabled={isLoading}
                      >
                        Leave Class
                      </Button>
                    )}
                  </div>
                  
                  {currentClass.approvalStatus === 'pending' && (
                    <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        ⏳ Your join request is pending approval from your teacher. 
                        You&apos;ll be notified once approved.
                      </p>
                    </div>
                  )}
                </Card>
              )}

              {/* Join Class Form */}
              {!currentClass?.classId && (
                <Card className="p-6">
                  <form onSubmit={handleJoinClass}>
                    <div className="mb-4">
                      <label htmlFor="classCode" className="block text-sm font-medium text-gray-700 mb-2">
                        Class Code
                      </label>
                      <Input
                        id="classCode"
                        type="text"
                        value={classCode}
                        onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                        placeholder="Enter class code (e.g., 10A)"
                        required
                        disabled={isLoading}
                        className="w-full"
                      />
                      <p className="mt-2 text-sm text-gray-500">
                        Ask your teacher for the class code to join their class.
                      </p>
                    </div>

                    {error && (
                      <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-800">{error}</p>
                      </div>
                    )}

                    {success && (
                      <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-800">{success}</p>
                      </div>
                    )}

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isLoading || !classCode.trim()}
                    >
                      {isLoading ? 'Joining...' : 'Join Class'}
                    </Button>
                  </form>
                </Card>
              )}

              {/* Info Card */}
              <Card className="mt-6 p-6 bg-blue-50 border-blue-200">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">ℹ️ How it works</h3>
                <ul className="text-sm text-blue-800 space-y-2">
                  <li>• Enter the class code provided by your teacher</li>
                  <li>• Your join request will be sent to the teacher for approval</li>
                  <li>• Once approved, you&apos;ll have full access to class features</li>
                  <li>• You can only be in one class at a time</li>
                </ul>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}

