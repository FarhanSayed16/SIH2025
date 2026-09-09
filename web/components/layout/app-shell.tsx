/**
 * Authenticated app shell — sidebar/drawer, skip target, one main scroller (WB2).
 */

'use client';

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Menu, X } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';

interface AppShellProps {
  /** Context title shown in the sticky header (not a second page H1). */
  title: string;
  children: ReactNode;
  /** Optional actions rendered in the header row on the right of the title area. */
  actions?: ReactNode;
  /** Extra classes for the main content region. */
  mainClassName?: string;
}

export function AppShell({ title, children, actions, mainClassName = '' }: AppShellProps) {
  const [navOpen, setNavOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const drawerTitleId = useId();

  const closeNav = useCallback(() => {
    setNavOpen(false);
    // Restore focus to the menu control after drawer closes
    requestAnimationFrame(() => menuButtonRef.current?.focus());
  }, []);

  const openNav = useCallback(() => {
    setNavOpen(true);
  }, []);

  useEffect(() => {
    if (!navOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeNav();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    // Move focus into the drawer
    requestAnimationFrame(() => closeButtonRef.current?.focus());

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [navOpen, closeNav]);

  return (
    <div className="flex h-[100dvh] bg-[var(--kavach-canvas,#F6F8F7)] overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col h-full border-r border-slate-800/40 z-20">
        <Sidebar />
      </aside>

      {/* Mobile drawer */}
      {navOpen && (
        <div className="fixed inset-0 z-40 md:hidden" role="presentation">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close navigation"
            onClick={closeNav}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={drawerTitleId}
            className="absolute inset-y-0 left-0 w-[min(20rem,88vw)] shadow-xl flex flex-col"
          >
            <div className="flex items-center justify-between px-4 py-3 bg-slate-900 text-white">
              <p id={drawerTitleId} className="text-sm font-semibold">
                Navigation
              </p>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={closeNav}
                className="inline-flex items-center justify-center min-h-11 min-w-11 rounded-lg hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden">
              <Sidebar onNavigate={closeNav} />
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 h-full">
        <div className="flex items-stretch border-b border-gray-200/80 bg-white/90 backdrop-blur sticky top-0 z-30">
          <button
            ref={menuButtonRef}
            type="button"
            className="md:hidden inline-flex items-center justify-center min-h-11 min-w-11 px-3 text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
            aria-expanded={navOpen}
            aria-controls={undefined}
            aria-label="Open navigation menu"
            onClick={openNav}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <Header title={title} actions={actions} />
          </div>
        </div>

        <main
          id="main-content"
          tabIndex={-1}
          className={`flex-1 min-h-0 overflow-y-auto scroll-mt-16 p-4 sm:p-6 lg:p-8 focus:outline-none ${mainClassName}`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
