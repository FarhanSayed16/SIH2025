import crypto from 'crypto';
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
export const getMeshKey = async (schoolId) => {
  try {
    // Check cache first
    const cached = meshKeyCache.get(schoolId);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.key;
    }

    // Get school document
    const school = await School.findById(schoolId);
    if (!school) {
      throw new Error('School not found');
    }

    // Check if school has existing mesh key
    let meshKey;
    if (school.meshKey && school.meshKeyExpiresAt > new Date()) {
      meshKey = school.meshKey;
    } else {
      // Generate new key (64 bytes = 512 bits)
      meshKey = crypto.randomBytes(64).toString('base64');
      
      // Store in school document (expires in 7 days)
      school.meshKey = meshKey;
      school.meshKeyExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      await school.save();
      
      logger.info(`Generated new mesh key for school ${schoolId}`);
    }

    // Cache for 1 hour
    meshKeyCache.set(schoolId, {
      key: meshKey,
      expiresAt: Date.now() + 60 * 60 * 1000, // 1 hour
    });

    return meshKey;
  } catch (error) {
    logger.error(`Error getting mesh key for school ${schoolId}:`, error);
    throw error;
  }
};

/**
 * Rotate mesh key for a school (force new key generation)
 */
export const rotateMeshKey = async (schoolId) => {
  try {
    const school = await School.findById(schoolId);
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
  try {
    if (!Array.isArray(messages) || messages.length === 0) {
      return {
        synced: 0,
        duplicates: 0,
        failed: 0,
        errors: [],
      };
    }

    // Deduplicate messages by msgId
    const uniqueMessages = deduplicateMessages(messages);
    const duplicateCount = messages.length - uniqueMessages.length;

    // Process messages
    const results = {
      synced: 0,
      duplicates: duplicateCount,
      failed: 0,
      errors: [],
    };

    // TODO: Process messages based on type
    // For now, we just deduplicate and log
    // In Phase 5.4, we'll implement relay logic and alert processing
    for (const msg of uniqueMessages) {
      try {
        // Process message based on type
        const msgType = msg.type || msg.messageType;
        
        switch (msgType) {
          case 'CRISIS_ALERT':
            // Handle crisis alert (already handled by alert pipeline in Phase 4.10)
            // Just log for now - actual processing happens via alert pipeline
            logger.info(`Mesh sync: Crisis alert ${msg.msgId} from user ${userId}`);
            results.synced++;
            break;
            
          case 'DRILL_SCHEDULED':
          case 'DRILL_START':
          case 'DRILL_END':
            // Handle drill events
            logger.info(`Mesh sync: Drill event ${msg.msgId} from user ${userId}`);
            results.synced++;
            break;
            
          case 'USER_STATUS_UPDATE':
            // Handle user status updates
            logger.info(`Mesh sync: User status update ${msg.msgId} from user ${userId}`);
            results.synced++;
            break;
            
          default:
            logger.warn(`Mesh sync: Unknown message type ${msgType} for ${msg.msgId}`);
            results.synced++; // Still count as synced
        }
      } catch (error) {
        results.failed++;
        results.errors.push({
          msgId: msg.msgId || msg.id,
          error: error.message,
        });
        logger.error(`Error processing mesh message ${msg.msgId}:`, error);
      }
    }

    logger.info(
      `Mesh sync completed for user ${userId}: ` +
      `${results.synced} synced, ${results.duplicates} duplicates, ${results.failed} failed`
    );

    return results;
  } catch (error) {
    logger.error(`Error syncing mesh messages for user ${userId}:`, error);
    throw error;
  }
};

