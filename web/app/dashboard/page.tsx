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
import { drillsApi, Drill } from '@/lib/api/drills';
import { alertsApi, Alert } from '@/lib/api/alerts';
import { devicesApi, DeviceHealth } from '@/lib/api/devices';
import { alertsApi as sosAlertsApi } from '@/lib/api/alerts';
import { apiClient } from '@/lib/api/client';
import { aiApi } from '@/lib/api/ai';
import { Card } from '@/components/ui/card';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
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
  const [iotDevices, setIotDevices] = useState<DeviceHealth[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [iotAlertModal, setIotAlertModal] = useState<any>(null);
  const [todaysTip, setTodaysTip] = useState<{ tip: string; date: string } | null>(null);
  const [tipLang, setTipLang] = useState<'en' | 'hi' | 'mr'>('en'); // G1: language for today's tip
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

    apiClient.setToken(accessToken);

    if (isInitialized) {
      return;
    }

    setIsInitialized(true);

    const institutionId = typeof user.institutionId === 'string' 
      ? user.institutionId 
      : (user.institutionId as any)?._id || user.institutionId;
    
    if (institutionId && accessToken) {
      console.log('🔄 Connecting to Socket.io with institutionId:', institutionId);
      socketService.connect(institutionId, accessToken);

      socketService.on('CRISIS_ALERT', (data) => {
        loadAlerts();
      });

      // Toast + modal for drill scheduled
      socketService.on('DRILL_SCHEDULED', (data) => {
        showToast(`Drill scheduled: ${data?.type || 'drill'}`, 'info');
        loadDrills();
      });

      socketService.on('DRILL_SUMMARY', (data) => {
        loadDrills();
      });

      // Phase 201: IoT Real-time Alerts
      socketService.on('DEVICE_ALERT' as SocketEvent, async (data: any) => {
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
      });

      // Phase 4.x: Drill start popup
      socketService.on('DRILL_START' as SocketEvent, async (data: any) => {
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
      });

      // Phase 201: IoT Telemetry Updates (silent UI update)
      socketService.on('TELEMETRY_UPDATE' as SocketEvent, (data: any) => {
        // Silent update - just refresh device health
        loadData();
      });

      // SOS alerts
      socketService.on('SOS_ALERT' as SocketEvent, async (data: any) => {
        await loadSosAlerts();
        const who = data?.userName || data?.role || 'User';
        const loc = data?.location;
        const locText =
          loc && loc.lat && loc.lng ? ` (${loc.lat}, ${loc.lng})` : '';
        showToast(`SOS from ${who}${locText}`, 'error');
      });

      socketService.on('SOS_SAFE' as SocketEvent, async (data: any) => {
        await loadSosAlerts();
        const who = data?.userName || data?.role || 'User';
        showToast(`Safe: ${who} marked safe`, 'success');
      });
    }

    loadData();

    return () => {
      socketService.disconnect();
    };
  }, [isAuthenticated, user, accessToken, router, authLoading, isInitialized]);

  // B2/G1: Load today's tip when initialized or language changes
  useEffect(() => {
    if (!isInitialized || !accessToken) return;
    let cancelled = false;
    aiApi.getTodaysTip(tipLang).then((tipData) => {
      if (!cancelled && tipData?.tip) setTodaysTip({ tip: tipData.tip, date: tipData.date || '' });
    }).catch(() => {});
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
    try {
      const schoolId = getSchoolId();
      
      const [drillsRes, alertsRes] = await Promise.all([
        drillsApi.list(schoolId),
        alertsApi.list(schoolId),
      ]);

      if (drillsRes.success && drillsRes.data) {
        setDrills(drillsRes.data);
      }

      if (alertsRes.success && alertsRes.data) {
        setAlerts(alertsRes.data);
      }

      await loadSosAlerts();
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSchoolId = () => {
    if (!user?.institutionId) return undefined;
    return typeof user.institutionId === 'string'
      ? user.institutionId
      : (user.institutionId as any)?._id ?? undefined;
  };

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
    const res = await sosAlertsApi.list(schoolId);
    if (res.success && res.data) {
      const sosOnly = (res.data as any[]).filter(
        (a) => (a as any).type === 'sos' || (a as any).metadata?.sos === true
      );
      setSosAlerts(sosOnly as Alert[]);
    }
  };

  const activeAlerts = alerts.filter((a) => a.status === 'active');
  const activeDrills = drills.filter((d) => d.status === 'active');
  const scheduledDrills = drills.filter((d) => d.status === 'completed');
  const completedDrills = drills.filter((d) => d.status === 'completed');
  const latestSos = sosAlerts
    .filter((a: any) => a.type === 'sos' || a?.metadata?.sos === true)
    .slice(0, 5);

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
      <div className="flex h-screen overflow-hidden relative">
        {/* Animated Background Gradient */}
        <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 animate-gradient-xy"></div>
        <style jsx>{`
          @keyframes gradient-xy {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }
          .animate-gradient-xy {
            background-size: 200% 200%;
            animation: gradient-xy 15s ease infinite;
          }
        `}</style>
        
        {/* Sidebar */}
        <aside className="w-64 hidden md:block h-full overflow-y-auto border-r border-white/20 bg-white/70 backdrop-blur-xl z-10">
          <Sidebar />
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col h-full overflow-hidden relative z-10">
          <Header />
          
          <main className="flex-1 overflow-y-auto p-6 lg:p-8 scroll-smooth">
            {/* Welcome Banner */}
            <div className="mb-8">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                    Welcome to <span className="text-blue-600">EduSafe</span> Dashboard
                  </h1>
                  <p className="text-gray-600 text-base">
                    Disaster Management & Safety Training System for Students
                  </p>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-lg border border-green-200">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="font-medium text-green-700">System Active</span>
                  </div>
                </div>
              </div>
            </div>

            {/* B2: Today's safety tip — G1: language selector */}
            {todaysTip?.tip && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="mb-6"
              >
                <Card className="p-4 bg-amber-50/90 backdrop-blur border-amber-200 border-l-4 border-l-amber-500">
                  <div className="flex items-start gap-3">
                    <Lightbulb className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-amber-900 mb-1">Today&apos;s safety tip</p>
                      <p className="text-sm text-gray-800">{todaysTip.tip}</p>
                      {todaysTip.date && (
                        <p className="text-xs text-amber-700 mt-1">{todaysTip.date}</p>
                      )}
                      <div className="flex gap-2 mt-2">
                        {(['en', 'hi', 'mr'] as const).map((lang) => (
                          <button
                            key={lang}
                            type="button"
                            onClick={() => setTipLang(lang)}
                            className={`px-2 py-1 rounded text-xs font-medium border ${
                              tipLang === lang
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
              </motion.div>
            )}

            {/* Stats Grid with Animation */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Card className="bg-white/80 backdrop-blur-lg border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer group hover:scale-105">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <motion.div 
                          className="p-3 rounded-xl bg-blue-100/80 shadow-sm"
                          whileHover={{ scale: 1.1, rotate: 5 }}
                        >
                          <ShieldAlert className="h-6 w-6 text-blue-600" />
                        </motion.div>
                        <div className="text-sm text-blue-700 font-semibold uppercase tracking-wide">Total Drills</div>
                      </div>
                      <div className="text-4xl font-bold text-blue-900 mb-2">
                        <AnimatedCounter value={drills.length} />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-blue-700 font-medium">
                        <div className={`h-2 w-2 rounded-full ${activeDrills.length > 0 ? 'bg-blue-600 animate-pulse' : 'bg-blue-400'}`}></div>
                        <span>{activeDrills.length} active now</span>
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
                <Card className="bg-white/80 backdrop-blur-lg border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer group hover:scale-105">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <motion.div 
                          className="p-3 rounded-xl bg-red-100/80 shadow-sm"
                          whileHover={{ scale: 1.1, rotate: 5 }}
                        >
                          <Siren className="h-6 w-6 text-red-600" />
                        </motion.div>
                        <div className="text-sm text-red-700 font-semibold uppercase tracking-wide">Active Alerts</div>
                      </div>
                      <div className="text-4xl font-bold text-red-900 mb-2">
                        <AnimatedCounter value={activeAlerts.length} />
                      </div>
                      <div className={`flex items-center gap-2 text-xs font-semibold ${activeAlerts.length > 0 ? 'text-red-700' : 'text-green-700'}`}>
                        {activeAlerts.length > 0 ? (
                          <>
                            <AlertTriangle className="h-3 w-3 animate-pulse" />
                            <span>Action Required</span>
                          </>
                        ) : (
                          <>
                            <div className="h-2 w-2 rounded-full bg-green-500"></div>
                            <span>All Clear</span>
                          </>
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
                <Card className="bg-white/80 backdrop-blur-lg border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer group hover:scale-105">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <motion.div 
                          className="p-3 rounded-xl bg-emerald-100/80 shadow-sm"
                          whileHover={{ scale: 1.1, rotate: 5 }}
                        >
                          <CalendarCheck className="h-6 w-6 text-emerald-600" />
                        </motion.div>
                        <div className="text-sm text-emerald-700 font-semibold uppercase tracking-wide">Completed Drills</div>
                      </div>
                      <div className="text-4xl font-bold text-emerald-900 mb-2">
                        <AnimatedCounter value={completedDrills.length} />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-emerald-700 font-medium">
                        <div className="h-2 w-2 rounded-full bg-emerald-600"></div>
                        <span>
                          <AnimatedCounter 
                            value={drills.length > 0 ? Math.round((completedDrills.length / drills.length) * 100) : 0} 
                            suffix="%"
                          /> completion rate
                        </span>
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
                <Card className="bg-white/80 backdrop-blur-lg border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer group hover:scale-105">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <motion.div 
                          className="p-3 rounded-xl bg-purple-100/80 shadow-sm"
                          whileHover={{ scale: 1.1, rotate: 5 }}
                        >
                          <CalendarCheck className="h-6 w-6 text-purple-600" />
                        </motion.div>
                        <div className="text-sm text-purple-700 font-semibold uppercase tracking-wide">Safety Score</div>
                      </div>
                      <div className="text-4xl font-bold text-purple-900 mb-2">
                        <AnimatedCounter 
                          value={drills.length > 0 ? Math.min(100, Math.round((drills.length / 10) * 100)) : 0} 
                          suffix="%"
                        />
                      </div>
                      <div className="w-full bg-purple-200/50 rounded-full h-1.5 mt-2 overflow-hidden">
                        <motion.div 
                          className="bg-purple-600 h-1.5 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, drills.length > 0 ? Math.round((drills.length / 10) * 100) : 0)}%` }}
                          transition={{ duration: 1.5, delay: 0.5 }}
                        ></motion.div>
                      </div>
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
                    {activeAlerts.length > 0 ? '⚠ Active' : '✅ All Clear'}
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
                    <p className="text-sm text-gray-500 mt-1">Safety status is normal</p>
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
                      const isActive = drill.status === 'active';
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

            {/* Safety Tips Banner - Compact & Powerful */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.0 }}
              className="mt-8 p-4 rounded-lg bg-gradient-to-r from-blue-600/90 via-blue-700/90 to-indigo-700/90 backdrop-blur-lg text-white shadow-xl border border-blue-500/30"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold leading-tight">
                    <span className="text-blue-100">Emergency Procedures:</span> 
                    <span className="ml-2">Fire: Stop, Drop, Roll • Earthquake: Drop, Cover, Hold</span>
                  </p>
                </div>
              </div>
            </motion.div>
          </main>
          </div>
        </div>

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
      </ProtectedRoute>
    );
  }
