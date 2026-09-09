/**
 * Classroom join QR share dialog (WB3).
 * Session-only image/string — does not promise cross-session retrieval or old-code revocation (WD06 deferred).
 */

'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import type { ClassroomQR } from '@/lib/api/classroom';

export interface ClassShareInfo {
  classId: string;
  grade: string;
  section: string;
  classCode: string;
  joinQRCode?: string | null;
  joinQRExpiresAt?: string | null;
}

interface ClassroomQRShareDialogProps {
  open: boolean;
  onClose: () => void;
  classInfo: ClassShareInfo | null;
  /** QR payload from this browser session after generate (has qrImage). */
  sessionQR: ClassroomQR | null;
  generating?: boolean;
  onGenerate: () => void;
}

function isExpired(expiresAt?: string | null): boolean {
  if (!expiresAt) return false;
  const t = new Date(expiresAt).getTime();
  return Number.isFinite(t) && t < Date.now();
}

export function ClassroomQRShareDialog({
  open,
  onClose,
  classInfo,
  sessionQR,
  generating,
  onGenerate,
}: ClassroomQRShareDialogProps) {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');

  if (!classInfo) return null;

  const expirySource = sessionQR?.expiresAt || classInfo.joinQRExpiresAt || null;
  const expired = isExpired(expirySource);
  const hasSessionImage = Boolean(sessionQR?.qrImage);

  const copyCode = async () => {
    setCopyState('idle');
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error('Clipboard unavailable');
      }
      await navigator.clipboard.writeText(classInfo.classCode);
      setCopyState('copied');
    } catch {
      setCopyState('failed');
    }
  };

  const title = `Share · Grade ${classInfo.grade}-${classInfo.section}`;

  return (
    <Modal isOpen={open} onClose={onClose} title={title} size="md">
      <div className="space-y-5">
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">Class code</p>
          <p className="text-2xl font-mono font-semibold text-gray-900 tracking-wide">
            {classInfo.classCode}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" onClick={copyCode} className="min-h-11">
              Copy class code
            </Button>
            {copyState === 'copied' && (
              <span className="text-sm text-emerald-700">Copied</span>
            )}
            {copyState === 'failed' && (
              <span className="text-sm text-red-700">Clipboard blocked — copy the code manually</span>
            )}
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <p className="text-sm font-medium text-gray-900 mb-2">Join QR</p>
          {hasSessionImage && sessionQR?.qrImage ? (
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <img
                src={sessionQR.qrImage}
                alt={`Join QR for class ${classInfo.classCode}`}
                className="w-48 h-48 bg-white border border-gray-200 rounded-lg p-2"
              />
              <div className="text-sm text-gray-600 space-y-2">
                {expirySource && (
                  <p>
                    {expired ? 'Expired' : 'Expires'}:{' '}
                    <time dateTime={expirySource}>{new Date(expirySource).toLocaleString()}</time>
                  </p>
                )}
                <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-md p-2">
                  Generating a new QR updates the server hash for this class. This screen does not
                  claim that older printouts are rejected until server token checks are enforced.
                </p>
                <Button type="button" variant="outline" disabled={generating} onClick={onGenerate} className="min-h-11">
                  {generating ? 'Generating…' : 'Generate new QR'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 space-y-3">
              <p className="text-sm text-gray-700">
                Join QR not available in this session
                {classInfo.joinQRCode || classInfo.joinQRExpiresAt
                  ? ' — a code may exist on the server, but the image cannot be reconstructed from the stored hash.'
                  : '.'}
              </p>
              {expirySource && (
                <p className="text-xs text-gray-500">
                  Known expiry: {new Date(expirySource).toLocaleString()}
                  {expired ? ' (expired)' : ''}
                </p>
              )}
              <Button
                type="button"
                onClick={onGenerate}
                disabled={generating}
                className="min-h-11 bg-[var(--kavach-primary,#216E39)] hover:opacity-90 text-white"
              >
                {generating ? 'Generating…' : 'Generate QR for this session'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

// Re-export helper for list cards that track hash presence without image
export function classHasServerQRHash(joinQRCode?: string | null): boolean {
  return Boolean(joinQRCode);
}
