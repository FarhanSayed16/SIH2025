/**
 * Devices page - Enhanced IoT Device Monitoring Dashboard
 * WB7 / WD16 honesty: registration ≠ health; sample vs contact time
 */

'use client';

import { AppShell } from '@/components/layout/app-shell';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';
import { devicesApi, Device, DeviceHealth, HistoricalSensorData } from '@/lib/api/devices';
import {
  registrationLabel,
  healthLabel,
  formatAxisValue,
  resolveSampleVsContact,
} from '@/lib/api/wb7-honesty';
import { getInstitutionId } from '@/lib/utils/institution';
import { socketService, SocketEvent } from '@/lib/services/socket-service';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export default function DevicesPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [devices, setDevices] = useState<Device[]>([]);
  const [healthData, setHealthData] = useState<DeviceHealth[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [historicalData, setHistoricalData] = useState<HistoricalSensorData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'list' | 'monitoring' | 'details'>('list');
  const historyDeviceRef = useRef<string | null>(null);
  const selectedDeviceRef = useRef<Device | null>(null);

  useEffect(() => {
    selectedDeviceRef.current = selectedDevice;
  }, [selectedDevice]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    loadAll();

    socketService.on('TELEMETRY_UPDATE' as SocketEvent, handleTelemetryUpdate);
    socketService.on('DEVICE_ALERT' as SocketEvent, handleDeviceAlert);

    return () => {
      socketService.off('TELEMETRY_UPDATE', handleTelemetryUpdate);
      socketService.off('DEVICE_ALERT', handleDeviceAlert);
    };
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (selectedDevice) {
      setHistoricalData(null);
      loadHistoricalData(selectedDevice.deviceId);
    } else {
      historyDeviceRef.current = null;
      setHistoricalData(null);
    }
  }, [selectedDevice?.deviceId]);

  const handleTelemetryUpdate = (data: any) => {
    loadHealthMonitoring();
    const current = selectedDeviceRef.current;
    if (current && data?.deviceId === current.deviceId) {
      loadHistoricalData(current.deviceId);
    }
  };

  const handleDeviceAlert = () => {
    loadHealthMonitoring();
  };

  const institutionId = getInstitutionId(user?.institutionId) || undefined;

  const loadAll = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      await Promise.all([loadDevices(), loadHealthMonitoring()]);
    } catch (e: any) {
      setLoadError(e?.message || 'Failed to load devices');
    } finally {
      setIsLoading(false);
    }
  };

  const loadDevices = async () => {
    try {
      const response = await devicesApi.list(institutionId);
      if (response.success && response.data) {
        setDevices(response.data);
      } else {
        setDevices([]);
        setLoadError(response.message || 'Failed to load device registry');
      }
    } catch (error: any) {
      console.error('Error loading devices:', error);
      setDevices([]);
      setLoadError(error?.message || 'Failed to load devices');
      throw error;
    }
  };

  const loadHealthMonitoring = async () => {
    try {
      const response = await devicesApi.getHealthMonitoring(institutionId);
      if (response.success && response.data) {
        setHealthData(response.data.devices || []);
      }
    } catch (error) {
      console.error('Error loading health monitoring:', error);
    }
  };

  const loadHistoricalData = async (deviceId: string) => {
    historyDeviceRef.current = deviceId;
    try {
      const endDate = new Date().toISOString();
      const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const response = await devicesApi.getHistoricalData(deviceId, startDate, endDate, 'hour', 100);
      if (response.success && response.data && historyDeviceRef.current === deviceId) {
        setHistoricalData(response.data);
      }
    } catch (error) {
      console.error('Error loading historical data:', error);
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy':
        return 'bg-green-100 text-green-800';
      case 'offline':
        return 'bg-red-100 text-red-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRegistrationColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-gray-100 text-gray-800';
      case 'inactive':
      case 'offline':
        return 'bg-gray-100 text-gray-700';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const healthById = Object.fromEntries(healthData.map((h) => [h.deviceId, h]));

  const healthStats = loadError
    ? null
    : {
        total: healthData.length,
        healthy: healthData.filter((d) => d.health === 'healthy').length,
        warning: healthData.filter((d) => d.health === 'warning').length,
        offline: healthData.filter((d) => d.health === 'offline').length,
      };

  return (
    <AppShell title="Devices">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">IoT Device Monitoring</h1>
        <p className="text-gray-600">Monitor and manage IoT sensors in real-time</p>
      </div>

      <div className="flex gap-2 mb-6 border-b">
        <button
          onClick={() => setActiveView('list')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeView === 'list'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          All Devices
        </button>
        <button
          onClick={() => setActiveView('monitoring')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeView === 'monitoring'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Health Monitoring
        </button>
        {selectedDevice && (
          <button
            onClick={() => setActiveView('details')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeView === 'details'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {selectedDevice.deviceName || selectedDevice.deviceId}
          </button>
        )}
      </div>

      {loadError && (
        <Card className="p-4 mb-4 border border-red-200 bg-red-50">
          <p className="text-red-800 text-sm mb-2">{loadError}</p>
          <Button variant="outline" onClick={() => loadAll()}>
            Retry
          </Button>
        </Card>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {activeView === 'list' && (
            <DeviceListView
              devices={devices}
              healthById={healthById}
              getHealthColor={getHealthColor}
              getRegistrationColor={getRegistrationColor}
              onDeviceSelect={(device) => {
                setSelectedDevice(device);
                setActiveView('details');
              }}
            />
          )}

          {activeView === 'monitoring' && (
            <HealthMonitoringView
              healthData={healthData}
              healthStats={healthStats}
              getHealthColor={getHealthColor}
              onDeviceSelect={(device) => {
                const fullDevice = devices.find((d) => d.deviceId === device.deviceId);
                if (fullDevice) {
                  setSelectedDevice(fullDevice);
                  setActiveView('details');
                }
              }}
            />
          )}

          {activeView === 'details' && selectedDevice && (
            <DeviceDetailsView
              device={selectedDevice}
              health={healthById[selectedDevice.deviceId]}
              historicalData={historicalData}
              onBack={() => {
                setSelectedDevice(null);
                setActiveView('list');
              }}
            />
          )}
        </>
      )}
    </AppShell>
  );
}

function DeviceListView({
  devices,
  healthById,
  getHealthColor,
  getRegistrationColor,
  onDeviceSelect,
}: {
  devices: Device[];
  healthById: Record<string, DeviceHealth>;
  getHealthColor: (health: string) => string;
  getRegistrationColor: (status: string) => string;
  onDeviceSelect: (device: Device) => void;
}) {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-2">Devices ({devices.length})</h2>
        <p className="text-sm text-gray-500 mb-4">
          Registration status is not online health. Health comes from recent telemetry when available.
        </p>
        {devices.length === 0 ? (
          <p className="text-gray-500">No devices registered</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold">Device</th>
                  <th className="text-left py-3 px-4 font-semibold">Type</th>
                  <th className="text-left py-3 px-4 font-semibold">Registration</th>
                  <th className="text-left py-3 px-4 font-semibold">Health</th>
                  <th className="text-left py-3 px-4 font-semibold">Last contact</th>
                  <th className="text-left py-3 px-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {devices.map((device) => {
                  const health = healthById[device.deviceId];
                  const times = resolveSampleVsContact({
                    sampleTimestamp: health?.sampleTimestamp,
                    receivedAt: health?.receivedAt,
                    lastSeen: health?.lastContact || health?.lastSeen || device.lastSeen,
                  });
                  return (
                    <tr key={device._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">{device.deviceName || device.deviceId}</td>
                      <td className="py-3 px-4">{device.deviceType}</td>
                      <td className="py-3 px-4">
                        <span className={`text-xs px-2 py-1 rounded ${getRegistrationColor(device.status)}`}>
                          {registrationLabel(device.status)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {health ? (
                          <span className={`text-xs px-2 py-1 rounded ${getHealthColor(health.health)}`}>
                            {healthLabel(health.health)}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-500">{healthLabel(null)}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{times.contactLabel}</td>
                      <td className="py-3 px-4">
                        <Button onClick={() => onDeviceSelect(device)} className="text-sm" variant="outline">
                          View Details
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function HealthMonitoringView({
  healthData,
  healthStats,
  getHealthColor,
  onDeviceSelect,
}: {
  healthData: DeviceHealth[];
  healthStats: { total: number; healthy: number; warning: number; offline: number } | null;
  getHealthColor: (health: string) => string;
  onDeviceSelect: (device: DeviceHealth) => void;
}) {
  if (!healthStats) {
    return (
      <Card className="p-6">
        <p className="text-gray-600">Health metrics unavailable — fix the load error above and retry.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-gray-600">Total Devices</div>
          <div className="text-2xl font-bold mt-2">{healthStats.total}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Healthy</div>
          <div className="text-2xl font-bold mt-2 text-green-600">{healthStats.healthy}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Warning</div>
          <div className="text-2xl font-bold mt-2 text-yellow-600">{healthStats.warning}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Offline</div>
          <div className="text-2xl font-bold mt-2 text-red-600">{healthStats.offline}</div>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Device Health Status</h2>
        {healthData.length === 0 ? (
          <p className="text-gray-500">No health rows returned for this institution.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold">Device</th>
                  <th className="text-left py-3 px-4 font-semibold">Type</th>
                  <th className="text-left py-3 px-4 font-semibold">Health</th>
                  <th className="text-left py-3 px-4 font-semibold">Last contact</th>
                  <th className="text-left py-3 px-4 font-semibold">Sample time</th>
                  <th className="text-left py-3 px-4 font-semibold">Battery</th>
                  <th className="text-left py-3 px-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {healthData.map((device) => {
                  const times = resolveSampleVsContact({
                    sampleTimestamp: device.sampleTimestamp,
                    receivedAt: device.receivedAt,
                    lastSeen: device.lastContact || device.lastSeen,
                  });
                  return (
                    <tr key={device.deviceId} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">{device.deviceName || device.deviceId}</td>
                      <td className="py-3 px-4">{device.deviceType}</td>
                      <td className="py-3 px-4">
                        <span className={`text-xs px-2 py-1 rounded ${getHealthColor(device.health)}`}>
                          {healthLabel(device.health)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{times.contactLabel}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{times.sampleLabel}</td>
                      <td className="py-3 px-4 text-sm">
                        {device.batteryLevel != null && Number.isFinite(Number(device.batteryLevel))
                          ? `${device.batteryLevel}%`
                          : 'Unavailable'}
                      </td>
                      <td className="py-3 px-4">
                        <Button onClick={() => onDeviceSelect(device)} className="text-sm" variant="outline">
                          View
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function DeviceDetailsView({
  device,
  health,
  historicalData,
  onBack,
}: {
  device: Device;
  health?: DeviceHealth;
  historicalData: HistoricalSensorData | null;
  onBack: () => void;
}) {
  const [latestTelemetry, setLatestTelemetry] = useState<any>(null);

  useEffect(() => {
    setLatestTelemetry(null);
    const handleTelemetry = (data: any) => {
      if (data.deviceId === device.deviceId && data.readings) {
        setLatestTelemetry(data.readings);
      }
    };

    socketService.on('TELEMETRY_UPDATE' as SocketEvent, handleTelemetry);

    return () => {
      socketService.off('TELEMETRY_UPDATE' as SocketEvent, handleTelemetry);
    };
  }, [device.deviceId]);

  const isMultiSensor = device.deviceType === 'multi-sensor';
  const times = resolveSampleVsContact({
    sampleTimestamp: health?.sampleTimestamp,
    receivedAt: health?.receivedAt,
    lastSeen: health?.lastContact || health?.lastSeen || device.lastSeen,
  });

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">{device.deviceName || device.deviceId}</h2>
            <p className="text-gray-600">{device.deviceType}</p>
          </div>
          <Button onClick={onBack} variant="outline">
            Back
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          <div>
            <div className="text-sm text-gray-600">Registration</div>
            <div className="text-lg font-semibold">{registrationLabel(device.status)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Health</div>
            <div className="text-lg font-semibold">{healthLabel(health?.health)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Last contact</div>
            <div className="text-lg font-semibold">{times.contactLabel}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Sample time</div>
            <div className="text-lg font-semibold">{times.sampleLabel}</div>
          </div>
        </div>
        <div className="mt-3 text-sm text-gray-500">Room: {device.room || 'Unavailable'}</div>
      </Card>

      {isMultiSensor && latestTelemetry && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Real-Time Sensor Readings</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {latestTelemetry.flame !== undefined && (
              <div
                className={`p-4 rounded-lg border-2 ${
                  latestTelemetry.flame === true
                    ? 'border-red-500 bg-red-50'
                    : latestTelemetry.flame === false
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-300 bg-gray-50'
                }`}
              >
                <div className="font-semibold mb-2">Fire Sensor</div>
                <div
                  className={`text-xl font-bold ${
                    latestTelemetry.flame === true
                      ? 'text-red-600'
                      : latestTelemetry.flame === false
                      ? 'text-green-600'
                      : 'text-gray-700'
                  }`}
                >
                  {latestTelemetry.flame === true
                    ? 'Flame detected'
                    : latestTelemetry.flame === false
                    ? 'No flame (boolean false)'
                    : 'Reading unavailable'}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  Boolean only — no invented “No Fire” from missing data
                </div>
              </div>
            )}

            {latestTelemetry.water !== undefined && (
              <div className="p-4 rounded-lg border-2 border-gray-300 bg-gray-50">
                <div className="font-semibold mb-2">Water Level</div>
                <div className="text-xl font-bold text-blue-600">{latestTelemetry.water}</div>
                <div className="text-sm text-gray-500 mt-1">Raw telemetry — no client flood threshold applied</div>
              </div>
            )}

            {latestTelemetry.magnitude !== undefined && (
              <div className="p-4 rounded-lg border-2 border-gray-300 bg-gray-50">
                <div className="font-semibold mb-2">Vibration</div>
                <div className="text-xl font-bold text-gray-700">
                  {Number.isFinite(Number(latestTelemetry.magnitude))
                    ? `${Number(latestTelemetry.magnitude).toFixed(2)} m/s²`
                    : 'Unavailable'}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  Raw telemetry — no client earthquake threshold applied
                </div>
              </div>
            )}

            {latestTelemetry.acceleration && (
              <div className="p-4 rounded-lg border-2 border-gray-200 bg-gray-50 col-span-full">
                <div className="font-semibold mb-2">Acceleration</div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">X</div>
                    <div className="text-lg font-bold">{formatAxisValue(latestTelemetry.acceleration.x)} m/s²</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Y</div>
                    <div className="text-lg font-bold">{formatAxisValue(latestTelemetry.acceleration.y)} m/s²</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Z</div>
                    <div className="text-lg font-bold">{formatAxisValue(latestTelemetry.acceleration.z)} m/s²</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {historicalData && historicalData.timeSeries && historicalData.timeSeries.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Historical Sensor Data (Last 24 Hours)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={historicalData.timeSeries}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              {historicalData.timeSeries.some((d: any) => d.avgFlame !== undefined) && (
                <Line yAxisId="left" type="monotone" dataKey="avgFlame" stroke="#ef4444" name="Fire Detected" strokeWidth={2} />
              )}
              {historicalData.timeSeries.some((d: any) => d.avgWater !== undefined) && (
                <Line yAxisId="right" type="monotone" dataKey="avgWater" stroke="#3b82f6" name="Water Level" strokeWidth={2} />
              )}
              {historicalData.timeSeries.some((d: any) => d.avgMagnitude !== undefined) && (
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="avgMagnitude"
                  stroke="#f59e0b"
                  name="Vibration (m/s²)"
                  strokeWidth={2}
                />
              )}
              {historicalData.timeSeries.some(
                (d) => d.avgTemperature !== undefined && d.avgTemperature !== null
              ) && (
                <Line yAxisId="left" type="monotone" dataKey="avgTemperature" stroke="#8884d8" name="Avg Temperature (°C)" />
              )}
              {historicalData.timeSeries.some((d) => d.avgSmoke !== undefined && d.avgSmoke !== null) && (
                <Line yAxisId="right" type="monotone" dataKey="avgSmoke" stroke="#82ca9d" name="Avg Smoke (PPM)" />
              )}
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {historicalData && historicalData.statistics && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-gray-600">Total Readings</div>
              <div className="text-2xl font-bold">{historicalData.statistics.count}</div>
            </div>
            {historicalData.statistics.avgTemperature !== undefined &&
              historicalData.statistics.avgTemperature !== null && (
                <div>
                  <div className="text-sm text-gray-600">Avg Temperature</div>
                  <div className="text-2xl font-bold">
                    {Number.isFinite(Number(historicalData.statistics.avgTemperature))
                      ? `${Math.round(Number(historicalData.statistics.avgTemperature))}°C`
                      : 'Unavailable'}
                  </div>
                </div>
              )}
            {historicalData.statistics.thresholdBreaches != null &&
              Number(historicalData.statistics.thresholdBreaches) > 0 && (
                <div>
                  <div className="text-sm text-gray-600">Threshold Breaches</div>
                  <div className="text-2xl font-bold text-red-600">
                    {historicalData.statistics.thresholdBreaches}
                  </div>
                </div>
              )}
          </div>
        </Card>
      )}
    </div>
  );
}
