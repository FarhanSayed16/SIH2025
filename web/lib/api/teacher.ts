/**
 * Teacher API client
 * PHASE C: Teacher endpoints for class and student management
 */

import { apiClient, ApiResponse } from './client';

export interface PendingStudent {
  id: string; // PHASE 2: Changed from _id to id
  name: string;
  email: string;
  grade?: string;
  section?: string;
  phone?: string;
  createdAt: string;
  requestedAt: string; // PHASE 2: Added requestedAt from ClassroomJoinRequest
  joinMethod?: 'qr' | 'classCode' | 'admin' | 'migrated'; // PHASE 2: Added joinMethod
}

export interface ClassStudent {
  _id: string;
  name: string;
  email?: string;
  grade?: string;
  section?: string;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  userType?: 'account_user' | 'roster_record';
  phone?: string;
  createdAt: string;
}

export const teacherApi = {
  /**
   * Get teacher's classes
   * GET /api/teacher/classes
   */
  async getClasses(): Promise<ApiResponse<{ classes: any[] }>> {
    return apiClient.get<{ classes: any[] }>('/teacher/classes');
  },

  /**
   * Get students in a class
   * GET /api/teacher/classes/:classId/students
   */
  async getClassStudents(classId: string): Promise<ApiResponse<any>> {
    return apiClient.get<any>(`/teacher/classes/${classId}/students`);
  },

  /**
   * PHASE B3: Get pending students for a class
   * GET /api/teacher/classes/:classId/students/pending
   */
  async getPendingStudents(classId: string): Promise<ApiResponse<{ students: PendingStudent[] }>> {
    return apiClient.get<{ students: PendingStudent[] }>(`/teacher/classes/${classId}/students/pending`);
  },

  /**
   * PHASE B3: Approve a student
   * POST /api/teacher/classes/:classId/students/:studentId/approve
   */
  async approveStudent(
    classId: string,
    studentId: string,
    notes?: string
  ): Promise<ApiResponse<{ user: any }>> {
    return apiClient.post<{ user: any }>(`/teacher/classes/${classId}/students/${studentId}/approve`, {
      notes: notes || undefined
    });
  },

  /**
   * PHASE B3: Reject a student
   * POST /api/teacher/classes/:classId/students/:studentId/reject
   */
  async rejectStudent(
    classId: string,
    studentId: string,
    reason?: string
  ): Promise<ApiResponse<{ user: any }>> {
    return apiClient.post<{ user: any }>(`/teacher/classes/${classId}/students/${studentId}/reject`, {
      reason: reason || undefined
    });
  },

  /**
   * PHASE B4: Create roster student (KG-4)
   * POST /api/teacher/classes/:classId/roster-students
   */
  async createRosterStudent(
    classId: string,
    studentInfo: {
      name: string;
      parentName?: string;
      parentPhone?: string;
      notes?: string;
    }
  ): Promise<ApiResponse<{ user: any }>> {
    return apiClient.post<{ user: any }>(`/teacher/classes/${classId}/roster-students`, studentInfo);
  },

  /**
   * Get student progress for a class
   * GET /api/teacher/classes/:classId/progress
   */
  async getStudentProgress(classId: string): Promise<ApiResponse<any>> {
    return apiClient.get<any>(`/teacher/classes/${classId}/progress`);
  },

  /**
   * Get class analytics
   * GET /api/teacher/classes/:classId/analytics
   */
  async getClassAnalytics(classId: string): Promise<ApiResponse<any>> {
    return apiClient.get<any>(`/teacher/classes/${classId}/analytics`);
  },

  /**
   * Phase 4: Start drill for class
   * POST /api/teacher/classes/:classId/drills/start
   */
  async startClassDrill(
    classId: string,
    drillType: 'fire' | 'earthquake' | 'flood' | 'cyclone' | 'stampede' | 'heatwave'
  ): Promise<ApiResponse<any>> {
    return apiClient.post<any>(`/teacher/classes/${classId}/drills/start`, {
      drillType,
    });
  },

  /**
   * Phase 4: Get class drill summary
   * GET /api/teacher/classes/:classId/drills/summary
   */
  async getClassDrillSummary(classId: string): Promise<ApiResponse<any>> {
    return apiClient.get<any>(`/teacher/classes/${classId}/drills/summary`);
  },

  /**
   * Phase 4: Get parents for a specific student
   * GET /api/teacher/students/:studentId/parents
   */
  async getStudentParents(studentId: string): Promise<ApiResponse<{ parents: any[] }>> {
    return apiClient.get<{ parents: any[] }>(`/teacher/students/${studentId}/parents`);
  },

  /**
   * Phase 4: Get all parents for a class
   * GET /api/teacher/classes/:classId/parents
   */
  async getClassParents(classId: string): Promise<ApiResponse<{ parents: any[] }>> {
    return apiClient.get<{ parents: any[] }>(`/teacher/classes/${classId}/parents`);
  },

  /**
   * Phase 4: Verify parent by QR code
   * POST /api/teacher/parents/verify-qr
   */
  async verifyParentByQR(data: {
    qrCodeData: string;
    location?: { lat: number; lng: number };
  }): Promise<ApiResponse<any>> {
    return apiClient.post<any>('/teacher/parents/verify-qr', data);
  },
};

