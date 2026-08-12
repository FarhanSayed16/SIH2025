/**
 * User Detail Page
 * View a single user's profile (admin/teacher access).
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store/auth-store';
import { usersApi, User } from '@/lib/api/users';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { ArrowLeft, User as UserIcon, Mail, Building2, Shield, Calendar, CheckCircle, XCircle } from 'lucide-react';

export default function UserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.userId as string;
  const { user: currentUser, isAuthenticated, accessToken } = useAuthStore();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (currentUser?.role !== 'admin' && currentUser?.role !== 'teacher') {
      router.push('/dashboard');
      return;
    }

    if (accessToken && userId) {
      loadUser();
    }
  }, [isAuthenticated, currentUser, router, accessToken, userId]);

  const loadUser = async () => {
    if (!userId) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await usersApi.getById(userId);
      if (response.success && response.data) {
        const userData = (response.data as { user?: User }).user ?? response.data as unknown as User;
        setUser(userData);
      } else {
        setError(response.message || 'Failed to load user');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load user');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-6">
            <div className="animate-pulse rounded-lg h-64 bg-gray-200" />
          </main>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-6">
            <Card className="p-6">
              <p className="text-red-600 mb-4">{error || 'User not found'}</p>
              <Link href="/users">
                <Button variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Users
                </Button>
              </Link>
            </Card>
          </main>
        </div>
      </div>
    );
  }

  const institutionName = typeof user.institutionId === 'object' && user.institutionId
    ? (user.institutionId as { name?: string }).name
    : null;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="mb-6 flex items-center gap-4">
            <Link href="/users">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Users
              </Button>
            </Link>
          </div>

          <Card className="p-6 max-w-2xl">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <UserIcon className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">{user.name}</h1>
                <p className="text-gray-500 capitalize">{user.role}</p>
                {user.approvalStatus && (
                  <span className={`inline-flex items-center gap-1 mt-1 text-sm ${
                    user.approvalStatus === 'approved' ? 'text-green-600' :
                    user.approvalStatus === 'rejected' ? 'text-red-600' : 'text-amber-600'
                  }`}>
                    {user.approvalStatus === 'approved' && <CheckCircle className="w-4 h-4" />}
                    {user.approvalStatus === 'rejected' && <XCircle className="w-4 h-4" />}
                    {user.approvalStatus}
                  </span>
                )}
              </div>
            </div>

            <dl className="grid gap-4 sm:grid-cols-1">
              {user.email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <dt className="text-sm text-gray-500">Email</dt>
                    <dd className="font-medium">{user.email}</dd>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-gray-400" />
                <div>
                  <dt className="text-sm text-gray-500">Role</dt>
                  <dd className="font-medium capitalize">{user.role}</dd>
                </div>
              </div>
              {institutionName && (
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-gray-400" />
                  <div>
                    <dt className="text-sm text-gray-500">Institution</dt>
                    <dd className="font-medium">{institutionName}</dd>
                  </div>
                </div>
              )}
              {(user.grade || user.section) && (
                <div className="flex items-center gap-3">
                  <UserIcon className="w-5 h-5 text-gray-400" />
                  <div>
                    <dt className="text-sm text-gray-500">Grade / Section</dt>
                    <dd className="font-medium">{[user.grade, user.section].filter(Boolean).join(' · ') || '—'}</dd>
                  </div>
                </div>
              )}
              {user.createdAt && (
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <dt className="text-sm text-gray-500">Joined</dt>
                    <dd className="font-medium">{new Date(user.createdAt).toLocaleDateString()}</dd>
                  </div>
                </div>
              )}
              {user.accessLevel && (
                <div>
                  <dt className="text-sm text-gray-500">Access level</dt>
                  <dd className="font-medium">{user.accessLevel}</dd>
                </div>
              )}
              <div>
                <dt className="text-sm text-gray-500">Status</dt>
                <dd className="font-medium">{user.isActive ? 'Active' : 'Inactive'}</dd>
              </div>
            </dl>
          </Card>
        </main>
      </div>
    </div>
  );
}
