/**
 * Kavach landing screenshot placement settings — one source of truth.
 * Tune visually at /shots-preview, then paste exported values here.
 */

export type ShotKind = 'phone' | 'browser';

export type ShotSlotId =
  // Hero
  | 'heroDashboard'
  | 'heroPhone'
  // Prevent / Detect / Respond strip
  | 'pillarPrevent'
  | 'pillarDetect'
  | 'pillarRespond'
  // Roles
  | 'roleStudent'
  | 'roleTeacher'
  | 'roleAdmin'
  | 'roleParent'
  // Platform capability tabs
  | 'capLearning'
  | 'capAi'
  | 'capOps'
  | 'capIot'
  // Architecture
  | 'archMobile'
  | 'archWeb'
  | 'archIot'
  // Download band
  | 'downloadLogin'
  | 'downloadHome'
  | 'downloadParent'
  // Institutions CTA
  | 'institutionsAnalytics';

export interface ShotConfig {
  /** Which capture fills this slot */
  src: string;
  objectFit: 'cover' | 'contain';
  /** 0–100 — maps to CSS object-position X% */
  objectPositionX: number;
  /** 0–100 — maps to CSS object-position Y% */
  objectPositionY: number;
  /** Extra zoom inside the frame (1 = 100%) */
  scale: number;
}

export interface ShotSlotDefinition {
  id: ShotSlotId;
  label: string;
  context: string;
  kind: ShotKind;
  alt: string;
  /** Fake address bar text for browser frames */
  url?: string;
  /** wide/tall = sits on a ShotStage pedestal · raw = bare frame (hero, download) */
  stage: 'wide' | 'tall' | 'raw';
  config: ShotConfig;
}

/** Every capture available to drop into a slot. */
export const SHOT_LIBRARY: Record<ShotKind, { src: string; label: string }[]> = {
  phone: [
    { src: '/landing/student-home.jpg', label: 'Student — home & score' },
    { src: '/landing/student-actions.jpg', label: 'Student — quick actions' },
    { src: '/landing/student-learn.jpg', label: 'Student — learn tracks' },
    { src: '/landing/student-modules.jpg', label: 'Student — NDMA modules' },
    { src: '/landing/student-ask.jpg', label: 'Student — Ask Kavach' },
    { src: '/landing/student-signlang.jpg', label: 'Student — sign language' },
    { src: '/landing/student-login.jpg', label: 'Student — login / join class' },
    { src: '/landing/parent-mobile.jpg', label: 'Parent — mobile dashboard' },
  ],
  browser: [
    { src: '/landing/teacher-dashboard-content.png', label: 'Teacher — dashboard (cropped)' },
    { src: '/landing/teacher-classes-content.png', label: 'Teacher — my classes (cropped)' },
    { src: '/landing/teacher-drills-content.png', label: 'Teacher — drills (cropped)' },
    { src: '/landing/teacher-analytics-content.png', label: 'Teacher — analytics (cropped)' },
    { src: '/landing/teacher-scenario-content.png', label: 'Teacher — AI scenario (cropped)' },
    { src: '/landing/admin-analytics-content.png', label: 'Admin — analytics (cropped)' },
    { src: '/landing/admin-charts-content.png', label: 'Admin — charts (cropped)' },
    { src: '/landing/admin-iot-content.png', label: 'Admin — IoT devices (cropped)' },
    { src: '/landing/parent-dashboard-content.png', label: 'Parent — dashboard (cropped)' },
    { src: '/landing/parent-verify-content.png', label: 'Parent — verify student (cropped)' },
    { src: '/landing/teacher-dashboard.png', label: 'Teacher — dashboard (full, with sidebar)' },
    { src: '/landing/teacher-classes.png', label: 'Teacher — my classes (full)' },
    { src: '/landing/teacher-drills.png', label: 'Teacher — drills (full)' },
    { src: '/landing/teacher-analytics.png', label: 'Teacher — analytics (full)' },
    { src: '/landing/teacher-scenario.png', label: 'Teacher — AI scenario (full)' },
    { src: '/landing/admin-analytics.png', label: 'Admin — analytics (full)' },
    { src: '/landing/admin-charts.png', label: 'Admin — charts (full)' },
    { src: '/landing/admin-iot.png', label: 'Admin — IoT devices (full)' },
    { src: '/landing/parent-dashboard.png', label: 'Parent — dashboard (full)' },
    { src: '/landing/parent-verify.png', label: 'Parent — verify student (full)' },
  ],
};

