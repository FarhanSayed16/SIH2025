/**
 * Add Child Page — paste-only QR linking (WB9)
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';
import { parentApi, LinkResult } from '@/lib/api/parent';
import { Card } from '@/components/ui/card';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { QrCode, User, CheckCircle, Clock } from 'lucide-react';

export default function AddChildPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'qr' | 'id'>('qr');
  const [qrCode, setQrCode] = useState('');
  const [studentId, setStudentId] = useState('');
  const [relationship, setRelationship] = useState('other');
  const [isLinking, setIsLinking] = useState(false);
  const [linkResult, setLinkResult] = useState<LinkResult | null>(null);

  if (!isAuthenticated || user?.role !== 'parent') {
    router.push('/login');
    return null;
  }

  const handleLinkByQR = async () => {
    if (!qrCode.trim()) {
      showToast('Please paste a QR code payload', 'error');
      return;
    }

    setIsLinking(true);
    setLinkResult(null);

    try {
      const response = await parentApi.linkStudentByQR(qrCode.trim(), relationship);
      if (response.success && response.data) {
        setLinkResult(response.data);
        if (response.data.autoVerified) {
          showToast('Child linked successfully!', 'success');
          setTimeout(() => {
            router.push('/parent/dashboard');
          }, 2000);
        } else {
          showToast('Link request submitted. Awaiting approval.', 'info');
        }
      }
    } catch (error: any) {
      showToast(error.message || 'Failed to link child', 'error');
    } finally {
      setIsLinking(false);
    }
  };

  const handleLinkById = async () => {
    if (!studentId.trim()) {
      showToast('Please enter a student ID', 'error');
      return;
    }

    setIsLinking(true);
    setLinkResult(null);

    try {
      const response = await parentApi.linkStudentById(studentId.trim(), relationship);
      if (response.success && response.data) {
        setLinkResult(response.data);
        if (response.data.autoVerified) {
          showToast('Child linked successfully!', 'success');
          setTimeout(() => {
            router.push('/parent/dashboard');
          }, 2000);
        } else {
          showToast('Link request submitted. Awaiting approval.', 'info');
        }
      }
    } catch (error: any) {
      showToast(error.message || 'Failed to link child', 'error');
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <AppShell title="Add child">
      <div className="max-w-2xl mx-auto">
        <p className="text-gray-600 mb-6">
          Link your child&apos;s account to monitor their progress and safety. Paste QR data
          only — web camera scanning is not available yet.
        </p>

        <div className="flex gap-2 mb-6" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'qr'}
            onClick={() => setActiveTab('qr')}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'qr' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <QrCode className="inline-block w-4 h-4 mr-2" />
            QR Code
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'id'}
            onClick={() => setActiveTab('id')}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'id' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <User className="inline-block w-4 h-4 mr-2" />
            Student ID
          </button>
        </div>

        {activeTab === 'qr' && (
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="child-qr-paste">
                  Paste QR payload
                </label>
                <input
                  id="child-qr-paste"
                  type="text"
                  value={qrCode}
                  onChange={(e) => setQrCode(e.target.value)}
                  placeholder="Paste QR code from child ID card"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Paste-only on web. A camera scanner is not implemented here.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Relationship</label>
                <select
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="father">Father</option>
                  <option value="mother">Mother</option>
                  <option value="guardian">Guardian</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <Button onClick={handleLinkByQR} disabled={isLinking} className="w-full bg-blue-600 hover:bg-blue-700">
                {isLinking ? 'Linking...' : 'Link Child'}
              </Button>
            </div>
          </Card>
        )}

        {activeTab === 'id' && (
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Student ID</label>
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="Enter student ID or registration number"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Relationship</label>
                <select
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="father">Father</option>
                  <option value="mother">Mother</option>
                  <option value="guardian">Guardian</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <Button onClick={handleLinkById} disabled={isLinking} className="w-full bg-blue-600 hover:bg-blue-700">
                {isLinking ? 'Linking...' : 'Link Child'}
              </Button>
            </div>
          </Card>
        )}

        {linkResult && (
          <Card className="p-6 mt-6">
            <div className="flex items-start gap-4">
              {linkResult.autoVerified ? (
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
              ) : (
                <Clock className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">
                  {linkResult.autoVerified ? 'Successfully Linked!' : 'Request Submitted'}
                </h3>
                <p className="text-sm text-gray-600 mb-3">{linkResult.message}</p>
                {linkResult.student && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-gray-900">{linkResult.student.name}</p>
                    {linkResult.student.grade && linkResult.student.section && (
                      <p className="text-xs text-gray-600">
                        Grade {linkResult.student.grade} - Section {linkResult.student.section}
                      </p>
                    )}
                  </div>
                )}
                {linkResult.autoVerified && (
                  <Button
                    onClick={() => router.push('/parent/dashboard')}
                    className="mt-4 bg-blue-600 hover:bg-blue-700"
                  >
                    Go to Dashboard
                  </Button>
                )}
              </div>
            </div>
          </Card>
        )}

        <Card className="p-6 mt-6 bg-blue-50 border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">How it works</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Paste your child&apos;s QR payload from their ID card</li>
            <li>• Or enter their student ID/registration number</li>
            <li>• If you&apos;re in the same institution, linking happens automatically</li>
            <li>• Otherwise, your request will be sent for approval</li>
            <li>• You&apos;ll be notified once the link is approved</li>
          </ul>
        </Card>
      </div>
    </AppShell>
  );
}
