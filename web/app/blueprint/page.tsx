'use client';

import { useMemo, useRef, useState } from 'react';
import { v4 as uuid } from 'uuid';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';

type PinCategory =
  | 'fire_exit'
  | 'alarm_system'
  | 'assembly_point'
  | 'first_aid'
  | 'emergency_equipment'
  | 'other';

type Pin = {
  id: string;
  label: string;
  description: string;
  category: PinCategory;
  x: number; // percent
  y: number; // percent
  lat?: number;
  lng?: number;
};

const categoryStyles: Record<PinCategory, { color: string; text: string }> = {
  fire_exit: { color: '#ef4444', text: 'Fire Exit' },
  alarm_system: { color: '#f97316', text: 'Alarm' },
  assembly_point: { color: '#22c55e', text: 'Assembly' },
  first_aid: { color: '#14b8a6', text: 'First Aid' },
  emergency_equipment: { color: '#6366f1', text: 'Equipment' },
  other: { color: '#9ca3af', text: 'Other' },
};

export default function BlueprintPage() {
  const [blueprintUrl, setBlueprintUrl] = useState('/blueprints/your.jpg');
  const [pins, setPins] = useState<Pin[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<PinCategory>('other');
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [lat, setLat] = useState<string>('');
  const [lng, setLng] = useState<string>('');
  const containerRef = useRef<HTMLDivElement | null>(null);

  const googleMapSrc = useMemo(() => {
    const latNum = Number(lat);
    const lngNum = Number(lng);
    if (Number.isFinite(latNum) && Number.isFinite(lngNum)) {
      return `https://www.google.com/maps/embed/v1/view?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || 'YOUR_GOOGLE_MAPS_KEY'}&center=${latNum},${lngNum}&zoom=17&maptype=satellite`;
    }
    return `https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || 'YOUR_GOOGLE_MAPS_KEY'}&q=School`;
  }, [lat, lng]);

  const handleBlueprintUpload = (file: File) => {
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      alert('Only PNG/JPEG allowed');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('Max file size 10MB');
      return;
    }
    const url = URL.createObjectURL(file);
    setBlueprintUrl(url);
  };

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
    const yPercent = ((e.clientY - rect.top) / rect.height) * 100;

    const newPin: Pin = {
      id: uuid(),
      label: label || 'Pin',
      description,
      category: selectedCategory,
      x: xPercent,
      y: yPercent,
      lat: Number.isFinite(Number(lat)) ? Number(lat) : undefined,
      lng: Number.isFinite(Number(lng)) ? Number(lng) : undefined,
    };
    setPins((prev) => [...prev, newPin]);
    setLabel('');
    setDescription('');
  };

  const handleDelete = (id: string) => {
    setPins((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header title="Blueprint & Map (Frontend-only demo)" />

        <div className="p-4 space-y-4">
          <div className="grid lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white border rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">Blueprint</h2>
                    <p className="text-sm text-gray-500">Click to place pins</p>
                  </div>
                  <label className="text-sm font-medium bg-blue-50 text-blue-600 px-3 py-2 rounded cursor-pointer hover:bg-blue-100">
                    Upload (png/jpg, &lt;10MB)
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleBlueprintUpload(file);
                      }}
                    />
                  </label>
                </div>

                <div
                  ref={containerRef}
                  className="relative mt-3 border rounded-lg overflow-hidden bg-gray-100"
                  style={{ minHeight: 420 }}
                  onClick={handleMapClick}
                >
                  <img src={blueprintUrl} alt="Blueprint" className="w-full h-full object-contain" />
                  {pins.map((pin) => (
                    <div
                      key={pin.id}
                      className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                      style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
                      title={`${pin.label} (${categoryStyles[pin.category].text})`}
                    >
                      <div
                        className="w-4 h-4 rounded-full border border-white shadow"
                        style={{ backgroundColor: categoryStyles[pin.category].color }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white border rounded-lg p-4 shadow-sm">
                <h2 className="text-lg font-semibold mb-2">Pins</h2>
                {pins.length === 0 && <p className="text-sm text-gray-500">No pins yet. Click the blueprint to add.</p>}
                <div className="space-y-2 max-h-64 overflow-auto">
                  {pins.map((pin) => (
                    <div
                      key={pin.id}
                      className="flex items-start justify-between border rounded p-2 text-sm bg-gray-50"
                    >
                      <div>
                        <div className="font-semibold">
                          {pin.label} <span className="text-xs text-gray-500">({categoryStyles[pin.category].text})</span>
                        </div>
                        {pin.description && <div className="text-gray-600">{pin.description}</div>}
                        <div className="text-xs text-gray-500">
                          Pos: {pin.x.toFixed(1)}%, {pin.y.toFixed(1)}%
                          {pin.lat !== undefined && pin.lng !== undefined
                            ? ` • GPS: ${pin.lat.toFixed(5)}, ${pin.lng.toFixed(5)}`
                            : ' • No GPS'}
                        </div>
                      </div>
                      <button
                        className="text-red-500 hover:text-red-600 text-xs"
                        onClick={() => handleDelete(pin.id)}
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-white border rounded-lg p-4 shadow-sm space-y-3">
                <h2 className="text-lg font-semibold">Pin Details</h2>
                <div className="space-y-2 text-sm">
                  <div className="space-y-1">
                    <label className="block text-gray-600">Label</label>
                    <input
                      className="w-full border rounded px-2 py-1"
                      value={label}
                      onChange={(e) => setLabel(e.target.value)}
                      placeholder="e.g., Fire Exit A"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-gray-600">Description</label>
                    <textarea
                      className="w-full border rounded px-2 py-1"
                      rows={2}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Details"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-gray-600">Category</label>
                    <select
                      className="w-full border rounded px-2 py-1"
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value as PinCategory)}
                    >
                      {Object.entries(categoryStyles).map(([key, val]) => (
                        <option key={key} value={key}>
                          {val.text}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="block text-gray-600">Latitude</label>
                      <input
                        className="w-full border rounded px-2 py-1"
                        value={lat}
                        onChange={(e) => setLat(e.target.value)}
                        placeholder="optional"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-gray-600">Longitude</label>
                      <input
                        className="w-full border rounded px-2 py-1"
                        value={lng}
                        onChange={(e) => setLng(e.target.value)}
                        placeholder="optional"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    Tip: set label/category first, then click the blueprint to place a pin. If you add lat/lng, the map will center there.
                  </p>
                </div>
              </div>

              <div className="bg-white border rounded-lg p-4 shadow-sm space-y-2">
                <h2 className="text-lg font-semibold">Map (Google Embed)</h2>
                <div className="w-full aspect-video rounded-lg overflow-hidden border">
                  <iframe
                    title="Google Map"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    allowFullScreen
                    src={googleMapSrc}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Frontend-only demo. Add a real Google Maps API key in NEXT_PUBLIC_GOOGLE_MAPS_KEY to remove the placeholder.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

