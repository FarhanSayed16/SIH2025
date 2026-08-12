/**
 * Unauthorized / Access Denied page
 */

'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function UnauthorizedPage() {
  const router = useRouter();
  const { user, isAdmin, isTeacher, isStudent, isParent } = useAuthStore();

  const getRoleDisplay = () => {
    if (isAdmin()) return 'Admin';
    if (isTeacher()) return 'Teacher';
    if (isStudent()) return 'Student';
    if (isParent()) return 'Parent';
    return 'User';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="max-w-md w-full p-8 text-center">
        <div className="mb-6">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">
            You do not have permission to access this resource.
          </p>
        </div>

        {user && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Logged in as:</p>
            <p className="font-medium text-gray-900">{user.name}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
            <p className="text-xs text-gray-400 mt-1">Role: {getRoleDisplay()}</p>
          </div>
        )}

        <div className="space-y-3">
          <Button
            onClick={() => router.push('/dashboard')}
            className="w-full"
          >
            Go to Dashboard
          </Button>
          <Button
            onClick={() => router.back()}
            variant="outline"
            className="w-full"
          >
            Go Back
          </Button>
        </div>
      </Card>
    </div>
  );
}

