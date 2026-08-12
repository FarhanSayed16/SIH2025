/**
 * API Client for backend communication
 */

// Support both localhost and dev tunnel
// Priority: Environment variable > Dev tunnel > Localhost
const API_URL = process.env.NEXT_PUBLIC_API_URL || 
  'https://bnc51nt1-3000.inc1.devtunnels.ms/api';

// Callback functions for error handling (set by auth store)
let onUnauthorized: (() => void) | null = null;
let onForbidden: ((message?: string) => void) | null = null;

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
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    // Load token from localStorage on client side
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('accessToken');
      if (storedToken) {
        this.token = storedToken;
      }
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('accessToken', token);
      } else {
        localStorage.removeItem('accessToken');
      }
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    // Ensure endpoint starts with /
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
      console.log(`[API] ${options.method || 'GET'} ${url}`);
      
      const response = await fetch(url, {
        ...options,
        headers,
      });

      let data;
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
        console.error(`[API] Error ${response.status}:`, data);
        
        // Handle 401 Unauthorized - Clear auth and redirect to login
        if (response.status === 401) {
          if (onUnauthorized && typeof window !== 'undefined') {
            onUnauthorized();
          }
        }
        
        // Handle 403 Forbidden - Show error but don't log out
        if (response.status === 403) {
          if (onForbidden && typeof window !== 'undefined') {
            const message = data.message || data.error || 'You do not have permission to access this resource.';
            onForbidden(message);
          }
        }
        
        const error = new Error(data.message || data.error || `Request failed with status ${response.status}`);
        // Attach full response data for error handling
        (error as any).response = { data, status: response.status };
        (error as any).data = data; // Also attach directly for easier access
        (error as any).code = data.code; // Attach error code if present
        (error as any).debug = data.debug; // Attach debug info if present
        throw error;
      }

      console.log(`[API] Success:`, data);
      return data;
    } catch (error) {
      console.error(`[API] Request failed:`, error);
      // Re-throw error so it can be caught by calling code
      // Only return error object if it's not already an Error instance
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(error instanceof Error ? error.message : 'Unknown error');
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

