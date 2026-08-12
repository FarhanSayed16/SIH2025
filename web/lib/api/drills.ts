/**
 * Drills API endpoints
 */

import { apiClient, ApiResponse } from './client';

export interface Drill {
  _id: string;
  schoolId: string;
  type: 'fire' | 'earthquake' | 'flood' | 'cyclone' | 'stampede' | 'heatwave';
  scheduledAt: string;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  participants?: string[];
  acknowledgedBy?: string[];
  completionTime?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDrillRequest {
  schoolId: string;
  type: Drill['type'];
  scheduledAt: string;
  classId?: string; // RBAC Refinement: Allow teachers to schedule drills for specific classes
  participantSelection?: {
    type: 'all' | 'class' | 'grade' | 'specific';
    classIds?: string[];
    grades?: string[];
    userIds?: string[];
  };
}

export const drillsApi = {
  list: async (schoolId?: string): Promise<ApiResponse<Drill[]>> => {
    const query = schoolId ? `?schoolId=${schoolId}` : '';
    return apiClient.get<Drill[]>(`/drills${query}`);
  },

  create: async (data: CreateDrillRequest): Promise<ApiResponse<Drill>> => {
    return apiClient.post<Drill>('/drills', data);
  },

  getById: async (id: string): Promise<ApiResponse<Drill>> => {
    return apiClient.get<Drill>(`/drills/${id}`);
  },

  trigger: async (id: string): Promise<ApiResponse<Drill>> => {
    return apiClient.post<Drill>(`/drills/${id}/trigger`);
  },

  // Phase 4: Get active drills
  getActive: async (): Promise<ApiResponse<{ drills: Drill[] }>> => {
    return apiClient.get<{ drills: Drill[] }>('/drills/active');
  },

  // Phase 4: Get drill participants
  getParticipants: async (id: string): Promise<ApiResponse<any>> => {
    return apiClient.get<any>(`/drills/${id}/participants`);
  },

  // Phase 4: Get drill summary
  getSummary: async (id: string): Promise<ApiResponse<any>> => {
    return apiClient.get<any>(`/drills/${id}/summary`);
  },

  // Phase 4: End drill
  end: async (id: string): Promise<ApiResponse<Drill>> => {
    return apiClient.post<Drill>(`/drills/${id}/end`);
  },
};

