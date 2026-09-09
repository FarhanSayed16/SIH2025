/**
 * Drills page — schedule and manage drills (WB5 / WD09 honesty).
 */

'use client';

import { AppShell } from '@/components/layout/app-shell';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';
import {
  drillsApi,
  Drill,
  CreateDrillRequest,
  isDrillInProgress,
  formatParticipantScope,
  formatDrillTypeLabel,
  countAcknowledgedParticipants,
} from '@/lib/api/drills';
import { socketService } from '@/lib/services/socket-service';
import { getInstitutionId } from '@/lib/utils/institution';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import Link from 'next/link';

interface Class {
  _id: string;
  grade: string;
  section: string;
  classCode: string;
}

function formatWhen(value?: string | null) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString();
}

function elapsedLabel(from?: string | null) {
  if (!from) return null;
  const start = new Date(from).getTime();
  if (Number.isNaN(start)) return null;
  const mins = Math.max(0, Math.round((Date.now() - start) / 60000));
  if (mins < 60) return `${mins} min elapsed`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m elapsed`;
}

export default function DrillsPage() {
  const router = useRouter();
  const { user, isAuthenticated, accessToken } = useAuthStore();
  const { showToast } = useToast();
  const [drills, setDrills] = useState<Drill[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [triggeringId, setTriggeringId] = useState<string | null>(null);
  const getSchoolId = useCallback((): string | undefined => {
    return getInstitutionId(user?.institutionId);
  }, [user?.institutionId]);

  const [formData, setFormData] = useState<CreateDrillRequest>({
    schoolId: '',
    type: 'fire',
    scheduledAt: '',
  });
  const [activeTab, setActiveTab] = useState<'active' | 'scheduled' | 'history'>('active');
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isInitializedRef = useRef(false);

  const activeDrills = drills.filter((d) => isDrillInProgress(d.status));
  const scheduledDrills = drills.filter((d) => d.status === 'scheduled');
  const completedDrills = drills.filter((d) => d.status === 'completed');

  const loadClasses = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
      const response = await fetch(`${apiUrl}/teacher/classes`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.classes) {
          setClasses(data.data.classes);
        }
      }
    } catch (error) {
      console.error('Error loading classes:', error);
    }
  };

  const loadDrills = useCallback(
    async (opts?: { soft?: boolean }) => {
      const soft = opts?.soft === true;
      if (!soft) setIsLoading(true);
      setLoadError(null);
      try {
        const schoolId = getSchoolId();
        const response = await drillsApi.list(schoolId);
        if (response.success && response.data) {
          setDrills(response.data);
        } else {
          if (!soft) setDrills([]);
          setLoadError(response.message || 'Failed to load drills');
        }
      } catch (error: any) {
        console.error('Error loading drills:', error);
        if (!soft) setDrills([]);
        setLoadError(error?.message || 'Failed to load drills');
        if (!soft) showToast('Failed to load drills', 'error');
      } finally {
        setIsLoading(false);
      }
    },
    [getSchoolId, showToast]
  );

  useEffect(() => {
    const sid = getSchoolId();
    if (sid) {
      setFormData((prev) => ({ ...prev, schoolId: sid }));
    }
  }, [getSchoolId]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    loadDrills();
    if (user?.role === 'teacher' || user?.role === 'admin') {
      loadClasses();
    }

    const institutionId = getInstitutionId(user?.institutionId);

    if (institutionId && accessToken && !isInitializedRef.current) {
      isInitializedRef.current = true;

      socketService.on('DRILL_START', () => {
        showToast('Drill started', 'info');
        loadDrills({ soft: true });
      });
      socketService.on('DRILL_END', () => {
        showToast('Drill ended', 'success');
        loadDrills({ soft: true });
      });
      socketService.on('DRILL_PARTICIPATION_UPDATE', () => {
        loadDrills({ soft: true });
      });
      socketService.on('DRILL_SCHEDULED', () => {
        showToast('New drill scheduled', 'info');
        loadDrills({ soft: true });
      });
      socketService.on('DRILL_SUMMARY', () => {
        loadDrills({ soft: true });
      });
    }

    refreshIntervalRef.current = setInterval(() => {
      loadDrills({ soft: true });
    }, 30000);

    return () => {
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
      isInitializedRef.current = false;
    };
  }, [isAuthenticated, router, user, accessToken, loadDrills, showToast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const drillData: CreateDrillRequest = {
        ...formData,
        schoolId: getSchoolId() || '',
      };

      if (formData.classId) {
        drillData.participantSelection = {
          type: 'class',
          classIds: [formData.classId],
        };
      } else {
        drillData.participantSelection = { type: 'all' };
      }

      const response = await drillsApi.create(drillData);
      if (response.success) {
        showToast('Drill scheduled (not started)', 'success');
        setShowForm(false);
        setFormData((prev) => ({
          ...prev,
          schoolId: getSchoolId() || '',
          type: 'fire',
          scheduledAt: '',
          classId: undefined,
        }));
        loadDrills({ soft: true });
      } else {
        alert(response.message || 'Failed to create drill');
      }
    } catch (error) {
      console.error('Error creating drill:', error);
      alert('Failed to create drill');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTrigger = async (drillId: string) => {
    if (triggeringId) return;
    if (!confirm('Start this practice drill now for its selected audience?')) return;
    setTriggeringId(drillId);
    try {
      const response = await drillsApi.trigger(drillId);
      if (response.success) {
        showToast('Drill started', 'success');
        loadDrills({ soft: true });
      } else {
        alert(response.message || 'Failed to trigger drill');
      }
    } catch (error) {
      console.error('Error triggering drill:', error);
      alert('Failed to trigger drill');
    } finally {
      setTriggeringId(null);
    }
  };

  return (
    <AppShell title="Drills">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Drills</h1>
          <p className="text-sm text-gray-600 mt-1">
            Practice exercises for your institution. Status and times come from the drill record.
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Schedule drill'}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6 p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Drill type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="fire">Fire</option>
                <option value="earthquake">Earthquake</option>
                <option value="flood">Flood</option>
                <option value="cyclone">Cyclone</option>
                <option value="stampede">Stampede</option>
                <option value="heatwave">Heatwave</option>
              </select>
            </div>

            {(user?.role === 'teacher' || user?.role === 'admin') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Audience</label>
                <select
                  value={formData.classId || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, classId: e.target.value || undefined })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Institution-wide (all eligible participants)</option>
                  {classes.map((cls) => (
                    <option key={cls._id} value={cls._id}>
                      Grade {cls.grade} - Section {cls.section} ({cls.classCode})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Leaving class empty schedules an institution-wide drill, not “all of your classes
                  only”.
                </p>
              </div>
            )}

            <div>
              <Input
                label="Scheduled date & time"
                type="datetime-local"
                value={formData.scheduledAt}
                onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Browser local timezone ({Intl.DateTimeFormat().resolvedOptions().timeZone}). This
                creates a scheduled record — it does not start the drill.
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Scheduling…' : 'Schedule drill'}
            </Button>
          </form>
        </Card>
      )}

      <div className="mb-4 border-b border-gray-200">
        <nav className="flex flex-wrap gap-4">
          {(
            [
              ['active', `In progress (${activeDrills.length})`],
              ['scheduled', `Scheduled (${scheduledDrills.length})`],
              ['history', `History (${completedDrills.length})`],
            ] as const
          ).map(([tab, label]) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab
                  ? 'border-teal-700 text-teal-800'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>

      <Card>
        {isLoading && drills.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">Loading drills…</p>
          </div>
        ) : loadError && drills.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-red-700 font-medium">Could not load drills</p>
            <p className="text-sm text-gray-600 mt-1">{loadError}</p>
            <Button className="mt-4" variant="outline" onClick={() => loadDrills()}>
              Retry
            </Button>
          </div>
        ) : (
          <>
            {loadError && (
              <div className="px-4 py-2 text-sm text-amber-800 bg-amber-50 border-b border-amber-100">
                Refresh issue: {loadError}{' '}
                <button type="button" className="underline" onClick={() => loadDrills({ soft: true })}>
                  Retry
                </button>
              </div>
            )}
            {activeTab === 'active' && (
              <ActiveDrillsSection drills={activeDrills} />
            )}
            {activeTab === 'scheduled' && (
              <ScheduledDrillsSection
                drills={scheduledDrills}
                onTrigger={handleTrigger}
                triggeringId={triggeringId}
              />
            )}
            {activeTab === 'history' && <DrillHistorySection drills={completedDrills} />}
          </>
        )}
      </Card>
    </AppShell>
  );
}

function DrillRowMeta({ drill }: { drill: Drill }) {
  const ack = countAcknowledgedParticipants(drill);
  const participantCount = Array.isArray(drill.participants) ? drill.participants.length : null;
  return (
    <div className="text-sm text-gray-600 space-y-0.5 mt-1">
      <p>Scope: {formatParticipantScope(drill.participantSelection)}</p>
      {participantCount != null && (
        <p>
          Participants on record: {participantCount}
          {ack != null ? ` · Acknowledged: ${ack}` : ''}
        </p>
      )}
    </div>
  );
}

function ActiveDrillsSection({ drills }: { drills: Drill[] }) {
  if (drills.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">No drills currently in progress</p>
        <p className="text-xs text-gray-400 mt-1">
          Old records stay in History once completed — they are not auto-finished in the browser.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {drills.map((drill) => {
        const started = formatWhen(drill.actualStart);
        const age = elapsedLabel(drill.actualStart);
        return (
          <div key={drill._id} className="p-4 flex flex-wrap justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="font-semibold text-gray-900">
                  {formatDrillTypeLabel(drill.type)} drill
                </span>
                <span className="bg-orange-100 text-orange-900 text-xs px-2 py-0.5 rounded">
                  in progress
                </span>
              </div>
              <p className="text-sm text-gray-600">
                {started ? (
                  <>
                    Actual start: {started}
                    {age ? ` (${age})` : ''}
                  </>
                ) : (
                  <>Actual start unavailable · Scheduled: {formatWhen(drill.scheduledAt) || '—'}</>
                )}
              </p>
              <DrillRowMeta drill={drill} />
            </div>
            <Link
              href={`/drills/${drill._id}`}
              className="text-sm font-medium text-teal-800 hover:underline self-start"
            >
              Details
            </Link>
          </div>
        );
      })}
    </div>
  );
}

function ScheduledDrillsSection({
  drills,
  onTrigger,
  triggeringId,
}: {
  drills: Drill[];
  onTrigger: (id: string) => void;
  triggeringId: string | null;
}) {
  if (drills.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">No scheduled drills</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {drills.map((drill) => (
        <div key={drill._id} className="p-4 flex flex-wrap justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold">{formatDrillTypeLabel(drill.type)}</span>
              <span className="bg-blue-50 text-blue-800 text-xs px-2 py-0.5 rounded">scheduled</span>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Scheduled: {formatWhen(drill.scheduledAt) || '—'}
            </p>
            <DrillRowMeta drill={drill} />
          </div>
          <div className="flex gap-2 items-start">
            <Link
              href={`/drills/${drill._id}`}
              className="text-sm font-medium text-teal-800 hover:underline px-2 py-1"
            >
              Details
            </Link>
            <Button
              variant="danger"
              size="sm"
              disabled={triggeringId === drill._id}
              onClick={() => onTrigger(drill._id)}
            >
              {triggeringId === drill._id ? 'Starting…' : 'Start now'}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

function DrillHistorySection({ drills }: { drills: Drill[] }) {
  if (drills.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">No completed drills in this list</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {drills.map((drill) => {
        const completed = formatWhen(drill.completedAt || drill.completionTime);
        const started = formatWhen(drill.actualStart);
        return (
          <div key={drill._id} className="p-4 flex flex-wrap justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{formatDrillTypeLabel(drill.type)}</span>
                <span className="bg-green-50 text-green-800 text-xs px-2 py-0.5 rounded">
                  completed
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {completed ? `Completed: ${completed}` : 'Completed time unavailable'}
              </p>
              {started && <p className="text-sm text-gray-500">Actual start: {started}</p>}
              <p className="text-xs text-gray-400">
                Originally scheduled: {formatWhen(drill.scheduledAt) || '—'}
              </p>
              <DrillRowMeta drill={drill} />
            </div>
            <Link
              href={`/drills/${drill._id}`}
              className="text-sm font-medium text-teal-800 hover:underline"
            >
              Summary
            </Link>
          </div>
        );
      })}
    </div>
  );
}
