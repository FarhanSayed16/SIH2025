/**
 * QR Code Scanner Component
 * Phase 4: Parent-Teacher-Student Linkage
 * Camera-based QR code scanning for parent verification
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { teacherApi } from '@/lib/api/teacher';
import { QrCode, X, CheckCircle, XCircle, Camera, CameraOff } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

interface QRCodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified?: (parentData: any) => void;
}

export function QRCodeScanner({ isOpen, onClose, onVerified }: QRCodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { showToast } = useToast();

  // QR Code scanning using HTML5 QR Code library or manual input
  const startScanning = async () => {
    try {
      setError(null);
      setIsScanning(true);

      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }, // Use back camera on mobile
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      // Note: For production, integrate with a QR code scanning library like:
      // - html5-qrcode (https://github.com/mebjas/html5-qrcode)
      // - jsQR (https://github.com/cozmo/jsQR)
      // For now, we'll provide manual input option
    } catch (err: any) {
      console.error('Error accessing camera:', err);
      setError('Unable to access camera. Please use manual input.');
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  };

  const handleManualInput = () => {
    const qrCodeData = prompt('Enter QR code data:');
    if (qrCodeData) {
      handleVerifyQR(qrCodeData);
    }
  };

  const handleVerifyQR = async (qrCodeData: string) => {
    try {
      setIsVerifying(true);
      setError(null);

      // Get user's current location if available
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
      } catch (geoError) {
        console.warn('Could not get location:', geoError);
      }

      const response = await teacherApi.verifyParentByQR({
        qrCodeData,
        location,
      });

      if (response.success && response.data) {
        setScanResult(response.data);
        showToast('Parent verified successfully!', 'success');
        if (onVerified) {
          onVerified(response.data);
        }
      } else {
        setError(response.message || 'Failed to verify QR code');
        showToast('Failed to verify QR code', 'error');
      }
    } catch (err: any) {
      console.error('Error verifying QR code:', err);
      setError(err.message || 'Failed to verify QR code');
      showToast('Failed to verify QR code', 'error');
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      stopScanning();
      setScanResult(null);
      setError(null);
    }
    return () => {
      stopScanning();
    };
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Scan Parent QR Code">
      <div className="space-y-4">
        {!scanResult ? (
          <>
            <div className="relative bg-black rounded-lg overflow-hidden" style={{ minHeight: '300px' }}>
              {isScanning ? (
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  playsInline
                  muted
                />
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-400">
                  <div className="text-center">
                    <Camera className="w-16 h-16 mx-auto mb-4" />
                    <p>Camera not active</p>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-2">
              {!isScanning ? (
                <Button onClick={startScanning} className="flex-1">
                  <Camera className="w-4 h-4 mr-2" />
                  Start Camera
                </Button>
              ) : (
                <Button onClick={stopScanning} variant="outline" className="flex-1">
                  <CameraOff className="w-4 h-4 mr-2" />
                  Stop Camera
                </Button>
              )}
              <Button onClick={handleManualInput} variant="outline" className="flex-1">
                <QrCode className="w-4 h-4 mr-2" />
                Manual Input
              </Button>
            </div>

            {isVerifying && (
              <div className="text-center text-gray-500">Verifying QR code...</div>
            )}

            <div className="text-sm text-gray-500 text-center">
              <p>Point your camera at the parent's QR code</p>
              <p className="mt-1">Or use manual input if camera is unavailable</p>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-800 mb-2">
                <CheckCircle className="w-5 h-5" />
                <h3 className="font-semibold">Parent Verified Successfully!</h3>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <h4 className="font-semibold mb-1">Parent Information</h4>
                <p className="text-sm text-gray-600">
                  <strong>Name:</strong> {scanResult.parent?.name}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Email:</strong> {scanResult.parent?.email}
                </p>
                {scanResult.parent?.phone && (
                  <p className="text-sm text-gray-600">
                    <strong>Phone:</strong> {scanResult.parent.phone}
                  </p>
                )}
              </div>

              <div>
                <h4 className="font-semibold mb-1">Student Information</h4>
                <p className="text-sm text-gray-600">
                  <strong>Name:</strong> {scanResult.student?.name}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Grade:</strong> {scanResult.student?.grade} - {scanResult.student?.section}
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-1">Relationship</h4>
                <p className="text-sm text-gray-600">
                  <strong>Type:</strong> {scanResult.relationship?.relationship}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Status:</strong>{' '}
                  {scanResult.verified ? (
                    <span className="text-green-600">Verified</span>
                  ) : (
                    <span className="text-yellow-600">Not Verified</span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={onClose} className="flex-1">
                Close
              </Button>
              <Button
                onClick={() => {
                  setScanResult(null);
                  setError(null);
                }}
                variant="outline"
                className="flex-1"
              >
                Scan Another
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

