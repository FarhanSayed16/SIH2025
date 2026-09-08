/**
 * Authentication API endpoints
 */

import { apiClient, ApiResponse } from './client';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    institutionId?: string;
    approvalStatus?: 'pending' | 'approved' | 'rejected';
  };
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role: string;
  institutionId?: string;
  phone?: string;
}

export const authApi = {
  login: async (credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> => {
    try {
      const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
      if (response.success && response.data) {
        apiClient.setToken(response.data.accessToken);
        if (response.data.refreshToken) {
          apiClient.setRefreshToken(response.data.refreshToken);
        }
        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', response.data.accessToken);
        }
      }
      return response;
    } catch (error: any) {
      // Extract field errors from error response
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        const fieldErrors: Record<string, string> = {};
        
        // Check for new formatted errors structure
        if (errors.fields) {
          Object.assign(fieldErrors, errors.fields);
        }
        
        // Also check for details array (backward compatibility)
        if (errors.details && Array.isArray(errors.details)) {
          errors.details.forEach((detail: any) => {
            const param = detail.param || detail.path;
            const msg = detail.msg;
            if (param && msg) {
              fieldErrors[param] = msg;
            }
          });
        }
        
        (error as any).fieldErrors = fieldErrors;
      }
      throw error;
    }
  },

  register: async (data: RegisterRequest): Promise<ApiResponse<LoginResponse>> => {
    const response = await apiClient.post<LoginResponse>('/auth/register', data);
    if (response.success && response.data) {
      apiClient.setToken(response.data.accessToken);
      if (response.data.refreshToken) {
        apiClient.setRefreshToken(response.data.refreshToken);
      }
    }
    return response;
  },

  logout: async (): Promise<ApiResponse> => {
    const response = await apiClient.post('/auth/logout');
    apiClient.setToken(null);
    apiClient.setRefreshToken(null);
    return response;
  },

  refreshToken: async (refreshToken: string): Promise<ApiResponse<{ accessToken: string }>> => {
    return apiClient.post('/auth/refresh', { refreshToken });
  },

  getProfile: async (): Promise<ApiResponse<{ user: Omit<LoginResponse['user'], 'institutionId'> & { _id?: string; institutionId?: string | { _id: string } | null } }>> => {
    return apiClient.get('/auth/profile');
  },

  forgotPassword: async (email: string): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.post('/auth/forgot-password', { email });
  },

  resetPassword: async (token: string, password: string): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.post('/auth/reset-password', { token, password });
  },
};

