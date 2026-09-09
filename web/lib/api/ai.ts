/**
 * AI vision endpoints (Category A)
 * All accept { image: base64 string, mimeType?: string }
 */

import { apiClient } from './client';

export type EvacuationCheckResult = {
  status: 'clear' | 'blocked' | 'partially_blocked' | string;
  reason: string;
  recommendation: string;
};

export type FloorPlanAnalysisResult = {
  assemblyPoints: string[];
  primaryExits: string[];
  secondaryExits: string[];
  bottlenecks: string[];
  summary: string;
};

export type DamageScanResult = {
  damageDetected: boolean;
  severity: 'low' | 'medium' | 'high' | null;
  description: string;
  followUp: string;
};

export type DescribeImageResult = {
  description: string;
};

async function postImage<T>(endpoint: string, imageBase64: string, mimeType = 'image/jpeg'): Promise<T> {
  const res = await apiClient.post<{ data?: T } & T>(endpoint, { image: imageBase64, mimeType });
  const data = (res as any)?.data ?? res;
  return data as T;
}

// Category B: Text & NLP
export type DrillSummaryResult = { summary: string; improvementTip: string };
export type TodaysTipResult = { tip: string; date: string };
export type AskKavachResult = { answer: string };
export type SummariseIncidentResult = { bullets: string[] };
export type DraftAlertResult = { message: string };
export type SummariseGuidelineResult = { bullets: string[] };
export type DrillFeedbackResult = { feedback: string };
export type ScenarioNextResult = {
  nextScenario: string;
  consequence: string | null;
  options: string[];
  isGameOver: boolean;
  safetyScoreSentence: string | null;
  tip: string | null;
  /** Present when Gemini quota/cooldown returned the shared fallback (not a real advance) */
  quotaLimited?: boolean;
};
export type ReportCardResult = {
  grade: string;
  strengths: string[];
  improvements: string[];
  boldNextStep: string;
};

export const aiApi = {
  /** A1: Check if evacuation route is clear / blocked / partially blocked */
  checkEvacuationRoute: (imageBase64: string, mimeType?: string) =>
    postImage<EvacuationCheckResult>('/ai/evacuation/check', imageBase64, mimeType),

  /** A2: Analyze floor plan for assembly points, exits, bottlenecks */
  analyzeFloorPlan: (imageBase64: string, mimeType?: string) =>
    postImage<FloorPlanAnalysisResult>('/ai/floorplan/analyze', imageBase64, mimeType),

  /** A3: Scan for damage (post-drill / post-incident) */
  scanDamage: (imageBase64: string, mimeType?: string) =>
    postImage<DamageScanResult>('/ai/damage/scan', imageBase64, mimeType),

  /** A4: Describe image for accessibility */
  describeImage: (imageBase64: string, mimeType?: string) =>
    postImage<DescribeImageResult>('/ai/describe', imageBase64, mimeType),

  /** B1: Drill report auto-summary */
  summariseDrill: (payload: {
    drillId?: string;
    type?: string;
    participantCount?: number;
    acknowledgedCount?: number;
    avgResponseTimeSeconds?: number;
    durationMinutes?: number;
  }) => apiClient.post<{ data: DrillSummaryResult }>('/ai/drill/summarise', payload).then((r: any) => r.data?.data ?? r.data),

  /** B2: Today's safety tip (cached per day) */
  getTodaysTip: (lang?: string) =>
    apiClient.get<{ data: TodaysTipResult }>(`/ai/tip/today${lang ? `?lang=${encodeURIComponent(lang)}` : ''}`).then((r: any) => r.data?.data ?? r.data),

  /** B4: Ask Kavach (Q&A). O6: optional preferredResponseLang (en, hi, mr) for answer language */
  askKavach: (question: string, preferredResponseLang?: string) =>
    apiClient.post<{ data: AskKavachResult }>('/ai/ask', { question, ...(preferredResponseLang ? { preferredResponseLang } : {}) }).then((r: any) => r.data?.data ?? r.data),

  /** B3: Incident report summariser (3–5 bullets) */
  summariseIncident: (text: string) =>
    apiClient.post<{ data: SummariseIncidentResult }>('/ai/incident/summarise', { text }).then((r: any) => r.data?.data ?? r.data),

  /** B6: AI-generated alert draft (max 160 chars) */
  draftAlertMessage: (type: string, severity: string) =>
    apiClient.post<{ data: DraftAlertResult }>('/ai/alert/draft', { type, severity }).then((r: any) => r.data?.data ?? r.data),

  /** B5: Long guideline summariser (5–7 bullets for teachers) */
  summariseGuideline: (text: string) =>
    apiClient.post<{ data: SummariseGuidelineResult }>('/ai/guideline/summarise', { text }).then((r: any) => r.data?.data ?? r.data),

  /** B7: Personalised drill feedback (one sentence for student) */
  getDrillFeedback: (payload: { acknowledged: boolean; responseTimeSeconds?: number; drillType?: string }) =>
    apiClient.post<{ data: DrillFeedbackResult }>('/ai/drill/feedback', payload).then((r: any) => r.data?.data ?? r.data),

  /** G1: Translate safety text to Hindi/Marathi/Punjabi */
  translate: (text: string, targetLang: string) =>
    apiClient.post<{ data: { translated: string } }>('/ai/translate', { text, targetLang }).then((r: any) => r.data?.data ?? r.data),

  /** G2: Simplify content for lower grade / age */
  simplify: (text: string, ageOrGrade?: number) =>
    apiClient.post<{ data: { simplified: string } }>('/ai/simplify', { text, ageOrGrade: ageOrGrade ?? 8 }).then((r: any) => r.data?.data ?? r.data),

  /** O1: AI Disaster Scenario – next step (first call: no choice; later: choice + previousContext) */
  scenarioNext: (payload: { scenarioId?: string; stepIndex?: number; userChoice?: string; previousContext?: Array<{ scenario?: string; choice?: string; consequence?: string }> }) =>
    apiClient.post<{ data: ScenarioNextResult }>('/ai/scenario/next', payload).then((r: any) => r.data?.data ?? r.data),

  /** O5: AI Safety Report Card for the School (last 30 days stats → grade, strengths, improvements, boldNextStep) */
  reportCard: (institutionId?: string) =>
    apiClient.post<{ data: ReportCardResult }>('/ai/report-card', institutionId ? { institutionId } : {}).then((r: any) => r.data?.data ?? r.data),

  /** O7: AI Crisis Message to Parents – draft short calm message for parents (SMS/push length) */
  draftCrisisParentMessage: (payload: { incidentType?: string; severity?: string; oneLineDescription?: string }) =>
    apiClient.post<{ data: { message: string } }>('/ai/crisis-parent-message', payload).then((r: any) => r.data?.data ?? r.data),
};
