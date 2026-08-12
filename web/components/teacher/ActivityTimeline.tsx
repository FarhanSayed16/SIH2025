/**
 * Activity Timeline Component
 * Phase 4: Parent-Teacher-Student Linkage
 * Displays real-time activity feed for a student
 */

'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { activityApi, ActivityLog } from '@/lib/api/activity';
import {
  BookOpen,
  FileText,
  Gamepad2,
  Award,
  TrendingUp,
  AlertCircle,
  Calendar,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ActivityTimelineProps {
  studentId: string;
  classId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

const ACTIVITY_ICONS: Record<string, any> = {
  module_complete: BookOpen,
  quiz_complete: FileText,
  quiz_attempt: FileText,
  game_complete: Gamepad2,
  game_play: Gamepad2,
  badge_earned: Award,
  xp_milestone: TrendingUp,
  progress_update: TrendingUp,
  safety_status_change: AlertCircle,
  drill_participation: AlertCircle,
  drill_complete: AlertCircle,
};

const ACTIVITY_COLORS: Record<string, string> = {
  module_complete: 'text-blue-600',
  quiz_complete: 'text-green-600',
  quiz_attempt: 'text-yellow-600',
  game_complete: 'text-purple-600',
  game_play: 'text-indigo-600',
  badge_earned: 'text-amber-600',
  xp_milestone: 'text-pink-600',
  progress_update: 'text-cyan-600',
  safety_status_change: 'text-red-600',
  drill_participation: 'text-orange-600',
  drill_complete: 'text-emerald-600',
};

export function ActivityTimeline({
  studentId,
  classId,
  autoRefresh = true,
  refreshInterval = 30000,
}: ActivityTimelineProps) {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filterType, setFilterType] = useState<string>('');
  const [dateRange, setDateRange] = useState<{ start?: string; end?: string }>({});

  const loadActivities = async (reset = false) => {
    try {
      setIsLoading(true);
      const currentPage = reset ? 1 : page;
      const response = await activityApi.getStudentTimeline(studentId, {
        page: currentPage,
        limit: 20,
        activityType: filterType || undefined,
        startDate: dateRange.start,
        endDate: dateRange.end,
      });

      if (response.success && response.data) {
        if (reset) {
          setActivities(response.data.activities);
        } else {
          setActivities((prev) => [...prev, ...response.data.activities]);
        }
        setHasMore(response.data.activities.length === 20);
        if (reset) setPage(1);
      }
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadActivities(true);
  }, [studentId, filterType, dateRange]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        loadActivities(true);
      }, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, studentId, filterType, dateRange]);

  const formatActivityMessage = (activity: ActivityLog): string => {
    const data = activity.activityData || {};
    switch (activity.activityType) {
      case 'module_complete':
        return `Completed module: ${data.moduleName || 'Module'}`;
      case 'quiz_complete':
        return `Completed quiz with score: ${data.quizScore || 0}/${data.quizTotalQuestions || 0}`;
      case 'game_complete':
        return `Completed game: ${data.gameName || 'Game'}`;
      case 'badge_earned':
        return `Earned badge: ${data.badgeName || 'Badge'}`;
      case 'xp_milestone':
        return `Reached ${data.totalXP || 0} XP!`;
      case 'progress_update':
        return `Preparedness score: ${data.preparednessScore || 0}%`;
      case 'safety_status_change':
        return `Safety status changed to: ${data.safetyStatus || 'Unknown'}`;
      case 'drill_participation':
        return `Participated in drill: ${data.drillType || 'Drill'}`;
      case 'drill_complete':
        return `Completed drill`;
      default:
        return 'Activity performed';
    }
  };

  const getActivityIcon = (activityType: string) => {
    const Icon = ACTIVITY_ICONS[activityType] || Activity;
    return <Icon className="w-5 h-5" />;
  };

  const handleExport = () => {
    const headers = ['Date', 'Type', 'Description'];
    const rows = activities.map((a) => [
      new Date(a.timestamp).toISOString(),
      a.activityType || '—',
      formatActivityMessage(a),
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity-${studentId.slice(-6)}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading && activities.length === 0) {
    return <LoadingSkeleton />;
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Activity Timeline
        </h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadActivities(true)}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="mb-4 flex gap-2">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 border rounded-md text-sm"
        >
          <option value="">All Activities</option>
          <option value="module_complete">Modules</option>
          <option value="quiz_complete">Quizzes</option>
          <option value="game_complete">Games</option>
          <option value="badge_earned">Badges</option>
          <option value="progress_update">Progress</option>
          <option value="drill_participation">Drills</option>
        </select>
      </div>

      {activities.length === 0 ? (
        <EmptyState
          title="No activities found"
          description="This student hasn't performed any activities yet."
        />
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => {
            const Icon = ACTIVITY_ICONS[activity.activityType] || Activity;
            const colorClass = ACTIVITY_COLORS[activity.activityType] || 'text-gray-600';
            const priorityBadge =
              activity.priority === 'critical'
                ? 'bg-red-100 text-red-800'
                : activity.priority === 'high'
                ? 'bg-orange-100 text-orange-800'
                : 'bg-gray-100 text-gray-800';

            return (
              <div
                key={activity._id}
                className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className={`${colorClass} mt-1`}>{getActivityIcon(activity.activityType)}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium">{formatActivityMessage(activity)}</p>
                    {activity.priority !== 'normal' && (
                      <span className={`px-2 py-0.5 text-xs rounded ${priorityBadge}`}>
                        {activity.priority}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            );
          })}

          {hasMore && (
            <Button
              variant="outline"
              onClick={() => {
                setPage((p) => p + 1);
                loadActivities(false);
              }}
              disabled={isLoading}
              className="w-full"
            >
              Load More
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}

