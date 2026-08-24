'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Copy, RotateCcw, Check, Crosshair } from 'lucide-react';
import {
  SHOT_LIBRARY,
  SHOT_PREVIEW_STORAGE_KEY,
  SHOT_SLOTS,
  exportShotConfigSnippet,
  type ShotConfig,
  type ShotSlotId,
} from '@/lib/landing/shot-config';
import { clearShotOverrides, saveShotOverrides } from '@/lib/landing/use-shot-config';
import { BrowserShot, PhoneShot, ShotStage } from '@/components/landing/ProductShot';

const DEFAULT_SLOT: ShotSlotId = 'heroDashboard';

function cloneSlots(): Record<ShotSlotId, ShotConfig> {
  return Object.fromEntries(SHOT_SLOTS.map((s) => [s.id, { ...s.config }])) as Record<
    ShotSlotId,
    ShotConfig
  >;
}

function loadInitial(): Record<ShotSlotId, ShotConfig> {
  const base = cloneSlots();
  if (typeof window === 'undefined') return base;
  try {
    const raw = localStorage.getItem(SHOT_PREVIEW_STORAGE_KEY);
    if (!raw) return base;
    const overrides = JSON.parse(raw) as Partial<Record<ShotSlotId, ShotConfig>>;
    for (const slot of SHOT_SLOTS) {
      if (overrides[slot.id]) base[slot.id] = { ...base[slot.id], ...overrides[slot.id] };
    }
  } catch {
    /* ignore */
  }
  return base;
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block text-sm">
      <div className="flex justify-between mb-1 text-slate-600">
        <span>{label}</span>
        <span className="font-mono text-xs text-slate-800">
          {value}
          {suffix ?? ''}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-teal-700"
      />
    </label>
  );
}

const GROUPS: { title: string; ids: ShotSlotId[] }[] = [
  { title: 'Hero', ids: ['heroDashboard', 'heroPhone'] },
  { title: 'Approach strip', ids: ['pillarPrevent', 'pillarDetect', 'pillarRespond'] },
  { title: 'Roles', ids: ['roleStudent', 'roleTeacher', 'roleAdmin', 'roleParent'] },
  { title: 'Platform tabs', ids: ['capLearning', 'capAi', 'capOps', 'capIot'] },
  { title: 'Architecture', ids: ['archMobile', 'archWeb', 'archIot'] },
  { title: 'Download band', ids: ['downloadLogin', 'downloadHome', 'downloadParent'] },
  { title: 'For schools', ids: ['institutionsAnalytics'] },
];

