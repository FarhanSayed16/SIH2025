/**
 * Classes API client
 * PHASE C: Admin class management endpoints
 */

import { apiClient, ApiResponse } from './client';

export interface Class {
  _id: string;
  institutionId: string | { _id: string; name: string };
  grade: string;
  section: string;
  classCode: string;
  teacherId: string | { _id: string; name: string; email: string };
  studentIds?: string[];
  roomNumber?: string;
  capacity?: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateClassRequest {
  institutionId: string;
  grade: string;
  section: string;
  teacherId?: string; // Made optional - can be assigned later
  academicYear?: string; // Optional - defaults to current academic year
  roomNumber?: string;
  capacity?: number;
}

export const classesApi = {
  /**
   * Create a new class (Admin only)
   * POST /api/admin/classes
   */
  async create(data: CreateClassRequest): Promise<ApiResponse<{ class: Class }>> {
    return apiClient.post<{ class: Class }>('/admin/classes', data);
  },

  /**
   * List classes (Admin only)
   * GET /api/admin/classes
   */
  async list(filters?: {
    page?: number;
    limit?: number;
    institutionId?: string;
    teacherId?: string;
    grade?: string;
    section?: string;
    academicYear?: string;
    includeInactive?: boolean;
  }): Promise<ApiResponse<{ classes: Class[]; total: number; page: number; limit: number; totalPages: number }>> {
    const queryParams = new URLSearchParams();
    if (filters?.page) queryParams.append('page', filters.page.toString());
    if (filters?.limit) queryParams.append('limit', filters.limit.toString());
    if (filters?.institutionId) queryParams.append('institutionId', filters.institutionId);
    if (filters?.teacherId) queryParams.append('teacherId', filters.teacherId);
    if (filters?.grade) queryParams.append('grade', filters.grade);
    if (filters?.section) queryParams.append('section', filters.section);
    if (filters?.academicYear) queryParams.append('academicYear', filters.academicYear);
    if (filters?.includeInactive !== undefined) queryParams.append('includeInactive', filters.includeInactive ? 'true' : 'false');

    const query = queryParams.toString();
    const response = await apiClient.get<any>(
      `/admin/classes${query ? `?${query}` : ''}`
    );
    
    // Transform paginated response to expected format (similar to usersApi.list)
    // Backend paginatedResponse returns: { success: true, data: { classes: [...] }, pagination: {...} }
    if (response.success && response.data) {
      let classes: Class[] = [];
      
      // Handle different response formats
      if (Array.isArray(response.data)) {
        // Direct array (old format)
        classes = response.data;
      } else if (response.data && typeof response.data === 'object' && 'classes' in response.data) {
        // New format: { classes: [...] }
        classes = (response.data as any).classes || [];
      }
      
      // Get pagination from response (it's at the root level, not nested)
      const pagination = (response as any).pagination || {};
      
      return {
        ...response,
        data: {
          classes,
          total: pagination.total || classes.length,
          page: pagination.page || filters?.page || 1,
          limit: pagination.limit || filters?.limit || 100,
          totalPages: pagination.totalPages || Math.ceil((pagination.total || classes.length) / (pagination.limit || filters?.limit || 100))
        }
      };
    }
    
    return response;
  },

  /**
   * Get class by ID
   * GET /api/admin/classes/:id
   */
  async getById(id: string): Promise<ApiResponse<{ class: Class }>> {
    return apiClient.get<{ class: Class }>(`/admin/classes/${id}`);
  },

  /**
   * Update class
   * PUT /api/admin/classes/:id
   */
  async update(id: string, updates: Partial<Class>): Promise<ApiResponse<{ class: Class }>> {
    return apiClient.put<{ class: Class }>(`/admin/classes/${id}`, updates);
  },

  /**
   * PHASE B5: Assign/Reassign teacher to class (or remove if teacherId is empty)
   * PUT /api/admin/classes/:id/assign-teacher
   */
  async assignTeacher(id: string, teacherId: string | null | '' | undefined): Promise<ApiResponse<{ class: Class }>> {
    // Backend validation accepts: empty string, null, undefined, or valid MongoId
    // Match the working implementation exactly: send empty string for removal, valid ID for assignment
    // If teacherId is provided and not empty, use it; otherwise send empty string
    const payload: { teacherId: string | '' } = {
      teacherId: (teacherId && teacherId.trim() !== '') ? teacherId.trim() : ''
    };
    
    return apiClient.put<{ class: Class }>(`/admin/classes/${id}/assign-teacher`, payload);
  },

  /**
   * Delete a single class
   * DELETE /api/admin/classes/:id
   */
  async delete(id: string): Promise<ApiResponse<{ deleted: boolean; classCode: string }>> {
    return apiClient.delete<{ deleted: boolean; classCode: string }>(`/admin/classes/${id}`);
  },

  /**
   * Cleanup endpoint - Delete all classes for a test institution (ONE-TIME USE)
   * DELETE /api/admin/classes/cleanup
   * WARNING: Destructive operation
   */
  async cleanup(institutionId: string): Promise<ApiResponse<{ deleted: number; institutionId: string }>> {
    return apiClient.delete<{ deleted: number; institutionId: string }>('/admin/classes/cleanup', {
      institutionId,
      confirm: 'DELETE_ALL_CLASSES'
    });
  }
};

