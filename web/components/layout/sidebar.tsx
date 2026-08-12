/**
 * Sidebar navigation component
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';

// Navigation items with role requirements
const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: '📊', roles: ['admin', 'SYSTEM_ADMIN', 'teacher', 'student', 'parent'] },
  // Admin-only items
  { name: 'Crisis Command', href: '/admin/crisis-dashboard', icon: '🛡️', roles: ['admin', 'SYSTEM_ADMIN'] },
  { name: 'Incidents', href: '/admin/incidents', icon: '📋', roles: ['admin', 'SYSTEM_ADMIN'] },
  { name: 'Analytics', href: '/analytics', icon: '📈', roles: ['admin', 'SYSTEM_ADMIN'] },
  { name: 'Users', href: '/users', icon: '👥', roles: ['admin', 'teacher'] },
  { name: 'Admin Users', href: '/admin/users', icon: '👨‍💼', roles: ['admin', 'SYSTEM_ADMIN'] },
  { name: 'Parents', href: '/admin/parents', icon: '👨‍👩‍👧', roles: ['admin', 'SYSTEM_ADMIN'] },
  { name: 'Reports', href: '/reports', icon: '📄', roles: ['admin'] },
  { name: 'All Classes', href: '/classes', icon: '🏫', roles: ['admin', 'SYSTEM_ADMIN'] },
  // Teacher items
  { name: 'My Classes', href: '/teacher/classes', icon: '📚', roles: ['teacher'] },
  { name: 'Teacher Analytics', href: '/teacher/analytics', icon: '📊', roles: ['teacher'] },
  { name: 'Parents', href: '/teacher/parents', icon: '👨‍👩‍👧', roles: ['teacher'] },
  { name: 'QR Generator', href: '/qr-generator', icon: '📱', roles: ['teacher'] },
  { name: 'Drills', href: '/drills', icon: '🚨', roles: ['admin', 'teacher'] },
  { name: 'Devices', href: '/devices', icon: '📱', roles: ['admin', 'teacher'] },
  { name: 'Broadcast', href: '/broadcast', icon: '📢', roles: ['admin', 'teacher'] },
  { name: 'Templates', href: '/templates', icon: '📝', roles: ['admin', 'teacher'] },
  { name: 'Resources', href: '/resources', icon: '📚', roles: ['admin', 'teacher'] },
  { name: 'Disaster Scenario', href: '/scenario', icon: '🎭', roles: ['admin', 'teacher', 'student'] },
  // Student-specific items
  { name: 'Join Class', href: '/student/join-class', icon: '➕', roles: ['student'] },
    // Parent-specific items
    { name: 'Parent Dashboard', href: '/parent/dashboard', icon: '👨‍👩‍👧', roles: ['parent'] },
    { name: 'Manage Children', href: '/parent/children/manage', icon: '👥', roles: ['parent'] },
    { name: 'Verify Student', href: '/parent/verify-student', icon: '📱', roles: ['parent'] },
    { name: 'Notifications', href: '/parent/notifications', icon: '🔔', roles: ['parent'] },
    { name: 'Parent Profile', href: '/parent/profile', icon: '⚙️', roles: ['parent'] },
  // All authenticated users
  { name: 'Map', href: '/map', icon: '🗺️', roles: ['admin', 'teacher', 'student', 'parent'] },
    { name: 'My Profile', href: '/profile', icon: '👤', roles: ['admin', 'teacher', 'student'] },
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

  return (
    <div className="w-64 bg-gray-900 text-white min-h-screen">
      <div className="p-6">
        <h1 className="text-xl font-bold">🛡️ EduSafe</h1>
        <p className="text-sm text-gray-400 mt-1">{getRoleDisplay()} Dashboard</p>
      </div>

      <nav className="mt-8">
        {filteredNavigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-6 py-3 transition-colors ${
                isActive
                  ? 'bg-gray-800 border-l-4 border-blue-500'
                  : 'hover:bg-gray-800'
              }`}
            >
              <span className="mr-3">{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="absolute bottom-0 w-64 p-6 border-t border-gray-800">
        <div className="mb-4">
          <p className="text-sm font-medium">{user?.name}</p>
          <p className="text-xs text-gray-400">{user?.email}</p>
        </div>
        <button
          onClick={() => logout()}
          className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm transition-colors"
        >
          Logout
        </button>
      </div>
    </div>
  );
}

