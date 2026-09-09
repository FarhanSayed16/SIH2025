/**
 * Analytics Dashboard Page - Complete Implementation with Real-time Data
 * Comprehensive analytics and insights for your institution
 * Smart India Hackathon - SafeSchool Disaster Management System
 */

'use client';

import { AppShell } from '@/components/layout/app-shell';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';
import { AdminRoute } from '@/components/auth/AdminRoute';
import { analyticsApi, DrillMetrics, StudentProgress, InstitutionAnalytics, ModuleCompletion, GamePerformance, QuizAccuracy } from '@/lib/api/analytics';
import { apiClient } from '@/lib/api/client';
import { getInstitutionId } from '@/lib/utils/institution';
import {
  analyticsRequestKey,
  mapTabToReportType,
  formatMetricOrUnavailable,
} from '@/lib/api/wb7-honesty';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { AnimatedCounter } from '@/components/dashboard/AnimatedCounter';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import {
  TrendingUp,
  Users,
  Target,
  Award,
  BookOpen,
  Gamepad2,
  CheckCircle,
  Clock,
  RefreshCw,
  Download,
  BarChart3,
  Activity,
  Shield,
  Calendar,
  Zap,
  Star
} from 'lucide-react';

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#6366f1'];
const CHART_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#6366f1', '#14b8a6'];

type TabType = 'drills' | 'students' | 'institution' | 'modules' | 'games' | 'quizzes';

