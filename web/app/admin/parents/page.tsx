'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';
import { usersApi } from '@/lib/api/users';
import { authApi } from '@/lib/api/auth';
import { schoolsApi } from '@/lib/api/schools';
import { apiClient } from '@/lib/api/client';
import { Card } from '@/components/ui/card';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import {
  Users,
  Search,
  UserPlus,
  Edit,
  Trash2,
  Shield,
  CheckCircle,
  XCircle,
  Eye,
  Link as LinkIcon,
  Building2
} from 'lucide-react';

interface Parent {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  parentProfile?: {
    phoneNumber?: string;
    relationship?: string;
    verified?: boolean;
  };
  childrenIds?: string[];
  institutionId?: {
    _id: string;
    name: string;
  };
  approvalStatus?: string;
  createdAt?: string;
}

export default function AdminParentsPage() {
  const router = useRouter();
  const { user, isAuthenticated, accessToken } = useAuthStore();
  const { showToast } = useToast();

  const [parents, setParents] = useState<Parent[]>([]);
  const [filteredParents, setFilteredParents] = useState<Parent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInstitution, setSelectedInstitution] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [schools, setSchools] = useState<any[]>([]);
  const [parentFormData, setParentFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    institutionId: '',
  });
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    phone?: string;
    institutionId?: string;
  }>({});

  useEffect(() => {
    if (!isAuthenticated || (user?.role !== 'admin' && user?.role !== 'SYSTEM_ADMIN' && user?.role !== 'system_admin')) {
      router.push('/login');
      return;
    }

    if (accessToken) {
      apiClient.setToken(accessToken);
    }

    loadParents();
    loadSchools();
  }, [isAuthenticated, user, router, accessToken]);

  const loadSchools = useCallback(async () => {
    try {
      const token = accessToken || (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null);
      if (token) {
        apiClient.setToken(token);
      }
      
      const response = await schoolsApi.list();
      if (response.success && response.data) {
        const schoolsList = Array.isArray(response.data) ? response.data : (response.data as any).schools || [];
        setSchools(schoolsList);
      }
    } catch (error) {
      console.error('Error loading schools:', error);
    }
  }, [accessToken]);

  useEffect(() => {
    filterParents();
  }, [searchQuery, selectedInstitution, parents]);

  const loadParents = useCallback(async () => {
    setIsLoading(true);
    try {
      // Ensure token is set
      const token = accessToken || (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null);
      if (token) {
        apiClient.setToken(token);
      }
      
      // Fetch all parents across multiple pages
      let allParents: Parent[] = [];
      let page = 1;
      const limit = 100;
      let hasMore = true;
      let maxPages = 20; // Safety limit
      
      while (hasMore && page <= maxPages) {
        const response = await usersApi.list({ 
          role: 'parent', 
          page,
          limit
        });
        
        if (response.success && response.data) {
          let parentsList: Parent[] = [];
          const data = response.data as any;
          
          // Handle different response formats
          if (Array.isArray(data)) {
            parentsList = data as Parent[];
          } else if (data.users && Array.isArray(data.users)) {
            parentsList = data.users as Parent[];
          } else if (data.data && Array.isArray(data.data)) {
            parentsList = data.data as Parent[];
          }
          
          allParents = [...allParents, ...parentsList];
          
          // Check if there are more pages
          const total = data.total || response.data.total || 0;
          const totalPages = data.totalPages || Math.ceil(total / limit);
          hasMore = parentsList.length === limit && page < totalPages;
          page++;
          
          if (parentsList.length < limit) {
            hasMore = false;
          }
        } else {
          hasMore = false;
          if (page === 1) {
            showToast(response.message || 'Failed to load parents', 'error');
          }
        }
      }
      
      setParents(allParents);
      
      if (allParents.length === 0 && page === 1) {
        // No error, just no parents found
        console.log('No parents found');
      }
    } catch (error: any) {
      console.error('Error loading parents:', error);
      showToast('Failed to load parents: ' + (error.message || 'Unknown error'), 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast, accessToken]);

  const filterParents = useCallback(() => {
    let filtered = [...parents];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        p =>
          p.name.toLowerCase().includes(query) ||
          p.email.toLowerCase().includes(query) ||
          p.phone?.toLowerCase().includes(query)
      );
    }

    // Filter by institution
    if (selectedInstitution !== 'all') {
      filtered = filtered.filter(
        p => p.institutionId?._id === selectedInstitution
      );
    }

    setFilteredParents(filtered);
  }, [searchQuery, selectedInstitution, parents]);

  const handleViewParent = (parentId: string) => {
    router.push(`/admin/parents/${parentId}`);
  };

  const handleLinkChild = (parentId: string) => {
    router.push(`/admin/parents/${parentId}/link-child`);
  };

  const validatePhone = (phone: string): string | null => {
    if (!phone || !phone.trim()) {
      return 'Phone number is required';
    }
    // Remove any spaces, dashes, or other characters
    const cleaned = phone.replace(/\D/g, '');
    // Check if it's a valid 10-digit Indian number (starts with 6-9)
    const phoneRegex = /^[6-9]\d{9}$/;
    if (cleaned.length !== 10 || !phoneRegex.test(cleaned)) {
      return 'Enter a valid 10-digit Indian phone number (starting with 6-9)';
    }
    return null;
  };

  const handleCreateParent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setFieldErrors({});
    
    // Client-side validation
    const phoneError = validatePhone(parentFormData.phone);
    if (phoneError) {
      setFieldErrors({ phone: phoneError });
      showToast('Please fix validation errors', 'error');
      return;
    }
    
    if (!parentFormData.name || !parentFormData.email || !parentFormData.password) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    setIsCreating(true);
    try {
      // Clean phone number (remove non-digits)
      const cleanedPhone = parentFormData.phone.replace(/\D/g, '');
      
      const response = await authApi.register({
        name: parentFormData.name,
        email: parentFormData.email,
        password: parentFormData.password,
        phone: cleanedPhone, // Send cleaned phone number
        role: 'parent',
        institutionId: parentFormData.institutionId || undefined,
      });

      if (response.success) {
        showToast('Parent created successfully', 'success');
        setShowAddModal(false);
        setFieldErrors({});
        setParentFormData({
          name: '',
          email: '',
          password: '',
          phone: '',
          institutionId: '',
        });
        // Reload parents list
        loadParents();
      } else {
        showToast(response.message || 'Failed to create parent', 'error');
      }
    } catch (error: any) {
      console.error('Error creating parent:', error);
      
      // Extract validation errors from response
      const errorData = error.response?.data || error.data || {};
      const newFieldErrors: typeof fieldErrors = {};
      
      // Backend returns errors in response.errors (from errorResponse utility)
      // Format: { success: false, message: "...", errors: { phone: "error", email: "error" } }
      if (errorData.errors && typeof errorData.errors === 'object') {
        // Check if errors is a direct object (not nested in fields/details)
        if (!errorData.errors.fields && !errorData.errors.details && !Array.isArray(errorData.errors)) {
          // Direct errors object: { errors: { phone: "error", email: "error" } }
          Object.entries(errorData.errors).forEach(([field, msg]: [string, any]) => {
            // Map backend field names to frontend field names if needed
            const frontendField = field === 'phoneNumber' ? 'phone' : field;
            newFieldErrors[frontendField as keyof typeof newFieldErrors] = Array.isArray(msg) ? msg.join(', ') : String(msg);
          });
        }
      }
      
      // Check for validation errors in different formats (for compatibility)
      if (errorData.errors?.fields) {
        // Formatted errors object: { errors: { fields: { name: "error", email: "error" } } }
        Object.entries(errorData.errors.fields).forEach(([field, msg]: [string, any]) => {
          const frontendField = field === 'phoneNumber' ? 'phone' : field;
          newFieldErrors[frontendField as keyof typeof newFieldErrors] = Array.isArray(msg) ? msg.join(', ') : String(msg);
        });
      }
      
      if (Array.isArray(errorData.errors?.details)) {
        // Array format: { errors: { details: [{ param: "name", msg: "error" }] } }
        errorData.errors.details.forEach((err: any) => {
          const field = err.param || err.path || err.field;
          if (field) {
            const frontendField = field === 'phoneNumber' ? 'phone' : field;
            newFieldErrors[frontendField as keyof typeof newFieldErrors] = err.msg || err.message;
          }
        });
      }
      
      if (errorData.fields) {
        // Direct fields object: { fields: { name: "error" } }
        Object.entries(errorData.fields).forEach(([field, msg]: [string, any]) => {
          const frontendField = field === 'phoneNumber' ? 'phone' : field;
          newFieldErrors[frontendField as keyof typeof newFieldErrors] = Array.isArray(msg) ? msg.join(', ') : String(msg);
        });
      }
      
      // Also check for fieldErrors property (from backend error.fieldErrors)
      if (error.fieldErrors) {
        Object.entries(error.fieldErrors).forEach(([field, msg]: [string, any]) => {
          const frontendField = field === 'phoneNumber' ? 'phone' : field;
          newFieldErrors[frontendField as keyof typeof newFieldErrors] = Array.isArray(msg) ? msg.join(', ') : String(msg);
        });
      }
      
      // Log error details for debugging
      console.log('Full error data:', errorData);
      console.log('Extracted field errors:', newFieldErrors);
      
      // Set field errors
      if (Object.keys(newFieldErrors).length > 0) {
        setFieldErrors(newFieldErrors);
      }
      
      // Show general error message
      const errorMessage = errorData.message || error.message || 'Failed to create parent';
      showToast(errorMessage, 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const handleFieldChange = (field: keyof typeof parentFormData, value: string) => {
    setParentFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  if (!isAuthenticated || (user?.role !== 'admin' && user?.role !== 'SYSTEM_ADMIN' && user?.role !== 'system_admin')) {
    return null;
  }

  // Get unique institutions from parents
  const institutions = Array.from(
    new Set(
      parents
        .map(p => p.institutionId)
        .filter(Boolean)
        .map(i => JSON.stringify({ _id: i!._id, name: i!.name }))
    )
  ).map((i, index) => ({ ...JSON.parse(i), key: `inst-${index}` }));

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-blue-50 via-white to-blue-50 p-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  Parent Management
                </h1>
                <p className="text-gray-600 mt-2">
                  Manage parent accounts and student relationships
                </p>
              </div>
              <Button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <UserPlus className="w-4 h-4" />
                Add Parent
              </Button>
            </div>
          </div>

          {/* Filters */}
          <Card className="p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search parents by name, email, or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-full md:w-64">
                <select
                  value={selectedInstitution}
                  onChange={(e) => setSelectedInstitution(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Institutions</option>
                  {institutions.map((inst) => (
                    <option key={inst._id || inst.key} value={inst._id}>
                      {inst.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Card>

          {/* Parents Table */}
          {isLoading ? (
            <LoadingSkeleton />
          ) : filteredParents.length === 0 ? (
            <Card className="p-12 text-center">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Parents Found
              </h3>
              <p className="text-gray-600 mb-4">
                {searchQuery || selectedInstitution !== 'all'
                  ? 'Try adjusting your search filters'
                  : 'No parent accounts have been created yet'}
              </p>
              <Button
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Create First Parent
              </Button>
            </Card>
          ) : (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Parent
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Institution
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Children
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredParents.map((parent, index) => (
                      <tr key={parent._id || `parent-${index}`} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                              {parent.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {parent.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {parent.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {parent.phone || parent.parentProfile?.phoneNumber || 'N/A'}
                          </div>
                          {parent.parentProfile?.relationship && (
                            <div className="text-xs text-gray-500 capitalize">
                              {parent.parentProfile.relationship}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900">
                            <Building2 className="w-4 h-4 mr-2 text-gray-400" />
                            {parent.institutionId?.name || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {parent.childrenIds?.length || 0} linked
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {parent.approvalStatus === 'approved' ? (
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-500" />
                                <span className="text-sm text-green-700">Approved</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <XCircle className="w-5 h-5 text-yellow-500" />
                                <span className="text-sm text-yellow-700">Pending</span>
                              </div>
                            )}
                            {parent.parentProfile?.verified && (
                              <span title="Verified">
                                <Shield className="w-4 h-4 text-blue-500" />
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewParent(parent._id)}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleLinkChild(parent._id)}
                              className="text-green-600 hover:text-green-700"
                            >
                              <LinkIcon className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Stats Summary */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Parents</p>
                  <p className="text-2xl font-bold text-gray-900">{parents.length}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600 opacity-50" />
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Approved</p>
                  <p className="text-2xl font-bold text-green-700">
                    {parents.filter(p => p.approvalStatus === 'approved').length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600 opacity-50" />
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Children</p>
                  <p className="text-2xl font-bold text-purple-700">
                    {parents.reduce((sum, p) => sum + (p.childrenIds?.length || 0), 0)}
                  </p>
                </div>
                <Users className="w-8 h-8 text-purple-600 opacity-50" />
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Verified</p>
                  <p className="text-2xl font-bold text-blue-700">
                    {parents.filter(p => p.parentProfile?.verified).length}
                  </p>
                </div>
                <Shield className="w-8 h-8 text-blue-600 opacity-50" />
              </div>
            </Card>
          </div>

          {/* Add Parent Modal */}
          {showAddModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <Card className="w-full max-w-md p-6 m-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">Add New Parent</h2>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAddModal(false);
                      setFieldErrors({});
                      setParentFormData({
                        name: '',
                        email: '',
                        password: '',
                        phone: '',
                        institutionId: '',
                      });
                    }}
                  >
                    ✕
                  </Button>
                </div>
                <form onSubmit={handleCreateParent} className="space-y-4">
                  <div>
                    <Input
                      type="text"
                      label="Name *"
                      value={parentFormData.name}
                      onChange={(e) => handleFieldChange('name', e.target.value)}
                      required
                      placeholder="Parent name"
                      error={fieldErrors.name}
                    />
                  </div>
                  <div>
                    <Input
                      type="email"
                      label="Email *"
                      value={parentFormData.email}
                      onChange={(e) => handleFieldChange('email', e.target.value)}
                      required
                      placeholder="parent@example.com"
                      error={fieldErrors.email}
                    />
                  </div>
                  <div>
                    <Input
                      type="password"
                      label="Password *"
                      value={parentFormData.password}
                      onChange={(e) => handleFieldChange('password', e.target.value)}
                      required
                      placeholder="Minimum 6 characters"
                      minLength={6}
                      error={fieldErrors.password}
                    />
                    {!fieldErrors.password && (
                      <p className="mt-1 text-xs text-gray-500">Must be at least 6 characters long</p>
                    )}
                  </div>
                  <div>
                    <Input
                      type="tel"
                      label="Phone *"
                      value={parentFormData.phone}
                      onChange={(e) => {
                        // Only allow digits
                        const value = e.target.value.replace(/\D/g, '');
                        // Limit to 10 digits
                        const limited = value.slice(0, 10);
                        handleFieldChange('phone', limited);
                      }}
                      placeholder="10-digit Indian number (6-9)"
                      required
                      maxLength={10}
                      error={fieldErrors.phone}
                    />
                    {!fieldErrors.phone && (
                      <p className="mt-1 text-xs text-gray-500">
                        Must be a 10-digit Indian number starting with 6, 7, 8, or 9
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Institution (Optional)
                    </label>
                    <select
                      value={parentFormData.institutionId}
                      onChange={(e) => handleFieldChange('institutionId', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        fieldErrors.institutionId ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select Institution</option>
                      {schools.map((school) => (
                        <option key={school._id} value={school._id}>
                          {school.name}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.institutionId && (
                      <p className="mt-1 text-sm text-red-600">{fieldErrors.institutionId}</p>
                    )}
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setShowAddModal(false);
                        setFieldErrors({});
                        setParentFormData({
                          name: '',
                          email: '',
                          password: '',
                          phone: '',
                          institutionId: '',
                        });
                      }}
                      disabled={isCreating}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                      disabled={isCreating}
                    >
                      {isCreating ? 'Creating...' : 'Create Parent'}
                    </Button>
                  </div>
                </form>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

