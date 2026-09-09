/**
 * Parent API client
 * Parent Monitoring System - Phase 2
 */

import { apiClient, ApiResponse } from './client';

export interface ParentChild {
  _id: string;
  name: string;
  email?: string;
  grade?: string;
  section?: string;
  classCode?: string;
  institutionName?: string;
  profilePicture?: string;
  relationship?: string;
  isPrimary?: boolean;
  relationshipId?: string;
  classId?: {
    _id: string;
    grade: string;
    section: string;
    classCode: string;
  };
  institutionId?: {
    _id: string;
    name: string;
  };
  qrCode?: string;
  qrBadgeId?: string;
  stats?: {
    preparednessScore: number;
    modulesCompleted: number;
    lastActivity: Date | string;
    loginStreak: number;
    status: string;
  };
  safetyStatus?: string;
  lastSeen?: Date | string;
}

export interface ChildProgress {
  student: ParentChild;
  modules: {
    completed: number;
    total: number;
    inProgress: number;
  };
  quiz: {
    totalQuizzes: number;
    avgScore: number;
    passRate: number;
    recentQuizzes?: Array<{
      _id: string;
      score: number;
      passed: boolean;
      completedAt: Date;
      moduleId?: {
        title: string;
      };
    }>;
  };
  games: {
    totalGames: number;
    totalXP: number;
    avgScore: number;
    recentGames?: Array<{
      _id: string;
      score: number;
      xpEarned: number;
      completedAt: Date;
    }>;
  };
  progress: {
    preparednessScore: number;
    loginStreak: number;
    badges: number;
  };
  lastActivity?: string | Date;
}

export interface ChildLocation {
  latitude: number | null;
  longitude: number | null;
  accuracy?: number | null;
  timestamp?: Date | string | null;
  status: string;
  statusProvenance?: string;
  statusReportedAt?: Date | string | null;
  lastSeen?: Date | string | null;
  lastActivity?: Date | string | null;
  activeDrill?: {
    drillId: string;
    drillType: string;
    status: string;
  } | null;
}

export interface DrillParticipation {
  drillId: string;
  drillType: string;
  startTime: Date;
  endTime?: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'missed';
  completionTime?: number;
  location?: {
    latitude: number;
    longitude: number;
  } | null;
}

export interface AttendanceRecord {
  _id: string;
  date: Date;
  status: 'present' | 'absent' | 'late' | 'excused';
  notes?: string;
}

export interface AttendanceData {
  records: AttendanceRecord[];
  statistics: {
    totalDays: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
    attendanceRate: number;
  };
}

export interface QRVerificationResult {
  verified: boolean;
  student?: ParentChild;
  relationship?: {
    relationship: string;
    isPrimary: boolean;
    verified: boolean;
  };
  message?: string;
}

