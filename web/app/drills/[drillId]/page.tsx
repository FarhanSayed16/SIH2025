/**
 * Drill Detail Page - Phase 4
 * Shows drill information, real-time participation tracking, and statistics
 */

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';
import { drillsApi, Drill } from '@/lib/api/drills';
import { socketService } from '@/lib/services/socket-service';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { useToast } from '@/components/ui/toast';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ArrowLeft, Users, Clock, CheckCircle, XCircle, RefreshCw, Download, Camera, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { aiApi, type DamageScanResult, type DrillSummaryResult } from '@/lib/api/ai';
import { Sparkles } from 'lucide-react';

interface DrillParticipant {
  userId: string;
  name: string;
  email?: string;
  role?: string;
  grade?: string;
  section?: string;
  acknowledged: boolean;
  acknowledgedAt?: string;
  responseTime?: number;
  completedAt?: string;
  evacuationTime?: number;
  score?: number;
}

interface ParticipantsData {
  participants: DrillParticipant[];
  summary: {
    total: number;
    acknowledged: number;
    notAcknowledged: number;
    participationRate: number;
  };
}

export default function DrillDetailPage() {
  const router = useRouter();
  const params = useParams();
  const drillId = params.drillId as string;
  const { user, isAuthenticated, accessToken } = useAuthStore();
  const { showToast } = useToast();
  
  const [drill, setDrill] = useState<Drill | null>(null);
  const [participants, setParticipants] = useState<ParticipantsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnding, setIsEnding] = useState(false);
  const [damageScan, setDamageScan] = useState<DamageScanResult | null>(null);
  const [damageScanLoading, setDamageScanLoading] = useState(false);
  const [damageScanError, setDamageScanError] = useState<string | null>(null);
  const [drillSummary, setDrillSummary] = useState<DrillSummaryResult | null>(null);
  const [drillSummaryLoading, setDrillSummaryLoading] = useState(false);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef(false);

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

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    loadDrillData();
    loadParticipants();

    // Phase 4: Setup Socket.io listeners for real-time updates
    const institutionId = typeof user?.institutionId === 'string' 
      ? user.institutionId 
      : (user?.institutionId as any)?._id || user?.institutionId;

    if (institutionId && accessToken && !isInitializedRef.current) {
      isInitializedRef.current = true;
      socketService.connect(institutionId, accessToken);

      // Listen for participation updates
      socketService.on('DRILL_PARTICIPATION_UPDATE', (data: any) => {
        if (data.drillId === drillId) {
          loadParticipants();
        }
      });

      // Listen for drill end
      socketService.on('DRILL_END', (data: any) => {
        if (data.drillId === drillId) {
          showToast('Drill ended', 'success');
          loadDrillData();
          loadParticipants();
        }
      });
    }

    // Auto-refresh every 5 seconds
    refreshIntervalRef.current = setInterval(() => {
      loadDrillData();
      loadParticipants();
    }, 5000);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [isAuthenticated, router, user, accessToken, drillId]);

  const loadDrillData = useCallback(async () => {
    try {
      const response = await drillsApi.getById(drillId);
      if (response.success && response.data) {
        setDrill(response.data);
      }
    } catch (error) {
      console.error('Error loading drill:', error);
      showToast('Failed to load drill data', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [drillId, showToast]);

  const loadParticipants = useCallback(async () => {
    try {
      const response = await drillsApi.getParticipants(drillId);
      if (response.success && response.data) {
        setParticipants(response.data);
      }
    } catch (error) {
      console.error('Error loading participants:', error);
    }
  }, [drillId]);

  const handleEndDrill = async () => {
    if (!confirm('Are you sure you want to end this drill?')) return;

    setIsEnding(true);
    try {
      const response = await drillsApi.end(drillId);
      if (response.success) {
        showToast('Drill ended successfully', 'success');
        loadDrillData();
        loadParticipants();
      } else {
        showToast('Failed to end drill', 'error');
      }
    } catch (error) {
      console.error('Error ending drill:', error);
      showToast('Failed to end drill', 'error');
    } finally {
      setIsEnding(false);
    }
  };

  const handleGenerateSummary = async () => {
    if (!drill || !participants) return;
    setDrillSummaryLoading(true);
    setDrillSummary(null);
    try {
      const acknowledged = participants.participants.filter((p) => p.acknowledged && p.responseTime != null);
      const avgResponseTimeSeconds =
        acknowledged.length > 0
          ? Math.round(acknowledged.reduce((s, p) => s + (p.responseTime ?? 0), 0) / acknowledged.length)
          : undefined;
      const durationMinutes =
        drill.scheduledAt && drill.completionTime
          ? Math.round((new Date(drill.completionTime).getTime() - new Date(drill.scheduledAt).getTime()) / 60000)
          : 5;
      const result = await aiApi.summariseDrill({
        drillId,
        type: drill.type,
        participantCount: participants.summary.total,
        acknowledgedCount: participants.summary.acknowledged,
        avgResponseTimeSeconds,
        durationMinutes,
      });
      setDrillSummary(result);
      showToast('AI summary generated', 'success');
    } catch (e) {
      showToast((e as Error).message || 'Failed to generate summary', 'error');
    } finally {
      setDrillSummaryLoading(false);
    }
  };

  const handleExportReport = () => {
    if (!drill || !participants) return;
    const rows: string[][] = [
      ['Drill Report', '', '', ''],
      ['Type', drill.type, '', ''],
      ['Status', drill.status, '', ''],
      ['Scheduled', formatDateTime(drill.scheduledAt), '', ''],
      drill.completionTime ? ['Completed', formatDateTime(drill.completionTime), '', ''] : [],
      [],
      ['Participant', 'Email', 'Acknowledged', 'Acknowledged At'],
      ...participants.participants.map((p) => [
        p.name || '—',
        p.email || '—',
        p.acknowledged ? 'Yes' : 'No',
        p.acknowledgedAt ? formatDateTime(p.acknowledgedAt) : '—',
      ]),
    ];
    const csv = rows
      .filter((r) => r.length > 0)
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `drill-${drill.type}-${drillId.slice(-6)}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Report exported', 'success');
  };

  const formatDrillType = (type?: string | null) => {
    if (!type || typeof type !== 'string') return 'Drill';
    return type.charAt(0).toUpperCase() + type.slice(1) + ' Drill';
  };

  const formatDateTime = (dateString?: string | null) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleString();
  };

  const formatTime = (seconds?: number) => {
    if (!seconds) return 'N/A';
    return `${seconds}s`;
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 p-6">
            <LoadingSkeleton />
          </main>
        </div>
      </div>
    );
  }

  if (!drill) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 p-6">
            <EmptyState
              title="Drill Not Found"
              description="The drill you're looking for doesn't exist or has been removed."
            />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6">
          <div className="mb-6">
            <Button
              variant="outline"
              onClick={() => router.push('/drills')}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Drills
            </Button>
            <h1 className="text-2xl font-bold">{formatDrillType(drill.type)}</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Drill Information */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Drill Information</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Type</p>
                  <p className="font-medium">{formatDrillType(drill.type)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span className={`inline-block px-2 py-1 rounded text-sm ${
                    drill.status === 'active' || drill.status === 'in_progress'
                      ? 'bg-red-100 text-red-800'
                      : drill.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : drill.status === 'scheduled'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {drill.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Scheduled</p>
                  <p className="font-medium">{formatDateTime(drill.scheduledAt)}</p>
                </div>
                {drill.completionTime && (
                  <div>
                    <p className="text-sm text-gray-600">Completed</p>
                    <p className="font-medium">{formatDateTime(drill.completionTime)}</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Participation Summary */}
            {participants && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">Participation Summary</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded">
                      <p className="text-2xl font-bold text-blue-700">
                        {participants.summary.total}
                      </p>
                      <p className="text-sm text-gray-600">Total</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded">
                      <p className="text-2xl font-bold text-green-700">
                        {participants.summary.acknowledged}
                      </p>
                      <p className="text-sm text-gray-600">Acknowledged</p>
                    </div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded">
                    <p className="text-2xl font-bold text-orange-700">
                      {participants.summary.participationRate}%
                    </p>
                    <p className="text-sm text-gray-600">Participation Rate</p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{ width: `${participants.summary.participationRate}%` }}
                    />
                  </div>
                </div>
              </Card>
            )}

            {/* B1: AI Summary - when drill completed */}
            {drill.status === 'completed' && participants && (
              <Card className="p-6 border border-emerald-100 bg-emerald-50/50">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-lg font-semibold">AI Summary</h2>
                </div>
                {!drillSummary ? (
                  <div>
                    <p className="text-sm text-gray-600 mb-3">
                      Get a short AI-generated summary and improvement tip for this drill.
                    </p>
                    <Button
                      variant="default"
                      className="bg-emerald-600 hover:bg-emerald-700"
                      onClick={handleGenerateSummary}
                      disabled={drillSummaryLoading}
                    >
                      {drillSummaryLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Sparkles className="w-4 h-4 mr-2" />
                      )}
                      Generate summary
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-700">{drillSummary.summary}</p>
                    <p className="text-sm font-medium text-emerald-800">Improvement tip</p>
                    <p className="text-sm text-gray-700">{drillSummary.improvementTip}</p>
                  </div>
                )}
              </Card>
            )}

            {/* Actions */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Actions</h2>
              <div className="space-y-2">
                {(drill.status === 'active' || drill.status === 'in_progress') && (
                  <Button
                    variant="danger"
                    className="w-full"
                    onClick={handleEndDrill}
                    disabled={isEnding}
                  >
                    {isEnding ? 'Ending...' : 'End Drill'}
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    loadDrillData();
                    loadParticipants();
                  }}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleExportReport}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </Button>
              </div>
            </Card>
          </div>

          {/* Participants List */}
          {participants && (
            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Participants</h2>
                <span className="text-sm text-gray-600">
                  {participants.participants.length} students
                </span>
              </div>
              <div className="space-y-2">
                {participants.participants.map((participant) => (
                  <div
                    key={participant.userId}
                    className={`border rounded-lg p-4 ${
                      participant.acknowledged
                        ? 'border-green-200 bg-green-50'
                        : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {participant.acknowledged ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                        <div>
                          <p className="font-medium">{participant.name}</p>
                          {participant.grade && participant.section && (
                            <p className="text-sm text-gray-600">
                              Grade {participant.grade} - Section {participant.section}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-medium ${
                          participant.acknowledged ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {participant.acknowledged ? 'Acknowledged' : 'Not Acknowledged'}
                        </p>
                        {participant.responseTime && (
                          <p className="text-xs text-gray-600">
                            Response: {formatTime(participant.responseTime)}
                          </p>
                        )}
                        {participant.evacuationTime && (
                          <p className="text-xs text-gray-600">
                            Evacuation: {formatTime(participant.evacuationTime)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Scan damage (AI) - A3 */}
          <Card className="p-6 mt-6 border border-amber-100 bg-white">
            <div className="flex items-center gap-2 mb-3">
              <Camera className="w-5 h-5 text-amber-600" />
              <h2 className="text-lg font-semibold">Scan damage (AI)</h2>
            </div>
            <p className="text-sm text-gray-500 mb-3">
              Upload a photo taken after this drill to check for visible damage or concerns.
            </p>
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Image (PNG/JPG)</label>
                <Input
                  type="file"
                  accept=".png,.jpg,.jpeg"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleScanDamage(f);
                  }}
                  disabled={damageScanLoading}
                />
              </div>
              {damageScanLoading && <Loader2 className="w-5 h-5 animate-spin text-amber-600" />}
            </div>
            {damageScanError && (
              <p className="mt-2 text-sm text-red-600">{damageScanError}</p>
            )}
            {damageScan && (
              <div className="mt-4 p-4 rounded-lg border border-amber-200 bg-amber-50 space-y-2">
                <p className="text-sm font-semibold">
                  {damageScan.damageDetected ? 'Damage detected' : 'No damage detected'}
                  {damageScan.severity && ` · ${damageScan.severity} severity`}
                </p>
                {damageScan.description && <p className="text-sm text-gray-700">{damageScan.description}</p>}
                {damageScan.followUp && <p className="text-sm text-gray-600">{damageScan.followUp}</p>}
              </div>
            )}
          </Card>
        </main>
      </div>
    </div>
  );
}

