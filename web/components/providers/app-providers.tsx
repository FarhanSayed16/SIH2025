'use client';

import type { ReactNode } from 'react';
import { SocketLifecycle } from '@/components/providers/socket-lifecycle';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <>
      <SocketLifecycle />
      {children}
    </>
  );
}
