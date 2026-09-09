/**
 * Header — page context title + live-updates connection state (WB2).
 */

'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { socketService } from '@/lib/services/socket-service';
import { useAuthStore } from '@/lib/store/auth-store';
import { getInstitutionId } from '@/lib/utils/institution';
import { defaultPageTitle } from '@/components/layout/nav-config';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

interface HeaderProps {
  title?: string;
  actions?: ReactNode;
}

export function Header({ title, actions }: HeaderProps) {
  const { user, accessToken, isAuthenticated } = useAuthStore();
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const institutionId = getInstitutionId(user?.institutionId);
  const displayTitle = title?.trim() || defaultPageTitle(user?.role);

  useEffect(() => {
    setHydrated(true);
    return socketService.subscribeStatus((status) => {
      setConnected(status.connected);
      setConnecting(status.connecting);
    });
  }, []);

  const handleReconnect = () => {
    if (!user || !accessToken) return;
    if (!institutionId) return;
    socketService.connect(institutionId, accessToken);
  };

  const connectionLabel = (() => {
    if (!hydrated || !isAuthenticated) return 'Initializing…';
    if (!institutionId) return 'Institution not assigned';
    if (connecting) return 'Reconnecting…';
    if (connected) return 'Live updates connected';
    return 'Live updates disconnected';
  })();

  const canReconnect = Boolean(institutionId && accessToken && !connected && !connecting && hydrated);

  return (
    <header className="bg-transparent">
      <div className="px-3 sm:px-6 py-3 flex items-center justify-between gap-3 min-h-[3.5rem]">
        <div className="min-w-0">
          <p className="text-lg sm:text-xl font-semibold text-gray-900 truncate">{displayTitle}</p>
          {user?.role && (
            <p className="text-xs text-gray-500 truncate">
              {user.role === 'SYSTEM_ADMIN' ? 'Super Admin' : user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              {institutionId ? ' · Institution linked' : ' · No institution on this account'}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {actions}
          <div className="flex items-center gap-2">
            <div
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-gray-50 border border-gray-200 max-w-[11rem] sm:max-w-none"
              title={connectionLabel}
            >
              {!hydrated || !isAuthenticated ? (
                <>
                  <RefreshCw className="w-4 h-4 text-slate-500" aria-hidden />
                  <span className="text-xs sm:text-sm text-slate-600 font-medium truncate">Initializing…</span>
                </>
              ) : connecting ? (
                <>
                  <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" aria-hidden />
                  <span className="text-xs sm:text-sm text-blue-600 font-medium truncate">Reconnecting…</span>
                </>
              ) : connected ? (
                <>
                  <Wifi className="w-4 h-4 text-green-600" aria-hidden />
                  <span className="text-xs sm:text-sm text-green-700 font-medium truncate hidden sm:inline">
                    Live updates connected
                  </span>
                  <span className="text-xs text-green-700 font-medium sm:hidden">Live</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4 text-amber-700" aria-hidden />
                  <span className="text-xs sm:text-sm text-amber-800 font-medium truncate">
                    {!institutionId ? 'No institution' : 'Live updates off'}
                  </span>
                </>
              )}
            </div>

            {canReconnect && (
              <button
                type="button"
                onClick={handleReconnect}
                className="flex items-center gap-2 min-h-11 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">Reconnect</span>
              </button>
            )}

            {!institutionId && isAuthenticated && hydrated && (
              <span className="sr-only">
                Live updates require an assigned institution. Reconnect is unavailable until one is linked.
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
