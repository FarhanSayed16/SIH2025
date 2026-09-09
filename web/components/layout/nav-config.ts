/**
 * Role-grouped navigation for authenticated shell (WB2).
 */

export type AppRole = 'admin' | 'SYSTEM_ADMIN' | 'teacher' | 'student' | 'parent';

export interface NavItem {
  name: string;
  href: string;
  icon: string;
  roles: AppRole[];
}

export interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

export const navigationGroups: NavGroup[] = [
  {
    id: 'overview',
    label: 'Overview',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: 'layout-dashboard', roles: ['admin', 'SYSTEM_ADMIN', 'teacher', 'student'] },
      { name: 'Analytics', href: '/analytics', icon: 'bar-chart', roles: ['admin', 'SYSTEM_ADMIN'] },
      { name: 'Reports', href: '/reports', icon: 'file-text', roles: ['admin'] },
    ],
  },
  {
    id: 'teaching',
    label: 'Teaching',
    items: [
      { name: 'My Classes', href: '/teacher/classes', icon: 'book-open', roles: ['teacher'] },
      { name: 'Teacher Analytics', href: '/teacher/analytics', icon: 'pie-chart', roles: ['teacher'] },
      { name: 'Parents', href: '/teacher/parents', icon: 'users-2', roles: ['teacher'] },
      { name: 'QR Generator', href: '/qr-generator', icon: 'qr-code', roles: ['teacher'] },
    ],
  },
  {
    id: 'operations',
    label: 'Safety operations',
    items: [
      { name: 'Crisis Command', href: '/admin/crisis-dashboard', icon: 'shield-alert', roles: ['admin', 'SYSTEM_ADMIN'] },
      { name: 'Incidents', href: '/admin/incidents', icon: 'file-warning', roles: ['admin', 'SYSTEM_ADMIN'] },
      { name: 'Drills', href: '/drills', icon: 'siren', roles: ['admin', 'teacher'] },
      { name: 'Devices', href: '/devices', icon: 'cpu', roles: ['admin', 'teacher'] },
      { name: 'Broadcast', href: '/broadcast', icon: 'megaphone', roles: ['admin', 'teacher'] },
      { name: 'Map', href: '/map', icon: 'map', roles: ['admin', 'teacher', 'student', 'parent'] },
    ],
  },
  {
    id: 'people',
    label: 'People and content',
    items: [
      { name: 'Users', href: '/users', icon: 'users', roles: ['admin', 'teacher'] },
      { name: 'Admin Users', href: '/admin/users', icon: 'user-cog', roles: ['admin', 'SYSTEM_ADMIN'] },
      { name: 'Parents', href: '/admin/parents', icon: 'users-2', roles: ['admin', 'SYSTEM_ADMIN'] },
      { name: 'All Classes', href: '/classes', icon: 'school', roles: ['admin', 'SYSTEM_ADMIN'] },
      { name: 'Templates', href: '/templates', icon: 'file-edit', roles: ['admin', 'teacher'] },
      { name: 'Resources', href: '/resources', icon: 'folder-open', roles: ['admin', 'teacher'] },
      { name: 'Disaster Scenario', href: '/scenario', icon: 'flame', roles: ['admin', 'teacher', 'student'] },
      { name: 'Join Class', href: '/student/join-class', icon: 'user-plus', roles: ['student'] },
      { name: 'My Profile', href: '/profile', icon: 'user-circle', roles: ['admin', 'teacher', 'student'] },
    ],
  },
  {
    id: 'family',
    label: 'Family',
    items: [
      { name: 'Parent Dashboard', href: '/parent/dashboard', icon: 'home', roles: ['parent'] },
      { name: 'Manage Children', href: '/parent/children/manage', icon: 'baby', roles: ['parent'] },
      { name: 'Verify Student', href: '/parent/verify-student', icon: 'scan-line', roles: ['parent'] },
      { name: 'Notifications', href: '/parent/notifications', icon: 'bell', roles: ['parent'] },
    ],
  },
  {
    id: 'parent-account',
    label: 'Account',
    items: [
      { name: 'Parent Profile', href: '/parent/profile', icon: 'settings', roles: ['parent'] },
    ],
  },
];

/** Segment-aware active match: prefer the longest matching href. */
export function isNavItemActive(pathname: string, href: string, allHrefs: string[]): boolean {
  const matches = (candidate: string) =>
    pathname === candidate ||
    (candidate !== '/' && pathname.startsWith(`${candidate}/`));

  if (!matches(href)) return false;

  const longerMatch = allHrefs.some(
    (other) => other !== href && other.length > href.length && matches(other)
  );
  return !longerMatch;
}

export function roleCanAccess(role: string | undefined, roles: AppRole[]): boolean {
  if (!role) return false;
  if (role === 'SYSTEM_ADMIN') {
    return roles.includes('admin') || roles.includes('SYSTEM_ADMIN') || roles.includes(role as AppRole);
  }
  return roles.includes(role as AppRole);
}

export function filterNavGroups(role: string | undefined): NavGroup[] {
  return navigationGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => roleCanAccess(role, item.roles)),
    }))
    .filter((group) => group.items.length > 0);
}

export function defaultPageTitle(role: string | undefined): string {
  switch (role) {
    case 'parent':
      return 'Parent Dashboard';
    case 'teacher':
      return 'Teacher Dashboard';
    case 'student':
      return 'Student Dashboard';
    case 'SYSTEM_ADMIN':
      return 'System Admin';
    case 'admin':
      return 'Admin Dashboard';
    default:
      return 'Kavach';
  }
}