// Main Analytics Page Component
function AnalyticsPageContent() {
  const router = useRouter();
  const { user, isAuthenticated, accessToken } = useAuthStore();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('drills');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [draftDateRange, setDraftDateRange] = useState({ start: '', end: '' });
  const [appliedDateRange, setAppliedDateRange] = useState({ start: '', end: '' });
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [appliedScopeLabel, setAppliedScopeLabel] = useState('All time (no date filter)');
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const requestSeqRef = useRef(0);
  
  // Data states
  const [drillMetrics, setDrillMetrics] = useState<DrillMetrics | null>(null);
  const [studentProgress, setStudentProgress] = useState<StudentProgress | null>(null);
  const [institutionAnalytics, setInstitutionAnalytics] = useState<InstitutionAnalytics | null>(null);
  const [moduleCompletion, setModuleCompletion] = useState<ModuleCompletion[] | null>(null);
  const [gamePerformance, setGamePerformance] = useState<GamePerformance | null>(null);
  const [quizAccuracy, setQuizAccuracy] = useState<QuizAccuracy | null>(null);

  // Load data based on active tab + applied date range only
  const loadData = useCallback(async (opts?: { soft?: boolean; range?: { start: string; end: string }; tab?: TabType }) => {
    if (!isAuthenticated || !user) return;

    const tab = opts?.tab ?? activeTab;
    const range = opts?.range ?? appliedDateRange;
    const soft = opts?.soft === true;
    const seq = ++requestSeqRef.current;
    const scopeKey = analyticsRequestKey(tab, range.start, range.end);

    if (soft) setIsRefreshing(true);
    else setIsLoading(true);
    setLoadError(null);
    const institutionId = getInstitutionId(user.institutionId) || undefined;
    const startDate = range.start || undefined;
    const endDate = range.end || undefined;

    try {
      switch (tab) {
        case 'drills':
          setDrillMetrics(await analyticsApi.getDrillMetrics(institutionId, undefined, startDate, endDate));
          break;
        case 'students':
          setStudentProgress(await analyticsApi.getStudentProgress(institutionId, undefined, undefined, startDate, endDate));
          break;
        case 'institution':
          setInstitutionAnalytics(await analyticsApi.getInstitutionAnalytics(institutionId, startDate, endDate));
          break;
        case 'modules':
          setModuleCompletion(await analyticsApi.getModuleCompletion(institutionId, startDate, endDate));
          break;
        case 'games':
          setGamePerformance(await analyticsApi.getGamePerformance(institutionId, undefined, startDate, endDate));
          break;
        case 'quizzes':
          setQuizAccuracy(await analyticsApi.getQuizAccuracy(institutionId, undefined, startDate, endDate));
          break;
      }
      if (seq !== requestSeqRef.current) return;
      if (scopeKey !== analyticsRequestKey(tab, range.start, range.end)) return;
      setLastUpdated(new Date());
      setAppliedScopeLabel(
        range.start || range.end
          ? `Applied: ${range.start || '…'} → ${range.end || '…'}`
          : 'All time (no date filter)'
      );
    } catch (error: any) {
      if (seq !== requestSeqRef.current) return;
      console.error(`Error loading ${tab} data:`, error);
      setLoadError(`Failed to load ${tab} data. Use Refresh to try again.`);
    } finally {
      if (seq === requestSeqRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [activeTab, isAuthenticated, user, appliedDateRange]);

  // Auto-refresh soft-reloads applied scope
  useEffect(() => {
    if (autoRefresh) {
      refreshIntervalRef.current = setInterval(() => {
        loadData({ soft: true });
      }, 30000);

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    } else {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    }
  }, [autoRefresh, loadData]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (accessToken) {
      apiClient.setToken(accessToken);
    }
  }, [isAuthenticated, accessToken, router]);

  // Load when tab changes or after auth — always uses applied date range
  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;
    loadData({ soft: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, accessToken, activeTab]);

  const applyDateFilter = () => {
    setAppliedDateRange({ ...draftDateRange });
    loadData({ soft: false, range: { ...draftDateRange } });
  };

  const clearDateFilter = () => {
    const empty = { start: '', end: '' };
    setDraftDateRange(empty);
    setAppliedDateRange(empty);
    loadData({ soft: false, range: empty });
  };

  const handleExport = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const institutionId = getInstitutionId(user?.institutionId) || undefined;
      const reportType = mapTabToReportType(activeTab);
      const result = await analyticsApi.generateReport(
        'csv',
        reportType,
        institutionId,
        appliedDateRange.start || undefined,
        appliedDateRange.end || undefined
      );
      const payload = (result as any)?.data || result;
      const fileUrl = payload?.fileUrl || payload?.url;
      const filename = payload?.filename;
      if (fileUrl) {
        const absolute = fileUrl.startsWith('http')
          ? fileUrl
          : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}${fileUrl.startsWith('/') ? '' : '/'}${fileUrl.replace(/^\/api/, '')}`.replace('/api/api', '/api');
        // Prefer authorized download route when filename present
        if (filename) {
          window.open(
            `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/analytics/reports/${encodeURIComponent(filename)}`,
            '_blank'
          );
        } else {
          window.open(absolute, '_blank');
        }
        showToast('Report generated for the applied filter scope', 'success');
      } else if (filename) {
        window.open(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/analytics/reports/${encodeURIComponent(filename)}`,
          '_blank'
        );
        showToast('Report generated for the applied filter scope', 'success');
      } else {
        showToast('Export unavailable — server did not return a file', 'error');
      }
    } catch (error: any) {
      showToast(error?.message || 'Failed to export data', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // Tab configuration with icons
  const tabs: Array<{ id: TabType; label: string; icon: React.ReactNode; description: string }> = [
    { id: 'drills', label: 'Drill Analytics', icon: <Shield className="h-5 w-5" />, description: 'Emergency drill performance' },
    { id: 'students', label: 'Student Progress', icon: <Users className="h-5 w-5" />, description: 'Individual student growth' },
    { id: 'institution', label: 'School Overview', icon: <BarChart3 className="h-5 w-5" />, description: 'Institution-wide metrics' },
    { id: 'modules', label: 'Learning Modules', icon: <BookOpen className="h-5 w-5" />, description: 'Course completion rates' },
    { id: 'games', label: 'Game Performance', icon: <Gamepad2 className="h-5 w-5" />, description: 'Engagement & learning games' },
    { id: 'quizzes', label: 'Quiz Accuracy', icon: <CheckCircle className="h-5 w-5" />, description: 'Knowledge assessment results' },
  ];

  // Render content based on active tab
  const renderTabContent = () => {
    if (isLoading && !drillMetrics && !studentProgress && !institutionAnalytics && !moduleCompletion && !gamePerformance && !quizAccuracy) {
      return <LoadingSkeleton />;
    }

    if (loadError && isLoading) {
      return <EmptyState title="Analytics unavailable" description={loadError} />;
    }

    if (loadError) {
      return (
        <div className="space-y-4">
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {loadError}{' '}
            <button type="button" className="underline font-medium" onClick={() => loadData({ soft: true })}>
              Retry
            </button>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'drills':
        return <DrillMetricsView data={drillMetrics} />;
      case 'students':
        return <StudentProgressView data={studentProgress} />;
      case 'institution':
        return <InstitutionAnalyticsView data={institutionAnalytics} />;
      case 'modules':
        return <ModuleCompletionView data={moduleCompletion} />;
      case 'games':
        return <GamePerformanceView data={gamePerformance} />;
      case 'quizzes':
        return <QuizAccuracyView data={quizAccuracy} />;
      default:
        return <EmptyState title="Select a tab" description="Select a tab to view analytics" />;
    }
  };

  return (
    <AppShell title="Institution Analytics">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/20">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                      Analytics <span className="text-blue-600">Dashboard</span>
                    </h1>
                    <p className="text-gray-600 mt-1 text-base">
                      Comprehensive safety insights and learning analytics for your school
                    </p>
                  </div>
                </div>
                {lastUpdated && (
                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 ml-14">
                    <Clock className="h-4 w-4" />
                    <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
                    <span className="text-xs text-gray-500">{appliedScopeLabel}</span>
                    {isRefreshing && <span className="text-xs">Refreshing…</span>}
                    {autoRefresh && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-50 text-teal-800 text-xs font-medium border border-teal-200">
                        <Zap className="h-3 w-3" />
                        Auto-refresh on
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-200 shadow-sm">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoRefresh}
                      onChange={(e) => setAutoRefresh(e.target.checked)}
                      className="h-4 w-4 text-teal-700 focus:ring-teal-600 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700 font-medium">Auto-refresh</span>
                  </label>
                </div>
                <Button 
                  onClick={() => loadData({ soft: true })} 
                  variant="outline"
                  disabled={isRefreshing}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button 
                  onClick={handleExport}
                  disabled={isExporting}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isExporting ? 'Exporting…' : 'Export CSV'}
                </Button>
              </div>
            </div>

            {/* Date Range Filter — draft until Apply */}
            <Card className="p-6 bg-white border border-gray-200 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center gap-5">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-teal-50">
                    <Calendar className="h-5 w-5 text-teal-700" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Date range</h3>
                    <p className="text-sm text-gray-500">Draft until you click Apply — charts use the applied scope only</p>
                  </div>
                </div>
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start date</label>
                    <input
                      type="date"
                      value={draftDateRange.start}
                      onChange={(e) => setDraftDateRange(prev => ({ ...prev, start: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End date</label>
                    <input
                      type="date"
                      value={draftDateRange.end}
                      onChange={(e) => setDraftDateRange(prev => ({ ...prev, end: e.target.value }))}
                      min={draftDateRange.start || undefined}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white text-gray-900"
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <Button 
                      onClick={applyDateFilter} 
                      className="w-full"
                    >
                      Apply filter
                    </Button>
                    <Button
                      onClick={clearDateFilter}
                      variant="outline"
                      className="w-full"
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            {/* Tabs Navigation */}
            <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`p-4 rounded-lg transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-blue-50 border-2 border-blue-200 shadow-sm'
                        : 'hover:bg-gray-50 border-2 border-transparent'
                    }`}
                  >
                    <div className="flex flex-col items-center text-center space-y-2">
                      <div className={`p-3 rounded-full transition-colors ${
                        activeTab === tab.id 
                          ? 'bg-blue-100 text-blue-600' 
                          : 'bg-gray-100 text-gray-400'
                      }`}>
                        {tab.icon}
                      </div>
                      <div>
                        <div className={`font-semibold text-sm ${
                          activeTab === tab.id ? 'text-gray-900' : 'text-gray-600'
                        }`}>
                          {tab.label}
                        </div>
                        <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {tab.description}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Active Tab Content */}
            <div className="min-h-[600px]">
              {renderTabContent()}
            </div>

            {/* Educational Banner */}
            <div className="p-6 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/20">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-white/10 backdrop-blur-sm">
                    <Award className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Continuous Improvement</h3>
                    <p className="text-sm text-blue-50 leading-relaxed">
                      Regular analytics help identify areas for improvement and track safety education progress.
                      Use these insights to enhance your school&apos;s disaster preparedness.
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => router.push('/training')}
                  className="px-5 py-2.5 bg-white text-blue-700 font-semibold rounded-lg hover:bg-blue-50 transition-all shadow-md whitespace-nowrap"
                >
                  View Training Modules
                </button>
              </div>
            </div>
          </div>
        </AppShell>
  );
}

// Drill Metrics View Component
function DrillMetricsView({ data }: { data: DrillMetrics | null }) {
  if (!data || (data.totalParticipants === 0 && !data.participationOverTime?.length)) {
    return <EmptyState 
      title="No drill data available" 
      description="Conduct emergency drills to start tracking safety performance"
      icon={<Shield className="h-12 w-12 text-gray-400" />}
    />;
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, duration: 0.5 }
    })
  };

  return (
    <motion.div 
      className="space-y-6"
      initial="hidden"
      animate="visible"
    >
      {/* Performance Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <motion.div variants={cardVariants} custom={0}>
          <Card className="p-6 bg-gradient-to-br from-white to-blue-50/30 border border-blue-200 hover:border-blue-400 hover:shadow-lg transition-all duration-300 backdrop-blur-sm">
            <div className="flex items-center">
              <motion.div 
                className="p-3 rounded-xl bg-blue-100 mr-4"
                whileHover={{ scale: 1.1, rotate: 5 }}
              >
                <Users className="h-6 w-6 text-blue-600" />
              </motion.div>
              <div>
                <div className="text-sm text-gray-500 font-medium mb-1">Total Participants</div>
                <div className="text-3xl font-bold text-gray-900">
                  <AnimatedCounter value={data.totalParticipants || 0} />
                </div>
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-500 font-medium">
              Engaged in safety drills
            </div>
          </Card>
        </motion.div>

        <motion.div variants={cardVariants} custom={1}>
          <Card className="p-6 bg-gradient-to-br from-white to-indigo-50/30 border border-indigo-200 hover:border-indigo-400 hover:shadow-lg transition-all duration-300 backdrop-blur-sm">
            <div className="flex items-center">
              <motion.div 
                className="p-3 rounded-xl bg-indigo-100 mr-4"
                whileHover={{ scale: 1.1, rotate: -5 }}
              >
                <Clock className="h-6 w-6 text-indigo-600" />
              </motion.div>
              <div>
                <div className="text-sm text-gray-500 font-medium mb-1">Avg Evacuation Time</div>
                <div className="text-3xl font-bold text-gray-900">
                  {formatMetricOrUnavailable(data.avgEvacuationTime, { decimals: 1, suffix: 's' })}
                </div>
              </div>
            </div>
            <div className="mt-4 text-xs font-medium text-gray-500">
              Measured average when recorded (no grade scale configured)
            </div>
          </Card>
        </motion.div>

        <motion.div variants={cardVariants} custom={2}>
          <Card className="p-6 bg-gradient-to-br from-white to-purple-50/30 border border-purple-200 hover:border-purple-400 hover:shadow-lg transition-all duration-300 backdrop-blur-sm">
            <div className="flex items-center">
              <motion.div 
                className="p-3 rounded-xl bg-purple-100 mr-4"
                whileHover={{ scale: 1.1, rotate: 5 }}
              >
                <Activity className="h-6 w-6 text-purple-600" />
              </motion.div>
              <div>
                <div className="text-sm text-gray-500 font-medium mb-1">Best Time</div>
                <div className="text-3xl font-bold text-gray-900">
                  <AnimatedCounter value={data.minEvacuationTime || 0} decimals={1} suffix="s" />
                </div>
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-500 font-medium">
              Fastest evacuation recorded
            </div>
          </Card>
        </motion.div>

        <motion.div variants={cardVariants} custom={3}>
          <Card className="p-6 bg-gradient-to-br from-white to-emerald-50/30 border border-emerald-200 hover:border-emerald-400 hover:shadow-lg transition-all duration-300 backdrop-blur-sm">
            <div className="flex items-center">
              <motion.div 
                className="p-3 rounded-xl bg-emerald-100 mr-4"
                whileHover={{ scale: 1.1, rotate: -5 }}
              >
                <Target className="h-6 w-6 text-emerald-600" />
              </motion.div>
              <div>
                <div className="text-sm text-gray-500 font-medium mb-1">Average Drill Score</div>
                <div className="text-3xl font-bold text-gray-900">
                  {formatMetricOrUnavailable(data.avgScore, { decimals: 0 })}
                </div>
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-500 font-medium">
              From avgScore field when present (scale as returned by API)
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Participation Trend */}
        {data.participationOverTime && data.participationOverTime.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <Card className="p-6 bg-white/80 backdrop-blur-sm border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Participation Trend</h3>
                  <p className="text-sm text-gray-500 mt-1">Drill engagement over time</p>
                </div>
              </div>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.participationOverTime}>
                    <defs>
                      <linearGradient id="participantsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="participants" 
                      stroke="#3b82f6" 
                      fill="url(#participantsGradient)"
                      strokeWidth={3}
                      name="Participants"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </motion.div>
        )}

        <EmptyState
          title="Drill type breakdown unavailable"
          description="Drill analytics does not include measured results by drill type."
        />
      </div>

    </motion.div>
  );
}

