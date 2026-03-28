/**
 * Phase 3.5.2: Enhanced Conflict Resolution Service
 * Provides multiple conflict resolution strategies
 */

import logger from '../config/logger.js';

/**
 * Conflict resolution strategies
 */
export const RESOLUTION_STRATEGIES = {
  SERVER_WINS: 'server-wins',
  CLIENT_WINS: 'client-wins',
  LAST_WRITE_WINS: 'last-write-wins',
  MERGE: 'merge',
  MANUAL: 'manual',
  AUTO_MERGE: 'auto-merge'
};

/**
 * Detect conflict between server and client data
 * @param {Object} serverData - Data from server
 * @param {Object} clientData - Data from client
 * @param {string} dataType - Type of data
 * @returns {Object} Conflict information
 */
export const detectConflict = (serverData, clientData, dataType) => {
  if (!serverData && !clientData) {
    return { hasConflict: false };
  }

  if (!serverData) {
    return { hasConflict: false }; // No conflict, client has new data
  }

  if (!clientData) {
    return { hasConflict: false }; // No conflict, server has data
  }

  // Compare timestamps if available
  const serverTimestamp = serverData.updatedAt || serverData.syncedAt || serverData.completedAt || serverData.createdAt;
  const clientTimestamp = clientData.updatedAt || clientData.syncedAt || clientData.completedAt || clientData.createdAt;

  // Compare version if available
  const serverVersion = serverData.version || serverData.syncVersion;
  const clientVersion = clientData.version || clientData.syncVersion;

  // Type-specific conflict detection
  switch (dataType) {
    case 'quiz':
      return detectQuizConflict(serverData, clientData, serverTimestamp, clientTimestamp);
    case 'drill':
      return detectDrillConflict(serverData, clientData, serverTimestamp, clientTimestamp);
    case 'game':
      return detectGameConflict(serverData, clientData, serverTimestamp, clientTimestamp);
    default:
      return detectGenericConflict(serverData, clientData, serverTimestamp, clientTimestamp, serverVersion, clientVersion);
  }
};

/**
 * Detect quiz result conflict
 */
const detectQuizConflict = (serverData, clientData, serverTs, clientTs) => {
  // Check if same quiz result (same userId + moduleId + completedAt)
  const isSameQuiz = 
    serverData.userId?.toString() === clientData.userId?.toString() &&
    serverData.moduleId?.toString() === clientData.moduleId?.toString() &&
    Math.abs(new Date(serverData.completedAt) - new Date(clientData.completedAt)) < 60000; // Same minute

  if (!isSameQuiz) {
    return { hasConflict: false }; // Different quizzes, no conflict
  }

  // Same quiz, check if scores differ significantly
  const scoreDiff = Math.abs((serverData.score || 0) - (clientData.score || 0));
  
  if (scoreDiff > 5) {
    return {
      hasConflict: true,
      type: 'score_mismatch',
      message: `Quiz scores differ: server=${serverData.score}, client=${clientData.score}`,
      serverData,
      clientData,
      recommendedStrategy: RESOLUTION_STRATEGIES.LAST_WRITE_WINS
    };
  }

  // Minor differences, auto-merge possible
  return {
    hasConflict: true,
    type: 'minor_differences',
    message: 'Quiz results differ slightly',
    serverData,
    clientData,
    recommendedStrategy: RESOLUTION_STRATEGIES.AUTO_MERGE
  };
};

/**
 * Detect drill log conflict
 */
const detectDrillConflict = (serverData, clientData, serverTs, clientTs) => {
  // Check if same drill participation
  const isSameDrill = 
    serverData.userId?.toString() === clientData.userId?.toString() &&
    serverData.drillId?.toString() === clientData.drillId?.toString();

  if (!isSameDrill) {
    return { hasConflict: false };
  }

  // Compare evacuation times if available
  const serverTime = serverData.evacuationTime || 0;
  const clientTime = clientData.evacuationTime || 0;
  const timeDiff = Math.abs(serverTime - clientTime);

  if (timeDiff > 10) { // More than 10 seconds difference
    return {
      hasConflict: true,
      type: 'time_mismatch',
      message: `Evacuation times differ significantly: server=${serverTime}s, client=${clientTime}s`,
      serverData,
      clientData,
      recommendedStrategy: RESOLUTION_STRATEGIES.LAST_WRITE_WINS
    };
  }

  return {
    hasConflict: true,
    type: 'minor_differences',
    message: 'Drill logs differ slightly',
    serverData,
    clientData,
    recommendedStrategy: RESOLUTION_STRATEGIES.AUTO_MERGE
  };
};