export interface ParentNotification {
  id: string;
  type: 'drill' | 'achievement' | 'attendance' | 'emergency' | 'system';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LinkRequest {
  _id: string;
  studentId: {
    _id: string;
    name: string;
    grade?: string;
    section?: string;
  };
  status: 'pending' | 'approved' | 'rejected' | 'auto_verified';
  relationship: string;
  requestMethod: 'qr_scan' | 'student_id' | 'email' | 'manual';
  createdAt: Date;
}

export interface LinkResult {
  success: boolean;
  autoVerified: boolean;
  message: string;
  relationship?: any;
  request?: LinkRequest;
  student?: ParentChild | {
    name: string;
    grade?: string;
    section?: string;
  };
}

export const parentApi = {
  /**
   * Get all children for authenticated parent
   * GET /api/parent/children
   */
  async getChildren(): Promise<ApiResponse<{ children: ParentChild[] }>> {
    return apiClient.get<{ children: ParentChild[] }>('/parent/children');
  },

  /**
   * Get detailed information about a specific child
   * GET /api/parent/children/:studentId
   */
  async getChildDetails(studentId: string): Promise<ApiResponse<ChildProgress>> {
    return apiClient.get<ChildProgress>(`/parent/children/${studentId}`);
  },

  /**
   * Get child's academic progress
   * GET /api/parent/children/:studentId/progress
   */
  async getChildProgress(
    studentId: string,
    dateRange?: { start: string; end: string }
  ): Promise<ApiResponse<ChildProgress>> {
    const params = dateRange
      ? `?startDate=${dateRange.start}&endDate=${dateRange.end}`
      : '';
    return apiClient.get<ChildProgress>(`/parent/children/${studentId}/progress${params}`);
  },

  /**
   * Get child's current location
   * GET /api/parent/children/:studentId/location
   */
  async getChildLocation(studentId: string): Promise<ApiResponse<ChildLocation>> {
    return apiClient.get<ChildLocation>(`/parent/children/${studentId}/location`);
  },

  /**
   * Get child's drill participation history
   * GET /api/parent/children/:studentId/drills
   */
  async getChildDrills(studentId: string): Promise<ApiResponse<{ drills: DrillParticipation[] }>> {
    return apiClient.get<{ drills: DrillParticipation[] }>(`/parent/children/${studentId}/drills`);
  },

  /**
   * Get child's attendance records
   * GET /api/parent/children/:studentId/attendance
   */
  async getChildAttendance(
    studentId: string,
    startDate?: string,
    endDate?: string
  ): Promise<ApiResponse<AttendanceData>> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get<AttendanceData>(`/parent/children/${studentId}/attendance${queryString}`);
  },

  /**
   * Verify student QR code
   * POST /api/parent/verify-student-qr
   */
  async verifyStudentQR(qrCode: string): Promise<ApiResponse<QRVerificationResult>> {
    return apiClient.post<QRVerificationResult>('/parent/verify-student-qr', { qrCode });
  },

  /**
   * Get parent notifications
   * GET /api/parent/notifications
   */
  async getNotifications(filters?: {
    type?: string;
    read?: boolean;
    limit?: number;
  }): Promise<ApiResponse<{ notifications: ParentNotification[] }>> {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.read !== undefined) params.append('read', filters.read.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get<{ notifications: ParentNotification[] }>(`/parent/notifications${queryString}`);
  },

  /**
   * Mark notification as read
   * PUT /api/parent/notifications/:notificationId/read
   */
  async markNotificationRead(notificationId: string): Promise<ApiResponse<void>> {
    return apiClient.put<void>(`/parent/notifications/${notificationId}/read`, {});
  },

  /**
   * Mark all notifications as read
   * PUT /api/parent/notifications/read-all
   */
  async markAllNotificationsRead(): Promise<ApiResponse<{ count: number }>> {
    return apiClient.put<{ count: number }>('/parent/notifications/read-all', {});
  },

  /**
   * Link student to parent via QR code
   * POST /api/parent/children/link/qr
   */
  async linkStudentByQR(
    qrCode: string,
    relationship: string = 'other'
  ): Promise<ApiResponse<LinkResult>> {
    return apiClient.post<LinkResult>('/parent/children/link/qr', { qrCode, relationship });
  },

  /**
   * Link student to parent via student ID
   * POST /api/parent/children/link/id
   */
  async linkStudentById(
    studentId: string,
    relationship: string = 'other'
  ): Promise<ApiResponse<LinkResult>> {
    return apiClient.post<LinkResult>('/parent/children/link/id', { studentId, relationship });
  },

  /**
   * Get pending link requests
   * GET /api/parent/children/link-requests
   */
  async getPendingLinkRequests(): Promise<ApiResponse<{ requests: LinkRequest[] }>> {
    return apiClient.get<{ requests: LinkRequest[] }>('/parent/children/link-requests');
  },

