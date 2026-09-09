/**
 * Parent QR verification — paste-only until a real scanner ships (WB9 / WB10)
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { teacherApi } from '@/lib/api/teacher';
import { QrCode, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

interface QRCodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified?: (parentData: any) => void;
}

export function QRCodeScanner({ isOpen, onClose, onVerified }: QRCodeScannerProps) {
  const [pasteValue, setPasteValue] = useState('');
  const [scanResult, setScanResult] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    if (!isOpen) {
      setPasteValue('');
      setScanResult(null);
      setError(null);
      setIsVerifying(false);
    }
  }, [isOpen]);

  const handleVerifyQR = async (qrCodeData: string) => {
    const trimmed = qrCodeData.trim();
    if (!trimmed) {
      setError('Paste a parent QR payload first.');
      return;
    }

    try {
      setIsVerifying(true);
      setError(null);

      let location: { lat: number; lng: number } | undefined;
      try {
        if (navigator.geolocation) {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
          });
          location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
        }
      } catch {
        // optional
      }

      const response = await teacherApi.verifyParentByQR({
        qrCodeData: trimmed,
        location,
      });

      if (response.success && response.data) {
        setScanResult(response.data);
        showToast('Parent verified successfully!', 'success');
        onVerified?.(response.data);
      } else {
        setError(response.message || 'Failed to verify QR code');
        showToast('Failed to verify QR code', 'error');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to verify QR code');
      showToast('Failed to verify QR code', 'error');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Verify parent QR (paste)">
      <div className="space-y-4">
        {!scanResult ? (
          <>
            <p className="text-sm text-gray-600">
              Camera scanning is not implemented on web yet. Paste the parent QR payload below.
            </p>

            <label className="block text-sm font-medium text-gray-700" htmlFor="parent-qr-paste">
              QR payload
            </label>
            <textarea
              id="parent-qr-paste"
              value={pasteValue}
              onChange={(e) => {
                setPasteValue(e.target.value);
                setError(null);
              }}
              rows={4}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Paste QR code data"
              disabled={isVerifying}
            />

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">{error}</div>
            )}

            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={() => handleVerifyQR(pasteValue)}
                disabled={isVerifying || !pasteValue.trim()}
              >
                <QrCode className="w-4 h-4 mr-2" />
                {isVerifying ? 'Verifying…' : 'Verify'}
              </Button>
              <Button variant="outline" onClick={onClose} disabled={isVerifying}>
                Cancel
              </Button>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Parent verified</span>
            </div>
            <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto max-h-40">
              {JSON.stringify(scanResult, null, 2)}
            </pre>
            <Button
              onClick={() => {
                setScanResult(null);
                setPasteValue('');
                onClose();
              }}
            >
              Done
            </Button>
            {scanResult?.success === false && (
              <div className="flex items-center gap-2 text-red-700 text-sm">
                <XCircle className="w-4 h-4" />
                Verification reported failure
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
