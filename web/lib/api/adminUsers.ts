/**
 * Admin User Creation API Client
 * Phase 2: Admin endpoints for creating teachers, students, and parents
 */

import { apiClient, ApiResponse } from './client';

export interface AdminUser {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  role: 'teacher' | 'student' | 'parent';
  userType: 'account_user' | 'roster_record';
  institutionId?: string;
  grade?: string;
  section?: string;
  rollNo?: string;
  parentName?: string;
  parentPhone?: string;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTeacherPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
  institutionId?: string; // Only required if admin has no institutionId
}

export interface CreateStudentPayload {
  name: string;
  grade: 'KG' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12';
  section: string;
  rollNo?: string;
  parentName?: string;
  parentPhone?: string;
  parentId?: string;
  institutionId?: string; // Only required if admin has no institutionId
}

export interface CreateParentPayload {
  name: string;
  phone: string;
  password: string;
  email?: string;
  institutionId?: string; // Only required if admin has no institutionId
}

export interface AdminUserResponse {
  user: AdminUser;
}

export const adminUsersApi = {
  /**
   * Create a teacher
   * POST /api/admin/users/teacher
   */
  async createTeacher(payload: CreateTeacherPayload): Promise<ApiResponse<AdminUserResponse>> {
    return apiClient.post('/admin/users/teacher', payload);
  },

  /**
   * Create a student (roster record)
   * POST /api/admin/users/student
   */
  async createStudent(payload: CreateStudentPayload): Promise<ApiResponse<AdminUserResponse>> {
    return apiClient.post('/admin/users/student', payload);
  },

  /**
   * Create a parent
   * POST /api/admin/users/parent
   */
  async createParent(payload: CreateParentPayload): Promise<ApiResponse<AdminUserResponse>> {
    return apiClient.post('/admin/users/parent', payload);
  },
};

