import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../../lib/api/client';
import { useAuthStore } from '../../lib/store/auth-store';

const jsonResponse = (status: number, data: unknown) => new Response(JSON.stringify(data), {
  status,
  headers: { 'Content-Type': 'application/json' },
});

describe('HTTP refresh and shared authentication state', () => {
  beforeEach(() => {
    apiClient.setToken(null);
    apiClient.setRefreshToken(null);
    useAuthStore.setState({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
    localStorage.clear();
  });

  afterEach(() => vi.unstubAllGlobals());

  it('publishes the refreshed JWT to subscribers, persists it, retries HTTP, and clears the session on logout', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse(200, {
        success: true,
        data: {
          user: { id: 'student1', name: 'Student', role: 'student', email: 'student@example.com' },
          accessToken: 'expired-token',
          refreshToken: 'refresh-token',
        },
      }))
      .mockResolvedValueOnce(jsonResponse(401, { success: false, message: 'Token expired' }))
      .mockResolvedValueOnce(jsonResponse(200, { success: true, data: { accessToken: 'fresh-token' } }))
      .mockResolvedValueOnce(jsonResponse(200, { success: true, data: { activities: [] } }))
      .mockResolvedValueOnce(jsonResponse(200, { success: true }));
    vi.stubGlobal('fetch', fetchMock);

    expect(await useAuthStore.getState().login('student@example.com', 'password')).toBe(true);
    expect(useAuthStore.getState().accessToken).toBe('expired-token');

    const tokenChanged = vi.fn();
    const unsubscribe = useAuthStore.subscribe((state, previous) => {
      if (state.accessToken !== previous.accessToken) tokenChanged(state.accessToken);
    });
    try {
      expect((await apiClient.get('/activity')).success).toBe(true);
      expect(fetchMock.mock.calls[2][0]).toMatch(/\/auth\/refresh$/);
      expect(JSON.parse(fetchMock.mock.calls[2][1].body)).toEqual({ refreshToken: 'refresh-token' });
      expect(fetchMock.mock.calls[3][1].headers.Authorization).toBe('Bearer fresh-token');
      expect(useAuthStore.getState().accessToken).toBe('fresh-token');
      expect(tokenChanged).toHaveBeenCalledWith('fresh-token');
      expect(localStorage.getItem('accessToken')).toBe('fresh-token');
      expect(JSON.parse(localStorage.getItem('kavach-auth-storage')!).state.accessToken).toBe('fresh-token');

      apiClient.setToken('fresh-token');
      expect(tokenChanged).toHaveBeenCalledTimes(1);

      await useAuthStore.getState().logout();
      expect(useAuthStore.getState()).toMatchObject({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
      expect(tokenChanged).toHaveBeenLastCalledWith(null);
    } finally {
      unsubscribe();
    }
  });
});
