/**
 * WB9 shared honesty copy helpers
 */

export const NO_ALERTS_REPORTED = 'No alerts reported';
export const NO_ALERTS_NOT_ALL_CLEAR =
  'Empty list only — not an all-clear or normal safety claim';

export const PASTE_ONLY_QR_HINT =
  'Paste-only on web. A camera scanner is not implemented here.';

export const WD06_QR_REVOKE_DISCLAIMER =
  'Generating a new QR updates the server hash, but older printouts are not claimed rejected until server token checks are enforced.';

export function marketingAltAvoidsInventedSafetyScore(alt: string): boolean {
  return !/safety score/i.test(alt);
}
