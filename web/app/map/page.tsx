'use client';

import { useEffect, useMemo, useState } from 'react';
import mapboxgl, { Map as MapboxMap, LngLatBoundsLike, GeoJSONSourceRaw } from 'mapbox-gl';
import { useAuthStore } from '@/lib/store/auth-store';
import { apiClient } from '@/lib/api/client';
import { devicesApi } from '@/lib/api/devices';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Maximize, Eye, EyeOff } from 'lucide-react';
import { socketService, SocketEvent } from '@/lib/services/socket-service';

type DeviceFeature = {
  id: string;
  name: string;
  type?: string;
  status?: string;
  coords?: { lng: number; lat: number };
};

type BlueprintData = {
  imageUrl?: string;
  bounds?: [number, number, number, number]; // [west, south, east, north]
  geojson?: any;
};

// Optional fallback blueprint when API data is missing.
// Ensure the image exists at /public/blueprints/your.jpg
const fallbackBlueprint: BlueprintData = {
  imageUrl: '/blueprints/your.jpg',
  // Rough bounds around a small area; adjust to your real campus lat/lng.
  bounds: [77.2080, 28.6125, 77.2105, 28.6145],
};

export default function MapPage() {
  const { user, isAuthenticated, accessToken } = useAuthStore();
  const [map, setMap] = useState<MapboxMap | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [devices, setDevices] = useState<DeviceFeature[]>([]);
  const [blueprint, setBlueprint] = useState<BlueprintData | null>(null);
  const [showBlueprint, setShowBlueprint] = useState(true);
  const [blueprintStatus, setBlueprintStatus] = useState<string | null>(null);

  const mapToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  const schoolId = useMemo(() => {
    if (!user?.institutionId) return null;
    return typeof user.institutionId === 'string'
      ? user.institutionId
      : (user.institutionId as any)?._id || user.institutionId;
  }, [user]);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      setError('Not authenticated');
      setLoading(false);
      return;
    }
    apiClient.setToken(accessToken);

    // Connect socket for realtime map refresh
    if (schoolId && accessToken) {
      socketService.connect(schoolId, accessToken);
      const refreshOnEvent = () => refreshData();
      socketService.on('DEVICE_ALERT' as SocketEvent, refreshOnEvent);
      socketService.on('TELEMETRY_UPDATE' as SocketEvent, refreshOnEvent);
      return () => {
        socketService.off('DEVICE_ALERT' as SocketEvent, refreshOnEvent);
        socketService.off('TELEMETRY_UPDATE' as SocketEvent, refreshOnEvent);
        socketService.disconnect();
      };
    }
  }, [isAuthenticated, accessToken, schoolId]);

  useEffect(() => {
    if (!mapToken) {
      setLoading(false);
      return;
    }
    if (!schoolId) {
      setError('Missing school/institution id for map');
      setLoading(false);
      return;
    }
    mapboxgl.accessToken = mapToken;
    const m = new mapboxgl.Map({
      container: 'map-container',
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [77.2090, 28.6139], // default Delhi center
      zoom: 14,
    });
    m.addControl(new mapboxgl.NavigationControl(), 'top-right');
    m.on('load', () => {
      setMap(m);
      setLoading(false);
      // Attempt initial data load
      refreshData(m);
    });
    return () => {
      m.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapToken, schoolId]);

  const refreshData = async (m?: MapboxMap) => {
    if (!schoolId || !accessToken) return;
    const mapRef = m || map;
    if (!mapRef) return;
    setLoading(true);
    setError(null);
    try {
      // Devices
      const devicesRes = await devicesApi.getDeviceHealthMonitoring(schoolId);
      if (devicesRes.success && Array.isArray(devicesRes.data?.devices)) {
        const feats: DeviceFeature[] = devicesRes.data.devices
          .map((d: any) => ({
            id: d.deviceId || d._id,
            name: d.deviceName || d.deviceId,
            type: d.deviceType,
            status: d.healthStatus || d.status,
            coords: d.location?.coordinates
              ? { lng: d.location.coordinates[0], lat: d.location.coordinates[1] }
              : undefined,
          }))
          .filter((f: DeviceFeature) => !!f.coords);
        setDevices(feats);
        plotDevices(mapRef, feats);
      }
      // Blueprint
      await loadBlueprint(mapRef, schoolId);
    } catch (err: any) {
      console.error('Map refresh error:', err);
      setError('Failed to load map data');
    } finally {
      setLoading(false);
    }
  };

  const loadBlueprint = async (mapRef: MapboxMap, schoolId: string) => {
    try {
      const res = await apiClient.get(`/schools/${schoolId}/floor-plan/map-data`);
      if (res.data) {
        const bp: BlueprintData = res.data;
        setBlueprint(bp);
        addBlueprintOverlay(mapRef, bp);
        return;
      }
    } catch (err: any) {
      console.warn('No blueprint/map-data found for school', err?.message);
    }

    // Fallback to local blueprint image if present
    if (fallbackBlueprint.imageUrl) {
      setBlueprint(fallbackBlueprint);
      addBlueprintOverlay(mapRef, fallbackBlueprint);
      setBlueprintStatus('Using local blueprint image');
    }
  };

  const addBlueprintOverlay = (mapRef: MapboxMap, bp: BlueprintData) => {
    if (!bp) return;
    // Remove old sources/layers if any
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
          [bp.bounds[0], bp.bounds[3]], // nw
          [bp.bounds[2], bp.bounds[3]], // ne
          [bp.bounds[2], bp.bounds[1]], // se
          [bp.bounds[0], bp.bounds[1]], // sw
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
      } as GeoJSONSourceRaw);
      mapRef.addLayer({
        id: 'blueprint-fill',
        type: 'fill',
        source: 'blueprint-geojson',
        paint: { 'fill-color': '#2563eb', 'fill-opacity': 0.2 },
      });
      mapRef.addLayer({
        id: 'blueprint-line',
        type: 'line',
        source: 'blueprint-geojson',
        paint: { 'line-color': '#1d4ed8', 'line-width': 2 },
      });
      try {
        const b = new mapboxgl.LngLatBounds();
        const coords = bp.geojson?.features?.[0]?.geometry?.coordinates?.flat(2) || [];
        coords.forEach((c: any) => b.extend([c[0], c[1]]));
        if (!b.isEmpty()) mapRef.fitBounds(b, { padding: 40, duration: 800 });
      } catch {}
      setBlueprintStatus('Blueprint geojson overlay loaded');
    } else {
      setBlueprintStatus('No blueprint data available');
    }
  };

  const plotDevices = (mapRef: MapboxMap, feats: DeviceFeature[]) => {
    // Remove previous markers
    (mapRef as any)._deviceMarkers?.forEach((mk: any) => mk.remove());
    const markers: any[] = [];
    feats.forEach((f) => {
      if (!f.coords) return;
      const el = document.createElement('div');
      el.className = 'device-marker';
      el.style.width = '14px';
      el.style.height = '14px';
      el.style.borderRadius = '50%';
      el.style.background =
        f.status === 'warning' ? '#f59e0b' : f.status === 'offline' ? '#9ca3af' : '#22c55e';
      el.style.boxShadow = '0 0 6px rgba(0,0,0,0.25)';
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
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header title="Map & Blueprint" />

        {!mapToken && (
          <div className="bg-blue-50 text-blue-800 px-4 py-2 text-sm">
            Using OpenStreetMap. Set <code className="bg-blue-100 px-1 rounded">NEXT_PUBLIC_MAPBOX_TOKEN</code> or <code className="bg-blue-100 px-1 rounded">NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN</code> in <code className="bg-blue-100 px-1 rounded">.env.local</code> for blueprint overlay and device markers.
          </div>
        )}
        {error && (
          <div className="bg-yellow-50 text-yellow-700 px-4 py-3">
            {error}
          </div>
        )}

        <div className="p-4 space-y-4">
          <Card className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="text-blue-600" size={18} />
              <span className="text-sm text-gray-700">
                Blueprint + device locations for your institution
              </span>
              {blueprintStatus && (
                <span className="text-xs text-gray-500">({blueprintStatus})</span>
              )}
            </div>
            <div className="flex gap-2">
              {mapToken && (
                <>
                  <Button variant="outline" size="sm" onClick={() => refreshData()}>
                    <RefreshCw size={16} className="mr-1" /> Refresh
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (blueprint?.bounds && map) fitToBounds(map, blueprint.bounds as LngLatBoundsLike);
                    }}
                  >
                    <Maximize size={16} className="mr-1" /> Fit Blueprint
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowBlueprint((prev) => !prev);
                      if (map && blueprint) addBlueprintOverlay(map, blueprint);
                    }}
                  >
                    {showBlueprint ? <><EyeOff size={16} className="mr-1" /> Hide Blueprint</> : <><Eye size={16} className="mr-1" /> Show Blueprint</>}
                  </Button>
                </>
              )}
            </div>
          </Card>

          <div className="relative h-[70vh] rounded-lg overflow-hidden border border-gray-200">
            {loading && mapToken && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70">
                <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" />
              </div>
            )}
            {!mapToken ? (
              <iframe
                title="OpenStreetMap"
                src="https://www.openstreetmap.org/export/embed.html?bbox=77.20%2C28.61%2C77.22%2C28.62&layer=mapnik&marker=28.6139%2C77.209"
                className="w-full h-full border-0"
                allowFullScreen
              />
            ) : (
              <div id="map-container" className="w-full h-full" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
