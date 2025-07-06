import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL;

// Default TTL can be overridden via env — falls back to 60 s if undefined/invalid
const DEFAULT_TTL = (() => {
  const envTtl = parseInt(process.env.REDIS_TTL_SECS || '', 10);
  return Number.isFinite(envTtl) && envTtl > 0 ? envTtl : 60;
})();

// Lazy-init singleton
let client: Redis | null = null;
let connectionAttempted = false;

export function getRedis(): Redis | null {
  // If no Redis URL or empty URL, return null immediately
  if (!redisUrl || redisUrl === 'redis://localhost:6379' || redisUrl.trim() === '') {
    if (!connectionAttempted) {
      console.log('ℹ️ Redis not configured (REDIS_URL missing or localhost) - running without cache');
      connectionAttempted = true;
    }
    return null;
  }
  
  if (!client && !connectionAttempted) {
    try {
      client = new Redis(redisUrl, {
        maxRetriesPerRequest: 1,
        enableAutoPipelining: true,
        connectTimeout: 5000,
        lazyConnect: true,
      });
      
      // Handle connection errors gracefully
      client.on('error', (err) => {
        console.warn('⚠️ Redis connection error:', err.message);
        client = null;
      });
      
      client.on('connect', () => {
        console.log('✅ Redis connected successfully');
      });
      
      connectionAttempted = true;
    } catch (error) {
      console.warn('⚠️ Redis initialization failed:', error);
      client = null;
      connectionAttempted = true;
    }
  }
  
  return client;
}

/**
 * Get a cached value from Redis.
 *
 * @param key Cache key
 * @returns The cached value or null if not found/error
 */
export async function getCached<T>(key: string): Promise<T | null> {
  const redis = getRedis();
  if (!redis) return null;
  
  try {
    const value = await redis.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.warn('⚠️ Redis get error:', error);
    return null;
  }
}

/**
 * Cache a serialisable value in Redis.
 *
 * @param key          Cache key
 * @param value        Value to serialise and store
 * @param ttlSeconds   Optional TTL — defaults to `REDIS_TTL_SECS` env or 60 s.
 */
export async function setCached<T>(key: string, value: T, ttlSeconds: number = DEFAULT_TTL): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  
  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch (error) {
    console.warn('⚠️ Redis set error:', error);
    // Gracefully continue without caching
  }
}

/**
 * Check if Redis is available
 */
export function isRedisAvailable(): boolean {
  return getRedis() !== null;
}

/**
 * Get Redis connection status
 */
export function getRedisStatus(): { available: boolean; url?: string; error?: string } {
  if (!redisUrl || redisUrl === 'redis://localhost:6379' || redisUrl.trim() === '') {
    return { available: false, error: 'REDIS_URL not configured or set to localhost' };
  }
  
  const redis = getRedis();
  return {
    available: redis !== null,
    url: redisUrl,
    error: redis ? undefined : 'Connection failed'
  };
} 