/**
 * Detect game score conflict
 */
const detectGameConflict = (serverData, clientData, serverTs, clientTs) => {
  const isSameGame = 
    serverData.userId?.toString() === clientData.userId?.toString() &&
    serverData.gameType === clientData.gameType &&
    serverData.completedAt &&
    clientData.completedAt &&
    Math.abs(new Date(serverData.completedAt) - new Date(clientData.completedAt)) < 60000;

  if (!isSameGame) {
    return { hasConflict: false };
  }

  const scoreDiff = Math.abs((serverData.score || 0) - (clientData.score || 0));
  
  if (scoreDiff > 100) {
    return {
      hasConflict: true,
      type: 'score_mismatch',
      message: `Game scores differ significantly: server=${serverData.score}, client=${clientData.score}`,
      serverData,
      clientData,
      recommendedStrategy: RESOLUTION_STRATEGIES.LAST_WRITE_WINS
    };
  }

  return {
    hasConflict: true,
    type: 'minor_differences',
    message: 'Game scores differ slightly',
    serverData,
    clientData,
    recommendedStrategy: RESOLUTION_STRATEGIES.AUTO_MERGE
  };
};

/**
 * Detect generic conflict
 */
const detectGenericConflict = (serverData, clientData, serverTs, clientTs, serverVer, clientVer) => {
  // If versions exist, compare them
  if (serverVer && clientVer && serverVer !== clientVer) {
    const serverVersionNum = parseFloat(serverVer) || 0;
    const clientVersionNum = parseFloat(clientVer) || 0;

    if (serverVersionNum > clientVersionNum) {
      return {
        hasConflict: true,
        type: 'version_conflict',
        message: `Server has newer version: ${serverVer} vs ${clientVer}`,
        serverData,
        clientData,
        recommendedStrategy: RESOLUTION_STRATEGIES.SERVER_WINS
      };
    } else if (clientVersionNum > serverVersionNum) {
      return {
        hasConflict: true,
        type: 'version_conflict',
        message: `Client has newer version: ${clientVer} vs ${serverVer}`,
        serverData,
        clientData,
        recommendedStrategy: RESOLUTION_STRATEGIES.CLIENT_WINS
      };
    }
  }

  // Compare timestamps
  if (serverTs && clientTs) {
    const serverTime = new Date(serverTs).getTime();
    const clientTime = new Date(clientTs).getTime();
    const timeDiff = Math.abs(serverTime - clientTime);

    // If timestamps differ by more than 1 second, consider it a conflict
    if (timeDiff > 1000) {
      return {
        hasConflict: true,
        type: 'timestamp_conflict',
        message: `Timestamps differ: server=${serverTs}, client=${clientTs}`,
        serverData,
        clientData,
        recommendedStrategy: serverTime > clientTime 
          ? RESOLUTION_STRATEGIES.SERVER_WINS 
          : RESOLUTION_STRATEGIES.CLIENT_WINS
      };
    }
  }

  // No clear conflict, but data differs
  return {
    hasConflict: true,
    type: 'data_difference',
    message: 'Data differs between server and client',
    serverData,
    clientData,
    recommendedStrategy: RESOLUTION_STRATEGIES.LAST_WRITE_WINS
  };
};

/**
 * Resolve conflict using specified strategy
 * @param {Object} conflict - Conflict information
 * @param {string} strategy - Resolution strategy
 * @param {Object} options - Additional options
 * @returns {Object} Resolved data
 */
