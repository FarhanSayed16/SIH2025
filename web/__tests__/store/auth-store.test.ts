/**
 * Auth store tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore } from '../../lib/store/auth-store';
import { authApi } from '../../lib/api/auth';

// Mock the auth API
vi.mock('../../lib/api/auth', () => ({
  authApi: {
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
  },
}));

describe('Auth Store', () => {
  beforeEach(async () => {
    // Reset store state
    await useAuthStore.getState().logout();
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('should login successfully', async () => {
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

      (authApi.login as any).mockResolvedValue(mockResponse);

      const result = await useAuthStore.getState().login('test@example.com', 'password123');

      expect(result).toBe(true);
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().user?.email).toBe('test@example.com');
    });

    it('should handle login failure', async () => {
      const mockResponse = {
        success: false,
        message: 'Invalid credentials',
      };

      (authApi.login as any).mockResolvedValue(mockResponse);

      const result = await useAuthStore.getState().login('test@example.com', 'wrongpassword');

      expect(result).toBe(false);
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().error).toBe('Invalid credentials');
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      // First login
      const mockLoginResponse = {
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

      (authApi.login as any).mockResolvedValue(mockLoginResponse);
      await useAuthStore.getState().login('test@example.com', 'password123');

      // Then logout
      (authApi.logout as any).mockResolvedValue({ success: true });
      await useAuthStore.getState().logout();

      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().user).toBeNull();
    });
  });
});

