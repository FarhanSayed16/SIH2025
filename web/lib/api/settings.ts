/**
 * User settings (accessibility, language) — GET/PUT /api/settings
 */

import { apiClient, ApiResponse } from './client';

export type AccessibilityPayload = {
  highContrast?: boolean;
  fontSize?: 'small' | 'medium' | 'large' | 'xlarge';
  reducedMotion?: boolean;
  screenReader?: boolean;
  colorBlindMode?: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
};

export type UserSettingsPayload = {
  language?: string;
  accessibility?: AccessibilityPayload;
};

export async function getUserSettings(): Promise<ApiResponse<UserSettingsPayload>> {
  return apiClient.get<UserSettingsPayload>('/settings');
}

export async function updateAccessibilitySettings(
  body: AccessibilityPayload
): Promise<ApiResponse<UserSettingsPayload>> {
  return apiClient.put<UserSettingsPayload>('/settings/accessibility', body);
}

export async function updateLanguagePreference(
  language: string
): Promise<ApiResponse<UserSettingsPayload>> {
  return apiClient.put<UserSettingsPayload>('/settings/language', { language });
}
