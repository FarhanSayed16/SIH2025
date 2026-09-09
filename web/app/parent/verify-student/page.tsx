/**
 * Parent QR verification — paste-only web flow (WB6 / WD13).
 * Camera scan remains on the mobile app.
 */

'use client';

import { AppShell } from '@/components/layout/app-shell';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';
import { parentApi, QRVerificationResult } from '@/lib/api/parent';
import { childSafetyHref } from '@/lib/api/parent-honesty';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import {
  ArrowLeft,
  QrCode,
  CheckCircle,
  XCircle,
  AlertTriangle,
  User,
  Shield,
  MapPin,
  RefreshCw,
} from 'lucide-react';

type VerifyErrorKind = 'network' | 'not_linked' | null;

export default function VerifyStudentPage() {
  const router = useRouter();
  const { user, isAuthenticated, accessToken } = useAuthStore();
  const { showToast } = useToast();
  const [qrCode, setQrCode] = useState('');
  const [verificationResult, setVerificationResult] = useState<QRVerificationResult | null>(null);
  const [errorKind, setErrorKind] = useState<VerifyErrorKind>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const verifyingRef = useRef(false);
  const requestSeq = useRef(0);

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

  const handleVerify = async (e?: FormEvent) => {
    e?.preventDefault();
    if (verifyingRef.current) return;
    if (!qrCode.trim()) {
      showToast('Please paste a student QR code', 'error');
      return;
    }

    verifyingRef.current = true;
    setIsVerifying(true);
    setVerificationResult(null);
    setErrorKind(null);
    setErrorMessage(null);
    const seq = ++requestSeq.current;

    try {
      const response = await parentApi.verifyStudentQR(qrCode.trim());
      if (seq !== requestSeq.current) return;

      if (response.success && response.data) {
        setVerificationResult(response.data);
        if (response.data.verified) {
          showToast('Student verified', 'success');
        } else {
          setErrorKind('not_linked');
          showToast('Student not linked to your account', 'warning');
        }
      } else {
        setErrorKind('not_linked');
        setErrorMessage(response.message || 'Verification did not succeed');
        setVerificationResult({
          verified: false,
          message: response.message || 'Verification did not succeed',
        });
      }
    } catch (error: any) {
      if (seq !== requestSeq.current) return;
      console.error('Error verifying QR code:', error);
      setErrorKind('network');
      setErrorMessage(error?.message || 'Network error while verifying');
      setVerificationResult(null);
      showToast('Could not reach the server. Try again.', 'error');
    } finally {
      if (seq === requestSeq.current) {
        verifyingRef.current = false;
        setIsVerifying(false);
      }
    }
  };

  const onCodeChange = (value: string) => {
    setQrCode(value);
    // Editing invalidates prior result (WD13)
    if (verificationResult || errorKind) {
      setVerificationResult(null);
      setErrorKind(null);
      setErrorMessage(null);
    }
  };

  const resetForm = () => {
    setQrCode('');
    setVerificationResult(null);
    setErrorKind(null);
    setErrorMessage(null);
  };

  return (
    <AppShell title="Verify Student">
      <div className="mb-6 max-w-xl">
        <Button onClick={() => router.push('/parent/dashboard')} variant="outline" className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to dashboard
        </Button>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-teal-800 rounded-lg flex items-center justify-center">
            <QrCode className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Verify student</h1>
            <p className="text-gray-600 mt-1">
              Paste the code from your child&apos;s school QR badge. Camera scanning is available in
              the Kavach mobile app, not in this browser page.
            </p>
          </div>
        </div>
      </div>

      <Card className="p-6 max-w-xl mb-6">
        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label htmlFor="student-qr" className="block text-sm font-medium text-gray-700 mb-2">
              Student QR code
            </label>
            <input
              id="student-qr"
              type="text"
              value={qrCode}
              onChange={(e) => onCodeChange(e.target.value)}
              placeholder="Paste code here"
              autoComplete="off"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600"
            />
            <p className="text-xs text-gray-500 mt-2">
              Ask the school for your child&apos;s parent-verification QR if you do not have it.
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={isVerifying || !qrCode.trim()}
              className="flex-1"
            >
              {isVerifying ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Verifying…
                </>
              ) : (
                <>
                  <QrCode className="w-4 h-4 mr-2" />
                  Verify
                </>
              )}
            </Button>
            {(verificationResult || errorKind) && (
              <Button type="button" onClick={resetForm} variant="outline">
                Clear
              </Button>
            )}
          </div>
        </form>
      </Card>

      {(verificationResult || errorKind) && (
        <Card className="p-6 max-w-xl">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Result</h2>

          {errorKind === 'network' && (
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-amber-700 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-900">Could not verify</p>
                <p className="text-sm text-amber-800 mt-1">
                  {errorMessage || 'A network or server error occurred. This does not mean the student is unlinked.'}
                </p>
                <Button className="mt-3" variant="outline" onClick={() => handleVerify()} disabled={isVerifying}>
                  Retry
                </Button>
              </div>
            </div>
          )}

          {verificationResult?.verified && verificationResult.student && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <div>
                  <p className="font-semibold text-green-900">Verified</p>
                  <p className="text-sm text-green-700">This student is linked to your account</p>
                </div>
              </div>

              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-14 h-14 bg-teal-800 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  {verificationResult.student.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">
                    {verificationResult.student.name}
                  </h3>
                  {(verificationResult.student.grade || verificationResult.student.section) && (
                    <p className="text-sm text-gray-600">
                      {verificationResult.student.grade && `Grade ${verificationResult.student.grade}`}
                      {verificationResult.student.grade && verificationResult.student.section && ' · '}
                      {verificationResult.student.section && `Section ${verificationResult.student.section}`}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <Button
                  onClick={() =>
                    router.push(`/parent/children/${verificationResult.student!._id}`)
                  }
                  className="flex-1"
                >
                  <User className="w-4 h-4 mr-2" />
                  View details
                </Button>
                <Button
                  onClick={() =>
                    router.push(childSafetyHref(verificationResult.student!._id))
                  }
                  variant="outline"
                  className="flex-1"
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  Safety status
                </Button>
              </div>
            </div>
          )}

          {verificationResult && !verificationResult.verified && errorKind !== 'network' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <XCircle className="w-6 h-6 text-red-600" />
                <div>
                  <p className="font-semibold text-red-900">Not linked</p>
                  <p className="text-sm text-red-700">
                    {verificationResult.message ||
                      'This code does not match a student linked to your account'}
                  </p>
                </div>
              </div>
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700">
                <p className="font-medium mb-1 flex items-center gap-2">
                  <Shield className="w-4 h-4" /> Next steps
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Ask the school to link this student to your parent account</li>
                  <li>Confirm you pasted the correct parent-verification code</li>
                </ul>
              </div>
            </div>
          )}
        </Card>
      )}
    </AppShell>
  );
}
