'use client';

import { AppShell } from '@/components/layout/app-shell';

import { useEffect, useMemo, useState } from 'react';
import mapboxgl, { Map as MapboxMap, LngLatBoundsLike } from 'mapbox-gl';
import { useAuthStore } from '@/lib/store/auth-store';
import { apiClient } from '@/lib/api/client';
import { devicesApi } from '@/lib/api/devices';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Maximize, Eye, EyeOff } from 'lucide-react';
import { socketService, SocketEvent } from '@/lib/services/socket-service';
import { getInstitutionId } from '@/lib/utils/institution';
import {
  normalizeMapDataEnvelope,
  deviceHealthColor,
  type MapBlueprint,
} from '@/lib/api/parent-honesty';

type DeviceFeature = {
  id: string;
  name: string;
  type?: string;
  status?: string;
  coords?: { lng: number; lat: number };
  lastContact?: string | null;
};

export default function MapPage() {
  const { user, isAuthenticated, accessToken } = useAuthStore();
  const [map, setMap] = useState<MapboxMap | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [devices, setDevices] = useState<DeviceFeature[]>([]);
  const [blueprint, setBlueprint] = useState<MapBlueprint | null>(null);
  const [layerCounts, setLayerCounts] = useState({ equipment: 0, exits: 0, rooms: 0, hazards: 0 });
  const [hasCampusLayers, setHasCampusLayers] = useState(false);
  const [showBlueprint, setShowBlueprint] = useState(true);
  const [blueprintStatus, setBlueprintStatus] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);

  const mapToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  const schoolId = useMemo(() => getInstitutionId(user?.institutionId) ?? null, [user]);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      setError('Not authenticated');
      setLoading(false);
      return;
    }
    apiClient.setToken(accessToken);

    if (schoolId && accessToken) {
      const refreshOnEvent = () => refreshData();
      socketService.on('DEVICE_ALERT' as SocketEvent, refreshOnEvent);
      socketService.on('TELEMETRY_UPDATE' as SocketEvent, refreshOnEvent);
      return () => {
        socketService.off('DEVICE_ALERT' as SocketEvent, refreshOnEvent);
        socketService.off('TELEMETRY_UPDATE' as SocketEvent, refreshOnEvent);
      };
    }
  }, [isAuthenticated, accessToken, schoolId]);

  // Always try to load devices/layers even without Mapbox (list fallback)
  useEffect(() => {
    if (!isAuthenticated || !accessToken || !schoolId) return;
    loadDevicesAndLayers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, accessToken, schoolId]);

  useEffect(() => {
    if (!mapToken) {
      setLoading(false);
      return;
    }
    if (!schoolId) {
      setError('No institution on this account.');
      setLoading(false);
      return;
    }
    mapboxgl.accessToken = mapToken;
    const m = new mapboxgl.Map({
      container: 'map-container',
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [0, 20],
      zoom: 1.5,
    });
    m.addControl(new mapboxgl.NavigationControl(), 'top-right');
    m.on('load', () => {
      setMap(m);
      setLoading(false);
      refreshData(m);
    });
    return () => {
      m.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapToken, schoolId]);

  const loadDevicesAndLayers = async () => {
    if (!schoolId || !accessToken) return;
    try {
      const devicesRes = await devicesApi.getHealthMonitoring(schoolId);
      if (devicesRes.success && Array.isArray(devicesRes.data?.devices)) {
        const feats: DeviceFeature[] = devicesRes.data.devices.map((d: any) => ({
          id: d.deviceId || d._id,
          name: d.deviceName || d.deviceId,
          type: d.deviceType,
          status: d.health || d.healthStatus || d.status,
          coords: d.location?.coordinates
            ? { lng: d.location.coordinates[0], lat: d.location.coordinates[1] }
            : undefined,
          lastContact: d.lastContact || d.lastSeen || d.updatedAt || null,
        }));
        setDevices(feats);
      }

      const res = await apiClient.get(`/schools/${schoolId}/floor-plan/map-data`);
      if (res.success && res.data) {
        const normalized = normalizeMapDataEnvelope(res.data);
        setBlueprint(normalized.blueprint);
        setHasCampusLayers(normalized.hasCampusLayers);
        setLayerCounts({
          equipment: normalized.equipment.length,
          exits: normalized.exits.length,
          rooms: normalized.rooms.length,
          hazards: normalized.hazards.length,
        });
        if (!normalized.hasCampusLayers) {
          setBlueprintStatus('Detailed campus layers are unavailable');
        } else if (normalized.blueprint?.imageUrl || normalized.blueprint?.geojson) {
          setBlueprintStatus('Campus blueprint available');
        } else {
          setBlueprintStatus('Layer records present (no georeferenced blueprint image)');
        }
      } else {
        setHasCampusLayers(false);
        setBlueprintStatus('Detailed campus layers are unavailable');
      }
      setLastUpdatedAt(new Date().toISOString());
    } catch (err: any) {
      console.error('Map data load error:', err);
      setBlueprintStatus('Detailed campus layers are unavailable');
    }
  };

  const refreshData = async (m?: MapboxMap) => {
    if (!schoolId || !accessToken) return;
    const mapRef = m || map;
    setLoading(true);
    setError(null);
    try {
      await loadDevicesAndLayers();
      if (mapRef) {
        const withCoords = devices.filter((f) => f.coords);
        // Re-fetch for plot with fresh data
        const devicesRes = await devicesApi.getHealthMonitoring(schoolId);
        let feats: DeviceFeature[] = withCoords;
        if (devicesRes.success && Array.isArray(devicesRes.data?.devices)) {
          feats = devicesRes.data.devices
            .map((d: any) => ({
              id: d.deviceId || d._id,
              name: d.deviceName || d.deviceId,
              type: d.deviceType,
              status: d.health || d.healthStatus || d.status,
              coords: d.location?.coordinates
                ? { lng: d.location.coordinates[0], lat: d.location.coordinates[1] }
                : undefined,
              lastContact: d.lastContact || d.lastSeen || d.updatedAt || null,
            }))
            .filter((f: DeviceFeature) => !!f.coords);
          setDevices(
            devicesRes.data.devices.map((d: any) => ({
              id: d.deviceId || d._id,
              name: d.deviceName || d.deviceId,
              type: d.deviceType,
              status: d.health || d.healthStatus || d.status,
              coords: d.location?.coordinates
                ? { lng: d.location.coordinates[0], lat: d.location.coordinates[1] }
                : undefined,
              lastContact: d.lastContact || d.lastSeen || d.updatedAt || null,
            }))
          );
        }
        plotDevices(mapRef, feats);

        const res = await apiClient.get(`/schools/${schoolId}/floor-plan/map-data`);
        if (res.success && res.data) {
          const normalized = normalizeMapDataEnvelope(res.data);
          setBlueprint(normalized.blueprint);
          if (normalized.blueprint) {
            addBlueprintOverlay(mapRef, normalized.blueprint);
          } else {
            setBlueprintStatus('Detailed campus layers are unavailable');
          }
        }
      }
      setLastUpdatedAt(new Date().toISOString());
    } catch (err: any) {
      console.error('Map refresh error:', err);
      setError('Failed to load map data');
    } finally {
      setLoading(false);
    }
  };

  const addBlueprintOverlay = (mapRef: MapboxMap, bp: MapBlueprint) => {
    if (!bp) return;
    ['blueprint-image', 'blueprint-geojson', 'blueprint-fill', 'blueprint-line'].forEach((id) => {
      if (mapRef.getLayer(id)) mapRef.removeLayer(id);
      if (mapRef.getSource(id)) mapRef.removeSource(id);
    });

    if (!showBlueprint) return;

    if (bp.imageUrl && bp.bounds && bp.bounds.length === 4) {
      mapRef.addSource('blueprint-image', {
        type: 'image',
        url: bp.imageUrl,
        coordinates: [
          [bp.bounds[0], bp.bounds[3]],
          [bp.bounds[2], bp.bounds[3]],
          [bp.bounds[2], bp.bounds[1]],
          [bp.bounds[0], bp.bounds[1]],
        ],
      } as any);
      mapRef.addLayer({
        id: 'blueprint-image',
        type: 'raster',
        source: 'blueprint-image',
        paint: { 'raster-opacity': 0.65 },
      });
      fitToBounds(mapRef, bp.bounds as LngLatBoundsLike);
      setBlueprintStatus('Blueprint image overlay loaded');
    } else if (bp.geojson) {
      mapRef.addSource('blueprint-geojson', {
        type: 'geojson',
        data: bp.geojson,
      } as mapboxgl.AnySourceData);
      mapRef.addLayer({
        id: 'blueprint-fill',
        type: 'fill',
        source: 'blueprint-geojson',
        paint: { 'fill-color': '#0f766e', 'fill-opacity': 0.2 },
      });
      mapRef.addLayer({
        id: 'blueprint-line',
        type: 'line',
        source: 'blueprint-geojson',
        paint: { 'line-color': '#0f766e', 'line-width': 2 },
      });
      try {
        const b = new mapboxgl.LngLatBounds();
        const coords = (bp.geojson as any)?.features?.[0]?.geometry?.coordinates?.flat(2) || [];
        coords.forEach((c: any) => b.extend([c[0], c[1]]));
        if (!b.isEmpty()) mapRef.fitBounds(b, { padding: 40, duration: 800 });
      } catch {}
      setBlueprintStatus('Blueprint geojson overlay loaded');
    } else {
      setBlueprintStatus('Detailed campus layers are unavailable');
    }
  };

  const plotDevices = (mapRef: MapboxMap, feats: DeviceFeature[]) => {
    (mapRef as any)._deviceMarkers?.forEach((mk: any) => mk.remove());
    const markers: any[] = [];
    feats.forEach((f) => {
      if (!f.coords) return;
      const el = document.createElement('div');
      el.className = 'device-marker';
      el.style.width = '14px';
      el.style.height = '14px';
      el.style.borderRadius = '50%';
      el.style.background = deviceHealthColor(f.status);
      el.style.boxShadow = '0 0 6px rgba(0,0,0,0.25)';
      el.title = `${f.name} · ${f.status || 'unknown'}${
        f.lastContact ? ` · contact ${new Date(f.lastContact).toLocaleString()}` : ''
      }`;
      const mk = new mapboxgl.Marker(el).setLngLat([f.coords.lng, f.coords.lat]).addTo(mapRef);
      markers.push(mk);
    });
    (mapRef as any)._deviceMarkers = markers;

    if (feats.length > 0) {
      const b = new mapboxgl.LngLatBounds();
      feats.forEach((f) => f.coords && b.extend([f.coords.lng, f.coords.lat]));
      if (!b.isEmpty()) {
        mapRef.fitBounds(b, { padding: 60, duration: 800 });
      }
    }
  };

  const fitToBounds = (mapRef: MapboxMap, bounds: LngLatBoundsLike) => {
    try {
      mapRef.fitBounds(bounds, { padding: 40, duration: 800 });
    } catch (e) {
      console.warn('fitBounds failed', e);
    }
  };

  return (
    <AppShell title="Institution map">
      {!mapToken && (
        <div className="bg-amber-50 text-amber-900 px-4 py-2 text-sm">
          Interactive map provider is not configured. Detailed campus overlays cannot be shown on the
          map canvas. Device records still appear in the list below when available.
        </div>
      )}
      {error && <div className="bg-yellow-50 text-yellow-800 px-4 py-3 text-sm">{error}</div>}

      <div className="p-4 space-y-4">
        <Card className="p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Institution map</h1>
              <p className="text-sm text-gray-600 mt-1">
                {user?.institutionId && typeof user.institutionId === 'object' && (user.institutionId as any).name
                  ? (user.institutionId as any).name
                  : 'Your institution'}
                {lastUpdatedAt
                  ? ` · Last successful data update: ${new Date(lastUpdatedAt).toLocaleString()}`
                  : ''}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {blueprintStatus || 'Loading campus layers…'}
                {!hasCampusLayers ? ' · Institution location/layers not configured for overlay use.' : ''}
              </p>
              {hasCampusLayers && (
                <p className="text-xs text-gray-500 mt-1">
                  Legend counts — equipment {layerCounts.equipment}, exits {layerCounts.exits}, rooms{' '}
                  {layerCounts.rooms}, hazards {layerCounts.hazards}. Indoor routing remains unavailable
                  until independently verified.
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => refreshData()}>
                <RefreshCw size={16} className="mr-1" /> Refresh
              </Button>
              {mapToken && blueprint?.bounds && map && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fitToBounds(map, blueprint.bounds as LngLatBoundsLike)}
                  >
                    <Maximize size={16} className="mr-1" /> Fit blueprint
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowBlueprint((prev) => !prev);
                      if (map && blueprint) addBlueprintOverlay(map, blueprint);
                    }}
                  >
                    {showBlueprint ? (
                      <>
                        <EyeOff size={16} className="mr-1" /> Hide blueprint
                      </>
                    ) : (
                      <>
                        <Eye size={16} className="mr-1" /> Show blueprint
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
        </Card>

        <div className="relative h-[55vh] rounded-lg overflow-hidden border border-gray-200">
          {loading && mapToken && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70">
              <div className="animate-spin h-8 w-8 border-2 border-teal-700 border-t-transparent rounded-full" />
            </div>
          )}
          {!mapToken ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-center p-6 gap-3">
              <AlertTriangle className="text-slate-500" size={28} />
              <p className="text-sm text-slate-700 max-w-md">
                No operational campus basemap is shown here. A world overview is not your school campus.
                Use the device list below for authorized location records.
              </p>
            </div>
          ) : (
            <div id="map-container" className="w-full h-full" />
          )}
        </div>

        <Card className="p-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Devices (independent of map provider)</h2>
          {devices.length === 0 ? (
            <p className="text-sm text-gray-600">No device records returned for this institution.</p>
          ) : (
            <ul className="divide-y divide-gray-100 text-sm">
              {devices.map((d) => (
                <li key={d.id} className="py-2 flex flex-wrap justify-between gap-2">
                  <div>
                    <span className="font-medium text-gray-900">{d.name}</span>
                    {d.type ? <span className="text-gray-500"> · {d.type}</span> : null}
                    <div className="text-xs text-gray-500">ID: {d.id}</div>
                  </div>
                  <div className="text-right text-xs text-gray-600">
                    <div>Health: {d.status || 'unknown'}</div>
                    <div>
                      {d.coords
                        ? `${d.coords.lat.toFixed(5)}, ${d.coords.lng.toFixed(5)}`
                        : 'Location unknown'}
                    </div>
                    <div>
                      Last contact:{' '}
                      {d.lastContact ? new Date(d.lastContact).toLocaleString() : 'Not recorded'}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
