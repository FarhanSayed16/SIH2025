/**
 * Teacher Classes List — compact cards, honest pending counts, QR share dialog (WB3).
 */

'use client';

import { AppShell } from '@/components/layout/app-shell';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store/auth-store';
import { teacherApi } from '@/lib/api/teacher';
import { classroomApi, ClassroomQR } from '@/lib/api/classroom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ClassroomQRShareDialog,
  ClassShareInfo,
} from '@/components/teacher/ClassroomQRShareDialog';

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

/** null = request failed / unknown; number = successful count (including 0). */
type PendingMap = Record<string, number | null>;

export default function TeacherClassesPage() {
  const router = useRouter();
  const { user, isAuthenticated, accessToken } = useAuthStore();
  const [classes, setClasses] = useState<Class[]>([]);
  const [pendingCounts, setPendingCounts] = useState<PendingMap>({});
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [listLoadedOk, setListLoadedOk] = useState(false);
  const [generatingQR, setGeneratingQR] = useState<string | null>(null);
  const [sessionQR, setSessionQR] = useState<Record<string, ClassroomQR>>({});
  const [shareTarget, setShareTarget] = useState<ClassShareInfo | null>(null);
  const hasRefreshedRef = useRef(false);

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

    if (!hasRefreshedRef.current) {
      hasRefreshedRef.current = true;
      const { useAuthStore: store } = require('@/lib/store/auth-store');
      store
        .getState()
        .refreshUser()
        .then(() => loadClasses())
        .catch(() => loadClasses());
    } else {
      loadClasses();
    }
  }, [isAuthenticated, router, accessToken]);

  const loadClasses = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const response = await teacherApi.getClasses();
      if (response.success && response.data) {
        const classesList = response.data.classes || [];
        setClasses(classesList);
        setListLoadedOk(true);

        const counts: PendingMap = {};
        await Promise.all(
          classesList.map(async (classItem: Class) => {
            try {
              const pendingResponse = await teacherApi.getPendingStudents(classItem._id);
              if (pendingResponse.success && pendingResponse.data !== undefined) {
                const students = Array.isArray(pendingResponse.data)
                  ? pendingResponse.data
                  : pendingResponse.data.students || [];
                counts[classItem._id] = students.length;
              } else {
                counts[classItem._id] = null;
              }
            } catch {
              counts[classItem._id] = null;
            }
          })
        );
        setPendingCounts(counts);
      } else {
        setLoadError(response.message || 'Failed to load classes');
        setListLoadedOk(false);
        setClasses([]);
      }
    } catch (error: any) {
      console.error('[Teacher Classes] Error loading classes:', error);
      setLoadError(error?.message || 'Failed to load classes');
      setListLoadedOk(false);
      setClasses([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateQR = async (classId: string) => {
    setGeneratingQR(classId);
    try {
      const response = await classroomApi.generateQR(classId);
      if (response.success && response.data) {
        setSessionQR((prev) => ({ ...prev, [classId]: response.data! }));
        // Refresh list for updated server hash/expiry metadata only
        const list = await teacherApi.getClasses();
        if (list.success && list.data?.classes) {
          setClasses(list.data.classes);
        }
      } else {
        alert('Failed to generate QR code: ' + (response.message || 'Unknown error'));
      }
    } catch (error: any) {
      alert(`Error generating QR code: ${error.message || 'Unknown error'}`);
    } finally {
      setGeneratingQR(null);
    }
  };

  const openShare = (classItem: Class) => {
    setShareTarget({
      classId: classItem._id,
      grade: classItem.grade,
      section: classItem.section,
      classCode: classItem.classCode,
      joinQRCode: classItem.joinQRCode,
      joinQRExpiresAt: classItem.joinQRExpiresAt,
    });
  };

  return (
    <AppShell title="My Classes">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">My classes</h1>
        <p className="text-gray-600 mt-1 text-sm sm:text-base">
          Open a class to manage requests, roster, and drills. Share the join code when students need it.
        </p>
      </div>

      {user?.role === 'teacher' && (
        <div className="space-y-3 mb-6">
          {user.approvalStatus !== 'approved' && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-900 font-semibold">Account pending approval</p>
              <p className="text-xs text-amber-800 mt-1">
                Contact your administrator before class tools are fully available.
              </p>
            </div>
          )}
          {user.approvalStatus === 'approved' && !user.institutionId && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-900 font-semibold">Institution required</p>
              <p className="text-xs text-amber-800 mt-1">
                Your account is not linked to a school yet.
              </p>
            </div>
          )}
        </div>
      )}

      {loadError && (
        <Card className="p-4 mb-6 border-red-200 bg-red-50">
          <p className="text-sm text-red-800 font-medium">{loadError}</p>
          <Button type="button" className="mt-3 min-h-11" variant="outline" onClick={loadClasses}>
            Retry
          </Button>
        </Card>
      )}

      {isLoading ? (
        <div className="text-center py-12" role="status">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-700 mx-auto" />
          <p className="mt-4 text-gray-500">Loading classes…</p>
        </div>
      ) : listLoadedOk && classes.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-gray-800 font-medium">No classes assigned</p>
          <p className="text-gray-500 text-sm mt-2">
            Contact your administrator to get assigned to a class.
          </p>
        </Card>
      ) : classes.length > 0 ? (
        <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {classes.map((classItem) => {
            const pending = pendingCounts[classItem._id];
            const enrolledCount = classItem.studentIds?.length ?? 0;
            const expiry = classItem.joinQRExpiresAt
              ? new Date(classItem.joinQRExpiresAt)
              : null;
            const expiryLabel =
              expiry && Number.isFinite(expiry.getTime())
                ? expiry.getTime() < Date.now()
                  ? `QR hash expired ${expiry.toLocaleDateString()}`
                  : `QR hash expires ${expiry.toLocaleDateString()}`
                : null;

            return (
              <li key={classItem._id}>
                <Card className="p-5 h-full flex flex-col border border-gray-200 shadow-sm">
                  <div className="mb-3">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Grade {classItem.grade} · Section {classItem.section}
                    </h2>
                    {classItem.institutionId?.name && (
                      <p className="text-xs text-gray-500 mt-0.5">{classItem.institutionId.name}</p>
                    )}
                    <p className="mt-2 text-sm text-gray-600">
                      Code{' '}
                      <span className="font-mono font-semibold text-gray-900">{classItem.classCode}</span>
                    </p>
                  </div>

                  <dl className="text-sm space-y-1 mb-4 flex-1">
                    <div className="flex justify-between gap-2">
                      <dt className="text-gray-600">Enrolled (roster)</dt>
                      <dd className="font-medium text-gray-900">{enrolledCount}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-gray-600">Pending requests</dt>
                      <dd className="font-medium text-gray-900">
                        {pending === null || pending === undefined ? (
                          <span className="text-amber-800">Unavailable</span>
                        ) : (
                          pending
                        )}
                      </dd>
                    </div>
                    {expiryLabel && (
                      <p className="text-xs text-gray-500 pt-1">{expiryLabel}</p>
                    )}
                  </dl>

                  {typeof pending === 'number' && pending > 0 && (
                    <p className="text-sm text-amber-900 bg-amber-50 border border-amber-100 rounded-md px-3 py-2 mb-3">
                      {pending} waiting for approval
                    </p>
                  )}

                  <div className="flex flex-col gap-2 mt-auto">
                    <Link
                      href={`/teacher/classes/${classItem._id}`}
                      className="inline-flex items-center justify-center min-h-11 rounded-lg bg-[var(--kavach-primary,#216E39)] text-white text-sm font-medium hover:opacity-90"
                    >
                      Open class
                    </Link>
                    <Button
                      type="button"
                      variant="outline"
                      className="min-h-11 w-full"
                      onClick={() => openShare(classItem)}
                    >
                      Share join code
                    </Button>
                    {typeof pending === 'number' && pending > 0 && (
                      <Link
                        href={`/teacher/classes/${classItem._id}?tab=pending`}
                        className="inline-flex items-center justify-center min-h-11 text-sm font-medium text-amber-900 underline-offset-2 hover:underline"
                      >
                        Review pending requests
                      </Link>
                    )}
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      ) : null}

      <ClassroomQRShareDialog
        open={Boolean(shareTarget)}
        onClose={() => setShareTarget(null)}
        classInfo={shareTarget}
        sessionQR={shareTarget ? sessionQR[shareTarget.classId] || null : null}
        generating={shareTarget ? generatingQR === shareTarget.classId : false}
        onGenerate={() => shareTarget && handleGenerateQR(shareTarget.classId)}
      />
    </AppShell>
  );
}
