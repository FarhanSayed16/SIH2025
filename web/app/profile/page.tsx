/**
 * Profile Page
 * Display user profile information including parent linking info for students
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';
import { apiClient } from '@/lib/api/client';
import { Card } from '@/components/ui/card';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { getInstitutionId } from '@/lib/utils/institution';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { 
  QrCode, 
  Copy, 
  Check, 
  Building2, 
  User, 
  Mail,
  Phone,
  GraduationCap,
  Shield
} from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamically import QR code component to avoid SSR issues
const QRCodeSVG = dynamic(() => import('qrcode.react').then((mod) => mod.QRCodeSVG), { 
  ssr: false,
  loading: () => <div className="w-[200px] h-[200px] bg-gray-100 rounded animate-pulse" />
});

interface UserProfile {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  role: string;
  grade?: string;
  section?: string;
  qrCode?: string;
  qrBadgeId?: string;
  institutionId?: {
    _id: string;
    name: string;
    address?: string;
  } | string;
  classId?: {
    _id: string;
    classCode: string;
    grade: string;
    section: string;
  } | string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user: authUser, isAuthenticated, accessToken } = useAuthStore();
  const { showToast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (accessToken) {
      apiClient.setToken(accessToken);
    }

    loadProfile();
  }, [isAuthenticated, router, accessToken]);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<{ user: UserProfile }>('/auth/profile');
      if (response.data?.user) {
        setProfile(response.data.user);
      }
    } catch (error: any) {
      console.error('Error loading profile:', error);
      showToast('Failed to load profile', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
      showToast('Copied to clipboard!', 'success');
    } catch (error) {
      console.error('Failed to copy:', error);
      showToast('Failed to copy to clipboard', 'error');
    }
  };

  const getInstitutionName = () => {
    if (!profile?.institutionId) return null;
    if (typeof profile.institutionId === 'object') {
      return profile.institutionId.name;
    }
    return null;
  };

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-6">
            <LoadingSkeleton />
          </main>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-6">
            <Card className="p-6">
              <p className="text-gray-600">Failed to load profile</p>
            </Card>
          </main>
        </div>
      </div>
    );
  }

  const isStudent = profile.role === 'student';
  const institutionId = getInstitutionId(profile?.institutionId);
  const institutionName = getInstitutionName();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            {/* Profile Header */}
            <Card className="p-6 mb-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {profile.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{profile.name}</h1>
                  <p className="text-gray-600">{profile.email || 'No email'}</p>
                  <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                    {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                  </span>
                </div>
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profile.phone && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <Phone className="w-4 h-4" />
                    <span className="text-sm">{profile.phone}</span>
                  </div>
                )}
                {profile.grade && profile.section && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <GraduationCap className="w-4 h-4" />
                    <span className="text-sm">Grade {profile.grade} - Section {profile.section}</span>
                  </div>
                )}
                {institutionName && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <Building2 className="w-4 h-4" />
                    <span className="text-sm">{institutionName}</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Parent Linking Information - Only for Students */}
            {isStudent && (
              <Card className="p-6 mb-6 bg-blue-50 border-blue-200">
                <div className="flex items-center gap-2 mb-4">
                  <QrCode className="w-5 h-5 text-blue-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Parent Linking Information</h2>
                </div>
                <p className="text-sm text-gray-600 mb-6">
                  Share this information with your parent so they can link your account and monitor your progress.
                </p>

                {/* QR Code Section */}
                {profile.qrCode && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      QR Code
                    </label>
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <div className="flex justify-center mb-4">
                        <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                          <QRCodeSVG value={profile.qrCode} size={200} />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <code className="flex-1 text-sm bg-gray-100 p-3 rounded border border-gray-200 font-mono break-all">
                          {profile.qrCode}
                        </code>
                        <Button
                          onClick={() => copyToClipboard(profile.qrCode!, 'qr')}
                          variant="outline"
                          size="sm"
                          className="flex-shrink-0"
                        >
                          {copied === 'qr' ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                      {profile.qrBadgeId && (
                        <p className="text-xs text-gray-600 mt-2">
                          Badge ID: <span className="font-mono">{profile.qrBadgeId}</span>
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Student ID Section */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Student ID
                  </label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-sm bg-white p-3 rounded border border-gray-200 font-mono break-all">
                      {profile._id}
                    </code>
                    <Button
                      onClick={() => copyToClipboard(profile._id, 'id')}
                      variant="outline"
                      size="sm"
                      className="flex-shrink-0"
                    >
                      {copied === 'id' ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Institution Section */}
                {institutionId && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Institution ID
                    </label>
                    <div className="space-y-2">
                      {institutionName && (
                        <p className="text-sm text-gray-900 font-medium">
                          {institutionName}
                        </p>
                      )}
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-sm bg-white p-3 rounded border border-gray-200 font-mono break-all">
                          {institutionId}
                        </code>
                        <Button
                          onClick={() => copyToClipboard(institutionId, 'institution')}
                          variant="outline"
                          size="sm"
                          className="flex-shrink-0"
                        >
                          {copied === 'institution' ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Instructions */}
                <div className="bg-blue-100 p-4 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    How to share with parents:
                  </h3>
                  <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                    <li>Share your QR code or Student ID with your parent</li>
                    <li>Parent can use this information to link your account</li>
                    <li>Parent needs to login and go to &quot;Add Child&quot; page</li>
                    <li>Parent can scan the QR code or enter your Student ID</li>
                  </ul>
                </div>
              </Card>
            )}

            {/* Other Profile Information */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Information</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b border-gray-200">
                  <span className="text-sm font-medium text-gray-700">User ID</span>
                  <div className="flex items-center gap-2">
                    <code className="text-sm text-gray-600 font-mono">{profile._id}</code>
                    <Button
                      onClick={() => copyToClipboard(profile._id, 'userId')}
                      variant="outline"
                      size="sm"
                    >
                      {copied === 'userId' ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
                {profile.email && (
                  <div className="flex items-center justify-between py-2 border-b border-gray-200">
                    <span className="text-sm font-medium text-gray-700">Email</span>
                    <span className="text-sm text-gray-600">{profile.email}</span>
                  </div>
                )}
                {profile.phone && (
                  <div className="flex items-center justify-between py-2 border-b border-gray-200">
                    <span className="text-sm font-medium text-gray-700">Phone</span>
                    <span className="text-sm text-gray-600">{profile.phone}</span>
                  </div>
                )}
                {profile.grade && (
                  <div className="flex items-center justify-between py-2 border-b border-gray-200">
                    <span className="text-sm font-medium text-gray-700">Grade</span>
                    <span className="text-sm text-gray-600">{profile.grade}</span>
                  </div>
                )}
                {profile.section && (
                  <div className="flex items-center justify-between py-2 border-b border-gray-200">
                    <span className="text-sm font-medium text-gray-700">Section</span>
                    <span className="text-sm text-gray-600">{profile.section}</span>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}

