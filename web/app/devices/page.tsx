/**
 * Devices page - Enhanced IoT Device Monitoring Dashboard
 * Phase 3.4.2
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';
import { devicesApi, Device, DeviceHealth, HistoricalSensorData } from '@/lib/api/devices';
import { socketService, SocketEvent } from '@/lib/services/socket-service';
import { Card } from '@/components/ui/card';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { Button } from '@/components/ui/button';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export default function DevicesPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [devices, setDevices] = useState<Device[]>([]);
  const [healthData, setHealthData] = useState<DeviceHealth[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [historicalData, setHistoricalData] = useState<HistoricalSensorData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeView, setActiveView] = useState<'list' | 'monitoring' | 'details'>('list');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    loadDevices();
    loadHealthMonitoring();

    // Setup Socket.io listeners for real-time updates
    socketService.on('TELEMETRY_UPDATE' as SocketEvent, handleTelemetryUpdate);
    socketService.on('DEVICE_ALERT' as SocketEvent, handleDeviceAlert);

    return () => {
      socketService.off('TELEMETRY_UPDATE', handleTelemetryUpdate);
      socketService.off('DEVICE_ALERT', handleDeviceAlert);
    };
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (selectedDevice) {
      loadHistoricalData(selectedDevice.deviceId);
    }
  }, [selectedDevice]);

  const handleTelemetryUpdate = (data: any) => {
    // Refresh device list when telemetry updates
    loadDevices();
    loadHealthMonitoring();
  };

  const handleDeviceAlert = (data: any) => {
    // Show alert notification
    console.log('Device alert:', data);
    // Refresh data
    loadHealthMonitoring();
  };

  const loadDevices = async () => {
    try {
      const response = await devicesApi.list(user?.institutionId || undefined);
      if (response.success && response.data) {
        setDevices(response.data);
      }
    } catch (error) {
      console.error('Error loading devices:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadHealthMonitoring = async () => {
    try {
      const response = await devicesApi.getHealthMonitoring(user?.institutionId || undefined);
      if (response.success && response.data) {
        setHealthData(response.data.devices || []);
      }
    } catch (error) {
      console.error('Error loading health monitoring:', error);
    }
  };

  const loadHistoricalData = async (deviceId: string) => {
    try {
      const endDate = new Date().toISOString();
      const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // Last 24 hours

      const response = await devicesApi.getHistoricalData(deviceId, startDate, endDate, 'hour', 100);
      if (response.success && response.data) {
        setHistoricalData(response.data);
      }
    } catch (error) {
      console.error('Error loading historical data:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'healthy':
        return 'bg-green-100 text-green-800';
      case 'inactive':
      case 'offline':
        return 'bg-red-100 text-red-800';
      case 'maintenance':
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter IoT sensor devices (Phase 201: Include multi-sensor)
  const sensorDevices = devices.filter(d => 
    d.deviceType?.includes('sensor') || 
    d.deviceType === 'multi-sensor' ||
    d.deviceType === 'panic-button' || 
    d.deviceType === 'siren'
  );

  // Aggregate health statistics
  const healthStats = {
    total: healthData.length,
    healthy: healthData.filter(d => d.health === 'healthy').length,
    warning: healthData.filter(d => d.health === 'warning').length,
    offline: healthData.filter(d => d.health === 'offline').length
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">IoT Device Monitoring</h1>
            <p className="text-gray-600">Monitor and manage IoT sensors in real-time</p>
          </div>

          {/* View Tabs */}
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

          {/* Content */}
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {activeView === 'list' && (
                <DeviceListView 
                  devices={devices}
                  sensorDevices={sensorDevices}
                  getStatusColor={getStatusColor}
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
                  getStatusColor={getStatusColor}
                  onDeviceSelect={(device) => {
                    const fullDevice = devices.find(d => d.deviceId === device.deviceId);
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
                  historicalData={historicalData}
                  onBack={() => {
                    setSelectedDevice(null);
                    setActiveView('list');
                  }}
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

// Device List View
function DeviceListView({ 
  devices, 
  sensorDevices, 
  getStatusColor, 
  onDeviceSelect 
}: { 
  devices: Device[];
  sensorDevices: Device[];
  getStatusColor: (status: string) => string;
  onDeviceSelect: (device: Device) => void;
}) {
  return (
    <div className="space-y-6">
      {/* IoT Sensors Section */}
      {sensorDevices.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">IoT Sensors ({sensorDevices.length})</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold">Device Name</th>
                  <th className="text-left py-3 px-4 font-semibold">Type</th>
                  <th className="text-left py-3 px-4 font-semibold">Status</th>
                  <th className="text-left py-3 px-4 font-semibold">Last Seen</th>
                  <th className="text-left py-3 px-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sensorDevices.map((device) => (
                  <tr key={device._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">{device.deviceName || device.deviceId}</td>
                    <td className="py-3 px-4">{device.deviceType}</td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-1 rounded ${getStatusColor(device.status)}`}>
                        {device.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {device.lastSeen ? new Date(device.lastSeen).toLocaleString() : 'Never'}
                    </td>
                    <td className="py-3 px-4">
                      <Button
                        onClick={() => onDeviceSelect(device)}
                        className="text-sm"
                        variant="outline"
                      >
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* All Devices Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">All Devices ({devices.length})</h2>
        {devices.length === 0 ? (
          <p className="text-gray-500">No devices registered</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold">Device ID</th>
                  <th className="text-left py-3 px-4 font-semibold">Type</th>
                  <th className="text-left py-3 px-4 font-semibold">Status</th>
                  <th className="text-left py-3 px-4 font-semibold">Last Seen</th>
                </tr>
              </thead>
              <tbody>
                {devices.map((device) => (
                  <tr key={device._id} className="border-b border-gray-100">
                    <td className="py-3 px-4">{device.deviceId}</td>
                    <td className="py-3 px-4">{device.deviceType}</td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-1 rounded ${getStatusColor(device.status)}`}>
                        {device.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {device.lastSeen ? new Date(device.lastSeen).toLocaleString() : 'Never'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

// Health Monitoring View
function HealthMonitoringView({
  healthData,
  healthStats,
  getStatusColor,
  onDeviceSelect
}: {
  healthData: DeviceHealth[];
  healthStats: { total: number; healthy: number; warning: number; offline: number };
  getStatusColor: (status: string) => string;
  onDeviceSelect: (device: DeviceHealth) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Health Statistics */}
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

      {/* Device Health List */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Device Health Status</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold">Device</th>
                <th className="text-left py-3 px-4 font-semibold">Type</th>
                <th className="text-left py-3 px-4 font-semibold">Health</th>
                <th className="text-left py-3 px-4 font-semibold">Last Seen</th>
                <th className="text-left py-3 px-4 font-semibold">Battery</th>
                <th className="text-left py-3 px-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {healthData.map((device) => (
                <tr key={device.deviceId} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">{device.deviceName || device.deviceId}</td>
                  <td className="py-3 px-4">{device.deviceType}</td>
                  <td className="py-3 px-4">
                    <span className={`text-xs px-2 py-1 rounded ${getStatusColor(device.health)}`}>
                      {device.health}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {device.minutesSinceLastSeen < 1
                      ? 'Just now'
                      : `${device.minutesSinceLastSeen} min ago`}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {device.batteryLevel !== null && device.batteryLevel !== undefined
                      ? `${device.batteryLevel}%`
                      : 'N/A'}
                  </td>
                  <td className="py-3 px-4">
                    <Button
                      onClick={() => onDeviceSelect(device)}
                      className="text-sm"
                      variant="outline"
                    >
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// Device Details View
function DeviceDetailsView({
  device,
  historicalData,
  onBack
}: {
  device: Device;
  historicalData: HistoricalSensorData | null;
  onBack: () => void;
}) {
  const [latestTelemetry, setLatestTelemetry] = useState<any>(null);

  useEffect(() => {
    // Listen for real-time telemetry updates
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

  // Phase 201: Multi-sensor device support
  const isMultiSensor = device.deviceType === 'multi-sensor';

  return (
    <div className="space-y-6">
      {/* Device Info */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">{device.deviceName || device.deviceId}</h2>
            <p className="text-gray-600">{device.deviceType}</p>
          </div>
          <Button onClick={onBack} variant="outline">Back</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div>
            <div className="text-sm text-gray-600">Status</div>
            <div className="text-lg font-semibold">{device.status}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Last Seen</div>
            <div className="text-lg font-semibold">
              {device.lastSeen ? new Date(device.lastSeen).toLocaleString() : 'Never'}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Room</div>
            <div className="text-lg font-semibold">{device.room || 'N/A'}</div>
          </div>
        </div>
      </Card>

      {/* Phase 201: Real-time Sensor Readings for Multi-Sensor Devices */}
      {isMultiSensor && latestTelemetry && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Real-Time Sensor Readings</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Fire Sensor */}
            {latestTelemetry.flame !== undefined && (
              <div className={`p-4 rounded-lg border-2 ${
                latestTelemetry.flame ? 'border-red-500 bg-red-50' : 'border-green-500 bg-green-50'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🔥</span>
                  <span className="font-semibold">Fire Sensor</span>
                </div>
                <div className={`text-xl font-bold ${
                  latestTelemetry.flame ? 'text-red-600' : 'text-green-600'
                }`}>
                  {latestTelemetry.flame ? 'Fire Detected!' : 'No Fire'}
                </div>
              </div>
            )}

            {/* Water Level */}
            {latestTelemetry.water !== undefined && (
              <div className={`p-4 rounded-lg border-2 ${
                latestTelemetry.water > 2000 ? 'border-orange-500 bg-orange-50' : 'border-blue-500 bg-blue-50'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🌊</span>
                  <span className="font-semibold">Water Level</span>
                </div>
                <div className={`text-xl font-bold ${
                  latestTelemetry.water > 2000 ? 'text-orange-600' : 'text-blue-600'
                }`}>
                  {latestTelemetry.water}
                </div>
                {latestTelemetry.water > 2000 && (
                  <div className="text-sm text-orange-600 mt-1">⚠️ Flood Alert</div>
                )}
              </div>
            )}

            {/* Earthquake/Vibration */}
            {latestTelemetry.magnitude !== undefined && (
              <div className={`p-4 rounded-lg border-2 ${
                latestTelemetry.magnitude > 2.5 ? 'border-orange-500 bg-orange-50' : 'border-gray-500 bg-gray-50'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">⚠️</span>
                  <span className="font-semibold">Vibration</span>
                </div>
                <div className={`text-xl font-bold ${
                  latestTelemetry.magnitude > 2.5 ? 'text-orange-600' : 'text-gray-600'
                }`}>
                  {latestTelemetry.magnitude.toFixed(2)} m/s²
                </div>
                {latestTelemetry.magnitude > 2.5 && (
                  <div className="text-sm text-orange-600 mt-1">⚠️ Earthquake Alert</div>
                )}
              </div>
            )}

            {/* Acceleration */}
            {latestTelemetry.acceleration && (
              <div className="p-4 rounded-lg border-2 border-gray-200 bg-gray-50 col-span-full">
                <div className="font-semibold mb-2">Acceleration</div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">X</div>
                    <div className="text-lg font-bold">{latestTelemetry.acceleration.x?.toFixed(2) || '0.00'} m/s²</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Y</div>
                    <div className="text-lg font-bold">{latestTelemetry.acceleration.y?.toFixed(2) || '0.00'} m/s²</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Z</div>
                    <div className="text-lg font-bold">{latestTelemetry.acceleration.z?.toFixed(2) || '0.00'} m/s²</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Historical Data Charts */}
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
              {/* Phase 201: Multi-sensor charts */}
              {historicalData.timeSeries.some((d: any) => d.avgFlame !== undefined) && (
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="avgFlame"
                  stroke="#ef4444"
                  name="Fire Detected"
                  strokeWidth={2}
                />
              )}
              {historicalData.timeSeries.some((d: any) => d.avgWater !== undefined) && (
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="avgWater"
                  stroke="#3b82f6"
                  name="Water Level"
                  strokeWidth={2}
                />
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
              {historicalData.timeSeries.some(d => d.avgTemperature) && (
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="avgTemperature"
                  stroke="#8884d8"
                  name="Avg Temperature (°C)"
                />
              )}
              {historicalData.timeSeries.some(d => d.avgSmoke) && (
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="avgSmoke"
                  stroke="#82ca9d"
                  name="Avg Smoke (PPM)"
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Statistics */}
      {historicalData && historicalData.statistics && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-gray-600">Total Readings</div>
              <div className="text-2xl font-bold">{historicalData.statistics.count}</div>
            </div>
            {historicalData.statistics.avgTemperature && (
              <div>
                <div className="text-sm text-gray-600">Avg Temperature</div>
                <div className="text-2xl font-bold">
                  {Math.round(historicalData.statistics.avgTemperature)}°C
                </div>
              </div>
            )}
            {historicalData.statistics.thresholdBreaches > 0 && (
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
