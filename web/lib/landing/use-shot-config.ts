'use client';

import { useEffect, useState } from 'react';
import {
  SHOT_CONFIG_BY_ID,
  SHOT_PREVIEW_STORAGE_KEY,
  type ShotConfig,
  type ShotSlotId,
} from '@/lib/landing/shot-config';

const UPDATE_EVENT = 'kavach-shot-config-updated';

function readOverrides(): Partial<Record<ShotSlotId, ShotConfig>> {
  return {};
}

export function useShotConfig(slot: ShotSlotId): ShotConfig {
  const [config, setConfig] = useState<ShotConfig>(SHOT_CONFIG_BY_ID[slot]);

  useEffect(() => {
    const apply = () => {
      const overrides = readOverrides();
      setConfig({ ...SHOT_CONFIG_BY_ID[slot], ...(overrides[slot] ?? {}) });
    };

    apply();
    window.addEventListener('storage', apply);
    window.addEventListener(UPDATE_EVENT, apply);
    return () => {
      window.removeEventListener('storage', apply);
      window.removeEventListener(UPDATE_EVENT, apply);
    };
  }, [slot]);

  return config;
}

export function saveShotOverrides(overrides: Partial<Record<ShotSlotId, ShotConfig>>) {
  localStorage.setItem(SHOT_PREVIEW_STORAGE_KEY, JSON.stringify(overrides));
  window.dispatchEvent(new Event(UPDATE_EVENT));
}

export function clearShotOverrides() {
  localStorage.removeItem(SHOT_PREVIEW_STORAGE_KEY);
  window.dispatchEvent(new Event(UPDATE_EVENT));
}
