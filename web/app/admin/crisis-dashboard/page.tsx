/**
 * Phase 4.6: Admin Command Center (Crisis Dashboard) - ENHANCED
 * Comprehensive real-time crisis monitoring and management dashboard
 * Enhanced with modern UI, animations, and better visual impact
 */

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';
import { AdminRoute } from '@/components/auth/AdminRoute';
import { socketService, SocketEvent } from '@/lib/services/socket-service';
import { useIoTAlertToast } from '@/components/notifications/IoTAlertToast';
import { IoTAlertModal } from '@/components/alerts/IoTAlertModal';
import { BrowserNotificationService } from '@/lib/services/browser-notifications';
import { AlertSoundService } from '@/lib/services/alert-sound-service';
import { alertsApi, Alert } from '@/lib/api/alerts';
import { alertStatusApi, AlertStatusSummary } from '@/lib/api/alertStatus';
import { drillsApi, Drill } from '@/lib/api/drills';
import { devicesApi, Device, HealthMonitoring } from '@/lib/api/devices';
import { mlPredictionsApi, BatchPredictionsResult, DrillPerformancePrediction, OptimalDrillTiming, DrillAnomaliesResult } from '@/lib/api/mlPredictions';
import { apiClient } from '@/lib/api/client';
import { getInstitutionId } from '@/lib/utils/institution';
import { Card } from '@/components/ui/card';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { SchoolMapView } from '@/lib/components/admin/SchoolMapView';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedCounter } from '@/components/dashboard/AnimatedCounter';
import { 
  AlertTriangle, 
  Shield, 
  Activity, 
  Radio, 
  Users, 
  MapPin, 
  Clock, 
  TrendingUp,
  Zap,
  Bell,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Play,
  Square,
  Send,
  Phone,
  MessageSquare
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

// Types for dashboard data
interface StatusCounts {
  safe: number;
  help: number;
  missing: number;
  at_risk: number;
  potentially_trapped: number;
  total: number;
}

interface TimelineEvent {
  id: string;
  type: 'alert' | 'status_update' | 'drill' | 'device' | 'system';
  title: string;
  description: string;
  timestamp: Date;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

const COLORS = {
  safe: '#10b981',
  help: '#ef4444',
  missing: '#f59e0b',
  at_risk: '#f97316',
  trapped: '#dc2626',
};

export default function CrisisDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, accessToken } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  
  // Status counts (aggregated from all active alerts)
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({
    safe: 0,
    help: 0,
    missing: 0,
    at_risk: 0,
    potentially_trapped: 0,
    total: 0,
  });
  
  // Active alerts
  const [activeAlerts, setActiveAlerts] = useState<Alert[]>([]);
  
  // Active drills
  const [activeDrills, setActiveDrills] = useState<Drill[]>([]);
  
  // Devices
  const [devices, setDevices] = useState<Device[]>([]);
  const [deviceHealth, setDeviceHealth] = useState<HealthMonitoring | null>(null);
  
  // Timeline events
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  
  // Refresh interval for status counts
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Phase 4.8: ML Predictions
  const [studentRiskPredictions, setStudentRiskPredictions] = useState<BatchPredictionsResult | null>(null);
  const [drillPerformancePrediction, setDrillPerformancePrediction] = useState<DrillPerformancePrediction | null>(null);
  const [optimalDrillTiming, setOptimalDrillTiming] = useState<OptimalDrillTiming | null>(null);
  const [drillAnomalies, setDrillAnomalies] = useState<DrillAnomaliesResult | null>(null);

  // Use ref to prevent concurrent API calls
  const isRefreshingRef = useRef(false);

  const userInstitutionIdRef = useRef<string | null>(null);
  userInstitutionIdRef.current = getInstitutionId(user?.institutionId) ?? null;
  
  const refreshStatusCounts = useCallback(async () => {
    if (isRefreshingRef.current) return;
    
    isRefreshingRef.current = true;
    
    try {
      const schoolId = userInstitutionIdRef.current;
      if (!schoolId) {
        isRefreshingRef.current = false;
        return;
      }
      
      const alertsResponse = await alertsApi.list(schoolId);
      if (!alertsResponse.success || !alertsResponse.data) {
        isRefreshingRef.current = false;
        return;
      }
      
      const active = alertsResponse.data.filter((a) => a.status === 'active');
      
      if (active.length === 0) {
        setStatusCounts({
          safe: 0,
          help: 0,
          missing: 0,
          at_risk: 0,
          potentially_trapped: 0,
          total: 0,
        });
        isRefreshingRef.current = false;
        return;
      }
      
      let aggregatedCounts: StatusCounts = {
        safe: 0,
        help: 0,
        missing: 0,
        at_risk: 0,
        potentially_trapped: 0,
        total: 0,
      };
      
      const summaryPromises = active.map(async (alert) => {
        try {
          const summaryResponse = await alertStatusApi.getSummary(alert._id);
          if (summaryResponse.success && summaryResponse.data?.counts) {
            return summaryResponse.data.counts;
          }
        } catch (error: any) {
          return {
            safe: 0,
            help: 0,
            missing: 0,
            at_risk: 0,
            potentially_trapped: 0,
            total: 0
          };
        }
        return null;
      });
      
      const summaries = await Promise.all(summaryPromises);
      
      summaries.forEach((counts) => {
        if (counts) {
          aggregatedCounts.safe += counts.safe || 0;
          aggregatedCounts.help += counts.help || 0;
          aggregatedCounts.missing += counts.missing || 0;
          aggregatedCounts.at_risk += counts.at_risk || 0;
          aggregatedCounts.potentially_trapped += counts.potentially_trapped || 0;
        }
      });
      
      aggregatedCounts.total = Math.max(
        ...summaries.map((s) => s?.total || 0),
        aggregatedCounts.safe + aggregatedCounts.help + aggregatedCounts.missing + 
        aggregatedCounts.at_risk + aggregatedCounts.potentially_trapped
      );
      
      setStatusCounts(aggregatedCounts);
    } catch (error) {
      console.error('Error refreshing status counts:', error);
    } finally {
      isRefreshingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (accessToken) {
      apiClient.setToken(accessToken);
    }

          const institutionId = getInstitutionId(user?.institutionId);
          if (institutionId && accessToken) {
            console.log('🔄 Connecting to Socket.io with institutionId:', institutionId);
            socketService.connect(institutionId, accessToken);

      socketService.on('CRISIS_ALERT', (data) => {
        addTimelineEvent({
          id: `alert-${Date.now()}`,
          type: 'alert',
          title: `Alert: ${data.type?.toUpperCase() || 'EMERGENCY'}`,
          description: data.title || data.message || 'Emergency alert triggered',
          timestamp: new Date(),
          severity: data.severity || 'high',
        });
        loadActiveAlerts();
      });

      socketService.on('USER_STATUS_UPDATE', (data) => {
        addTimelineEvent({
          id: `status-${Date.now()}`,
          type: 'status_update',
          title: `Status Update: ${data.status || 'Unknown'}`,
          description: `User ${data.userId || 'Unknown'} status changed`,
          timestamp: new Date(),
        });
        if (!isRefreshingRef.current) {
          refreshStatusCounts();
        }
      });

      socketService.on('DRILL_START', (data) => {
        addTimelineEvent({
          id: `drill-start-${Date.now()}`,
          type: 'drill',
          title: `Drill Started: ${data.type || 'Practice Drill'}`,
          description: data.title || 'Drill has begun',
          timestamp: new Date(),
        });
        loadActiveDrills();
      });

      socketService.on('DRILL_END', (data) => {
        addTimelineEvent({
          id: `drill-end-${Date.now()}`,
          type: 'drill',
          title: `Drill Ended: ${data.type || 'Practice Drill'}`,
          description: 'Drill has completed',
          timestamp: new Date(),
        });
        loadActiveDrills();
      });

      socketService.on('ALERT_CANCEL', (data) => {
        addTimelineEvent({
          id: `alert-cancel-${Date.now()}`,
          type: 'alert',
          title: 'Alert Cancelled',
          description: `Alert ${data.alertId || 'unknown'} was cancelled`,
          timestamp: new Date(),
        });
        loadActiveAlerts();
      });

      // Phase 201: IoT Device Events
      socketService.on('TELEMETRY_UPDATE' as SocketEvent, (data) => {
        addTimelineEvent({
          id: `telemetry-${Date.now()}`,
          type: 'device',
          title: 'IoT Telemetry Update',
          description: `Device ${data.deviceId || 'Unknown'} sent telemetry`,
          timestamp: new Date(),
        });
        loadDevices();
      });

      socketService.on('DEVICE_ALERT' as SocketEvent, (data) => {
        addTimelineEvent({
          id: `device-alert-${Date.now()}`,
          type: 'device',
          title: `IoT Alert: ${data.alertType || 'Unknown'}`,
          description: `Device ${data.deviceId || 'Unknown'} detected ${data.alertType || 'alert'}`,
          timestamp: new Date(),
          severity: data.severity || 'high',
        });
        loadDevices();
        loadActiveAlerts();
      });
    }

    loadDashboardData();

    const statusRefreshInterval = setInterval(() => {
      refreshStatusCounts();
      setLastRefresh(new Date());
    }, 5000);

    const mlRefreshInterval = setInterval(() => {
      loadMLPredictions();
    }, 30000);

    return () => {
      clearInterval(statusRefreshInterval);
      clearInterval(mlRefreshInterval);
      socketService.disconnect();
    };
  }, [isAuthenticated, accessToken, user, router]);

  const addTimelineEvent = (event: TimelineEvent) => {
    setTimelineEvents((prev) => [event, ...prev].slice(0, 50));
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await loadDashboardData();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const loadDashboardData = async () => {
    if (!user || !accessToken) {
      console.warn('User or access token not available');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const schoolId = getInstitutionId(user?.institutionId);
      const isSuperAdmin = user?.role === 'system_admin' || user?.role === 'SYSTEM_ADMIN';
      
      if (!schoolId && !isSuperAdmin) {
        console.warn('No institution ID available');
        setIsLoading(false);
        return;
      }

      await Promise.all([
        loadActiveAlerts(),
        loadActiveDrills(),
        loadDevices(),
        refreshStatusCounts(),
        loadMLPredictions(),
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadActiveAlerts = async () => {
    try {
      const schoolId = getInstitutionId(user?.institutionId);
      if (!schoolId) {
        setActiveAlerts([]);
        return;
      }
      
      const response = await alertsApi.list(schoolId);
      
      if (response.success && response.data) {
        const active = response.data.filter((a) => a.status === 'active');
        setActiveAlerts(active);
      } else {
        setActiveAlerts([]);
      }
    } catch (error: any) {
      console.error('Error loading active alerts:', error);
      setActiveAlerts([]);
    }
  };

  const loadActiveDrills = async () => {
    try {
      const schoolId = getInstitutionId(user?.institutionId);
      const response = await drillsApi.list(schoolId);
      
      if (response.success && response.data) {
        const active = response.data.filter((d) => d.status === 'active');
        setActiveDrills(active);
      }
    } catch (error) {
      console.error('Error loading active drills:', error);
    }
  };

  const loadDevices = async () => {
    try {
      const schoolId = getInstitutionId(user?.institutionId);
      
      const devicesResponse = await devicesApi.list(schoolId);
      if (devicesResponse.success && devicesResponse.data) {
        setDevices(devicesResponse.data);
      }
      
      const healthResponse = await devicesApi.getHealthMonitoring(schoolId);
      if (healthResponse.success && healthResponse.data) {
        setDeviceHealth(healthResponse.data);
      }
    } catch (error) {
      console.error('Error loading devices:', error);
    }
  };

  const isValidObjectId = (id: string | null | undefined): boolean => {
    if (!id || typeof id !== 'string') return false;
    return /^[0-9a-fA-F]{24}$/.test(id);
  };

  const loadMLPredictions = async () => {
    try {
      const schoolId = getInstitutionId(user?.institutionId);
      
      if (!schoolId || !isValidObjectId(schoolId)) {
        return;
      }

      try {
        const riskPredictions = await mlPredictionsApi.batchPredictStudentRisks({
          institutionId: schoolId,
        });
        if (riskPredictions) {
          setStudentRiskPredictions(riskPredictions);
        }
      } catch (error: any) {
        setStudentRiskPredictions(null);
      }

      try {
        const performancePrediction = await mlPredictionsApi.predictDrillPerformance({
          institutionId: schoolId,
        });
        if (performancePrediction) {
          setDrillPerformancePrediction(performancePrediction);
        }
      } catch (error: any) {
        setDrillPerformancePrediction(null);
      }

      try {
        const optimalTiming = await mlPredictionsApi.getOptimalDrillTiming(schoolId);
        if (optimalTiming) {
          setOptimalDrillTiming(optimalTiming);
        }
      } catch (error: any) {
        setOptimalDrillTiming(null);
      }

      try {
        const anomalies = await mlPredictionsApi.detectAnomalies({
          institutionId: schoolId,
        });
        if (anomalies) {
          setDrillAnomalies(anomalies);
        }
      } catch (error: any) {
        setDrillAnomalies(null);
      }
    } catch (error: any) {
      console.error('Error loading ML predictions:', error?.message || error);
    }
  };

  // Prepare chart data
  const statusChartData = [
    { name: 'Safe', value: statusCounts.safe, color: COLORS.safe },
    { name: 'Need Help', value: statusCounts.help, color: COLORS.help },
    { name: 'Missing', value: statusCounts.missing, color: COLORS.missing },
    { name: 'At Risk', value: statusCounts.at_risk, color: COLORS.at_risk },
    { name: 'Trapped', value: statusCounts.potentially_trapped, color: COLORS.trapped },
  ].filter(item => item.value > 0);

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'bg-red-600 text-white';
      case 'high': return 'bg-orange-600 text-white';
      case 'medium': return 'bg-yellow-600 text-white';
      case 'low': return 'bg-blue-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'alert': return <AlertTriangle className="h-4 w-4" />;
      case 'drill': return <Shield className="h-4 w-4" />;
      case 'status_update': return <Activity className="h-4 w-4" />;
      case 'device': return <Radio className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  return (
    <AdminRoute>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Enhanced Page Header */}
              <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 shadow-lg">
                      <Shield className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h1 className="text-4xl font-bold text-gray-900">Crisis Command Center</h1>
                      <p className="text-gray-600 mt-1">Real-time emergency monitoring & management</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>Last updated: {lastRefresh.toLocaleTimeString()}</span>
                    </div>
                    {socketService.isConnected() ? (
                      <div className="flex items-center gap-2 px-3 py-1 bg-green-100 rounded-lg border border-green-300">
                        <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                        <span className="font-semibold text-green-700">Live Connected</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 px-3 py-1 bg-red-100 rounded-lg border border-red-300">
                        <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                        <span className="font-semibold text-red-700">Disconnected</span>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleManualRefresh}
                  disabled={isRefreshing}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </motion.div>

            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600"></div>
                <p className="mt-4 text-gray-600 font-medium">Loading crisis dashboard...</p>
              </div>
            ) : (
              <>
                {/* Enhanced Status Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <Card className="bg-white/90 backdrop-blur-lg border-2 border-green-300 shadow-xl hover:shadow-2xl transition-all hover:scale-105">
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="p-3 rounded-xl bg-green-100">
                            <CheckCircle className="h-6 w-6 text-green-600" />
                          </div>
                          <div className="text-3xl font-bold text-green-700">
                            <AnimatedCounter value={statusCounts.safe} />
                          </div>
                        </div>
                        <div className="text-sm font-semibold text-green-800 mb-1">Safe</div>
                        <div className="text-xs text-green-600">
                          {statusCounts.total > 0
                            ? `${Math.round((statusCounts.safe / statusCounts.total) * 100)}% of total`
                            : 'No active alerts'}
                        </div>
                      </div>
                    </Card>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Card className="bg-white/90 backdrop-blur-lg border-2 border-red-300 shadow-xl hover:shadow-2xl transition-all hover:scale-105">
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="p-3 rounded-xl bg-red-100">
                            <AlertCircle className="h-6 w-6 text-red-600 animate-pulse" />
                          </div>
                          <div className="text-3xl font-bold text-red-700">
                            <AnimatedCounter value={statusCounts.help} />
                          </div>
                        </div>
                        <div className="text-sm font-semibold text-red-800 mb-1">Need Help</div>
                        <div className="text-xs text-red-600">
                          {statusCounts.total > 0
                            ? `${Math.round((statusCounts.help / statusCounts.total) * 100)}% of total`
                            : 'No active alerts'}
                        </div>
                      </div>
                    </Card>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Card className="bg-white/90 backdrop-blur-lg border-2 border-yellow-300 shadow-xl hover:shadow-2xl transition-all hover:scale-105">
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="p-3 rounded-xl bg-yellow-100">
                            <AlertTriangle className="h-6 w-6 text-yellow-600" />
                          </div>
                          <div className="text-3xl font-bold text-yellow-700">
                            <AnimatedCounter value={statusCounts.missing} />
                          </div>
                        </div>
                        <div className="text-sm font-semibold text-yellow-800 mb-1">Missing</div>
                        <div className="text-xs text-yellow-600">
                          {statusCounts.total > 0
                            ? `${Math.round((statusCounts.missing / statusCounts.total) * 100)}% of total`
                            : 'No active alerts'}
                        </div>
                      </div>
                    </Card>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <Card className="bg-white/90 backdrop-blur-lg border-2 border-orange-300 shadow-xl hover:shadow-2xl transition-all hover:scale-105">
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="p-3 rounded-xl bg-orange-100">
                            <XCircle className="h-6 w-6 text-orange-600" />
                          </div>
                          <div className="text-3xl font-bold text-orange-700">
                            <AnimatedCounter value={statusCounts.at_risk} />
                          </div>
                        </div>
                        <div className="text-sm font-semibold text-orange-800 mb-1">At Risk</div>
                        <div className="text-xs text-orange-600">
                          {statusCounts.total > 0
                            ? `${Math.round((statusCounts.at_risk / statusCounts.total) * 100)}% of total`
                            : 'No active alerts'}
                        </div>
                      </div>
                    </Card>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <Card className="bg-white/90 backdrop-blur-lg border-2 border-red-400 shadow-xl hover:shadow-2xl transition-all hover:scale-105">
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="p-3 rounded-xl bg-red-200">
                            <Shield className="h-6 w-6 text-red-700 animate-pulse" />
                          </div>
                          <div className="text-3xl font-bold text-red-800">
                            <AnimatedCounter value={statusCounts.potentially_trapped} />
                          </div>
                        </div>
                        <div className="text-sm font-semibold text-red-900 mb-1">Trapped</div>
                        <div className="text-xs text-red-700">
                          {statusCounts.total > 0
                            ? `${Math.round((statusCounts.potentially_trapped / statusCounts.total) * 100)}% of total`
                            : 'No active alerts'}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                </div>

                {/* Status Distribution Chart */}
                {statusChartData.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="mb-6"
                  >
                    <Card className="bg-white/90 backdrop-blur-lg border border-white/20 shadow-xl p-6">
                      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Activity className="h-5 w-5 text-blue-600" />
                        Status Distribution
                      </h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            data={statusChartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={70}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {statusChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </Card>
                  </motion.div>
                )}

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column - Alerts & Events */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Active Alerts Panel - Enhanced */}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 }}
                    >
                      <Card className="bg-white/90 backdrop-blur-lg border border-white/20 shadow-xl">
                        <div className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                              <AlertTriangle className="h-6 w-6 text-red-600" />
                              Active Alerts ({activeAlerts.length})
                            </h3>
                            {activeAlerts.length > 0 && (
                              <div className="px-3 py-1 bg-red-100 rounded-full border border-red-300">
                                <span className="text-xs font-bold text-red-700">CRITICAL</span>
                              </div>
                            )}
                          </div>
                          {activeAlerts.length === 0 ? (
                            <div className="text-center py-12">
                              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                              <p className="text-gray-600 font-medium">No active alerts</p>
                              <p className="text-sm text-gray-500 mt-1">All systems operational</p>
                            </div>
                          ) : (
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                              <AnimatePresence>
                                {activeAlerts.map((alert, index) => (
                                  <motion.div
                                    key={alert._id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="border-l-4 border-red-500 pl-4 py-3 bg-red-50/50 rounded-r-lg hover:bg-red-50 transition-all"
                                  >
                                    <div className="flex justify-between items-start">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                          <span className="font-bold text-gray-900 text-lg">
                                            {alert.type.toUpperCase()}
                                          </span>
                                          <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${getSeverityColor(alert.severity)}`}>
                                            {alert.severity?.toUpperCase()}
                                          </span>
                                        </div>
                                        <p className="text-sm text-gray-700 font-medium mb-1">
                                          {alert.title || alert.message || 'No description'}
                                        </p>
                                        <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                                          <div className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {new Date(alert.createdAt).toLocaleString()}
                                          </div>
                                          {alert.locationDetails && (
                                            <div className="flex items-center gap-1">
                                              <MapPin className="h-3 w-3" />
                                              {alert.locationDetails.building || 'Unknown location'}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex gap-2 ml-4">
                                        <button
                                          onClick={async () => {
                                            if (confirm(`Cancel alert "${alert.type.toUpperCase()}"?`)) {
                                              try {
                                                const response = await alertsApi.cancel(alert._id, 'Cancelled from dashboard');
                                                if (response.success) {
                                                  addTimelineEvent({
                                                    id: `cancel-${Date.now()}`,
                                                    type: 'alert',
                                                    title: 'Alert Cancelled',
                                                    description: `Alert ${alert.type.toUpperCase()} was cancelled`,
                                                    timestamp: new Date(),
                                                  });
                                                  loadActiveAlerts();
                                                }
                                              } catch (error) {
                                                window.alert('Failed to cancel alert');
                                              }
                                            }
                                          }}
                                          className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 rounded-lg text-xs font-semibold text-gray-700 transition-colors"
                                        >
                                          Cancel
                                        </button>
                                        <button
                                          onClick={() => router.push(`/admin/alerts/${alert._id}`)}
                                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs font-semibold text-white transition-colors"
                                        >
                                          View
                                        </button>
                                      </div>
                                    </div>
                                  </motion.div>
                                ))}
                              </AnimatePresence>
                            </div>
                          )}
                        </div>
                      </Card>
                    </motion.div>

                    {/* Event Timeline - Enhanced */}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 }}
                    >
                      <Card className="bg-white/90 backdrop-blur-lg border border-white/20 shadow-xl">
                        <div className="p-6">
                          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-4">
                            <Activity className="h-6 w-6 text-blue-600" />
                            Real-Time Event Timeline ({timelineEvents.length})
                          </h3>
                          {timelineEvents.length === 0 ? (
                            <div className="text-center py-12">
                              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                              <p className="text-gray-600 font-medium">No events yet</p>
                              <p className="text-sm text-gray-500 mt-1">Events will appear here in real-time</p>
                            </div>
                          ) : (
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                              <AnimatePresence>
                                {timelineEvents.map((event, index) => (
                                  <motion.div
                                    key={event.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="border-l-4 border-blue-500 pl-4 py-3 bg-blue-50/50 rounded-r-lg hover:bg-blue-50 transition-all"
                                  >
                                    <div className="flex justify-between items-start">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                          <div className="text-blue-600">
                                            {getEventIcon(event.type)}
                                          </div>
                                          <span className="font-semibold text-gray-900">
                                            {event.title}
                                          </span>
                                          {event.severity && (
                                            <span className={`text-xs px-2 py-1 rounded-full font-bold ${getSeverityColor(event.severity)}`}>
                                              {event.severity}
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-sm text-gray-600">
                                          {event.description}
                                        </p>
                                      </div>
                                      <span className="text-xs text-gray-500 whitespace-nowrap ml-4">
                                        {event.timestamp.toLocaleTimeString()}
                                      </span>
                                    </div>
                                  </motion.div>
                                ))}
                              </AnimatePresence>
                            </div>
                          )}
                        </div>
                      </Card>
                    </motion.div>
                  </div>

                  {/* Right Column - Map, Devices & Quick Info */}
                  <div className="space-y-6">
                    {/* School Map View */}
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.9 }}
                    >
                      <SchoolMapView 
                        activeAlertIds={activeAlerts.map(a => a._id)} 
                        alerts={activeAlerts}
                      />
                    </motion.div>

                    {/* Device Status Panel - Enhanced */}
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.0 }}
                    >
                      <Card className="bg-white/90 backdrop-blur-lg border border-white/20 shadow-xl">
                        <div className="p-6">
                          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
                            <Radio className="h-5 w-5 text-blue-600" />
                            IoT Device Status
                          </h3>
                          {deviceHealth ? (
                            <div className="space-y-4">
                              <div className="grid grid-cols-3 gap-3">
                                <div className="bg-gradient-to-br from-green-100 to-green-200 p-4 rounded-xl border-2 border-green-300 text-center">
                                  <div className="text-3xl font-bold text-green-700 mb-1">
                                    {deviceHealth.healthy}
                                  </div>
                                  <div className="text-xs font-semibold text-green-800">Healthy</div>
                                </div>
                                <div className="bg-gradient-to-br from-yellow-100 to-yellow-200 p-4 rounded-xl border-2 border-yellow-300 text-center">
                                  <div className="text-3xl font-bold text-yellow-700 mb-1">
                                    {deviceHealth.warning}
                                  </div>
                                  <div className="text-xs font-semibold text-yellow-800">Warning</div>
                                </div>
                                <div className="bg-gradient-to-br from-red-100 to-red-200 p-4 rounded-xl border-2 border-red-300 text-center">
                                  <div className="text-3xl font-bold text-red-700 mb-1">
                                    {deviceHealth.offline}
                                  </div>
                                  <div className="text-xs font-semibold text-red-800">Offline</div>
                                </div>
                              </div>
                              <div className="text-center text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg py-2">
                                Total: {deviceHealth.totalDevices} devices
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-8">
                              <Radio className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                              <p className="text-gray-500">No device data available</p>
                            </div>
                          )}
                        </div>
                      </Card>
                    </motion.div>

                    {/* Active Drills - Enhanced */}
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.1 }}
                    >
                      <Card className="bg-white/90 backdrop-blur-lg border border-white/20 shadow-xl">
                        <div className="p-6">
                          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
                            <Shield className="h-5 w-5 text-blue-600" />
                            Active Drills ({activeDrills.length})
                          </h3>
                          {activeDrills.length === 0 ? (
                            <div className="text-center py-8">
                              <Shield className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                              <p className="text-gray-500">No active drills</p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {activeDrills.map((drill) => (
                                <div
                                  key={drill._id}
                                  className="border-l-4 border-blue-500 pl-4 py-3 bg-blue-50/50 rounded-r-lg"
                                >
                                  <div className="font-semibold text-gray-900 mb-1">
                                    {drill.type.toUpperCase()} Drill
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-gray-600">
                                    <Clock className="h-3 w-3" />
                                    Started: {new Date(drill.createdAt).toLocaleString()}
                                  </div>
                                  <button
                                    onClick={() => router.push(`/drills/${drill._id}`)}
                                    className="mt-2 text-xs px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                                  >
                                    View Details
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </Card>
                    </motion.div>

                    {/* Risk scores (heuristics) */}
                    {(studentRiskPredictions || drillPerformancePrediction || optimalDrillTiming) && (
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1.2 }}
                      >
                        <Card className="bg-white/90 backdrop-blur-lg border border-white/20 shadow-xl">
                          <div className="p-6">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-1">
                              <Zap className="h-5 w-5 text-purple-600" />
                              Risk scores
                            </h3>
                            <p className="text-xs text-gray-500 mb-4">Rule-based risk scores from drill and quiz stats — not a trained ML model.</p>
                            <div className="space-y-4">
                              {studentRiskPredictions && (
                                <div className="border-t pt-4">
                                  <h4 className="font-semibold text-sm mb-3 text-gray-700">Student Risk Assessment</h4>
                                  <div className="grid grid-cols-3 gap-2 mb-3">
                                    <div className="bg-red-50 p-2 rounded-lg border border-red-200 text-center">
                                      <div className="text-xl font-bold text-red-700">
                                        {studentRiskPredictions.summary.highRisk}
                                      </div>
                                      <div className="text-xs text-red-600 font-semibold">High Risk</div>
                                    </div>
                                    <div className="bg-yellow-50 p-2 rounded-lg border border-yellow-200 text-center">
                                      <div className="text-xl font-bold text-yellow-700">
                                        {studentRiskPredictions.summary.mediumRisk}
                                      </div>
                                      <div className="text-xs text-yellow-600 font-semibold">Medium</div>
                                    </div>
                                    <div className="bg-green-50 p-2 rounded-lg border border-green-200 text-center">
                                      <div className="text-xl font-bold text-green-700">
                                        {studentRiskPredictions.summary.lowRisk}
                                      </div>
                                      <div className="text-xs text-green-600 font-semibold">Low Risk</div>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {drillPerformancePrediction && (
                                <div className="border-t pt-4">
                                  <h4 className="font-semibold text-sm mb-2 text-gray-700">Heuristic drill score</h4>
                                  <div className="text-xs space-y-1 bg-blue-50 p-3 rounded-lg">
                                    <div>Response Time: <span className="font-bold">{drillPerformancePrediction.predictedResponseTime}s</span></div>
                                    <div>Participation: <span className="font-bold">{drillPerformancePrediction.predictedParticipationRate}%</span></div>
                                    <div className="text-gray-600">Confidence: {Math.round(drillPerformancePrediction.confidence * 100)}%</div>
                                  </div>
                                </div>
                              )}

                              {optimalDrillTiming?.recommendation && (
                                <div className="border-t pt-4">
                                  <h4 className="font-semibold text-sm mb-2 text-gray-700">Optimal Timing</h4>
                                  <div className="text-xs space-y-1 bg-green-50 p-3 rounded-lg">
                                    <div>Day: <span className="font-bold">{
                                      ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][optimalDrillTiming.recommendation.dayOfWeek]
                                    }</span></div>
                                    <div>Time: <span className="font-bold">{optimalDrillTiming.recommendation.hourOfDay}:00</span></div>
                                    <div>Expected: <span className="font-bold">{optimalDrillTiming.recommendation.predictedParticipationRate}%</span></div>
                                  </div>
                                </div>
                              )}

                              {drillAnomalies && drillAnomalies.anomalies.length > 0 && (
                                <div className="border-t pt-4">
                                  <h4 className="font-semibold text-sm mb-2 text-orange-600 flex items-center gap-1">
                                    <AlertTriangle className="h-4 w-4" />
                                    Anomalies Detected
                                  </h4>
                                  <div className="text-xs text-orange-700 bg-orange-50 p-3 rounded-lg">
                                    {drillAnomalies.anomalies.length} drill{drillAnomalies.anomalies.length > 1 ? 's' : ''} with unusual patterns
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    )}
                  </div>
                </div>
              </>
            )}
            </div>
          </main>
        </div>
      </div>
    </AdminRoute>
  );
}
