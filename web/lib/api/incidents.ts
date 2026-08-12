/**
 * Phase 4.10: Incidents API client
 * For managing incident history and alert logs
 */

import { apiClient, ApiResponse } from './client';

export interface IncidentAction {
  userId: string;
  action: 'created' | 'acknowledged' | 'status_updated' | 'resolved' | 'cancelled' | 'escalated';
  timestamp: string;
  details?: Record<string, any>;
}

export interface Incident {
  _id: string;
  alertId?: string | null;
  source: 'iot' | 'admin' | 'teacher' | 'ai' | 'ndma' | 'system' | 'historical';
  sourceDetails: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'fire' | 'earthquake' | 'flood' | 'cyclone' | 'stampede' | 'medical' | 'other';
  institutionId: string;
  affectedUsers: string[];
  actions: IncidentAction[];
  metadata: Record<string, any>;
  status: 'active' | 'resolved' | 'false_alarm' | 'cancelled';
  resolvedAt?: string;
  resolvedBy?: string;
  createdAt: string;
  updatedAt: string;
  // Historical Incident Fields
  isHistorical?: boolean;
  historicalDate?: string;
  addedBy?: string;
  addedAt?: string;
  historicalDetails?: {
    originalSource?: 'news' | 'records' | 'government' | 'witness' | 'other';
    verifiedBy?: string;
    verificationDate?: string;
    documentation?: string[];
    lessonsLearned?: string;
    precautionsTaken?: string;
    improvementsMade?: string;
    relatedIncidents?: string[];
  };
  impact?: {
    casualties?: {
      fatal?: number;
      injured?: number;
      evacuated?: number;
    };
    propertyDamage?: {
      severity?: 'none' | 'minor' | 'moderate' | 'severe' | 'extensive';
      estimatedCost?: number;
    };
    duration?: number;
    affectedArea?: string;
  };
  response?: {
    responseTime?: number;
    responseTeam?: string[];
    actionsTaken?: string[];
    effectiveness?: 'excellent' | 'good' | 'adequate' | 'poor';
  };
  title?: string;
  description?: string;
  location?: {
    type: string;
    coordinates: number[];
  };
}

export interface IncidentStats {
  total: number;
  active?: number;
  resolved?: number;
  historical?: number;
  bySource: Record<string, number>;
  byStatus: Record<string, number>;
  bySeverity: Record<string, number>;
  byType: Record<string, number>;
}

export interface IncidentQueryParams {
  institutionId?: string;
  source?: 'iot' | 'admin' | 'teacher' | 'ai' | 'ndma' | 'system' | 'historical';
  status?: 'active' | 'resolved' | 'false_alarm' | 'cancelled';
  type?: 'fire' | 'earthquake' | 'flood' | 'cyclone' | 'stampede' | 'medical' | 'other';
  severity?: 'low' | 'medium' | 'high' | 'critical';
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  includeHistorical?: boolean;
}

export interface CreateHistoricalIncidentRequest {
  type: 'fire' | 'earthquake' | 'flood' | 'cyclone' | 'stampede' | 'medical' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  historicalDate: string;
  title: string;
  description?: string;
  location?: {
    type: string;
    coordinates: number[];
  };
  impact?: {
    casualties?: {
      fatal?: number;
      injured?: number;
      evacuated?: number;
    };
    propertyDamage?: {
      severity?: 'none' | 'minor' | 'moderate' | 'severe' | 'extensive';
      estimatedCost?: number;
    };
    duration?: number;
    affectedArea?: string;
  };
  response?: {
    responseTime?: number;
    responseTeam?: string[];
    actionsTaken?: string[];
    effectiveness?: 'excellent' | 'good' | 'adequate' | 'poor';
  };
  historicalDetails?: {
    originalSource?: 'news' | 'records' | 'government' | 'witness' | 'other';
    verifiedBy?: string;
    verificationDate?: string;
    documentation?: string[];
    lessonsLearned?: string;
    precautionsTaken?: string;
    improvementsMade?: string;
    relatedIncidents?: string[];
  };
  affectedUsers?: string[];
  metadata?: Record<string, any>;
}

export const incidentsApi = {
  /**
   * Get incident history
   */
  list: async (params?: IncidentQueryParams): Promise<ApiResponse<{
    incidents: Incident[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }>> => {
    const queryParams = new URLSearchParams();
    if (params?.institutionId) queryParams.append('institutionId', params.institutionId);
    if (params?.source) queryParams.append('source', params.source);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.type) queryParams.append('type', params.type);
    if (params?.severity) queryParams.append('severity', params.severity);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const query = queryParams.toString();
    return apiClient.get(`/incidents${query ? `?${query}` : ''}`);
  },

  /**
   * Get incident details
   */
  getById: async (id: string): Promise<ApiResponse<Incident>> => {
    return apiClient.get(`/incidents/${id}`);
  },

  /**
   * Get incident statistics
   */
  getStats: async (params?: {
    institutionId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<IncidentStats>> => {
    const queryParams = new URLSearchParams();
    if (params?.institutionId) queryParams.append('institutionId', params.institutionId);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);

    const query = queryParams.toString();
    return apiClient.get(`/incidents/stats${query ? `?${query}` : ''}`);
  },

  /**
   * Export incident report to PDF
   */
  exportPDF: async (params?: IncidentQueryParams): Promise<Blob> => {
    const queryParams = new URLSearchParams();
    if (params?.institutionId) queryParams.append('institutionId', params.institutionId);
    if (params?.source) queryParams.append('source', params.source);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);

    const query = queryParams.toString();
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/incidents/export/pdf${query ? `?${query}` : ''}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to export PDF');
    }

    return response.blob();
  },

  /**
   * Create historical incident
   */
  createHistorical: async (data: CreateHistoricalIncidentRequest): Promise<ApiResponse<Incident>> => {
    return apiClient.post('/incidents/historical', data);
  },

  /**
   * Get historical incidents
   */
  getHistorical: async (params?: {
    institutionId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{
    incidents: Incident[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }>> => {
    const queryParams = new URLSearchParams();
    if (params?.institutionId) queryParams.append('institutionId', params.institutionId);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const query = queryParams.toString();
    return apiClient.get(`/incidents/historical${query ? `?${query}` : ''}`);
  },

  /**
   * Update historical incident
   */
  updateHistorical: async (id: string, data: Partial<CreateHistoricalIncidentRequest>): Promise<ApiResponse<Incident>> => {
    return apiClient.put(`/incidents/historical/${id}`, data);
  },

  /**
   * Delete historical incident
   */
  deleteHistorical: async (id: string): Promise<ApiResponse<void>> => {
    return apiClient.delete(`/incidents/historical/${id}`);
  },

  /**
   * Get historical incident statistics
   */
  getHistoricalStats: async (params?: {
    institutionId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<IncidentStats>> => {
    const queryParams = new URLSearchParams();
    if (params?.institutionId) queryParams.append('institutionId', params.institutionId);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);

    const query = queryParams.toString();
    return apiClient.get(`/incidents/historical/stats${query ? `?${query}` : ''}`);
  },
};

