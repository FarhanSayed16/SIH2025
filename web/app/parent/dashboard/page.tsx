/**
 * Parent Dashboard
 * Main dashboard for parents to monitor their children
 * Parent Monitoring System - Phase 2
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';
import { parentApi, ParentChild } from '@/lib/api/parent';
import { Card } from '@/components/ui/card';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import {
  Users,
  Shield,
  Activity,
  TrendingUp,
  MapPin,
  QrCode,
  Bell,
  RefreshCw,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  Clock
} from 'lucide-react';

export default function ParentDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, accessToken } = useAuthStore();
  const { showToast } = useToast();
  const [children, setChildren] = useState<ParentChild[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedChild, setSelectedChild] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user?.role !== 'parent') {
      router.push('/dashboard');
      return;
    }

    if (accessToken) {
      const { apiClient } = require('@/lib/api/client');
      apiClient.setToken(accessToken);
    }

    loadChildren();
  }, [isAuthenticated, router, accessToken, user]);

  const loadChildren = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await parentApi.getChildren();
      if (response.success && response.data?.children) {
        setChildren(response.data.children);
        if (response.data.children.length > 0 && !selectedChild) {
          setSelectedChild(response.data.children[0]._id);
        }
      }
    } catch (error: any) {
      console.error('Error loading children:', error);
      showToast('Failed to load children', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [selectedChild, showToast]);

  // Real-time status fetching for each child
  const [childStatuses, setChildStatuses] = useState<Record<string, any>>({});
  const [isRefreshingStatus, setIsRefreshingStatus] = useState(false);

  const fetchChildStatuses = useCallback(async () => {
    if (children.length === 0) return;
    
    setIsRefreshingStatus(true);
    try {
      const statusPromises = children.map(async (child) => {
        try {
          const statusResponse = await parentApi.getChildStatus(child._id);
          if (statusResponse.success && statusResponse.data) {
            return { childId: child._id, status: statusResponse.data };
          }
        } catch (error) {
          console.error(`Error fetching status for child ${child._id}:`, error);
        }
        return null;
      });

      const statuses = await Promise.all(statusPromises);
      const statusMap: Record<string, any> = {};
      statuses.forEach((status) => {
        if (status) {
          statusMap[status.childId] = status.status;
        }
      });
      setChildStatuses(statusMap);
    } catch (error: any) {
      console.error('Error fetching child statuses:', error);
    } finally {
      setIsRefreshingStatus(false);
    }
  }, [children]);

  // Initial status fetch and periodic updates
  useEffect(() => {
    if (children.length > 0) {
      fetchChildStatuses();
      // Set up polling every 30 seconds
      const interval = setInterval(fetchChildStatuses, 30000);
      return () => clearInterval(interval);
    }
  }, [children, fetchChildStatuses]);

  // Auto-refresh progress data every 30 seconds
  useEffect(() => {
    if (children.length > 0) {
      // Initial load
      loadChildren();
      // Set up polling every 30 seconds for progress updates
      const progressInterval = setInterval(() => {
        loadChildren();
      }, 30000);
      return () => clearInterval(progressInterval);
    }
  }, [children.length, loadChildren]);

  // Load dashboard summary
  const [dashboardSummary, setDashboardSummary] = useState<any>(null);
  useEffect(() => {
    const loadSummary = async () => {
      try {
        const response = await parentApi.getDashboardSummary();
        if (response.success && response.data) {
          setDashboardSummary(response.data);
        }
      } catch (error: any) {
        console.error('Error loading dashboard summary:', error);
      }
    };
    if (isAuthenticated && user?.role === 'parent') {
      loadSummary();
    }
  }, [isAuthenticated, user]);

  const getChildStatus = (child: ParentChild) => {
    // Priority: real-time status > stats.status > safetyStatus > 'safe'
    if (childStatuses[child._id]?.status) {
      return childStatuses[child._id].status;
    }
    return child.stats?.status || child.safetyStatus || 'safe';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'safe':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'in_drill':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'emergency':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'safe':
        return <CheckCircle className="w-5 h-5" />;
      case 'in_drill':
        return <Activity className="w-5 h-5" />;
      case 'emergency':
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            <LoadingSkeleton />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-blue-50 via-white to-blue-50 p-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  Parent Dashboard
                </h1>
                <p className="text-gray-600 mt-2">Monitor your children's safety and progress</p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => router.push('/parent/children/manage')}
                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Users className="w-4 h-4" />
                  Manage Children
                </Button>
                <Button
                  onClick={() => router.push('/parent/add-child')}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Users className="w-4 h-4" />
                  Add Child
                </Button>
                <Button
                  onClick={() => router.push('/parent/profile')}
                  className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white"
                >
                  <Shield className="w-4 h-4" />
                  Profile
                </Button>
                <Button
                  onClick={async () => {
                    await loadChildren();
                    await fetchChildStatuses();
                  }}
                  variant="outline"
                  className="flex items-center gap-2"
                  disabled={isRefreshingStatus}
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshingStatus ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>
          </div>

          {/* Children List */}
          {children.length === 0 ? (
            <Card className="p-12">
              <EmptyState
                title="No Children Linked"
                description="Click 'Add Child' to link your child's account. You can use their QR code or student ID."
                icon={<Users className="w-12 h-12 text-gray-400" />}
              />
              <div className="mt-6 text-center">
                <Button
                  onClick={() => router.push('/parent/add-child')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Add Your First Child
                </Button>
              </div>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4 bg-blue-50 border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Total Children</p>
                      <p className="text-2xl font-bold text-blue-700">
                        {dashboardSummary?.totalChildren || children.length}
                      </p>
                    </div>
                    <Users className="w-8 h-8 text-blue-600 opacity-50" />
                  </div>
                </Card>
                <Card className="p-4 bg-green-50 border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Safe</p>
                      <p className="text-2xl font-bold text-green-700">
                        {dashboardSummary?.safe || children.filter(c => getChildStatus(c) === 'safe').length}
                      </p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-600 opacity-50" />
                  </div>
                </Card>
                <Card className="p-4 bg-yellow-50 border border-yellow-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">In Drill</p>
                      <p className="text-2xl font-bold text-yellow-700">
                        {dashboardSummary?.inDrill || children.filter(c => getChildStatus(c) === 'in_drill').length}
                      </p>
                    </div>
                    <Activity className="w-8 h-8 text-yellow-600 opacity-50" />
                  </div>
                </Card>
                <Card className="p-4 bg-purple-50 border border-purple-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Avg Preparedness</p>
                      <p className="text-2xl font-bold text-purple-700">
                        {dashboardSummary?.averagePreparednessScore || 0}%
                      </p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-purple-600 opacity-50" />
                  </div>
                </Card>
              </div>

              {/* Children Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {children.map((child) => {
                  const status = getChildStatus(child);
                  return (
                    <Card
                      key={child._id}
                      className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => router.push(`/parent/children/${child._id}`)}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                            {child.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{child.name}</h3>
                            {child.grade && child.section && (
                              <p className="text-sm text-gray-500">
                                Grade {child.grade} - Section {child.section}
                              </p>
                            )}
                            {child.institutionId?.name && (
                              <p className="text-xs text-gray-400">{child.institutionId.name}</p>
                            )}
                          </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full border flex items-center gap-1 ${getStatusColor(status)}`}>
                          {getStatusIcon(status)}
                          <span className="text-xs font-medium capitalize">{status.replace('_', ' ')}</span>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        {child.relationship && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Relationship:</span>
                            <span className="font-medium text-gray-900 capitalize">{child.relationship}</span>
                          </div>
                        )}
                        {child.classId && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Class:</span>
                            <span className="font-medium text-gray-900">{child.classId.classCode}</span>
                          </div>
                        )}
                        {child.stats && (
                          <>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Preparedness:</span>
                              <span className="font-medium text-blue-600">{child.stats.preparednessScore}%</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Modules:</span>
                              <span className="font-medium text-green-600">{child.stats.modulesCompleted} completed</span>
                            </div>
                            {child.stats.lastActivity && (
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Last Activity:</span>
                                <span className="font-medium text-gray-900 text-xs">
                                  {new Date(child.stats.lastActivity).toLocaleDateString()}
                                </span>
                              </div>
                            )}
                          </>
                        )}
                        {childStatuses[child._id]?.lastSeen && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Last Seen:</span>
                            <span className="font-medium text-gray-900 text-xs">
                              {new Date(childStatuses[child._id].lastSeen).toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/parent/children/${child._id}`);
                          }}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          View Details
                        </Button>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/parent/children/${child._id}/location`);
                          }}
                          variant="outline"
                          className="flex items-center gap-1"
                        >
                          <MapPin className="w-4 h-4" />
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>

              {/* Quick Actions */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Button
                    onClick={() => router.push('/parent/children/manage')}
                    className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white h-16"
                  >
                    <Users className="w-5 h-5" />
                    <span>Manage Children</span>
                  </Button>
                  <Button
                    onClick={() => router.push('/parent/profile')}
                    className="flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white h-16"
                  >
                    <Shield className="w-5 h-5" />
                    <span>My Profile</span>
                  </Button>
                  <Button
                    onClick={() => router.push('/parent/verify-student')}
                    className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white h-16"
                  >
                    <QrCode className="w-5 h-5" />
                    <span>Verify Student QR</span>
                  </Button>
                  <Button
                    onClick={() => router.push('/parent/notifications')}
                    className="flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white h-16"
                  >
                    <Bell className="w-5 h-5" />
                    <span>Notifications</span>
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