// Student Progress View Component
function StudentProgressView({ data }: { data: StudentProgress | null }) {
  if (!data || (data.summary?.totalStudents === 0 && !data.progressOverTime?.length && !data.games?.length)) {
    return <EmptyState 
      title="No student progress data" 
      description="Students need to complete modules to track progress"
      icon={<Users className="h-12 w-12 text-gray-400" />}
    />;
  }

  const progressChartData = data.progressOverTime?.map(item => ({
    date: item.date,
    score: item.avgScore,
    students: item.studentCount || 0
  })) || [];

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, duration: 0.5 }
    })
  };

  return (
    <motion.div 
      className="space-y-6"
      initial="hidden"
      animate="visible"
    >
      {/* Student Performance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <motion.div variants={cardVariants} custom={0}>
          <Card className="p-6 bg-gradient-to-br from-white to-purple-50/30 border border-purple-200 hover:border-purple-400 hover:shadow-lg transition-all duration-300 backdrop-blur-sm">
            <div className="flex items-center">
              <motion.div 
                className="p-3 rounded-xl bg-purple-100 mr-4"
                whileHover={{ scale: 1.1, rotate: 5 }}
              >
                <Users className="h-6 w-6 text-purple-600" />
              </motion.div>
              <div>
                <div className="text-sm text-gray-500 font-medium mb-1">Total Students</div>
                <div className="text-3xl font-bold text-gray-900">
                  <AnimatedCounter value={data.summary?.totalStudents || 0} />
                </div>
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-500 font-medium">
              Active in safety training
            </div>
          </Card>
        </motion.div>

        <motion.div variants={cardVariants} custom={1}>
          <Card className="p-6 bg-gradient-to-br from-white to-blue-50/30 border border-blue-200 hover:border-blue-400 hover:shadow-lg transition-all duration-300 backdrop-blur-sm">
            <div className="flex items-center">
              <motion.div 
                className="p-3 rounded-xl bg-blue-100 mr-4"
                whileHover={{ scale: 1.1, rotate: -5 }}
              >
                <Target className="h-6 w-6 text-blue-600" />
              </motion.div>
              <div>
                <div className="text-sm text-gray-500 font-medium mb-1">Avg Preparedness</div>
                <div className="text-3xl font-bold text-gray-900">
                  <AnimatedCounter 
                    value={data.summary?.avgPreparednessScore || 0} 
                    decimals={1} 
                    suffix="%" 
                  />
                </div>
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-500 font-medium">
              Disaster readiness level
            </div>
          </Card>
        </motion.div>

        <motion.div variants={cardVariants} custom={2}>
          <Card className="p-6 bg-gradient-to-br from-white to-emerald-50/30 border border-emerald-200 hover:border-emerald-400 hover:shadow-lg transition-all duration-300 backdrop-blur-sm">
            <div className="flex items-center">
              <motion.div 
                className="p-3 rounded-xl bg-emerald-100 mr-4"
                whileHover={{ scale: 1.1, rotate: 5 }}
              >
                <BookOpen className="h-6 w-6 text-emerald-600" />
              </motion.div>
              <div>
                <div className="text-sm text-gray-500 font-medium mb-1">Avg Modules</div>
                <div className="text-3xl font-bold text-gray-900">
                  <AnimatedCounter 
                    value={data.summary?.avgModulesCompleted || 0} 
                    decimals={1} 
                  />
                </div>
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-500 font-medium">
              Learning modules completed
            </div>
          </Card>
        </motion.div>

        <motion.div variants={cardVariants} custom={3}>
          <Card className="p-6 bg-gradient-to-br from-white to-amber-50/30 border border-amber-200 hover:border-amber-400 hover:shadow-lg transition-all duration-300 backdrop-blur-sm">
            <div className="flex items-center">
              <motion.div 
                className="p-3 rounded-xl bg-amber-100 mr-4"
                whileHover={{ scale: 1.1, rotate: -5 }}
              >
                <TrendingUp className="h-6 w-6 text-amber-600" />
              </motion.div>
              <div>
                <div className="text-sm text-gray-500 font-medium mb-1">Avg Login Streak</div>
                <div className="text-3xl font-bold text-gray-900">
                  <AnimatedCounter 
                    value={data.summary?.avgLoginStreak || 0} 
                    decimals={1} 
                    suffix=" days" 
                  />
                </div>
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-500 font-medium">
              Consistent engagement
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Progress Trend */}
        {progressChartData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <Card className="p-6 bg-white/80 backdrop-blur-sm border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Learning Progress Trend</h3>
                  <p className="text-sm text-gray-500 mt-1">Average scores and module completion over time</p>
                </div>
              </div>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={progressChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="score" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      dot={{ r: 5, fill: '#3b82f6' }}
                      name="Avg Score (%)"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="students" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      dot={{ r: 4, fill: '#10b981' }}
                      name="Active Students"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </motion.div>
        )}

        <EmptyState
          title="Skills assessment unavailable"
          description="Student analytics does not include measured scores by safety skill."
        />
      </div>

      {/* Games Performance */}
      {data.games && data.games.length > 0 && (
        <Card className="p-6 bg-white border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-5">Learning Games Performance</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.games.map((game, index) => (
              <Card key={index} className="p-5 bg-gradient-to-br from-gray-50 to-white border border-gray-200 hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 rounded-lg bg-blue-50">
                    <Gamepad2 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="text-sm font-semibold text-gray-900">{game.gameType}</div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500 font-medium">Games Played</span>
                    <span className="font-bold text-gray-900 text-base">{game.totalGames}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500 font-medium">Avg Score</span>
                    <span className="font-bold text-blue-600 text-base">{game.avgScore?.toFixed(1) || '0'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500 font-medium">Total XP</span>
                    <span className="font-bold text-emerald-600 text-base">{game.totalXP || 0}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Card>
      )}
    </motion.div>
  );
}

// Institution Analytics View Component
function InstitutionAnalyticsView({ data }: { data: InstitutionAnalytics | null }) {
  if (!data) {
    return <EmptyState 
      title="No institution data" 
      description="School analytics will appear here as data accumulates"
      icon={<BarChart3 className="h-12 w-12 text-gray-400" />}
    />;
  }

  return (
    <div className="space-y-6">
      {/* School Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="p-6 bg-white border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200">
          <div className="flex items-center">
            <div className="p-3 rounded-xl bg-blue-50 mr-4">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <div className="text-sm text-gray-500 font-medium mb-1">Total Users</div>
              <div className="text-3xl font-bold text-gray-900">{data.institution?.totalUsers || 0}</div>
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-500 font-medium">
            School community members
          </div>
        </Card>

        <Card className="p-6 bg-white border border-gray-200 hover:border-emerald-300 hover:shadow-md transition-all duration-200">
          <div className="flex items-center">
            <div className="p-3 rounded-xl bg-emerald-50 mr-4">
              <BookOpen className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <div className="text-sm text-gray-500 font-medium mb-1">Total Classes</div>
              <div className="text-3xl font-bold text-gray-900">{data.institution?.totalClasses || 0}</div>
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-500 font-medium">
            Participating classrooms
          </div>
        </Card>

        <Card className="p-6 bg-white border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-xl bg-amber-50 mr-4">
              <Activity className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <div className="text-sm text-gray-500 font-medium mb-1">Active users (30d)</div>
              <div className="text-lg font-semibold text-gray-700">Unavailable</div>
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-500 font-medium">
            Engagement metrics are not provided by this analytics contract
          </div>
        </Card>

        <Card className="p-6 bg-white border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-xl bg-purple-50 mr-4">
              <Target className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <div className="text-sm text-gray-500 font-medium mb-1">Retention rate</div>
              <div className="text-lg font-semibold text-gray-700">Unavailable</div>
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-500 font-medium">
            Not inventing 0% from missing engagement data
          </div>
        </Card>
      </div>

      {/* Activities Summary */}
      {data.activities && (
        <Card className="p-6 bg-white border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-6">School Activities Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 bg-blue-50 rounded-lg border border-blue-100">
              <div className="text-sm text-gray-600 mb-2 font-medium">Total Quizzes</div>
              <div className="text-2xl font-bold text-gray-900">{data.activities.totalQuizzes || 0}</div>
              <div className="text-xs text-blue-600 mt-2 font-medium">Knowledge checks</div>
            </div>
            <div className="p-5 bg-emerald-50 rounded-lg border border-emerald-100">
              <div className="text-sm text-gray-600 mb-2 font-medium">Total Games</div>
              <div className="text-2xl font-bold text-gray-900">{data.activities.totalGames || 0}</div>
              <div className="text-xs text-emerald-600 mt-2 font-medium">Learning games</div>
            </div>
            <div className="p-5 bg-amber-50 rounded-lg border border-amber-100">
              <div className="text-sm text-gray-600 mb-2 font-medium">Total Drills</div>
              <div className="text-2xl font-bold text-gray-900">{data.activities.totalDrills || 0}</div>
              <div className="text-xs text-amber-600 mt-2 font-medium">Safety drills</div>
            </div>
            <div className="p-5 bg-purple-50 rounded-lg border border-purple-100">
              <div className="text-sm text-gray-600 mb-2 font-medium">Drill Logs</div>
              <div className="text-2xl font-bold text-gray-900">{data.activities.totalDrillLogs || 0}</div>
              <div className="text-xs text-purple-600 mt-2 font-medium">Practice sessions</div>
            </div>
          </div>
        </Card>
      )}

      {/* Classes List */}
      {data.institution?.classes && data.institution.classes.length > 0 && (
        <Card className="p-5 bg-white border-2 border-green-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">🏫 School Classes</h3>
              <p className="text-sm text-gray-600">Classroom participation in safety training</p>
            </div>
            <div className="text-sm text-gray-500">
              {data.institution.classes.length} classes total
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-green-100">
              <thead className="bg-green-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Class Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Teacher
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Students
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-green-100">
                {data.institution.classes.map((cls, index) => (
                  <tr key={index} className="hover:bg-green-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="p-2 rounded-lg bg-blue-100 mr-3">
                          <BookOpen className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="font-medium text-gray-900">{cls.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {cls.teacherName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 text-gray-400 mr-1" />
                        <span className="font-medium text-gray-900">{cls.studentCount}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        Status not provided
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

// Module Completion View Component
function ModuleCompletionView({ data }: { data: ModuleCompletion[] | null }) {
  if (!data || data.length === 0) {
    return <EmptyState 
      title="No module completion data" 
      description="Students need to complete learning modules to generate data"
      icon={<BookOpen className="h-12 w-12 text-gray-400" />}
    />;
  }

  const chartData = data.map(module => ({
    name: module.moduleTitle || module.moduleId,
    completed: module.completedCount || 0,
    total: module.totalStudents || 0,
    rate: module.completionRate || 0
  }));

  // Calculate overall completion rate
  const overallCompletion = data.length > 0 
    ? data.reduce((sum, module) => sum + (module.completionRate || 0), 0) / data.length 
    : 0;

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <Card className="p-6 bg-white border border-gray-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Learning Module Overview</h3>
            <p className="text-sm text-gray-500 mt-1">Completion rates across all safety modules</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-100">
              <div className="text-sm text-gray-600 mb-1 font-medium">Overall Completion</div>
              <div className="text-3xl font-bold text-gray-900">{overallCompletion.toFixed(1)}%</div>
            </div>
            <div className="text-center p-4 bg-indigo-50 rounded-lg border border-indigo-100">
              <div className="text-sm text-gray-600 mb-1 font-medium">Total Modules</div>
              <div className="text-3xl font-bold text-gray-900">{data.length}</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Completion Chart */}
      <Card className="p-6 bg-white border border-gray-200 shadow-sm">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-gray-900">Module Completion Analysis</h3>
          <p className="text-sm text-gray-500 mt-1">Student engagement across learning modules</p>
        </div>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="name" 
                angle={-45} 
                textAnchor="end" 
                height={80}
                stroke="#6b7280"
                fontSize={12}
              />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                formatter={(value, name) => {
                  if (name === 'rate') return [`${value}%`, 'Completion Rate'];
                  if (name === 'completed') return [value, 'Students Completed'];
                  return [value, 'Total Students'];
                }}
              />
              <Legend />
              <Bar dataKey="completed" fill="#3b82f6" name="Students Completed" radius={[4, 4, 0, 0]} />
              <Bar dataKey="total" fill="#e5e7eb" name="Total Students" radius={[4, 4, 0, 0]} opacity={0.5} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Module Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {data.map((module, index) => {
          const completionRate = module.completionRate || 0;
          const statusColor = completionRate >= 80 ? 'text-emerald-600' : 
                            completionRate >= 60 ? 'text-amber-600' : 'text-red-600';
          const bgColor = completionRate >= 80 ? 'bg-emerald-50 border-emerald-200' : 
                         completionRate >= 60 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200';

          return (
            <Card key={index} className={`p-5 bg-white border ${bgColor} hover:shadow-md transition-all`}>
              <div className="flex items-start justify-between mb-4">
                <div className="p-2.5 rounded-lg bg-blue-50">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                </div>
                <div className={`px-3 py-1.5 rounded-full text-xs font-bold ${statusColor} ${bgColor}`}>
                  {completionRate.toFixed(0)}% Complete
                </div>
              </div>
              <div className="text-sm font-semibold text-gray-900 mb-3 line-clamp-2">
                {module.moduleTitle || module.moduleId}
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-medium">Students Completed</span>
                  <span className="font-bold text-gray-900">{module.completedCount || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-medium">Total Students</span>
                  <span className="font-bold text-gray-900">{module.totalStudents || 0}</span>
                </div>
                <div className="pt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className={`h-2.5 rounded-full transition-all ${
                        completionRate >= 80 ? 'bg-emerald-500' :
                        completionRate >= 60 ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(100, completionRate)}%` }}
                    />
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// Game Performance View Component
function GamePerformanceView({ data }: { data: GamePerformance | null }) {
  if (!data || (!data.byGameType?.length && !data.overTime?.length)) {
    return <EmptyState 
      title="No game performance data" 
      description="Students need to play learning games to generate data"
      icon={<Gamepad2 className="h-12 w-12 text-gray-400" />}
    />;
  }

  return (
    <div className="space-y-6">
      {/* Game Performance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="p-6 bg-white border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all duration-200">
          <div className="flex items-center">
            <div className="p-3 rounded-xl bg-purple-50 mr-4">
              <Gamepad2 className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <div className="text-sm text-gray-500 font-medium mb-1">Total Games Played</div>
              <div className="text-3xl font-bold text-gray-900">
                {data.byGameType?.reduce((sum, game) => sum + (game.totalGames || 0), 0) || 0}
              </div>
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-500 font-medium">
            Learning through play
          </div>
        </Card>

        <Card className="p-6 bg-white border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200">
          <div className="flex items-center">
            <div className="p-3 rounded-xl bg-blue-50 mr-4">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <div className="text-sm text-gray-500 font-medium mb-1">Unique Players</div>
              <div className="text-3xl font-bold text-gray-900">
                {data.byGameType?.reduce((sum, game) => sum + (game.uniquePlayers || 0), 0) || 0}
              </div>
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-500 font-medium">
            Active game participants
          </div>
        </Card>

        <Card className="p-6 bg-white border border-gray-200 hover:border-emerald-300 hover:shadow-md transition-all duration-200">
          <div className="flex items-center">
            <div className="p-3 rounded-xl bg-emerald-50 mr-4">
              <Star className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <div className="text-sm text-gray-500 font-medium mb-1">Avg Game Score</div>
              <div className="text-3xl font-bold text-gray-900">
                {(() => {
                  const games = data.byGameType || [];
                  const totalScore = games.reduce((sum, game) => sum + (game.avgScore || 0) * (game.totalGames || 0), 0);
                  const totalGames = games.reduce((sum, game) => sum + (game.totalGames || 0), 0);
                  return totalGames > 0 ? (totalScore / totalGames).toFixed(1) : '0.0';
                })()}
              </div>
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-500 font-medium">
            Performance average
          </div>
        </Card>

        <Card className="p-6 bg-white border border-gray-200 hover:border-amber-300 hover:shadow-md transition-all duration-200">
          <div className="flex items-center">
            <div className="p-3 rounded-xl bg-amber-50 mr-4">
              <Award className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <div className="text-sm text-gray-500 font-medium mb-1">Total XP Earned</div>
              <div className="text-3xl font-bold text-gray-900">
                {data.byGameType?.reduce((sum, game) => sum + (game.totalXP || 0), 0) || 0}
              </div>
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-500 font-medium">
            Learning points collected
          </div>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Game Performance by Type */}
        {data.byGameType && data.byGameType.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <Card className="p-6 bg-white/80 backdrop-blur-sm border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Game Performance by Type</h3>
                  <p className="text-sm text-gray-500 mt-1">Engagement across different learning games</p>
                </div>
              </div>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.byGameType}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="gameType" stroke="#6b7280" fontSize={12} angle={-45} textAnchor="end" height={80} />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Legend />
                    <Bar 
                      dataKey="totalGames" 
                      fill="#3b82f6" 
                      name="Total Games" 
                      radius={[8, 8, 0, 0]}
                    />
                    <Bar 
                      dataKey="uniquePlayers" 
                      fill="#8b5cf6" 
                      name="Unique Players" 
                      radius={[8, 8, 0, 0]}
                    />
                    <Bar 
                      dataKey="avgScore" 
                      fill="#10b981" 
                      name="Avg Score" 
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Game Type Distribution Pie Chart */}
        {data.byGameType && data.byGameType.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <Card className="p-6 bg-white/80 backdrop-blur-sm border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Game Distribution</h3>
                  <p className="text-sm text-gray-500 mt-1">Popularity of different game types</p>
                </div>
              </div>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.byGameType.map((game, i) => ({
                        name: game.gameType,
                        value: game.totalGames,
                        color: CHART_COLORS[i % CHART_COLORS.length]
                      }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {data.byGameType.map((game, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Game Type Cards */}
      {data.byGameType && data.byGameType.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {data.byGameType.map((game, index) => {
            const performanceScore = game.avgScore ? (game.avgScore / 100) * 100 : 0;
            const performanceColor = performanceScore >= 80 ? 'border-emerald-200 bg-emerald-50/30' : 
                                   performanceScore >= 60 ? 'border-amber-200 bg-amber-50/30' : 'border-red-200 bg-red-50/30';
            
            return (
              <Card key={index} className={`p-5 bg-white border ${performanceColor} hover:shadow-md transition-all`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2.5 rounded-lg bg-purple-50">
                    <Gamepad2 className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {game.totalGames || 0} games
                  </div>
                </div>
                <div className="text-sm font-semibold text-gray-900 mb-4">
                  {game.gameType}
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 font-medium">Players</span>
                    <span className="font-bold text-gray-900">{game.uniquePlayers || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 font-medium">Avg Score</span>
                    <span className="font-bold text-blue-600">{game.avgScore?.toFixed(1) || '0'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 font-medium">Total XP</span>
                    <span className="font-bold text-emerald-600">{game.totalXP || 0}</span>
                  </div>
                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                      <span className="font-medium">Performance</span>
                      <span className="font-bold">{performanceScore.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className={`h-2.5 rounded-full transition-all ${
                          performanceScore >= 80 ? 'bg-emerald-500' :
                          performanceScore >= 60 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(100, performanceScore)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Quiz Accuracy View Component
function QuizAccuracyView({ data }: { data: QuizAccuracy | null }) {
  if (!data || (!data.byModule?.length && !data.overTime?.length)) {
    return <EmptyState 
      title="No quiz data available" 
      description="Students need to complete quizzes to generate data"
      icon={<CheckCircle className="h-12 w-12 text-gray-400" />}
    />;
  }

  const overallAccuracy = data.overTime && data.overTime.length > 0
    ? data.overTime.reduce((sum, item) => sum + (item.accuracyRate || 0), 0) / data.overTime.length
    : 0;

  return (
    <div className="space-y-6">
      {/* Quiz Performance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="p-6 bg-white border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200">
          <div className="flex items-center">
            <div className="p-3 rounded-xl bg-blue-50 mr-4">
              <Target className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <div className="text-sm text-gray-500 font-medium mb-1">Overall Accuracy</div>
              <div className="text-3xl font-bold text-gray-900">
                {overallAccuracy.toFixed(1)}%
              </div>
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-500 font-medium">
            Average quiz accuracy rate
          </div>
        </Card>

        <Card className="p-6 bg-white border border-gray-200 hover:border-emerald-300 hover:shadow-md transition-all duration-200">
          <div className="flex items-center">
            <div className="p-3 rounded-xl bg-emerald-50 mr-4">
              <CheckCircle className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <div className="text-sm text-gray-500 font-medium mb-1">Pass Rate</div>
              <div className="text-3xl font-bold text-gray-900">
                {data.overTime && data.overTime.length > 0
                  ? (data.overTime.reduce((sum, item) => sum + (item.passRate || 0), 0) / data.overTime.length).toFixed(1)
                  : '0'
                }%
              </div>
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-500 font-medium">
            Percentage passing quizzes
          </div>
        </Card>

        <Card className="p-6 bg-white border border-gray-200 hover:border-amber-300 hover:shadow-md transition-all duration-200">
          <div className="flex items-center">
            <div className="p-3 rounded-xl bg-amber-50 mr-4">
              <BookOpen className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <div className="text-sm text-gray-500 font-medium mb-1">Total Quizzes</div>
              <div className="text-3xl font-bold text-gray-900">
                {data.byModule?.reduce((sum, module) => sum + (module.totalQuizzes || 0), 0) || 0}
              </div>
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-500 font-medium">
            Knowledge assessments taken
          </div>
        </Card>

        <Card className="p-6 bg-white border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all duration-200">
          <div className="flex items-center">
            <div className="p-3 rounded-xl bg-purple-50 mr-4">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <div className="text-sm text-gray-500 font-medium mb-1">Best Module</div>
              <div className="text-3xl font-bold text-gray-900">
                {data.byModule && data.byModule.length > 0
                  ? Math.max(...data.byModule.map(m => m.avgScore || 0)).toFixed(1)
                  : '0'
                }%
              </div>
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-500 font-medium">
            Highest scoring subject
          </div>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Accuracy Trend */}
        {data.overTime && data.overTime.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <Card className="p-6 bg-white/80 backdrop-blur-sm border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Quiz Accuracy Trend</h3>
                  <p className="text-sm text-gray-500 mt-1">Performance improvement over time</p>
                </div>
                <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg font-medium">
                  {data.overTime.length} assessments
                </div>
              </div>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.overTime}>
                    <defs>
                      <linearGradient id="accuracyGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="passGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                      formatter={(value) => [`${value}%`, '']}
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="accuracyRate" 
                      stroke="#3b82f6" 
                      fill="url(#accuracyGradient)"
                      strokeWidth={3}
                      name="Accuracy Rate"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="passRate" 
                      stroke="#8b5cf6" 
                      fill="url(#passGradient)"
                      strokeWidth={2}
                      name="Pass Rate"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Module Performance Bar Chart */}
        {data.byModule && data.byModule.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <Card className="p-6 bg-white/80 backdrop-blur-sm border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Performance by Module</h3>
                  <p className="text-sm text-gray-500 mt-1">Average scores across learning modules</p>
                </div>
              </div>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.byModule}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="moduleTitle" 
                      stroke="#6b7280" 
                      fontSize={12} 
                      angle={-45} 
                      textAnchor="end" 
                      height={100}
                    />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Legend />
                    <Bar 
                      dataKey="avgScore" 
                      fill="#3b82f6" 
                      name="Avg Score (%)" 
                      radius={[8, 8, 0, 0]}
                    />
                    <Bar 
                      dataKey="passRate" 
                      fill="#10b981" 
                      name="Pass Rate (%)" 
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Module Performance */}
      {data.byModule && data.byModule.length > 0 && (
        <Card className="p-6 bg-white border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-5">Performance by Learning Module</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {data.byModule.map((module, index) => {
              const hasScore =
                module.avgScore != null && Number.isFinite(Number(module.avgScore));
              const performance = hasScore ? Number(module.avgScore) : null;
              const performanceLevel = !hasScore
                ? 'Score unavailable'
                : performance! >= 80
                ? 'High avg (≥80)'
                : performance! >= 60
                ? 'Mid avg (≥60)'
                : 'Lower avg (<60)';
              const performanceColor = !hasScore
                ? 'border-gray-200 bg-gray-50/30'
                : performance! >= 80
                ? 'border-emerald-200 bg-emerald-50/30'
                : performance! >= 60
                ? 'border-amber-200 bg-amber-50/30'
                : 'border-red-200 bg-red-50/30';

              return (
                <Card key={index} className={`p-5 border ${performanceColor} hover:shadow-md transition-all`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-2.5 rounded-lg bg-blue-50">
                      <BookOpen className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                      !hasScore
                        ? 'bg-gray-100 text-gray-700'
                        : performance! >= 80
                        ? 'bg-emerald-100 text-emerald-800'
                        : performance! >= 60
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {performanceLevel}
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-gray-900 mb-4 line-clamp-2">
                    {module.moduleTitle || module.moduleId}
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 font-medium">Avg Score</span>
                      <span className="font-bold text-gray-900">
                        {formatMetricOrUnavailable(performance, { decimals: 1, suffix: '%' })}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 font-medium">Pass Rate</span>
                      <span className="font-bold text-emerald-600">
                        {formatMetricOrUnavailable(module.passRate, { decimals: 1, suffix: '%' })}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 font-medium">Total Quizzes</span>
                      <span className="font-bold text-blue-600">{module.totalQuizzes ?? 'Unavailable'}</span>
                    </div>
                    <div className="pt-3 border-t border-gray-200">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className={`h-2.5 rounded-full transition-all ${
                            !hasScore
                              ? 'bg-gray-300'
                              : performance! >= 80
                              ? 'bg-emerald-500'
                              : performance! >= 60
                              ? 'bg-amber-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${hasScore ? Math.min(100, performance!) : 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

// Export with AdminRoute wrapper
export default function AnalyticsPage() {
  return (
    <AdminRoute>
      <AnalyticsPageContent />
    </AdminRoute>
  );
}
