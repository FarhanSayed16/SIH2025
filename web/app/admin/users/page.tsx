/**
 * Admin User Management Page - Comprehensive Overhaul
 * Supports: Teacher Approval, Institution Assignment, Class Management
 * Smart India Hackathon - SafeSchool Disaster Management System
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';
import { usersApi, User, UserFilters } from '@/lib/api/users';
import { schoolsApi, School } from '@/lib/api/schools';
import { classesApi, Class, CreateClassRequest } from '@/lib/api/classes';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { AdminRoute } from '@/components/auth/AdminRoute';
import { apiClient } from '@/lib/api/client';
import { getInstitutionId } from '@/lib/utils/institution';
import { AnimatedCounter } from '@/components/dashboard/AnimatedCounter';
import { motion } from 'framer-motion';
import {
  Users,
  UserCheck,
  School as SchoolIcon,
  BookOpen,
  Shield,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  PlusCircle,
  RefreshCw,
  AlertCircle,
  Filter,
  Search,
  Calendar,
  Clock,
  Mail,
  MapPin,
  UserPlus,
  GraduationCap,
  Building
} from 'lucide-react';

type TabType = 'teachers' | 'pending-teachers' | 'classes' | 'all-users';

interface TeacherWithDetails extends User {
  assignedClasses?: Class[];
  institutionName?: string;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const { user, isAuthenticated, accessToken, isAdmin, isLoading: authLoading } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('pending-teachers');
  const [teachers, setTeachers] = useState<TeacherWithDetails[]>([]);
  const [pendingTeachers, setPendingTeachers] = useState<User[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals
  const [showInstitutionModal, setShowInstitutionModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<User | null>(null);
  const [showClassModal, setShowClassModal] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [showAssignClassModal, setShowAssignClassModal] = useState(false);
  const [teacherForClassAssignment, setTeacherForClassAssignment] = useState<TeacherWithDetails | null>(null);
  
  // Class form
  const [classFormData, setClassFormData] = useState<CreateClassRequest>({
    institutionId: '',
    grade: '1',
    section: 'A',
    teacherId: '',
    roomNumber: '',
    capacity: 40
  });

  useEffect(() => {
    // Wait for auth to be ready
    if (authLoading) {
      return;
    }

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (!isAdmin()) {
      router.push('/dashboard');
      return;
    }

    // Ensure we have user and token before proceeding
    if (!user || !accessToken) {
      // Try to get token from localStorage as fallback
      const storedToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      if (storedToken) {
        apiClient.setToken(storedToken);
        // Wait a bit for state to sync
        setTimeout(() => {
          const state = useAuthStore.getState();
          if (!state.isAuthenticated || !state.user) {
            router.push('/login');
          }
        }, 100);
      } else {
        router.push('/login');
      }
      return;
    }

    // Set token before making any API calls - ensure it's set synchronously
    apiClient.setToken(accessToken);

    loadData();
  }, [isAuthenticated, user, router, accessToken, activeTab, authLoading, isAdmin]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadPendingTeachers(),
        loadTeachers(),
        loadClasses(),
        loadSchools()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

const loadPendingTeachers = async () => {
    try {
      // Ensure token is set
      const token = accessToken || (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null);
      if (token) {
        apiClient.setToken(token);
      }
      
      const response = await usersApi.list({ 
        role: 'teacher', 
        approvalStatus: 'registered'
      });
      if (response.success && response.data) {
        setPendingTeachers(response.data.users || []);
      } else {
        console.error('Failed to load pending teachers:', response.message);
      }
    } catch (error) {
      console.error('Error loading pending teachers:', error);
    }
  };

  const loadTeachers = async () => {
    try {
      // Ensure token is set
      const token = accessToken || (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null);
      if (token) {
        apiClient.setToken(token);
      }
      
      // Fetch all teachers across multiple pages
      let allTeachers: User[] = [];
      let page = 1;
      const limit = 500;
      let hasMore = true;
      let maxPages = 10;
      
      while (hasMore && page <= maxPages) {
        const response = await usersApi.list({ 
          role: 'teacher', 
          page,
          limit
        });
        
        if (response.success && response.data) {
          let teachersList: User[] = [];
          const data = response.data as any;
          
          if (Array.isArray(data)) {
            teachersList = data;
          } else if (data.users && Array.isArray(data.users)) {
            teachersList = data.users;
          } else if (data.data && Array.isArray(data.data)) {
            teachersList = data.data;
          }
          
          allTeachers = [...allTeachers, ...teachersList];
          
          // Check if there are more pages
          const total = data.total || response.data.total || 0;
          const totalPages = data.totalPages || Math.ceil(total / limit);
          hasMore = teachersList.length === limit && page < totalPages;
          page++;
          
          if (teachersList.length < limit) {
            hasMore = false;
          }
        } else {
          hasMore = false;
        }
      }
      
      // Enrich with class and institution info
      const enrichedTeachers = allTeachers.map((teacher) => {
        const teacherId = (teacher as any).id || teacher._id;
        const teacherClasses = classes.filter(c => {
          const classTeacherId = typeof c.teacherId === 'string' 
            ? c.teacherId 
            : (c.teacherId as any)?._id || (c.teacherId as any)?.id;
          return classTeacherId === teacherId || classTeacherId === teacher._id;
        });
        
        // Get institution name
        let institutionName = 'Not Assigned';
        if (teacher.institutionId) {
          if (typeof teacher.institutionId === 'object' && teacher.institutionId !== null) {
            institutionName = (teacher.institutionId as any).name || 'Unknown Institution';
          } else {
            const teacherInstId = getInstitutionId(teacher.institutionId);
            const institution = schools.find(s => s._id === teacherInstId);
            institutionName = institution?.name || 'Unknown Institution';
          }
        }
        
        return {
          ...teacher,
          assignedClasses: teacherClasses,
          institutionName
        };
      });
      
      setTeachers(enrichedTeachers);
    } catch (error: any) {
      console.error('Error loading teachers:', error);
      setTeachers([]);
    }
  };

  const loadClasses = async () => {
    try {
      // Ensure token is set
      const token = accessToken || (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null);
      if (token) {
        apiClient.setToken(token);
      }
      
      const response = await classesApi.list({
        limit: 1000
      });
      
      if (response.success && response.data) {
        const classesList = response.data.classes || [];
        setClasses(classesList);
        
        if (teachers.length > 0) {
          loadTeachers();
        }
      } else {
        console.error('Failed to load classes:', response.message || response.error);
        setClasses([]);
      }
    } catch (error) {
      console.error('Error loading classes:', error);
      setClasses([]);
    }
  };

  const loadSchools = async () => {
    try {
      // Ensure token is set
      const token = accessToken || (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null);
      if (token) {
        apiClient.setToken(token);
      }
      
      const response = await schoolsApi.list();
      if (response.success && response.data) {
        if (Array.isArray(response.data)) {
          setSchools(response.data);
        } else if (response.data && typeof response.data === 'object' && 'schools' in response.data && Array.isArray((response.data as any).schools)) {
          setSchools((response.data as any).schools);
        } else {
          setSchools([]);
        }
      } else {
        console.error('Failed to load schools:', response.message);
        setSchools([]);
      }
    } catch (error) {
      console.error('Error loading schools:', error);
      setSchools([]);
    }
  };

  const handleApproveTeacher = async (teacherId: string) => {
    if (!confirm('Approve this teacher? They will be able to access the system once they have an institution and class assigned.')) {
      return;
    }

    try {
      const token = accessToken || (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null);
      if (token) {
        apiClient.setToken(token);
      }

      const response = await usersApi.approveUser(teacherId);
      
      if (response.success) {
        alert('✅ Teacher approved successfully!\n\nNext steps:\n1. Assign an institution (if not already assigned)\n2. Assign a class\n\nTeacher will have full access after all steps are complete.');
        await Promise.all([
          loadPendingTeachers(),
          loadTeachers(),
          loadClasses()
        ]);
      } else {
        alert('Failed to approve teacher: ' + (response.message || 'Unknown error'));
      }
    } catch (error: any) {
      console.error('Approve teacher error:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Unknown error';
      alert('Error: ' + errorMsg);
    }
  };

  const handleAssignInstitution = async (teacherId: string, institutionId: string) => {
    const token = accessToken || (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null);
    if (token) {
      apiClient.setToken(token);
    } else {
      alert('Authentication required. Please log in again.');
      router.push('/login');
      return;
    }

    try {
      const response = await usersApi.assignInstitution(teacherId, institutionId);
      
      if (response.success) {
        alert('✅ Institution assigned successfully!\n\nNext step: Assign a class to this teacher.');
        setShowInstitutionModal(false);
        setSelectedTeacher(null);
        await Promise.all([
          loadTeachers(),
          loadPendingTeachers(),
          loadClasses()
        ]);
        setTimeout(() => {
          loadTeachers();
        }, 500);
      } else {
        alert('Failed to assign institution: ' + (response.message || response.error || 'Unknown error'));
      }
    } catch (error: any) {
      console.error('Assign institution error:', error);
      const errorMsg = error.message || error.response?.data?.message || 'Unknown error';
      alert('Error: ' + errorMsg);
    }
  };

  const handleRejectTeacher = async (teacherId: string) => {
    const reason = prompt('Enter rejection reason (optional):');
    if (reason === null) return;

    try {
      const token = accessToken || (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null);
      if (token) {
        apiClient.setToken(token);
      }

      const response = await usersApi.rejectUser(teacherId, reason || undefined);
      
      if (response.success) {
        alert('✅ Teacher rejected successfully.');
        await Promise.all([
          loadPendingTeachers(),
          loadTeachers(),
          loadClasses()
        ]);
      } else {
        alert('Failed to reject teacher: ' + (response.message || 'Unknown error'));
      }
    } catch (error: any) {
      console.error('Reject teacher error:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Unknown error';
      alert('Error: ' + errorMsg);
    }
  };

  const handleDeleteTeacher = async (teacherId: string, teacherName: string) => {
    if (!confirm(`⚠ WARNING: Delete teacher "${teacherName}"?\n\nThis action cannot be undone. The teacher will be permanently removed from the system.\n\nMake sure they are not assigned to any classes first.`)) {
      return;
    }

    try {
      const token = accessToken || (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null);
      if (token) {
        apiClient.setToken(token);
      }

      const response = await usersApi.deleteUser(teacherId);
      
      if (response.success) {
        alert('✅ Teacher deleted successfully.');
        await Promise.all([
          loadPendingTeachers(),
          loadTeachers(),
          loadClasses()
        ]);
      } else {
        alert('Failed to delete teacher: ' + (response.message || 'Unknown error'));
      }
    } catch (error: any) {
      console.error('Delete teacher error:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Unknown error';
      alert('Error: ' + errorMsg);
    }
  };

  const handleAssignClassToTeacher = async (classId: string) => {
    if (!teacherForClassAssignment) {
      console.error('No teacher selected for class assignment');
      return;
    }

    const teacherId = (teacherForClassAssignment as any).id || teacherForClassAssignment._id;
    
    if (!teacherId) {
      alert('Error: Teacher ID is missing');
      return;
    }

    if (!classId) {
      alert('Error: Class ID is missing');
      return;
    }

    try {
      const token = accessToken || (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null);
      if (token) {
        apiClient.setToken(token);
      } else {
        alert('Authentication required. Please log in again.');
        router.push('/login');
        return;
      }

      const response = await classesApi.assignTeacher(classId, teacherId);
      
      if (response.success) {
        alert(`✅ Class assigned successfully!\n\n${teacherForClassAssignment.name} can now access this class and manage students.`);
        setShowAssignClassModal(false);
        setTeacherForClassAssignment(null);
        await Promise.all([
          loadClasses(),
          loadTeachers(),
          loadPendingTeachers()
        ]);
        setTimeout(() => {
          loadClasses();
          loadTeachers();
        }, 500);
      } else {
        const errorMsg = response.message || response.error || 'Unknown error';
        alert(`Failed to assign class: ${errorMsg}`);
      }
    } catch (error: any) {
      console.error('Assign class to teacher error:', error);
      const errorMsg = error.response?.data?.message || 
                      error.response?.data?.error || 
                      error.message || 
                      'Unknown error';
      alert(`Error assigning class: ${errorMsg}`);
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!classFormData.institutionId) {
      alert('Please select an institution');
      return;
    }

    const token = accessToken || (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null);
    if (token) {
      apiClient.setToken(token);
    } else {
      alert('Authentication required. Please log in again.');
      router.push('/login');
      return;
    }

    try {
      const payload: CreateClassRequest = {
        institutionId: classFormData.institutionId,
        grade: classFormData.grade,
        section: classFormData.section,
        roomNumber: classFormData.roomNumber || undefined,
        capacity: classFormData.capacity || undefined
      };
      
      if (classFormData.teacherId && classFormData.teacherId.trim()) {
        payload.teacherId = classFormData.teacherId;
      }

      const response = await classesApi.create(payload);
      
      if (response.success && response.data) {
        const classData = response.data.class || response.data;
        
        if (!classData || !classData.classCode) {
          alert(`❌ Error: Class creation failed. No class data returned.\n\nPlease try again or contact support.`);
          return;
        }
        
        const classCode = classData.classCode;
        const message = response.message || 'Class created successfully!';
        
        if (message.includes('already exists') || message.includes('already existed') || message.includes('Returning existing')) {
          alert(`✅ ${message}\n\nClass Code: ${classCode}\n\nThe existing class is now shown in the list below. You can assign a teacher to it.`);
        } else {
          alert(`✅ ${message}\n\nClass Code: ${classCode}`);
        }
        
        setShowClassModal(false);
        setClassFormData({
          institutionId: '',
          grade: '1',
          section: 'A',
          teacherId: '',
          roomNumber: '',
          capacity: 40
        });
        
        await Promise.all([
          loadClasses(),
          loadTeachers()
        ]);
        
        setTimeout(() => {
          loadClasses();
        }, 500);
      } else {
        const errorMsg = response.message || response.error || 'Unknown error';
        alert(`Failed to create class: ${errorMsg}`);
        
        if (errorMsg.includes('already exists')) {
          console.log('[Admin Users] Class already exists - reloading list to show it');
          await loadClasses();
        }
      }
    } catch (error: any) {
      console.error('Class creation error:', error);
      const errorMsg = error.message || error.response?.data?.message || 'Unknown error';
      alert(`Error creating class: ${errorMsg}`);
    }
  };

  const handleAssignTeacherToClass = async (classId: string, teacherId: string) => {
    const token = accessToken || (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null);
    if (token) {
      apiClient.setToken(token);
    } else {
      alert('Authentication required. Please log in again.');
      router.push('/login');
      return;
    }

    try {
      const response = await classesApi.assignTeacher(classId, teacherId || '');
      if (response.success) {
        const action = teacherId ? 'assigned' : 'removed';
        alert(`✅ Teacher ${action} successfully!\n\nThe teacher can now access this class and manage students.`);
        await Promise.all([
          loadClasses(),
          loadTeachers(),
          loadPendingTeachers()
        ]);
      } else {
        alert('Failed to assign teacher: ' + (response.message || response.error || 'Unknown error'));
      }
    } catch (error: any) {
      console.error('Assign teacher to class error:', error);
      const errorMsg = error.response?.data?.message || 
                      error.response?.data?.error || 
                      error.message || 
                      'Unknown error';
      alert('Error: ' + errorMsg);
    }
  };

  const grades = ['KG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
  const sections = ['A', 'B', 'C', 'D', 'E'];

  // Filter teachers based on search term
  const filteredTeachers = teachers.filter(teacher =>
    teacher.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.institutionName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter classes based on search term
  const filteredClasses = classes.filter(classItem =>
    classItem.classCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${classItem.grade}-${classItem.section}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter pending teachers based on search term
  const filteredPendingTeachers = pendingTeachers.filter(teacher =>
    teacher.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, duration: 0.5 }
    })
  };

  // Show loading spinner while auth is loading
  if (authLoading || !isAuthenticated || !user || !accessToken) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 p-6 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading admin panel...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!isAdmin()) {
    router.push('/dashboard');
    return null;
  }

  return (
    <AdminRoute>
      <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Header */}
              <motion.div 
                className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <motion.div 
                      className="p-3 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/20"
                      whileHover={{ scale: 1.05, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <Shield className="h-6 w-6" />
                    </motion.div>
                    <div>
                      <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                        Admin <span className="text-blue-600">Management</span>
                      </h1>
                      <p className="text-gray-600 mt-1 text-base">
                        Manage teachers, institutions, and classes for SafeSchool
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search teachers or classes..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 backdrop-blur-sm text-gray-900 shadow-sm hover:shadow-md transition-all"
                    />
                  </div>
                  <Button
                    onClick={loadData}
                    variant="outline"
                    className="border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm hover:shadow-md transition-all"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </motion.div>

              {/* Stats Overview */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <motion.div variants={cardVariants} custom={0}>
                  <Card className="p-6 bg-gradient-to-br from-white to-blue-50/30 border border-blue-200 hover:border-blue-400 hover:shadow-lg transition-all duration-300 backdrop-blur-sm">
                    <div className="flex items-center">
                      <motion.div 
                        className="p-3 rounded-xl bg-blue-100 mr-4"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                      >
                        <Users className="h-6 w-6 text-blue-600" />
                      </motion.div>
                      <div>
                        <div className="text-sm text-gray-500 font-medium mb-1">Total Teachers</div>
                        <div className="text-3xl font-bold text-gray-900">
                          <AnimatedCounter value={teachers.length} />
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 text-xs text-gray-500 font-medium">
                      <AnimatedCounter value={teachers.filter(t => t.approvalStatus === 'registered').length} /> registered
                    </div>
                  </Card>
                </motion.div>

                <motion.div variants={cardVariants} custom={1}>
                  <Card className="p-6 bg-gradient-to-br from-white to-amber-50/30 border border-amber-200 hover:border-amber-400 hover:shadow-lg transition-all duration-300 backdrop-blur-sm">
                    <div className="flex items-center">
                      <motion.div 
                        className="p-3 rounded-xl bg-amber-100 mr-4"
                        whileHover={{ scale: 1.1, rotate: -5 }}
                      >
                        <UserCheck className="h-6 w-6 text-amber-600" />
                      </motion.div>
                      <div>
                        <div className="text-sm text-gray-500 font-medium mb-1">Pending Approval</div>
                        <div className="text-3xl font-bold text-gray-900">
                          <AnimatedCounter value={pendingTeachers.length} />
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 text-xs text-gray-500 font-medium">
                      Awaiting admin review
                    </div>
                  </Card>
                </motion.div>

                <motion.div variants={cardVariants} custom={2}>
                  <Card className="p-6 bg-gradient-to-br from-white to-emerald-50/30 border border-emerald-200 hover:border-emerald-400 hover:shadow-lg transition-all duration-300 backdrop-blur-sm">
                    <div className="flex items-center">
                      <motion.div 
                        className="p-3 rounded-xl bg-emerald-100 mr-4"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                      >
                        <SchoolIcon className="h-6 w-6 text-emerald-600" />
                      </motion.div>
                      <div>
                        <div className="text-sm text-gray-500 font-medium mb-1">Active Schools</div>
                        <div className="text-3xl font-bold text-gray-900">
                          <AnimatedCounter value={schools.length} />
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 text-xs text-gray-500 font-medium">
                      Registered institutions
                    </div>
                  </Card>
                </motion.div>

                <motion.div variants={cardVariants} custom={3}>
                  <Card className="p-6 bg-gradient-to-br from-white to-purple-50/30 border border-purple-200 hover:border-purple-400 hover:shadow-lg transition-all duration-300 backdrop-blur-sm">
                    <div className="flex items-center">
                      <motion.div 
                        className="p-3 rounded-xl bg-purple-100 mr-4"
                        whileHover={{ scale: 1.1, rotate: -5 }}
                      >
                        <BookOpen className="h-6 w-6 text-purple-600" />
                      </motion.div>
                      <div>
                        <div className="text-sm text-gray-500 font-medium mb-1">Total Classes</div>
                        <div className="text-3xl font-bold text-gray-900">
                          <AnimatedCounter value={classes.length} />
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 text-xs text-gray-500 font-medium">
                      Learning classrooms
                    </div>
                  </Card>
                </motion.div>
              </div>

              {/* Tabs Navigation */}
              <motion.div 
                className="bg-white/80 backdrop-blur-sm p-3 rounded-xl border border-gray-200 shadow-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => setActiveTab('pending-teachers')}
                    className={`px-5 py-3 rounded-lg transition-all duration-200 flex items-center gap-3 ${
                      activeTab === 'pending-teachers'
                        ? 'bg-amber-50 border-2 border-amber-200 shadow-sm'
                        : 'hover:bg-gray-50 border-2 border-transparent'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${
                      activeTab === 'pending-teachers' ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-400'
                    }`}>
                      <UserCheck className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <div className={`font-semibold text-sm ${
                        activeTab === 'pending-teachers' ? 'text-gray-900' : 'text-gray-700'
                      }`}>
                        Pending Teachers
                      </div>
                      <div className="text-xs text-gray-500">
                        {pendingTeachers.length} waiting
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveTab('teachers')}
                    className={`px-5 py-3 rounded-lg transition-all duration-200 flex items-center gap-3 ${
                      activeTab === 'teachers'
                        ? 'bg-blue-50 border-2 border-blue-200 shadow-sm'
                        : 'hover:bg-gray-50 border-2 border-transparent'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${
                      activeTab === 'teachers' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
                    }`}>
                      <Users className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <div className={`font-semibold text-sm ${
                        activeTab === 'teachers' ? 'text-gray-900' : 'text-gray-700'
                      }`}>
                        All Teachers
                      </div>
                      <div className="text-xs text-gray-500">
                        {teachers.length} total
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveTab('classes')}
                    className={`px-5 py-3 rounded-lg transition-all duration-200 flex items-center gap-3 ${
                      activeTab === 'classes'
                        ? 'bg-indigo-50 border-2 border-indigo-200 shadow-sm'
                        : 'hover:bg-gray-50 border-2 border-transparent'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${
                      activeTab === 'classes' ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-400'
                    }`}>
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <div className={`font-semibold text-sm ${
                        activeTab === 'classes' ? 'text-gray-900' : 'text-gray-700'
                      }`}>
                        Classes
                      </div>
                      <div className="text-xs text-gray-500">
                        {classes.length} active
                      </div>
                    </div>
                  </button>
                </div>
              </motion.div>
              {/* Pending Teachers Tab */}
              {activeTab === 'pending-teachers' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <Card className="p-6 bg-white/80 backdrop-blur-sm border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg bg-amber-50">
                        <UserCheck className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">Teacher Approval Queue</h3>
                        <p className="text-sm text-gray-500 mt-1">Review and approve new teacher registrations</p>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg font-medium">
                      {filteredPendingTeachers.length} teachers waiting
                    </div>
                  </div>

                  {isLoading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-gray-500 mt-4">Loading pending teachers...</p>
                    </div>
                  ) : filteredPendingTeachers.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100">
                        <CheckCircle className="h-8 w-8 text-emerald-600" />
                      </div>
                      <p className="text-lg font-medium text-gray-700 mb-2">No pending approvals</p>
                      <p className="text-sm">All teacher registrations have been reviewed.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {filteredPendingTeachers.map((teacher, index) => {
                        const teacherId = (teacher as any).id || teacher._id;
                        return (
                          <motion.div
                            key={teacherId}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                          >
                            <Card className="p-5 bg-white/90 backdrop-blur-sm border border-amber-200 hover:shadow-lg hover:border-amber-400 transition-all duration-300">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center">
                                  <span className="font-semibold text-amber-700 text-lg">
                                    {teacher.name?.charAt(0).toUpperCase() || 'T'}
                                  </span>
                                </div>
                                <div>
                                  <div className="font-semibold text-gray-900">{teacher.name}</div>
                                  <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                    <Mail className="h-3 w-3" />
                                    {teacher.email}
                                  </div>
                                </div>
                              </div>
                              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                                Pending
                              </span>
                            </div>

                            <div className="mb-4 space-y-2">
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <SchoolIcon className="h-4 w-4" />
                                <span className="truncate">
                                  {teacher.institutionId ? (
                                    typeof teacher.institutionId === 'object' ? teacher.institutionId.name : 'Assigned'
                                  ) : (
                                    <span className="text-red-600">Not Assigned</span>
                                  )}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Calendar className="h-4 w-4" />
                                <span>
                                  Registered: {teacher.createdAt ? new Date(teacher.createdAt).toLocaleDateString() : 'N/A'}
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1 min-w-[100px] shadow-sm"
                                onClick={() => handleApproveTeacher(teacherId)}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-blue-200 text-blue-700 hover:bg-blue-50 flex-1 min-w-[100px]"
                                onClick={() => {
                                  setSelectedTeacher(teacher);
                                  setShowInstitutionModal(true);
                                }}
                              >
                                <SchoolIcon className="h-4 w-4 mr-2" />
                                Assign School
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-red-200 text-red-700 hover:bg-red-50"
                                onClick={() => handleRejectTeacher(teacherId)}
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Reject
                              </Button>
                            </div>
                          </Card>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </Card>
                </motion.div>
              )}

              {/* All Teachers Tab */}
              {activeTab === 'teachers' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <Card className="p-6 bg-white/80 backdrop-blur-sm border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg bg-blue-50">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">All Teachers</h3>
                        <p className="text-sm text-gray-500 mt-1">Manage teacher accounts and assignments</p>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg font-medium">
                      Showing {filteredTeachers.length} of {teachers.length} teachers
                    </div>
                  </div>

                  {isLoading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-gray-500 mt-4">Loading teachers...</p>
                    </div>
                  ) : filteredTeachers.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100">
                        <Users className="h-8 w-8 text-blue-600" />
                      </div>
                      <p className="text-lg font-medium text-gray-700 mb-2">No teachers found</p>
                      <p className="text-sm">Teachers will appear here once they register.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {filteredTeachers.map((teacher) => {
                        const teacherId = (teacher as any).id || teacher._id;
                        const assignedClassesCount = (teacher as TeacherWithDetails).assignedClasses?.length || 0;
                        const isFullySetup = teacher.approvalStatus === 'registered' && 
                                            teacher.institutionName && 
                                            assignedClassesCount > 0;

                        return (
                          <motion.div
                            key={teacherId}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3 }}
                          >
                            <Card className="p-5 bg-white/90 backdrop-blur-sm border border-gray-200 hover:shadow-lg hover:border-blue-300 transition-all duration-300">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center border ${
                                  isFullySetup ? 'bg-emerald-50 border-emerald-200' : 
                                  teacher.approvalStatus === 'registered' ? 'bg-blue-50 border-blue-200' : 
                                  teacher.approvalStatus === 'pending' ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'
                                }`}>
                                  <span className={`font-semibold text-lg ${
                                    isFullySetup ? 'text-emerald-700' : 
                                    teacher.approvalStatus === 'registered' ? 'text-blue-700' : 
                                    teacher.approvalStatus === 'pending' ? 'text-amber-700' : 'text-red-700'
                                  }`}>
                                    {teacher.name?.charAt(0).toUpperCase() || 'T'}
                                  </span>
                                </div>
                                <div>
                                  <div className="font-semibold text-gray-900">{teacher.name}</div>
                                  <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                    <Mail className="h-3 w-3" />
                                    {teacher.email}
                                  </div>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                                  teacher.approvalStatus === 'registered' 
                                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                                    : teacher.approvalStatus === 'pending'
                                    ? 'bg-amber-100 text-amber-800 border-amber-200'
                                    : 'bg-red-100 text-red-800 border-red-200'
                                }`}>
                                  {teacher.approvalStatus?.toUpperCase()}
                                </span>
                                {isFullySetup && (
                                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                    ✅ Ready
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="mb-4 space-y-2">
                              <div className="flex items-center gap-2 text-sm">
                                <SchoolIcon className="h-4 w-4 text-gray-400" />
                                <span className="text-gray-600 truncate">
                                  {teacher.institutionName || 'No school assigned'}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <BookOpen className="h-4 w-4 text-gray-400" />
                                <span className="text-gray-600">
                                  {assignedClassesCount} class(es)
                                  {assignedClassesCount > 0 && (
                                    <span className="text-xs text-gray-400 ml-2">
                                      {(teacher as TeacherWithDetails).assignedClasses?.map(c => `${c.grade}-${c.section}`).join(', ')}
                                    </span>
                                  )}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <Clock className="h-4 w-4 text-gray-400" />
                                <span className="text-gray-600">
                                  Last login: {teacher.lastLogin ? new Date(teacher.lastLogin).toLocaleDateString() : 'Never'}
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                className={`flex-1 min-w-[120px] shadow-sm ${
                                  teacher.approvalStatus === 'registered'
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                }`}
                                onClick={() => handleApproveTeacher(teacherId)}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                {teacher.approvalStatus === 'registered' ? 'Re-register' : 'Approve'}
                              </Button>

                              {teacher.approvalStatus === 'registered' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 flex-1 min-w-[120px]"
                                  onClick={() => {
                                    setTeacherForClassAssignment(teacher as TeacherWithDetails);
                                    setShowAssignClassModal(true);
                                  }}
                                >
                                  <BookOpen className="h-4 w-4 mr-2" />
                                  Assign Class
                                </Button>
                              )}

                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-amber-200 text-amber-700 hover:bg-amber-50"
                                  onClick={() => {
                                    setSelectedTeacher(teacher);
                                    setShowInstitutionModal(true);
                                  }}
                                  title="Assign School"
                                >
                                  <SchoolIcon className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-red-200 text-red-700 hover:bg-red-50"
                                  onClick={() => handleDeleteTeacher(teacherId, teacher.name || 'Teacher')}
                                  title="Delete Teacher"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </Card>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </Card>
                </motion.div>
              )}

              {/* Classes Tab */}
              {activeTab === 'classes' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <Card className="p-6 bg-white/80 backdrop-blur-sm border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg bg-indigo-50">
                        <BookOpen className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">Class Management</h3>
                        <p className="text-sm text-gray-500 mt-1">Create and manage classrooms for safety education</p>
                      </div>
                    </div>
                    <Button
                      onClick={() => {
                        setEditingClass(null);
                        setClassFormData({
                          institutionId: '',
                          grade: '1',
                          section: 'A',
                          teacherId: '',
                          roomNumber: '',
                          capacity: 40
                        });
                        setShowClassModal(true);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                    >
                      <PlusCircle className="h-5 w-5 mr-2" />
                      Create New Class
                    </Button>
                  </div>

                  {isLoading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-gray-500 mt-4">Loading classes...</p>
                    </div>
                  ) : filteredClasses.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-indigo-50 flex items-center justify-center border border-indigo-100">
                        <BookOpen className="h-8 w-8 text-indigo-600" />
                      </div>
                      <p className="text-lg font-medium text-gray-700 mb-2">No classes found</p>
                      <p className="text-sm mb-4">Create your first class to get started with safety education.</p>
                      <Button
                        onClick={() => {
                          setShowClassModal(true);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                      >
                        <PlusCircle className="h-5 w-5 mr-2" />
                        Create First Class
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {filteredClasses.map((classItem, index) => {
                        const classId = (classItem as any).id || classItem._id;
                        const teacher = typeof classItem.teacherId === 'object' ? classItem.teacherId : null;
                        const approvedTeachers = teachers.filter(t => t.approvalStatus === 'registered');
                        
                        return (
                          <motion.div
                            key={classId}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3 }}
                          >
                            <Card className="p-5 bg-white/90 backdrop-blur-sm border border-gray-200 hover:shadow-lg hover:border-indigo-300 transition-all duration-300">
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <div className="font-bold text-lg text-gray-900">
                                  Grade {classItem.grade} - Section {classItem.section}
                                </div>
                                <div className="text-sm text-gray-500 font-mono mt-1">
                                  Code: {classItem.classCode}
                                </div>
                              </div>
                              {teacher ? (
                                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  ✅ Assigned
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                                  ⚠ No Teacher
                                </span>
                              )}
                            </div>

                            <div className="mb-4 space-y-2">
                              <div className="flex items-center gap-2 text-sm">
                                <SchoolIcon className="h-4 w-4 text-gray-400" />
                                <span className="text-gray-600 truncate">
                                  {typeof classItem.institutionId === 'object' 
                                    ? classItem.institutionId.name 
                                    : 'N/A'}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <GraduationCap className="h-4 w-4 text-gray-400" />
                                <span className="text-gray-600">
                                  Teacher: {teacher ? teacher.name : 'Not Assigned'}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <Users className="h-4 w-4 text-gray-400" />
                                <span className="text-gray-600">
                                  Students: {classItem.studentIds?.length || 0}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <select
                                className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                                value={teacher ? (teacher as any).id || teacher._id : ''}
                                onChange={(e) => {
                                  if (e.target.value) {
                                    handleAssignTeacherToClass(classId, e.target.value);
                                    e.target.value = '';
                                  }
                                }}
                              >
                                <option value="">{teacher ? 'Change Teacher' : 'Assign Teacher'}</option>
                                {approvedTeachers
                                  .filter(t => {
                                    const instId = getInstitutionId(classItem.institutionId);
                                    const teacherInstId = getInstitutionId(t.institutionId);
                                    return !instId || teacherInstId === instId;
                                  })
                                  .map((t) => {
                                    const tid = (t as any).id || t._id;
                                    return (
                                      <option key={tid} value={tid}>
                                        {t.name} ({t.institutionName || 'No School'})
                                      </option>
                                    );
                                  })}
                              </select>
                            </div>
                          </Card>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </Card>
                </motion.div>
              )}

              {/* Institution Assignment Modal */}
              {showInstitutionModal && selectedTeacher && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                  <Card className="p-6 max-w-md w-full bg-white">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-green-100">
                        <SchoolIcon className="h-5 w-5 text-green-600" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">Assign School to Teacher</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      Assign a school to <strong>{selectedTeacher.name}</strong>
                    </p>
                    <select
                      className="w-full px-4 py-2.5 border-2 border-green-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white mb-4"
                      onChange={(e) => {
                        if (e.target.value) {
                          const teacherId = (selectedTeacher as any).id || selectedTeacher._id;
                          handleAssignInstitution(teacherId, e.target.value);
                        }
                      }}
                    >
                      <option value="">Select School</option>
                      {schools.map((school) => (
                        <option key={school._id} value={school._id}>
                          {school.name}
                        </option>
                      ))}
                    </select>
                    <div className="flex justify-end space-x-2">
                      <Button 
                        variant="outline" 
                        className="border-green-200 text-green-700 hover:bg-green-50"
                        onClick={() => {
                          setShowInstitutionModal(false);
                          setSelectedTeacher(null);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </Card>
                </div>
              )}

              {/* Class Creation Modal */}
              {showClassModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                  <Card className="p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto bg-white">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-green-100">
                        <PlusCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">
                        Create New Class
                      </h3>
                    </div>
                    <form onSubmit={handleCreateClass} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          School <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={classFormData.institutionId}
                          onChange={(e) => setClassFormData({ ...classFormData, institutionId: e.target.value })}
                          className="w-full px-4 py-2.5 border-2 border-green-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                          required
                        >
                          <option value="">Select School</option>
                          {schools.map((school) => (
                            <option key={school._id} value={school._id}>
                              {school.name}
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
                            value={classFormData.grade}
                            onChange={(e) => setClassFormData({ ...classFormData, grade: e.target.value })}
                            className="w-full px-4 py-2.5 border-2 border-green-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                            required
                          >
                            {grades.map((g) => (
                              <option key={g} value={g}>Grade {g}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Section <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={classFormData.section}
                            onChange={(e) => setClassFormData({ ...classFormData, section: e.target.value })}
                            className="w-full px-4 py-2.5 border-2 border-green-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                            required
                          >
                            {sections.map((s) => (
                              <option key={s} value={s}>Section {s}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Teacher <span className="text-gray-500 text-xs">(Optional - can assign later)</span>
                        </label>
                        <select
                          value={classFormData.teacherId || ''}
                          onChange={(e) => setClassFormData({ ...classFormData, teacherId: e.target.value })}
                          className="w-full px-4 py-2.5 border-2 border-green-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                        >
                          <option value="">No teacher assigned (assign later)</option>
                          {teachers
                            .filter(t => t.approvalStatus === 'registered' && t.institutionName)
                            .filter(t => {
                              if (!classFormData.institutionId) return true;
                              const teacherInstId = getInstitutionId(t.institutionId);
                              return teacherInstId === classFormData.institutionId;
                            })
                            .map((t) => {
                              const tid = (t as any).id || t._id;
                              return (
                                <option key={tid} value={tid}>
                                  {t.name} ({t.email})
                                </option>
                              );
                            })}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Room Number (Optional)
                          </label>
                          <Input
                            type="text"
                            value={classFormData.roomNumber || ''}
                            onChange={(e) => setClassFormData({ ...classFormData, roomNumber: e.target.value })}
                            placeholder="e.g., Room 101"
                            className="border-2 border-green-100"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Capacity (Optional)
                          </label>
                          <Input
                            type="number"
                            value={classFormData.capacity || 40}
                            onChange={(e) => setClassFormData({ ...classFormData, capacity: parseInt(e.target.value) || 40 })}
                            min={1}
                            className="border-2 border-green-100"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end space-x-2 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          className="border-green-200 text-green-700 hover:bg-green-50"
                          onClick={() => {
                            setShowClassModal(false);
                            setEditingClass(null);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          className="bg-gradient-to-r from-green-600 to-[#008000] hover:from-green-700 hover:to-[#006600] text-white"
                        >
                          Create Class
                        </Button>
                      </div>
                    </form>
                  </Card>
                </div>
              )}

              {/* Assign Class Modal */}
              {showAssignClassModal && teacherForClassAssignment && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                  <Card className="p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-white">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-purple-100">
                        <BookOpen className="h-5 w-5 text-purple-600" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">Assign Class to Teacher</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      Assign a class to <strong>{teacherForClassAssignment?.name || 'Teacher'}</strong>
                      {teacherForClassAssignment?.institutionName && (
                        <span> from {teacherForClassAssignment.institutionName}</span>
                      )}
                    </p>
                    
                    {classes.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <p className="mb-2">No classes available.</p>
                        <p className="text-sm">Create a class first in the "Classes" tab.</p>
                        <Button
                          className="mt-4 bg-gradient-to-r from-green-600 to-[#008000] hover:from-green-700 hover:to-[#006600]"
                          onClick={() => {
                            setShowAssignClassModal(false);
                            setActiveTab('classes');
                          }}
                        >
                          Go to Classes Tab
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                        {classes
                          .filter(c => {
                            const teacherInstName = teacherForClassAssignment?.institutionName;
                            if (teacherInstName && teacherForClassAssignment) {
                              const classInstId = getInstitutionId(c.institutionId);
                              const teacherInstId = getInstitutionId(teacherForClassAssignment.institutionId);
                              return !classInstId || teacherInstId === classInstId;
                            }
                            return true;
                          })
                          .map((classItem) => {
                            const classId = (classItem as any).id || classItem._id;
                            const currentTeacher = typeof classItem.teacherId === 'object' ? classItem.teacherId : null;
                            const teacherId = (teacherForClassAssignment as any).id || teacherForClassAssignment._id;
                            const isAssigned = currentTeacher && (
                              (currentTeacher as any).id === teacherId ||
                              currentTeacher._id === teacherId
                            );
                            const hasOtherTeacher = currentTeacher && !isAssigned;
                            
                            return (
                              <div
                                key={classId}
                                className={`p-4 border-2 rounded-lg transition-all duration-200 ${
                                  isAssigned
                                    ? 'bg-green-50 border-green-300'
                                    : hasOtherTeacher
                                    ? 'bg-yellow-50 border-yellow-300'
                                    : 'bg-white border-green-200 hover:bg-green-50 hover:border-green-400 cursor-pointer'
                                }`}
                                onClick={() => {
                                  if (!isAssigned && !hasOtherTeacher) {
                                    handleAssignClassToTeacher(classId);
                                  }
                                }}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3">
                                      <div className={`p-2 rounded-lg ${
                                        isAssigned ? 'bg-green-100' : 
                                        hasOtherTeacher ? 'bg-yellow-100' : 
                                        'bg-blue-100'
                                      }`}>
                                        <BookOpen className={`h-5 w-5 ${
                                          isAssigned ? 'text-green-600' : 
                                          hasOtherTeacher ? 'text-yellow-600' : 
                                          'text-blue-600'
                                        }`} />
                                      </div>
                                      <div>
                                        <div className="font-medium text-gray-900">
                                          Grade {classItem.grade} - Section {classItem.section}
                                        </div>
                                        <div className="text-sm text-gray-500 font-mono mt-1">
                                          {classItem.classCode}
                                        </div>
                                        {typeof classItem.institutionId === 'object' && classItem.institutionId && (
                                          <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                            <SchoolIcon className="h-3 w-3" />
                                            {classItem.institutionId.name}
                                          </div>
                                        )}
                                        {hasOtherTeacher && (
                                          <div className="text-xs text-yellow-700 mt-1 flex items-center gap-1">
                                            <AlertCircle className="h-3 w-3" />
                                            Currently assigned to: {currentTeacher?.name || 'Another teacher'}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="ml-4">
                                    {isAssigned ? (
                                      <span className="px-3 py-1.5 text-xs rounded-lg bg-green-100 text-green-800 font-medium">
                                        ✅ Assigned
                                      </span>
                                    ) : hasOtherTeacher ? (
                                      <Button
                                        size="sm"
                                        className="bg-orange-600 hover:bg-orange-700 text-white text-xs"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (confirm(`This class is currently assigned to ${currentTeacher?.name || 'another teacher'}. Do you want to reassign it to ${teacherForClassAssignment.name}?`)) {
                                            handleAssignClassToTeacher(classId);
                                          }
                                        }}
                                      >
                                        Reassign
                                      </Button>
                                    ) : (
                                      <Button
                                        size="sm"
                                        className="bg-gradient-to-r from-green-600 to-[#008000] hover:from-green-700 hover:to-[#006600] text-white text-xs"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleAssignClassToTeacher(classId);
                                        }}
                                      >
                                        Assign
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    )}
                    
                    <div className="flex justify-end mt-6 pt-4 border-t border-green-100">
                      <Button
                        variant="outline"
                        className="border-green-200 text-green-700 hover:bg-green-50"
                        onClick={() => {
                          setShowAssignClassModal(false);
                          setTeacherForClassAssignment(null);
                        }}
                      >
                        Close
                      </Button>
                    </div>
                  </Card>
                </div>
              )}

              {/* Educational Banner */}
              <div className="p-5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-400 text-white shadow-lg shadow-blue-500/20">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                      <Shield className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">👨‍🏫 Teacher Management</h3>
                      <p className="text-sm opacity-90 mt-1">
                        Approve teachers, assign them to schools, and create classes for effective safety education.
                        Ensure each teacher is fully set up with both school and class assignments.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </AdminRoute>
  );
}
