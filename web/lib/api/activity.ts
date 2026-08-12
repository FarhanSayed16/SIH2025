/**
 * Activity Tracking API client
 * Phase 4: Parent-Teacher-Student Linkage
 */

import { apiClient, ApiResponse } from './client';

export interface ActivityLog {
  _id: string;
  studentId: string;
  classId?: string;
  activityType: string;
  activityData: Record<string, any>;
  priority: 'low' | 'normal' | 'high' | 'critical';
  notifiedParents?: string[];
  notifiedTeachers?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ActivityTimelineResponse {
  activities: ActivityLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ClassActivitySummary {
  classId: string;
  totalActivities: number;
  activitiesByType: Record<string, number>;
  recentActivities: ActivityLog[];
  dateRange: {
    start: string;
    end: string;
  };
}

export interface TrackActivityRequest {
  activityType: string;
  activityData: Record<string, any>;
  priority?: 'low' | 'normal' | 'high' | 'critical';
}

export const activityApi = {
  /**
   * Track a student activity
   * POST /api/activity/track
   */
  async track(data: TrackActivityRequest): Promise<ApiResponse<{ activity: ActivityLog }>> {
    return apiClient.post<{ activity: ActivityLog }>('/activity/track', data);
  },

  /**
   * Get student activity timeline
   * GET /api/activity/student/:studentId
   */
  async getStudentTimeline(
    studentId: string,
    options?: {
      page?: number;
      limit?: number;
      activityType?: string;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<ApiResponse<ActivityTimelineResponse>> {
    const params = new URLSearchParams();
    if (options?.page) params.append('page', options.page.toString());
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.activityType) params.append('activityType', options.activityType);
    if (options?.startDate) params.append('startDate', options.startDate);
    if (options?.endDate) params.append('endDate', options.endDate);

    const query = params.toString();
    return apiClient.get<ActivityTimelineResponse>(
      `/activity/student/${studentId}${query ? `?${query}` : ''}`
    );
  },

  /**
   * Get class activity summary
   * GET /api/activity/class/:classId
   */
  async getClassActivity(
    classId: string,
    options?: {
      startDate?: string;
      endDate?: string;
      activityType?: string;
    }
  ): Promise<ApiResponse<ClassActivitySummary>> {
    const params = new URLSearchParams();
    if (options?.startDate) params.append('startDate', options.startDate);
    if (options?.endDate) params.append('endDate', options.endDate);
    if (options?.activityType) params.append('activityType', options.activityType);

    const query = params.toString();
    return apiClient.get<ClassActivitySummary>(
      `/activity/class/${classId}${query ? `?${query}` : ''}`
    );
  },
};

