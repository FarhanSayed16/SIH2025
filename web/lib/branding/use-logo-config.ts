'use client';

import { useEffect, useState } from 'react';
import {
  LOGO_CONFIG_BY_ID,
  LOGO_PREVIEW_STORAGE_KEY,
  type LogoCropConfig,
  type LogoSlotId,
} from '@/lib/branding/logo-config';

function readOverrides(): Partial<Record<LogoSlotId, LogoCropConfig>> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(LOGO_PREVIEW_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Partial<Record<LogoSlotId, LogoCropConfig>>) : {};
  } catch {
    return {};
  }
}

export function useLogoConfig(slot: LogoSlotId): LogoCropConfig {
  const [config, setConfig] = useState<LogoCropConfig>(LOGO_CONFIG_BY_ID[slot]);

  useEffect(() => {
    const apply = () => {
      const overrides = readOverrides();
      setConfig({ ...LOGO_CONFIG_BY_ID[slot], ...(overrides[slot] ?? {}) });
    };

    apply();
    window.addEventListener('storage', apply);
    window.addEventListener('kavach-logo-config-updated', apply);
    return () => {
      window.removeEventListener('storage', apply);
      window.removeEventListener('kavach-logo-config-updated', apply);
    };
  }, [slot]);

  return config;
}

export function saveLogoOverrides(overrides: Partial<Record<LogoSlotId, LogoCropConfig>>) {
  localStorage.setItem(LOGO_PREVIEW_STORAGE_KEY, JSON.stringify(overrides));
  window.dispatchEvent(new Event('kavach-logo-config-updated'));
}

export function clearLogoOverrides() {
  localStorage.removeItem(LOGO_PREVIEW_STORAGE_KEY);
  window.dispatchEvent(new Event('kavach-logo-config-updated'));
}