export default function ShotsPreviewPage() {
  const [activeSlot, setActiveSlot] = useState<ShotSlotId>(DEFAULT_SLOT);
  const [configs, setConfigs] = useState<Record<ShotSlotId, ShotConfig>>(cloneSlots);
  const [copied, setCopied] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setConfigs(loadInitial());
    setHydrated(true);
  }, []);

  const meta = SHOT_SLOTS.find((s) => s.id === activeSlot)!;
  const current = configs[activeSlot];

  const patch = useCallback(
    (partial: Partial<ShotConfig>) => {
      setConfigs((prev) => {
        const next = { ...prev, [activeSlot]: { ...prev[activeSlot], ...partial } };
        saveShotOverrides(next);
        return next;
      });
    },
    [activeSlot]
  );

  const resetSlot = () => {
    const defaults = cloneSlots();
    setConfigs((prev) => {
      const next = { ...prev, [activeSlot]: defaults[activeSlot] };
      saveShotOverrides(next);
      return next;
    });
  };

  const resetAll = () => {
    clearShotOverrides();
    setConfigs(cloneSlots());
  };

  const centerShot = () =>
    patch({ objectPositionX: 50, objectPositionY: 50, scale: 1, objectFit: 'cover' });

  const exportSnippet = useMemo(() => exportShotConfigSnippet(configs), [configs]);

  const copyExport = async () => {
    await navigator.clipboard.writeText(exportSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">
        Loading shot preview…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display font-bold text-xl text-slate-900">
              Landing screenshot preview
            </h1>
            <p className="text-sm text-slate-500">
              Pick the image and adjust framing per slot · changes apply live on the landing page
              (saved in this browser)
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/" className="k-btn-outline text-sm py-2 px-4">
              Back to landing
            </Link>
            <button type="button" onClick={resetAll} className="k-btn-outline text-sm py-2 px-4">
              <RotateCcw className="w-4 h-4" />
              Reset all
            </button>
            <button type="button" onClick={copyExport} className="k-btn-primary text-sm py-2 px-4">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied' : 'Copy all values'}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 grid lg:grid-cols-[260px_1fr_320px] gap-6">
        {/* Slot list */}
        <aside className="space-y-5">
          {GROUPS.map((group) => (
            <div key={group.title}>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                {group.title}
              </p>
              <div className="space-y-1.5">
                {group.ids.map((id) => {
                  const slot = SHOT_SLOTS.find((s) => s.id === id)!;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setActiveSlot(id)}
                      className={`w-full text-left rounded-xl border px-3 py-2.5 transition-colors ${
                        activeSlot === id
                          ? 'border-teal-600 bg-teal-50'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <p className="font-semibold text-sm text-slate-900">{slot.label}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{slot.kind} · {slot.stage}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </aside>

        {/* Live preview */}
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-baseline justify-between mb-1">
              <h2 className="font-display font-bold text-lg text-slate-900">{meta.label}</h2>
              <span className="text-xs text-slate-500">{meta.context}</span>
            </div>
            <p className="text-xs text-slate-400 mb-5 font-mono">{current.src}</p>

            <div className="rounded-xl bg-slate-100 p-6 flex justify-center">
              <div className="w-full max-w-[520px] group">
                {meta.stage === 'raw' ? (
                  meta.kind === 'phone' ? (
                    <div className="flex justify-center">
                      <PhoneShot slot={activeSlot} className="w-[190px]" />
                    </div>
                  ) : (
                    <BrowserShot slot={activeSlot} bodyRatio="1600 / 898" />
                  )
                ) : (
                  <ShotStage slot={activeSlot} />
                )}
              </div>
            </div>

            <p className="mt-4 text-xs text-slate-500">
              {meta.stage === 'raw'
                ? 'This slot renders as a bare frame on the page (no pedestal).'
                : `This slot sits on a ${meta.stage} pedestal so it aligns with its neighbours.`}
            </p>
          </div>

          {/* Actual size context */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">
              How it appears in its real slot width
            </p>
            <div className="grid sm:grid-cols-3 gap-4 items-start">
              {[340, 260, 190].map((w) => (
                <div key={w} className="group">
                  <div style={{ width: '100%', maxWidth: w }}>
                    {meta.stage === 'raw' ? (
                      meta.kind === 'phone' ? (
                        <PhoneShot slot={activeSlot} className="w-[130px]" />
                      ) : (
                        <BrowserShot slot={activeSlot} bodyRatio="1600 / 898" />
                      )
                    ) : (
                      <ShotStage slot={activeSlot} />
                    )}
                  </div>
                  <p className="mt-2 text-[11px] text-slate-400">{w}px wide</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Controls */}
        <aside className="k-card-lift p-5 h-fit sticky top-24 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-slate-900">Adjust</h2>
            <button type="button" onClick={resetSlot} className="text-xs text-teal-700 hover:underline">
              Reset slot
            </button>
          </div>

          <label className="block text-sm">
            <span className="text-slate-600">Image</span>
            <select
              value={current.src}
              onChange={(e) => patch({ src: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              {SHOT_LIBRARY[meta.kind].map((option) => (
                <option key={option.src} value={option.src}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={centerShot}
            className="k-btn-outline w-full text-sm py-2 justify-center"
          >
            <Crosshair className="w-4 h-4" />
            Center this image
          </button>

          <SliderRow
            label="Position X"
            value={current.objectPositionX}
            min={0}
            max={100}
            step={1}
            suffix="%"
            onChange={(v) => patch({ objectPositionX: v })}
          />
          <SliderRow
            label="Position Y"
            value={current.objectPositionY}
            min={0}
            max={100}
            step={1}
            suffix="%"
            onChange={(v) => patch({ objectPositionY: v })}
          />
          <SliderRow
            label="Zoom (scale)"
            value={current.scale}
            min={0.6}
            max={2}
            step={0.01}
            onChange={(v) => patch({ scale: v })}
          />

          <label className="block text-sm">
            <span className="text-slate-600">Object fit</span>
            <select
              value={current.objectFit}
              onChange={(e) => patch({ objectFit: e.target.value as ShotConfig['objectFit'] })}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="cover">cover (fill frame, may crop)</option>
              <option value="contain">contain (show all, may letterbox)</option>
            </select>
          </label>

          <div className="rounded-lg bg-slate-900 text-slate-100 p-3 text-[11px] font-mono leading-relaxed overflow-x-auto">
            <pre>{JSON.stringify(current, null, 2)}</pre>
          </div>

          <p className="text-xs text-slate-500">
            Tune every slot, then hit <strong>Copy all values</strong> and paste the result back to
            me — I&apos;ll bake it into{' '}
            <code className="bg-slate-100 px-1 rounded">shot-config.ts</code> so it ships for
            everyone.
          </p>
        </aside>
      </div>
    </div>
  );
}
