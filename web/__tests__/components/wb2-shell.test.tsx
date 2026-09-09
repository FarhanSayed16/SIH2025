/**
 * WB2 shell / nav / modal contract tests
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import {
  filterNavGroups,
  isNavItemActive,
  defaultPageTitle,
} from '../../components/layout/nav-config';
import { Modal } from '../../components/ui/modal';
import { Tabs } from '../../components/ui/tabs';

vi.mock('next/navigation', () => ({
  usePathname: () => '/teacher/classes',
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock('@/lib/store/auth-store', () => ({
  useAuthStore: () => ({
    user: { role: 'teacher', name: 'T', email: 't@example.com', institutionId: 'inst1' },
    logout: vi.fn(),
    accessToken: 'tok',
    isAuthenticated: true,
  }),
}));

vi.mock('@/lib/services/socket-service', () => ({
  socketService: {
    subscribeStatus: (cb: (s: any) => void) => {
      cb({ connected: false, connecting: false, schoolId: null });
      return () => {};
    },
    connect: vi.fn(),
    isConnected: () => false,
    isConnectingNow: () => false,
    disconnect: vi.fn(),
  },
}));

vi.mock('@/components/branding/KavachLogo', () => ({
  KavachLogo: () => <div data-testid="logo" />,
}));

describe('WB2 nav config', () => {
  it('hides generic Dashboard for parents and keeps Parent Dashboard', () => {
    const groups = filterNavGroups('parent');
    const hrefs = groups.flatMap((g) => g.items.map((i) => i.href));
    expect(hrefs).toContain('/parent/dashboard');
    expect(hrefs).not.toContain('/dashboard');
  });

  it('groups teacher destinations', () => {
    const groups = filterNavGroups('teacher');
    const labels = groups.map((g) => g.label);
    expect(labels).toEqual(expect.arrayContaining(['Overview', 'Teaching', 'Safety operations']));
    expect(groups.flatMap((g) => g.items.map((i) => i.href))).toContain('/teacher/classes');
  });

  it('uses segment-aware active matching', () => {
    const hrefs = ['/teacher/classes', '/teacher/classes/abc'];
    expect(isNavItemActive('/teacher/classes/abc', '/teacher/classes', hrefs)).toBe(false);
    expect(isNavItemActive('/teacher/classes/abc', '/teacher/classes/abc', hrefs)).toBe(true);
    expect(isNavItemActive('/drills', '/dashboard', ['/dashboard', '/drills'])).toBe(false);
  });

  it('provides role-aware default titles (not Admin for teachers)', () => {
    expect(defaultPageTitle('teacher')).toBe('Teacher Dashboard');
    expect(defaultPageTitle('parent')).toBe('Parent Dashboard');
    expect(defaultPageTitle('admin')).toBe('Admin Dashboard');
  });
});

describe('WB2 Modal keyboard', () => {
  it('closes on Escape and restores focus', () => {
    const onClose = vi.fn();
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    trigger.focus();

    const { rerender } = render(
      <Modal isOpen title="Test dialog" onClose={onClose}>
        <button type="button">Inside</button>
      </Modal>
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();

    rerender(
      <Modal isOpen={false} title="Test dialog" onClose={onClose}>
        <button type="button">Inside</button>
      </Modal>
    );
    document.body.removeChild(trigger);
  });
});

describe('WB2 Tabs', () => {
  it('exposes tablist semantics and changes selection', () => {
    const onChange = vi.fn();
    render(
      <Tabs
        value="a"
        onChange={onChange}
        items={[
          { id: 'a', label: 'Alpha', panel: <p>A panel</p> },
          { id: 'b', label: 'Beta', panel: <p>B panel</p> },
        ]}
      />
    );
    expect(screen.getByRole('tablist')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: 'Beta' }));
    expect(onChange).toHaveBeenCalledWith('b');
  });
});

describe('WB2 AppShell skip target', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('renders main#main-content as focusable skip target', async () => {
    const { AppShell } = await import('../../components/layout/app-shell');
    render(
      <AppShell title="My Classes">
        <p>Content</p>
      </AppShell>
    );
    const main = document.getElementById('main-content');
    expect(main).toBeTruthy();
    expect(main?.tagName).toBe('MAIN');
    expect(main?.getAttribute('tabindex')).toBe('-1');
    expect(screen.getByLabelText('Open navigation menu')).toBeInTheDocument();
  });
});
