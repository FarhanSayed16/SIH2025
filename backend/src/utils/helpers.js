/**
 * General helper functions
 */

/**
 * Generate random string
 * @param {number} length - Length of string
 * @returns {string}
 */
export const generateRandomString = (length = 10) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Generate device token
 * @returns {string}
 */
export const generateDeviceToken = () => {
  return `dev_${generateRandomString(32)}`;
};

/**
 * Calculate preparedness score
 * @param {Object} userData - User data with quiz results, drill participation
 * @returns {number} Score 0-100
 */
export const calculatePreparednessScore = (userData) => {
  let score = 0;
  let totalWeight = 0;

  // Quiz completion weight: 40%
  if (userData.quizCompletionRate !== undefined) {
    score += userData.quizCompletionRate * 0.4;
    totalWeight += 0.4;
  }

  // Drill participation weight: 30%
  if (userData.drillParticipationRate !== undefined) {
    score += userData.drillParticipationRate * 0.3;
    totalWeight += 0.3;
  }

  // Average quiz score weight: 20%
  if (userData.averageQuizScore !== undefined) {
    score += (userData.averageQuizScore / 100) * 0.2;
    totalWeight += 0.2;
  }

  // Evacuation time weight: 10%
  if (userData.avgEvacuationTime !== undefined) {
    // Lower time = better score (normalize to 0-1)
    const normalizedTime = Math.max(0, 1 - (userData.avgEvacuationTime / 300)); // 5 min = 0
    score += normalizedTime * 0.1;
    totalWeight += 0.1;
  }

  return totalWeight > 0 ? Math.round((score / totalWeight) * 100) : 0;
};

/**
 * Paginate array
 * @param {Array} array - Array to paginate
 * @param {number} page - Page number (1-indexed)
 * @param {number} limit - Items per page
 * @returns {Object} Paginated result
 */
export const paginate = (array, page = 1, limit = 10) => {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginated = array.slice(startIndex, endIndex);

  return {
    data: paginated,
    pagination: {
      page,
      limit,
      total: array.length,
      totalPages: Math.ceil(array.length / limit),
      hasNext: endIndex < array.length,
      hasPrev: page > 1
    }
  };
};

/**
 * Sanitize object (remove undefined, null values)
 * @param {Object} obj - Object to sanitize
 * @returns {Object} Sanitized object
 */
export const sanitizeObject = (obj) => {
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined && value !== null) {
      sanitized[key] = value;
    }
  }
  return sanitized;
};

