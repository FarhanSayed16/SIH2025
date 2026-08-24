/**
 * Kavach logo crop settings — one source of truth for web placements.
 * Tune visually at /logo-preview, then paste exported values here.
 */

export const LOGO_SRC = '/kavach-logo.jpeg';

export type LogoSlotId =
  | 'nav'
  | 'mobileMenu'
  | 'login'
  | 'sidebar'
  | 'footer'
  | 'splash';

export interface LogoCropConfig {
  /** Display box width (px) */
  width: number;
  /** Display box height (px) */
  height: number;
  borderRadius: number;
  objectFit: 'contain' | 'cover' | 'scale-down' | 'none';
  /** 0–100 — maps to CSS object-position X% */
  objectPositionX: number;
  /** 0–100 — maps to CSS object-position Y% */
  objectPositionY: number;
  /** Extra zoom inside the box (1 = 100%) */
  scale: number;
  padding: number;
  background: string;
}

export interface LogoSlotDefinition {
  id: LogoSlotId;
  label: string;
  context: string;
  config: LogoCropConfig;
}

export const LOGO_SLOTS: LogoSlotDefinition[] = [
  {
    id: 'nav',
    label: 'Landing nav',
    context: 'Top-left on desktop & mobile header',
    config: {
      width: 36,
      height: 35,
      borderRadius: 1,
      objectFit: 'contain',
      objectPositionX: 50,
      objectPositionY: 50,
      scale: 1.43,
      padding: 0,
      background: 'transparent',
    },
  },
  {
    id: 'mobileMenu',
    label: 'Mobile menu',
    context: 'Logo in the open hamburger drawer',
    config: {
      width: 44,
      height: 44,
      borderRadius: 10,
      objectFit: 'contain',
      objectPositionX: 50,
      objectPositionY: 45,
      scale: 1.69,
      padding: 4,
      background: '#f0fdfa',
    },
  },
  {
    id: 'login',
    label: 'Login page',
    context: 'Staff login card header',
    config: {
      width: 64,
      height: 64,
      borderRadius: 12,
      objectFit: 'contain',
      objectPositionX: 50,
      objectPositionY: 48,
      scale: 1.42,
      padding: 4,
      background: 'transparent',
    },
  },
  {
    id: 'sidebar',
    label: 'Dashboard sidebar',
    context: 'Collapsed / expanded admin sidebar',
    config: {
      width: 40,
      height: 40,
      borderRadius: 8,
      objectFit: 'contain',
      objectPositionX: 50,
      objectPositionY: 50,
      scale: 1.56,
      padding: 2,
      background: 'transparent',
    },
  },
  {
    id: 'footer',
    label: 'Landing footer',
    context: 'Footer brand mark',
    config: {
      width: 32,
      height: 32,
      borderRadius: 8,
      objectFit: 'contain',
      objectPositionX: 50,
      objectPositionY: 50,
      scale: 1.35,
      padding: 0,
      background: 'transparent',
    },
  },
  {
    id: 'splash',
    label: 'Mobile app splash',
    context: 'Flutter splash / login (reference values for mobile)',
    config: {
      width: 96,
      height: 97,
      borderRadius: 48,
      objectFit: 'contain',
      objectPositionX: 53,
      objectPositionY: 47,
      scale: 1.41,
      padding: 8,
      background: '#ecfdf5',
    },
  },
];

export const LOGO_CONFIG_BY_ID = Object.fromEntries(
  LOGO_SLOTS.map((slot) => [slot.id, slot.config])
) as Record<LogoSlotId, LogoCropConfig>;

export const LOGO_PREVIEW_STORAGE_KEY = 'kavach-logo-preview-overrides';

export function configToCss(config: LogoCropConfig): Record<string, string | number | undefined> {
  return {
    width: config.width,
    height: config.height,
    padding: config.padding,
    borderRadius: config.borderRadius,
    background: config.background === 'transparent' ? undefined : config.background,
    objectFit: config.objectFit,
    objectPosition: `${config.objectPositionX}% ${config.objectPositionY}%`,
    transform: config.scale !== 1 ? `scale(${config.scale})` : undefined,
  };
}

export function exportLogoConfigSnippet(
  overrides: Partial<Record<LogoSlotId, LogoCropConfig>>
): string {
  const merged = LOGO_SLOTS.map((slot) => ({
    ...slot,
    config: overrides[slot.id] ?? slot.config,
  }));

  const lines = merged.map(
    (slot) => `  // ${slot.label}\n  ${slot.id}: ${JSON.stringify(slot.config, null, 2).replace(/\n/g, '\n  ')}`
  );

  return `// Paste into web/lib/branding/logo-config.ts (replace each slot.config)\n${lines.join('\n\n')}`;
}
