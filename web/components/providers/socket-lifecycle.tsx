/**
 * Owns authenticated socket connect/disconnect across route changes (WB2).
 * Pages should only subscribe/unsubscribe handlers — never disconnect the singleton.
 */

'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';
import { getInstitutionId } from '@/lib/utils/institution';
import { socketService } from '@/lib/services/socket-service';

const PUBLIC_PREFIXES = [
  '/',
  '/login',
  '/forgot-password',
  '/reset-password',
  '/unauthorized',
  '/privacy',
  '/team-preview',
  '/logo-preview',
  '/shots-preview',
];

function isPublicPath(pathname: string | null): boolean {
  if (!pathname) return true;
  if (pathname === '/') return true;
  // Marketing route group pages under (marketing) still have public paths above
  return PUBLIC_PREFIXES.some(
    (prefix) => prefix !== '/' && (pathname === prefix || pathname.startsWith(`${prefix}/`))
  );
}

export function SocketLifecycle() {
  const pathname = usePathname();
  const { user, accessToken, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || !accessToken || !user || isPublicPath(pathname)) {
      if (socketService.isConnected() || socketService.isConnectingNow()) {
        socketService.disconnect({ clearListeners: true });
      }
      return;
    }

    const institutionId = getInstitutionId(user.institutionId);
    if (!institutionId) {
      // Missing institution: do not connect; Header explains context.
      return;
    }

    socketService.connect(institutionId, accessToken);

    return () => {
      // Do not disconnect on route change — only on auth/public transition (handled above).
    };
  }, [isAuthenticated, accessToken, user, pathname]);

  // Full teardown on logout / identity clear
  useEffect(() => {
    if (!isAuthenticated) {
      socketService.disconnect({ clearListeners: true });
    }
  }, [isAuthenticated]);

  return null;
}
