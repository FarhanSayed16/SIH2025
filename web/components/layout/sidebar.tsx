/**
 * Sidebar navigation — role groups, segment-aware active state, drawer support (WB2).
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { KavachLogo } from '@/components/branding/KavachLogo';
import { useAuthStore } from '@/lib/store/auth-store';
import { filterNavGroups, isNavItemActive } from '@/components/layout/nav-config';
import {
  LayoutDashboard,
  ShieldAlert,
  FileWarning,
  BarChart3,
  Users,
  UserCog,
  Users2,
  FileText,
  School,
  BookOpen,
  PieChart,
  QrCode,
  Siren,
  Cpu,
  Megaphone,
  FileEdit,
  FolderOpen,
  Flame,
  UserPlus,
  Home,
  Baby,
  ScanLine,
  Bell,
  Settings,
  Map,
  UserCircle,
  LogOut,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  'layout-dashboard': LayoutDashboard,
  'shield-alert': ShieldAlert,
  'file-warning': FileWarning,
  'bar-chart': BarChart3,
  users: Users,
  'user-cog': UserCog,
  'users-2': Users2,
  'file-text': FileText,
  school: School,
  'book-open': BookOpen,
  'pie-chart': PieChart,
  'qr-code': QrCode,
  siren: Siren,
  cpu: Cpu,
  megaphone: Megaphone,
  'file-edit': FileEdit,
  'folder-open': FolderOpen,
  flame: Flame,
  'user-plus': UserPlus,
  home: Home,
  baby: Baby,
  'scan-line': ScanLine,
  bell: Bell,
  settings: Settings,
  map: Map,
  'user-circle': UserCircle,
};

interface SidebarProps {
  /** Called after a nav link is activated (closes mobile drawer). */
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps = {}) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const groups = filterNavGroups(user?.role);
  const allHrefs = groups.flatMap((g) => g.items.map((i) => i.href));

  const getRoleDisplay = () => {
    if (!user) return 'Guest';
    const roleMap: Record<string, string> = {
      admin: 'Admin',
      SYSTEM_ADMIN: 'Super Admin',
      teacher: 'Teacher',
      student: 'Student',
      parent: 'Parent',
    };
    return roleMap[user.role] || user.role;
  };

  const getRoleBadgeColor = () => {
    if (!user) return 'bg-slate-500/20 text-slate-400';
    const roleColors: Record<string, string> = {
      admin: 'bg-blue-500/15 text-blue-400 border border-blue-500/20',
      SYSTEM_ADMIN: 'bg-purple-500/15 text-purple-400 border border-purple-500/20',
      teacher: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
      student: 'bg-amber-500/15 text-amber-400 border border-amber-500/20',
      parent: 'bg-rose-500/15 text-rose-400 border border-rose-500/20',
    };
    return roleColors[user.role] || 'bg-slate-500/20 text-slate-400';
  };

  return (
    <div
      className="flex flex-col h-full w-full"
      style={{ background: 'linear-gradient(180deg, #0f1729 0%, #0c1322 100%)' }}
    >
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center gap-3">
          <KavachLogo slot="sidebar" />
          <div>
            <p className="text-base font-bold text-white tracking-tight">Kavach</p>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold ${getRoleBadgeColor()}`}
            >
              {getRoleDisplay()}
            </span>
          </div>
        </div>
      </div>

      <div className="mx-4 h-px bg-slate-700/50" />

      <nav className="flex-1 overflow-y-auto py-4 px-3 dark-scrollbar" aria-label="Primary">
        {groups.map((group) => (
          <div key={group.id} className="mb-4">
            <p className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = isNavItemActive(pathname, item.href, allHrefs);
                const Icon = iconMap[item.icon] || LayoutDashboard;
                return (
                  <li key={item.href} className="relative">
                    <Link
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      onClick={() => onNavigate?.()}
                      className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 min-h-11 ${
                        active
                          ? 'bg-teal-500/15 text-teal-300 shadow-sm'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                      }`}
                    >
                      {active && (
                        <span
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full bg-teal-400"
                          aria-hidden
                        />
                      )}
                      <Icon
                        className={`w-[18px] h-[18px] flex-shrink-0 transition-colors ${
                          active ? 'text-teal-400' : 'text-slate-500 group-hover:text-slate-300'
                        }`}
                      />
                      <span className="truncate">{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="mx-4 h-px bg-slate-700/50" />

      <div className="p-4">
        <div className="flex items-center gap-3 mb-3 px-1">
          <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-slate-300">
              {user?.name?.charAt(0)?.toUpperCase() || '?'}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-200 truncate">{user?.name}</p>
            <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => logout()}
          className="w-full flex items-center justify-center gap-2 min-h-11 px-4 py-2.5 bg-slate-800 hover:bg-red-600/90 text-slate-400 hover:text-white rounded-lg text-sm font-medium transition-all duration-200 border border-slate-700/50 hover:border-red-500/50"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </div>
  );
}
