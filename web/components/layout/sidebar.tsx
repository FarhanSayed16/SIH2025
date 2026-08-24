/**
 * Sidebar navigation component — Professional design with Lucide icons
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { KavachLogo } from '@/components/branding/KavachLogo';
import { useAuthStore } from '@/lib/store/auth-store';
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
  Shield,
  ChevronDown,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// Map of icon names to Lucide components
const iconMap: Record<string, LucideIcon> = {
  'layout-dashboard': LayoutDashboard,
  'shield-alert': ShieldAlert,
  'file-warning': FileWarning,
  'bar-chart': BarChart3,
  'users': Users,
  'user-cog': UserCog,
  'users-2': Users2,
  'file-text': FileText,
  'school': School,
  'book-open': BookOpen,
  'pie-chart': PieChart,
  'qr-code': QrCode,
  'siren': Siren,
  'cpu': Cpu,
  'megaphone': Megaphone,
  'file-edit': FileEdit,
  'folder-open': FolderOpen,
  'flame': Flame,
  'user-plus': UserPlus,
  'home': Home,
  'baby': Baby,
  'scan-line': ScanLine,
  'bell': Bell,
  'settings': Settings,
  'map': Map,
  'user-circle': UserCircle,
};

// Navigation items with role requirements and proper icon keys
const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: 'layout-dashboard', roles: ['admin', 'SYSTEM_ADMIN', 'teacher', 'student', 'parent'] },
  // Admin-only items
  { name: 'Crisis Command', href: '/admin/crisis-dashboard', icon: 'shield-alert', roles: ['admin', 'SYSTEM_ADMIN'] },
  { name: 'Incidents', href: '/admin/incidents', icon: 'file-warning', roles: ['admin', 'SYSTEM_ADMIN'] },
  { name: 'Analytics', href: '/analytics', icon: 'bar-chart', roles: ['admin', 'SYSTEM_ADMIN'] },
  { name: 'Users', href: '/users', icon: 'users', roles: ['admin', 'teacher'] },
  { name: 'Admin Users', href: '/admin/users', icon: 'user-cog', roles: ['admin', 'SYSTEM_ADMIN'] },
  { name: 'Parents', href: '/admin/parents', icon: 'users-2', roles: ['admin', 'SYSTEM_ADMIN'] },
  { name: 'Reports', href: '/reports', icon: 'file-text', roles: ['admin'] },
  { name: 'All Classes', href: '/classes', icon: 'school', roles: ['admin', 'SYSTEM_ADMIN'] },
  // Teacher items
  { name: 'My Classes', href: '/teacher/classes', icon: 'book-open', roles: ['teacher'] },
  { name: 'Teacher Analytics', href: '/teacher/analytics', icon: 'pie-chart', roles: ['teacher'] },
  { name: 'Parents', href: '/teacher/parents', icon: 'users-2', roles: ['teacher'] },
  { name: 'QR Generator', href: '/qr-generator', icon: 'qr-code', roles: ['teacher'] },
  { name: 'Drills', href: '/drills', icon: 'siren', roles: ['admin', 'teacher'] },
  { name: 'Devices', href: '/devices', icon: 'cpu', roles: ['admin', 'teacher'] },
  { name: 'Broadcast', href: '/broadcast', icon: 'megaphone', roles: ['admin', 'teacher'] },
  { name: 'Templates', href: '/templates', icon: 'file-edit', roles: ['admin', 'teacher'] },
  { name: 'Resources', href: '/resources', icon: 'folder-open', roles: ['admin', 'teacher'] },
  { name: 'Disaster Scenario', href: '/scenario', icon: 'flame', roles: ['admin', 'teacher', 'student'] },
  // Student-specific items
  { name: 'Join Class', href: '/student/join-class', icon: 'user-plus', roles: ['student'] },
  // Parent-specific items
  { name: 'Parent Dashboard', href: '/parent/dashboard', icon: 'home', roles: ['parent'] },
  { name: 'Manage Children', href: '/parent/children/manage', icon: 'baby', roles: ['parent'] },
  { name: 'Verify Student', href: '/parent/verify-student', icon: 'scan-line', roles: ['parent'] },
  { name: 'Notifications', href: '/parent/notifications', icon: 'bell', roles: ['parent'] },
  { name: 'Parent Profile', href: '/parent/profile', icon: 'settings', roles: ['parent'] },
  // All authenticated users
  { name: 'Map', href: '/map', icon: 'map', roles: ['admin', 'teacher', 'student', 'parent'] },
  { name: 'My Profile', href: '/profile', icon: 'user-circle', roles: ['admin', 'teacher', 'student'] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout, hasRole } = useAuthStore();

  // Filter navigation items based on user role
  const filteredNavigation = navigation.filter((item) => {
    if (!user) return false;
    // SYSTEM_ADMIN should have access to all admin routes
    if (user.role === 'SYSTEM_ADMIN') {
      return item.roles.includes('admin') || item.roles.includes('SYSTEM_ADMIN') || item.roles.includes(user.role);
    }
    return item.roles.includes(user.role);
  });

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
    <div className="flex flex-col h-full" style={{ background: 'linear-gradient(180deg, #0f1729 0%, #0c1322 100%)' }}>
      {/* Brand */}
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center gap-3">
          <KavachLogo slot="sidebar" />
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">Kavach</h1>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold ${getRoleBadgeColor()}`}>
              {getRoleDisplay()}
            </span>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-4 h-px bg-slate-700/50" />

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5 dark-scrollbar">
        {filteredNavigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          const Icon = iconMap[item.icon] || LayoutDashboard;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-teal-500/15 text-teal-300 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {/* Active indicator bar */}
              {isActive && (
                <div className="absolute left-0 w-[3px] h-6 rounded-r-full bg-teal-400" />
              )}
              <Icon className={`w-[18px] h-[18px] flex-shrink-0 transition-colors ${
                isActive
                  ? 'text-teal-400'
                  : 'text-slate-500 group-hover:text-slate-300'
              }`} />
              <span className="truncate">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="mx-4 h-px bg-slate-700/50" />

      {/* User info + logout */}
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
          onClick={() => logout()}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-red-600/90 text-slate-400 hover:text-white rounded-lg text-sm font-medium transition-all duration-200 border border-slate-700/50 hover:border-red-500/50"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </div>
  );
}
