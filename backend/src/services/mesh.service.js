import crypto from 'crypto';
import mongoose from 'mongoose';
import Alert from '../models/Alert.js';
import User from '../models/User.js';
import { referenceId, canAccessInstitution, isStaff } from '../utils/access.js';
import School from '../models/School.js';
import logger from '../config/logger.js';

/**
 * Phase 5.3: Mesh Networking Service
 * Handles mesh key management and message sync with deduplication
 */

// In-memory cache for mesh keys (school-level shared keys)
// In production, consider using Redis for distributed caching
const meshKeyCache = new Map();

/**
 * Get or generate mesh key for a school
 * Uses school-level shared key (rotated periodically)
 */
export const getMeshKey = async (schoolId, { includeExpiry = false } = {}) => {
  const now = new Date();
  let cached = meshKeyCache.get(schoolId);
  if (!cached || cached.expiresAt <= now.getTime()) {
    // Only one caller can replace an expired key. Concurrent callers then read
    // the winner's key instead of provisioning incompatible keys for one school.
    let school = await School.findOneAndUpdate({
      _id: schoolId,
      $or: [{ meshKey: null }, { meshKeyExpiresAt: null }, { meshKeyExpiresAt: { $lte: now } }],
    }, { $set: {
      meshKey: crypto.randomBytes(64).toString('base64'),
      meshKeyExpiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
    } }, { new: true }).select('+meshKey +meshKeyExpiresAt');
    if (!school) school = await School.findById(schoolId).select('+meshKey +meshKeyExpiresAt');
    if (!school) throw new Error('School not found');
    cached = {
      key: school.meshKey,
      keyExpiresAt: new Date(school.meshKeyExpiresAt),
      expiresAt: Math.min(now.getTime() + 60 * 60 * 1000, new Date(school.meshKeyExpiresAt).getTime()),
    };
    meshKeyCache.set(schoolId, cached);
  }
  return includeExpiry ? { key: cached.key, expiresAt: cached.keyExpiresAt } : cached.key;
};

/**
 * Rotate mesh key for a school (force new key generation)
 */
export const rotateMeshKey = async (schoolId) => {
  try {
    const school = await School.findById(schoolId).select('+meshKey +meshKeyExpiresAt');
    if (!school) {
      throw new Error('School not found');
    }

    // Generate new key
    const newKey = crypto.randomBytes(64).toString('base64');
    
    // Store in school document
    school.meshKey = newKey;
    school.meshKeyExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await school.save();

    // Clear cache
    meshKeyCache.delete(schoolId);

    logger.info(`Rotated mesh key for school ${schoolId}`);
    return newKey;
  } catch (error) {
    logger.error(`Error rotating mesh key for school ${schoolId}:`, error);
    throw error;
  }
};

/**
 * Deduplicate messages by msgId
 * Returns array of unique messages (removes duplicates)
 */
export const deduplicateMessages = (messages) => {
  const seen = new Set();
  const unique = [];

  for (const msg of messages) {
    const msgId = msg.msgId || msg.id;
    if (msgId && !seen.has(msgId)) {
      seen.add(msgId);
      unique.push(msg);
    }
  }

  return unique;
};

/**
 * Sync mesh messages from offline queue
 * Processes messages, deduplicates, and returns sync results
 */
export const syncMeshMessages = async (userId, messages, schoolId) => {
  const results = { synced: 0, duplicates: 0, failed: 0, acknowledgedIds: [], errors: [] };
  if (!Array.isArray(messages)) throw new Error('Messages must be an array');
  const actor = await User.findById(userId);
  if (!actor || !canAccessInstitution(actor, schoolId)) throw new Error('School access denied');
  const acknowledged = new Set();

  for (const msg of messages) {
    const msgId = msg?.msgId;
    try {
      if (typeof msgId !== 'string' || !msgId || msgId.length > 200) throw new Error('Invalid message ID');
      if (acknowledged.has(msgId)) { results.duplicates++; continue; }
      if (referenceId(msg.schoolId) !== referenceId(schoolId)) throw new Error('Message school mismatch');
      // A shared school key cannot prove an individual sender's identity. Only
      // the authenticated user's status (or authorized staff action) is accepted.
      // Other event types stay queued until a durable handler is implemented.
      if (msg.type !== 'USER_STATUS_UPDATE') throw new Error('Unsupported mesh sync message type');
      if (msg.encrypted) throw new Error('Encrypted sync payload is not supported');
      const payload = msg.payload || {};
      const targetId = payload.userId || userId;
      if (!mongoose.isObjectIdOrHexString(targetId) || !mongoose.isObjectIdOrHexString(payload.alertId)) {
        throw new Error('Invalid user or alert ID');
      }
      if (referenceId(targetId) !== referenceId(userId)) {
        if (!isStaff(actor)) throw new Error('Cannot update another user');
        const target = await User.findById(targetId);
        if (!target || referenceId(target.institutionId) !== referenceId(schoolId)) throw new Error('User school mismatch');
      }
      if (!['safe', 'help', 'missing', 'at_risk', 'potentially_trapped'].includes(payload.status)) {
        throw new Error('Invalid status');
      }
      if (!Number.isSafeInteger(msg.timestamp) || msg.timestamp <= 0 || msg.timestamp > Date.now()) {
        throw new Error('Invalid message timestamp');
      }
      const timestamp = new Date(msg.timestamp);
      const targetObjectId = new mongoose.Types.ObjectId(referenceId(targetId));
      const entry = { userId: targetObjectId, status: payload.status, lastUpdate: timestamp };
      // One atomic update makes replay and concurrent delivery safe. Older
      // offline statuses cannot overwrite newer online or offline statuses.
      const alert = await Alert.findOneAndUpdate({
        _id: payload.alertId,
        institutionId: schoolId,
        createdAt: { $lte: timestamp },
      }, [{ $set: { studentStatus: {
        $let: { vars: { statuses: { $ifNull: ['$studentStatus', []] } }, in: {
          $cond: [
            { $in: [targetObjectId, '$$statuses.userId'] },
            { $map: { input: '$$statuses', as: 'entry', in: {
              $cond: [
                { $and: [ { $eq: ['$$entry.userId', targetObjectId] }, { $lt: ['$$entry.lastUpdate', timestamp] } ] },
                { $mergeObjects: ['$$entry', { $literal: entry }] },
                '$$entry',
              ],
            } } },
            { $concatArrays: ['$$statuses', { $literal: [entry] }] },
          ],
        } },
      } } }], { new: true });
      if (!alert) throw new Error('Alert not found in school or message predates alert');
      acknowledged.add(msgId);
      results.acknowledgedIds.push(msgId);
      results.synced++;
    } catch (error) {
      results.failed++;
      results.errors.push({ msgId: msgId ?? null, error: error.message });
    }
  }
  return results;
};
