/**
 * Children Management Page
 * Manage all linked children - view, unlink, edit relationships
 * Parent Monitoring System - Phase 1
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';
import { parentApi, ParentChild } from '@/lib/api/parent';
import { Card } from '@/components/ui/card';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { formatParentStatusLabel } from '@/lib/api/parent-honesty';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import {
  Users,
  Search,
  Edit,
  Trash2,
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  Activity,
  Clock,
  X,
  Save,
  QrCode,
  Eye
} from 'lucide-react';

export default function ChildrenManagementPage() {
  const router = useRouter();
  const { user, isAuthenticated, accessToken } = useAuthStore();
  const { showToast } = useToast();
  const [children, setChildren] = useState<ParentChild[]>([]);
  const [filteredChildren, setFilteredChildren] = useState<ParentChild[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingRelationship, setEditingRelationship] = useState<string | null>(null);
  const [newRelationship, setNewRelationship] = useState<string>('');
  const [unlinkingChild, setUnlinkingChild] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user?.role !== 'parent') {
      router.push('/dashboard');
      return;
    }

    if (accessToken) {
      const { apiClient } = require('@/lib/api/client');
      apiClient.setToken(accessToken);
    }

    loadChildren();
  }, [isAuthenticated, router, accessToken, user]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = children.filter(child =>
        child.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        child.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        child.grade?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        child.section?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredChildren(filtered);
    } else {
      setFilteredChildren(children);
    }
  }, [searchQuery, children]);

  const loadChildren = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await parentApi.getChildren();
      if (response.success && response.data?.children) {
        setChildren(response.data.children);
        setFilteredChildren(response.data.children);
      }
    } catch (error: any) {
      console.error('Error loading children:', error);
      showToast('Failed to load children', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  const handleUnlink = async (childId: string, childName: string) => {
    if (!confirm(`Unlink ${childName} from your parent account? This removes the parent–child link, not the student's school account.`)) {
      return;
    }

    setUnlinkingChild(childId);
    try {
      const response = await parentApi.unlinkChild(childId);
      if (response.success) {
        showToast('Child unlinked successfully', 'success');
        loadChildren();
      } else {
        showToast(response.message || 'Failed to unlink child', 'error');
      }
    } catch (error: any) {
      console.error('Error unlinking child:', error);
      showToast(error.message || 'Failed to unlink child', 'error');
    } finally {
      setUnlinkingChild(null);
    }
  };

  const handleEditRelationship = (child: ParentChild) => {
    setEditingRelationship(child._id);
    setNewRelationship(child.relationship || 'other');
  };

  const handleSaveRelationship = async (childId: string) => {
    try {
      const response = await parentApi.updateRelationship(childId, newRelationship);
      if (response.success) {
        showToast('Relationship updated successfully', 'success');
        setEditingRelationship(null);
        loadChildren();
      } else {
        showToast(response.message || 'Failed to update relationship', 'error');
      }
    } catch (error: any) {
      console.error('Error updating relationship:', error);
      showToast(error.message || 'Failed to update relationship', 'error');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'safe':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'in_drill':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'emergency':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'safe':
        return <CheckCircle className="w-4 h-4" />;
      case 'in_drill':
        return <Activity className="w-4 h-4" />;
      case 'emergency':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getChildStatus = (child: ParentChild) => {
    return child.stats?.status || child.safetyStatus || 'unknown';
  };

  if (isLoading) {
    return (
      <AppShell title="Manage children">
        <LoadingSkeleton />
      </AppShell>
    );
  }

  return (
    <AppShell title="Manage children">
          <div className="mb-6">
            <Button
              onClick={() => router.push('/parent/dashboard')}
              variant="outline"
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <div className="w-12 h-12 bg-teal-800 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  Manage Children
                </h1>
                <p className="text-gray-600 mt-2">View and manage all your linked children</p>
              </div>
              <Button
                onClick={() => router.push('/parent/add-child')}
                className="flex items-center gap-2"
              >
                <Users className="w-4 h-4" />
                Add child
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <Card className="p-4 mb-6">
            <div className="flex items-center gap-3">
              <Search className="w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search by name, email, grade, or section..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
            </div>
          </Card>

          {/* Children Table */}
          {filteredChildren.length === 0 ? (
            <Card className="p-12 text-center">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Children Found</h3>
              <p className="text-gray-600 mb-4">
                {searchQuery ? 'Try a different search term' : 'Add your first child to get started'}
              </p>
              {!searchQuery && (
                <Button
                  onClick={() => router.push('/parent/add-child')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Add Child
                </Button>
              )}
            </Card>
          ) : (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Child</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Relationship</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredChildren.map((child) => {
                      const status = getChildStatus(child);
                      const isEditing = editingRelationship === child._id;
                      return (
                        <tr key={child._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                                {child.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{child.name}</div>
                                {child.email && (
                                  <div className="text-sm text-gray-500">{child.email}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {child.grade && child.section ? (
                              <div className="text-sm text-gray-900">
                                Grade {child.grade} - {child.section}
                              </div>
                            ) : child.classId ? (
                              <div className="text-sm text-gray-900">{child.classId.classCode}</div>
                            ) : (
                              <span className="text-sm text-gray-400">N/A</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {isEditing ? (
                              <div className="flex items-center gap-2">
                                <select
                                  value={newRelationship}
                                  onChange={(e) => setNewRelationship(e.target.value)}
                                  className="text-sm border border-gray-300 rounded px-2 py-1"
                                >
                                  <option value="father">Father</option>
                                  <option value="mother">Mother</option>
                                  <option value="guardian">Guardian</option>
                                  <option value="other">Other</option>
                                </select>
                                <Button
                                  size="sm"
                                  onClick={() => handleSaveRelationship(child._id)}
                                  className="p-1 h-7 w-7"
                                >
                                  <Save className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingRelationship(null)}
                                  className="p-1 h-7 w-7"
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-900 capitalize">
                                  {child.relationship || 'other'}
                                </span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEditRelationship(child)}
                                  className="p-1 h-6 w-6"
                                >
                                  <Edit className="w-3 h-3 text-gray-400" />
                                </Button>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`px-3 py-1 rounded-full border inline-flex items-center gap-1 ${getStatusColor(status)}`}>
                              {getStatusIcon(status)}
                              <span className="text-xs font-medium">{formatParentStatusLabel(status)}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {child.stats ? (
                              <div className="text-sm">
                                <div className="text-gray-900">Score: {child.stats.preparednessScore}%</div>
                                <div className="text-gray-500">Modules: {child.stats.modulesCompleted}</div>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">N/A</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => router.push(`/parent/children/${child._id}`)}
                                className="flex items-center gap-1"
                              >
                                <Eye className="w-4 h-4" />
                                View
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUnlink(child._id, child.name)}
                                disabled={unlinkingChild === child._id}
                                className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:border-red-300"
                              >
                                <Trash2 className="w-4 h-4" />
                                {unlinkingChild === child._id ? 'Unlinking...' : 'Unlink'}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
    </AppShell>
  );
}

