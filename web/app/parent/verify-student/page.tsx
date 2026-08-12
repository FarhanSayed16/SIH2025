/**
 * QR Code Student Verification Page
 * Allows parents to scan and verify student QR codes
 * Parent Monitoring System - Phase 2
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';
import { parentApi, QRVerificationResult } from '@/lib/api/parent';
import { Card } from '@/components/ui/card';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import {
  ArrowLeft,
  QrCode,
  CheckCircle,
  XCircle,
  AlertTriangle,
  User,
  Shield,
  MapPin,
  BookOpen,
  RefreshCw
} from 'lucide-react';

export default function VerifyStudentPage() {
  const router = useRouter();
  const { user, isAuthenticated, accessToken } = useAuthStore();
  const { showToast } = useToast();
  const [qrCode, setQrCode] = useState('');
  const [verificationResult, setVerificationResult] = useState<QRVerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'parent') {
      router.push('/login');
      return;
    }

    if (accessToken) {
      const { apiClient } = require('@/lib/api/client');
      apiClient.setToken(accessToken);
    }
  }, [isAuthenticated, router, accessToken, user]);

  const handleVerify = async () => {
    if (!qrCode.trim()) {
      showToast('Please enter a QR code', 'error');
      return;
    }

    setIsVerifying(true);
    setVerificationResult(null);
    try {
      const response = await parentApi.verifyStudentQR(qrCode.trim());
      if (response.success && response.data) {
        setVerificationResult(response.data);
        if (response.data.verified) {
          showToast('Student verified successfully!', 'success');
        } else {
          showToast('Student not linked to your account', 'warning');
        }
      }
    } catch (error: any) {
      console.error('Error verifying QR code:', error);
      showToast('Failed to verify QR code', 'error');
      setVerificationResult({
        verified: false,
        message: 'Failed to verify QR code. Please try again.'
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleScan = () => {
    // TODO: Implement camera-based QR scanning
    // For now, show a placeholder
    setIsScanning(true);
    showToast('QR scanner will be available in mobile app', 'info');
    setTimeout(() => setIsScanning(false), 2000);
  };

  const resetForm = () => {
    setQrCode('');
    setVerificationResult(null);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-green-50 via-white to-green-50 p-6">
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
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-green-700 rounded-lg flex items-center justify-center">
                <QrCode className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Verify Student</h1>
                <p className="text-gray-600 mt-1">Scan or enter student QR code to verify identity</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Section */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Enter QR Code</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    QR Code
                  </label>
                  <input
                    type="text"
                    value={qrCode}
                    onChange={(e) => setQrCode(e.target.value)}
                    placeholder="Enter or scan QR code"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleVerify();
                      }
                    }}
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={handleVerify}
                    disabled={isVerifying || !qrCode.trim()}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    {isVerifying ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <QrCode className="w-4 h-4 mr-2" />
                        Verify
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleScan}
                    disabled={isScanning}
                    variant="outline"
                    className="flex-1"
                  >
                    {isScanning ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Scanning...
                      </>
                    ) : (
                      <>
                        <QrCode className="w-4 h-4 mr-2" />
                        Scan
                      </>
                    )}
                  </Button>
                </div>
                {verificationResult && (
                  <Button
                    onClick={resetForm}
                    variant="outline"
                    className="w-full"
                  >
                    Clear & Scan Another
                  </Button>
                )}
              </div>
            </Card>

            {/* Result Section */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Verification Result</h2>
              {!verificationResult ? (
                <div className="text-center py-12">
                  <QrCode className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Enter or scan a QR code to verify</p>
                </div>
              ) : verificationResult.verified && verificationResult.student ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    <div>
                      <p className="font-semibold text-green-900">Verified Successfully</p>
                      <p className="text-sm text-green-700">This student is linked to your account</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-4 p-4 bg-blue-50 rounded-lg">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                        {verificationResult.student.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg">
                          {verificationResult.student.name}
                        </h3>
                        {verificationResult.student.grade && verificationResult.student.section && (
                          <p className="text-sm text-gray-600">
                            Grade {verificationResult.student.grade} - Section {verificationResult.student.section}
                          </p>
                        )}
                        {verificationResult.relationship && (
                          <p className="text-xs text-gray-500 mt-1">
                            Relationship: <span className="font-medium capitalize">
                              {verificationResult.relationship.relationship}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {verificationResult.student.classId && (
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-600 mb-1">Class</p>
                          <p className="font-medium text-gray-900">
                            {verificationResult.student.classId.classCode}
                          </p>
                        </div>
                      )}
                      {verificationResult.student.institutionId && (
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-600 mb-1">Institution</p>
                          <p className="font-medium text-gray-900">
                            {verificationResult.student.institutionId.name}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-gray-200">
                      <Button
                        onClick={() => router.push(`/parent/children/${verificationResult.student!._id}`)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <User className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                      <Button
                        onClick={() => router.push(`/parent/children/${verificationResult.student!._id}/location`)}
                        variant="outline"
                        className="flex-1"
                      >
                        <MapPin className="w-4 h-4 mr-2" />
                        View Location
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <XCircle className="w-6 h-6 text-red-600" />
                    <div>
                      <p className="font-semibold text-red-900">Not Verified</p>
                      <p className="text-sm text-red-700">
                        {verificationResult.message || 'This student is not linked to your account'}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-yellow-900 mb-1">What to do next?</p>
                        <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                          <li>Contact your school administrator to link this student to your account</li>
                          <li>Ensure you have the correct QR code for your child</li>
                          <li>If this is an emergency, contact the school immediately</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Info Section */}
          <Card className="mt-6 p-6 bg-blue-50 border border-blue-200">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              Security Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
              <div>
                <p className="font-medium mb-1">✓ Verified Students Only</p>
                <p className="text-gray-600">You can only verify students that are linked to your account through the school administrator.</p>
              </div>
              <div>
                <p className="font-medium mb-1">🔒 Privacy Protected</p>
                <p className="text-gray-600">Student information is only displayed if you are verified as the parent or guardian.</p>
              </div>
            </div>
          </Card>
        </main>
      </div>
    </div>
  );
}

