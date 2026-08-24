/**
 * Normalize institution / school id from auth user (string or populated {_id}).
 */
export function getInstitutionId(institutionId: unknown): string | undefined {
  if (institutionId == null || institutionId === '') return undefined;
  if (typeof institutionId === 'string') {
    const s = institutionId.trim();
    return s && s !== '[object Object]' ? s : undefined;
  }
  if (typeof institutionId === 'object' && institutionId !== null && '_id' in institutionId) {
    const id = (institutionId as { _id?: unknown })._id;
    if (id == null) return undefined;
    return String(id);
  }
  return undefined;
}
