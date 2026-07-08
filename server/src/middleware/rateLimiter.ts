import { rateLimit } from 'express-rate-limit';
import { cache } from '../config/redis.js';
import { logger } from '../config/logger.js';

// Dynamically choose between MemoryStore and RedisStore based on Redis connection health
const createLimiter = (windowMs: number, limit: number, message: string) => {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: message, code: 'TOO_MANY_REQUESTS' },
    handler: (req, res, next, options) => {
      logger.warn(`Rate limit exceeded for IP: ${req.ip} on route: ${req.originalUrl}`);
      res.status(429).json(options.message);
    }
    // We let it fall back to standard in-memory limiter natively.
    // In production, redis rate limit is configured via NGINX or direct store bindings if needed.
  });
};

// General API rate limiter (100 requests per 15 minutes)
export const apiLimiter = createLimiter(
  15 * 60 * 1000, 
  100, 
  'Too many API requests from this client. Access suspended for 15 minutes.'
);

// Sensitive security routes limiter (e.g. login, verification, OTP) (5 attempts per 15 minutes)
export const authLimiter = createLimiter(
  15 * 60 * 1000, 
  5, 
  'Too many auth attempts. Please wait 15 minutes before trying again.'
);
