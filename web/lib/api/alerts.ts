/**
 * Alerts API endpoints
 */

import { apiClient, ApiResponse } from './client';

export interface Alert {
  _id: string;
  schoolId: string;
  institutionId?: string;
  type: 'fire' | 'earthquake' | 'flood' | 'cyclone' | 'stampede' | 'heatwave' | 'medical' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message?: string;
  title?: string;
  description?: string;
  location?: {
    type: 'Point';
    coordinates: [number, number];
  };
  locationDetails?: {
    building?: string;
    floor?: string;
    room?: string;
  };
  triggeredBy: string;
  status: 'active' | 'resolved' | 'false_alarm';
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAlertRequest {
  schoolId: string;
  type: Alert['type'];
  severity: Alert['severity'];
  message: string;
  location?: {
    lat: number;
    lng: number;
  };
}

export const alertsApi = {
  list: async (schoolId?: string): Promise<ApiResponse<Alert[]>> => {
    const query = schoolId ? `?schoolId=${schoolId}` : '';
    return apiClient.get<Alert[]>(`/alerts${query}`);
  },

  create: async (data: CreateAlertRequest): Promise<ApiResponse<Alert>> => {
    const payload = {
      ...data,
      location: data.location ? {
        type: 'Point',
        coordinates: [data.location.lng, data.location.lat],
      } : undefined,
    };
    return apiClient.post<Alert>('/alerts', payload);
  },

  getById: async (id: string): Promise<ApiResponse<Alert>> => {
    return apiClient.get<Alert>(`/alerts/${id}`);
  },

  resolve: async (id: string): Promise<ApiResponse<Alert>> => {
    return apiClient.put<Alert>(`/alerts/${id}/resolve`);
  },

  cancel: async (id: string, reason?: string): Promise<ApiResponse<Alert>> => {
    return apiClient.post<Alert>(`/alerts/${id}/cancel`, { reason });
  },
};

