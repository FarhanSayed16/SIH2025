/**
 * Auth API tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authApi, LoginRequest } from '../../lib/api/auth';
import { apiClient } from '../../lib/api/client';

// Mock the API client
vi.mock('../../lib/api/client', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
    setToken: vi.fn(),
    setRefreshToken: vi.fn(),
  },
}));

describe('Auth API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('should login successfully and set token', async () => {
      const mockResponse = {
        success: true,
        data: {
          accessToken: 'test_access_token',
          refreshToken: 'test_refresh_token',
          user: {
            id: 'user123',
            email: 'test@example.com',
            name: 'Test User',
            role: 'admin',
          },
        },
      };

      (apiClient.post as any).mockResolvedValue(mockResponse);

      const credentials: LoginRequest = {
        email: 'test@example.com',
        password: 'password123',
      };

      const result = await authApi.login(credentials);

      expect(apiClient.post).toHaveBeenCalledWith('/auth/login', credentials);
      expect(apiClient.setToken).toHaveBeenCalledWith('test_access_token');
      expect(result.success).toBe(true);
      expect(result.data?.accessToken).toBe('test_access_token');
    });

    it('should handle login failure', async () => {
      const mockResponse = {
        success: false,
        message: 'Invalid credentials',
      };

      (apiClient.post as any).mockResolvedValue(mockResponse);

      const credentials: LoginRequest = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const result = await authApi.login(credentials);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid credentials');
    });
  });

  describe('logout', () => {
    it('should logout and clear token', async () => {
      const mockResponse = {
        success: true,
      };

      (apiClient.post as any).mockResolvedValue(mockResponse);

      const result = await authApi.logout();

      expect(apiClient.post).toHaveBeenCalledWith('/auth/logout');
      expect(apiClient.setToken).toHaveBeenCalledWith(null);
      expect(result.success).toBe(true);
    });
  });
});

