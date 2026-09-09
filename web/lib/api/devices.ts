/**
 * Devices API endpoints
 */

import { apiClient, ApiResponse } from './client';

export interface Device {
  _id: string;
  deviceId: string;
  deviceName?: string;
  schoolId?: string;
  institutionId?: string;
  deviceType: string;
  location?: {
    type: 'Point';
    coordinates: [number, number];
  };
  status: 'active' | 'inactive' | 'maintenance' | 'offline';
  lastSeen: string;
  createdAt: string;
  updatedAt: string;
  room?: string;
  configuration?: any;
}

export interface DeviceHealth {
  deviceId: string;
  deviceName: string;
  deviceType: string;
  status: string;
  health: 'healthy' | 'warning' | 'offline';
  lastSeen?: string | null;
  lastContact?: string | null;
  sampleTimestamp?: string | null;
  receivedAt?: string | null;
  minutesSinceLastSeen?: number | null;
  batteryLevel?: number | null;
  signalStrength?: number | null;
  location?: {
    type: 'Point';
    coordinates: [number, number];
  };
  room?: string;
}

export interface HealthMonitoring {
  totalDevices: number;
  healthy: number;
  warning: number;
  offline: number;
  devices: DeviceHealth[];
}

export interface HistoricalSensorData {
  timeSeries: Array<{
    timestamp: string;
    avgTemperature?: number;
    maxTemperature?: number;
    avgSmoke?: number;
    maxSmoke?: number;
    count: number;
  }>;
  statistics: {
    count: number;
    avgTemperature?: number;
    maxTemperature?: number;
    minTemperature?: number;
    avgSmoke?: number;
    maxSmoke?: number;
    thresholdBreaches: number;
  };
  recentReadings: Array<{
    _id: string;
    readings: any;
    timestamp: string;
    thresholdBreached: boolean;
  }>;
  totalReadings: number;
}

export const devicesApi = {
  list: async (institutionId?: string): Promise<ApiResponse<Device[]>> => {
    const query = institutionId ? `?institutionId=${institutionId}` : '';
    return apiClient.get<Device[]>(`/devices${query}`);
  },

  getById: async (id: string): Promise<ApiResponse<Device>> => {
    return apiClient.get<Device>(`/devices/${id}`);
  },

  // Phase 3.4.2: Enhanced IoT endpoints
  getHealthMonitoring: async (institutionId?: string): Promise<ApiResponse<HealthMonitoring>> => {
    const query = institutionId ? `?institutionId=${institutionId}` : '';
    return apiClient.get<HealthMonitoring>(`/devices/health/monitoring${query}`);
  },

  getHistoricalData: async (
    deviceId: string,
    startDate?: string,
    endDate?: string,
    interval?: string,
    limit?: number
  ): Promise<ApiResponse<HistoricalSensorData>> => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (interval) params.append('interval', interval);
    if (limit) params.append('limit', limit.toString());

    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get<HistoricalSensorData>(`/devices/${deviceId}/history${query}`);
  },
};

