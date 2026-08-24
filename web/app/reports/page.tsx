/**
 * Reports Page - Complete Implementation with File Downloads
 * Comprehensive report generation and management
 */

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';
import { AdminRoute } from '@/components/auth/AdminRoute';
import { analyticsApi } from '@/lib/api/analytics';
import { apiClient } from '@/lib/api/client';
import { getInstitutionId } from '@/lib/utils/institution';
import { aiApi, ReportCardResult } from '@/lib/api/ai';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { useToast } from '@/components/ui/toast';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { motion } from 'framer-motion';
import {
  FileText,
  Download,
  Calendar,
  Filter,
  RefreshCw,
  FileSpreadsheet,
  File,
  TrendingUp,
  Shield,
  Clock,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Award,
  Target,
  Lightbulb
} from 'lucide-react';

type ReportType = 'drills' | 'students' | 'institution' | 'modules' | 'games' | 'quizzes';
type ReportFormat = 'pdf' | 'excel' | 'csv';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: ReportType;
  icon: string;
  defaultFilters?: any;
}

interface GeneratedReport {
  id: string;
  name: string;
  format: ReportFormat;
  generatedAt: string;
  filename: string;
  fileUrl: string;
  size?: number;
}

const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: 'drill-performance',
    name: 'Drill Performance Report',
    description: 'Comprehensive drill performance metrics and analytics',
    type: 'drills',
    icon: '🔥',
  },
  {
    id: 'student-progress',
    name: 'Student Progress Report',
    description: 'Individual and class-level student progress tracking',
    type: 'students',
    icon: '👥',
  },
  {
    id: 'institution-summary',
    name: 'Institution Summary Report',
    description: 'Overall institution statistics and performance',
    type: 'institution',
    icon: '🏫',
  },
  {
    id: 'module-completion',
    name: 'Module Completion Report',
    description: 'Module completion rates and engagement metrics',
    type: 'modules',
    icon: '📚',
  },
  {
    id: 'game-performance',
    name: 'Game Performance Report',
    description: 'Gamification analytics and player statistics',
    type: 'games',
    icon: '🎮',
  },
  {
    id: 'quiz-accuracy',
    name: 'Quiz Accuracy Report',
    description: 'Quiz performance and accuracy trends',
    type: 'quizzes',
    icon: '✅',
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5 }
  })
};

