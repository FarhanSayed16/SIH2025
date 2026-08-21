/**
 * Gate IoT write endpoints when IOT_ENABLED is not true.
 */

import { isIotEnabled } from '../config/features.js';
import { errorResponse } from '../utils/response.js';

/**
 * Reject IoT ingest (telemetry / device alerts / mesh sync) when disabled.
 * Returns 503 so devices and clients can back off cleanly.
 */
export const requireIotEnabled = (req, res, next) => {
  if (isIotEnabled()) return next();

  return errorResponse(
    res,
    'IoT is disabled on this server (IOT_ENABLED=false). Set IOT_ENABLED=true in backend/.env and restart when sensors are ready.',
    503,
    { code: 'IOT_DISABLED', iotEnabled: false }
  );
};

export default requireIotEnabled;
