/**
 * WB8 scenario progression + gallery caption honesty
 */

export type ScenarioHistoryEntry = {
  scenario: string;
  choice: string;
  consequence: string;
};

export type ScenarioNextLike = {
  nextScenario?: string | null;
  consequence?: string | null;
  options?: string[] | null;
  isGameOver?: boolean;
  safetyScoreSentence?: string | null;
  tip?: string | null;
  quotaLimited?: boolean;
};

/** True only when server explicitly signals quota/fallback mode */
export function isQuotaLimited(result: ScenarioNextLike | null | undefined): boolean {
  return result?.quotaLimited === true;
}

/**
 * Acceptable advance: real text, and either game-over or at least one choice.
 * Quota/fallback never counts as an accepted advance.
 */
export function isValidScenarioAdvance(result: ScenarioNextLike | null | undefined): boolean {
  if (!result || isQuotaLimited(result)) return false;
  const text = String(result.nextScenario ?? '').trim();
  if (!text) return false;
  if (result.isGameOver === true) return true;
  return Array.isArray(result.options) && result.options.some((o) => String(o || '').trim().length > 0);
}

export function normalizeScenarioOptions(options: unknown): string[] {
  if (!Array.isArray(options)) return [];
  return options.map((o) => String(o ?? '').trim()).filter(Boolean);
}

/** Build accepted history only after a successful response (with its consequence). */
export function appendAcceptedStep(
  history: ScenarioHistoryEntry[],
  pending: { scenario: string; choice: string },
  consequence: string | null | undefined
): ScenarioHistoryEntry[] {
  return [
    ...history,
    {
      scenario: pending.scenario,
      choice: pending.choice,
      consequence: consequence?.trim() ? consequence : '',
    },
  ];
}

/**
 * Corrected web gallery labels from WEB_UI_UX_ENHANCEMENT_PLAN inventory (W01–W18).
 * Do not use the previous incorrect marketing captions.
 */
export const WEB_GALLERY_CORRECT_LABELS: Record<string, string> = {
  'teacher-1.png': 'Teacher — Dashboard',
  'teacher-2.png': 'Teacher — My Classes',
  'teacher-3.png': 'Teacher — Class detail (Drills)',
  'teacher-4.png': 'Teacher — Class detail (QR)',
  'teacher-5.png': 'Teacher — Analytics (Overview)',
  'teacher-6.png': 'Teacher — Analytics (Students)',
  'teacher-7.png': 'Teacher — Analytics (Performance)',
  'teacher-8.png': 'Teacher — Drill Management (Active)',
  'teacher-9.png': 'Teacher — Drill Management (History)',
  'teacher-10.png': 'Teacher — Broadcast history',
  'teacher-11.png': 'Teacher — Safety scenario (choice)',
  'teacher-12.png': 'Teacher — Map',
  'admin-16.png': 'Admin — Institution analytics (drills)',
  'admin-17.png': 'Admin — Institution analytics (charts)',
  'admin-18.png': 'Admin — Devices',
  'admin-19.png': 'Admin — Safety scenario (outcome)',
  'parent-14.png': 'Parent — Verify Student',
  'parent-15.png': 'Parent — Dashboard',
};

export function galleryLabelForSrc(src: string): string | undefined {
  const file = src.split('/').pop() || '';
  return WEB_GALLERY_CORRECT_LABELS[file];
}

export function feedbackSectionTitle(): string {
  return 'Feedback on your choices';
}
