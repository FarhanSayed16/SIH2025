/**
 * Drills API endpoints — aligned with backend Drill model statuses/fields.
 */

import { apiClient, ApiResponse } from './client';

/** Backend Drill.status enum (plus legacy UI alias `active`). */
export type DrillStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'active';

export interface Drill {
  _id: string;
  /** Prefer institutionId; schoolId kept for older callers. */
  institutionId?: string | { _id?: string; name?: string };
  schoolId?: string;
  type: 'fire' | 'earthquake' | 'flood' | 'cyclone' | 'stampede' | 'heatwave';
  scheduledAt: string;
  status: DrillStatus;
  duration?: number;
  actualStart?: string | null;
  triggeredAt?: string | null;
  completedAt?: string | null;
  /** @deprecated Alias of completedAt — do not invent this client-side. */
  completionTime?: string | null;
  participants?: Array<{
    userId: string;
    role?: string;
    acknowledged?: boolean;
    acknowledgedAt?: string;
    completedAt?: string | null;
    responseTime?: number;
    evacuationTime?: number;
    score?: number;
  }> | string[];
  /** Legacy UI field — prefer participant acknowledged flags from API. */
  acknowledgedBy?: string[];
  participantSelection?: {
    type: 'all' | 'class' | 'grade' | 'specific';
    classIds?: string[];
    grades?: string[];
    userIds?: string[];
  };
  results?: {
    totalParticipants?: number;
    completedParticipants?: number;
    avgEvacuationTime?: number | null;
    participationRate?: number;
    routeEfficiency?: number;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateDrillRequest {
  schoolId?: string;
  institutionId?: string;
  type: Drill['type'];
  scheduledAt: string;
  classId?: string;
  participantSelection?: {
    type: 'all' | 'class' | 'grade' | 'specific';
    classIds?: string[];
    grades?: string[];
    userIds?: string[];
  };
}

/** Map legacy `active` → canonical `in_progress` for filters/UI. */
export function normalizeDrillStatus(status: string | undefined | null): DrillStatus {
  if (status === 'active') return 'in_progress';
  if (
    status === 'scheduled' ||
    status === 'in_progress' ||
    status === 'completed' ||
    status === 'cancelled'
  ) {
    return status;
  }
  return (status as DrillStatus) || 'scheduled';
}

export function isDrillInProgress(status: string | undefined | null): boolean {
  return normalizeDrillStatus(status) === 'in_progress';
}

export function normalizeDrill(raw: any): Drill {
  const completedAt = raw?.completedAt ?? raw?.completionTime ?? null;
  const institutionId = raw?.institutionId ?? raw?.schoolId;
  const schoolId =
    raw?.schoolId ??
    (typeof institutionId === 'string' ? institutionId : institutionId?._id);

  return {
    ...raw,
    institutionId,
    schoolId,
    status: normalizeDrillStatus(raw?.status),
    completedAt,
    completionTime: completedAt,
    actualStart: raw?.actualStart ?? null,
  } as Drill;
}

/**
 * Backend get/create/trigger/end wrap the document as `{ drill }`.
 * List/paginated responses return a bare array.
 */
export function unwrapDrillPayload(data: unknown): Drill | null {
  if (!data) return null;
  if (Array.isArray(data)) return null;
  if (typeof data === 'object' && data !== null && 'drill' in data) {
    const nested = (data as { drill?: unknown }).drill;
    if (nested) return normalizeDrill(nested);
    return null;
  }
  if (typeof data === 'object' && data !== null && '_id' in data) {
    return normalizeDrill(data);
  }
  return null;
}

export function unwrapDrillList(data: unknown): Drill[] {
  if (Array.isArray(data)) return data.map(normalizeDrill);
  if (data && typeof data === 'object' && Array.isArray((data as any).drills)) {
    return (data as any).drills.map(normalizeDrill);
  }
  return [];
}

/** Actual elapsed minutes when both timestamps exist; else undefined (never invent 5). */
export function drillActualDurationMinutes(drill: Pick<Drill, 'actualStart' | 'completedAt' | 'completionTime' | 'scheduledAt'>): number | undefined {
  const end = drill.completedAt ?? drill.completionTime;
  const start = drill.actualStart;
  if (start && end) {
    return Math.max(
      0,
      Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000)
    );
  }
  return undefined;
}

/** Human-readable participant scope for list/detail rows. */
export function formatParticipantScope(
  selection?: Drill['participantSelection'] | null
): string {
  if (!selection || selection.type === 'all') {
    return 'Institution-wide';
  }
  if (selection.type === 'class') {
    const n = selection.classIds?.length ?? 0;
    if (n === 0) return 'Class selection (empty)';
    if (n === 1) return 'Selected class';
    return `${n} selected classes`;
  }
  if (selection.type === 'grade') {
    const grades = selection.grades?.filter(Boolean) ?? [];
    return grades.length > 0 ? `Grades: ${grades.join(', ')}` : 'Grade selection';
  }
  if (selection.type === 'specific') {
    const n = selection.userIds?.length ?? 0;
    return n > 0 ? `${n} specific users` : 'Specific users';
  }
  return String(selection.type);
}

/** Count acknowledgements from participant objects; null when unknown. */
export function countAcknowledgedParticipants(drill: Drill): number | null {
  const parts = drill.participants;
  if (Array.isArray(parts) && parts.length > 0 && typeof parts[0] === 'object') {
    return (parts as Array<{ acknowledged?: boolean }>).filter((p) => p.acknowledged).length;
  }
  if (Array.isArray(drill.acknowledgedBy)) return drill.acknowledgedBy.length;
  return null;
}

export function formatDrillTypeLabel(type?: string | null): string {
  if (!type) return 'Drill';
  return `${type.charAt(0).toUpperCase()}${type.slice(1)}`;
}

function withInstitutionBody(data: CreateDrillRequest) {
  return {
    ...data,
    institutionId: data.institutionId || data.schoolId,
  };
}

async function mapDrillResponse(promise: Promise<ApiResponse<any>>): Promise<ApiResponse<Drill>> {
  const response = await promise;
  const drill = unwrapDrillPayload(response.data);
  return { ...response, data: drill ?? undefined };
}

export const drillsApi = {
  list: async (schoolId?: string): Promise<ApiResponse<Drill[]>> => {
    const query = schoolId ? `?schoolId=${schoolId}` : '';
    const response = await apiClient.get<any>(`/drills${query}`);
    return { ...response, data: unwrapDrillList(response.data) };
  },

  create: async (data: CreateDrillRequest): Promise<ApiResponse<Drill>> => {
    return mapDrillResponse(apiClient.post('/drills', withInstitutionBody(data)));
  },

  getById: async (id: string): Promise<ApiResponse<Drill>> => {
    return mapDrillResponse(apiClient.get(`/drills/${id}`));
  },

  trigger: async (id: string): Promise<ApiResponse<Drill>> => {
    return mapDrillResponse(apiClient.post(`/drills/${id}/trigger`));
  },

  getActive: async (): Promise<ApiResponse<{ drills: Drill[] }>> => {
    const response = await apiClient.get<any>('/drills/active');
    const drills = unwrapDrillList(response.data?.drills ?? response.data);
    return { ...response, data: { drills } };
  },

  getParticipants: async (id: string): Promise<ApiResponse<any>> => {
    return apiClient.get<any>(`/drills/${id}/participants`);
  },

  getSummary: async (id: string): Promise<ApiResponse<any>> => {
    return apiClient.get<any>(`/drills/${id}/summary`);
  },

  end: async (id: string): Promise<ApiResponse<Drill>> => {
    return mapDrillResponse(apiClient.post(`/drills/${id}/end`));
  },
};
