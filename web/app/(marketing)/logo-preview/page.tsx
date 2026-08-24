'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  LOGO_SLOTS,
  LOGO_SRC,
  LOGO_PREVIEW_STORAGE_KEY,
  exportLogoConfigSnippet,
  type LogoCropConfig,
  type LogoSlotId,
} from '@/lib/branding/logo-config';
import { clearLogoOverrides, saveLogoOverrides } from '@/lib/branding/use-logo-config';
import { KavachLogo } from '@/components/branding/KavachLogo';
import { Copy, RotateCcw, Check } from 'lucide-react';

const DEFAULT_SLOT: LogoSlotId = 'nav';

function cloneSlots(): Record<LogoSlotId, LogoCropConfig> {
  return Object.fromEntries(LOGO_SLOTS.map((s) => [s.id, { ...s.config }])) as Record<
    LogoSlotId,
    LogoCropConfig
  >;
}

function loadInitial(): Record<LogoSlotId, LogoCropConfig> {
  const base = cloneSlots();
  if (typeof window === 'undefined') return base;
  try {
    const raw = localStorage.getItem(LOGO_PREVIEW_STORAGE_KEY);
    if (!raw) return base;
    const overrides = JSON.parse(raw) as Partial<Record<LogoSlotId, LogoCropConfig>>;
    for (const slot of LOGO_SLOTS) {
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

function PreviewFrame({
  title,
  children,
  dark,
}: {
  title: string;
  children: React.ReactNode;
  dark?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${dark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}
    >
      <p className={`text-xs font-semibold uppercase tracking-wider mb-3 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
        {title}
      </p>
      {children}
    </div>
  );
}

export default function LogoPreviewPage() {
  const [activeSlot, setActiveSlot] = useState<LogoSlotId>(DEFAULT_SLOT);
  const [configs, setConfigs] = useState<Record<LogoSlotId, LogoCropConfig>>(cloneSlots);
  const [copied, setCopied] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setConfigs(loadInitial());
    setHydrated(true);
  }, []);

  const current = configs[activeSlot];
  const slotMeta = LOGO_SLOTS.find((s) => s.id === activeSlot)!;

  const patch = useCallback(
    (partial: Partial<LogoCropConfig>) => {
      setConfigs((prev) => {
        const next = {
          ...prev,
          [activeSlot]: { ...prev[activeSlot], ...partial },
        };
        saveLogoOverrides(next);
        return next;
      });
    },
    [activeSlot]
  );

  const resetSlot = () => {
    const defaults = cloneSlots();
    setConfigs((prev) => {
      const next = { ...prev, [activeSlot]: defaults[activeSlot] };
      saveLogoOverrides(next);
      return next;
    });
  };

  const resetAll = () => {
    clearLogoOverrides();
    setConfigs(cloneSlots());
  };

  const exportSnippet = useMemo(() => exportLogoConfigSnippet(configs), [configs]);

  const copyExport = async () => {
    await navigator.clipboard.writeText(exportSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">
        Loading logo preview…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display font-bold text-xl text-slate-900">Kavach logo preview</h1>
            <p className="text-sm text-slate-500">
              Adjust crop per placement · changes apply live on the site (saved in this browser)
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
              {copied ? 'Copied' : 'Copy config'}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8 grid lg:grid-cols-[280px_1fr_320px] gap-6">
        {/* Slot list */}
        <aside className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Placements</p>
          {LOGO_SLOTS.map((slot) => (
            <button
              key={slot.id}
              type="button"
              onClick={() => setActiveSlot(slot.id)}
              className={`w-full text-left rounded-xl border px-3 py-3 transition-colors ${
                activeSlot === slot.id
                  ? 'border-teal-600 bg-teal-50'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <p className="font-semibold text-sm text-slate-900">{slot.label}</p>
              <p className="text-xs text-slate-500 mt-0.5">{slot.context}</p>
            </button>
          ))}
        </aside>

        {/* Live previews */}
        <div className="space-y-4">
          <PreviewFrame title="Source image">
            <div className="flex items-center gap-4">
              <img src={LOGO_SRC} alt="Source" className="w-24 h-24 object-contain border border-slate-200 rounded-lg bg-white" />
              <p className="text-sm text-slate-600">
                File: <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">{LOGO_SRC}</code>
              </p>
            </div>
          </PreviewFrame>

          <PreviewFrame title={`Live preview — ${slotMeta.label}`} dark={activeSlot === 'nav'}>
            <div className="flex items-center gap-3">
              <span
                style={{
                  width: current.width,
                  height: current.height,
                  padding: current.padding,
                  borderRadius: current.borderRadius,
                  background: current.background === 'transparent' ? undefined : current.background,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                <img
                  src={LOGO_SRC}
                  alt="Preview"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: current.objectFit,
                    objectPosition: `${current.objectPositionX}% ${current.objectPositionY}%`,
                    transform: current.scale !== 1 ? `scale(${current.scale})` : undefined,
                  }}
                />
              </span>
              <span className={activeSlot === 'nav' ? 'text-white font-display font-bold text-lg' : 'text-slate-900 font-display font-bold text-lg'}>
                Kavach
              </span>
            </div>
          </PreviewFrame>

          <div className="grid sm:grid-cols-2 gap-4">
            <PreviewFrame title="Nav bar mock">
              <div className="flex items-center justify-between rounded-lg bg-slate-900 px-3 py-2">
                <div className="flex items-center gap-2">
                  <KavachLogo slot="nav" />
                  <span className="text-white font-display font-bold">Kavach</span>
                </div>
                <span className="text-xs text-slate-400">Menu</span>
              </div>
            </PreviewFrame>

            <PreviewFrame title="Mobile drawer mock">
              <div className="rounded-lg border border-slate-100 bg-white p-3">
                <div className="flex items-center gap-2 pb-3 mb-3 border-b border-slate-100">
                  <KavachLogo slot="mobileMenu" />
                  <span className="font-display font-bold text-slate-900">Kavach</span>
                </div>
                <div className="space-y-1 text-sm text-slate-600">
                  <div className="py-2 px-2 rounded-lg bg-slate-50">About</div>
                  <div className="py-2 px-2">Download</div>
                </div>
              </div>
            </PreviewFrame>

            <PreviewFrame title="Login card mock">
              <div className="rounded-lg border border-slate-200 bg-white p-6 text-center">
                <div className="flex justify-center mb-2">
                  <KavachLogo slot="login" />
                </div>
                <p className="font-bold text-slate-900">Kavach</p>
                <p className="text-xs text-slate-500">Admin Dashboard</p>
              </div>
            </PreviewFrame>

            <PreviewFrame title="Footer mock">
              <div className="rounded-lg bg-[#0b1220] p-4 flex items-center gap-2">
                <KavachLogo slot="footer" />
                <span className="text-white font-display font-bold">Kavach</span>
              </div>
            </PreviewFrame>
          </div>
        </div>

        {/* Controls */}
        <aside className="k-card-lift p-5 h-fit sticky top-24 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-slate-900">{slotMeta.label}</h2>
            <button type="button" onClick={resetSlot} className="text-xs text-teal-700 hover:underline">
              Reset slot
            </button>
          </div>

          <SliderRow label="Width (px)" value={current.width} min={24} max={128} step={1} onChange={(v) => patch({ width: v })} />
          <SliderRow label="Height (px)" value={current.height} min={24} max={128} step={1} onChange={(v) => patch({ height: v })} />
          <SliderRow label="Border radius" value={current.borderRadius} min={0} max={64} step={1} onChange={(v) => patch({ borderRadius: v })} />
          <SliderRow label="Padding" value={current.padding} min={0} max={16} step={1} onChange={(v) => patch({ padding: v })} />
          <SliderRow label="Position X" value={current.objectPositionX} min={0} max={100} step={1} suffix="%" onChange={(v) => patch({ objectPositionX: v })} />
          <SliderRow label="Position Y" value={current.objectPositionY} min={0} max={100} step={1} suffix="%" onChange={(v) => patch({ objectPositionY: v })} />
          <SliderRow label="Zoom (scale)" value={current.scale} min={0.5} max={2} step={0.01} onChange={(v) => patch({ scale: v })} />

          <label className="block text-sm">
            <span className="text-slate-600">Object fit</span>
            <select
              value={current.objectFit}
              onChange={(e) => patch({ objectFit: e.target.value as LogoCropConfig['objectFit'] })}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="contain">contain</option>
              <option value="cover">cover</option>
              <option value="scale-down">scale-down</option>
              <option value="none">none</option>
            </select>
          </label>

          <div className="rounded-lg bg-slate-900 text-slate-100 p-3 text-[11px] font-mono leading-relaxed overflow-x-auto">
            <pre>{JSON.stringify(current, null, 2)}</pre>
          </div>

          <p className="text-xs text-slate-500">
            Click <strong>Copy config</strong> and send the JSON to your developer to bake into{' '}
            <code className="bg-slate-100 px-1 rounded">logo-config.ts</code> and{' '}
            <code className="bg-slate-100 px-1 rounded">logo_config.dart</code>.
          </p>
        </aside>
      </div>
    </div>
  );
}
