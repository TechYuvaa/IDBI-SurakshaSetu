import { createClient } from 'redis';
import { logger } from './logger.js';

let redisClient: any = null;
let isRedisConnected = false;

// In-Memory cache fallback implementation
const memoryFallback = {
  store: new Map<string, string>(),
  async get(key: string) {
    return this.store.get(key) || null;
  },
  async set(key: string, value: string, options?: { EX?: number }) {
    this.store.set(key, value);
    if (options?.EX) {
      setTimeout(() => this.store.delete(key), options.EX * 1000);
    }
    return 'OK';
  },
  async del(key: string) {
    return this.store.delete(key) ? 1 : 0;
  },
  async incr(key: string) {
    const val = parseInt(this.store.get(key) || '0', 10) + 1;
    this.store.set(key, val.toString());
    return val;
  },
  async expire(key: string, seconds: number) {
    if (this.store.has(key)) {
      setTimeout(() => this.store.delete(key), seconds * 1000);
      return 1;
    }
    return 0;
  }
};

const connectRedis = async () => {
  const url = process.env.REDIS_URL || 'redis://localhost:6379';
  const client = createClient({ url });

  client.on('error', (err) => {
    logger.warn(`Redis connection failed or error: ${err.message}. Using in-memory fallback.`);
    isRedisConnected = false;
  });

  try {
    await client.connect();
    logger.info('Connected to Redis server successfully.');
    redisClient = client;
    isRedisConnected = true;
  } catch (err) {
    logger.warn('Failed to establish Redis connection. Falling back to local memory storage.');
    redisClient = memoryFallback;
    isRedisConnected = false;
  }
};

// Initialize connection
connectRedis();

export const cache = {
  async get(key: string): Promise<string | null> {
    if (!redisClient) return memoryFallback.get(key);
    try {
      return await redisClient.get(key);
    } catch (e) {
      return memoryFallback.get(key);
    }
  },
  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (!redisClient) {
      await memoryFallback.set(key, value, { EX: ttlSeconds });
      return;
    }
    try {
      if (ttlSeconds) {
        await redisClient.set(key, value, { EX: ttlSeconds });
      } else {
        await redisClient.set(key, value);
      }
    } catch (e) {
      await memoryFallback.set(key, value, { EX: ttlSeconds });
    }
  },
  async del(key: string): Promise<void> {
    if (!redisClient) {
      await memoryFallback.del(key);
      return;
    }
    try {
      await redisClient.del(key);
    } catch (e) {
      await memoryFallback.del(key);
    }
  },
  async incr(key: string): Promise<number> {
    if (!redisClient) return await memoryFallback.incr(key);
    try {
      return await redisClient.incr(key);
    } catch (e) {
      return await memoryFallback.incr(key);
    }
  },
  async expire(key: string, seconds: number): Promise<void> {
    if (!redisClient) {
      await memoryFallback.expire(key, seconds);
      return;
    }
    try {
      await redisClient.expire(key, seconds);
    } catch (e) {
      await memoryFallback.expire(key, seconds);
    }
  },
  isConnected(): boolean {
    return isRedisConnected;
  }
};
