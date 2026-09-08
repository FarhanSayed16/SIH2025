/**
 * API Client for backend communication
 * Default: localhost. Override with NEXT_PUBLIC_API_URL (e.g. a dev tunnel).
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

let onUnauthorized: (() => void) | null = null;
let onForbidden: ((message?: string) => void) | null = null;
let onTokenChange: ((token: string | null) => void) | null = null;

export function setTokenChangeHandler(handler: (token: string | null) => void) {
  onTokenChange = handler;
}

export function setErrorHandlers(
  unauthorized: () => void,
  forbidden: (message?: string) => void
) {
  onUnauthorized = unauthorized;
  onForbidden = forbidden;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage?: boolean;
    hasPrevPage?: boolean;
  };
}

function isAuthSkipRefresh(endpoint: string): boolean {
  const p = endpoint.toLowerCase();
  return (
    p.includes('/auth/login') ||
    p.includes('/auth/register') ||
    p.includes('/auth/refresh') ||
    p.includes('/auth/logout') ||
    p.includes('/auth/forgot-password') ||
    p.includes('/auth/reset-password')
  );
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;
  private refreshPromise: Promise<boolean> | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('accessToken');
      if (storedToken) {
        this.token = storedToken;
      }
      if (!localStorage.getItem('refreshToken')) {
        try {
          const raw = localStorage.getItem('kavach-auth-storage');
          if (raw) {
            const parsed = JSON.parse(raw);
            const rt = parsed?.state?.refreshToken;
            if (typeof rt === 'string' && rt) {
              localStorage.setItem('refreshToken', rt);
            }
          }
        } catch {
          /* ignore */
        }
      }
    }
  }

  setToken(token: string | null) {
    const previousToken = this.token;
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('accessToken', token);
      } else {
        localStorage.removeItem('accessToken');
      }
    }
    if (token !== previousToken) onTokenChange?.(token);
  }

  setRefreshToken(refreshToken: string | null) {
    if (typeof window === 'undefined') return;
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    } else {
      localStorage.removeItem('refreshToken');
    }
  }

  getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('refreshToken');
  }

  private async refreshAccessToken(): Promise<boolean> {
    if (this.refreshPromise) return this.refreshPromise;

    this.refreshPromise = (async () => {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) return false;

      try {
        const url = `${this.baseUrl}/auth/refresh`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data?.success || !data?.data?.accessToken) {
          return false;
        }
        this.setToken(data.data.accessToken);
        return true;
      } catch {
        return false;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    isRetry = false
  ): Promise<ApiResponse<T>> {
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${this.baseUrl}${normalizedEndpoint}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[API] ${options.method || 'GET'} ${url}`);
      }

      const response = await fetch(url, {
        ...options,
        headers,
      });

      let data: any;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error(text || 'Request failed');
        }
      }

      if (!response.ok) {
        if (
          response.status === 401 &&
          !isRetry &&
          !isAuthSkipRefresh(normalizedEndpoint)
        ) {
          const refreshed = await this.refreshAccessToken();
          if (refreshed) {
            return this.request<T>(endpoint, options, true);
          }
          if (onUnauthorized && typeof window !== 'undefined') {
            onUnauthorized();
          }
        } else if (
          response.status === 401 &&
          isAuthSkipRefresh(normalizedEndpoint) &&
          !normalizedEndpoint.includes('/auth/login') &&
          !normalizedEndpoint.includes('/auth/register') &&
          !normalizedEndpoint.includes('/auth/forgot-password')
        ) {
          if (onUnauthorized && typeof window !== 'undefined') {
            onUnauthorized();
          }
        }

        if (response.status === 403) {
          if (onForbidden && typeof window !== 'undefined') {
            const message =
              data.message || data.error || 'You do not have permission to access this resource.';
            onForbidden(message);
          }
        }

        const error = new Error(
          data.message || data.error || `Request failed with status ${response.status}`
        );
        (error as any).response = { data, status: response.status };
        (error as any).data = data;
        (error as any).code = data.code;
        (error as any).debug = data.debug;
        throw error;
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error');
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async put<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  async delete<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      body: body ? JSON.stringify(body) : undefined,
    });
  }
}

export const apiClient = new ApiClient(API_URL);