const centered = (src: string): ShotConfig => ({
  src,
  objectFit: 'cover',
  objectPositionX: 50,
  objectPositionY: 0,
  scale: 1,
});

/** For browser screenshots: shows content from top-left, scales to fill width */
const topLeft = (src: string, scale = 1): ShotConfig => ({
  src,
  objectFit: 'cover',
  objectPositionX: 0,
  objectPositionY: 0,
  scale,
});

export const SHOT_SLOTS: ShotSlotDefinition[] = [
  {
    id: 'heroDashboard',
    label: 'Hero — dashboard',
    context: 'Main glass panel on the right of the hero',
    kind: 'browser',
    alt: 'Kavach staff dashboard showing drills and active alerts',
    url: 'kavach.app/dashboard',
    stage: 'raw',
    config: topLeft('/landing/hero-dashboard-new.png'),
  },
  {
    id: 'heroPhone',
    label: 'Hero — phone',
    context: 'Phone beside the hero dashboard panel',
    kind: 'phone',
    alt: 'Kavach student app with preparedness score and daily safety tip',
    stage: 'raw',
    config: centered('/landing/student-home.jpg'),
  },
  {
    id: 'pillarPrevent',
    label: 'Prevent tile',
    context: 'Approach strip — first tile',
    kind: 'phone',
    alt: 'NDMA learning modules for cyclone, flood, and lightning safety',
    stage: 'wide',
    config: {
      src: '/landing/prevent-new-8.jpg',
      objectFit: 'cover',
      objectPositionX: 50,
      objectPositionY: 0,
      scale: 1.08,
    },
  },
  {
    id: 'pillarDetect',
    label: 'Detect tile',
    context: 'Approach strip — second tile',
    kind: 'browser',
    alt: 'Live IoT sensor monitoring for fire and multi-sensor nodes',
    url: 'kavach.app/devices',
    stage: 'wide',
    config: topLeft('/landing/admin-iot-content.png'),
  },
  {
    id: 'pillarRespond',
    label: 'Respond tile',
    context: 'Approach strip — third tile',
    kind: 'browser',
    alt: 'Fire drills in progress with live participant counts',
    url: 'kavach.app/drills',
    stage: 'wide',
    config: topLeft('/landing/teacher-drills-content.png'),
  },
  {
    id: 'roleStudent',
    label: 'Role — Students',
    context: 'Who it\u2019s for card 1',
    kind: 'phone',
    alt: 'Student home with preparedness score, safety tip, and emergency shortcut',
    stage: 'wide',
    config: centered('/landing/role-student-new.jpg'),
  },
  {
    id: 'roleTeacher',
    label: 'Role — Teachers',
    context: 'Who it\u2019s for card 2',
    kind: 'browser',
    alt: 'Teacher drill management with live fire drills in progress',
    url: 'kavach.app/drills',
    stage: 'wide',
    config: topLeft('/landing/role-teacher-new.png'),
  },
  {
    id: 'roleAdmin',
    label: 'Role — School admins',
    context: 'Who it\u2019s for card 3',
    kind: 'browser',
    alt: 'Admin analytics with participation trend and drill type distribution',
    url: 'kavach.app/analytics',
    stage: 'wide',
    config: topLeft('/landing/admin-charts-content.png'),
  },
  {
    id: 'roleParent',
    label: 'Role — Parents',
    context: 'Who it\u2019s for card 4',
    kind: 'browser',
    alt: 'Parent dashboard showing linked children and safety status',
    url: 'kavach.app/parent',
    stage: 'wide',
    config: topLeft('/landing/parent-dashboard-content.png'),
  },
  {
    id: 'capLearning',
    label: 'Platform — Learning',
    context: 'Capability tab 1 preview',
    kind: 'phone',
    alt: 'NDMA, NDRF, and sign-language learning modules in the student app',
    stage: 'wide',
    config: {
      src: '/landing/student-learn.jpg',
      objectFit: 'cover',
      objectPositionX: 50,
      objectPositionY: 0,
      scale: 1.06,
    },
  },
  {
    id: 'capAi',
    label: 'Platform — AI',
    context: 'Capability tab 2 preview',
    kind: 'phone',
    alt: 'Ask Kavach AI assistant answering in English, Hindi, and Marathi',
    stage: 'wide',
    config: {
      src: '/landing/student-ask.jpg',
      objectFit: 'cover',
      objectPositionX: 50,
      objectPositionY: 0,
      scale: 1.06,
    },
  },
  {
    id: 'capOps',
    label: 'Platform — Operations',
    context: 'Capability tab 3 preview',
    kind: 'browser',
    alt: 'Drill management with active fire drills and participant counts',
    url: 'kavach.app/drills',
    stage: 'wide',
    config: topLeft('/landing/teacher-drills-content.png'),
  },
  {
    id: 'capIot',
    label: 'Platform — IoT',
    context: 'Capability tab 4 preview',
    kind: 'browser',
    alt: 'IoT device monitoring listing multi-sensor and fire-sensor nodes',
    url: 'kavach.app/devices',
    stage: 'wide',
    config: topLeft('/landing/admin-iot-content.png'),
  },
  {
    id: 'archMobile',
    label: 'Architecture — Mobile',
    context: 'How it works column 1',
    kind: 'phone',
    alt: 'Student quick actions for drills, modules, quizzes, and hazard checks',
    stage: 'wide',
    config: centered('/landing/student-actions.jpg'),
  },
  {
    id: 'archWeb',
    label: 'Architecture — Web',
    context: 'How it works column 2',
    kind: 'browser',
    alt: 'Class management with join codes and QR approvals',
    url: 'kavach.app/classes',
    stage: 'wide',
    config: topLeft('/landing/teacher-classes-content.png'),
  },
  {
    id: 'archIot',
    label: 'Architecture — Sensors',
    context: 'How it works column 3',
    kind: 'browser',
    alt: 'IoT sensor nodes monitored from the admin console',
    url: 'kavach.app/devices',
    stage: 'wide',
    config: topLeft('/landing/admin-iot-content.png'),
  },
  {
    id: 'downloadLogin',
    label: 'Download — left phone',
    context: 'Download band, tilted back-left',
    kind: 'phone',
    alt: 'Kavach student login with join-a-class options',
    stage: 'raw',
    config: centered('/landing/student-login.jpg'),
  },
  {
    id: 'downloadHome',
    label: 'Download — centre phone',
    context: 'Download band, front and centre',
    kind: 'phone',
    alt: 'Kavach student home with preparedness score',
    stage: 'raw',
    config: centered('/landing/student-home.jpg'),
  },
  {
    id: 'downloadParent',
    label: 'Download — right phone',
    context: 'Download band, tilted back-right',
    kind: 'phone',
    alt: 'Kavach parent dashboard tracking linked children',
    stage: 'raw',
    config: centered('/landing/parent-mobile.jpg'),
  },
  {
    id: 'institutionsAnalytics',
    label: 'For schools — analytics',
    context: 'Institutions CTA preview',
    kind: 'browser',
    alt: 'School analytics with participants and evacuation times',
    url: 'kavach.app/analytics',
    stage: 'wide',
    config: topLeft('/landing/admin-analytics-content.png'),
  },
];

export const SHOT_SLOT_BY_ID = Object.fromEntries(
  SHOT_SLOTS.map((slot) => [slot.id, slot])
) as Record<ShotSlotId, ShotSlotDefinition>;

export const SHOT_CONFIG_BY_ID = Object.fromEntries(
  SHOT_SLOTS.map((slot) => [slot.id, slot.config])
) as Record<ShotSlotId, ShotConfig>;

export const SHOT_PREVIEW_STORAGE_KEY = 'kavach-shot-preview-overrides';

export function shotStyle(config: ShotConfig): React.CSSProperties {
  return {
    objectPosition: `${config.objectPositionX}% ${config.objectPositionY}%`,
  };
}

export function exportShotConfigSnippet(
  overrides: Partial<Record<ShotSlotId, ShotConfig>>
): string {
  const lines = SHOT_SLOTS.map((slot) => {
    const config = overrides[slot.id] ?? slot.config;
    const body = JSON.stringify(config, null, 2).replace(/\n/g, '\n    ');
    return `  // ${slot.label} — ${slot.context}\n  ${slot.id}: ${body}`;
  });

  return `// Paste into web/lib/landing/shot-config.ts (replace each slot's config)\n${lines.join(
    '\n\n'
  )}`;
}
