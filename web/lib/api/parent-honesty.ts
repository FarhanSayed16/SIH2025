/**
 * Parent / map honesty helpers (WB6 — WD12, WD13, WD15)
 */

export type ParentSafetyStatus =
  | 'safe'
  | 'in_drill'
  | 'emergency'
  | 'missing'
  | 'at_risk'
  | 'evacuating'
  | 'unknown';

export type StatusProvenance = 'reported' | 'active_drill' | 'unconfirmed' | 'none';

/** Mirror of backend resolveParentSafetyDisplay for client-side normalization. */
export function resolveParentSafetyDisplay(input: {
  safetyStatus?: string | null;
  statusReportedAt?: string | Date | null;
  inActiveDrill?: boolean;
}): { status: ParentSafetyStatus; provenance: StatusProvenance; statusReportedAt: string | Date | null } {
  if (input.inActiveDrill) {
    return {
      status: 'in_drill',
      provenance: 'active_drill',
      statusReportedAt: input.statusReportedAt ?? null,
    };
  }
  if (!input.safetyStatus) {
    return { status: 'unknown', provenance: 'none', statusReportedAt: null };
  }
  if (!input.statusReportedAt) {
    return { status: 'unknown', provenance: 'unconfirmed', statusReportedAt: null };
  }
  const allowed: ParentSafetyStatus[] = [
    'safe',
    'missing',
    'at_risk',
    'evacuating',
    'in_drill',
    'emergency',
  ];
  const status = allowed.includes(input.safetyStatus as ParentSafetyStatus)
    ? (input.safetyStatus as ParentSafetyStatus)
    : 'unknown';
  return {
    status,
    provenance: 'reported',
    statusReportedAt: input.statusReportedAt,
  };
}

export function formatParentStatusLabel(status: string): string {
  switch (status) {
    case 'safe':
      return 'Reported safe';
    case 'in_drill':
      return 'In drill';
    case 'at_risk':
      return 'At risk';
    case 'missing':
      return 'Missing';
    case 'evacuating':
      return 'Evacuating';
    case 'emergency':
      return 'Emergency';
    case 'unknown':
    default:
      return 'Status unavailable';
  }
}

/** Preserve finite zeros; reject non-finite. */
export function hasFiniteCoordinates(
  lat: number | null | undefined,
  lng: number | null | undefined
): boolean {
  return Number.isFinite(lat as number) && Number.isFinite(lng as number);
}

export function childSafetyHref(studentId: string): string {
  return `/parent/children/${studentId}?tab=safety`;
}

export type MapBlueprint = {
  imageUrl?: string;
  bounds?: [number, number, number, number];
  geojson?: unknown;
  width?: number;
  height?: number;
};

export type NormalizedMapData = {
  blueprint: MapBlueprint | null;
  equipment: unknown[];
  exits: unknown[];
  rooms: unknown[];
  hazards: unknown[];
  hasCampusLayers: boolean;
};

/**
 * Unwrap nested floor-plan map-data envelope (or legacy top-level blueprint).
 */
export function normalizeMapDataEnvelope(data: unknown): NormalizedMapData {
  const empty: NormalizedMapData = {
    blueprint: null,
    equipment: [],
    exits: [],
    rooms: [],
    hazards: [],
    hasCampusLayers: false,
  };
  if (!data || typeof data !== 'object') return empty;

  const raw = data as Record<string, any>;
  const nested = raw.blueprint;
  let blueprint: MapBlueprint | null = null;

  if (nested && typeof nested === 'object') {
    blueprint = nested as MapBlueprint;
  } else if (raw.imageUrl || raw.bounds || raw.geojson) {
    blueprint = {
      imageUrl: raw.imageUrl,
      bounds: raw.bounds,
      geojson: raw.geojson,
      width: raw.width,
      height: raw.height,
    };
  }

  const equipment = Array.isArray(raw.equipment) ? raw.equipment : [];
  const exits = Array.isArray(raw.exits) ? raw.exits : [];
  const rooms = Array.isArray(raw.rooms) ? raw.rooms : [];
  const hazards = Array.isArray(raw.hazards) ? raw.hazards : [];

  const bpUsable = Boolean(
    blueprint &&
      ((blueprint.imageUrl && Array.isArray(blueprint.bounds) && blueprint.bounds.length === 4) ||
        blueprint.geojson)
  );

  return {
    blueprint: bpUsable || blueprint?.imageUrl || blueprint?.geojson ? blueprint : blueprint,
    equipment,
    exits,
    rooms,
    hazards,
    hasCampusLayers:
      bpUsable || equipment.length > 0 || exits.length > 0 || rooms.length > 0 || hazards.length > 0,
  };
}

export function deviceHealthColor(status?: string | null): string {
  if (status === 'warning') return '#f59e0b';
  if (status === 'healthy' || status === 'online') return '#22c55e';
  // offline / unknown / anything else — neutral, never invent healthy
  return '#9ca3af';
}
