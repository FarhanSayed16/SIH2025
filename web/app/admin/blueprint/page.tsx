'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminRoute } from '@/components/auth/AdminRoute';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/store/auth-store';
import { apiClient } from '@/lib/api/client';
import { aiApi, type FloorPlanAnalysisResult, type EvacuationCheckResult, type DescribeImageResult } from '@/lib/api/ai';
import { Upload, FileImage, Map, RefreshCw, Layers, Loader2, PlusCircle, Shield, DoorOpen, Landmark, Target, Sparkles, Route, Accessibility, AlertTriangle } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';

type School = {
  _id: string;
  name: string;
};

type Blueprint = {
  imageUrl?: string;
  pdfUrl?: string;
  width?: number;
  height?: number;
  scale?: number;
  floors?: Array<{
    floorNumber: number;
    name?: string;
    blueprintImageUrl?: string;
    width?: number;
    height?: number;
    scale?: number;
  }>;
  uploadedAt?: string;
  uploadedBy?: string;
  lastModified?: string;
};

type BlueprintResponse = {
  schoolId: string;
  schoolName: string;
  blueprint: Blueprint | null;
};

type SafetyEquipment = {
  id: string;
  type: string;
  name: string;
  status?: string;
  location?: {
    floor?: number;
    coordinates?: { x?: number; y?: number };
  };
};

type ExitPoint = {
  id: string;
  name: string;
  type: string;
  location?: {
    floor?: number;
    coordinates?: { x?: number; y?: number };
  };
};

type Room = {
  id: string;
  name: string;
  roomType?: string;
  location?: {
    floor?: number;
    coordinates?: { x?: number; y?: number };
  };
};

