/**
 * Phase 3.4.3: Communication API endpoints
 */

import { apiClient, ApiResponse } from './client';

export interface Recipient {
  userId?: string;
  email?: string;
  phone?: string;
  fcmToken?: string;
  name?: string;
}

export interface CommunicationLog {
  _id: string;
  institutionId: string;
  messageId: string;
  type: 'sms' | 'email' | 'push';
  channel: 'sms' | 'email' | 'push';
  recipient: Recipient;
  subject?: string;
  title?: string;
  body: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced' | 'undelivered';
  providerId?: string;
  sentAt?: string;
  deliveredAt?: string;
  failedAt?: string;
  failureReason?: string;
  createdAt: string;
}

export interface DeliveryStatistics {
  byChannel: {
    [channel: string]: {
      total: number;
      byStatus: {
        [status: string]: number;
      };
    };
  };
  byStatus: {
    [status: string]: number;
  };
  total: number;
}

export const communicationApi = {
  /**
   * Send notification
   */
  async sendNotification(data: {
    channel: 'sms' | 'email' | 'push';
    recipient: Recipient;
    subject?: string;
    title?: string;
    body: string;
    templateId?: string;
    templateVariables?: Record<string, any>;
    alertId?: string;
    drillId?: string;
    metadata?: Record<string, any>;
  }): Promise<ApiResponse> {
    return apiClient.post('/communication/send', data);
  },

  /**
   * Send notification with template
   */
  async sendWithTemplate(data: {
    templateId?: string;
    templateName?: string;
    channel: 'sms' | 'email' | 'push';
    recipient: Recipient;
    variables?: Record<string, any>;
    alertId?: string;
    drillId?: string;
    metadata?: Record<string, any>;
  }): Promise<ApiResponse> {
    return apiClient.post('/communication/send-template', data);
  },

  /**
   * Get communication logs
   */
  async getLogs(params?: {
    page?: number;
    limit?: number;
    channel?: 'sms' | 'email' | 'push';
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<{ logs: CommunicationLog[]; pagination: any }>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.channel) queryParams.append('channel', params.channel);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);

    const query = queryParams.toString();
    return apiClient.get(`/communication/logs${query ? `?${query}` : ''}`);
  },

  /**
   * Get delivery statistics
   */
  async getStatistics(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<DeliveryStatistics>> {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);

    const query = queryParams.toString();
    return apiClient.get(`/communication/statistics${query ? `?${query}` : ''}`);
  },
};

