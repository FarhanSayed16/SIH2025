/**
 * Phase 3.4.3: Broadcast API endpoints
 */

import { apiClient, ApiResponse } from './client';

export interface BroadcastRecipients {
  type: 'all' | 'students' | 'teachers' | 'parents' | 'admins' | 'custom';
  userIds?: string[];
  classIds?: string[];
}

export interface BroadcastMessage {
  _id: string;
  institutionId: string;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  type: 'emergency' | 'announcement' | 'drill' | 'general';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  recipients: BroadcastRecipients;
  channels: ('sms' | 'email' | 'push')[];
  subject?: string;
  title?: string;
  message: string;
  templateId?: string;
  scheduledAt?: string;
  sentAt?: string;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed' | 'cancelled';
  stats: {
    totalRecipients: number;
    sent: number;
    delivered: number;
    failed: number;
    pending: number;
  };
  createdAt: string;
  updatedAt: string;
}

export const broadcastApi = {
  /**
   * Send broadcast
   */
  async send(data: {
    type: 'emergency' | 'announcement' | 'drill' | 'general';
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    recipients: BroadcastRecipients;
    channels: ('sms' | 'email' | 'push')[];
    subject?: string;
    title?: string;
    message: string;
    templateId?: string;
    templateVariables?: Record<string, any>;
    alertId?: string;
    drillId?: string;
    metadata?: Record<string, any>;
  }): Promise<ApiResponse> {
    return apiClient.post('/broadcast/send', data);
  },

  /**
   * Schedule broadcast
   */
  async schedule(data: {
    scheduledAt: string;
    type: 'emergency' | 'announcement' | 'drill' | 'general';
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    recipients: BroadcastRecipients;
    channels: ('sms' | 'email' | 'push')[];
    subject?: string;
    title?: string;
    message: string;
    templateId?: string;
    templateVariables?: Record<string, any>;
  }): Promise<ApiResponse> {
    return apiClient.post('/broadcast/schedule', data);
  },

  /**
   * Get broadcasts
   */
  async getBroadcasts(params?: {
    page?: number;
    limit?: number;
    type?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<{ broadcasts: BroadcastMessage[]; pagination: any }>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.type) queryParams.append('type', params.type);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);

    const query = queryParams.toString();
    return apiClient.get(`/broadcast${query ? `?${query}` : ''}`);
  },

  /**
   * Get broadcast by ID
   */
  async getBroadcastById(id: string): Promise<ApiResponse<BroadcastMessage>> {
    return apiClient.get(`/broadcast/${id}`);
  },

  /**
   * Get broadcast statistics
   */
  async getStats(id: string): Promise<ApiResponse> {
    return apiClient.get(`/broadcast/${id}/stats`);
  },
};

