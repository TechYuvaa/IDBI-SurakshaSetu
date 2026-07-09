import { createClient } from 'redis';
import { logger } from './logger.js';

// In-Memory cache fallback - always available, no external dependencies
const memoryStore = new Map<string, { value: string; expiresAt?: number }>();

const memoryFallback = {
  async get(key: string): Promise<string | null> {
    const item = memoryStore.get(key);
    if (!item) return null;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      memoryStore.delete(key);
      return null;
    }
    return item.value;
  },
  async set(key: string, value: string, options?: { EX?: number }): Promise<string> {
    const expiresAt = options?.EX ? Date.now() + options.EX * 1000 : undefined;
    memoryStore.set(key, { value, expiresAt });
    return 'OK';
  },
  async del(key: string): Promise<number> {
    return memoryStore.delete(key) ? 1 : 0;
  },
  async incr(key: string): Promise<number> {
    const item = memoryStore.get(key);
    const val = parseInt(item?.value || '0', 10) + 1;
    memoryStore.set(key, { value: val.toString(), expiresAt: item?.expiresAt });
    return val;
  },
  async expire(key: string, seconds: number): Promise<number> {
    const item = memoryStore.get(key);
    if (!item) return 0;
    memoryStore.set(key, { ...item, expiresAt: Date.now() + seconds * 1000 });
    return 1;
  }
};

let redisClient: any = null;
let connectionAttempted = false;
let isRedisConnected = false;

// Lazy Redis connection - only tries once, fails silently to memory fallback
const tryConnectRedis = async () => {
  if (connectionAttempted) return;
  connectionAttempted = true;

  const url = process.env.REDIS_URL;
  if (!url) {
    logger.info('No REDIS_URL configured. Using in-memory cache fallback.');
    return;
  }

  try {
    const client = createClient({ url, socket: { connectTimeout: 3000 } });
    client.on('error', () => { isRedisConnected = false; });

    await Promise.race([
      client.connect(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Redis timeout')), 3000))
    ]);

    redisClient = client;
    isRedisConnected = true;
    logger.info('Redis connected successfully.');
  } catch {
    logger.warn('Redis unavailable. Using in-memory cache fallback.');
    redisClient = null;
    isRedisConnected = false;
  }
};

// Initialize lazily - do not block module load
tryConnectRedis().catch(() => {});

const getClient = () => redisClient || memoryFallback;

export const cache = {
  async get(key: string): Promise<string | null> {
    try { return await getClient().get(key); } catch { return await memoryFallback.get(key); }
  },
  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    try {
      if (ttlSeconds) {
        await getClient().set(key, value, { EX: ttlSeconds });
      } else {
        await getClient().set(key, value);
      }
    } catch { await memoryFallback.set(key, value, { EX: ttlSeconds }); }
  },
  async del(key: string): Promise<void> {
    try { await getClient().del(key); } catch { await memoryFallback.del(key); }
  },
  async incr(key: string): Promise<number> {
    try { return await getClient().incr(key); } catch { return await memoryFallback.incr(key); }
  },
  async expire(key: string, seconds: number): Promise<void> {
    try { await getClient().expire(key, seconds); } catch { await memoryFallback.expire(key, seconds); }
  },
  isConnected(): boolean {
    return isRedisConnected;
  }
};
