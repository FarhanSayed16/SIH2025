/**
 * Phase 201: IoT Alert Modal Component
 * Shows modal dialog for critical IoT device alerts
 */

'use client';

import { useEffect } from 'react';
import { X, AlertTriangle, Flame, Droplets, MapPin, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface IoTAlertData {
  deviceId: string;
  alertId?: string;
  autoDismiss?: boolean;
  alertType: string;
  deviceName?: string;
  deviceType?: string;
  room?: string;
  severity?: string;
  sensorData?: any;
  timestamp?: string;
  readings?: any;
}

interface IoTAlertModalProps {
  alertData: IoTAlertData | null;
  isOpen: boolean;
  onClose: () => void;
  onViewDevice?: (deviceId: string) => void;
}

export function IoTAlertModal({
  alertData,
  isOpen,
  onClose,
  onViewDevice,
}: IoTAlertModalProps) {
  const alertType = alertData?.alertType?.toUpperCase() || 'ALERT';
  const deviceName = alertData?.deviceName || alertData?.deviceId || 'Unknown Device';
  const severity = alertData?.severity?.toUpperCase() || 'HIGH';
  const isCritical = severity === 'CRITICAL' || alertType === 'FIRE';
  const autoDismiss = alertData?.autoDismiss === true;

  // Auto-dismiss after 30s for non-critical alerts
  useEffect(() => {
    if (isOpen && autoDismiss && !isCritical) {
      const timer = setTimeout(() => {
        onClose();
      }, 30000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoDismiss, isCritical, onClose]);

  if (!isOpen || !alertData) return null;

  const getAlertConfig = () => {
    switch (alertType) {
      case 'FIRE':
        return {
          icon: Flame,
          title: '🔥 Fire Detected!',
          color: 'red',
          bgGradient: 'from-red-900 via-red-700 to-red-600',
        };
      case 'FLOOD':
        return {
          icon: Droplets,
          title: '🌊 Flood Alert!',
          color: 'blue',
          bgGradient: 'from-blue-900 via-blue-700 to-blue-600',
        };
      case 'EARTHQUAKE':
        return {
          icon: AlertTriangle,
          title: '⚠️ Earthquake Detected!',
          color: 'orange',
          bgGradient: 'from-orange-900 via-orange-700 to-orange-600',
        };
      default:
        return {
          icon: AlertTriangle,
          title: '⚠️ Device Alert',
          color: 'red',
          bgGradient: 'from-red-900 via-red-700 to-red-600',
        };
    }
  };

  const config = getAlertConfig();
  const IconComponent = config.icon;

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return 'Just now';
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffSec = Math.floor(diffMs / 1000);
      
      if (diffSec < 60) return 'Just now';
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)} minute${Math.floor(diffSec / 60) > 1 ? 's' : ''} ago`;
      return date.toLocaleTimeString();
    } catch {
      return 'Just now';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={!isCritical ? onClose : undefined}
    >
      <Card
        className={`w-full max-w-md mx-4 bg-gradient-to-br ${config.bgGradient} text-white border-0 shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-full">
                <IconComponent className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{config.title}</h2>
                <p className="text-white/80 text-sm">{deviceName}</p>
              </div>
            </div>
            {!isCritical && (
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            )}
          </div>

          {/* Device Info */}
          <div className="space-y-3 mb-6">
            {alertData.room && (
              <div className="flex items-center gap-2 text-white/90">
                <MapPin className="h-4 w-4" />
                <span>Location: {alertData.room}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-white/90">
              <Clock className="h-4 w-4" />
              <span>Detected: {formatTimestamp(alertData.timestamp)}</span>
            </div>
          </div>

          {/* Sensor Data */}
          {alertData.sensorData && (
            <div className="bg-white/20 rounded-lg p-4 mb-6">
              <h3 className="font-semibold mb-2">Sensor Data</h3>
              <div className="space-y-2 text-sm">
                {alertData.sensorData.flame !== undefined && (
                  <div>
                    <span className="font-medium">Flame: </span>
                    <span>{alertData.sensorData.flame ? 'Detected' : 'Clear'}</span>
                  </div>
                )}
                {alertData.sensorData.water !== undefined && (
                  <div>
                    <span className="font-medium">Water Level: </span>
                    <span>{alertData.sensorData.water}</span>
                  </div>
                )}
                {alertData.sensorData.magnitude !== undefined && (
                  <div>
                    <span className="font-medium">Magnitude: </span>
                    <span>{alertData.sensorData.magnitude.toFixed(2)} G</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            {!isCritical && (
              <Button
                onClick={onClose}
                variant="outline"
                className="flex-1 bg-white/20 text-white border-white/30 hover:bg-white/30"
              >
                Dismiss
              </Button>
            )}
            <Button
              onClick={() => {
                if (onViewDevice) {
                  onViewDevice(alertData.deviceId);
                }
                onClose();
              }}
              className={`flex-1 bg-white text-${config.color}-900 hover:bg-white/90`}
            >
              View Device
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

