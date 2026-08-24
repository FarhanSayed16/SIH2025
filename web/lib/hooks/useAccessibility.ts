'use client';

/**
 * Accessibility Hook
 * Local defaults, then sync with GET/PUT /api/settings when logged in.
 */

import { useState, useEffect } from 'react';
import { getUserSettings, updateAccessibilitySettings } from '@/lib/api/settings';

export interface AccessibilitySettings {
  highContrast: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'xlarge';
  reducedMotion: boolean;
  focusVisible: boolean;
}

const defaultSettings: AccessibilitySettings = {
  highContrast: false,
  fontSize: 'medium',
  reducedMotion: false,
  focusVisible: true,
};

function hasAuthToken(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(localStorage.getItem('accessToken'));
}

export function useAccessibility() {
  const [settings, setSettings] = useState<AccessibilitySettings>(defaultSettings);

  // Load settings from localStorage, then the API
  useEffect(() => {
    const stored = localStorage.getItem('accessibility-settings');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSettings({ ...defaultSettings, ...parsed });
      } catch (error) {
        console.error('Failed to parse accessibility settings:', error);
      }
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setSettings((prev) => ({ ...prev, reducedMotion: true }));
    }

    if (!hasAuthToken()) return;

    getUserSettings()
      .then((res) => {
        const access = res.data?.accessibility;
        if (!access) return;
        setSettings((prev) => ({
          ...prev,
          highContrast: access.highContrast ?? prev.highContrast,
          fontSize: access.fontSize ?? prev.fontSize,
          reducedMotion: access.reducedMotion ?? prev.reducedMotion,
        }));
      })
      .catch(() => {
        /* stay on local values */
      });
  }, []);

  // Apply settings to document
  useEffect(() => {
    const root = document.documentElement;

    if (settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    root.classList.remove('font-small', 'font-medium', 'font-large', 'font-xlarge');
    root.classList.add(`font-${settings.fontSize}`);

    if (settings.reducedMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }

    if (!settings.focusVisible) {
      root.classList.add('hide-focus-outline');
    } else {
      root.classList.remove('hide-focus-outline');
    }
  }, [settings]);

  const updateSettings = (newSettings: Partial<AccessibilitySettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem('accessibility-settings', JSON.stringify(updated));

    if (!hasAuthToken()) return;

    updateAccessibilitySettings({
      highContrast: updated.highContrast,
      fontSize: updated.fontSize,
      reducedMotion: updated.reducedMotion,
    }).catch(() => {
      /* local copy already saved */
    });
  };

  return {
    settings,
    updateSettings,
  };
}
