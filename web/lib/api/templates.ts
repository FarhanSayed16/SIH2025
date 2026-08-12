/**
 * Phase 3.4.3: Message Template API endpoints
 */

import { apiClient, ApiResponse } from './client';

export interface MessageTemplate {
  _id: string;
  name: string;
  institutionId?: string;
  category: 'emergency' | 'drill' | 'announcement' | 'parent' | 'general';
  channels: ('sms' | 'email' | 'push')[];
  content: {
    sms?: {
      body: string;
    };
    email?: {
      subject: string;
      body: string;
      htmlBody?: string;
    };
    push?: {
      title: string;
      body: string;
    };
  };
  variables?: Array<{
    name: string;
    description?: string;
    defaultValue?: string;
  }>;
  isActive: boolean;
  isGlobal: boolean;
  createdBy?: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export const templatesApi = {
  /**
   * Create template
   */
  async create(data: {
    name: string;
    category: 'emergency' | 'drill' | 'announcement' | 'parent' | 'general';
    channels: ('sms' | 'email' | 'push')[];
    content: MessageTemplate['content'];
    variables?: MessageTemplate['variables'];
    isGlobal?: boolean;
  }): Promise<ApiResponse<MessageTemplate>> {
    return apiClient.post('/templates', data);
  },

  /**
   * Get templates
   */
  async getTemplates(params?: {
    category?: string;
    channel?: 'sms' | 'email' | 'push';
  }): Promise<ApiResponse<MessageTemplate[]>> {
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.append('category', params.category);
    if (params?.channel) queryParams.append('channel', params.channel);

    const query = queryParams.toString();
    return apiClient.get(`/templates${query ? `?${query}` : ''}`);
  },

  /**
   * Get template by ID
   */
  async getTemplateById(id: string): Promise<ApiResponse<MessageTemplate>> {
    return apiClient.get(`/templates/${id}`);
  },

  /**
   * Update template
   */
  async update(id: string, data: Partial<MessageTemplate>): Promise<ApiResponse<MessageTemplate>> {
    return apiClient.put(`/templates/${id}`, data);
  },

  /**
   * Delete template
   */
  async delete(id: string): Promise<ApiResponse> {
    return apiClient.delete(`/templates/${id}`);
  },

  /**
   * Preview template
   */
  async preview(id: string, channel: 'sms' | 'email' | 'push', variables?: Record<string, any>): Promise<ApiResponse> {
    return apiClient.post(`/templates/${id}/preview`, { channel, variables });
  },
};