type MapData = {
  blueprint: Blueprint | null;
  equipment: SafetyEquipment[];
  exits: ExitPoint[];
  rooms: Room[];
  hazards: any[];
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export default function BlueprintAdminPage() {
  const router = useRouter();
  const { isAuthenticated, accessToken, isAdmin, isLoading: authLoading } = useAuthStore();

  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<string>('');
  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingMap, setIsLoadingMap] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [meta, setMeta] = useState({
    width: '',
    height: '',
    scale: '',
    floorNumber: '',
    floorName: ''
  });
  const [floorFilter, setFloorFilter] = useState<string>('');
  const [mapData, setMapData] = useState<MapData | null>(null);

  const [equipmentForm, setEquipmentForm] = useState({
    name: '',
    type: 'fire-extinguisher',
    status: 'active',
    floor: '',
    x: '',
    y: ''
  });
  const [equipmentEditId, setEquipmentEditId] = useState<string | null>(null);

  const [exitForm, setExitForm] = useState({
    name: '',
    type: 'emergency',
    floor: '',
    x: '',
    y: ''
  });
  const [exitEditId, setExitEditId] = useState<string | null>(null);

  const [roomForm, setRoomForm] = useState({
    name: '',
    roomType: 'classroom',
    floor: '',
    x: '',
    y: ''
  });
  const [roomEditId, setRoomEditId] = useState<string | null>(null);
  const [canvasSize, setCanvasSize] = useState<{ w: number; h: number }>({ w: 800, h: 500 });
  const [dragTarget, setDragTarget] = useState<{ kind: 'equipment' | 'exit' | 'room'; id: string } | null>(null);
  const [equipmentTypeFilter, setEquipmentTypeFilter] = useState<string>('');
  const [equipmentStatusFilter, setEquipmentStatusFilter] = useState<string>('');
  const [exitTypeFilter, setExitTypeFilter] = useState<string>('');
  const [roomTypeFilter, setRoomTypeFilter] = useState<string>('');
  const canvasRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    type: 'equipment' | 'exit' | 'room' | null;
    id: string | null;
  }>({ open: false, type: null, id: null });
  const [floorPlanAnalysis, setFloorPlanAnalysis] = useState<FloorPlanAnalysisResult | null>(null);
  const [floorPlanAnalysisLoading, setFloorPlanAnalysisLoading] = useState(false);
  const [floorPlanAnalysisError, setFloorPlanAnalysisError] = useState<string | null>(null);
  const [evacuationCheck, setEvacuationCheck] = useState<EvacuationCheckResult | null>(null);
  const [evacuationCheckLoading, setEvacuationCheckLoading] = useState(false);
  const [evacuationCheckError, setEvacuationCheckError] = useState<string | null>(null);
  const [describeImage, setDescribeImage] = useState<DescribeImageResult | null>(null);
  const [describeImageLoading, setDescribeImageLoading] = useState(false);
  const [describeImageError, setDescribeImageError] = useState<string | null>(null);
  const blueprintImage = useMemo(() => {
    if (!mapData?.blueprint) return null;
    const floorMatch = mapData.blueprint.floors?.find((f) => f.floorNumber?.toString() === floorFilter);
    return floorMatch?.blueprintImageUrl || mapData.blueprint.imageUrl || null;
  }, [mapData, floorFilter]);

  // Ensure token is set for JSON requests
  useEffect(() => {
    if (accessToken) {
      apiClient.setToken(accessToken);
    }
  }, [accessToken]);

  // Auth guard
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (!isAdmin()) {
      router.push('/dashboard');
      return;
    }
    loadSchools();
  }, [authLoading, isAuthenticated, isAdmin, router]);

  const loadSchools = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.get<{ schools: School[]; data?: School[] }>('/schools?limit=100');
      // Some endpoints return data.schools, others data; support both
      const list = (res.data as any)?.schools || (res as any)?.data || [];
      setSchools(list);
      if (!selectedSchool && list.length > 0) {
        setSelectedSchool(list[0]._id);
      }
      showToast('Schools loaded', 'success', 2500);
    } catch (error) {
      console.error('Failed to load schools', error);
      showToast('Failed to load schools', 'error', 4000);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePositionLocal = (kind: 'equipment' | 'exit' | 'room', id: string, x: number, y: number) => {
    setMapData((prev) => {
      if (!prev) return prev;
      const next = { ...prev };
      if (kind === 'equipment') {
        next.equipment = prev.equipment.map((eq) =>
          eq.id === id ? { ...eq, location: { ...eq.location, coordinates: { x, y }, floor: eq.location?.floor } } : eq
        );
      }
      if (kind === 'exit') {
        next.exits = prev.exits.map((ex) =>
          ex.id === id ? { ...ex, location: { ...ex.location, coordinates: { x, y }, floor: ex.location?.floor } } : ex
        );
      }
      if (kind === 'room') {
        next.rooms = prev.rooms.map((r) =>
          r.id === id ? { ...r, location: { ...r.location, coordinates: { x, y }, floor: r.location?.floor } } : r
        );
      }
      return next;
    });
  };

  const persistPosition = async (kind: 'equipment' | 'exit' | 'room', id: string, x: number, y: number) => {
    if (!selectedSchool) return;
    const payload = {
      location: {
        coordinates: { x, y }
      }
    };
    try {
      if (kind === 'equipment') {
        await apiClient.put(`/schools/${selectedSchool}/floor-plan/safety-equipment/${id}`, payload);
      } else if (kind === 'exit') {
        await apiClient.put(`/schools/${selectedSchool}/floor-plan/exits/${id}`, payload);
      } else {
        await apiClient.put(`/schools/${selectedSchool}/floor-plan/rooms/${id}`, payload);
      }
      showToast('Position updated', 'success');
    } catch (error) {
      console.error('Update position failed', error);
      showToast('Failed to update position', 'error');
    } finally {
      loadMapData(selectedSchool, floorFilter);
    }
  };

  useEffect(() => {
    if (!dragTarget) return;
    const handleMove = (e: MouseEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect || !blueprint) return;
      const normX = ((e.clientX - rect.left) / rect.width) * (blueprint.width || rect.width);
      const normY = ((e.clientY - rect.top) / rect.height) * (blueprint.height || rect.height);
      updatePositionLocal(dragTarget.kind, dragTarget.id, Number(normX.toFixed(2)), Number(normY.toFixed(2)));
    };
    const handleUp = (e: MouseEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect || !blueprint) {
        setDragTarget(null);
        return;
      }
      const normX = ((e.clientX - rect.left) / rect.width) * (blueprint.width || rect.width);
      const normY = ((e.clientY - rect.top) / rect.height) * (blueprint.height || rect.height);
      const x = Number(normX.toFixed(2));
      const y = Number(normY.toFixed(2));
      persistPosition(dragTarget.kind, dragTarget.id, x, y);
      setDragTarget(null);
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [dragTarget, blueprint, floorFilter, selectedSchool]);

  const loadBlueprint = async (schoolId: string) => {
    if (!schoolId) return;
    try {
      setIsLoading(true);
      const res = await apiClient.get<BlueprintResponse>(`/schools/${schoolId}/blueprint`);
      const bp = (res as any)?.data?.blueprint ?? (res as any)?.blueprint ?? null;
      setBlueprint(bp);
      showToast('Blueprint loaded', 'success', 2000);
    } catch (error) {
      console.error('Failed to load blueprint', error);
      setBlueprint(null);
      showToast('Failed to load blueprint', 'error', 4000);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMapData = async (schoolId: string, floor?: string) => {
    if (!schoolId) return;
    try {
      setIsLoadingMap(true);
      const query = floor ? `?floor=${floor}` : '';
      const res = await apiClient.get<MapData>(`/schools/${schoolId}/floor-plan/map-data${query}`);
      const data = (res as any)?.data || res;
      setMapData({
        blueprint: data.blueprint ?? null,
        equipment: data.equipment || [],
        exits: data.exits || [],
        rooms: data.rooms || [],
        hazards: data.hazards || []
      });
      showToast('Map data loaded', 'success', 2000);
    } catch (error) {
      console.error('Failed to load map data', error);
      setMapData(null);
      showToast('Failed to load map data', 'error', 4000);
    } finally {
      setIsLoadingMap(false);
    }
  };

  useEffect(() => {
    if (selectedSchool) {
      loadBlueprint(selectedSchool);
      loadMapData(selectedSchool, floorFilter);
    }
  }, [selectedSchool, floorFilter]);

  const handleUpload = async () => {
    if (!selectedSchool || !file) return;
    try {
      setIsUploading(true);
      const form = new FormData();
      form.append('file', file);
      if (meta.width) form.append('width', meta.width);
      if (meta.height) form.append('height', meta.height);
      if (meta.scale) form.append('scale', meta.scale);
      if (meta.floorNumber) form.append('floorNumber', meta.floorNumber);
      if (meta.floorName) form.append('floorName', meta.floorName);

      const url = `${API_URL}/schools/${selectedSchool}/blueprint/upload`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
          // Do not set Content-Type to let browser set multipart boundary
        },
        body: form
      });

      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data?.message || data?.error || 'Upload failed');
      }
      setBlueprint(data?.data?.blueprint || data?.blueprint || null);
      setFile(null);
    showToast('Blueprint uploaded', 'success', 3000);
    } catch (error) {
      console.error('Upload blueprint failed', error);
    showToast((error as Error).message || 'Upload failed', 'error', 4000);
    } finally {
      setIsUploading(false);
    }
  };

  const selectedFloors = useMemo(() => blueprint?.floors || [], [blueprint]);
  const [snapToGrid, setSnapToGrid] = useState(false);

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1]! : dataUrl;
        resolve(base64);
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

  const handleCheckEvacuationRoute = async (file: File) => {
    setEvacuationCheckError(null);
    setEvacuationCheck(null);
    setEvacuationCheckLoading(true);
    try {
      const base64 = await fileToBase64(file);
      const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      const result = await aiApi.checkEvacuationRoute(base64, mimeType);
      setEvacuationCheck(result);
      showToast('Evacuation route check completed', 'success', 3000);
    } catch (e) {
      const msg = (e as Error).message || 'Check failed';
      setEvacuationCheckError(msg);
      showToast(msg, 'error', 4000);
    } finally {
      setEvacuationCheckLoading(false);
    }
  };

  const handleAnalyzeFloorPlan = async (file: File) => {
    setFloorPlanAnalysisError(null);
    setFloorPlanAnalysis(null);
    setFloorPlanAnalysisLoading(true);
    try {
      const base64 = await fileToBase64(file);
      const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      const result = await aiApi.analyzeFloorPlan(base64, mimeType);
      setFloorPlanAnalysis(result);
      showToast('Floor plan analyzed', 'success', 3000);
    } catch (e) {
      const msg = (e as Error).message || 'Analysis failed';
      setFloorPlanAnalysisError(msg);
      showToast(msg, 'error', 4000);
    } finally {
      setFloorPlanAnalysisLoading(false);
    }
  };

  const handleDescribeImage = async (file: File) => {
    setDescribeImageError(null);
    setDescribeImage(null);
    setDescribeImageLoading(true);
    try {
      const base64 = await fileToBase64(file);
      const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      const result = await aiApi.describeImage(base64, mimeType);
      setDescribeImage(result);
      showToast('Image description ready', 'success', 3000);
    } catch (e) {
      const msg = (e as Error).message || 'Description failed';
      setDescribeImageError(msg);
      showToast(msg, 'error', 4000);
    } finally {
      setDescribeImageLoading(false);
    }
  };

  const gridSize = 20;
  const filteredEquipment = useMemo(() => {
    return (mapData?.equipment || []).filter((eq) => {
      const matchType = equipmentTypeFilter ? eq.type === equipmentTypeFilter : true;
      const matchStatus = equipmentStatusFilter ? eq.status === equipmentStatusFilter : true;
      return matchType && matchStatus;
    });
  }, [mapData, equipmentTypeFilter, equipmentStatusFilter]);
  const filteredExits = useMemo(() => {
    return (mapData?.exits || []).filter((ex) => {
      const matchType = exitTypeFilter ? ex.type === exitTypeFilter : true;
      return matchType;
    });
  }, [mapData, exitTypeFilter]);
  const filteredRooms = useMemo(() => {
    return (mapData?.rooms || []).filter((room) => {
      const matchType = roomTypeFilter ? room.roomType === roomTypeFilter : true;
      return matchType;
    });
  }, [mapData, roomTypeFilter]);

  const handleEditEquipment = (eq: SafetyEquipment) => {
    setEquipmentForm({
      name: eq.name || '',
      type: eq.type || 'fire-extinguisher',
      status: eq.status || 'active',
      floor: eq.location?.floor?.toString() || '',
      x: eq.location?.coordinates?.x?.toString() || '',
      y: eq.location?.coordinates?.y?.toString() || ''
    });
    setEquipmentEditId(eq.id);
  };

  const handleDeleteEquipment = async (id: string) => {
    if (!selectedSchool) return;
    try {
      await apiClient.delete(`/schools/${selectedSchool}/floor-plan/safety-equipment/${id}`);
      loadMapData(selectedSchool, floorFilter);
      showToast('Equipment deleted', 'success', 2500);
    } catch (error) {
      console.error('Delete equipment failed', error);
      showToast('Failed to delete equipment', 'error', 4000);
    }
  };

  const handleEditExit = (ex: ExitPoint) => {
    setExitForm({
      name: ex.name || '',
      type: ex.type || 'emergency',
      floor: ex.location?.floor?.toString() || '',
      x: ex.location?.coordinates?.x?.toString() || '',
      y: ex.location?.coordinates?.y?.toString() || ''
    });
    setExitEditId(ex.id);
  };

  const handleDeleteExit = async (id: string) => {
    if (!selectedSchool) return;
    try {
      await apiClient.delete(`/schools/${selectedSchool}/floor-plan/exits/${id}`);
      loadMapData(selectedSchool, floorFilter);
      showToast('Exit deleted', 'success', 2500);
    } catch (error) {
      console.error('Delete exit failed', error);
      showToast('Failed to delete exit', 'error', 4000);
    }
  };

  const handleEditRoom = (room: Room) => {
    setRoomForm({
      name: room.name || '',
      roomType: room.roomType || 'classroom',
      floor: room.location?.floor?.toString() || '',
      x: room.location?.coordinates?.x?.toString() || '',
      y: room.location?.coordinates?.y?.toString() || ''
    });
    setRoomEditId(room.id);
  };

  const handleDeleteRoom = async (id: string) => {
    if (!selectedSchool) return;
    try {
      await apiClient.delete(`/schools/${selectedSchool}/floor-plan/rooms/${id}`);
      loadMapData(selectedSchool, floorFilter);
      showToast('Room deleted', 'success', 2500);
    } catch (error) {
      console.error('Delete room failed', error);
      showToast('Failed to delete room', 'error', 4000);
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!blueprint || !blueprintImage) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    let normX = ((x / rect.width) * (blueprint.width || rect.width));
    let normY = ((y / rect.height) * (blueprint.height || rect.height));
    if (snapToGrid) {
      normX = Math.round(normX / gridSize) * gridSize;
      normY = Math.round(normY / gridSize) * gridSize;
    }
    const normXStr = normX.toFixed(2);
    const normYStr = normY.toFixed(2);
    setEquipmentForm((m) => ({ ...m, x: normXStr, y: normYStr }));
    setExitForm((m) => ({ ...m, x: normXStr, y: normYStr }));
    setRoomForm((m) => ({ ...m, x: normXStr, y: normYStr }));
  };

  const submitEquipment = async () => {
    if (!selectedSchool || !equipmentForm.name) return;
    try {
      const payload = {
        name: equipmentForm.name,
        type: equipmentForm.type,
        status: equipmentForm.status,
        location: {
          floor: equipmentForm.floor ? Number(equipmentForm.floor) : undefined,
          coordinates: {
            x: equipmentForm.x ? Number(equipmentForm.x) : undefined,
            y: equipmentForm.y ? Number(equipmentForm.y) : undefined
          }
        }
      };

      if (equipmentEditId) {
        await apiClient.put(`/schools/${selectedSchool}/floor-plan/safety-equipment/${equipmentEditId}`, payload);
      } else {
        await apiClient.post(`/schools/${selectedSchool}/floor-plan/safety-equipment`, payload);
      }

      setEquipmentForm({ ...equipmentForm, name: '', x: '', y: '' });
      setEquipmentEditId(null);
      loadMapData(selectedSchool, floorFilter);
    } catch (error) {
      console.error('Add equipment failed', error);
      alert('Failed to add equipment');
    }
  };

  const submitExit = async () => {
    if (!selectedSchool || !exitForm.name) return;
    try {
      const payload = {
        name: exitForm.name,
        type: exitForm.type,
        location: {
          floor: exitForm.floor ? Number(exitForm.floor) : undefined,
          coordinates: {
            x: exitForm.x ? Number(exitForm.x) : undefined,
            y: exitForm.y ? Number(exitForm.y) : undefined
          }
        }
      };

      if (exitEditId) {
        await apiClient.put(`/schools/${selectedSchool}/floor-plan/exits/${exitEditId}`, payload);
      } else {
        await apiClient.post(`/schools/${selectedSchool}/floor-plan/exits`, payload);
      }

      setExitForm({ ...exitForm, name: '', x: '', y: '' });
      setExitEditId(null);
      loadMapData(selectedSchool, floorFilter);
    } catch (error) {
      console.error('Add exit failed', error);
      alert('Failed to add exit');
    }
  };

  const submitRoom = async () => {
    if (!selectedSchool || !roomForm.name) return;
    try {
      const payload = {
        name: roomForm.name,
        roomType: roomForm.roomType,
        location: {
          floor: roomForm.floor ? Number(roomForm.floor) : undefined,
          coordinates: {
            x: roomForm.x ? Number(roomForm.x) : undefined,
            y: roomForm.y ? Number(roomForm.y) : undefined
          }
        }
      };

      if (roomEditId) {
        await apiClient.put(`/schools/${selectedSchool}/floor-plan/rooms/${roomEditId}`, payload);
      } else {
        await apiClient.post(`/schools/${selectedSchool}/floor-plan/rooms`, payload);
      }

      setRoomForm({ ...roomForm, name: '', x: '', y: '' });
      setRoomEditId(null);
      loadMapData(selectedSchool, floorFilter);
    } catch (error) {
      console.error('Add room failed', error);
      alert('Failed to add room');
    }
  };

  const requestDelete = (type: 'equipment' | 'exit' | 'room', id: string) => {
    setConfirmState({ open: true, type, id });
  };

  const confirmDelete = () => {
    if (!confirmState.id) return;
    if (confirmState.type === 'equipment') handleDeleteEquipment(confirmState.id);
    if (confirmState.type === 'exit') handleDeleteExit(confirmState.id);
    if (confirmState.type === 'room') handleDeleteRoom(confirmState.id);
    setConfirmState({ open: false, type: null, id: null });
  };

  return (
    <AdminRoute>
      <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-semibold">Blueprints & Floor Plans</p>
                <h1 className="text-2xl font-bold text-gray-900">School Blueprint Manager</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Upload and manage blueprints, exits, and safety equipment per school.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={() => loadSchools()}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="p-4 lg:col-span-1">
                <div className="flex items-center gap-2 mb-3">
                  <Map className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-semibold">Select School</h2>
                </div>
                <div className="space-y-3">
                  <label className="text-sm text-gray-600">School</label>
                  <select
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={selectedSchool}
                    onChange={(e) => setSelectedSchool(e.target.value)}
                    disabled={isLoading}
                  >
                    {schools.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  {isLoading && (
                    <div className="text-xs text-gray-500">Loading...</div>
                  )}
                </div>
              </Card>

              <Card className="p-4 lg:col-span-2">
                <div className="flex items-center gap-2 mb-3">
                  <FileImage className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-lg font-semibold">Upload Blueprint</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <label className="text-sm text-gray-600">File (PNG/JPG/PDF)</label>
                    <Input
                      type="file"
                      accept=".png,.jpg,.jpeg,.pdf"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                    />
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs text-gray-500">Width</label>
                        <Input
                          value={meta.width}
                          onChange={(e) => setMeta((m) => ({ ...m, width: e.target.value }))}
                          placeholder="e.g., 1200"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Height</label>
                        <Input
                          value={meta.height}
                          onChange={(e) => setMeta((m) => ({ ...m, height: e.target.value }))}
                          placeholder="e.g., 800"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Scale</label>
                        <Input
                          value={meta.scale}
                          onChange={(e) => setMeta((m) => ({ ...m, scale: e.target.value }))}
                          placeholder="e.g., 0.1"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-gray-500">Floor #</label>
                        <Input
                          value={meta.floorNumber}
                          onChange={(e) => setMeta((m) => ({ ...m, floorNumber: e.target.value }))}
                          placeholder="e.g., 0"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Floor Name</label>
                        <Input
                          value={meta.floorName}
                          onChange={(e) => setMeta((m) => ({ ...m, floorName: e.target.value }))}
                          placeholder="Ground Floor"
                        />
                      </div>
                    </div>
                    <Button
                      onClick={handleUpload}
                      disabled={!file || !selectedSchool || isUploading}
                      className="mt-2 inline-flex items-center"
                    >
                      {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                      {isUploading ? 'Uploading...' : 'Upload Blueprint'}
                    </Button>
                  </div>

                  <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Current Blueprint</p>
                    {blueprint?.imageUrl ? (
                      <div className="space-y-2">
                        <img
                          src={blueprint.imageUrl}
                          alt="Blueprint"
                          className="w-full h-40 object-contain rounded border"
                        />
                        <p className="text-xs text-gray-500">
                          W: {blueprint.width ?? '—'} · H: {blueprint.height ?? '—'} · Scale: {blueprint.scale ?? '—'}
                        </p>
                        {blueprint.floors && blueprint.floors.length > 0 && (
                          <p className="text-xs text-gray-500">
                            Floors: {blueprint.floors.length}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="h-40 flex items-center justify-center text-gray-400 text-sm">
                        No blueprint uploaded yet
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </div>

            <Card className="p-6 border border-emerald-100 bg-white shadow-sm rounded-xl overflow-hidden">
              <div className="flex items-start gap-3 mb-2">
                <div className="p-2 rounded-lg bg-emerald-50">
                  <Route className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Check Evacuation Route (AI)</h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Upload a photo of a corridor or exit to see if the route is clear, blocked, or partially blocked.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-end gap-3 mt-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Image (PNG/JPG)</label>
                  <Input
                    type="file"
                    accept=".png,.jpg,.jpeg"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleCheckEvacuationRoute(f);
                    }}
                    disabled={evacuationCheckLoading}
                    className="max-w-xs"
                  />
                </div>
                {evacuationCheckLoading && (
                  <div className="flex items-center gap-2 text-emerald-600">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm">Analyzing route…</span>
                  </div>
                )}
              </div>
              {evacuationCheckError && (
                <div className="mt-4 p-4 rounded-xl bg-red-50 border border-red-100 flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{evacuationCheckError}</p>
                </div>
              )}
              {evacuationCheck && (
                <div
                  className="mt-4 rounded-xl border overflow-hidden"
                  style={{
                    backgroundColor: evacuationCheck.status === 'clear' ? 'rgb(236 253 245)' : evacuationCheck.status === 'blocked' ? 'rgb(254 226 226)' : 'rgb(255 237 213)',
                    borderColor: evacuationCheck.status === 'clear' ? 'rgb(167 243 208)' : evacuationCheck.status === 'blocked' ? 'rgb(254 202 202)' : 'rgb(253 186 116)',
                  }}
                >
                  <div className="p-4 flex items-center gap-3">
                    <span
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold capitalize"
                      style={{
                        backgroundColor: evacuationCheck.status === 'clear' ? 'rgb(167 243 208)' : evacuationCheck.status === 'blocked' ? 'rgb(254 202 202)' : 'rgb(253 186 116)',
                        color: evacuationCheck.status === 'clear' ? 'rgb(22 101 52)' : evacuationCheck.status === 'blocked' ? 'rgb(185 28 28)' : 'rgb(194 65 12)',
                      }}
                    >
                      {evacuationCheck.status === 'clear' && '✓ Clear'}
                      {evacuationCheck.status === 'blocked' && '✕ Blocked'}
                      {evacuationCheck.status === 'partially_blocked' && '⚠ Partially blocked'}
                      {!['clear', 'blocked', 'partially_blocked'].includes(evacuationCheck.status ?? '') && (evacuationCheck.status?.replace('_', ' ') ?? 'Unknown')}
                    </span>
                    <span className="text-sm text-gray-600">
                      {evacuationCheck.status === 'clear' && 'Route is safe for evacuation'}
                      {evacuationCheck.status === 'blocked' && 'Do not use this route'}
                      {evacuationCheck.status === 'partially_blocked' && 'Use with caution'}
                    </span>
                  </div>
                  <div className="px-4 pb-4 pt-0 space-y-3">
                    {evacuationCheck.reason && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Analysis</p>
                        <p className="text-sm text-gray-700">{evacuationCheck.reason}</p>
                      </div>
                    )}
                    {evacuationCheck.recommendation && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Recommendation</p>
                        <p className="text-sm text-gray-600">{evacuationCheck.recommendation}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Card>

            <Card className="p-5 border border-violet-100 bg-white">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-violet-600" />
                <h2 className="text-lg font-semibold">Analyze Floor Plan (AI)</h2>
              </div>
              <p className="text-sm text-gray-500 mb-3">
                Upload a floor plan image to get assembly points, primary/secondary exits, and bottlenecks.
              </p>
              <div className="flex flex-wrap items-end gap-3">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Image (PNG/JPG)</label>
                  <Input
                    type="file"
                    accept=".png,.jpg,.jpeg"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleAnalyzeFloorPlan(f);
                    }}
                    disabled={floorPlanAnalysisLoading}
                  />
                </div>
                {floorPlanAnalysisLoading && <Loader2 className="w-5 h-5 animate-spin text-violet-600" />}
              </div>
              {floorPlanAnalysisError && (
                <p className="mt-2 text-sm text-red-600">{floorPlanAnalysisError}</p>
              )}
              {floorPlanAnalysis && (
                <div className="mt-4 p-4 rounded-lg bg-violet-50 border border-violet-100 space-y-3">
                  <p className="text-sm font-medium text-gray-700">{floorPlanAnalysis.summary}</p>
                  {floorPlanAnalysis.assemblyPoints?.length > 0 && (
                    <div>
                      <span className="text-xs font-semibold text-violet-700">Assembly points:</span>
                      <ul className="list-disc list-inside text-sm text-gray-600">{floorPlanAnalysis.assemblyPoints.map((a, i) => <li key={i}>{a}</li>)}</ul>
                    </div>
                  )}
                  {floorPlanAnalysis.primaryExits?.length > 0 && (
                    <div>
                      <span className="text-xs font-semibold text-violet-700">Primary exits:</span>
                      <ul className="list-disc list-inside text-sm text-gray-600">{floorPlanAnalysis.primaryExits.map((e, i) => <li key={i}>{e}</li>)}</ul>
                    </div>
                  )}
                  {floorPlanAnalysis.secondaryExits?.length > 0 && (
                    <div>
                      <span className="text-xs font-semibold text-violet-700">Secondary exits:</span>
                      <ul className="list-disc list-inside text-sm text-gray-600">{floorPlanAnalysis.secondaryExits.map((e, i) => <li key={i}>{e}</li>)}</ul>
                    </div>
                  )}
                  {floorPlanAnalysis.bottlenecks?.length > 0 && (
                    <div>
                      <span className="text-xs font-semibold text-amber-700">Bottlenecks:</span>
                      <ul className="list-disc list-inside text-sm text-gray-600">{floorPlanAnalysis.bottlenecks.map((b, i) => <li key={i}>{b}</li>)}</ul>
                    </div>
                  )}
                </div>
              )}
            </Card>

            <Card className="p-5 border border-sky-100 bg-white">
              <div className="flex items-center gap-2 mb-3">
                <Accessibility className="w-5 h-5 text-sky-600" />
                <h2 className="text-lg font-semibold">Describe image (accessibility)</h2>
              </div>
              <p className="text-sm text-gray-500 mb-3">
                Get a plain-language description of any safety-related image for screen readers or visually impaired users.
              </p>
              <div className="flex flex-wrap items-end gap-3">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Image (PNG/JPG)</label>
                  <Input
                    type="file"
                    accept=".png,.jpg,.jpeg"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleDescribeImage(f);
                    }}
                    disabled={describeImageLoading}
                  />
                </div>
                {describeImageLoading && <Loader2 className="w-5 h-5 animate-spin text-sky-600" />}
              </div>
              {describeImageError && (
                <p className="mt-2 text-sm text-red-600">{describeImageError}</p>
              )}
              {describeImage?.description && (
                <div className="mt-4 p-4 rounded-lg bg-sky-50 border border-sky-100">
                  <p className="text-xs font-semibold text-sky-700 mb-1">Image description</p>
                  <p className="text-sm text-gray-700" role="text">{describeImage.description}</p>
                </div>
              )}
            </Card>

            <Card className="p-5 border-dashed border-2 border-blue-100 bg-white/80">
              <div className="flex items-center gap-3 mb-2">
                <Layers className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="text-lg font-semibold">Floor Plan Editor (Coming Next)</h3>
                  <p className="text-sm text-gray-500">Drag-and-drop exits, equipment, and rooms. This is a scaffold placeholder.</p>
                </div>
              </div>
              {selectedFloors.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {selectedFloors.map((f) => (
                    <div key={f.floorNumber} className="rounded-lg border px-3 py-2 bg-gray-50 text-sm">
                      <div className="font-semibold">{f.name || `Floor ${f.floorNumber}`}</div>
                      <div className="text-xs text-gray-500">Scale: {f.scale ?? '—'}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500">Upload a blueprint with floor info to begin editing.</div>
              )}
            </Card>

            <Card className="p-5 bg-white shadow-sm border border-gray-100">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Map Data</h3>
                  <p className="text-sm text-gray-500">Filter by floor and manage equipment/exits/rooms.</p>
                </div>
                <div className="flex items-center gap-2 ml-auto">
                  <Input
                    placeholder="Floor #"
                    className="w-24"
                    value={floorFilter}
                    onChange={(e) => setFloorFilter(e.target.value)}
                  />
                  <Button variant="outline" size="sm" onClick={() => loadMapData(selectedSchool, floorFilter)}>
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Refresh
                  </Button>
                  {isLoadingMap && <Loader2 className="w-4 h-4 animate-spin text-blue-600" />}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Visual overlay */}
                <div className="lg:col-span-3">
                  <div className="mb-2 flex items-center gap-2 text-sm text-gray-600">
                    <Target className="w-4 h-4 text-blue-600" />
                    <span>Click on the blueprint to set X/Y for new items.</span>
                    <label className="flex items-center gap-2 ml-auto text-xs text-gray-600">
                      <input
                        type="checkbox"
                        checked={snapToGrid}
                        onChange={(e) => setSnapToGrid(e.target.checked)}
                      />
                      Snap to grid ({gridSize}px)
                    </label>
                  </div>
                  <div
                    className="relative border rounded-lg bg-gray-100 overflow-hidden"
                    style={{ width: '100%', minHeight: 400 }}
                  >
                    {blueprintImage ? (
                      <div
                        className="relative"
                        style={{ width: '100%', paddingBottom: '60%' }}
                        onClick={handleCanvasClick}
                      >
                        <img
                          src={blueprintImage}
                          alt="Blueprint"
                          className="absolute inset-0 w-full h-full object-contain"
                          onLoad={(e) => {
                            const el = e.currentTarget;
                            setCanvasSize({ w: el.naturalWidth || 800, h: el.naturalHeight || 500 });
                          }}
                        />
                        {/* Markers */}
                        {filteredEquipment.map((eq) => {
                          const x = eq.location?.coordinates?.x;
                          const y = eq.location?.coordinates?.y;
                          if (x == null || y == null) return null;
                          return (
                            <div
                              key={`eq-${eq.id}`}
                              className="absolute text-[10px] bg-red-500 text-white px-1 py-0.5 rounded"
                              style={{
                                left: `${(x / (blueprint?.width || canvasSize.w)) * 100}%`,
                                top: `${(y / (blueprint?.height || canvasSize.h)) * 100}%`,
                                transform: 'translate(-50%, -50%)'
                              }}
                              title={`${eq.name} • ${eq.type}`}
                              onMouseDown={() => setDragTarget({ kind: 'equipment', id: eq.id })}
                            >
                              E
                            </div>
                          );
                        })}
                        {filteredExits.map((ex) => {
                          const x = ex.location?.coordinates?.x;
                          const y = ex.location?.coordinates?.y;
                          if (x == null || y == null) return null;
                          return (
                            <div
                              key={`ex-${ex.id}`}
                              className="absolute text-[10px] bg-green-500 text-white px-1 py-0.5 rounded"
                              style={{
                                left: `${(x / (blueprint?.width || canvasSize.w)) * 100}%`,
                                top: `${(y / (blueprint?.height || canvasSize.h)) * 100}%`,
                                transform: 'translate(-50%, -50%)'
                              }}
                              title={`${ex.name} • ${ex.type}`}
                              onMouseDown={() => setDragTarget({ kind: 'exit', id: ex.id })}
                            >
                              X
                            </div>
                          );
                        })}
                        {filteredRooms.map((room) => {
                          const x = room.location?.coordinates?.x;
                          const y = room.location?.coordinates?.y;
                          if (x == null || y == null) return null;
                          return (
                            <div
                              key={`rm-${room.id}`}
                              className="absolute text-[10px] bg-blue-500 text-white px-1 py-0.5 rounded"
                              style={{
                                left: `${(x / (blueprint?.width || canvasSize.w)) * 100}%`,
                                top: `${(y / (blueprint?.height || canvasSize.h)) * 100}%`,
                                transform: 'translate(-50%, -50%)'
                              }}
                              title={`${room.name} • ${room.roomType || 'room'}`}
                              onMouseDown={() => setDragTarget({ kind: 'room', id: room.id })}
                            >
                              R
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
                        Upload a blueprint to view overlay.
                      </div>
                    )}
                  </div>
                </div>

                {/* Equipment */}
                <div className="border rounded-lg p-4 bg-gray-50/70">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="w-4 h-4 text-emerald-600" />
                    <h4 className="font-semibold">Safety Equipment</h4>
                  </div>
                  <div className="space-y-2">
                    <Input
                      placeholder="Name"
                      value={equipmentForm.name}
                      onChange={(e) => setEquipmentForm((m) => ({ ...m, name: e.target.value }))}
                    />
                    <select
                      className="w-full rounded border px-3 py-2 text-sm"
                      value={equipmentForm.type}
                      onChange={(e) => setEquipmentForm((m) => ({ ...m, type: e.target.value }))}
                    >
                      <option value="fire-extinguisher">Fire Extinguisher</option>
                      <option value="first-aid-kit">First Aid Kit</option>
                      <option value="aed">AED</option>
                      <option value="fire-alarm">Fire Alarm</option>
                      <option value="sprinkler">Sprinkler</option>
                      <option value="emergency-light">Emergency Light</option>
                      <option value="other">Other</option>
                    </select>
                    <div className="grid grid-cols-3 gap-2">
                      <Input
                        placeholder="Floor"
                        value={equipmentForm.floor}
                        onChange={(e) => setEquipmentForm((m) => ({ ...m, floor: e.target.value }))}
                      />
                      <Input
                        placeholder="X"
                        value={equipmentForm.x}
                        onChange={(e) => setEquipmentForm((m) => ({ ...m, x: e.target.value }))}
                      />
                      <Input
                        placeholder="Y"
                        value={equipmentForm.y}
                        onChange={(e) => setEquipmentForm((m) => ({ ...m, y: e.target.value }))}
                      />
                    </div>
                    <Button size="sm" className="w-full" onClick={submitEquipment} disabled={!selectedSchool}>
                      <PlusCircle className="w-4 h-4 mr-1" />
                      {equipmentEditId ? 'Update Equipment' : 'Add Equipment'}
                    </Button>
                    <div className="max-h-40 overflow-auto text-sm space-y-1">
                      {mapData?.equipment?.length
                        ? mapData.equipment.map((eq) => (
                            <div key={eq.id} className="flex items-center justify-between gap-2 rounded bg-white px-2 py-1 border text-xs">
                              <div className="flex-1">
                                <span className="font-medium">{eq.name}</span> · {eq.type}
                                <span className="text-gray-500 ml-2">F{eq.location?.floor ?? '—'} ({eq.location?.coordinates?.x ?? '—'},{eq.location?.coordinates?.y ?? '—'})</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button className="text-blue-600 hover:underline" onClick={() => handleEditEquipment(eq)}>Edit</button>
                                <button className="text-red-600 hover:underline" onClick={() => requestDelete('equipment', eq.id)}>Delete</button>
                              </div>
                            </div>
                          ))
                        : <div className="text-gray-500 text-xs">No equipment</div>}
                    </div>
                  </div>
                </div>

                {/* Exits */}
                <div className="border rounded-lg p-4 bg-gray-50/70">
                  <div className="flex items-center gap-2 mb-3">
                    <DoorOpen className="w-4 h-4 text-blue-600" />
                    <h4 className="font-semibold">Exits</h4>
                  </div>
                  <div className="space-y-2">
                    <Input
                      placeholder="Name"
                      value={exitForm.name}
                      onChange={(e) => setExitForm((m) => ({ ...m, name: e.target.value }))}
                    />
                    <select
                      className="w-full rounded border px-3 py-2 text-sm"
                      value={exitForm.type}
                      onChange={(e) => setExitForm((m) => ({ ...m, type: e.target.value }))}
                    >
                      <option value="main">Main</option>
                      <option value="emergency">Emergency</option>
                      <option value="fire">Fire</option>
                      <option value="service">Service</option>
                      <option value="disabled-access">Accessible</option>
                    </select>
                    <div className="grid grid-cols-3 gap-2">
                      <Input
                        placeholder="Floor"
                        value={exitForm.floor}
                        onChange={(e) => setExitForm((m) => ({ ...m, floor: e.target.value }))}
                      />
                      <Input
                        placeholder="X"
                        value={exitForm.x}
                        onChange={(e) => setExitForm((m) => ({ ...m, x: e.target.value }))}
                      />
                      <Input
                        placeholder="Y"
                        value={exitForm.y}
                        onChange={(e) => setExitForm((m) => ({ ...m, y: e.target.value }))}
                      />
                    </div>
                    <Button size="sm" className="w-full" onClick={submitExit} disabled={!selectedSchool}>
                      <PlusCircle className="w-4 h-4 mr-1" />
                      {exitEditId ? 'Update Exit' : 'Add Exit'}
                    </Button>
                    <div className="max-h-40 overflow-auto text-sm space-y-1">
                      {mapData?.exits?.length
                        ? mapData.exits.map((ex) => (
                            <div key={ex.id} className="flex items-center justify-between gap-2 rounded bg-white px-2 py-1 border text-xs">
                              <div className="flex-1">
                                <span className="font-medium">{ex.name}</span> · {ex.type}
                                <span className="text-gray-500 ml-2">F{ex.location?.floor ?? '—'} ({ex.location?.coordinates?.x ?? '—'},{ex.location?.coordinates?.y ?? '—'})</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button className="text-blue-600 hover:underline" onClick={() => handleEditExit(ex)}>Edit</button>
                                <button className="text-red-600 hover:underline" onClick={() => requestDelete('exit', ex.id)}>Delete</button>
                              </div>
                            </div>
                          ))
                        : <div className="text-gray-500 text-xs">No exits</div>}
                    </div>
                  </div>
                </div>

                {/* Rooms */}
                <div className="border rounded-lg p-4 bg-gray-50/70">
                  <div className="flex items-center gap-2 mb-3">
                    <Landmark className="w-4 h-4 text-purple-600" />
                    <h4 className="font-semibold">Rooms</h4>
                  </div>
                  <div className="space-y-2">
                    <Input
                      placeholder="Name"
                      value={roomForm.name}
                      onChange={(e) => setRoomForm((m) => ({ ...m, name: e.target.value }))}
                    />
                    <select
                      className="w-full rounded border px-3 py-2 text-sm"
                      value={roomForm.roomType}
                      onChange={(e) => setRoomForm((m) => ({ ...m, roomType: e.target.value }))}
                    >
                      <option value="classroom">Classroom</option>
                      <option value="laboratory">Laboratory</option>
                      <option value="library">Library</option>
                      <option value="office">Office</option>
                      <option value="gym">Gym</option>
                      <option value="cafeteria">Cafeteria</option>
                      <option value="bathroom">Bathroom</option>
                      <option value="stairwell">Stairwell</option>
                      <option value="elevator">Elevator</option>
                      <option value="storage">Storage</option>
                      <option value="other">Other</option>
                    </select>
                    <div className="grid grid-cols-3 gap-2">
                      <Input
                        placeholder="Floor"
                        value={roomForm.floor}
                        onChange={(e) => setRoomForm((m) => ({ ...m, floor: e.target.value }))}
                      />
                      <Input
                        placeholder="X"
                        value={roomForm.x}
                        onChange={(e) => setRoomForm((m) => ({ ...m, x: e.target.value }))}
                      />
                      <Input
                        placeholder="Y"
                        value={roomForm.y}
                        onChange={(e) => setRoomForm((m) => ({ ...m, y: e.target.value }))}
                      />
                    </div>
                    <Button size="sm" className="w-full" onClick={submitRoom} disabled={!selectedSchool}>
                      <PlusCircle className="w-4 h-4 mr-1" />
                      {roomEditId ? 'Update Room' : 'Add Room'}
                    </Button>
                    <div className="max-h-40 overflow-auto text-sm space-y-1">
                      {mapData?.rooms?.length
                        ? mapData.rooms.map((room) => (
                            <div key={room.id} className="flex items-center justify-between gap-2 rounded bg-white px-2 py-1 border text-xs">
                              <div className="flex-1">
                                <span className="font-medium">{room.name}</span> · {room.roomType || 'room'}
                                <span className="text-gray-500 ml-2">F{room.location?.floor ?? '—'} ({room.location?.coordinates?.x ?? '—'},{room.location?.coordinates?.y ?? '—'})</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button className="text-blue-600 hover:underline" onClick={() => handleEditRoom(room)}>Edit</button>
                                <button className="text-red-600 hover:underline" onClick={() => requestDelete('room', room.id)}>Delete</button>
                              </div>
                            </div>
                          ))
                        : <div className="text-gray-500 text-xs">No rooms</div>}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
            <Modal
              isOpen={confirmState.open}
              onClose={() => setConfirmState({ open: false, type: null, id: null })}
              title="Confirm delete"
            >
              <p className="text-sm text-gray-600">
                Are you sure you want to delete this {confirmState.type ?? 'item'}?
              </p>
              <div className="mt-4 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setConfirmState({ open: false, type: null, id: null })}>
                  Cancel
                </Button>
                <Button variant="danger" onClick={confirmDelete}>
                  Delete
                </Button>
              </div>
            </Modal>
          </main>
        </div>
      </div>
    </AdminRoute>
  );
}

