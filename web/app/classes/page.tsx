'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';
import { classesApi, Class, CreateClassRequest } from '@/lib/api/classes';
import { schoolsApi, School } from '@/lib/api/schools';
import { usersApi, User } from '@/lib/api/users';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { AdminRoute } from '@/components/auth/AdminRoute';
import { useToast } from '@/components/ui/toast';
import { motion } from 'framer-motion';
import { AnimatedCounter } from '@/components/dashboard/AnimatedCounter';
import {
  GraduationCap,
  Users,
  UserCheck,
  Building2,
  Plus,
  Filter,
  LayoutGrid,
  Table2,
  X,
  Calendar,
  BookOpen,
  UserPlus,
  Trash2,
  RefreshCw
} from 'lucide-react';

interface AdminClass extends Omit<Class, 'teacherId'> {
  institutionId: string | { _id: string; name: string };
  teacherId: string | { _id: string; name: string; email: string } | null;
}

interface Institution {
  _id: string;
  name: string;
}

interface Teacher {
  _id: string;
  name: string;
  email: string;
}

type ViewMode = 'cards' | 'table';

function ClassesPageContent() {
  const router = useRouter();
  const { accessToken, user } = useAuthStore();
  const { showToast } = useToast();
  const [classes, setClasses] = useState<AdminClass[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [assigningTeacher, setAssigningTeacher] = useState<string | null>(null);
  const [deletingClass, setDeletingClass] = useState<string | null>(null);
  const [creatingClass, setCreatingClass] = useState(false);
  const [filters, setFilters] = useState({
    institutionId: '',
    teacherId: '',
    grade: '',
    includeInactive: false
  });
  const [formData, setFormData] = useState<CreateClassRequest>({
    institutionId: user?.institutionId || '',
    grade: '1',
    section: 'A',
    roomNumber: '',
    capacity: 40,
    academicYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`
  });

  const grades = ['KG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
  const sections = ['A', 'B', 'C', 'D', 'E'];

  useEffect(() => {
    // Ensure API client has token
    if (accessToken) {
      import('@/lib/api/client').then(({ apiClient }) => {
        apiClient.setToken(accessToken);
      });
    }

    loadData();
  }, [accessToken]);

  useEffect(() => {
    loadClasses();
  }, [filters]);

  // Load view preference from localStorage
  useEffect(() => {
    const savedViewMode = localStorage.getItem('classesViewMode') as ViewMode;
    if (savedViewMode === 'cards' || savedViewMode === 'table') {
      setViewMode(savedViewMode);
    }
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadClasses(),
        loadInstitutions(),
        loadTeachers()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadClasses = async () => {
    try {
      const response = await classesApi.list({
        limit: 1000,
        institutionId: filters.institutionId || undefined,
        teacherId: filters.teacherId === 'unassigned' ? '' : (filters.teacherId || undefined),
        grade: filters.grade || undefined,
        includeInactive: filters.includeInactive
      });

      if (response.success && response.data) {
        let classesList = response.data.classes || [];
        
        // Filter unassigned classes if needed
        if (filters.teacherId === 'unassigned') {
          classesList = classesList.filter((c: AdminClass) => !c.teacherId || c.teacherId === null);
        }
        
        setClasses(classesList as AdminClass[]);
      }
    } catch (error: any) {
      console.error('Error loading classes:', error);
      if (error.response?.status === 403) {
        showToast('You do not have permission to view classes. Please contact an administrator.', 'error');
      } else {
        showToast('Failed to load classes. Please try again.', 'error');
      }
    }
  };

  const loadInstitutions = async () => {
    try {
      const response = await schoolsApi.list();
      if (response.success && response.data) {
        setInstitutions(response.data || []);
      }
    } catch (error) {
      console.error('Error loading institutions:', error);
    }
  };

  const loadTeachers = async () => {
    try {
      const response = await usersApi.list({ role: 'teacher', limit: 500 });
      if (response.success && response.data) {
        const teacherList = response.data.users || [];
        // Filter out teachers with invalid IDs and ensure all IDs are valid MongoDB ObjectIds
        const validTeachers = teacherList
          .filter((t: User) => t._id && typeof t._id === 'string' && /^[0-9a-fA-F]{24}$/.test(t._id.trim()))
          .map((t: User) => ({
            _id: t._id.trim(), // Ensure no whitespace
            name: t.name,
            email: t.email
          }));
        
        if (validTeachers.length !== teacherList.length) {
          console.warn(`Filtered out ${teacherList.length - validTeachers.length} teachers with invalid IDs`);
        }
        
        setTeachers(validTeachers);
      }
    } catch (error: any) {
      console.error('Error loading teachers:', error);
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.institutionId) {
      showToast('Please select an institution', 'warning');
      return;
    }
    if (!formData.grade || !formData.section) {
      showToast('Please select grade and section', 'warning');
      return;
    }
    
    setCreatingClass(true);
    const payload: CreateClassRequest = {
      institutionId: formData.institutionId,
      grade: formData.grade,
      section: formData.section,
      academicYear: formData.academicYear || undefined,
      roomNumber: formData.roomNumber?.trim() || undefined,
      capacity: formData.capacity || undefined,
      teacherId: formData.teacherId || undefined
    };
    
    try {
      const response = await classesApi.create(payload);
      
      if (response.success) {
        const message = response.message || '';
        if (message.toLowerCase().includes('already exists')) {
          showToast('Class already exists. The existing class has been loaded.', 'info');
        } else {
          showToast('Class created successfully!', 'success');
        }
        setShowCreateForm(false);
        setFormData({
          institutionId: user?.institutionId || '',
          grade: '1',
          section: 'A',
          roomNumber: '',
          capacity: 40,
          academicYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`
        });
        await loadClasses();
      } else {
        const errorMessage = response.message || response.error || 'Unknown error';
        showToast(`Failed to create class: ${errorMessage}`, 'error');
      }
    } catch (error: any) {
      console.error('Class creation error:', error);
      const errorMessage = error.message || error.response?.data?.message || 'Unknown error';
      showToast(`Error creating class: ${errorMessage}`, 'error');
    } finally {
      setCreatingClass(false);
    }
  };

  const handleAssignTeacher = async (classId: string, teacherId: string) => {
    if (assigningTeacher === classId) return;

    // Validate classId format (MongoDB ObjectId)
    if (!classId || !/^[0-9a-fA-F]{24}$/.test(classId)) {
      showToast('Invalid class ID format', 'error');
      return;
    }

    // Trim and normalize teacherId
    const trimmedTeacherId = teacherId ? teacherId.trim() : '';
    
    // Validate teacherId: if provided (not empty), must be valid MongoDB ObjectId
    // Empty string is allowed for removal
    if (trimmedTeacherId && trimmedTeacherId !== '' && !/^[0-9a-fA-F]{24}$/.test(trimmedTeacherId)) {
      console.error('Invalid teacher ID format:', trimmedTeacherId);
      showToast('Invalid teacher ID format. Please try again.', 'error');
      return;
    }

    setAssigningTeacher(classId);
    try {
      console.log('Assigning teacher:', { classId, trimmedTeacherId });
      
      // Pass trimmed teacherId (empty string for removal, valid ID for assignment)
      // Backend validation accepts empty string, null, undefined, or valid MongoId
      const response = await classesApi.assignTeacher(classId, trimmedTeacherId || '');
      
      console.log('Assignment response:', response);
      
      if (response && response.success) {
        if (trimmedTeacherId && trimmedTeacherId !== '') {
          const teacher = teachers.find(t => t._id === trimmedTeacherId);
          showToast(`Teacher ${teacher?.name || 'assigned'} assigned successfully!`, 'success');
        } else {
          showToast('Teacher removed successfully!', 'success');
        }
        
        // Reload classes, but don't let it block the state clearing
        try {
          await loadClasses();
        } catch (reloadError) {
          console.error('Error reloading classes after assignment:', reloadError);
          // Don't show error to user, assignment was successful
        }
      } else {
        const errorMessage = response?.message || response?.error || 'Unknown error';
        console.error('Assignment failed:', errorMessage);
        showToast(`Failed to assign teacher: ${errorMessage}`, 'error');
      }
    } catch (error: any) {
      console.error('Error assigning teacher:', error);
      const errorData = error.response?.data || error.data || {};
      
      // Extract validation errors if present
      let errorMessage = error.message || errorData.message || errorData.error || 'Unknown error';
      
      // Check for validation errors in different formats
      if (errorData.errors) {
        if (errorData.errors.fields) {
          // Formatted errors object
          const validationErrors = Object.entries(errorData.errors.fields)
            .map(([field, msg]: [string, any]) => `${field}: ${Array.isArray(msg) ? msg.join(', ') : msg}`)
            .join('; ');
          errorMessage = `${errorMessage} - ${validationErrors}`;
        } else if (Array.isArray(errorData.errors.details)) {
          // Array format
          const validationErrors = errorData.errors.details
            .map((err: any) => `${err.param || err.path}: ${err.msg}`)
            .join('; ');
          errorMessage = `${errorMessage} - ${validationErrors}`;
        }
      } else if (errorData.fields) {
        // Direct fields object
        const validationErrors = Object.entries(errorData.fields)
          .map(([field, msg]: [string, any]) => `${field}: ${Array.isArray(msg) ? msg.join(', ') : msg}`)
          .join('; ');
        errorMessage = `${errorMessage} - ${validationErrors}`;
      }
      
      showToast(`Error assigning teacher: ${errorMessage}`, 'error');
    } finally {
      // Always clear the assigning state, even on error or if loadClasses fails
      console.log('Clearing assigning state for class:', classId);
      setAssigningTeacher(null);
    }
  };

  const handleDeleteClass = async (classId: string) => {
    const classToDelete = classes.find(c => c._id === classId);
    if (!classToDelete) return;

    const confirmMessage = `Are you sure you want to delete this class?\n\nGrade ${classToDelete.grade} - Section ${classToDelete.section}\nClass Code: ${classToDelete.classCode}\n\nThis action cannot be undone.`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    setDeletingClass(classId);
    try {
      const response = await classesApi.delete(classId);
      if (response.success) {
        showToast('Class deleted successfully!', 'success');
        await loadClasses();
      } else {
        showToast(`Failed to delete class: ${response.message || 'Unknown error'}`, 'error');
      }
    } catch (error: any) {
      showToast(`Error deleting class: ${error.message || 'Unknown error'}`, 'error');
    } finally {
      setDeletingClass(null);
    }
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('classesViewMode', mode);
  };

  const clearFilters = () => {
    setFilters({
      institutionId: '',
      teacherId: '',
      grade: '',
      includeInactive: false
    });
  };

  const getInstitutionName = (institutionId: string | { _id: string; name: string } | null | undefined) => {
    if (!institutionId) return 'Unknown';
    if (typeof institutionId === 'object') {
      return institutionId.name || 'Unknown';
    }
    const institution = institutions.find(i => i._id === institutionId);
    return institution?.name || 'Unknown';
  };

  const getTeacherName = (teacherId: string | { _id: string; name: string; email: string } | null | undefined) => {
    if (!teacherId || teacherId === null) return null;
    if (typeof teacherId === 'object' && teacherId !== null) {
      return teacherId;
    }
    if (typeof teacherId === 'string') {
      const teacher = teachers.find(t => t._id === teacherId);
      return teacher ? { name: teacher.name, email: teacher.email } : null;
    }
    return null;
  };

  const getCurrentTeacherId = (classItem: AdminClass): string | null => {
    if (!classItem.teacherId) return null;
    if (typeof classItem.teacherId === 'object' && classItem.teacherId !== null) {
      return classItem.teacherId._id;
    }
    if (typeof classItem.teacherId === 'string') {
      return classItem.teacherId;
    }
    return null;
  };

  const activeFiltersCount = [
    filters.institutionId,
    filters.teacherId,
    filters.grade,
    filters.includeInactive
  ].filter(Boolean).length;

  // Calculate statistics
  const totalClasses = classes.length;
  const activeClasses = classes.filter(c => c.isActive !== false).length;
  const unassignedClasses = classes.filter(c => !c.teacherId || c.teacherId === null).length;
  const totalStudents = classes.reduce((sum, c) => sum + (c.studentIds?.length || 0), 0);

  // Animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, duration: 0.5 }
    })
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };


  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-3">
              <motion.div
                className="p-3 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/20"
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <GraduationCap className="h-6 w-6" />
              </motion.div>
              <div className="flex-1">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                  Class <span className="text-blue-600">Management</span>
                </h1>
                <p className="text-gray-600 mt-1 text-base">
                  View and manage all classes across all institutions
                </p>
              </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.5 }}
              >
                <Card className="p-5 bg-gradient-to-br from-white to-blue-50/30 backdrop-blur-sm border-2 border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Total Classes</p>
                      <p className="text-2xl font-bold text-gray-900">
                        <AnimatedCounter value={totalClasses} />
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-blue-100">
                      <BookOpen className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <Card className="p-5 bg-gradient-to-br from-white to-emerald-50/30 backdrop-blur-sm border-2 border-gray-200 hover:border-emerald-300 hover:shadow-lg transition-all rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Active Classes</p>
                      <p className="text-2xl font-bold text-gray-900">
                        <AnimatedCounter value={activeClasses} />
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-emerald-100">
                      <UserCheck className="h-6 w-6 text-emerald-600" />
                    </div>
                  </div>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <Card className="p-5 bg-gradient-to-br from-white to-amber-50/30 backdrop-blur-sm border-2 border-gray-200 hover:border-amber-300 hover:shadow-lg transition-all rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Unassigned</p>
                      <p className="text-2xl font-bold text-gray-900">
                        <AnimatedCounter value={unassignedClasses} />
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-amber-100">
                      <UserPlus className="h-6 w-6 text-amber-600" />
                    </div>
                  </div>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                <Card className="p-5 bg-gradient-to-br from-white to-purple-50/30 backdrop-blur-sm border-2 border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Total Students</p>
                      <p className="text-2xl font-bold text-gray-900">
                        <AnimatedCounter value={totalStudents} />
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-purple-100">
                      <Users className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </Card>
              </motion.div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 mb-6">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={() => handleViewModeChange(viewMode === 'cards' ? 'table' : 'cards')}
                  variant="outline"
                  className="border-2 border-gray-300 hover:border-blue-400 hover:bg-blue-50"
                >
                  {viewMode === 'cards' ? (
                    <>
                      <Table2 className="h-4 w-4 mr-2" />
                      Table View
                    </>
                  ) : (
                    <>
                      <LayoutGrid className="h-4 w-4 mr-2" />
                      Card View
                    </>
                  )}
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={() => setShowCreateForm(!showCreateForm)}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md shadow-blue-500/30"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {showCreateForm ? 'Cancel' : 'Create Class'}
                </Button>
              </motion.div>
            </div>
          </motion.div>

          {/* Create Class Form */}
          {showCreateForm && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="mb-6 p-6 bg-gradient-to-br from-white to-blue-50/20 backdrop-blur-sm border-2 border-blue-300 shadow-xl rounded-xl">
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-2.5 rounded-lg bg-blue-100">
                    <Plus className="h-5 w-5 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Create New Class</h2>
                </div>
              <form onSubmit={handleCreateClass} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Institution <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.institutionId}
                    onChange={(e) => setFormData({ ...formData, institutionId: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 shadow-sm"
                    required
                  >
                    <option value="">Select Institution</option>
                    {institutions.map((inst) => (
                      <option key={inst._id} value={inst._id}>
                        {inst.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Grade <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.grade}
                      onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                      className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 shadow-sm"
                      required
                    >
                      {grades.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Section <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.section}
                      onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                      className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 shadow-sm"
                      required
                    >
                      {sections.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Room Number
                    </label>
                    <input
                      type="text"
                      value={formData.roomNumber}
                      onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                      className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 shadow-sm"
                      placeholder="e.g., 101"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Capacity
                    </label>
                    <input
                      type="number"
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 40 })}
                      className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 shadow-sm"
                      min="1"
                      max="100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Academic Year
                  </label>
                  <input
                    type="text"
                    value={formData.academicYear}
                    onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 shadow-sm"
                    placeholder="e.g., 2025-2026"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assign Teacher (Optional)
                  </label>
                  <select
                    value={formData.teacherId || ''}
                    onChange={(e) => setFormData({ ...formData, teacherId: e.target.value || undefined })}
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 shadow-sm"
                  >
                    <option value="">No Teacher (Assign Later)</option>
                    {teachers.map((teacher) => (
                      <option key={teacher._id} value={teacher._id}>
                        {teacher.name} ({teacher.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t-2 border-gray-200">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowCreateForm(false)}
                      disabled={creatingClass}
                      className="border-2 border-gray-300 hover:border-gray-400"
                    >
                      Cancel
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button 
                      type="submit" 
                      className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md shadow-blue-500/30"
                      disabled={creatingClass}
                    >
                      {creatingClass ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Create Class
                        </>
                      )}
                    </Button>
                  </motion.div>
                </div>
              </form>
              </Card>
            </motion.div>
          )}

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <Card className="p-6 bg-gradient-to-br from-white to-gray-50/30 backdrop-blur-sm border-2 border-gray-200 shadow-lg hover:shadow-xl transition-all rounded-xl mb-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-indigo-100">
                    <Filter className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Filters</h3>
                    <p className="text-sm text-gray-500 mt-0.5">Filter classes by various criteria</p>
                  </div>
                </div>
                {activeFiltersCount > 0 && (
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      onClick={clearFilters}
                      variant="outline"
                      size="sm"
                      className="border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Clear Filters ({activeFiltersCount})
                    </Button>
                  </motion.div>
                )}
              </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Institution</label>
                <select
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={filters.institutionId}
                  onChange={(e) => setFilters({ ...filters, institutionId: e.target.value })}
                >
                  <option value="">All Institutions</option>
                  {institutions.map((inst) => (
                    <option key={inst._id} value={inst._id}>
                      {inst.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teacher</label>
                <select
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={filters.teacherId}
                  onChange={(e) => setFilters({ ...filters, teacherId: e.target.value })}
                >
                  <option value="">All Teachers</option>
                  <option value="unassigned">Unassigned</option>
                  {teachers.map((teacher) => (
                    <option key={teacher._id} value={teacher._id}>
                      {teacher.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
                <select
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={filters.grade}
                  onChange={(e) => setFilters({ ...filters, grade: e.target.value })}
                >
                  <option value="">All Grades</option>
                  {grades.map(grade => (
                    <option key={grade} value={grade}>Grade {grade}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.includeInactive}
                    onChange={(e) => setFilters({ ...filters, includeInactive: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Include Inactive</span>
                </label>
              </div>
            </div>
            </Card>
          </motion.div>

          {/* Content */}
          {classes.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="p-12 bg-gradient-to-br from-white to-blue-50/20 backdrop-blur-sm border-2 border-gray-200 shadow-xl rounded-xl">
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                    className="text-6xl mb-4"
                  >
                    📚
                  </motion.div>
                  <p className="text-gray-700 text-xl font-bold mb-2">No classes found</p>
                  <p className="text-gray-500 text-sm mt-2">
                    {activeFiltersCount > 0 
                      ? 'Try adjusting your filters or create a new class'
                      : 'Create your first class to get started'}
                  </p>
                  {activeFiltersCount === 0 && (
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="mt-6"
                    >
                      <Button
                        onClick={() => setShowCreateForm(true)}
                        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md shadow-blue-500/30"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Class
                      </Button>
                    </motion.div>
                  )}
                </div>
              </Card>
            </motion.div>
          ) : viewMode === 'cards' ? (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {classes.map((classItem, index) => {
                const institutionName = getInstitutionName(classItem.institutionId);
                const teacher = getTeacherName(classItem.teacherId);
                const isActive = classItem.isActive !== false;
                const currentTeacherId = getCurrentTeacherId(classItem);
                const isAssigning = assigningTeacher === classItem._id;
                const isDeleting = deletingClass === classItem._id;

                return (
                  <motion.div
                    key={classItem._id}
                    variants={cardVariants}
                    custom={index}
                    whileHover={{ y: -5 }}
                  >
                    <Card 
                      className={`p-6 bg-gradient-to-br from-white to-blue-50/20 backdrop-blur-sm border-2 hover:shadow-2xl transition-all duration-300 rounded-xl ${
                        !isActive 
                          ? 'opacity-60 border-gray-200' 
                          : 'border-gray-200 hover:border-blue-400'
                      }`}
                    >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center space-x-4">
                        <motion.div
                          className={`w-16 h-16 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg ${
                            isActive ? 'bg-gradient-to-br from-blue-500 to-blue-600' : 'bg-gray-400'
                          }`}
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          {classItem.grade}-{classItem.section}
                        </motion.div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900 mb-1">
                            Grade {classItem.grade} - Section {classItem.section}
                          </h3>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2.5 py-1 text-xs font-mono bg-blue-100 text-blue-700 rounded-md border border-blue-200 font-semibold">
                              {classItem.classCode}
                            </span>
                            {!isActive && (
                              <span className="px-2.5 py-1 text-xs font-semibold bg-red-100 text-red-700 rounded-md border border-red-200">
                                Inactive
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="space-y-3 mb-5">
                      <div className="flex justify-between items-center p-2.5 bg-gray-50 rounded-lg">
                        <span className="text-gray-600 flex items-center gap-2 text-sm font-medium">
                          <Building2 className="h-4 w-4 text-gray-400" />
                          Institution:
                        </span>
                        <span className="font-bold text-gray-900 text-sm">{institutionName}</span>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-center p-2.5 bg-gray-50 rounded-lg">
                          <span className="text-gray-600 flex items-center gap-2 text-sm font-medium">
                            <UserCheck className="h-4 w-4 text-gray-400" />
                            Teacher:
                          </span>
                          {teacher ? (
                            <span className="font-bold text-gray-900 text-sm">{teacher.name}</span>
                          ) : (
                            <span className="text-orange-600 font-semibold text-xs bg-orange-50 px-2 py-1 rounded-md border border-orange-200">
                              Unassigned
                            </span>
                          )}
                        </div>
                        
                        {/* Teacher Assignment Dropdown */}
                        <select
                          value={currentTeacherId || ''}
                          onChange={(e) => {
                            const selectedTeacherId = e.target.value.trim();
                            // Normalize for comparison: null/undefined becomes empty string
                            const normalizedCurrent = (currentTeacherId || '').trim();
                            if (selectedTeacherId !== normalizedCurrent) {
                              // Ensure we pass a valid ID or empty string
                              handleAssignTeacher(classItem._id, selectedTeacherId);
                            }
                          }}
                          disabled={isAssigning || teachers.length === 0}
                          className={`w-full text-sm border-2 rounded-lg px-3 py-2 font-medium ${
                            isAssigning || teachers.length === 0
                              ? 'opacity-50 cursor-not-allowed bg-gray-100 border-gray-300' 
                              : 'bg-white border-gray-300 hover:border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                          }`}
                        >
                          <option value="">{teachers.length === 0 ? 'Loading...' : (teacher ? 'Change Teacher' : 'Assign Teacher')}</option>
                          {teachers.map((t) => {
                            // Ensure teacher ID is valid before rendering
                            if (!t._id || !/^[0-9a-fA-F]{24}$/.test(t._id)) {
                              console.warn('Invalid teacher ID in dropdown:', t);
                              return null;
                            }
                            return (
                              <option key={t._id} value={t._id}>
                                {t.name} ({t.email})
                              </option>
                            );
                          })}
                        </select>
                        
                        {isAssigning && (
                          <div className="text-xs text-blue-600 flex items-center gap-2 bg-blue-50 p-2 rounded-lg border border-blue-200">
                            <RefreshCw className="h-3 w-3 animate-spin" />
                            Assigning...
                          </div>
                        )}
                      </div>

                      <div className="flex justify-between items-center p-2.5 bg-gray-50 rounded-lg">
                        <span className="text-gray-600 flex items-center gap-2 text-sm font-medium">
                          <Users className="h-4 w-4 text-gray-400" />
                          Students:
                        </span>
                        <span className="font-bold text-gray-900 text-sm">
                          {classItem.studentIds?.length || 0} / {classItem.capacity || 'N/A'}
                        </span>
                      </div>
                      
                      {classItem.roomNumber && (
                        <div className="flex justify-between items-center p-2.5 bg-gray-50 rounded-lg">
                          <span className="text-gray-600 flex items-center gap-2 text-sm font-medium">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            Room:
                          </span>
                          <span className="font-bold text-gray-900 text-sm">{classItem.roomNumber}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="pt-4 border-t-2 border-gray-200">
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button
                          onClick={() => handleDeleteClass(classItem._id)}
                          variant="outline"
                          size="sm"
                          className="w-full text-red-600 hover:text-red-800 hover:bg-red-50 border-2 border-red-200 hover:border-red-300"
                          disabled={isDeleting}
                        >
                          {isDeleting ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Deleting...
                            </>
                          ) : (
                            <>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Class
                            </>
                          )}
                        </Button>
                      </motion.div>
                    </div>
                  </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <Card className="p-6 shadow-md overflow-x-auto">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Class
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Institution
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Teacher
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Students
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Class Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {classes.map((classItem) => {
                      const institutionName = getInstitutionName(classItem.institutionId);
                      const teacher = getTeacherName(classItem.teacherId);
                      const isActive = classItem.isActive !== false;
                      const currentTeacherId = getCurrentTeacherId(classItem);
                      const isAssigning = assigningTeacher === classItem._id;
                      const isDeleting = deletingClass === classItem._id;

                      return (
                        <tr key={classItem._id} className={!isActive ? 'opacity-60' : ''}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              Grade {classItem.grade} - Section {classItem.section}
                            </div>
                            {classItem.roomNumber && (
                              <div className="text-sm text-gray-500">Room: {classItem.roomNumber}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {institutionName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="space-y-1">
                              {teacher ? (
                                <div className="text-sm font-medium text-gray-900">
                                  {teacher.name}
                                  <span className="text-xs text-gray-500 ml-1">({teacher.email})</span>
                                </div>
                              ) : (
                                <div className="text-sm text-orange-600 font-medium">⚠️ No Teacher Assigned</div>
                              )}
                              
                              <select
                                value={currentTeacherId || ''}
                                onChange={(e) => {
                                  const selectedTeacherId = e.target.value.trim();
                                  // Normalize for comparison: null/undefined becomes empty string
                                  const normalizedCurrent = (currentTeacherId || '').trim();
                                  if (selectedTeacherId !== normalizedCurrent) {
                                    // Ensure we pass a valid ID or empty string
                                    handleAssignTeacher(classItem._id, selectedTeacherId);
                                  }
                                }}
                                disabled={isAssigning || teachers.length === 0}
                                className={`text-xs border border-gray-300 rounded px-2 py-1 min-w-[180px] ${
                                  isAssigning || teachers.length === 0
                                    ? 'opacity-50 cursor-not-allowed bg-gray-100' 
                                    : 'bg-white hover:border-blue-400 focus:ring-2 focus:ring-blue-500'
                                }`}
                              >
                                <option value="">{teachers.length === 0 ? 'Loading...' : (teacher ? 'Change Teacher' : 'Assign Teacher')}</option>
                                {teachers.map((t) => {
                                  // Ensure teacher ID is valid before rendering
                                  if (!t._id || !/^[0-9a-fA-F]{24}$/.test(t._id)) {
                                    console.warn('Invalid teacher ID in dropdown:', t);
                                    return null;
                                  }
                                  return (
                                    <option key={t._id} value={t._id}>
                                      {t.name} ({t.email})
                                    </option>
                                  );
                                })}
                              </select>
                              
                              {isAssigning && (
                                <div className="text-xs text-blue-600 flex items-center gap-1">
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                                  Assigning...
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {classItem.studentIds?.length || 0} / {classItem.capacity || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs font-mono bg-blue-50 text-blue-700 rounded border border-blue-200">
                              {classItem.classCode}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {isActive ? (
                              <span className="px-2 py-1 text-xs font-semibold bg-green-50 text-green-700 rounded border border-green-200">
                                Active
                              </span>
                            ) : (
                              <span className="px-2 py-1 text-xs font-semibold bg-red-50 text-red-700 rounded border border-red-200">
                                Inactive
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <Button
                              onClick={() => handleDeleteClass(classItem._id)}
                              variant="outline"
                              size="sm"
                              className="text-xs text-red-600 hover:text-red-800 hover:bg-red-50 border-red-200"
                              disabled={isDeleting}
                            >
                              {isDeleting ? 'Deleting...' : 'Delete'}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}

export default function ClassesPage() {
  return (
    <AdminRoute>
      <ClassesPageContent />
    </AdminRoute>
  );
}
