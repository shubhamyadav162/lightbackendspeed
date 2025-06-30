import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL;

// Default TTL can be overridden via env — falls back to 60 s if undefined/invalid
const DEFAULT_TTL = (() => {
  const envTtl = parseInt(process.env.REDIS_TTL_SECS || '', 10);
  return Number.isFinite(envTtl) && envTtl > 0 ? envTtl : 60;
})();

// Lazy-init singleton
let client: Redis | null = null;

export function getRedis(): Redis | null {
  if (!redisUrl) return null;
  if (!client) {
    client = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      enableAutoPipelining: true,
    });
  }
  return client;
}

export async function getCached<T>(key: string): Promise<T | null> {
  const redis = getRedis();
  if (!redis) return null;
  const cached = await redis.get(key);
  return cached ? (JSON.parse(cached) as T) : null;
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
  await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
} 