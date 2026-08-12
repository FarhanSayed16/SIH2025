/**
 * Schools API client
 * For managing schools/institutions
 */

import { apiClient, ApiResponse } from './client';

export interface School {
  _id: string;
  name: string;
  address?: string;
  contact?: {
    email?: string;
    phone?: string;
  };
  isActive: boolean;
}

export const schoolsApi = {
  /**
   * List all schools
   * GET /api/schools
   */
  async list(): Promise<ApiResponse<School[]>> {
    return apiClient.get<School[]>('/schools');
  },

  /**
   * Get school by ID
   * GET /api/schools/:id
   */
  async getById(id: string): Promise<ApiResponse<{ school: School }>> {
    return apiClient.get<{ school: School }>(`/schools/${id}`);
  },
};

