/**
 * Redis config — supports:
 * 1) Upstash REST (UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN) — preferred for Kavach/Upstash
 * 2) Classic TCP (REDIS_URL) — local redis or Upstash rediss://
 *
 * Exposes a small node-redis-compatible surface used by cache/leaderboard/email/health.
 */

import { Redis as UpstashRedis } from '@upstash/redis';
import redis from 'redis';
import logger from './logger.js';

let redisClient = null;
let isConnecting = false;
let connectionAttempted = false;
const ERROR_LOG_THROTTLE_MS = 5000;

/**
 * Adapter: @upstash/redis → methods our services already call.
 */
function createUpstashAdapter(upstash) {
  return {
    isReady: true,
    async ping() {
      const pong = await upstash.ping();
      return pong ?? 'PONG';
    },
    async get(key) {
      const v = await upstash.get(key);
      if (v === null || v === undefined) return null;
      return typeof v === 'string' ? v : JSON.stringify(v);
    },
    async setEx(key, ttlSeconds, value) {
      return upstash.set(key, value, { ex: ttlSeconds });
    },
    async del(...keys) {
      const flat = keys.flat();
      if (flat.length === 0) return 0;
      return upstash.del(...flat);
    },
    async keys(pattern) {
      return upstash.keys(pattern);
    },
    async exists(key) {
      return upstash.exists(key);
    },
    async incr(key) {
      return upstash.incr(key);
    },
    async expire(key, seconds) {
      return upstash.expire(key, seconds);
    },
    /**
     * node-redis: zAdd(key, { score, value } | Array)
     * Upstash: zadd(key, { score, member }, ...)
     */
    async zAdd(key, members) {
      const list = Array.isArray(members) ? members : [members];
      if (list.length === 0) return 0;
      const payload = list.map((m) => ({
        score: Number(m.score),
        member: String(m.value ?? m.member),
      }));
      return upstash.zadd(key, ...payload);
    },
    /**
     * node-redis: zRangeWithScores(key, start, stop, { REV })
     * returns [{ value, score }, ...]
     */
    async zRangeWithScores(key, start, stop, options = {}) {
      const rev = Boolean(options.REV || options.rev);
      const rows = await upstash.zrange(key, start, stop, {
        rev,
        withScores: true,
      });
      // Upstash may return [{ member, score }] or flat [member, score, ...]
      if (!rows || rows.length === 0) return [];
      if (typeof rows[0] === 'object' && rows[0] !== null && 'score' in rows[0]) {
        return rows.map((r) => ({
          value: String(r.member ?? r.value),
          score: Number(r.score),
        }));
      }
      const out = [];
      for (let i = 0; i < rows.length; i += 2) {
        out.push({ value: String(rows[i]), score: Number(rows[i + 1]) });
      }
      return out;
    },
  };
}

const connectRedis = async () => {
  if (isConnecting) {
    logger.debug('Redis connection already in progress, skipping...');
    return redisClient;
  }

  if (connectionAttempted && !redisClient) {
    logger.debug('Redis connection previously failed, skipping automatic retry');
    return null;
  }

  const restUrl = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const restToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

  // --- Path A: Upstash REST (what you get from Upstash "REST" tab) ---
  if (restUrl && restToken) {
    isConnecting = true;
    connectionAttempted = true;
    try {
      const upstash = new UpstashRedis({ url: restUrl, token: restToken });
      await upstash.ping();
      redisClient = createUpstashAdapter(upstash);
      logger.info('✅ Redis Connected (Upstash REST)');
      logger.info('✅ Redis Ready');
      isConnecting = false;
      return redisClient;
    } catch (error) {
      isConnecting = false;
      redisClient = null;
      logger.warn(
        '⚠️  Upstash REST Redis failed, leaderboards will use MongoDB fallback:',
        error.message
      );
      return null;
    }
  }

  // --- Path B: TCP REDIS_URL (local or Upstash rediss://) ---
  try {
    if (!process.env.REDIS_URL) {
      logger.info('ℹ️  Redis not configured (set UPSTASH_REDIS_REST_* or REDIS_URL)');
      return null;
    }

    // Skip obvious local placeholder when we expect cloud Redis elsewhere
    const url = process.env.REDIS_URL.trim();
    isConnecting = true;
    connectionAttempted = true;

    redisClient = redis.createClient({
      url,
      socket: {
        reconnectStrategy: false,
        connectTimeout: 8000,
      },
    });

    let lastErrorTime = 0;
    redisClient.on('error', (err) => {
      const now = Date.now();
      if (now - lastErrorTime > ERROR_LOG_THROTTLE_MS) {
        if (err.code === 'ECONNREFUSED') {
          logger.warn(
            '⚠️  Redis not available (connection refused) - leaderboards will use MongoDB fallback'
          );
        } else {
          logger.warn('⚠️  Redis Client Error:', err.code || err.message);
        }
        lastErrorTime = now;
      }
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

    const connectPromise = redisClient.connect();
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Redis connection timeout')), 8000);
    });

    await Promise.race([connectPromise, timeoutPromise]);
    return redisClient;
  } catch (error) {
    isConnecting = false;
    redisClient = null;

    if (error.code === 'ECONNREFUSED' || error.message?.includes('timeout')) {
      logger.warn('⚠️  Redis not available, leaderboards will use MongoDB fallback (this is OK)');
    } else {
      logger.warn(
        '⚠️  Redis connection failed, leaderboards will use MongoDB fallback:',
        error.message
      );
    }
    return null;
  }
};

export const getRedisClient = () => redisClient;

export default connectRedis;
