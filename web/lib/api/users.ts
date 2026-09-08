/**
 * Users API client
 * Phase 3.5.4: Advanced Admin Features
 */

import { apiClient, ApiResponse } from './client';

export interface User {
  _id: string;
  email: string;
  name: string;
  role: 'admin' | 'SYSTEM_ADMIN' | 'teacher' | 'student' | 'parent';
  institutionId?: {
    _id: string;
    name: string;
  };
  grade?: string;
  section?: string;
  classId?: string;
  accessLevel?: string;
  canUseApp?: boolean;
  requiresTeacherAuth?: boolean;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
  // RBAC Refinement: Approval fields
  approvalStatus?: 'pending' | 'registered' | 'approved' | 'rejected';
  userType?: 'account_user' | 'roster_record';
}

export interface BulkUserOperation {
  userIds: string[];
  action: 'activate' | 'deactivate' | 'delete';
}

export interface UserFilters {
  role?: string;
  institutionId?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  approvalStatus?: string; // RBAC Refinement: Filter by approval status
}

export const usersApi = {
  /**
   * List users with filters and pagination
   */
  async list(filters: UserFilters = {}): Promise<ApiResponse<{ users: User[]; total: number; page: number; limit: number }>> {
    const params = new URLSearchParams();
    if (filters.role) params.append('role', filters.role);
    if (filters.institutionId) params.append('institutionId', filters.institutionId);
    if (filters.isActive !== undefined) params.append('isActive', String(filters.isActive));
    if (filters.search) params.append('search', filters.search);
    if (filters.approvalStatus) params.append('approvalStatus', filters.approvalStatus);
    if (filters.page) params.append('page', String(filters.page));
    if (filters.limit) params.append('limit', String(filters.limit));

    const queryString = params.toString();
    const response = await apiClient.get<User[] | { users: User[] }>(`/users${queryString ? `?${queryString}` : ''}`);
    
    // Transform paginated response to expected format
    if (response.success && response.data) {
      const users = Array.isArray(response.data) ? response.data : response.data.users || [];
      const pagination = response.pagination;
      
      return {
        ...response,
        data: {
          users,
          total: pagination?.total ?? users.length,
          page: pagination?.page ?? filters.page ?? 1,
          limit: pagination?.limit ?? filters.limit ?? 20
        }
      };
    }
    
    return { ...response, data: undefined };
  },

  /**
   * Get user by ID
   */
  async getById(userId: string): Promise<ApiResponse<{ user: User }>> {
    return apiClient.get(`/users/${userId}`);
  },

  /**
   * Update user
   */
  async update(userId: string, updates: Omit<Partial<User>, 'institutionId'> & { institutionId?: string }): Promise<ApiResponse<{ user: User }>> {
    return apiClient.put(`/users/${userId}`, updates);
  },

  /**
   * Approve student (Teacher/Admin)
   */
  async approveStudent(userId: string, notes?: string): Promise<ApiResponse<{ user: User }>> {
    return apiClient.put(`/users/${userId}`, {
      approvalStatus: 'approved',
    });
  },

  /**
   * Reject student (Teacher/Admin)
   */
  async rejectStudent(userId: string, reason?: string): Promise<ApiResponse<{ user: User }>> {
    return apiClient.put(`/users/${userId}`, {
      approvalStatus: 'rejected',
      rejectionReason: reason,
    });
  },

  /**
   * Bulk operations on users
   */
  async bulkOperation(operation: BulkUserOperation): Promise<ApiResponse<{ affected: number; results: any[] }>> {
    return apiClient.post('/users/bulk', operation);
  },

  /**
   * Export users to CSV/Excel
   */
  async export(format: 'csv' | 'excel', filters?: UserFilters): Promise<ApiResponse<{ downloadUrl: string }>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, String(value));
      });
    }
    params.append('format', format);

    return apiClient.get(`/users/export?${params.toString()}`);
  },

  /**
   * Approve a teacher (Admin only)
   * PUT /api/admin/users/:userId/approve
   */
  async approveUser(userId: string): Promise<ApiResponse<{ user: User }>> {
    return apiClient.put<{ user: User }>(`/admin/users/${userId}/approve`);
  },

  /**
   * Assign institution to a user (Admin only)
   * PUT /api/admin/users/:userId/assign-institution
   */
  async assignInstitution(userId: string, institutionId: string): Promise<ApiResponse<{ user: User }>> {
    return apiClient.put<{ user: User }>(`/admin/users/${userId}/assign-institution`, { institutionId });
  },

  /**
   * Reject a teacher (Admin only)
   * PUT /api/admin/users/:userId/reject
   */
  async rejectUser(userId: string, reason?: string): Promise<ApiResponse<{ user: User }>> {
    return apiClient.put<{ user: User }>(`/admin/users/${userId}/reject`, { reason });
  },

  /**
   * Delete a teacher (Admin only)
   * DELETE /api/admin/users/:userId
   */
  async deleteUser(userId: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete<{ message: string }>(`/admin/users/${userId}`);
  },

  async updateSafetyStatus(userId: string, status: 'safe' | 'missing' | 'at_risk' | 'evacuating') {
    return apiClient.put(`/users/${userId}/safety-status`, { status });
  },
};

