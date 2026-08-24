/**
 * Parent Profile Page
 * Edit parent profile, change password, and manage account settings
 * Parent Monitoring System - Phase 2
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';
import { parentApi } from '@/lib/api/parent';
import { authApi } from '@/lib/api/auth';
import { Card } from '@/components/ui/card';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/toast';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import {
  User,
  Mail,
  Phone,
  Shield,
  Lock,
  Save,
  LogOut,
  ArrowLeft,
  Edit,
  X,
  CheckCircle
} from 'lucide-react';

export default function ParentProfilePage() {
  const router = useRouter();
  const { user: authUser, isAuthenticated, accessToken, logout } = useAuthStore();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  // Profile form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    parentProfile: {
      phoneNumber: '',
      alternatePhoneNumber: '',
      relationship: 'other'
    }
  });

  // Password form state
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (authUser?.role !== 'parent') {
      router.push('/dashboard');
      return;
    }

    if (accessToken) {
      const { apiClient } = require('@/lib/api/client');
      apiClient.setToken(accessToken);
    }

    loadProfile();
  }, [isAuthenticated, router, accessToken, authUser]);

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await authApi.getProfile();
      // Handle both response.data.user and response.data directly
      const userData = (response.data as any)?.user || response.data;
      if (userData) {
        setProfile(userData);
        setFormData({
          name: userData.name || '',
          email: userData.email || '',
          phone: userData.phone || '',
          parentProfile: {
            phoneNumber: userData.parentProfile?.phoneNumber || userData.phone || '',
            alternatePhoneNumber: userData.parentProfile?.alternatePhoneNumber || '',
            relationship: userData.parentProfile?.relationship || 'other'
          }
        });
      }
    } catch (error: any) {
      console.error('Error loading profile:', error);
      showToast('Failed to load profile', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const response = await parentApi.updateProfile(formData);
      if (response.success) {
        showToast('Profile updated successfully', 'success');
        loadProfile();
      } else {
        showToast(response.message || 'Failed to update profile', 'error');
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      showToast(error.message || 'Failed to update profile', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      showToast('Password must be at least 6 characters long', 'error');
      return;
    }

    setIsChangingPassword(true);
    try {
      const response = await parentApi.changePassword(passwordData.oldPassword, passwordData.newPassword);
      if (response.success) {
        showToast('Password changed successfully', 'success');
        setShowPasswordForm(false);
        setPasswordData({
          oldPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        showToast(response.message || 'Failed to change password', 'error');
      }
    } catch (error: any) {
      console.error('Error changing password:', error);
      showToast(error.message || 'Failed to change password', 'error');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogout = async () => {
    if (!confirm('Are you sure you want to logout?')) {
      return;
    }

    try {
      await logout();
      router.push('/login');
    } catch (error: any) {
      console.error('Error logging out:', error);
      showToast('Failed to logout', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            <LoadingSkeleton />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-blue-50 via-white to-blue-50 p-6">
          {/* Header */}
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
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  My Profile
                </h1>
                <p className="text-gray-600 mt-2">Manage your account information and settings</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Profile Information */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Edit className="w-5 h-5 text-blue-600" />
                Profile Information
              </h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="your.email@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1234567890"
                  />
                </div>
                <div>
                  <Label htmlFor="parentPhone">Parent Phone (Primary)</Label>
                  <Input
                    id="parentPhone"
                    value={formData.parentProfile.phoneNumber}
                    onChange={(e) => setFormData({
                      ...formData,
                      parentProfile: { ...formData.parentProfile, phoneNumber: e.target.value }
                    })}
                    placeholder="Primary contact number"
                  />
                </div>
                <div>
                  <Label htmlFor="alternatePhone">Alternate Phone</Label>
                  <Input
                    id="alternatePhone"
                    value={formData.parentProfile.alternatePhoneNumber}
                    onChange={(e) => setFormData({
                      ...formData,
                      parentProfile: { ...formData.parentProfile, alternatePhoneNumber: e.target.value }
                    })}
                    placeholder="Alternate contact number (optional)"
                  />
                </div>
                <div>
                  <Label htmlFor="relationship">Relationship Type</Label>
                  <select
                    id="relationship"
                    value={formData.parentProfile.relationship}
                    onChange={(e) => setFormData({
                      ...formData,
                      parentProfile: { ...formData.parentProfile, relationship: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="father">Father</option>
                    <option value="mother">Mother</option>
                    <option value="guardian">Guardian</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <Button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isSaving ? (
                    <>Saving...</>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </Card>

            {/* Account Settings */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                Account Settings
              </h2>
              <div className="space-y-4">
                {/* Change Password */}
                {!showPasswordForm ? (
                  <div>
                    <Label>Password</Label>
                    <Button
                      onClick={() => setShowPasswordForm(true)}
                      variant="outline"
                      className="w-full mt-2"
                    >
                      <Lock className="w-4 h-4 mr-2" />
                      Change Password
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <Label>Change Password</Label>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setShowPasswordForm(false);
                          setPasswordData({
                            oldPassword: '',
                            newPassword: '',
                            confirmPassword: ''
                          });
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <div>
                      <Label htmlFor="oldPassword">Current Password</Label>
                      <Input
                        id="oldPassword"
                        type="password"
                        value={passwordData.oldPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                        placeholder="Enter current password"
                      />
                    </div>
                    <div>
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        placeholder="Enter new password (min 6 characters)"
                      />
                    </div>
                    <div>
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        placeholder="Confirm new password"
                      />
                    </div>
                    <Button
                      onClick={handleChangePassword}
                      disabled={isChangingPassword}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {isChangingPassword ? (
                        <>Changing...</>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Change Password
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {/* Account Info */}
                <div className="pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Account Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Role:</span>
                      <span className="font-medium text-gray-900 capitalize">{profile?.role || 'Parent'}</span>
                    </div>
                    {profile?.institutionId && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Institution:</span>
                        <span className="font-medium text-gray-900">
                          {typeof profile.institutionId === 'object' ? profile.institutionId.name : 'N/A'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Logout */}
                <div className="pt-4 border-t border-gray-200">
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    className="w-full text-red-600 hover:text-red-700 hover:border-red-300"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}