// Helper function to format file size
function formatFileSize(bytes?: number): string {
  if (!bytes) return 'Unknown size';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Main Reports Page Component
function ReportsPageContent() {
  const router = useRouter();
  const { user, isAuthenticated, accessToken } = useAuthStore();
  const { showToast } = useToast();
  
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingReport, setGeneratingReport] = useState<{ template: string; format: ReportFormat } | null>(null);
  const [recentReports, setRecentReports] = useState<GeneratedReport[]>([]);
  const [customFilters, setCustomFilters] = useState<any>({});
  const [reportCard, setReportCard] = useState<ReportCardResult | null>(null);
  const [reportCardLoading, setReportCardLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (accessToken) {
      apiClient.setToken(accessToken);
    }

    // Load recent reports from localStorage
    const stored = localStorage.getItem('recentReports');
    if (stored) {
      try {
        setRecentReports(JSON.parse(stored));
      } catch (e) {
        console.error('Error loading recent reports:', e);
      }
    }
  }, [isAuthenticated, router, accessToken]);

  // Download file helper - Enhanced with proper file format handling
  // Uses backend filename for download, but renames to include Edusafe branding
  const downloadFile = useCallback(async (backendFilename: string, format: ReportFormat, displayName?: string) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      // Ensure proper URL format
      const baseUrl = API_URL.replace(/\/api$/, '');
      // Use the exact backend filename for download
      const downloadUrl = `${baseUrl}/api/analytics/reports/${encodeURIComponent(backendFilename)}`;
      
      console.log('Downloading file from:', downloadUrl);
      console.log('Backend filename:', backendFilename);
      
      // Fetch the file as blob with proper headers
      const response = await fetch(downloadUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': format === 'pdf' ? 'application/pdf' : 
                   format === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' :
                   'text/csv',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Download failed:', response.status, errorText);
        throw new Error(`Failed to download file: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();
      
      // Determine proper file extension and MIME type
      // Backend now generates files with Edusafe prefix, so use filename as-is
      let finalFilename = backendFilename;
      let mimeType = 'application/octet-stream';
      
      // Extract extension from backend filename
      const ext = backendFilename.includes('.') 
        ? backendFilename.split('.').pop() 
        : (format === 'excel' ? 'xlsx' : format === 'pdf' ? 'pdf' : 'csv');
      
      // Ensure filename has proper extension
      if (!backendFilename.includes('.')) {
        finalFilename = `${backendFilename}.${ext}`;
      } else {
        finalFilename = backendFilename; // Use as-is since backend now includes Edusafe
      }
      
      // Set proper MIME type
      if (format === 'pdf') {
        mimeType = 'application/pdf';
      } else if (format === 'excel') {
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      } else if (format === 'csv') {
        mimeType = 'text/csv';
      }
      
      // Create blob with proper MIME type
      const typedBlob = new Blob([blob], { type: mimeType });
      
      const url = window.URL.createObjectURL(typedBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = finalFilename; // Use Edusafe-branded name for download
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      console.log('File downloaded successfully as:', finalFilename);
      return true;
    } catch (error: any) {
      console.error('Download error:', error);
      showToast(`Failed to download file: ${error.message}`, 'error');
      return false;
    }
  }, [accessToken, showToast]);

  const handleGenerateReport = async (template: ReportTemplate, format: ReportFormat) => {
    if (!template || !user) return;

    setIsGenerating(true);
    setGeneratingReport({ template: template.name, format });

    try {
      const institutionId = getInstitutionId(user.institutionId);
      
      console.log('Generating report:', {
        format,
        reportType: template.type,
        institutionId,
        startDate: dateRange.start,
        endDate: dateRange.end,
        filters: customFilters
      });

      const response = await analyticsApi.generateReport(
        format,
        template.type,
        institutionId || undefined,
        dateRange.start || undefined,
        dateRange.end || undefined,
        customFilters
      );

      console.log('Report generation response:', response);

      // Handle response structure
      const reportData = (response as any)?.data || response;
      const backendFilename = reportData?.filename;
      const fileUrl = reportData?.fileUrl;

      if (backendFilename || fileUrl) {
        // Use the exact filename from backend for downloading
        const actualBackendFilename = backendFilename || fileUrl?.split('/').pop() || `Edusafe_report_${template.type}_${Date.now()}.${format === 'excel' ? 'xlsx' : format}`;
        
        console.log('Backend filename received:', actualBackendFilename);
        console.log('Full response data:', reportData);
        
        // Download the file using backend filename
        // downloadFile will use backend filename for request but rename to Edusafe for download
        const downloaded = await downloadFile(actualBackendFilename, format, template.name);
        
        if (downloaded) {
          // Use the backend filename (which now includes Edusafe) for storage
          const displayFilename = actualBackendFilename;
          
          // Add to recent reports
          const newReport: GeneratedReport = {
            id: Date.now().toString(),
            name: template.name,
            format,
            generatedAt: new Date().toISOString(),
            filename: displayFilename,
            fileUrl: fileUrl || `/analytics/reports/${actualBackendFilename}`,
            size: reportData?.size,
          };

          const updatedReports = [newReport, ...recentReports.slice(0, 9)];
          setRecentReports(updatedReports);
          localStorage.setItem('recentReports', JSON.stringify(updatedReports));

          showToast(`✅ ${template.name} (${format.toUpperCase()}) downloaded successfully!`, 'success');
        }
      } else {
        console.error('No filename or fileUrl in response:', reportData);
        showToast('⚠️ Report generated but download URL not found', 'warning');
      }
    } catch (error: any) {
      console.error('Error generating report:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to generate report';
      showToast(`Error: ${errorMessage}`, 'error');
    } finally {
      setIsGenerating(false);
      setGeneratingReport(null);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Page Header */}
            <motion.div 
              className="mb-8"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center gap-3 mb-3">
                <motion.div 
                  className="p-3 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/20"
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <FileText className="h-6 w-6" />
                </motion.div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                    Reports <span className="text-blue-600">Center</span>
                  </h1>
                  <p className="text-gray-600 mt-1 text-base">
                    Generate comprehensive analytics and performance reports for <span className="font-semibold text-blue-600">Edusafe</span>
                  </p>
                </div>
              </div>
            </motion.div>

            {/* O5: AI Safety Report Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
            >
              <Card className="p-6 bg-gradient-to-br from-amber-50/80 to-orange-50/40 border-2 border-amber-200 shadow-lg mb-6 rounded-xl">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-amber-100 border border-amber-300">
                      <Sparkles className="h-6 w-6 text-amber-700" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">AI Safety Report Card</h3>
                      <p className="text-sm text-gray-600 mt-0.5">Grade, strengths, improvements & one bold next step (last 30 days)</p>
                    </div>
                  </div>
                  <Button
                    onClick={async () => {
                      setReportCardLoading(true);
                      setReportCard(null);
                      try {
                        const result = await aiApi.reportCard();
                        setReportCard(result);
                        showToast('Report card generated.', 'success');
                      } catch (e: any) {
                        showToast(e?.message || 'Failed to generate report card', 'error');
                      } finally {
                        setReportCardLoading(false);
                      }
                    }}
                    disabled={reportCardLoading}
                    className="bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    {reportCardLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Generating…
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate AI report card
                      </>
                    )}
                  </Button>
                </div>
                {reportCard && (
                  <div className="mt-6 pt-6 border-t border-amber-200 space-y-4">
                    <div className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-amber-700" />
                      <span className="text-sm font-semibold text-amber-900">Overall grade</span>
                      <span className="text-2xl font-bold text-amber-700">{reportCard.grade}</span>
                    </div>
                    {reportCard.strengths?.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" /> Strengths
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
                          {reportCard.strengths.map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {reportCard.improvements?.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                          <Target className="h-4 w-4 text-blue-600" /> Areas to improve
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
                          {reportCard.improvements.map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {reportCard.boldNextStep && (
                      <div className="p-3 rounded-lg bg-amber-100/80 border border-amber-300">
                        <p className="text-sm font-semibold text-amber-900 mb-1 flex items-center gap-2">
                          <Lightbulb className="h-4 w-4" /> One bold next step
                        </p>
                        <p className="text-gray-800">{reportCard.boldNextStep}</p>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            </motion.div>

            {/* Date Range Filter */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <Card className="p-6 bg-gradient-to-br from-white to-blue-50/20 backdrop-blur-sm border-2 border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 mb-6 rounded-xl">
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 border border-blue-200">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Report Period</h3>
                    <p className="text-sm text-gray-500 mt-1">Select the date range for your reports</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                    <input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 shadow-sm"
                    />
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                    <input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                      min={dateRange.start || undefined}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 shadow-sm"
                    />
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      onClick={() => {
                        setDateRange({
                          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                          end: new Date().toISOString().split('T')[0],
                        });
                      }}
                      variant="outline"
                      size="sm"
                      className="border-blue-200 text-blue-700 hover:bg-blue-50"
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      Last 30 Days
                    </Button>
                    <Button
                      onClick={() => {
                        setDateRange({
                          start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                          end: new Date().toISOString().split('T')[0],
                        });
                      }}
                      variant="outline"
                      size="sm"
                      className="border-blue-200 text-blue-700 hover:bg-blue-50"
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      Last 90 Days
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Report Templates */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              {REPORT_TEMPLATES.map((template, index) => {
                const isGeneratingThis = generatingReport?.template === template.name;
                return (
                  <motion.div
                    key={template.id}
                    variants={cardVariants}
                    custom={index}
                    initial="hidden"
                    animate="visible"
                  >
                    <Card className="p-6 bg-gradient-to-br from-white to-blue-50/20 backdrop-blur-sm border-2 border-gray-200 hover:border-blue-400 hover:shadow-2xl transition-all duration-300 rounded-xl">
                      <div className="flex items-start gap-4 mb-5">
                        <motion.div
                          className="p-3 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 border border-blue-200"
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          <span className="text-2xl">{template.icon}</span>
                        </motion.div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-bold text-gray-900 mb-2 leading-tight">{template.name}</h3>
                          <p className="text-sm text-gray-600 leading-relaxed">{template.description}</p>
                        </div>
                      </div>
                      
                      <div className="pt-4 border-t border-gray-200">
                        <div className="flex gap-2">
                        <Button
                          onClick={() => handleGenerateReport(template, 'pdf')}
                          disabled={isGenerating}
                          className="flex-1 bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white shadow-md shadow-blue-500/30"
                          size="sm"
                        >
                          {isGeneratingThis && generatingReport?.format === 'pdf' ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <FileText className="h-4 w-4 mr-2" />
                              PDF
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => handleGenerateReport(template, 'excel')}
                          disabled={isGenerating}
                          variant="outline"
                          className="flex-1 border-emerald-200 text-emerald-700 hover:bg-emerald-50 shadow-sm"
                          size="sm"
                        >
                          {isGeneratingThis && generatingReport?.format === 'excel' ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <FileSpreadsheet className="h-4 w-4 mr-2" />
                              Excel
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => handleGenerateReport(template, 'csv')}
                          disabled={isGenerating}
                          variant="outline"
                          className="flex-1 border-blue-200 text-blue-700 hover:bg-blue-50 shadow-sm"
                          size="sm"
                        >
                          {isGeneratingThis && generatingReport?.format === 'csv' ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <File className="h-4 w-4 mr-2" />
                              CSV
                            </>
                          )}
                        </Button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <Card className="p-6 bg-gradient-to-br from-white to-indigo-50/20 backdrop-blur-sm border-2 border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 mb-6 rounded-xl">
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-50 border border-indigo-200">
                    <TrendingUp className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
                    <p className="text-sm text-gray-500 mt-0.5">Navigate to related sections</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <Button
                      onClick={() => router.push('/analytics')}
                      variant="outline"
                      className="h-28 flex flex-col items-center justify-center border-2 border-blue-200 hover:bg-blue-50 hover:border-blue-400 hover:shadow-md transition-all rounded-xl"
                    >
                      <div className="p-2.5 rounded-lg bg-blue-100 mb-2">
                        <TrendingUp className="h-6 w-6 text-blue-600" />
                      </div>
                      <span className="font-semibold text-gray-700">View Analytics</span>
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <Button
                      onClick={() => router.push('/admin/users')}
                      variant="outline"
                      className="h-28 flex flex-col items-center justify-center border-2 border-purple-200 hover:bg-purple-50 hover:border-purple-400 hover:shadow-md transition-all rounded-xl"
                    >
                      <div className="p-2.5 rounded-lg bg-purple-100 mb-2">
                        <Shield className="h-6 w-6 text-purple-600" />
                      </div>
                      <span className="font-semibold text-gray-700">Manage Users</span>
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <Button
                      onClick={() => {
                        setCustomFilters({});
                        showToast('Custom filters cleared', 'info');
                      }}
                      variant="outline"
                      className="h-28 flex flex-col items-center justify-center border-2 border-amber-200 hover:bg-amber-50 hover:border-amber-400 hover:shadow-md transition-all rounded-xl"
                    >
                      <div className="p-2.5 rounded-lg bg-amber-100 mb-2">
                        <Filter className="h-6 w-6 text-amber-600" />
                      </div>
                      <span className="font-semibold text-gray-700">Clear Filters</span>
                    </Button>
                  </motion.div>
                </div>
              </Card>
            </motion.div>

            {/* Recent Reports */}
            {recentReports.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              >
                <Card className="p-6 bg-gradient-to-br from-white to-blue-50/20 backdrop-blur-sm border-2 border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl">
                  <div className="flex justify-between items-center mb-5">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 border border-blue-200">
                        <Clock className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">Recent Reports</h2>
                        <p className="text-sm text-gray-500 mt-0.5">Download previously generated reports</p>
                      </div>
                    </div>
                    <Button
                      onClick={() => {
                        setRecentReports([]);
                        localStorage.removeItem('recentReports');
                        showToast('Recent reports cleared', 'info');
                      }}
                      variant="outline"
                      size="sm"
                      className="border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      Clear History
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {recentReports.map((report, index) => (
                      <motion.div
                        key={report.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1, duration: 0.3 }}
                      >
                        <div className="flex items-center justify-between p-5 bg-gradient-to-br from-white to-gray-50/50 rounded-xl border-2 border-gray-200 hover:border-blue-400 hover:shadow-lg transition-all duration-300">
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className={`p-3.5 rounded-xl border-2 ${
                              report.format === 'pdf' ? 'bg-blue-50 border-blue-200' :
                              report.format === 'excel' ? 'bg-emerald-50 border-emerald-200' :
                              'bg-blue-50 border-blue-200'
                            }`}>
                              {report.format === 'pdf' ? (
                                <FileText className="h-5 w-5 text-blue-600" />
                              ) : report.format === 'excel' ? (
                                <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                              ) : (
                                <File className="h-5 w-5 text-blue-600" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-gray-900 mb-1.5 text-base">{report.name}</div>
                              <div className="text-sm text-gray-600 flex items-center gap-2 flex-wrap">
                                <div className="flex items-center gap-1.5">
                                  <Clock className="h-3.5 w-3.5 text-gray-400" />
                                  <span>{new Date(report.generatedAt).toLocaleString()}</span>
                                </div>
                                <span className="text-gray-400">•</span>
                                <span className={`px-2 py-0.5 rounded-md font-semibold text-xs ${
                                  report.format === 'pdf' ? 'bg-blue-100 text-blue-700' :
                                  report.format === 'excel' ? 'bg-emerald-100 text-emerald-700' :
                                  'bg-blue-100 text-blue-700'
                                }`}>
                                  {report.format.toUpperCase()}
                                </span>
                                {report.size && (
                                  <>
                                    <span className="text-gray-400">•</span>
                                    <span className="text-gray-500">{formatFileSize(report.size)}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <Button
                            onClick={async () => {
                              // Use filename from report (should already have Edusafe prefix from backend)
                              // Or extract from fileUrl
                              let backendFilename = report.filename;
                              if (report.fileUrl) {
                                // Extract from URL (most reliable)
                                backendFilename = report.fileUrl.split('/').pop() || report.filename;
                              }
                              
                              console.log('Downloading report:', { filename: backendFilename, format: report.format });
                              
                              const downloaded = await downloadFile(backendFilename, report.format, report.name);
                              if (downloaded) {
                                showToast('✅ Report downloaded successfully!', 'success');
                              }
                            }}
                            variant="outline"
                            size="sm"
                            className="border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400 hover:shadow-md transition-all font-medium"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Loading Overlay */}
            {isGenerating && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Card className="p-8 max-w-md bg-white/95 backdrop-blur-md border border-gray-200 shadow-2xl">
                    <div className="flex flex-col items-center gap-4">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600"
                      />
                      <div className="text-center">
                        <div className="text-xl font-bold text-gray-900 mb-2">Generating Report</div>
                        {generatingReport && (
                          <div className="text-sm text-gray-600 mb-1">
                            <span className="font-semibold">{generatingReport.template}</span>
                            <span className="mx-2">•</span>
                            <span className="px-2 py-1 rounded bg-blue-100 text-blue-700 font-medium">
                              {generatingReport.format.toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="text-xs text-gray-500 mt-3">Please wait while we prepare your Edusafe report...</div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              </motion.div>
            )}

            {/* Educational Banner */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              <div className="p-6 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/20">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                      <Shield className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">📊 Edusafe Reports</h3>
                      <p className="text-sm opacity-90 mt-1">
                        Generate comprehensive analytics reports in PDF, Excel, or CSV formats. 
                        All reports are branded with Edusafe and include detailed insights for your institution.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}

// Export with AdminRoute wrapper
export default function ReportsPage() {
  return (
    <AdminRoute>
      <ReportsPageContent />
    </AdminRoute>
  );
}