export const resolveConflict = (conflict, strategy, options = {}) => {
  const { serverData, clientData } = conflict;

  switch (strategy) {
    case RESOLUTION_STRATEGIES.SERVER_WINS:
      return {
        resolved: true,
        data: serverData,
        strategy: strategy,
        message: 'Using server data'
      };

    case RESOLUTION_STRATEGIES.CLIENT_WINS:
      return {
        resolved: true,
        data: clientData,
        strategy: strategy,
        message: 'Using client data'
      };

    case RESOLUTION_STRATEGIES.LAST_WRITE_WINS:
      const serverTime = new Date(serverData.updatedAt || serverData.syncedAt || serverData.completedAt || serverData.createdAt).getTime();
      const clientTime = new Date(clientData.updatedAt || clientData.syncedAt || clientData.completedAt || clientData.createdAt).getTime();
      
      return {
        resolved: true,
        data: serverTime > clientTime ? serverData : clientData,
        strategy: strategy,
        message: `Using data from ${serverTime > clientTime ? 'server' : 'client'} (last write wins)`
      };

    case RESOLUTION_STRATEGIES.AUTO_MERGE:
      return autoMerge(serverData, clientData, conflict.type);

    case RESOLUTION_STRATEGIES.MERGE:
      // Manual merge with provided data
      return {
        resolved: true,
        data: options.mergedData || { ...serverData, ...clientData },
        strategy: strategy,
        message: 'Using merged data'
      };

    case RESOLUTION_STRATEGIES.MANUAL:
      return {
        resolved: false,
        requiresManualResolution: true,
        serverData,
        clientData,
        message: 'Requires manual resolution'
      };

    default:
      // Default: use recommended strategy from conflict detection
      const recommendedStrategy = conflict.recommendedStrategy || RESOLUTION_STRATEGIES.LAST_WRITE_WINS;
      logger.warn(`Unknown resolution strategy: ${strategy}, using ${recommendedStrategy}`);
      return resolveConflict(conflict, recommendedStrategy, options);
  }
};

/**
 * Auto-merge compatible data
 */
const autoMerge = (serverData, clientData, conflictType) => {
  const merged = { ...serverData };

  // Merge arrays (for answers, items, etc.)
  if (Array.isArray(serverData.answers) && Array.isArray(clientData.answers)) {
    merged.answers = [...serverData.answers, ...clientData.answers].filter((v, i, a) => 
      a.findIndex(t => JSON.stringify(t) === JSON.stringify(v)) === i
    );
  }

  // Use higher score if applicable
  if (typeof serverData.score === 'number' && typeof clientData.score === 'number') {
    merged.score = Math.max(serverData.score, clientData.score);
  }

  // Use longer time if applicable (for evacuation times, etc.)
  if (typeof serverData.timeTaken === 'number' && typeof clientData.timeTaken === 'number') {
    merged.timeTaken = Math.max(serverData.timeTaken, clientData.timeTaken);
  }

  // Merge metadata
  if (serverData.metadata || clientData.metadata) {
    merged.metadata = {
      ...(serverData.metadata || {}),
      ...(clientData.metadata || {})
    };
  }

  // Use latest timestamp
  const serverTs = new Date(serverData.updatedAt || serverData.syncedAt || serverData.completedAt || serverData.createdAt).getTime();
  const clientTs = new Date(clientData.updatedAt || clientData.syncedAt || clientData.completedAt || clientData.createdAt).getTime();
  
  if (clientTs > serverTs) {
    merged.updatedAt = clientData.updatedAt || clientData.syncedAt || clientData.completedAt;
  }

  return {
    resolved: true,
    data: merged,
    strategy: RESOLUTION_STRATEGIES.AUTO_MERGE,
    message: 'Auto-merged compatible data'
  };
};

/**
 * Get default resolution strategy for data type
 * @param {string} dataType - Type of data
 * @returns {string} Default strategy
 */
export const getDefaultStrategy = (dataType) => {
  const defaults = {
    'quiz': RESOLUTION_STRATEGIES.LAST_WRITE_WINS,
    'drill': RESOLUTION_STRATEGIES.LAST_WRITE_WINS,
    'game': RESOLUTION_STRATEGIES.LAST_WRITE_WINS,
    'module': RESOLUTION_STRATEGIES.SERVER_WINS, // Modules are server-managed
  };

  return defaults[dataType] || RESOLUTION_STRATEGIES.LAST_WRITE_WINS;
};

