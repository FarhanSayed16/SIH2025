/**
 * Phase 4.4/4.5: Alert Status API endpoints
 */

import { apiClient, ApiResponse } from './client';

export interface AlertStatusSummary {
  alertId: string;
  alertType: string;
  alertTitle: string;
  institutionId: string;
  createdAt: string;
  counts: {
    safe: number;
    help: number;
    missing: number;
    at_risk: number;
    potentially_trapped: number;
    total: number;
  };
  percentages: {
    safe: number;
    help: number;
    missing: number;
    at_risk: number;
    potentially_trapped: number;
  };
  lastUpdated: string;
}

export interface AlertStatus {
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  userGrade?: string;
  userSection?: string;
  status: string;
  lastUpdate: string;
  location?: {
    coordinates: [number, number];
  };
}

export const alertStatusApi = {
  /**
   * Get status summary for an alert
   * GET /api/alerts/:alertId/summary
   */
  getSummary: async (alertId: string): Promise<ApiResponse<AlertStatusSummary>> => {
    return apiClient.get<AlertStatusSummary>(`/alerts/${alertId}/summary`);
  },

  /**
   * Get all user statuses for an alert
   * GET /api/alerts/:alertId/status
   */
  getStatuses: async (alertId: string): Promise<ApiResponse<{ statuses: AlertStatus[] }>> => {
    return apiClient.get<{ statuses: AlertStatus[] }>(`/alerts/${alertId}/status`);
  },
};

