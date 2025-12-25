import redis from 'redis';
import logger from './logger.js';

let redisClient = null;
let isConnecting = false;
let connectionAttempted = false;
let lastErrorLog = 0;
const ERROR_LOG_THROTTLE_MS = 5000; // Only log errors once every 5 seconds

const connectRedis = async () => {
  // Prevent multiple simultaneous connection attempts
  if (isConnecting) {
    logger.debug('Redis connection already in progress, skipping...');
    return redisClient;
  }

  // If connection was already attempted and failed, don't retry automatically
  if (connectionAttempted && !redisClient) {
    logger.debug('Redis connection previously failed, skipping automatic retry');
    return null;
  }

  try {
    if (!process.env.REDIS_URL) {
      logger.info('ℹ️  Redis URL not provided, Redis features will be disabled');
      return null;
    }

    isConnecting = true;
    connectionAttempted = true;

    redisClient = redis.createClient({
      url: process.env.REDIS_URL,
      socket: {
        reconnectStrategy: false, // Disable automatic reconnection to prevent spam
        connectTimeout: 5000,
      }
    });

    // Throttle error logging to prevent spam
    let lastErrorTime = 0;
    redisClient.on('error', (err) => {
      const now = Date.now();
      if (now - lastErrorTime > ERROR_LOG_THROTTLE_MS) {
        if (err.code === 'ECONNREFUSED') {
          logger.warn('⚠️  Redis not available (connection refused) - leaderboards will use MongoDB fallback');
        } else {
          logger.warn('⚠️  Redis Client Error:', err.code || err.message);
        }
        lastErrorTime = now;
      }
      // Set client to null on error so we know it's disconnected
      if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
        redisClient = null;
      }
    });

    redisClient.on('connect', () => {
      logger.info('✅ Redis Connected');
      isConnecting = false;
    });

    redisClient.on('ready', () => {
      logger.info('✅ Redis Ready');
      isConnecting = false;
    });

    redisClient.on('end', () => {
      logger.debug('Redis connection ended');
      redisClient = null;
      isConnecting = false;
    });

    // Set connection timeout
    const connectPromise = redisClient.connect();
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Redis connection timeout')), 5000);
    });

    await Promise.race([connectPromise, timeoutPromise]);
    return redisClient;
  } catch (error) {
    isConnecting = false;
    redisClient = null;
    
    // Only log if not a connection refused (which is expected if Redis isn't running)
    if (error.code === 'ECONNREFUSED' || error.message?.includes('timeout')) {
      logger.warn('⚠️  Redis not available, leaderboards will use MongoDB fallback (this is OK)');
    } else {
      logger.warn('⚠️  Redis connection failed, leaderboards will use MongoDB fallback:', error.message);
    }
    return null;
  }
};

export const getRedisClient = () => redisClient;

export default connectRedis;
