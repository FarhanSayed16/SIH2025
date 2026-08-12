/**
 * Student API Client
 * Handles student-specific API calls (join/leave class)
 */

import { apiClient, ApiResponse } from './client';

export interface JoinClassRequest {
  classCode: string;
}

export interface JoinClassResponse {
  success: boolean;
  message: string;
  data: {
    user: {
      id: string;
      email: string;
      name: string;
      classId?: string;
      grade?: string;
      section?: string;
      approvalStatus: 'pending' | 'approved' | 'rejected';
    };
  };
}

export interface LeaveClassResponse {
  success: boolean;
  message: string;
  data: {
    user: {
      id: string;
      email: string;
      name: string;
      classId?: string;
      grade?: string;
      section?: string;
      approvalStatus: 'pending' | 'approved' | 'rejected';
    };
  };
}

/**
 * Join a class using classCode
 * POST /api/student/join-class
 */
export const joinClass = async (classCode: string): Promise<JoinClassResponse> => {
  const response = await apiClient.post<JoinClassResponse>('/student/join-class', {
    classCode: classCode.trim(),
  });
  return response.data;
};

/**
 * Leave current class
 * POST /api/student/leave-class
 */
export const leaveClass = async (): Promise<LeaveClassResponse> => {
  const response = await apiClient.post<LeaveClassResponse>('/student/leave-class');
  return response.data;
};

/**
 * Get student's current class information
 * Uses the auth profile endpoint which returns user with class info
 * GET /api/auth/profile
 */
export const getStudentClassInfo = async (): Promise<ApiResponse<any>> => {
  return apiClient.get('/auth/profile');
};

