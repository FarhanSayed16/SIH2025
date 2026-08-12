/**
 * Student Parents List Component
 * Phase 4: Parent-Teacher-Student Linkage
 * Displays all parents linked to a student
 */

'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { teacherApi } from '@/lib/api/teacher';
import { QrCode, Phone, Mail, UserCheck, UserX, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

interface StudentParentsListProps {
  studentId: string;
  onScanQR?: () => void;
}

interface Parent {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  relationship: string;
  isPrimary: boolean;
  verified: boolean;
  verifiedAt?: string;
  verificationMethod?: string;
  parentProfile?: {
    phoneNumber?: string;
    alternatePhone?: string;
    address?: string;
  };
}

export function StudentParentsList({ studentId, onScanQR }: StudentParentsListProps) {
  const [parents, setParents] = useState<Parent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  const loadParents = async () => {
    try {
      setIsLoading(true);
      const response = await teacherApi.getStudentParents(studentId);
      if (response.success && response.data?.parents) {
        setParents(response.data.parents);
      }
    } catch (error: any) {
      console.error('Error loading parents:', error);
      showToast('Failed to load parents', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (studentId) {
      loadParents();
    }
  }, [studentId]);

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const handleEmail = (email: string) => {
    window.location.href = `mailto:${email}`;
  };

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Linked Parents</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadParents}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          {onScanQR && (
            <Button variant="outline" size="sm" onClick={onScanQR}>
              <QrCode className="w-4 h-4 mr-2" />
              Scan QR Code
            </Button>
          )}
        </div>
      </div>

      {parents.length === 0 ? (
        <EmptyState
          title="No parents linked"
          description="This student doesn't have any linked parents yet."
        />
      ) : (
        <div className="space-y-4">
          {parents.map((parent) => (
            <div
              key={parent._id}
              className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-semibold">{parent.name}</h4>
                  {parent.isPrimary && (
                    <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">
                      Primary
                    </span>
                  )}
                  {parent.verified ? (
                    <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded flex items-center gap-1">
                      <UserCheck className="w-3 h-3" />
                      Verified
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded flex items-center gap-1">
                      <UserX className="w-3 h-3" />
                      Not Verified
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-1">
                  Relationship: <span className="font-medium">{parent.relationship}</span>
                </p>
                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                  {parent.email && (
                    <button
                      onClick={() => handleEmail(parent.email)}
                      className="flex items-center gap-1 hover:text-blue-600"
                    >
                      <Mail className="w-4 h-4" />
                      {parent.email}
                    </button>
                  )}
                  {(parent.phone || parent.parentProfile?.phoneNumber) && (
                    <button
                      onClick={() =>
                        handleCall(parent.phone || parent.parentProfile?.phoneNumber || '')
                      }
                      className="flex items-center gap-1 hover:text-blue-600"
                    >
                      <Phone className="w-4 h-4" />
                      {parent.phone || parent.parentProfile?.phoneNumber}
                    </button>
                  )}
                </div>
                {parent.verifiedAt && (
                  <p className="text-xs text-gray-400 mt-2">
                    Verified on:{' '}
                    {new Date(parent.verifiedAt).toLocaleDateString()}
                    {parent.verificationMethod && ` via ${parent.verificationMethod}`}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

