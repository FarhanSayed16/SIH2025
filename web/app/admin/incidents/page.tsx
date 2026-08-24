/**
 * Phase 4.10: Incident Management Dashboard - ENHANCED & FIXED
 * View and manage incident history (alert logs) with historical incidents support
 * Enhanced with modern UI matching dashboard/analytics color scheme
 * Smart India Hackathon - SafeSchool Disaster Management System
 */

'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';
import { AdminRoute } from '@/components/auth/AdminRoute';
import { incidentsApi, Incident, IncidentStats, IncidentQueryParams } from '@/lib/api/incidents';
import { apiClient } from '@/lib/api/client';
import { getInstitutionId } from '@/lib/utils/institution';
import { Card } from '@/components/ui/card';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { TableSkeleton } from '@/components/ui/loading-skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/components/ui/toast';
import { HistoricalIncidentForm } from '@/components/incidents/HistoricalIncidentForm';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedCounter } from '@/components/dashboard/AnimatedCounter';
import {
  AlertTriangle,
  History,
  FileText,
  Filter,
  Calendar,
  BarChart3,
  Download,
  PlusCircle,
  Shield,
  Users,
  Clock,
  MapPin,
  Activity,
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Eye,
  Zap,
  Camera,
  Loader2,
  Copy,
  Send,
  MessageSquare,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { aiApi, type DamageScanResult } from '@/lib/api/ai';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';

type Pagination = {
  page: number;
  limit: number;
  total: number;
  pages: number;
};

// Helper: safely extract incidents + pagination from API response
function extractIncidentsAndPagination(
  raw: any,
  { fallbackPage = 1, fallbackLimit = 50 }: { fallbackPage?: number; fallbackLimit?: number }
): { incidents: Incident[]; pagination: Pagination } {
  let incidents: Incident[] = [];
  
  // Handle different response formats
  if (Array.isArray(raw)) {
    incidents = raw;
  } else if (raw && typeof raw === 'object') {
    // Check for nested data structure
    if (Array.isArray(raw.incidents)) {
      incidents = raw.incidents;
    } else if (raw.data) {
      if (Array.isArray(raw.data.incidents)) {
        incidents = raw.data.incidents;
      } else if (Array.isArray(raw.data)) {
        incidents = raw.data;
      }
    }
  }

  // Extract pagination
  const rawPagination = raw?.pagination || raw?.data?.pagination || {};
  const limit = typeof rawPagination.limit === 'number' && rawPagination.limit > 0
    ? rawPagination.limit
    : fallbackLimit;
  const total = typeof rawPagination.total === 'number' && rawPagination.total >= 0
    ? rawPagination.total
    : incidents.length;
  const page = typeof rawPagination.page === 'number' && rawPagination.page > 0
    ? rawPagination.page
    : fallbackPage;
  const pages = typeof rawPagination.pages === 'number' && rawPagination.pages > 0
    ? rawPagination.pages
    : limit > 0
    ? Math.max(1, Math.ceil(total / limit))
    : 1;

  return {
    incidents: Array.isArray(incidents) ? incidents : [],
    pagination: { page, limit, total, pages },
  };
}

// Main Incidents Page Content Component
function IncidentsPageContent() {
  const router = useRouter();
  const { user, isAuthenticated, accessToken } = useAuthStore();
  const { showToast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [stats, setStats] = useState<IncidentStats | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0,
  });
  const [showHistoricalForm, setShowHistoricalForm] = useState(false);
  const [includeHistorical, setIncludeHistorical] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters
  const [filters, setFilters] = useState<IncidentQueryParams>({
    page: 1,
    limit: 50,
  });

  // Date range filters
  const [dateRange, setDateRange] = useState({
    start: '',
    end: '',
  });

  // A3: Scan damage (AI)
  const [damageScan, setDamageScan] = useState<DamageScanResult | null>(null);
  const [damageScanLoading, setDamageScanLoading] = useState(false);
  const [damageScanError, setDamageScanError] = useState<string | null>(null);

  // O7: Draft parent message modal (from list)
  const [parentMessageIncident, setParentMessageIncident] = useState<Incident | null>(null);
  const [parentMessageText, setParentMessageText] = useState<string | null>(null);
  const [parentMessageLoading, setParentMessageLoading] = useState(false);

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1]! : dataUrl;
        resolve(base64);
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

  const handleScanDamage = async (file: File) => {
    setDamageScanError(null);
    setDamageScan(null);
    setDamageScanLoading(true);
    try {
      const base64 = await fileToBase64(file);
      const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      const result = await aiApi.scanDamage(base64, mimeType);
      setDamageScan(result);
      showToast('Damage scan completed', 'success', 3000);
    } catch (e) {
      const msg = (e as Error).message || 'Scan failed';
      setDamageScanError(msg);
      showToast(msg, 'error', 4000);
    } finally {
      setDamageScanLoading(false);
    }
  };

  // Fixed loadIncidents function with proper data handling
  const loadIncidents = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const fallbackLimit = filters.limit || 50;
    const fallbackPage = filters.page || 1;

    try {
      const schoolId = getInstitutionId(user.institutionId);
      const isSuperAdmin = user.role === 'system_admin' || user.role === 'SYSTEM_ADMIN';
      
      if (!schoolId && !isSuperAdmin) {
        console.warn('No institution ID available');
        setIncidents([]);
        setIsLoading(false);
        return;
      }

      // Load regular incidents
      const regularResponse = await incidentsApi.list({
        ...filters,
        institutionId: schoolId,
        includeHistorical: false, // Regular incidents only
      });

      let allIncidents: Incident[] = [];
      let totalCount = 0;

      // Extract regular incidents
      if (regularResponse?.success && regularResponse.data) {
        const extracted = extractIncidentsAndPagination(regularResponse.data, {
          fallbackPage,
          fallbackLimit,
        });
        allIncidents = [...extracted.incidents];
        totalCount = extracted.pagination.total;
      }

      // Load historical incidents if requested
      if (includeHistorical) {
        try {
          const historicalResponse = await incidentsApi.getHistorical({
            institutionId: schoolId,
            startDate: filters.startDate,
            endDate: filters.endDate,
            page: filters.page,
            limit: filters.limit,
          });

          if (historicalResponse?.success && historicalResponse.data) {
            const historicalExtracted = extractIncidentsAndPagination(historicalResponse.data, {
              fallbackPage,
              fallbackLimit,
            });
            allIncidents = [...allIncidents, ...historicalExtracted.incidents];
            totalCount += historicalExtracted.pagination.total;
          }
        } catch (histError) {
          console.warn('Error loading historical incidents:', histError);
          // Continue with regular incidents even if historical fails
        }
      }

      // Apply client-side filters
      let filteredIncidents = allIncidents;
      if (filters.type) {
        filteredIncidents = filteredIncidents.filter(i => i.type === filters.type);
      }
      if (filters.severity) {
        filteredIncidents = filteredIncidents.filter(i => i.severity === filters.severity);
      }
      if (filters.status) {
        filteredIncidents = filteredIncidents.filter(i => i.status === filters.status);
      }
      if (filters.source) {
        filteredIncidents = filteredIncidents.filter(i => i.source === filters.source);
      }

      setIncidents(filteredIncidents);
      setPagination({
        page: fallbackPage,
        limit: fallbackLimit,
        total: filteredIncidents.length > 0 ? filteredIncidents.length : totalCount,
        pages: Math.ceil((filteredIncidents.length > 0 ? filteredIncidents.length : totalCount) / fallbackLimit),
      });
    } catch (error: any) {
      console.error('Error loading incidents:', error);
      showToast(error?.message || 'Failed to load incidents', 'error');
      setIncidents([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user, filters, includeHistorical, showToast]);

  const loadStats = useCallback(async () => {
    if (!isAuthenticated || !user) {
      console.warn('User not authenticated for stats');
      // Set default stats
      setStats({
        total: 0,
        active: 0,
        resolved: 0,
        historical: 0,
        bySource: {},
        byStatus: {},
        bySeverity: {},
        byType: {}
      });
      return;
    }

    try {
      const schoolId = getInstitutionId(user.institutionId);
      const isSuperAdmin = user.role === 'system_admin' || user.role === 'SYSTEM_ADMIN';
      if (!schoolId && !isSuperAdmin) {
        console.warn('No institution ID for stats');
        // Set default stats
        setStats({
          total: 0,
          active: 0,
          resolved: 0,
          historical: 0,
          bySource: {},
          byStatus: {},
          bySeverity: {},
          byType: {}
        });
        return;
      }

      console.log('Loading stats for institution:', schoolId); // Debug log

      const response = await incidentsApi.getStats({
        institutionId: schoolId,
        startDate: filters.startDate,
        endDate: filters.endDate,
      });

      console.log('Stats API Response:', response); // Debug log

      if (response.success && response.data) {
        console.log('Setting stats:', response.data); // Debug log
        setStats(response.data);
      } else {
        console.warn('Failed to load stats:', response?.message || response?.error);
        // Set default stats instead of null
        setStats({
          total: 0,
          active: 0,
          resolved: 0,
          historical: 0,
          bySource: {},
          byStatus: {},
          bySeverity: {},
          byType: {}
        });
      }
    } catch (error: any) {
      console.error('Error loading stats:', error);
      // Set default stats on error
      setStats({
        total: 0,
        active: 0,
        resolved: 0,
        historical: 0,
        bySource: {},
        byStatus: {},
        bySeverity: {},
        byType: {}
      });
    }
  }, [isAuthenticated, user, filters.startDate, filters.endDate]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    // Wait for user to be available
    if (!user) {
      return;
    }

    if (accessToken) {
      apiClient.setToken(accessToken);
    }

    loadIncidents();
    loadStats();
  }, [isAuthenticated, accessToken, user, loadIncidents, loadStats]);

  const handleFilterChange = (key: keyof IncidentQueryParams, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page on filter change
    }));
  };

  const handleDateRangeChange = (key: 'start' | 'end', value: string) => {
    setDateRange(prev => ({ ...prev, [key]: value }));
    setFilters(prev => ({
      ...prev,
      [key === 'start' ? 'startDate' : 'endDate']: value || undefined,
      page: 1,
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const handleExportPDF = async () => {
    try {
      const schoolId = getInstitutionId(user?.institutionId);
      const isSuperAdmin = user?.role === 'system_admin' || user?.role === 'SYSTEM_ADMIN';
      if (!schoolId && !isSuperAdmin) {
        showToast('No institution ID available', 'error');
        return;
      }

      const blob = await incidentsApi.exportPDF({
        institutionId: schoolId,
        ...filters,
      });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `incidents-report-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showToast('Report exported successfully', 'success');
    } catch (error: any) {
      console.error('Export error:', error);
      showToast(error?.message || 'Failed to export report', 'error');
    }
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([loadIncidents(), loadStats()]);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'bg-red-600 text-white';
      case 'high': return 'bg-orange-600 text-white';
      case 'medium': return 'bg-yellow-600 text-white';
      case 'low': return 'bg-blue-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-red-100 text-red-800 border-red-300';
      case 'resolved': return 'bg-green-100 text-green-800 border-green-300';
      case 'false_alarm': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'cancelled': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      fire: '🔥',
      earthquake: '🌋',
      flood: '🌊',
      cyclone: '🌀',
      stampede: '🏃',
      medical: '🏥',
      other: '📝',
    };
    return icons[type] || '📝';
  };

  // Prepare chart data
  const severityChartData = useMemo(() => {
    if (!stats?.bySeverity) return [];
    return Object.entries(stats.bySeverity)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
        color: name === 'critical' ? '#dc2626' : name === 'high' ? '#f97316' : name === 'medium' ? '#eab308' : '#3b82f6',
      }));
  }, [stats]);

  const typeChartData = useMemo(() => {
    if (!stats?.byType) return [];
    return Object.entries(stats.byType)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
      }));
  }, [stats]);

  const sourceChartData = useMemo(() => {
    if (!stats?.bySource) return [];
    return Object.entries(stats.bySource)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
      }));
  }, [stats]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Enhanced Header - Matching Dashboard Style */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/20">
                      <AlertTriangle className="h-6 w-6" />
                    </div>
                    <div>
                      <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                        Incident Management <span className="text-blue-600">Dashboard</span>
                      </h1>
                      <p className="text-gray-600 mt-1 text-base flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Monitor, analyze, and learn from safety incidents at your school
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={handleManualRefresh}
                    disabled={isRefreshing}
                    variant="outline"
                    className="border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  <Button
                    onClick={() => setShowHistoricalForm(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/30"
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Historical
                  </Button>
                  <Button 
                    onClick={handleExportPDF} 
                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/30"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Report
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* Enhanced Statistics Cards - Matching Dashboard Colors */}
            {stats && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card className="bg-white/80 backdrop-blur-lg border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer group hover:scale-105">
                    <div className="flex items-start justify-between p-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <motion.div 
                            className="p-3 rounded-xl bg-blue-100/80 shadow-sm"
                            whileHover={{ scale: 1.1, rotate: 5 }}
                          >
                            <Activity className="h-6 w-6 text-blue-600" />
                          </motion.div>
                          <div className="text-sm text-blue-700 font-semibold uppercase tracking-wide">Total Incidents</div>
                        </div>
                        <div className="text-4xl font-bold text-blue-900 mb-2">
                          <AnimatedCounter value={stats.total || 0} />
                        </div>
                        <div className="flex items-center gap-2 text-xs text-blue-700 font-medium">
                          <div className="h-2 w-2 rounded-full bg-blue-600"></div>
                          <span>Tracked for safety analysis</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Card className="bg-white/80 backdrop-blur-lg border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer group hover:scale-105">
                    <div className="flex items-start justify-between p-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <motion.div 
                            className="p-3 rounded-xl bg-red-100/80 shadow-sm"
                            whileHover={{ scale: 1.1, rotate: 5 }}
                          >
                            <AlertTriangle className="h-6 w-6 text-red-600 animate-pulse" />
                          </motion.div>
                          <div className="text-sm text-red-700 font-semibold uppercase tracking-wide">Active Alerts</div>
                        </div>
                        <div className="text-4xl font-bold text-red-900 mb-2">
                          <AnimatedCounter value={stats.active || 0} />
                        </div>
                        <div className={`flex items-center gap-2 text-xs font-semibold ${(stats.active || 0) > 0 ? 'text-red-700' : 'text-green-700'}`}>
                          {(stats.active || 0) > 0 ? (
                            <>
                              <AlertTriangle className="h-3 w-3 animate-pulse" />
                              <span>Immediate attention needed</span>
                            </>
                          ) : (
                            <>
                              <div className="h-2 w-2 rounded-full bg-green-500"></div>
                              <span>All clear</span>
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
                  transition={{ delay: 0.3 }}
                >
                  <Card className="bg-white/80 backdrop-blur-lg border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer group hover:scale-105">
                    <div className="flex items-start justify-between p-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <motion.div 
                            className="p-3 rounded-xl bg-emerald-100/80 shadow-sm"
                            whileHover={{ scale: 1.1, rotate: 5 }}
                          >
                            <CheckCircle className="h-6 w-6 text-emerald-600" />
                          </motion.div>
                          <div className="text-sm text-emerald-700 font-semibold uppercase tracking-wide">Resolved Cases</div>
                        </div>
                        <div className="text-4xl font-bold text-emerald-900 mb-2">
                          <AnimatedCounter value={stats.resolved || 0} />
                        </div>
                        <div className="flex items-center gap-2 text-xs text-emerald-700 font-medium">
                          <div className="h-2 w-2 rounded-full bg-emerald-600"></div>
                          <span>Successfully handled</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Card className="bg-white/80 backdrop-blur-lg border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer group hover:scale-105">
                    <div className="flex items-start justify-between p-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <motion.div 
                            className="p-3 rounded-xl bg-purple-100/80 shadow-sm"
                            whileHover={{ scale: 1.1, rotate: 5 }}
                          >
                            <History className="h-6 w-6 text-purple-600" />
                          </motion.div>
                          <div className="text-sm text-purple-700 font-semibold uppercase tracking-wide">Historical Data</div>
                        </div>
                        <div className="text-4xl font-bold text-purple-900 mb-2">
                          <AnimatedCounter value={stats.historical || 0} />
                        </div>
                        <div className="flex items-center gap-2 text-xs text-purple-700 font-medium">
                          <div className="h-2 w-2 rounded-full bg-purple-600"></div>
                          <span>Archived for learning</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              </div>
            )}

            {/* Charts Section - Matching Dashboard Style */}
            {stats && (severityChartData.length > 0 || typeChartData.length > 0) && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {severityChartData.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <Card className="bg-white/80 backdrop-blur-lg border border-white/20 shadow-xl p-6">
                      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-blue-600" />
                        Severity Distribution
                      </h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            data={severityChartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={70}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {severityChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: 'rgba(255, 255, 255, 0.95)',
                              border: '1px solid rgba(0, 0, 0, 0.1)',
                              borderRadius: '8px',
                              backdropFilter: 'blur(10px)'
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </Card>
                  </motion.div>
                )}

                {typeChartData.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                    className="lg:col-span-2"
                  >
                    <Card className="bg-white/80 backdrop-blur-lg border border-white/20 shadow-xl p-6">
                      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-indigo-600" />
                        Incidents by Type
                      </h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={typeChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                          <XAxis 
                            dataKey="name" 
                            stroke="#6b7280"
                            fontSize={12}
                            tickLine={false}
                          />
                          <YAxis 
                            stroke="#6b7280"
                            fontSize={12}
                            tickLine={false}
                          />
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: 'rgba(255, 255, 255, 0.95)',
                              border: '1px solid rgba(0, 0, 0, 0.1)',
                              borderRadius: '8px',
                              backdropFilter: 'blur(10px)'
                            }}
                          />
                          <Bar dataKey="value" fill="#6366f1" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </Card>
                  </motion.div>
                )}
              </div>
            )}

            {/* Enhanced Filters Card - Matching Dashboard Style */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <Card className="bg-white/80 backdrop-blur-lg border border-white/20 shadow-xl p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-2 rounded-lg bg-blue-100">
                    <Filter className="h-5 w-5 text-blue-600" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">Filter Incidents</h2>
                </div>
                
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Incident Type
                      </label>
                      <select
                        value={filters.type ?? ''}
                        onChange={e => handleFilterChange('type', e.target.value || undefined)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
                      >
                        <option value="">All Types</option>
                        <option value="fire">🔥 Fire</option>
                        <option value="earthquake">🌋 Earthquake</option>
                        <option value="flood">🌊 Flood</option>
                        <option value="cyclone">🌀 Cyclone</option>
                        <option value="stampede">🏃 Stampede</option>
                        <option value="medical">🏥 Medical</option>
                        <option value="other">📝 Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Severity Level
                      </label>
                      <select
                        value={filters.severity ?? ''}
                        onChange={e => handleFilterChange('severity', e.target.value || undefined)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
                      >
                        <option value="">All Severities</option>
                        <option value="low">🟢 Low</option>
                        <option value="medium">🟡 Medium</option>
                        <option value="high">🟠 High</option>
                        <option value="critical">🔴 Critical</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Source
                      </label>
                      <select
                        value={filters.source ?? ''}
                        onChange={e => handleFilterChange('source', e.target.value || undefined)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
                      >
                        <option value="">All Sources</option>
                        <option value="iot">📡 IoT Sensors</option>
                        <option value="admin">👨‍💼 Admin</option>
                        <option value="teacher">👩‍🏫 Teacher</option>
                        <option value="ai">🤖 AI System</option>
                        <option value="ndma">🏛 NDMA/IMD</option>
                        <option value="system">⚙ System</option>
                        <option value="historical">📜 Historical</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status
                      </label>
                      <select
                        value={filters.status ?? ''}
                        onChange={e => handleFilterChange('status', e.target.value || undefined)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
                      >
                        <option value="">All Statuses</option>
                        <option value="active">🚨 Active</option>
                        <option value="resolved">✅ Resolved</option>
                        <option value="false_alarm">⚠ False Alarm</option>
                        <option value="cancelled">❌ Cancelled</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Calendar className="inline h-4 w-4 mr-1" />
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={dateRange.start}
                        onChange={e => handleDateRangeChange('start', e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Calendar className="inline h-4 w-4 mr-1" />
                        End Date
                      </label>
                      <input
                        type="date"
                        value={dateRange.end}
                        onChange={e => handleDateRangeChange('end', e.target.value)}
                        min={dateRange.start || undefined}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
                      />
                    </div>
                    <div className="flex items-end">
                      <label className="flex items-center gap-2 cursor-pointer p-3 border border-gray-300 rounded-lg bg-white w-full shadow-sm hover:border-blue-300 transition-colors">
                        <input
                          type="checkbox"
                          checked={includeHistorical}
                          onChange={e => {
                            setIncludeHistorical(e.target.checked);
                            handleFilterChange('includeHistorical', e.target.checked);
                          }}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <div>
                          <span className="text-sm font-medium text-gray-700">Include Historical</span>
                          <span className="block text-xs text-gray-500">Show past incidents</span>
                        </div>
                      </label>
                    </div>
                    <div className="flex items-end gap-2">
                      <Button
                        onClick={() => {
                          setFilters({ page: 1, limit: 50 });
                          setDateRange({ start: '', end: '' });
                          setIncludeHistorical(false);
                        }}
                        variant="outline"
                        className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        Clear Filters
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Scan damage (AI) - A3 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.75 }}
            >
              <Card className="bg-white/80 backdrop-blur-lg border border-amber-200 shadow-xl p-6 rounded-xl overflow-hidden">
                <div className="flex items-start gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-amber-50">
                    <Camera className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Scan damage (AI)</h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Upload a photo from an incident or post-drill to check for visible damage or concerns.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-end gap-3 mt-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1">Image (PNG/JPG)</label>
                    <Input
                      type="file"
                      accept=".png,.jpg,.jpeg"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleScanDamage(f);
                      }}
                      disabled={damageScanLoading}
                      className="max-w-xs"
                    />
                  </div>
                  {damageScanLoading && (
                    <div className="flex items-center gap-2 text-amber-600">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span className="text-sm">Analyzing damage…</span>
                    </div>
                  )}
                </div>
                {damageScanError && (
                  <div className="mt-4 p-4 rounded-xl bg-red-50 border border-red-100 flex gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{damageScanError}</p>
                  </div>
                )}
                {damageScan && (
                  <div
                    className={`mt-4 rounded-xl border overflow-hidden ${damageScan.damageDetected ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}
                  >
                    <div className="p-4 flex flex-wrap items-center gap-3">
                      <span
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold ${damageScan.damageDetected ? 'bg-amber-200 text-amber-900' : 'bg-emerald-200 text-emerald-900'}`}
                      >
                        {damageScan.damageDetected ? '⚠ Damage detected' : '✓ No damage detected'}
                      </span>
                      {damageScan.severity && (
                        <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-white/80 text-gray-700 border border-amber-200/50">
                          {damageScan.severity} severity
                        </span>
                      )}
                      <span className="text-sm text-gray-600">
                        {damageScan.damageDetected ? 'Review description and follow-up below' : 'Area appears safe'}
                      </span>
                    </div>
                    <div className="px-4 pb-4 pt-0 space-y-3">
                      {damageScan.description && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Description</p>
                          <p className="text-sm text-gray-700">{damageScan.description}</p>
                        </div>
                      )}
                      {damageScan.followUp && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Follow-up</p>
                          <p className="text-sm text-gray-600">{damageScan.followUp}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            </motion.div>

            {/* Enhanced Incidents List - Matching Dashboard Style */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <Card className="bg-white/80 backdrop-blur-lg border border-white/20 shadow-xl">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      Incidents ({pagination.total})
                    </h2>
                    <div className="text-sm text-gray-600">
                      Page {pagination.page} of {pagination.pages || 1}
                    </div>
                  </div>

                  {isLoading ? (
                    <TableSkeleton />
                  ) : incidents.length === 0 ? (
                    <EmptyState
                      icon={<AlertTriangle className="w-12 h-12" />}
                      title="No incidents found"
                      description="No incidents match your current filters. Try adjusting your search criteria."
                    />
                  ) : (
                    <div className="space-y-3">
                      <AnimatePresence>
                        {incidents.map((incident, index) => (
                          <motion.div
                            key={incident._id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ delay: index * 0.05 }}
                            className="border-l-4 border-blue-500 pl-4 py-4 bg-gradient-to-r from-blue-50/50 to-white rounded-r-lg hover:shadow-md transition-all cursor-pointer hover:scale-[1.01]"
                            onClick={() => router.push(`/admin/incidents/${incident._id}`)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <span className="text-2xl">{getTypeIcon(incident.type)}</span>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-gray-900 text-lg">
                                        {incident.title || `${incident.type.toUpperCase()} Incident`}
                                      </span>
                                      {incident.isHistorical && (
                                        <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-semibold rounded-full border border-purple-300">
                                          Historical
                                        </span>
                                      )}
                                    </div>
                                    {incident.description && (
                                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                        {incident.description}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-3 mt-3 flex-wrap">
                                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getSeverityColor(incident.severity)}`}>
                                    {incident.severity.toUpperCase()}
                                  </span>
                                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(incident.status)}`}>
                                    {incident.status.replace('_', ' ').toUpperCase()}
                                  </span>
                                  <div className="flex items-center gap-1 text-xs text-gray-500">
                                    <Clock className="h-3 w-3" />
                                    {new Date(incident.createdAt).toLocaleString()}
                                  </div>
                                  {incident.location && (
                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                                      <MapPin className="h-3 w-3" />
                                      Location Available
                                    </div>
                                  )}
                                  {incident.source && (
                                    <div className="text-xs text-gray-500">
                                      Source: {incident.source}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="ml-4 flex gap-2">
                                <Button
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    setParentMessageIncident(incident);
                                    setParentMessageText(null);
                                    setParentMessageLoading(true);
                                    try {
                                      const result = await aiApi.draftCrisisParentMessage({
                                        incidentType: incident.type,
                                        severity: incident.severity,
                                        oneLineDescription: (incident.description || incident.title || '').toString().slice(0, 200) || 'Incident at school',
                                      });
                                      setParentMessageText((result as any)?.message ?? '');
                                    } catch (err: any) {
                                      showToast(err?.message || 'Failed to draft message', 'error');
                                      setParentMessageIncident(null);
                                    } finally {
                                      setParentMessageLoading(false);
                                    }
                                  }}
                                  variant="outline"
                                  className="border-amber-300 text-amber-700 hover:bg-amber-50"
                                >
                                  <MessageSquare className="h-4 w-4 mr-2" />
                                  Draft message
                                </Button>
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(`/admin/incidents/${incident._id}`);
                                  }}
                                  className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View
                                </Button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Pagination */}
                  {pagination.pages > 1 && (
                    <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
                      <div className="text-sm text-gray-600">
                        Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} incidents
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handlePageChange(pagination.page - 1)}
                          disabled={pagination.page === 1}
                          variant="outline"
                          className="border-gray-300"
                        >
                          Previous
                        </Button>
                        <Button
                          onClick={() => handlePageChange(pagination.page + 1)}
                          disabled={pagination.page >= pagination.pages}
                          variant="outline"
                          className="border-gray-300"
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          </div>
        </main>
      </div>

      {/* Historical Incident Form Modal */}
      {showHistoricalForm && (
        <HistoricalIncidentForm
          onClose={() => {
            setShowHistoricalForm(false);
            loadIncidents();
            loadStats();
          }}
        />
      )}

      {/* O7: Draft parent message modal (from list) */}
      {parentMessageIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setParentMessageIncident(null)}>
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Draft message to parents</h3>
            <p className="text-xs text-gray-500 mb-3">{parentMessageIncident.type} · {parentMessageIncident.severity}</p>
            {parentMessageLoading ? (
              <p className="text-gray-600">Generating calm, factual message…</p>
            ) : parentMessageText ? (
              <>
                <p className="text-gray-700 text-sm whitespace-pre-wrap border border-gray-200 rounded-lg p-3 bg-gray-50 mb-4">{parentMessageText}</p>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => { navigator.clipboard.writeText(parentMessageText); showToast('Copied to clipboard', 'success'); }}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                  <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" onClick={() => { router.push(`/broadcast?message=${encodeURIComponent(parentMessageText)}`); setParentMessageIncident(null); }}>
                    <Send className="h-4 w-4 mr-2" />
                    Send via broadcast
                  </Button>
                </div>
              </>
            ) : null}
            <div className="mt-4">
              <Button variant="outline" onClick={() => setParentMessageIncident(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Main Export
export default function IncidentsPage() {
  return (
    <AdminRoute>
      <IncidentsPageContent />
    </AdminRoute>
  );
}