  /**
   * Cancel a pending link request
   * DELETE /api/parent/children/link-requests/:requestId
   */
  async cancelLinkRequest(requestId: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`/parent/children/link-requests/${requestId}`);
  },

  /**
   * Unlink a child from parent
   * DELETE /api/parent/children/:studentId/unlink
   */
  async unlinkChild(studentId: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return apiClient.delete<{ success: boolean; message: string }>(`/parent/children/${studentId}/unlink`);
  },

  /**
   * Update relationship type
   * PUT /api/parent/children/:studentId/relationship
   */
  async updateRelationship(studentId: string, relationship: string): Promise<ApiResponse<{ success: boolean; relationship: any; message: string }>> {
    return apiClient.put<{ success: boolean; relationship: any; message: string }>(`/parent/children/${studentId}/relationship`, { relationship });
  },

  /**
   * Get child real-time status
   * GET /api/parent/children/:studentId/status
   */
  async getChildStatus(studentId: string): Promise<ApiResponse<{ status: string; lastSeen: Date; location: any; activeDrill: any }>> {
    return apiClient.get<{ status: string; lastSeen: Date; location: any; activeDrill: any }>(`/parent/children/${studentId}/status`);
  },

  /**
   * Get dashboard summary
   * GET /api/parent/dashboard/summary
   */
  async getDashboardSummary(): Promise<ApiResponse<{
    totalChildren: number;
    safeChildren: number;
    inDrillChildren: number;
    emergencyChildren: number;
    /** @deprecated Use safeChildren */
    safe?: number;
    /** @deprecated Use inDrillChildren */
    inDrill?: number;
    /** @deprecated Use emergencyChildren */
    emergency?: number;
    averagePreparednessScore: number;
    totalModulesCompleted: number;
    activeAlerts?: number;
    pendingDrills?: number;
    activeDrills?: number;
    unreadNotifications?: number;
    recentActivity?: any[];
  }>> {
    return apiClient.get('/parent/dashboard/summary');
  },

  /**
   * Update parent profile
   * PUT /api/parent/profile
   */
  async updateProfile(profileData: {
    name?: string;
    email?: string;
    phone?: string;
    parentProfile?: {
      phoneNumber?: string;
      alternatePhoneNumber?: string;
      relationship?: string;
    };
  }): Promise<ApiResponse<{ user: any }>> {
    return apiClient.put<{ user: any }>('/parent/profile', profileData);
  },

  /**
   * Change parent password
   * PUT /api/parent/profile/password
   */
  async changePassword(oldPassword: string, newPassword: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return apiClient.put<{ success: boolean; message: string }>('/parent/profile/password', { oldPassword, newPassword });
  },  /**
   * Phase 4: Get child activity timeline
   * GET /api/parent/children/:studentId/activity
   */
  async getChildActivity(
    studentId: string,
    options?: {
      page?: number;
      limit?: number;
      activityType?: string;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<ApiResponse<any>> {
    const params = new URLSearchParams();
    if (options?.page) params.append('page', options.page.toString());
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.activityType) params.append('activityType', options.activityType);
    if (options?.startDate) params.append('startDate', options.startDate);
    if (options?.endDate) params.append('endDate', options.endDate);

    const query = params.toString();
    return apiClient.get<any>(
      `/parent/children/${studentId}/activity${query ? `?${query}` : ''}`
    );
  },

  /**
   * Phase 4: Get all QR codes for authenticated parent
   * GET /api/parent/qr-codes
   */
  async getQRCodes(): Promise<ApiResponse<{ qrCodes: any[] }>> {
    return apiClient.get<{ qrCodes: any[] }>('/parent/qr-codes');
  },

  /**
   * Phase 4: Get QR code for a specific child
   * GET /api/parent/qr-code/:studentId
   */
  async getChildQRCode(studentId: string): Promise<ApiResponse<{ qrCode: any; qrCodeImage: string }>> {
    return apiClient.get<{ qrCode: any; qrCodeImage: string }>(`/parent/qr-code/${studentId}`);
  },
};

