/**
 * Parent Notifications Page
 * Displays all notifications for the parent
 * Parent Monitoring System - Phase 2
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';
import { parentApi, ParentNotification } from '@/lib/api/parent';
import { Card } from '@/components/ui/card';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import {
  ArrowLeft,
  Bell,
  CheckCircle,
  Activity,
  Award,
  Calendar,
  AlertTriangle,
  RefreshCw,
  CheckCheck,
  Filter
} from 'lucide-react';

type FilterType = 'all' | 'unread' | 'drill' | 'achievement' | 'attendance' | 'emergency';

export default function ParentNotificationsPage() {
  const router = useRouter();
  const { user, isAuthenticated, accessToken } = useAuthStore();
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState<ParentNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'parent') {
      router.push('/login');
      return;
    }

    if (accessToken) {
      const { apiClient } = require('@/lib/api/client');
      apiClient.setToken(accessToken);
    }

    loadNotifications();
  }, [isAuthenticated, router, accessToken, user]);

  const loadNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const filters: any = {};
      if (filter === 'unread') {
        filters.read = false;
      } else if (filter !== 'all') {
        filters.type = filter;
      }

      const response = await parentApi.getNotifications(filters);
      if (response.success && response.data?.notifications) {
        setNotifications(response.data.notifications);
      }
    } catch (error: any) {
      console.error('Error loading notifications:', error);
      showToast('Failed to load notifications', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [filter, showToast]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await parentApi.markNotificationRead(notificationId);
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      showToast('Notification marked as read', 'success');
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
      showToast('Failed to mark notification as read', 'error');
    }
  };

  const handleMarkAllAsRead = async () => {
    setIsMarkingAllRead(true);
    try {
      const response = await parentApi.markAllNotificationsRead();
      if (response.success) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        showToast(`${response.data?.count || 0} notifications marked as read`, 'success');
      }
    } catch (error: any) {
      console.error('Error marking all notifications as read:', error);
      showToast('Failed to mark all notifications as read', 'error');
    } finally {
      setIsMarkingAllRead(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'drill':
        return <Activity className="w-5 h-5" />;
      case 'achievement':
        return <Award className="w-5 h-5" />;
      case 'attendance':
        return <Calendar className="w-5 h-5" />;
      case 'emergency':
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'drill':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'achievement':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'attendance':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'emergency':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

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
        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-purple-50 via-white to-purple-50 p-6">
          {/* Header */}
          <div className="mb-6">
            <Button
              onClick={() => router.push('/parent/dashboard')}
              variant="outline"
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg flex items-center justify-center">
                  <Bell className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
                  <p className="text-gray-600 mt-1">
                    {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {unreadCount > 0 && (
                  <Button
                    onClick={handleMarkAllAsRead}
                    disabled={isMarkingAllRead}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    {isMarkingAllRead ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Marking...
                      </>
                    ) : (
                      <>
                        <CheckCheck className="w-4 h-4" />
                        Mark All Read
                      </>
                    )}
                  </Button>
                )}
                <Button
                  onClick={loadNotifications}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </Button>
              </div>
            </div>
          </div>

          {/* Filters */}
          <Card className="p-4 mb-6">
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filter:</span>
              {(['all', 'unread', 'drill', 'achievement', 'attendance', 'emergency'] as FilterType[]).map((filterType) => (
                <button
                  key={filterType}
                  onClick={() => setFilter(filterType)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    filter === filterType
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                </button>
              ))}
            </div>
          </Card>

          {/* Notifications List */}
          {notifications.length === 0 ? (
            <Card className="p-12 text-center">
              <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Notifications</h3>
              <p className="text-gray-600">
                {filter === 'all' 
                  ? "You're all caught up! No notifications at the moment."
                  : `No ${filter} notifications found.`}
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <Card
                  key={notification.id}
                  className={`p-6 border-l-4 ${
                    notification.read
                      ? 'bg-white border-gray-300'
                      : 'bg-blue-50 border-blue-500'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`p-2 rounded-lg ${getNotificationColor(notification.type)}`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                          {!notification.read && (
                            <span className="w-2 h-2 bg-blue-600 rounded-full" />
                          )}
                        </div>
                        <p className="text-gray-700 mb-2">{notification.message}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>{new Date(notification.createdAt).toLocaleString()}</span>
                          {notification.data?.studentId && (
                            <button
                              onClick={() => router.push(`/parent/children/${notification.data.studentId}`)}
                              className="text-blue-600 hover:text-blue-700 font-medium"
                            >
                              View Child →
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    {!notification.read && (
                      <Button
                        onClick={() => handleMarkAsRead(notification.id)}
                        variant="outline"
                        size="sm"
                        className="ml-4"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Mark Read
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

