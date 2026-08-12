/**
 * Phase 201: IoT Alert Toast Component
 * Shows toast notification for IoT device alerts
 */

'use client';

import { useToast } from '@/components/ui/toast';

interface IoTAlertData {
  deviceId: string;
  alertType: string;
  deviceName?: string;
  severity?: string;
  sensorData?: any;
  timestamp?: string;
}

export function useIoTAlertToast() {
  const { showToast } = useToast();

  const showIoTAlert = (alertData: IoTAlertData) => {
    const alertType = alertData.alertType?.toUpperCase() || 'ALERT';
    const deviceName = alertData.deviceName || alertData.deviceId || 'Unknown Device';
    const severity = alertData.severity?.toUpperCase() || 'HIGH';

    // Determine toast type based on severity
    let toastType: 'success' | 'error' | 'warning' | 'info' = 'error';
    if (severity === 'CRITICAL' || alertType === 'FIRE') {
      toastType = 'error';
    } else if (severity === 'HIGH') {
      toastType = 'warning';
    } else {
      toastType = 'info';
    }

    // Build message
    let message = '';
    if (alertType === 'FIRE') {
      message = `🔥 Fire detected at ${deviceName}`;
    } else if (alertType === 'FLOOD') {
      const waterLevel = alertData.sensorData?.water;
      message = `🌊 Flood alert at ${deviceName}${waterLevel ? ` (Level: ${waterLevel})` : ''}`;
    } else if (alertType === 'EARTHQUAKE') {
      const magnitude = alertData.sensorData?.magnitude;
      message = `⚠️ Earthquake detected at ${deviceName}${magnitude ? ` (${magnitude.toFixed(2)}G)` : ''}`;
    } else {
      message = `⚠️ Alert from ${deviceName}`;
    }

    showToast(message, toastType, 10000); // 10 seconds for alerts
  };

  return { showIoTAlert };
}

