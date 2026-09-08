import mongoose from 'mongoose';
import Alert from '../models/Alert.js';
import User from '../models/User.js';
import { canAccessInstitution, referenceId, isStaff } from '../utils/access.js';
import { errorResponse } from '../utils/response.js';

// Shared by both legacy and current alert routes, before any reads or mutations.
export const authorizeAlert = async (req, res, next, id) => {
  try {
    if (!mongoose.isObjectIdOrHexString(id)) return errorResponse(res, 'Invalid alert ID', 400);
    const alert = await Alert.findById(id);
    if (!alert) return errorResponse(res, 'Alert not found', 404);
    if (!canAccessInstitution(req.user, alert.institutionId)) {
      return errorResponse(res, 'Access denied to alert', 403);
    }
    const targetId = req.body?.userId;
    if (targetId && referenceId(targetId) !== req.userId.toString()) {
      if (!isStaff(req.user)) return errorResponse(res, 'Cannot update another user', 403);
      if (!mongoose.isObjectIdOrHexString(targetId)) return errorResponse(res, 'Invalid user ID', 400);
      const target = await User.findById(targetId).select('institutionId');
      if (!target || referenceId(target.institutionId) !== referenceId(alert.institutionId)) {
        return errorResponse(res, 'User must belong to alert institution', 403);
      }
    }
    req.alert = alert;
    next();
  } catch (error) {
    next(error);
  }
};
