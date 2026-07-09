import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';
import { logger } from './config/logger.js';
import { helmetConfig, cspNonce, permissionsPolicy } from './middleware/security.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/authRoutes.js';
import securityRoutes from './routes/securityRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

// Load environment variables from both root and server/.env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8081;

// ─────────────────────────────────────────────
// 1. Cookie Parser (required for JWT refresh cookies)
// ─────────────────────────────────────────────
app.use(cookieParser());

// ─────────────────────────────────────────────
// 2. CSP Nonce + Security Headers
// ─────────────────────────────────────────────
app.use(cspNonce);
app.use(helmetConfig());
app.use(permissionsPolicy);

// ─────────────────────────────────────────────
// 3. CORS — allow Vercel preview + local dev
// ─────────────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // allow server-to-server
    const isVercel = origin.endsWith('.vercel.app');
    const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
    const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
    if (isVercel || isLocal || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    logger.warn(`CORS blocked origin: ${origin}`);
    return callback(new Error(`CORS: Origin ${origin} not allowed.`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-ID', 'X-Trace-ID', 'Idempotency-Key'],
}));

// ─────────────────────────────────────────────
// 4. Body Parsers (5MB limit)
// ─────────────────────────────────────────────
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// ─────────────────────────────────────────────
// 5. API Routes
// ─────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', securityRoutes);

// ─────────────────────────────────────────────
// 6. Health Check
// ─────────────────────────────────────────────
app.get('/health', async (_req, res) => {
  let dbStatus = 'UNCHECKED';
  let cacheStatus = 'UNKNOWN';

  try {
    const { prisma } = await import('./config/db.js');
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'HEALTHY';
  } catch {
    dbStatus = 'UNHEALTHY';
  }

  try {
    const { cache } = await import('./config/redis.js');
    cacheStatus = cache.isConnected() ? 'REDIS' : 'MEMORY_FALLBACK';
  } catch {
    cacheStatus = 'UNAVAILABLE';
  }

  const isHealthy = dbStatus === 'HEALTHY';
  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'UP' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    services: {
      database: dbStatus,
      cache: cacheStatus,
    },
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  });
});

// ─────────────────────────────────────────────
// 7. Centralized Error Handler (must be last)
// ─────────────────────────────────────────────
app.use(errorHandler);

// ─────────────────────────────────────────────
// 8. Seed default users (safe, lazy, non-blocking)
// ─────────────────────────────────────────────
const hashPassword = async (password: string): Promise<string> => {
  try {
    const argon2 = await import('argon2');
    return await argon2.hash(password, { type: 2 });
  } catch {
    // Fallback to PBKDF2 if argon2 native binary unavailable (Vercel)
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    return `pbkdf2$${salt}$${hash}`;
  }
};

const seedDefaultUsers = async (): Promise<void> => {
  try {
    const { prisma } = await import('./config/db.js');

    const existingCustomer = await prisma.user.count({ where: { email: 'raj.kumar@example.com' } });
    if (existingCustomer === 0) {
      const hash = await hashPassword('password123');
      await prisma.user.create({
        data: {
          email: 'raj.kumar@example.com',
          passwordHash: hash,
          role: 'CUSTOMER',
          twoFactorEnabled: true,
          twoFactorType: 'EMAIL',
          profile: {
            create: {
              fullName: 'Raj Kumar',
              location: 'Mumbai, India',
              panEncrypted: 'ABCPK1234A',
              aadhaarEncrypted: 'XXXX-XXXX-7890',
            }
          }
        }
      });
      logger.info('Seeded default customer: raj.kumar@example.com');
    }

    const existingAdmin = await prisma.user.count({ where: { email: 'admin@surakshasetu.com' } });
    if (existingAdmin === 0) {
      const hash = await hashPassword('Admin@12345');
      await prisma.user.create({
        data: {
          email: 'admin@surakshasetu.com',
          passwordHash: hash,
          role: 'ADMIN',
          twoFactorEnabled: true,
          twoFactorType: 'EMAIL',
          profile: {
            create: {
              fullName: 'System Admin',
              location: 'Bangalore, India',
              panEncrypted: 'ADMIP9999Z',
              aadhaarEncrypted: 'XXXX-XXXX-1111',
            }
          }
        }
      });
      logger.info('Seeded default admin: admin@surakshasetu.com');
    }
  } catch (err: any) {
    // Non-fatal: log and continue. The app must boot even if seed fails.
    logger.warn(`[Seed] Skipped: ${err.message}`);
  }
};

// ─────────────────────────────────────────────
// 9. Start server (local dev) OR export (Vercel)
// ─────────────────────────────────────────────
if (process.env.VERCEL !== '1') {
  app.listen(PORT, async () => {
    logger.info(`Server running on http://localhost:${PORT}`);
    await seedDefaultUsers();
  });
} else {
  // On Vercel: seed lazily after cold start, non-blocking
  setTimeout(() => {
    seedDefaultUsers().catch(err => logger.warn(`[Seed] Vercel seed failed: ${err.message}`));
  }, 2000);
}

export default app;
