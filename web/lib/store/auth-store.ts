/**
 * Authentication store using Zustand
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { authApi, LoginResponse } from '../api/auth';
import { apiClient, setErrorHandlers } from '../api/client';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  institutionId?: string | null;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  fieldErrors: Record<string, string> | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: { email: string; password: string; name: string; role: string; institutionId?: string }) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
  // Role helper functions
  isAdmin: () => boolean;
  isTeacher: () => boolean;
  isStudent: () => boolean;
  isParent: () => boolean;
  hasRole: (role: string) => boolean;
  // Refresh user data from server
  refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => {
      // Initialize API client with token from localStorage on hydration
      if (typeof window !== 'undefined') {
        // Get token from localStorage immediately
        const storedToken = localStorage.getItem('accessToken');
        if (storedToken) {
          apiClient.setToken(storedToken);
        }

        // Set up error handlers for API client
        setErrorHandlers(
          // onUnauthorized - 401 handler
          () => {
            const state = get();
            // Clear auth state
            apiClient.setToken(null);
            apiClient.setRefreshToken(null);
            set({
              user: null,
              accessToken: null,
              refreshToken: null,
              isAuthenticated: false,
              error: null,
            });
            // Redirect to login
            if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }
          },
          // onForbidden - 403 handler
          (message?: string) => {
            // Show toast notification (if available)
            if (typeof window !== 'undefined') {
              // Try to use toast if available, otherwise use alert
              const event = new CustomEvent('show-toast', {
                detail: {
                  message: message || 'You do not have permission to access this resource.',
                  type: 'error',
                },
              });
              window.dispatchEvent(event);
              // Also show browser alert as fallback
              alert(message || 'You do not have permission to access this resource.');
            }
            // Redirect to unauthorized page after a short delay
            if (typeof window !== 'undefined') {
              setTimeout(() => {
                window.location.href = '/unauthorized';
              }, 1000);
            }
          }
        );
      }

      return {
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        fieldErrors: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null, fieldErrors: null });
        try {
          const response = await authApi.login({ email, password });
          if (response.success && response.data) {
            // Ensure user object has required fields
            const user = response.data.user;
            if (!user || !user.id) {
              throw new Error('Invalid user data received from server');
            }
            
            // Set token in API client
            apiClient.setToken(response.data.accessToken);
            if (response.data.refreshToken) {
              apiClient.setRefreshToken(response.data.refreshToken);
            }
            set({
              user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                institutionId: user.institutionId || null,
                approvalStatus: user.approvalStatus || 'approved', // Default to approved if not provided
              },
              accessToken: response.data.accessToken,
              refreshToken: response.data.refreshToken || null,
              isAuthenticated: true,
              isLoading: false,
              error: null,
              fieldErrors: null,
            });
            return true;
          } else {
            // Extract field errors if available
            const fieldErrors = (response as any).fieldErrors || null;
            set({
              isLoading: false,
              error: response.message || 'Login failed',
              fieldErrors,
            });
            return false;
          }
        } catch (error: any) {
          // Extract field errors from error response if available
          const fieldErrors = error.fieldErrors || null;
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Login failed',
            fieldErrors,
          });
          return false;
        }
      },

      register: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.register(data);
          if (response.success && response.data) {
            // Ensure user object has required fields
            const user = response.data.user;
            if (!user || !user.id) {
              throw new Error('Invalid user data received from server');
            }
            
            // Set token in API client
            apiClient.setToken(response.data.accessToken);
            if (response.data.refreshToken) {
              apiClient.setRefreshToken(response.data.refreshToken);
            }
            set({
              user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                institutionId: user.institutionId || null,
                approvalStatus: user.approvalStatus || 'approved', // Default to approved if not provided
              },
              accessToken: response.data.accessToken,
              refreshToken: response.data.refreshToken || null,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.message || 'Registration failed',
            });
            return false;
          }
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Registration failed',
          });
          return false;
        }
      },

      logout: async () => {
        try {
          await authApi.logout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          // Clear token from API client
          apiClient.setToken(null);
          apiClient.setRefreshToken(null);
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            error: null,
          });
        }
      },

      clearError: () => set({ error: null, fieldErrors: null }),

      // Role helper functions
      isAdmin: () => {
        const state = get();
        const role = state.user?.role?.toLowerCase();
        return role === 'admin' || role === 'system_admin';
      },
      isTeacher: () => {
        const state = get();
        return state.user?.role === 'teacher';
      },
      isStudent: () => {
        const state = get();
        return state.user?.role === 'student';
      },
      isParent: () => {
        const state = get();
        return state.user?.role === 'parent';
      },
      hasRole: (role: string) => {
        const state = get();
        return state.user?.role === role;
      },
      
      // Refresh user data from server
      refreshUser: async () => {
        const state = get();
        if (!state.accessToken) {
          return;
        }
        
        try {
          const { authApi } = await import('../api/auth');
          const response = await authApi.getProfile();
          if (response.success && response.data) {
            const user = response.data.user || response.data;
            set({
              user: {
                id: user.id || user._id,
                email: user.email,
                name: user.name,
                role: user.role,
                institutionId: user.institutionId || null,
                approvalStatus: user.approvalStatus || 'approved', // Include approvalStatus
              },
            });
          }
        } catch (error) {
          console.error('Error refreshing user:', error);
          // Don't throw - just log the error
        }
      },
    }
    },
    {
      name: 'kavach-auth-storage',
      storage: createJSONStorage(() => {
        if (typeof window !== 'undefined') {
          return localStorage;
        }
        // Return a no-op storage for SSR
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        };
      }),
      partialize: (state) => {
        // Only persist valid user data
        if (state.user && state.user.id) {
          return {
            user: {
              id: state.user.id,
              email: state.user.email,
              name: state.user.name,
              role: state.user.role,
              institutionId: state.user.institutionId || null,
              approvalStatus: state.user.approvalStatus || 'approved', // Include approvalStatus
            },
            accessToken: state.accessToken,
            refreshToken: state.refreshToken,
            isAuthenticated: state.isAuthenticated,
          };
        }
        // Clear invalid cached data
        return {
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        };
      },
    }
  )
);

