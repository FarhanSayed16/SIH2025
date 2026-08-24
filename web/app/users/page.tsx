/**
 * Users Management Page
 * Phase 3.5.4: Advanced Admin Features
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store/auth-store';
import { usersApi, User, UserFilters } from '@/lib/api/users';
import { schoolsApi, School } from '@/lib/api/schools';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';

export default function UsersPage() {
  const router = useRouter();
  const { user, isAuthenticated, accessToken } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<UserFilters>({
    page: 1,
    limit: 20,
  });
  const [totalUsers, setTotalUsers] = useState(0);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [schools, setSchools] = useState<School[]>([]);
  const [editingInstitutionFor, setEditingInstitutionFor] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // Only admins and teachers can access users page
    // Teachers can view and approve students, admins have full access
    if (user?.role !== 'admin' && user?.role !== 'teacher') {
      router.push('/dashboard');
      return;
    }

    // Ensure API client has token
    if (accessToken) {
      const { apiClient } = require('@/lib/api/client');
      apiClient.setToken(accessToken);
    }

    loadUsers();
    if (user?.role === 'admin') {
      loadSchools();
    }
  }, [isAuthenticated, user, router, accessToken, filters]);

  const loadSchools = async () => {
    try {
      const response = await schoolsApi.list();
      if (response.success && response.data) {
        setSchools(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error('Error loading schools:', error);
    }
  };

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const searchFilters = { ...filters };
      if (searchTerm) {
        searchFilters.search = searchTerm;
      }

      // For teachers, if they don't have institutionId, show a helpful message
      if (user?.role === 'teacher' && !user?.institutionId && !filters.role) {
        // Don't filter by role, let backend handle it
      }

      const response = await usersApi.list(searchFilters);
      if (response.success && response.data) {
        setUsers(response.data.users || []);
        setTotalUsers(response.data.total || 0);
      } else {
        console.error('Failed to load users:', response.message);
        if (user?.role === 'teacher' && !user?.institutionId) {
          // Show helpful message for teachers without institutionId
          console.warn('Teacher does not have institutionId assigned. Please contact admin.');
        }
      }
    } catch (error) {
      console.error('Error loading users:', error);
      if (user?.role === 'teacher' && !user?.institutionId) {
        alert('You need to have an institution assigned to view users. Please contact your administrator.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    setFilters({ ...filters, page: 1 });
    loadUsers();
  };

  const handleSelectUser = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  const handleSelectAll = () => {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set());
      setShowBulkActions(false);
    } else {
      setSelectedUsers(new Set(users.map((u) => u._id)));
      setShowBulkActions(true);
    }
  };

  const handleBulkOperation = async (action: 'activate' | 'deactivate' | 'delete') => {
    if (selectedUsers.size === 0) return;

    if (!confirm(`Are you sure you want to ${action} ${selectedUsers.size} user(s)?`)) {
      return;
    }

    try {
      const response = await usersApi.bulkOperation({
        userIds: Array.from(selectedUsers),
        action,
      });

      if (response.success) {
        alert(`Successfully ${action}d ${response.data?.affected || 0} user(s)`);
        setSelectedUsers(new Set());
        setShowBulkActions(false);
        loadUsers();
      } else {
        alert(`Failed to ${action} users: ${response.error || response.message}`);
      }
    } catch (error) {
      console.error(`Error ${action}ing users:`, error);
      alert(`Failed to ${action} users. Please try again.`);
    }
  };

  const handleExport = async (format: 'csv' | 'excel') => {
    try {
      const searchFilters = { ...filters };
      if (searchTerm) {
        searchFilters.search = searchTerm;
      }

      const response = await usersApi.export(format, searchFilters);
      if (response.success && response.data?.downloadUrl) {
        window.open(response.data.downloadUrl, '_blank');
      } else {
        alert(`Failed to export users: ${response.error || response.message}`);
      }
    } catch (error) {
      console.error('Error exporting users:', error);
      alert('Failed to export users. Please try again.');
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  const totalPages = Math.ceil(totalUsers / (filters.limit || 20));

  return (
    <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {user?.role === 'teacher' ? 'My Students' : 'User Management'}
            </h1>
            <p className="text-gray-600">
              {user?.role === 'teacher' 
                ? 'View and manage students in your classes' 
                : 'Manage users, roles, and permissions'}
            </p>
          </div>

          {/* Filters and Actions */}
          <Card className="p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="flex-1 flex gap-2">
                <Input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1"
                />
                <Button onClick={handleSearch}>Search</Button>
              </div>

              <div className="flex gap-2">
                <select
                  value={filters.role || ''}
                  onChange={(e) => setFilters({ ...filters, role: e.target.value || undefined, page: 1 })}
                  className="px-3 py-2 border rounded-lg"
                >
                  <option value="">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="teacher">Teacher</option>
                  <option value="student">Student</option>
                  <option value="parent">Parent</option>
                </select>

                <select
                  value={filters.isActive === undefined ? '' : String(filters.isActive)}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      isActive: e.target.value === '' ? undefined : e.target.value === 'true',
                      page: 1,
                    })
                  }
                  className="px-3 py-2 border rounded-lg"
                >
                  <option value="">All Status</option>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>

                <select
                  value={filters.approvalStatus || ''}
                  onChange={(e) => setFilters({ ...filters, approvalStatus: e.target.value || undefined, page: 1 })}
                  className="px-3 py-2 border rounded-lg"
                >
                  <option value="">All Approval</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>

                {user?.role === 'admin' && (
                  <>
                    <Button onClick={() => handleExport('csv')} variant="outline">
                      Export CSV
                    </Button>
                    <Button onClick={() => handleExport('excel')} variant="outline">
                      Export Excel
                    </Button>
                  </>
                )}
              </div>
            </div>
          </Card>

          {/* Bulk Actions */}
          {showBulkActions && (
            <Card className="p-4 mb-6 bg-blue-50 border-blue-200">
              <div className="flex items-center justify-between">
                <span className="font-medium text-blue-900">
                  {selectedUsers.size} user(s) selected
                </span>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleBulkOperation('activate')}
                    variant="outline"
                    size="sm"
                  >
                    Activate
                  </Button>
                  <Button
                    onClick={() => handleBulkOperation('deactivate')}
                    variant="outline"
                    size="sm"
                  >
                    Deactivate
                  </Button>
                  <Button
                    onClick={() => handleBulkOperation('delete')}
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                  >
                    Delete
                  </Button>
                  <Button
                    onClick={() => {
                      setSelectedUsers(new Set());
                      setShowBulkActions(false);
                    }}
                    variant="outline"
                    size="sm"
                  >
                    Clear Selection
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Warning for teachers without institutionId */}
          {user?.role === 'teacher' && !user?.institutionId && (
            <Card className="mb-6 p-4 bg-yellow-50 border-yellow-200">
              <div className="flex items-center space-x-2">
                <span className="text-yellow-600">⚠️</span>
                <div>
                  <p className="text-sm font-semibold text-yellow-800">Institution Required</p>
                  <p className="text-xs text-yellow-700">
                    You need to have an institution assigned to view and manage students. Please contact your administrator.
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Users Table */}
          <Card>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : users.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                {user?.role === 'teacher' && !user?.institutionId ? (
                  <div>
                    <p>No users found. You need to have an institution assigned.</p>
                    <p className="text-xs text-gray-400 mt-2">Please contact your administrator.</p>
                  </div>
                ) : (
                  'No users found'
                )}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left">
                          <input
                            type="checkbox"
                            checked={selectedUsers.size === users.length && users.length > 0}
                            onChange={handleSelectAll}
                            className="rounded"
                          />
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Institution
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Approval
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Last Login
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.map((userItem) => {
                        const userId = (userItem as any).id || userItem._id; // Handle both id and _id
                        return (
                        <tr key={userId} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedUsers.has(userId)}
                              onChange={() => handleSelectUser(userId)}
                              className="rounded"
                            />
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {userItem.name}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{userItem.email}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${
                                userItem.role === 'admin'
                                  ? 'bg-purple-100 text-purple-800'
                                  : userItem.role === 'teacher'
                                  ? 'bg-blue-100 text-blue-800'
                                  : userItem.role === 'student'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {userItem.role}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {typeof userItem.institutionId === 'object' && userItem.institutionId
                              ? userItem.institutionId.name
                              : 'N/A'}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${
                                userItem.isActive
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {userItem.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {userItem.approvalStatus ? (
                              <span
                                className={`px-2 py-1 text-xs rounded-full ${
                                  userItem.approvalStatus === 'approved'
                                    ? 'bg-green-100 text-green-800'
                                    : userItem.approvalStatus === 'pending'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {userItem.approvalStatus.charAt(0).toUpperCase() + userItem.approvalStatus.slice(1)}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs">N/A</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {userItem.lastLogin
                              ? new Date(userItem.lastLogin).toLocaleDateString()
                              : 'Never'}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex gap-2">
                              {userItem.role === 'student' && userItem.approvalStatus === 'pending' && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="bg-green-50 text-green-700 border-green-300 hover:bg-green-100"
                                    onClick={async () => {
                                      if (confirm(`Approve ${userItem.name}?`)) {
                                        try {
                                          const response = await usersApi.approveStudent(userId);
                                          if (response.success) {
                                            alert('Student approved successfully!');
                                            loadUsers();
                                          } else {
                                            alert('Failed to approve: ' + (response.message || 'Unknown error'));
                                          }
                                        } catch (error: any) {
                                          alert('Error: ' + (error.message || 'Unknown error'));
                                        }
                                      }
                                    }}
                                  >
                                    Approve
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="bg-red-50 text-red-700 border-red-300 hover:bg-red-100"
                                    onClick={async () => {
                                      const reason = prompt('Enter rejection reason (optional):');
                                      if (reason !== null) {
                                        try {
                                          const response = await usersApi.rejectStudent(userId, reason || undefined);
                                          if (response.success) {
                                            alert('Student rejected.');
                                            loadUsers();
                                          } else {
                                            alert('Failed to reject: ' + (response.message || 'Unknown error'));
                                          }
                                        } catch (error: any) {
                                          alert('Error: ' + (error.message || 'Unknown error'));
                                        }
                                      }
                                    }}
                                  >
                                    Reject
                                  </Button>
                                </>
                              )}
                              {user?.role === 'admin' && (userItem.role === 'teacher' || userItem.role === 'admin') && (
                                <div className="relative">
                                  {editingInstitutionFor === userId ? (
                                    <div className="flex items-center space-x-2">
                                      <select
                                        className="text-xs border border-blue-300 rounded px-2 py-1 bg-white"
                                        onChange={async (e) => {
                                          const newInstitutionId = e.target.value;
                                          if (newInstitutionId) {
                                            try {
                                              const response = await usersApi.update(userId, {
                                                institutionId: newInstitutionId
                                              });
                                              if (response.success) {
                                                alert('Institution updated successfully!');
                                                loadUsers();
                                                setEditingInstitutionFor(null);
                                              } else {
                                                alert('Failed to update: ' + (response.message || 'Unknown error'));
                                              }
                                            } catch (error: any) {
                                              alert('Error: ' + (error.message || 'Unknown error'));
                                            }
                                          }
                                          setEditingInstitutionFor(null);
                                        }}
                                        onBlur={() => setEditingInstitutionFor(null)}
                                        autoFocus
                                      >
                                        <option value="">Select Institution</option>
                                        {schools.map((school) => (
                                          <option key={school._id} value={school._id}>
                                            {school.name}
                                          </option>
                                        ))}
                                      </select>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setEditingInstitutionFor(null)}
                                      >
                                        Cancel
                                      </Button>
                                    </div>
                                  ) : (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100"
                                      onClick={() => setEditingInstitutionFor(userId)}
                                    >
                                      {typeof userItem.institutionId === 'object' && userItem.institutionId
                                        ? 'Change'
                                        : 'Set Institution'}
                                    </Button>
                                  )}
                                </div>
                              )}
                              <Link href={`/users/${userId}`}>
                                <Button variant="outline" size="sm">
                                  View
                                </Button>
                              </Link>
                            </div>
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="px-4 py-3 border-t flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Showing {((filters.page || 1) - 1) * (filters.limit || 20) + 1} to{' '}
                      {Math.min((filters.page || 1) * (filters.limit || 20), totalUsers)} of{' '}
                      {totalUsers} users
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setFilters({ ...filters, page: (filters.page || 1) - 1 })}
                        disabled={(filters.page || 1) === 1}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setFilters({ ...filters, page: (filters.page || 1) + 1 })}
                        disabled={(filters.page || 1) >= totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </Card>
          </main>
        </div>
      </div>
  );
}
