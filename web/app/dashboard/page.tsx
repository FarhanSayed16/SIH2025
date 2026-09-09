/**
 * Dashboard page - Disaster Management System
 * Smart India Hackathon Project
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { socketService, SocketEvent } from '@/lib/services/socket-service';
import Link from 'next/link';
import { drillsApi, Drill, isDrillInProgress } from '@/lib/api/drills';
import { alertsApi, Alert } from '@/lib/api/alerts';
import { usersApi } from '@/lib/api/users';
import { devicesApi, DeviceHealth } from '@/lib/api/devices';
import { apiClient } from '@/lib/api/client';
import { aiApi } from '@/lib/api/ai';
import { getInstitutionId } from '@/lib/utils/institution';
import { Card } from '@/components/ui/card';
import { AppShell } from '@/components/layout/app-shell';
import { motion } from 'framer-motion';
import { AnimatedCounter } from '@/components/dashboard/AnimatedCounter';
import { DrillPerformanceChart } from '@/components/dashboard/DrillPerformanceChart';
import { AlertStatusChart } from '@/components/dashboard/AlertStatusChart';
import { SafetyMap } from '@/components/dashboard/SafetyMap';
import { 
  ShieldAlert, 
  Siren, 
  CalendarCheck,
  AlertTriangle,
  Activity,
  Bell,
  Clock,
  Users,
  MapPin,
  Radio,
  Lightbulb
} from 'lucide-react';
import { useIoTAlertToast } from '@/components/notifications/IoTAlertToast';
import { IoTAlertModal } from '@/components/alerts/IoTAlertModal';
import { BrowserNotificationService } from '@/lib/services/browser-notifications';
import { AlertSoundService } from '@/lib/services/alert-sound-service';
import { useToast } from '@/components/ui/toast';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, accessToken, isLoading: authLoading } = useAuthStore();
  const [drills, setDrills] = useState<Drill[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [sosAlerts, setSosAlerts] = useState<Alert[]>([]);
  const [liveSos, setLiveSos] = useState<any[]>([]);
  const [iotDevices, setIotDevices] = useState<DeviceHealth[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [iotAlertModal, setIotAlertModal] = useState<any>(null);
  const [todaysTip, setTodaysTip] = useState<{ tip: string; date: string; lang: 'en' | 'hi' | 'mr' } | null>(null);
  const [tipLang, setTipLang] = useState<'en' | 'hi' | 'mr'>('en');
  const [tipLoading, setTipLoading] = useState(false);
  const [drillsError, setDrillsError] = useState<string | null>(null);
  const [alertsError, setAlertsError] = useState<string | null>(null);
  const [lastFetchedAt, setLastFetchedAt] = useState<string | null>(null);
  const [teacherPendingTotal, setTeacherPendingTotal] = useState<number | null>(null);
  const { showIoTAlert } = useIoTAlertToast();
  const { showToast } = useToast();

  // Wait for auth to be ready before proceeding
  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (!user || !accessToken) {
      const storedToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      if (storedToken) {
        apiClient.setToken(storedToken);
        setTimeout(() => {
          if (!isAuthenticated) {
            router.push('/login');
          }
        }, 100);
      } else {
        router.push('/login');
      }
      return;
    }

    if (user.role === 'parent') {
      router.replace('/parent/dashboard');
      return;
    }

    apiClient.setToken(accessToken);

    if (isInitialized) {
      return;
    }

    setIsInitialized(true);

    const institutionId = getInstitutionId(user.institutionId);
    const unsubs: Array<() => void> = [];

    if (institutionId && accessToken) {
      // SocketLifecycle owns connect(); pages only subscribe.
      unsubs.push(socketService.on('CRISIS_ALERT', (data) => {
        loadAlerts();
      }));

      // Toast + modal for drill scheduled
      unsubs.push(socketService.on('DRILL_SCHEDULED', (data) => {
        showToast(`Drill scheduled: ${data?.type || 'drill'}`, 'info');
        loadDrills();
      }));

      unsubs.push(socketService.on('DRILL_SUMMARY', (data) => {
        loadDrills();
      }));

      // Phase 201: IoT Real-time Alerts
      unsubs.push(socketService.on('DEVICE_ALERT' as SocketEvent, async (data: any) => {
        const alertType = data.alertType?.toUpperCase() || 'ALERT';
        const severity = data.severity?.toUpperCase() || 'HIGH';
        const isCritical = severity === 'CRITICAL' || alertType === 'FIRE';
        
        // Build message
        let message = '';
        if (alertType === 'FIRE') {
          message = `Fire detected at ${data.deviceName || data.deviceId}`;
        } else if (alertType === 'FLOOD') {
          const waterLevel = data.sensorData?.water;
          message = `Flood alert at ${data.deviceName || data.deviceId}${waterLevel ? ` (Level: ${waterLevel})` : ''}`;
        } else if (alertType === 'EARTHQUAKE') {
          const magnitude = data.sensorData?.magnitude;
          message = `Earthquake detected at ${data.deviceName || data.deviceId}${magnitude ? ` (${magnitude.toFixed(2)}G)` : ''}`;
        } else {
          message = `Alert from ${data.deviceName || data.deviceId}`;
        }
        
        // Show toast notification
        showIoTAlert({
          deviceId: data.deviceId,
          alertType: alertType,
          deviceName: data.deviceName || data.deviceId,
          severity: severity,
          sensorData: data.sensorData,
          timestamp: data.timestamp || new Date().toISOString(),
        });

        // Show modal for critical alerts
        if (isCritical || alertType === 'FIRE') {
          setIotAlertModal(data);
        } else {
          // Auto-dismiss modal after 30s for non-critical
          const modalData = { ...data, autoDismiss: true };
          setIotAlertModal(modalData);
          setTimeout(() => {
            setIotAlertModal(null);
          }, 30000);
        }

        // Play sound alert
        try {
          const { AlertSoundService } = await import('@/lib/services/alert-sound-service');
          await AlertSoundService.playAlertSound(alertType);
        } catch (error) {
          console.error('Error playing alert sound:', error);
        }

        // Browser notification (if tab not active)
        if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
          try {
            const { BrowserNotificationService } = await import('@/lib/services/browser-notifications');
            await BrowserNotificationService.showNotification(
              `${alertType} Alert: ${data.deviceName || data.deviceId}`,
              {
                body: message,
                icon: '/icons/icon-192x192.png',
                tag: `iot-alert-${data.deviceId}`,
                requireInteraction: isCritical,
              }
            );
          } catch (error) {
            console.error('Error showing browser notification:', error);
          }
        }

        // Refresh device health
        loadData();
      }));

      // Phase 4.x: Drill start popup
      unsubs.push(socketService.on('DRILL_START' as SocketEvent, async (data: any) => {
        const drillType = data.type?.toUpperCase() || 'DRILL';
        const message = data.message || 'PRACTICE DRILL — This is not a real emergency';

        // Toast
        showToast(`Drill started: ${drillType}`, 'info');

        // Modal popup
        setIotAlertModal({
          alertType: drillType,
          deviceId: data.drillId || 'DRILL',
          deviceName: 'DRILL',
          severity: 'DRILL',
          sensorData: {
            status: message,
            durationMinutes: data.duration ?? 10,
            startTime: data.startTime || new Date().toISOString(),
          },
          timestamp: data.startTime || new Date().toISOString(),
        });

        // Optional sound (reuse alert sound)
        try {
          await AlertSoundService.playAlertSound('DRILL');
        } catch (error) {
          console.error('Error playing drill sound:', error);
        }
      }));

      // Phase 201: IoT Telemetry Updates (silent UI update)
      unsubs.push(socketService.on('TELEMETRY_UPDATE' as SocketEvent, (data: any) => {
        // Silent update - just refresh device health
        loadData();
      }));

      // SOS alerts
      unsubs.push(socketService.on('SOS_ALERT' as SocketEvent, async (data: any) => {
        setLiveSos((prev) => {
          const id = data?.userId || data?.timestamp;
          const without = prev.filter((s) => (s.userId || s.timestamp) !== id);
          return [data, ...without].slice(0, 8);
        });
        const who = data?.userName || data?.role || 'User';
        const loc = data?.location;
        const locText =
          loc && loc.lat && loc.lng ? ` (${loc.lat}, ${loc.lng})` : '';
        showToast(`SOS from ${who}${locText}`, 'error');
      }));

      unsubs.push(socketService.on('SOS_SAFE' as SocketEvent, async (data: any) => {
        setLiveSos((prev) => prev.filter((s) => s.userId !== data?.userId));
        const who = data?.userName || data?.role || 'User';
        showToast(`Safe: ${who} marked safe`, 'success');
      }));
    }

    loadData();

    return () => {
      unsubs.forEach((u) => u());
    };
  }, [isAuthenticated, user, accessToken, router, authLoading, isInitialized]);

  // B2/G1: Load tip; keep prior tip on failure; bind language to loaded content
  useEffect(() => {
    if (!isInitialized || !accessToken) return;
    let cancelled = false;
    setTipLoading(true);
    const requestedLang = tipLang;
    aiApi.getTodaysTip(requestedLang).then((tipData) => {
      if (!cancelled && tipData?.tip) {
        setTodaysTip({ tip: tipData.tip, date: tipData.date || '', lang: requestedLang });
      }
    }).catch(() => {
      // Retain previous tip
    }).finally(() => {
      if (!cancelled) setTipLoading(false);
    });
    return () => { cancelled = true; };
  }, [isInitialized, accessToken, tipLang]);

  const loadData = async () => {
    if (!isAuthenticated || !accessToken) {
      console.warn('Dashboard: Skipping loadData - not authenticated or no token');
      return;
    }

    const token = accessToken || (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null);
    if (!token) {
      console.warn('Dashboard: No token available, redirecting to login');
      router.push('/login');
      return;
    }

    apiClient.setToken(token);

    setIsLoading(true);
    const schoolId = getSchoolId();

    await Promise.all([
      drillsApi.list(schoolId)
        .then((drillsRes) => {
          if (drillsRes.success && drillsRes.data) {
            setDrills(drillsRes.data);
            setDrillsError(null);
          } else {
            setDrillsError(drillsRes.message || 'Drill list unavailable');
          }
        })
        .catch(() => setDrillsError('Drill status unavailable')),
      alertsApi.list(schoolId)
        .then((alertsRes) => {
          if (alertsRes.success && alertsRes.data) {
            setAlerts(alertsRes.data);
            setAlertsError(null);
          } else {
            setAlertsError(alertsRes.message || 'Alert status unavailable');
          }
        })
        .catch(() => setAlertsError('Alert status unavailable')),
      loadSosAlerts().catch(() => {}),
    ]);

    setLastFetchedAt(new Date().toISOString());

    if (user?.role === 'teacher') {
      try {
        const { teacherApi } = await import('@/lib/api/teacher');
        const classesRes = await teacherApi.getClasses();
        if (classesRes.success && classesRes.data?.classes) {
          let total: number | null = 0;
          let anyFailed = false;
          for (const c of classesRes.data.classes) {
            try {
              const pending = await teacherApi.getPendingStudents(c._id);
              if (pending.success && pending.data !== undefined) {
                const students = Array.isArray(pending.data) ? pending.data : pending.data.students || [];
                total = (total ?? 0) + students.length;
              } else {
                anyFailed = true;
              }
            } catch {
              anyFailed = true;
            }
          }
          setTeacherPendingTotal(anyFailed && total === 0 ? null : total);
        }
      } catch {
        setTeacherPendingTotal(null);
      }
    }

    setIsLoading(false);
  };

  const getSchoolId = () => getInstitutionId(user?.institutionId);

  const loadDrills = async () => {
    const schoolId = getSchoolId();
    const response = await drillsApi.list(schoolId);
    if (response.success && response.data) {
      setDrills(response.data);
    }
  };

  const loadAlerts = async () => {
    const schoolId = getSchoolId();
    const response = await alertsApi.list(schoolId);
    if (response.success && response.data) {
      setAlerts(response.data);
    }
  };

  const loadSosAlerts = async () => {
    const schoolId = getSchoolId();
    const res = await alertsApi.list(schoolId);
    if (res.success && res.data) {
      const sosOnly = (res.data as any[]).filter(
        (a) => (a as any).type === 'sos' || (a as any).metadata?.sos === true
      );
      setSosAlerts(sosOnly as Alert[]);
    }
  };

  const activeAlerts = alerts.filter((a) => a.status === 'active');
  const activeDrills = drills.filter((d) => isDrillInProgress(d.status));
  const scheduledDrills = drills.filter((d) => d.status === 'scheduled');
  const completedDrills = drills.filter((d) => d.status === 'completed');
  const latestSos = [
    ...liveSos,
    ...sosAlerts.filter((a: any) => a.type === 'sos' || a?.metadata?.sos === true),
  ].slice(0, 8);

  const markSosSafe = async (entry: any) => {
    const userId = entry?.userId || entry?.triggeredBy;
    try {
      if (userId) {
        await usersApi.updateSafetyStatus(String(userId), 'safe');
      }
      socketService.emit('SOS_SAFE', {
        userId,
        userName: entry?.userName,
        institutionId: getSchoolId(),
        status: 'safe',
      });
      setLiveSos((prev) => prev.filter((s) => s.userId !== userId));
      showToast('Marked safe', 'success');
    } catch (e) {
      showToast('Could not mark safe', 'error');
    }
  };

  // Severity color mapping
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-50 text-red-900 border-l-4 border-red-600';
      case 'high': return 'bg-orange-50 text-orange-900 border-l-4 border-orange-600';
      case 'medium': return 'bg-amber-50 text-amber-900 border-l-4 border-amber-600';
      case 'low': return 'bg-emerald-50 text-emerald-900 border-l-4 border-emerald-600';
      default: return 'bg-gray-50 text-gray-900 border-l-4 border-gray-600';
    }
  };

  return (
    <ProtectedRoute>
      <AppShell title="Dashboard" mainClassName="relative bg-gradient-to-br from-blue-50 via-indigo-50 to-slate-50">
            {/* Welcome */}
            <div className="mb-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-1">
                    Dashboard
                  </h2>
                  <p className="text-gray-600 text-sm">
                    {user?.role === 'teacher'
                      ? 'Your classes, drills, and alerts in scope'
                      : 'Institution drills and alert records'}
                    {lastFetchedAt && (
                      <span className="text-gray-500">
                        {' '}
                        · Last successful fetch {new Date(lastFetchedAt).toLocaleString()}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Action needed — teachers */}
            {user?.role === 'teacher' &&
              ((typeof teacherPendingTotal === 'number' && teacherPendingTotal > 0) ||
                activeDrills.length > 0 ||
                activeAlerts.length > 0) && (
              <Card className="mb-6 p-4 border border-amber-200 bg-amber-50/80">
                <h3 className="text-sm font-semibold text-amber-950 mb-2">Action needed</h3>
                <ul className="text-sm text-amber-900 space-y-1">
                  {typeof teacherPendingTotal === 'number' && teacherPendingTotal > 0 && (
                    <li>
                      <Link href="/teacher/classes" className="underline font-medium">
                        {teacherPendingTotal} pending class join request{teacherPendingTotal === 1 ? '' : 's'}
                      </Link>
                    </li>
                  )}
                  {activeDrills.length > 0 && (
                    <li>
                      <Link href="/drills" className="underline font-medium">
                        {activeDrills.length} drill{activeDrills.length === 1 ? '' : 's'} in progress
                      </Link>
                    </li>
                  )}
                  {activeAlerts.length > 0 && !alertsError && (
                    <li>{activeAlerts.length} active alert record{activeAlerts.length === 1 ? '' : 's'}</li>
                  )}
                </ul>
              </Card>
            )}

            {latestSos.length > 0 && (
              <Card className="mb-6 p-4 border-l-4 border-red-600 bg-red-50/90">
                <div className="flex items-center gap-2 mb-3">
                  <Siren className="h-5 w-5 text-red-700" />
                  <h2 className="font-bold text-red-900">SOS — people who need help</h2>
                </div>
                <ul className="space-y-2">
                  {latestSos.map((s: any, i: number) => {
                    const who = s.userName || s.role || s.title || 'User';
                    const loc = s.location;
                    const locText =
                      loc?.lat != null ? ` (${loc.lat.toFixed?.(4) ?? loc.lat}, ${loc.lng?.toFixed?.(4) ?? loc.lng})` : '';
                    return (
                      <li key={s.userId || s._id || i} className="flex items-center justify-between gap-3 text-sm">
                        <span className="text-red-900">
                          {who}{locText}
                        </span>
                        <button
                          type="button"
                          className="px-3 py-1 rounded bg-green-600 text-white text-xs font-semibold hover:bg-green-700"
                          onClick={() => markSosSafe(s)}
                        >
                          Mark safe
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </Card>
            )}

            {/* Stats Grid with Animation */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Card className="bg-white/90 border border-gray-200 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-3 rounded-xl bg-blue-100/80">
                          <ShieldAlert className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="text-sm text-blue-700 font-semibold uppercase tracking-wide">Drills in scope</div>
                      </div>
                      <div className="text-4xl font-bold text-blue-900 mb-2">
                        {drillsError ? '—' : <AnimatedCounter value={drills.length} />}
                      </div>
                      <div className="text-xs text-blue-700 font-medium">
                        {drillsError
                          ? 'Drill status unavailable'
                          : `${activeDrills.length} in progress now`}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card className="bg-white/90 border border-gray-200 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-3 rounded-xl bg-red-100/80">
                          <Siren className="h-6 w-6 text-red-600" />
                        </div>
                        <div className="text-sm text-red-700 font-semibold uppercase tracking-wide">Active alert records</div>
                      </div>
                      <div className="text-4xl font-bold text-red-900 mb-2">
                        {alertsError ? '—' : <AnimatedCounter value={activeAlerts.length} />}
                      </div>
                      <div className={`flex items-center gap-2 text-xs font-semibold ${alertsError ? 'text-amber-800' : activeAlerts.length > 0 ? 'text-red-700' : 'text-gray-600'}`}>
                        {alertsError ? (
                          <span>Alert status unavailable</span>
                        ) : activeAlerts.length > 0 ? (
                          <>
                            <AlertTriangle className="h-3 w-3" />
                            <span>Action required</span>
                          </>
                        ) : (
                          <span>No active alert records returned</span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Card className="bg-white/90 border border-gray-200 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-3 rounded-xl bg-emerald-100/80">
                          <CalendarCheck className="h-6 w-6 text-emerald-600" />
                        </div>
                        <div className="text-sm text-emerald-700 font-semibold uppercase tracking-wide">Completed drills</div>
                      </div>
                      <div className="text-4xl font-bold text-emerald-900 mb-2">
                        {drillsError ? '—' : <AnimatedCounter value={completedDrills.length} />}
                      </div>
                      <div className="text-xs text-emerald-800 font-medium">
                        {drillsError
                          ? 'Drill status unavailable'
                          : drills.length > 0
                          ? `${completedDrills.length} of ${drills.length} loaded records completed`
                          : 'No drill records loaded'}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <Card className="bg-white/90 border border-gray-200 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-3 rounded-xl bg-purple-100/80">
                          <CalendarCheck className="h-6 w-6 text-purple-600" />
                        </div>
                        <div className="text-sm text-purple-700 font-semibold uppercase tracking-wide">Scheduled drills</div>
                      </div>
                      <div className="text-4xl font-bold text-purple-900 mb-2">
                        {drillsError ? '—' : <AnimatedCounter value={scheduledDrills.length} />}
                      </div>
                      <p className="text-xs text-purple-700/80 mt-1">
                        {drillsError
                          ? 'Drill status unavailable'
                          : `${activeDrills.length} in progress · ${drills.length} total loaded`}
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                <DrillPerformanceChart drills={drills} />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                <AlertStatusChart alerts={alerts} />
              </motion.div>
            </div>

            {/* Map Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="mb-6"
            >
              <SafetyMap alerts={alerts} drills={drills} />
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Recent Alerts Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
              >
                <Card className="bg-white/80 backdrop-blur-lg border border-white/20 shadow-xl hover:shadow-2xl transition-shadow">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-red-50">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Recent Safety Alerts</h2>
                      <p className="text-sm text-gray-500">Monitor active safety incidents</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                    activeAlerts.length > 0 
                      ? 'bg-red-100 text-red-800 border border-red-200 animate-pulse' 
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}>
                    {alertsError
                      ? 'Status unavailable'
                      : activeAlerts.length > 0
                      ? 'Active records'
                      : 'No active records'}
                  </span>
                </div>

                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : alerts.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100">
                      <Bell className="h-8 w-8 text-blue-600" />
                    </div>
                    <p className="text-gray-700 font-medium">No alerts reported</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Empty list only — not an all-clear or normal safety claim
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                    {alerts.slice(0, 6).map((alert, index) => {
                      const alertId = (alert as any).id || alert._id;
                      return (
                        <div 
                          key={alertId} 
                          className={`p-4 rounded-lg transition-all duration-200 hover:shadow-md border-l-4 ${
                            getSeverityColor(alert.severity)
                          } ${alert.status === 'active' ? 'ring-2 ring-red-200' : ''}`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              {alert.severity === 'critical' && <Activity className="h-4 w-4 animate-pulse text-red-600" />}
                              <span className="font-bold text-gray-900">{alert.type.toUpperCase()}</span>
                            </div>
                            <span className="text-xs px-2.5 py-1 rounded-full bg-white/80 backdrop-blur-sm font-semibold border border-gray-200">
                              {alert.severity}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 mt-2 line-clamp-2 leading-relaxed">
                            {alert.message || alert.title || 'Safety notification'}
                          </p>
                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                            <div className="flex items-center text-xs text-gray-500">
                              <Clock className="h-3 w-3 mr-1.5" />
                              {new Date(alert.createdAt).toLocaleString()}
                            </div>
                            {alert.status === 'active' && (
                              <div className="flex items-center text-xs font-semibold text-red-600">
                                <span className="h-2 w-2 rounded-full bg-red-600 mr-1.5 animate-pulse"></span>
                                LIVE
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
              </motion.div>

              {/* Recent Drills Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.9 }}
              >
                <Card className="bg-white/80 backdrop-blur-lg border border-white/20 shadow-xl hover:shadow-2xl transition-shadow">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-50">
                      <CalendarCheck className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Recent Drills</h2>
                      <p className="text-sm text-gray-500">Drill history and performance</p>
                    </div>
                  </div>
                  <span className="px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold border border-emerald-200">
                    {drills.length} Total
                  </span>
                </div>

                {drills.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100">
                      <CalendarCheck className="h-8 w-8 text-emerald-600" />
                    </div>
                    <p className="text-gray-700 font-medium">No drills yet</p>
                    <p className="text-sm text-gray-500 mt-1">Start scheduling drills to track performance</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                    {drills.slice(0, 6).map((drill) => {
                      const drillId = drill._id;
                      const isActive = isDrillInProgress(drill.status);
                      const isCompleted = drill.status === 'completed';
                      const isScheduled = drill.status === 'scheduled';
                      
                      return (
                        <div 
                          key={drillId} 
                          className={`p-4 rounded-lg border-l-4 transition-all duration-200 hover:shadow-sm ${
                            isActive ? 'border-blue-500 bg-blue-50 hover:bg-blue-100' :
                            isCompleted ? 'border-emerald-500 bg-emerald-50 hover:bg-emerald-100' :
                            isScheduled ? 'border-amber-500 bg-amber-50 hover:bg-amber-100' :
                            'border-gray-500 bg-gray-50 hover:bg-gray-100'
                          }`}
                        >
                          <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${
                                isActive ? 'bg-blue-100 text-blue-600' :
                                isCompleted ? 'bg-emerald-100 text-emerald-600' :
                                isScheduled ? 'bg-amber-100 text-amber-600' :
                                'bg-gray-100 text-gray-600'
                              }`}>
                                <ShieldAlert className="h-4 w-4" />
                              </div>
                              <div>
                                <span className="font-bold text-gray-900 capitalize">{drill.type} Drill</span>
                                <div className="text-xs text-gray-600 mt-0.5">
                                  {new Date(drill.createdAt).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                              isActive ? 'bg-blue-600 text-white' :
                              isCompleted ? 'bg-emerald-600 text-white' :
                              isScheduled ? 'bg-amber-600 text-white' :
                              'bg-gray-600 text-white'
                            }`}>
                              {drill.status.toUpperCase()}
                            </span>
                          </div>
                          {isScheduled && drill.scheduledAt && (
                            <div className="mt-2 text-xs text-gray-600 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>Scheduled: {new Date(drill.scheduledAt).toLocaleString()}</span>
                            </div>
                          )}
                          {isCompleted && drill.completionTime && (
                            <div className="mt-2 text-xs text-emerald-700 font-medium">
                              Completed in {Math.round(Number(drill.completionTime) / 60)} minutes
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Active Drills Summary */}
                {activeDrills.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                      <Users className="h-5 w-5 mr-2 text-blue-600" />
                      Active Drills ({activeDrills.length})
                    </h3>
                    <div className="space-y-2">
                      {activeDrills.slice(0, 3).map((drill) => (
                        <div key={drill._id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                          <div>
                            <div className="font-medium text-gray-900">{drill.type}</div>
                            <div className="text-sm text-gray-600 flex items-center">
                              <MapPin className="h-3 w-3 mr-1" />
                              School Premises
                            </div>
                          </div>
                          <div className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full">
                            ACTIVE
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
              </motion.div>
            </div>

            {/* Safety tip — secondary, below operational content */}
            {todaysTip?.tip && (
              <Card className="mt-8 mb-4 p-4 bg-amber-50/90 border-amber-200 border-l-4 border-l-amber-500">
                <div className="flex items-start gap-3">
                  <Lightbulb className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-amber-900 mb-1">
                      Safety tip
                      {todaysTip.date ? ` · ${todaysTip.date}` : ''}
                      {tipLoading ? ' · updating…' : ''}
                    </p>
                    <p className="text-sm text-gray-800">{todaysTip.tip}</p>
                    <p className="text-xs text-amber-800 mt-1">
                      Language: {todaysTip.lang === 'en' ? 'English' : todaysTip.lang === 'hi' ? 'हिंदी' : 'मराठी'}
                    </p>
                    <div className="flex gap-2 mt-2">
                      {(['en', 'hi', 'mr'] as const).map((lang) => (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => setTipLang(lang)}
                          disabled={tipLoading}
                          className={`min-h-11 px-3 py-1 rounded text-xs font-medium border ${
                            todaysTip.lang === lang
                              ? 'bg-amber-600 text-white border-amber-600'
                              : 'bg-white/80 text-amber-800 border-amber-300 hover:bg-amber-100'
                          }`}
                        >
                          {lang === 'en' ? 'English' : lang === 'hi' ? 'हिंदी' : 'मराठी'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.0 }}
              className="mt-4 p-4 rounded-lg bg-slate-800 text-white border border-slate-700"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/10">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold leading-tight">
                    <span className="text-slate-300">Reference:</span>
                    <span className="ml-2">Fire: Stop, Drop, Roll · Earthquake: Drop, Cover, Hold</span>
                  </p>
                </div>
              </div>
            </motion.div>

        {/* Phase 201: IoT Alert Modal */}
        {iotAlertModal && (
          <IoTAlertModal
            alertData={iotAlertModal}
            isOpen={true}
            onClose={() => setIotAlertModal(null)}
            onViewDevice={(deviceId) => {
              router.push(`/devices?deviceId=${deviceId}`);
            }}
          />
        )}
      </AppShell>
      </ProtectedRoute>
    );
  }
