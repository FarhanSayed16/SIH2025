/**
 * Drills page - Schedule and manage drills
 */

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';
import { drillsApi, Drill, CreateDrillRequest } from '@/lib/api/drills';
import { socketService, SocketEvent } from '@/lib/services/socket-service';
import { getInstitutionId } from '@/lib/utils/institution';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { useToast } from '@/components/ui/toast';
import Link from 'next/link';

interface Class {
  _id: string;
  grade: string;
  section: string;
  classCode: string;
}

export default function DrillsPage() {
  const router = useRouter();
  const { user, isAuthenticated, accessToken } = useAuthStore();
  const { showToast } = useToast();
  const [drills, setDrills] = useState<Drill[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const getSchoolId = useCallback((): string | undefined => {
    return getInstitutionId(user?.institutionId);
  }, [user?.institutionId]);

  const [formData, setFormData] = useState<CreateDrillRequest>({
    schoolId: '',
    type: 'fire',
    scheduledAt: '',
  });
  const [activeTab, setActiveTab] = useState<'active' | 'scheduled' | 'history'>('active');
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef(false);

  // Phase 4: Filter drills by status
  const activeDrills = drills.filter(d => d.status === 'in_progress' || d.status === 'active');
  const scheduledDrills = drills.filter(d => d.status === 'scheduled');
  const completedDrills = drills.filter(d => d.status === 'completed');

  const loadClasses = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
      const response = await fetch(`${apiUrl}/teacher/classes`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
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

  const loadDrills = useCallback(async () => {
    setIsLoading(true);
    try {
      const schoolId = getSchoolId();
      const response = await drillsApi.list(schoolId);
      if (response.success && response.data) {
        setDrills(response.data);
      }
    } catch (error) {
      console.error('Error loading drills:', error);
      showToast('Failed to load drills', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [getSchoolId, showToast]);

  // Sync form default schoolId when user/institution is available
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
    // Load classes for teachers
    if (user?.role === 'teacher' || user?.role === 'admin') {
      loadClasses();
    }

    // Phase 4: Setup Socket.io listeners for real-time updates
    const institutionId = getInstitutionId(user?.institutionId);

    if (institutionId && accessToken && !isInitializedRef.current) {
      isInitializedRef.current = true;
      socketService.connect(institutionId, accessToken);

      // Listen for drill start events
      socketService.on('DRILL_START', (data: any) => {
        showToast('Drill started: ' + (data.type || 'Unknown'), 'info');
        loadDrills();
      });

      // Listen for drill end events
      socketService.on('DRILL_END', (data: any) => {
        showToast('Drill ended', 'success');
        loadDrills();
      });

      // Phase 4: Listen for participation updates
      socketService.on('DRILL_PARTICIPATION_UPDATE', (data: any) => {
        // Update drills list to reflect new participation stats
        loadDrills();
      });

      // Listen for drill scheduled events
      socketService.on('DRILL_SCHEDULED', (data: any) => {
        showToast('New drill scheduled', 'info');
        loadDrills();
      });

      // Listen for drill summary events
      socketService.on('DRILL_SUMMARY', (data: any) => {
        loadDrills();
      });
    }

    // Phase 4: Auto-refresh every 30 seconds
    refreshIntervalRef.current = setInterval(() => {
      loadDrills();
    }, 30000);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      socketService.disconnect();
      isInitializedRef.current = false;
    };
  }, [isAuthenticated, router, user, accessToken, loadDrills]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const drillData: CreateDrillRequest = {
        ...formData,
        schoolId: getSchoolId() || '',
      };

      // If class is selected, add participant selection
      if (formData.classId) {
        drillData.participantSelection = {
          type: 'class',
          classIds: [formData.classId],
        };
      }

      const response = await drillsApi.create(drillData);
      if (response.success) {
        setShowForm(false);
        setFormData((prev) => ({ ...prev, schoolId: getSchoolId() || '', type: 'fire', scheduledAt: '' }));
        loadDrills();
      } else {
        alert(response.message || 'Failed to create drill');
      }
    } catch (error) {
      console.error('Error creating drill:', error);
      alert('Failed to create drill');
    }
  };

  const handleTrigger = async (drillId: string) => {
    if (!confirm('Trigger this drill immediately?')) return;
    try {
      const response = await drillsApi.trigger(drillId);
      if (response.success) {
        loadDrills();
      } else {
        alert(response.message || 'Failed to trigger drill');
      }
    } catch (error) {
      console.error('Error triggering drill:', error);
      alert('Failed to trigger drill');
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Drill Management</h1>
            <Button onClick={() => setShowForm(!showForm)}>
              {showForm ? 'Cancel' : '+ Schedule Drill'}
            </Button>
          </div>

          {showForm && (
            <Card className="mb-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Drill Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="fire">Fire</option>
                    <option value="earthquake">Earthquake</option>
                    <option value="flood">Flood</option>
                    <option value="cyclone">Cyclone</option>
                    <option value="stampede">Stampede</option>
                    <option value="heatwave">Heatwave</option>
                  </select>
                </div>

                {(user?.role === 'teacher' || user?.role === 'admin') && classes.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Class (Optional - leave empty for all classes)
                    </label>
                    <select
                      value={formData.classId || ''}
                      onChange={(e) => setFormData({ ...formData, classId: e.target.value || undefined })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Classes</option>
                      {classes.map((cls) => (
                        <option key={cls._id} value={cls._id}>
                          Grade {cls.grade} - Section {cls.section} ({cls.classCode})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <Input
                  label="Scheduled Date & Time"
                  type="datetime-local"
                  value={formData.scheduledAt}
                  onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                  required
                />

                <Button type="submit" className="w-full">
                  Schedule Drill
                </Button>
              </form>
            </Card>
          )}

          {/* Phase 4: Tab Navigation */}
          <div className="mb-4 border-b border-gray-200">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('active')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'active'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Active ({activeDrills.length})
              </button>
              <button
                onClick={() => setActiveTab('scheduled')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'scheduled'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Scheduled ({scheduledDrills.length})
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'history'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                History ({completedDrills.length})
              </button>
            </nav>
          </div>

          <Card>
            {isLoading ? (
              <div className="p-8 text-center">
                <p className="text-gray-500">Loading drills...</p>
              </div>
            ) : (
              <>
                {activeTab === 'active' && (
                  <ActiveDrillsSection 
                    drills={activeDrills} 
                    onRefresh={loadDrills}
                    onTrigger={handleTrigger}
                  />
                )}
                {activeTab === 'scheduled' && (
                  <ScheduledDrillsSection 
                    drills={scheduledDrills} 
                    onTrigger={handleTrigger}
                  />
                )}
                {activeTab === 'history' && (
                  <DrillHistorySection drills={completedDrills} />
                )}
              </>
            )}
          </Card>
        </main>
      </div>
    </div>
  );
}

// Phase 4: Active Drills Section Component
function ActiveDrillsSection({ 
  drills, 
  onRefresh, 
  onTrigger 
}: { 
  drills: Drill[]; 
  onRefresh: () => void;
  onTrigger: (id: string) => void;
}) {
  const router = useRouter();

  if (drills.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">No active drills</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {drills.map((drill) => (
        <div key={drill._id} className="border border-orange-200 bg-orange-50 rounded-lg p-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <span className="font-semibold text-lg text-orange-900">
                  {drill.type.toUpperCase()} DRILL
                </span>
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded">
                  IN PROGRESS
                </span>
              </div>
              <p className="text-sm text-gray-600">
                Started: {new Date(drill.scheduledAt).toLocaleString()}
              </p>
              {drill.participants && (
                <p className="text-sm text-gray-600">
                  Participants: {drill.participants.length}
                </p>
              )}
              {drill.acknowledgedBy && (
                <p className="text-sm text-green-600">
                  Acknowledged: {drill.acknowledgedBy.length}
                </p>
              )}
            </div>
            <div className="flex space-x-2">
              <Button
                size="sm"
                onClick={() => router.push(`/drills/${drill._id}`)}
              >
                View Details
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Phase 4: Scheduled Drills Section Component
function ScheduledDrillsSection({ 
  drills, 
  onTrigger 
}: { 
  drills: Drill[]; 
  onTrigger: (id: string) => void;
}) {
  if (drills.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">No scheduled drills</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {drills.map((drill) => (
        <div key={drill._id} className="border-b border-gray-200 pb-4 last:border-0">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-lg">{drill.type.toUpperCase()}</span>
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                  {drill.status}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Scheduled: {new Date(drill.scheduledAt).toLocaleString()}
              </p>
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={() => onTrigger(drill._id)}
            >
              Trigger Now
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

// Phase 4: Drill History Section Component
function DrillHistorySection({ drills }: { drills: Drill[] }) {
  const router = useRouter();

  if (drills.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">No completed drills</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {drills.map((drill) => (
        <div key={drill._id} className="border-b border-gray-200 pb-4 last:border-0">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-lg">{drill.type.toUpperCase()}</span>
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                  {drill.status}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Scheduled: {new Date(drill.scheduledAt).toLocaleString()}
              </p>
              {drill.completionTime && (
                <p className="text-sm text-gray-600">
                  Completed: {new Date(drill.completionTime).toLocaleString()}
                </p>
              )}
              {drill.acknowledgedBy && (
                <p className="text-sm text-green-600">
                  Participation: {drill.acknowledgedBy.length} / {drill.participants?.length || 0}
                </p>
              )}
            </div>
            <Button
              size="sm"
              onClick={() => router.push(`/drills/${drill._id}`)}
            >
              View Summary
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

